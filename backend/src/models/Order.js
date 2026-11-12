import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String },
    unitOfMeasurement: { type: String, default: 'case' },
    packSize: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true },
    appliedUnitPrice: { type: Number, required: true },
    pricingType: {
      type: String,
      enum: ['retailer_specific', 'retailer_group', 'volume_tier', 'promotion', 'base_wholesale'],
      default: 'base_wholesale',
    },
    pricingRuleName: { type: String },
    discountPerUnit: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true }, // quantity * appliedUnitPrice
    total: { type: Number, required: true }, // subtotal + taxAmount
  },
  { _id: true }
);

const orderTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    actor: { type: String, default: 'System' },
    actorRole: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RetailerProfile',
      required: true,
      index: true,
    },
    items: [orderItemSnapshotSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentTerms: {
      type: String,
      enum: ['advance', 'cod', 'net_7', 'net_15', 'net_30', 'custom'],
      default: 'advance',
    },
    paymentMethod: {
      type: String,
      enum: ['credit', 'bank_transfer', 'upi', 'cod', 'razorpay'],
      default: 'credit',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'unpaid',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'order_placed',
        'pending_approval',
        'confirmed',
        'processing',
        'packed',
        'dispatched',
        'delivered',
        'cancelled',
      ],
      default: 'order_placed',
      index: true,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      gstin: String,
    },
    trackingInfo: {
      carrier: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      dispatchedAt: Date,
      estimatedDelivery: Date,
      actualDelivery: Date,
    },
    timeline: [orderTimelineSchema],
    internalNotes: String,
    customerNotes: String,
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
