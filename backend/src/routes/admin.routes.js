import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { RetailerProfile } from '../models/RetailerProfile.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { PricingRule } from '../models/PricingRule.js';
import { CreditLedger } from '../models/CreditLedger.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { recalculateRetailerCredit } from '../services/creditService.js';
import { deductInventoryForOrder, restoreInventoryForOrder } from '../services/inventoryService.js';

const router = express.Router();

// Enforce admin or manager role
router.use(protect, authorize('admin', 'sales_manager', 'inventory_manager', 'finance_manager'));

// @route   GET /api/admin/dashboard
// @desc    Overview metrics using real database aggregations
router.get('/dashboard', async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;

    let dateFilter = new Date();
    if (timeRange === 'today') dateFilter.setHours(0, 0, 0, 0);
    else if (timeRange === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (timeRange === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
    else if (timeRange === '90d') dateFilter.setDate(dateFilter.getDate() - 90);
    else dateFilter = new Date(0); // all time

    // Orders summary
    const ordersStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: dateFilter },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$grandTotal' },
        },
      },
    ]);

    const totalSales = ordersStats.length > 0 ? Number(ordersStats[0].totalSales.toFixed(2)) : 0;
    const totalOrders = ordersStats.length > 0 ? ordersStats[0].orderCount : 0;
    const avgOrderValue = ordersStats.length > 0 ? Number(ordersStats[0].avgOrderValue.toFixed(2)) : 0;

    // Receivables summary
    const receivablesStats = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$outstandingAmount' },
          unpaidInvoicesCount: { $sum: 1 },
        },
      },
    ]);

    const totalOutstanding = receivablesStats.length > 0 ? Number(receivablesStats[0].totalOutstanding.toFixed(2)) : 0;

    // Overdue summary
    const now = new Date();
    const overdueStats = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
          dueDate: { $lt: now },
        },
      },
      {
        $group: {
          _id: null,
          totalOverdue: { $sum: '$outstandingAmount' },
          overdueCount: { $sum: 1 },
        },
      },
    ]);

    const totalOverdue = overdueStats.length > 0 ? Number(overdueStats[0].totalOverdue.toFixed(2)) : 0;

    // Collected payments
    const paymentsStats = await Payment.aggregate([
      { $match: { status: 'completed', paymentDate: { $gte: dateFilter } } },
      { $group: { _id: null, totalCollected: { $sum: '$totalAmount' } } },
    ]);

    const totalCollected = paymentsStats.length > 0 ? Number(paymentsStats[0].totalCollected.toFixed(2)) : 0;

    // Retailer metrics
    const totalRetailers = await RetailerProfile.countDocuments();
    const pendingRetailers = await RetailerProfile.countDocuments({ approvalStatus: 'pending' });
    const activeRetailers = await RetailerProfile.countDocuments({ approvalStatus: 'approved' });

    // Inventory metrics
    const lowStockCount = await Product.countDocuments({
      status: 'active',
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });

    const pendingOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ['order_placed', 'pending_approval'] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        avgOrderValue,
        totalOutstanding,
        totalOverdue,
        totalCollected,
        totalRetailers,
        pendingRetailers,
        activeRetailers,
        lowStockCount,
        pendingOrdersCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/analytics
