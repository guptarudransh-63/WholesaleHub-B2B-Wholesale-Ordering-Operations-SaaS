import express from 'express';
import { protect } from '../middleware/auth.js';
import { Invoice } from '../models/Invoice.js';
import { generateInvoicePDF } from '../services/invoiceService.js';

const router = express.Router();
router.use(protect);

// @route   GET /api/invoices
// @desc    Get invoices for logged-in retailer or all if admin
router.get('/', async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'retailer') {
      query.retailer = req.retailerProfile._id;
    }

    const { status, search, page = 1, limit = 20 } = req.query;
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('order', 'orderNumber orderStatus grandTotal paymentTerms paymentMethod')
      .populate('retailer', 'businessName contactPerson phone email gstin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/invoices/:id
// @desc    Get single invoice
router.get('/:id', async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'retailer') {
      query.retailer = req.retailerProfile._id;
    }

    const invoice = await Invoice.findOne(query)
      .populate('order')
      .populate('retailer');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/invoices/:id/pdf
// @desc    Generate and stream downloadable Tax Invoice PDF
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'retailer') {
      query.retailer = req.retailerProfile._id;
    }

    const invoice = await Invoice.findOne(query);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await generateInvoicePDF(invoice._id, res);
  } catch (error) {
    next(error);
  }
});

export default router;
