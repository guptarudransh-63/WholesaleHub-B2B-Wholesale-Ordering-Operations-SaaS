import { Product } from '../models/Product.js';
import { InventoryMovement } from '../models/InventoryMovement.js';

/**
 * Validates stock availability, MOQ, and pack increments for a batch of order items.
 */
export async function validateOrderItems(items) {
  const errors = [];
  const validatedProducts = [];

  for (const item of items) {
    const product = await Product.findById(item.product || item.productId);

    if (!product) {
      errors.push(`Product with ID ${item.product || item.productId} not found.`);
      continue;
    }

    if (product.status !== 'active') {
      errors.push(`"${product.name}" is currently inactive/unavailable.`);
      continue;
    }

    const qty = Number(item.quantity);
    if (!qty || qty <= 0) {
      errors.push(`Invalid quantity for "${product.name}".`);
      continue;
    }

    // Check MOQ
    if (product.minOrderQty && qty < product.minOrderQty) {
      errors.push(
        `"${product.name}" requires a minimum order quantity of ${product.minOrderQty} ${product.unitOfMeasurement}(s). (Requested: ${qty})`
      );
    }

    // Check quantity increment
    if (product.orderQtyIncrement && product.orderQtyIncrement > 1) {
      if (qty % product.orderQtyIncrement !== 0) {
        errors.push(
          `"${product.name}" must be ordered in increments/multiples of ${product.orderQtyIncrement} (e.g., pack size: ${product.packSize}). (Requested: ${qty})`
        );
      }
    }

    // Check available stock
    if (qty > product.stock) {
      errors.push(
        `Insufficient stock for "${product.name}". Available: ${product.stock} ${product.unitOfMeasurement}(s), Requested: ${qty}`
      );
    }

    validatedProducts.push({ product, quantity: qty });
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedProducts,
  };
}

/**
 * Deducts available stock and records movement on order confirmation.
 */
export async function deductInventoryForOrder(items, orderId, actorId = null) {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const prevStock = product.stock;
    const qtyChange = -item.quantity;
    const newStock = Math.max(0, prevStock - item.quantity);

    product.stock = newStock;
    await product.save();

    await InventoryMovement.create({
      product: product._id,
      movementType: 'order_fulfillment',
      quantityChange: qtyChange,
      previousStock: prevStock,
      newStock: newStock,
      order: orderId,
      actor: actorId,
      note: `Stock deducted for Order #${item.orderNumber || orderId}`,
    });
  }
}

/**
 * Restores stock back to inventory upon order cancellation.
 */
export async function restoreInventoryForOrder(items, orderId, actorId = null, reason = 'Order cancelled') {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const prevStock = product.stock;
    const qtyChange = item.quantity;
    const newStock = prevStock + item.quantity;

    product.stock = newStock;
    await product.save();

    await InventoryMovement.create({
      product: product._id,
      movementType: 'order_cancellation',
      quantityChange: qtyChange,
      previousStock: prevStock,
      newStock: newStock,
      order: orderId,
      actor: actorId,
      note: `Stock restored: ${reason}`,
    });
  }
}
