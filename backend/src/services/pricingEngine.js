import { PricingRule } from '../models/PricingRule.js';
import { Product } from '../models/Product.js';

/**
 * Resolves the effective pricing for a single product and quantity based on retailer profile.
 * Priority:
 * 1. Valid Retailer-specific Price (Fixed price or percentage discount)
 * 2. Valid Retailer-group Price (Silver, Gold, Platinum, Standard)
 * 3. Applicable Volume-based tier price
 * 4. Product base wholesale price
 */
export async function calculateItemPrice({
  product,
  quantity,
  retailerProfile = null,
}) {
  const qty = Number(quantity) || 1;
  const prodDoc = typeof product === 'object' && product._id ? product : await Product.findById(product);

  if (!prodDoc) {
    throw new Error('Product not found for price calculation');
  }

  const now = new Date();
  const basePrice = prodDoc.basePrice;
  let unitPrice = basePrice;
  let pricingType = 'base_wholesale';
  let ruleName = 'Default Base Wholesale Price';
  let discountPerUnit = 0;

  // Retrieve active pricing rules for this product
  const query = {
    product: prodDoc._id,
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ],
  };

  const rules = await PricingRule.find(query).sort({ priority: -1, createdAt: -1 });

  // 1. Check for specific retailer price override
  if (retailerProfile && retailerProfile._id) {
    const specificRule = rules.find(
      (r) =>
        r.ruleType === 'retailer_specific' &&
        r.retailer &&
        r.retailer.toString() === retailerProfile._id.toString()
    );

    if (specificRule) {
      if (specificRule.fixedPrice != null && specificRule.fixedPrice >= 0) {
        unitPrice = specificRule.fixedPrice;
        discountPerUnit = Math.max(0, basePrice - unitPrice);
        pricingType = 'retailer_specific';
        ruleName = specificRule.ruleName || 'Negotiated Contract Price';
      } else if (specificRule.discountPercentage > 0) {
        discountPerUnit = (basePrice * specificRule.discountPercentage) / 100;
        unitPrice = Math.max(0, basePrice - discountPerUnit);
        pricingType = 'retailer_specific';
        ruleName = specificRule.ruleName || `${specificRule.discountPercentage}% Contract Discount`;
      }
    }
  }

  // 2. Check for retailer group rule (if not already resolved)
  if (pricingType === 'base_wholesale' && retailerProfile && retailerProfile.retailerGroup) {
    const groupRule = rules.find(
      (r) =>
        r.ruleType === 'retailer_group' &&
        r.retailerGroup === retailerProfile.retailerGroup
    );

    if (groupRule) {
      if (groupRule.fixedPrice != null && groupRule.fixedPrice >= 0) {
        unitPrice = groupRule.fixedPrice;
        discountPerUnit = Math.max(0, basePrice - unitPrice);
        pricingType = 'retailer_group';
        ruleName = groupRule.ruleName || `${retailerProfile.retailerGroup.toUpperCase()} Tier Fixed Price`;
      } else if (groupRule.discountPercentage > 0) {
        discountPerUnit = (basePrice * groupRule.discountPercentage) / 100;
        unitPrice = Math.max(0, basePrice - discountPerUnit);
        pricingType = 'retailer_group';
        ruleName = groupRule.ruleName || `${groupRule.discountPercentage}% ${retailerProfile.retailerGroup.toUpperCase()} Tier Discount`;
      }
    }
  }

  // 3. Check for volume tier pricing
  // Volume tiers can apply as standalone or further optimize
  const volumeRule = rules.find((r) => r.ruleType === 'volume_tier' && r.volumeTiers && r.volumeTiers.length > 0);

  if (volumeRule) {
    // Find matching tier
    const matchedTier = volumeRule.volumeTiers.find((tier) => {
      const minOk = qty >= tier.minQty;
      const maxOk = tier.maxQty == null || qty <= tier.maxQty;
      return minOk && maxOk;
    });

    if (matchedTier) {
      const tierPrice = matchedTier.unitPrice;
      // If no higher-priority rule applied, or if volume price is more favorable
      if (pricingType === 'base_wholesale' || tierPrice < unitPrice) {
        unitPrice = tierPrice;
        discountPerUnit = Math.max(0, basePrice - unitPrice);
        pricingType = 'volume_tier';
        ruleName = `${volumeRule.ruleName} (${matchedTier.minQty}${matchedTier.maxQty ? `-${matchedTier.maxQty}` : '+'} units)`;
      }
    }
  }

  // Calculate taxes and subtotals
  const subtotal = Number((unitPrice * qty).toFixed(2));
  const taxRate = prodDoc.taxRate || 18;
  const isTaxInclusive = Boolean(prodDoc.isTaxInclusive);

  let taxAmount = 0;
  let finalTotal = subtotal;

  if (isTaxInclusive) {
    // Subtotal already contains tax
    const taxableBase = subtotal / (1 + taxRate / 100);
    taxAmount = Number((subtotal - taxableBase).toFixed(2));
    finalTotal = subtotal;
  } else {
    // Subtotal is pre-tax, tax is added
    taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    finalTotal = Number((subtotal + taxAmount).toFixed(2));
  }

  const discountPercentage = basePrice > 0 ? Number(((discountPerUnit / basePrice) * 100).toFixed(1)) : 0;

  return {
    productId: prodDoc._id,
    sku: prodDoc.sku,
    name: prodDoc.name,
    category: prodDoc.category,
    unitOfMeasurement: prodDoc.unitOfMeasurement,
    packSize: prodDoc.packSize,
    quantity: qty,
    basePrice: Number(basePrice.toFixed(2)),
    appliedUnitPrice: Number(unitPrice.toFixed(2)),
    pricingType,
    ruleName,
    discountPerUnit: Number(discountPerUnit.toFixed(2)),
    discountPercentage,
    taxRate,
    isTaxInclusive,
    subtotal,
    taxAmount,
    total: finalTotal,
  };
}

/**
 * Calculates tailored catalog prices for an array of products for a retailer.
 */
export async function getRetailerCatalogPrices(products, retailerProfile) {
  return await Promise.all(
    products.map(async (prod) => {
      const minQty = prod.minOrderQty || 1;
      const priceCalculation = await calculateItemPrice({
        product: prod,
        quantity: minQty,
        retailerProfile,
      });

      // Also fetch volume tiers preview for the UI
      const volumeRules = await PricingRule.find({
        product: prod._id,
        ruleType: 'volume_tier',
        isActive: true,
      });

      const tiers = volumeRules.length > 0 && volumeRules[0].volumeTiers ? volumeRules[0].volumeTiers : [];

      return {
        ...prod.toObject ? prod.toObject() : prod,
        calculatedPrice: priceCalculation.appliedUnitPrice,
        basePrice: prod.basePrice,
        discountPercentage: priceCalculation.discountPercentage,
        pricingType: priceCalculation.pricingType,
        ruleName: priceCalculation.ruleName,
        volumeTiers: tiers,
      };
    })
  );
}
