import express from 'express';
import { protect, requireApprovedRetailer } from '../middleware/auth.js';
import { RetailerProfile } from '../models/RetailerProfile.js';
import { PricingRule } from '../models/PricingRule.js';
import { CreditLedger } from '../models/CreditLedger.js';
import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { recalculateRetailerCredit } from '../services/creditService.js';

const router = express.Router();

// Apply auth to all retailer routes
router.use(protect);

// @route   GET /api/retailer/profile
// @desc    Get logged-in retailer's business profile
router.get('/profile', async (req, res, next) => {
  try {
    if (!req.retailerProfile) {
      return res.status(404).json({ success: false, message: 'Retailer profile not found' });
    }
    res.status(200).json({ success: true, data: req.retailerProfile });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/retailer/profile
// @desc    Update editable business profile details
router.patch('/profile', async (req, res, next) => {
  try {
    const { contactPerson, phone, billingAddress, shippingAddresses } = req.body;
    const profile = await RetailerProfile.findById(req.retailerProfile._id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (contactPerson) profile.contactPerson = contactPerson;
    if (phone) profile.phone = phone;
    if (billingAddress) profile.billingAddress = { ...profile.billingAddress, ...billingAddress };
    if (shippingAddresses) profile.shippingAddresses = shippingAddresses;

    await profile.save();
    res.status(200).json({ success: true, data: profile, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/retailer/pricing
// @desc    Get negotiated custom pricing rules and group tier rules assigned to this retailer
router.get('/pricing', requireApprovedRetailer, async (req, res, next) => {
  try {
    const retailerId = req.retailerProfile._id;
    const group = req.retailerProfile.retailerGroup;

    const rules = await PricingRule.find({
      isActive: true,
      $or: [
        { ruleType: 'retailer_specific', retailer: retailerId },
        { ruleType: 'retailer_group', retailerGroup: group },
      ],
    })
      .populate('product', 'name sku basePrice category unitOfMeasurement packSize images')
      .sort({ ruleType: 1, priority: -1 });

    res.status(200).json({
      success: true,
      retailerTier: group,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/retailer/credit
// @desc    Get credit profile, available limit, outstanding receivables, unpaid invoices & ledger
router.get('/credit', async (req, res, next) => {
  try {
    const retailerId = req.retailerProfile._id;
    const creditMetrics = await recalculateRetailerCredit(retailerId);

    const invoices = await Invoice.find({
      retailer: retailerId,
      status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
    }).sort({ dueDate: 1 });

    const ledger = await CreditLedger.find({ retailer: retailerId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        creditLimit: creditMetrics.creditLimit,
        outstandingBalance: creditMetrics.outstandingBalance,
        availableCredit: creditMetrics.availableCredit,
        paymentTerms: req.retailerProfile.paymentTerms,
        unpaidInvoices: invoices,
        ledgerHistory: ledger,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/retailer/purchases
// @desc    Frequently and recently ordered products for fast 1-click reorder
router.get('/purchases', requireApprovedRetailer, async (req, res, next) => {
  try {
    const retailerId = req.retailerProfile._id;

    // Aggregate items across confirmed/delivered orders
    const pastOrders = await Order.find({
      retailer: retailerId,
      orderStatus: { $ne: 'cancelled' },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const productMap = new Map();

    pastOrders.forEach((order) => {
      order.items.forEach((item) => {
        const prodId = item.product.toString();
        if (!productMap.has(prodId)) {
          productMap.set(prodId, {
            productId: item.product,
            name: item.name,
            sku: item.sku,
            unitOfMeasurement: item.unitOfMeasurement,
            packSize: item.packSize,
            lastQuantity: item.quantity,
            totalQuantityBought: item.quantity,
            lastOrderedAt: order.createdAt,
            lastUnitPrice: item.appliedUnitPrice,
          });
        } else {
          const entry = productMap.get(prodId);
          entry.totalQuantityBought += item.quantity;
        }
      });
    });

    const frequentProducts = Array.from(productMap.values()).sort(
      (a, b) => b.totalQuantityBought - a.totalQuantityBought
    );

    res.status(200).json({
      success: true,
      data: frequentProducts,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