// @desc    Recharts data for revenue trends, category breakdown, top retailers
router.get('/analytics', async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;

    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '90d') days = 90;
    else if (timeRange === 'today') days = 1;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Sales Trend over time
    const salesTrend = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Sales by Category
    const categoryStats = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          revenue: { $sum: '$items.total' },
          volume: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    // 3. Top Performing Retailers
    const topRetailers = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$retailer',
          totalSpent: { $sum: '$grandTotal' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'retailerprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'profile',
        },
      },
      { $unwind: '$profile' },
      {
        $project: {
          _id: 1,
          businessName: '$profile.businessName',
          group: '$profile.retailerGroup',
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]);

    // 4. Order Status Distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        salesTrend: salesTrend.map((s) => ({ date: s._id, revenue: Math.round(s.revenue), orders: s.orders })),
        categoryStats: categoryStats.map((c) => ({
          name: c._id || 'Uncategorized',
          revenue: Math.round(c.revenue),
          volume: c.volume,
        })),
        topRetailers,
        statusDistribution: statusDistribution.map((s) => ({ status: s._id, count: s.count })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/retailers
// @desc    List all retailers with filters
router.get('/retailers', async (req, res, next) => {
  try {
    const { status, group, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') query.approvalStatus = status;
    if (group && group !== 'all') query.retailerGroup = group;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await RetailerProfile.countDocuments(query);
    const retailers = await RetailerProfile.find(query)
      .populate('user', 'role lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      data: retailers,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/retailers/:id
// @desc    Get 360-degree retailer profile including invoices, ledger, custom pricing
router.get('/retailers/:id', async (req, res, next) => {
  try {
    const retailer = await RetailerProfile.findById(req.params.id).populate('user');
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Retailer not found' });
    }

    await recalculateRetailerCredit(retailer._id);

    const [orders, invoices, pricingRules, ledger] = await Promise.all([
      Order.find({ retailer: retailer._id }).sort({ createdAt: -1 }).limit(10),
      Invoice.find({ retailer: retailer._id }).sort({ createdAt: -1 }),
      PricingRule.find({ retailer: retailer._id, isActive: true }).populate('product', 'name sku basePrice category'),
      CreditLedger.find({ retailer: retailer._id }).sort({ createdAt: -1 }).limit(20),
    ]);

    res.status(200).json({
      success: true,
      data: {
        retailer,
        orders,
        invoices,
        pricingRules,
        ledger,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/retailers/:id/status
// @desc    Approve, Reject, or Suspend retailer account
router.patch('/retailers/:id/status', async (req, res, next) => {
  try {
    const { status, internalNotes } = req.body;
    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const retailer = await RetailerProfile.findById(req.params.id);
    if (!retailer) return res.status(404).json({ success: false, message: 'Retailer not found' });

    retailer.approvalStatus = status;
    if (status === 'approved') {
      retailer.approvedAt = new Date();
      retailer.approvedBy = req.user._id;
    }
    if (internalNotes) retailer.internalNotes = internalNotes;
    await retailer.save();

    // Sync User status
    await User.findByIdAndUpdate(retailer.user, { status });

    res.status(200).json({
      success: true,
      message: `Retailer status updated to '${status}'.`,
      data: retailer,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/retailers/:id/credit
// @desc    Configure credit limit & payment terms
router.patch('/retailers/:id/credit', async (req, res, next) => {
  try {
    const { creditLimit, paymentTerms, customPaymentTermsDays } = req.body;
    const retailer = await RetailerProfile.findById(req.params.id);
    if (!retailer) return res.status(404).json({ success: false, message: 'Retailer not found' });

    if (creditLimit !== undefined) {
      const prevLimit = retailer.creditLimit;
      retailer.creditLimit = Number(creditLimit);
      await CreditLedger.create({
        retailer: retailer._id,
        transactionType: 'credit_limit_set',
        debit: 0,
        credit: 0,
        balanceAfter: retailer.outstandingBalance,
        availableCreditAfter: Math.max(0, Number((retailer.creditLimit - retailer.outstandingBalance).toFixed(2))),
        referenceNumber: `LIMIT-CHANGE-${Date.now()}`,
        note: `Credit limit updated from ₹${prevLimit} to ₹${creditLimit} by ${req.user.name}`,
        actor: req.user._id,
      });
    }

    if (paymentTerms) retailer.paymentTerms = paymentTerms;
    if (customPaymentTermsDays !== undefined) retailer.customPaymentTermsDays = Number(customPaymentTermsDays);

    await retailer.save();
    const updatedCredit = await recalculateRetailerCredit(retailer._id);

    res.status(200).json({
      success: true,
      message: 'Retailer credit and payment terms updated.',
      data: updatedCredit,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/retailers/:id/group
// @desc    Assign retailer tier group (Standard, Silver, Gold, Platinum)
router.patch('/retailers/:id/group', async (req, res, next) => {
  try {
    const { retailerGroup } = req.body;
    if (!['standard', 'silver', 'gold', 'platinum'].includes(retailerGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid group tier.' });
    }

    const retailer = await RetailerProfile.findByIdAndUpdate(
      req.params.id,
      { retailerGroup },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Retailer tier updated to ${retailerGroup.toUpperCase()}.`,
      data: retailer,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PRODUCT CRUD ====================

// @route   GET /api/admin/products
router.get('/products', async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }];
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/products
router.post('/products', async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    // Record initial inventory movement
    if (product.stock > 0) {
      await InventoryMovement.create({
        product: product._id,
        movementType: 'initial_stock',
        quantityChange: product.stock,
        previousStock: 0,
        newStock: product.stock,
        actor: req.user._id,
        note: `Initial catalogue stock setup for ${product.sku}`,
      });
    }

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/products/:id
router.patch('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Track stock change if updated
    if (req.body.stock !== undefined && req.body.stock !== product.stock) {
      const prevStock = product.stock;
      const newStock = Number(req.body.stock);
      const diff = newStock - prevStock;

      await InventoryMovement.create({
        product: product._id,
        movementType: diff > 0 ? 'restock' : 'manual_adjustment',
        quantityChange: diff,
        previousStock: prevStock,
        newStock: newStock,
        actor: req.user._id,
        note: req.body.stockAdjustmentReason || `Stock manually adjusted from ${prevStock} to ${newStock}`,
      });
    }

    Object.assign(product, req.body);
    await product.save();

    res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { status: 'discontinued' });
    res.status(200).json({ success: true, message: 'Product marked discontinued' });
  } catch (error) {
    next(error);
  }
});

// ==================== PRICING ENGINE RULES ====================

// @route   GET /api/admin/pricing
router.get('/pricing', async (req, res, next) => {
  try {
    const { ruleType, product, retailer } = req.query;
    const query = {};
    if (ruleType) query.ruleType = ruleType;
    if (product) query.product = product;
    if (retailer) query.retailer = retailer;

    const rules = await PricingRule.find(query)
      .populate('product', 'name sku basePrice category unitOfMeasurement')
      .populate('retailer', 'businessName contactPerson')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/pricing
router.post('/pricing', async (req, res, next) => {
  try {
    const rule = await PricingRule.create(req.body);
    res.status(201).json({ success: true, message: 'Pricing rule created successfully', data: rule });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/pricing/:id
router.patch('/pricing/:id', async (req, res, next) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Pricing rule updated', data: rule });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/pricing/:id
router.delete('/pricing/:id', async (req, res, next) => {
  try {
    await PricingRule.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Pricing rule deleted' });
  } catch (error) {
    next(error);
  }
});

// ==================== ORDER OPERATIONS ====================

// @route   GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status && status !== 'all') query.orderStatus = status;
    if (search) query.orderNumber = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('retailer', 'businessName contactPerson phone email gstin retailerGroup')
      .populate('invoiceId', 'invoiceNumber status outstandingAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({ success: true, total, data: orders });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const prevStatus = order.orderStatus;
    order.orderStatus = status;
    order.timeline.push({
      status: status.replace('_', ' ').toUpperCase(),
      note: note || `Status transitioned from ${prevStatus} to ${status}`,
      actor: req.user.name,
      actorRole: req.user.role,
      timestamp: new Date(),
    });

    // If cancelled by admin, restore inventory
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      await restoreInventoryForOrder(order.items, order._id, req.user._id, note || 'Admin cancellation');
      await recalculateRetailerCredit(order.retailer);
    }

    await order.save();
    res.status(200).json({ success: true, message: `Order status updated to ${status}`, data: order });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/admin/orders/:id/tracking
router.patch('/orders/:id/tracking', async (req, res, next) => {
  try {
    const { carrier, trackingNumber, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.trackingInfo = {
      carrier: carrier || order.trackingInfo?.carrier || 'Delhivery Express',
      trackingNumber: trackingNumber || order.trackingInfo?.trackingNumber,
      dispatchedAt: new Date(),
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : new Date(Date.now() + 3 * 86400000),
    };

    if (order.orderStatus !== 'dispatched') {
      order.orderStatus = 'dispatched';
      order.timeline.push({
        status: 'Dispatched',
        note: `Dispatched via ${order.trackingInfo.carrier}. Tracking #${trackingNumber}`,
        actor: req.user.name,
        actorRole: req.user.role,
        timestamp: new Date(),
      });
    }

    await order.save();
    res.status(200).json({ success: true, message: 'Tracking details updated', data: order });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/inventory/movements
// @desc    Audit trail of all inventory additions, orders, deductions
router.get('/inventory/movements', async (req, res, next) => {
  try {
    const movements = await InventoryMovement.find()
      .populate('product', 'name sku unitOfMeasurement')
      .populate('order', 'orderNumber')
      .populate('actor', 'name role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, count: movements.length, data: movements });
  } catch (error) {
    next(error);
  }
});

export default router;
