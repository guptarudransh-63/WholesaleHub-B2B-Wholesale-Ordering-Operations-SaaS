import mongoose from 'mongoose';

const volumeTierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    maxQty: { type: Number, default: null }, // null means infinity / unbounded upper limit
    unitPrice: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0 },
  },
  { _id: false }
);

const pricingRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: true,
      trim: true,
    },
    ruleType: {
      type: String,
      enum: ['retailer_specific', 'retailer_group', 'volume_tier', 'promotion'],
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    // Applicable if ruleType === 'retailer_specific'
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RetailerProfile',
      index: true,
    },
    // Applicable if ruleType === 'retailer_group'
    retailerGroup: {
      type: String,
      enum: ['standard', 'silver', 'gold', 'platinum'],
      index: true,
    },
    // Direct fixed price override
    fixedPrice: {
      type: Number,
      min: 0,
    },
    // Percentage discount on base price (0-100)
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Applicable if ruleType === 'volume_tier'
    volumeTiers: [volumeTierSchema],
    // Time bounds (for promotions or scheduled contract pricing)
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: Number,
      default: 0, // Higher number = higher precedence
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

pricingRuleSchema.index({ product: 1, ruleType: 1, retailer: 1, retailerGroup: 1, isActive: 1 });

export const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
