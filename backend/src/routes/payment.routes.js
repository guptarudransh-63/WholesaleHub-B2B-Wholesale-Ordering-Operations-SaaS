import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { RetailerProfile } from '../models/RetailerProfile.js';
import { recordCreditPayment, recalculateRetailerCredit } from '../services/creditService.js';

const router = express.Router();
router.use(protect);

// @route   GET /api/payments
// @desc    List payments for current retailer or all if admin
router.get('/', async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'retailer') {
      query.retailer = req.retailerProfile._id;
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('retailer', 'businessName contactPerson phone email')
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments
// @desc    Record a new payment and allocate to invoice(s)
router.post('/', async (req, res, next) => {
  try {
    const {
      retailerId: targetRetailerId,
      amount,
      paymentMethod,
      transactionReference,
      notes,
      allocations: customAllocations,
    } = req.body;

    const retailerId = req.user.role === 'retailer' ? req.retailerProfile._id : targetRetailerId;
    const numAmount = Number(amount);

    if (!retailerId || !numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid retailer and payment amount required.' });
    }

    if (!transactionReference) {
      return res.status(400).json({ success: false, message: 'Transaction reference or UTR is required.' });
    }

    const retailer = await RetailerProfile.findById(retailerId);
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Retailer not found.' });
    }

    // Determine invoice allocations
    let remainingToAllocate = numAmount;
    const finalAllocations = [];

    if (customAllocations && Array.isArray(customAllocations) && customAllocations.length > 0) {
      // Allocate according to explicit allocation list
      for (const alloc of customAllocations) {
        if (remainingToAllocate <= 0) break;
        const inv = await Invoice.findById(alloc.invoiceId);
        if (!inv || inv.retailer.toString() !== retailerId.toString()) continue;

        const allocAmt = Math.min(Number(alloc.amountAllocated), inv.outstandingAmount, remainingToAllocate);
        if (allocAmt > 0) {
          finalAllocations.push({
            invoice: inv._id,
            invoiceNumber: inv.invoiceNumber,
            amountAllocated: Number(allocAmt.toFixed(2)),
          });
          remainingToAllocate -= allocAmt;
        }
      }
    } else {
      // FIFO auto-allocation: oldest unpaid/partially paid invoices first
      const unpaidInvoices = await Invoice.find({
        retailer: retailerId,
        status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
      }).sort({ dueDate: 1, invoiceDate: 1 });

      for (const inv of unpaidInvoices) {
        if (remainingToAllocate <= 0) break;
        const allocAmt = Math.min(inv.outstandingAmount, remainingToAllocate);
        if (allocAmt > 0) {
          finalAllocations.push({
            invoice: inv._id,
            invoiceNumber: inv.invoiceNumber,
            amountAllocated: Number(allocAmt.toFixed(2)),
          });
          remainingToAllocate -= allocAmt;
        }
      }
    }

    // Apply allocations to invoices
    for (const alloc of finalAllocations) {
      const inv = await Invoice.findById(alloc.invoice);
      if (!inv) continue;

      const newPaid = Number(((inv.paidAmount || 0) + alloc.amountAllocated).toFixed(2));
      const newOutstanding = Math.max(0, Number(((inv.outstandingAmount || 0) - alloc.amountAllocated).toFixed(2)));

      inv.paidAmount = newPaid;
      inv.outstandingAmount = newOutstanding;
      inv.status = newOutstanding <= 0 ? 'paid' : 'partially_paid';
      await inv.save();

      // If invoice order is fully paid, update Order paymentStatus
      if (inv.order) {
        await Order.findByIdAndUpdate(inv.order, {
          paymentStatus: newOutstanding <= 0 ? 'paid' : 'partially_paid',
        });
      }
    }

    // Generate Payment Number
    const count = await Payment.countDocuments();
    const year = new Date().getFullYear();
    const paymentNumber = `WH-PAY-${year}-${String(count + 1001).padStart(5, '0')}`;

    // Create Payment Record
    const payment = await Payment.create({
      paymentNumber,
      retailer: retailerId,
      totalAmount: numAmount,
      allocations: finalAllocations,
      paymentMethod: paymentMethod || 'bank_transfer',
      transactionReference,
      status: 'completed',
      recordedBy: req.user._id,
      notes,
    });

    // Record in Credit Ledger and recalculate
    await recordCreditPayment({
      retailerId,
      paymentId: payment._id,
      amount: numAmount,
      referenceNumber: paymentNumber,
      actorId: req.user._id,
      note: `Payment of ₹${numAmount.toLocaleString('en-IN')} received via ${(paymentMethod || 'bank_transfer').toUpperCase()} (Ref: ${transactionReference})`,
    });

    const updatedCredit = await recalculateRetailerCredit(retailerId);

    res.status(201).json({
      success: true,
      message: `Payment #${paymentNumber} of ₹${numAmount.toLocaleString('en-IN')} recorded successfully.`,
      data: {
        payment,
        allocationsCount: finalAllocations.length,
        updatedCredit,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
