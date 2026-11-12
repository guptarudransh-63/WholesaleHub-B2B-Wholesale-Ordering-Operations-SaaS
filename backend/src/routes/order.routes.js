import express from 'express';
import { protect, requireApprovedRetailer } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { RetailerProfile } from '../models/RetailerProfile.js';
import { calculateItemPrice } from '../services/pricingEngine.js';
import { validateOrderItems, deductInventoryForOrder, restoreInventoryForOrder } from '../services/inventoryService.js';
import { checkCreditAvailability, recordCreditCharge, recalculateRetailerCredit } from '../services/creditService.js';
import { createInvoiceForOrder } from '../services/invoiceService.js';

const router = express.Router();
router.use(protect);

// @route   POST /api/orders
// @desc    Place a new B2B wholesale order
router.post('/', requireApprovedRetailer, async (req, res, next) => {
  try {
    const retailerId = req.retailerProfile._id;
    const {
      items: customItems,
      paymentMethod = 'credit',
      shippingAddress,
      customerNotes,
    } = req.body;

    let orderItems = [];

    // If items provided in body, use them; otherwise pull from cart
    if (customItems && Array.isArray(customItems) && customItems.length > 0) {
      orderItems = customItems;
    } else {
      const cart = await Cart.findOne({ retailer: retailerId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
      }
      orderItems = cart.items.map((i) => ({ product: i.product, quantity: i.quantity }));
    }

    // 1. Stock and Order Rules Validation
    const validation = await validateOrderItems(orderItems);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Order validation failed. Please check quantity rules or stock levels.',
        errors: validation.errors,
      });
    }

    // 2. Pricing Calculation & Immutable Snapshots
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let grandTotal = 0;
    const itemSnapshots = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      const pricing = await calculateItemPrice({
        product,
        quantity: item.quantity,
        retailerProfile: req.retailerProfile,
      });

      subtotal += pricing.subtotal;
      totalDiscount += pricing.discountPerUnit * item.quantity;
      totalTax += pricing.taxAmount;
      grandTotal += pricing.total;

      itemSnapshots.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitOfMeasurement: product.unitOfMeasurement,
        packSize: product.packSize,
        quantity: item.quantity,
        basePrice: pricing.basePrice,
        appliedUnitPrice: pricing.appliedUnitPrice,
        pricingType: pricing.pricingType,
        pricingRuleName: pricing.ruleName,
        discountPerUnit: pricing.discountPerUnit,
        taxRate: pricing.taxRate,
        taxAmount: pricing.taxAmount,
        subtotal: pricing.subtotal,
        total: pricing.total,
      });
    }

    grandTotal = Number(grandTotal.toFixed(2));
    subtotal = Number(subtotal.toFixed(2));
    totalDiscount = Number(totalDiscount.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));

    // 3. Credit Limit Check (if credit payment method)
    if (paymentMethod === 'credit') {
      const creditCheck = await checkCreditAvailability(retailerId, grandTotal);
      if (!creditCheck.allowed) {
        return res.status(400).json({
          success: false,
          message: creditCheck.reason,
          shortfall: creditCheck.shortfall,
          availableCredit: creditCheck.availableCredit,
          creditLimit: creditCheck.creditLimit,
        });
      }
    }

    // 4. Generate Unique Order Number
    const orderCount = await Order.countDocuments();
    const year = new Date().getFullYear();
    const orderNumber = `WH-ORD-${year}-${String(orderCount + 1001).padStart(5, '0')}`;

    // Selected or Default Address
    const deliveryAddress = shippingAddress || req.retailerProfile.billingAddress;

    // 5. Create Order
    const order = await Order.create({
      orderNumber,
      retailer: retailerId,
      items: itemSnapshots,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      paymentTerms: req.retailerProfile.paymentTerms || 'net_15',
      paymentMethod,
      paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'pending_verification',
      orderStatus: 'order_placed',
      shippingAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        postalCode: deliveryAddress.postalCode,
        country: deliveryAddress.country || 'India',
        phone: deliveryAddress.phone || req.retailerProfile.phone,
      },
      billingAddress: {
        street: req.retailerProfile.billingAddress.street,
        city: req.retailerProfile.billingAddress.city,
        state: req.retailerProfile.billingAddress.state,
        postalCode: req.retailerProfile.billingAddress.postalCode,
        country: req.retailerProfile.billingAddress.country || 'India',
        gstin: req.retailerProfile.gstin,
      },
      customerNotes,
      timeline: [
        {
          status: 'Order Placed',
          note: `Bulk order submitted successfully via ${paymentMethod.toUpperCase()} terms.`,
          actor: req.user.name,
          actorRole: req.user.role,
          timestamp: new Date(),
        },
      ],
    });

    // 6. Deduct stock inventory and record movements
    await deductInventoryForOrder(order.items, order._id, req.user._id);

    // 7. Auto-generate Tax Invoice
    const invoice = await createInvoiceForOrder(order._id);

    // 8. Record Credit Charge in ledger if on credit
    if (paymentMethod === 'credit') {
      await recordCreditCharge({
        retailerId,
        orderId: order._id,
        invoiceId: invoice._id,
        amount: grandTotal,
        referenceNumber: orderNumber,
        actorId: req.user._id,
        note: `Order ${orderNumber} placed on ${req.retailerProfile.paymentTerms.toUpperCase()}`,
      });
    }

    // 9. Update Retailer profile metrics
    await RetailerProfile.findByIdAndUpdate(retailerId, {
      $inc: { totalOrdersCount: 1, totalPurchasesAmount: grandTotal },
      lastOrderDate: new Date(),
    });

    // 10. Clear Shopping Cart
    await Cart.findOneAndUpdate({ retailer: retailerId }, { items: [] });

    res.status(201).json({
      success: true,
      message: `Order #${orderNumber} placed successfully!`,
      data: {
        order,
        invoice,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders
// @desc    List orders for authenticated retailer
router.get('/', async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'retailer') {
      query.retailer = req.retailerProfile._id;
    }

    const { status, search, page = 1, limit = 20 } = req.query;
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('invoiceId', 'invoiceNumber status dueDate outstandingAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get order details
router.get('/:id', async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'retailer') {
      query.retailer = req.retailerProfile._id;
    }

    const order = await Order.findOne(query)
      .populate('retailer', 'businessName contactPerson phone email gstin')
      .populate('invoiceId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders/:id/cancel
// @desc    Cancel an order before dispatch, restore inventory & credit
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'retailer') {
      query.retailer = req.retailerProfile._id;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['dispatched', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in '${order.orderStatus}' state.`,
      });
    }

    order.orderStatus = 'cancelled';
    order.timeline.push({
      status: 'Cancelled',
      note: req.body.reason || 'Order cancelled by customer',
      actor: req.user.name,
      actorRole: req.user.role,
      timestamp: new Date(),
    });
    await order.save();

    // Restore inventory
    await restoreInventoryForOrder(order.items, order._id, req.user._id, req.body.reason);

    // Cancel related invoice if unpaid
    if (order.invoiceId) {
      await import('../models/Invoice.js').then(async ({ Invoice }) => {
        await Invoice.findByIdAndUpdate(order.invoiceId, { status: 'cancelled', outstandingAmount: 0 });
      });
    }

    // Recalculate retailer credit ledger
    await recalculateRetailerCredit(order.retailer);

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} has been cancelled. Inventory and credit balances restored.`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders/:id/reorder
// @desc    Reorder previous purchase with live price recalculation & stock checks
router.post('/:id/reorder', requireApprovedRetailer, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      retailer: req.retailerProfile._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Previous order not found.' });
    }

    let cart = await Cart.findOne({ retailer: req.retailerProfile._id });
    if (!cart) cart = await Cart.create({ retailer: req.retailerProfile._id, items: [] });

    const notifications = [];
    let addedCount = 0;

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product || product.status !== 'active') {
        notifications.push(`"${item.name}" is no longer available and was skipped.`);
        continue;
      }

      const requestedQty = item.quantity;
      if (product.stock < requestedQty) {
        notifications.push(
          `"${product.name}" stock (${product.stock}) is less than previous order quantity (${requestedQty}). Adjusted to available stock.`
        );
      }

      const qtyToAdd = Math.min(product.stock, requestedQty);
      if (qtyToAdd <= 0) {
        notifications.push(`"${product.name}" is currently out of stock.`);
        continue;
      }

      // Check for price changes
      const currentPricing = await calculateItemPrice({
        product,
        quantity: qtyToAdd,
        retailerProfile: req.retailerProfile,
      });

      if (currentPricing.appliedUnitPrice !== item.appliedUnitPrice) {
        notifications.push(
          `Price update for "${product.name}": was ₹${item.appliedUnitPrice}, now ₹${currentPricing.appliedUnitPrice} per ${product.unitOfMeasurement}.`
        );
      }

      const existingIndex = cart.items.findIndex((i) => i.product.toString() === product._id.toString());
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = qtyToAdd;
      } else {
        cart.items.push({ product: product._id, quantity: qtyToAdd });
      }
      addedCount++;
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: `Added ${addedCount} items to cart from Order #${order.orderNumber}.`,
      notifications,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
