import express from 'express';
import { protect, requireApprovedRetailer } from '../middleware/auth.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { calculateItemPrice } from '../services/pricingEngine.js';

const router = express.Router();
router.use(protect, requireApprovedRetailer);

// Helper to calculate fresh cart breakdown
const buildCartResponse = async (cart, retailerProfile) => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let grandTotal = 0;

  const populatedItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const pricing = await calculateItemPrice({
      product,
      quantity: item.quantity,
      retailerProfile,
    });

    const isAvailable = product.status === 'active' && product.stock >= item.quantity;

    subtotal += pricing.subtotal;
    totalDiscount += pricing.discountPerUnit * item.quantity;
    totalTax += pricing.taxAmount;
    grandTotal += pricing.total;

    populatedItems.push({
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        images: product.images,
        unitOfMeasurement: product.unitOfMeasurement,
        packSize: product.packSize,
        stock: product.stock,
        minOrderQty: product.minOrderQty,
        orderQtyIncrement: product.orderQtyIncrement,
        taxRate: product.taxRate,
      },
      quantity: item.quantity,
      notes: item.notes,
      basePrice: pricing.basePrice,
      unitPrice: pricing.appliedUnitPrice,
      pricingType: pricing.pricingType,
      ruleName: pricing.ruleName,
      discountPerUnit: pricing.discountPerUnit,
      taxAmount: pricing.taxAmount,
      subtotal: pricing.subtotal,
      total: pricing.total,
      isAvailable,
      stockWarning: product.stock < item.quantity ? `Only ${product.stock} units in stock` : null,
    });
  }

  return {
    _id: cart._id,
    items: populatedItems,
    itemsCount: populatedItems.reduce((sum, i) => sum + i.quantity, 0),
    uniqueItemsCount: populatedItems.length,
    subtotal: Number(subtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
};

// @route   GET /api/cart
// @desc    Get cart with live recalculated prices and tier savings
router.get('/', async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ retailer: req.retailerProfile._id });
    if (!cart) {
      cart = await Cart.create({ retailer: req.retailerProfile._id, items: [] });
    }

    const cartData = await buildCartResponse(cart, req.retailerProfile);
    res.status(200).json({ success: true, data: cartData });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cart/items
// @desc    Add item or update quantity in cart
router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity, notes } = req.body;
    const qty = Number(quantity);

    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product ID and positive quantity required.' });
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product is unavailable or does not exist.' });
    }

    // Validate MOQ and increment
    if (product.minOrderQty && qty < product.minOrderQty) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for ${product.name} is ${product.minOrderQty} ${product.unitOfMeasurement}s.`,
      });
    }

    if (product.orderQtyIncrement && product.orderQtyIncrement > 1 && qty % product.orderQtyIncrement !== 0) {
      return res.status(400).json({
        success: false,
        message: `Quantity for ${product.name} must be a multiple of ${product.orderQtyIncrement}.`,
      });
    }

    let cart = await Cart.findOne({ retailer: req.retailerProfile._id });
    if (!cart) {
      cart = await Cart.create({ retailer: req.retailerProfile._id, items: [] });
    }

    const existingIndex = cart.items.findIndex((i) => i.product.toString() === productId);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = qty;
      if (notes !== undefined) cart.items[existingIndex].notes = notes;
    } else {
      cart.items.push({ product: productId, quantity: qty, notes: notes || '' });
    }

    await cart.save();
    const cartData = await buildCartResponse(cart, req.retailerProfile);

    res.status(200).json({
      success: true,
      message: `Added ${product.name} (${qty} ${product.unitOfMeasurement}s) to cart.`,
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/cart/items/:productId
// @desc    Update single item quantity in cart
router.patch('/items/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    let cart = await Cart.findOne({ retailer: req.retailerProfile._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex((i) => i.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = qty;
    }

    await cart.save();
    const cartData = await buildCartResponse(cart, req.retailerProfile);
    res.status(200).json({ success: true, data: cartData });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cart/items/:productId
// @desc    Remove product from cart
router.delete('/items/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ retailer: req.retailerProfile._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();

    const cartData = await buildCartResponse(cart, req.retailerProfile);
    res.status(200).json({ success: true, message: 'Item removed from cart', data: cartData });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cart/clear
router.post('/clear', async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ retailer: req.retailerProfile._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cart/bulk-add
// @desc    Bulk add multiple products from quick-order form or CSV import
router.post('/bulk-add', async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { sku or productId, quantity }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of items to add.' });
    }

    let cart = await Cart.findOne({ retailer: req.retailerProfile._id });
    if (!cart) cart = await Cart.create({ retailer: req.retailerProfile._id, items: [] });

    const added = [];
    const skipped = [];

    for (const row of items) {
      const qty = Number(row.quantity);
      if (!qty || qty <= 0) continue;

      let product = null;
      if (row.productId) {
        product = await Product.findById(row.productId);
      } else if (row.sku) {
        product = await Product.findOne({ sku: row.sku.trim().toUpperCase() });
      }

      if (!product || product.status !== 'active') {
        skipped.push({ identifier: row.sku || row.productId, reason: 'Product not found or inactive' });
        continue;
      }

      const existingIndex = cart.items.findIndex((i) => i.product.toString() === product._id.toString());
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += qty;
      } else {
        cart.items.push({ product: product._id, quantity: qty });
      }
      added.push({ name: product.name, sku: product.sku, quantity: qty });
    }

    await cart.save();
    const cartData = await buildCartResponse(cart, req.retailerProfile);

    res.status(200).json({
      success: true,
      message: `Successfully processed bulk items. Added/Updated: ${added.length}, Skipped: ${skipped.length}`,
      added,
      skipped,
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
