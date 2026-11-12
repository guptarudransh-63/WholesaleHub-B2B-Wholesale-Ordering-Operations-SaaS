import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    phone: { type: String },
    label: { type: String, default: 'Primary Warehouse / Store' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const retailerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Business email is required'],
      trim: true,
      lowercase: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    businessType: {
      type: String,
      enum: [
        'Retail Store',
        'Supermarket',
        'Regional Distributor',
        'FMCG Retailer',
        'Pharmacy / Healthcare',
        'Electronics Outlet',
        'Apparel & Fashion',
        'General Merchant',
        'Hospitality / HoReCa',
        'Online Reseller',
      ],
      default: 'Retail Store',
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    shippingAddresses: [addressSchema],
    retailerGroup: {
      type: String,
      enum: ['standard', 'silver', 'gold', 'platinum'],
      default: 'standard',
      index: true,
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableCredit: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentTerms: {
      type: String,
      enum: ['advance', 'cod', 'net_7', 'net_15', 'net_30', 'custom'],
      default: 'advance',
    },
    customPaymentTermsDays: {
      type: Number,
      default: 0,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    internalNotes: String,
    totalOrdersCount: {
      type: Number,
      default: 0,
    },
    totalPurchasesAmount: {
      type: Number,
      default: 0,
    },
    lastOrderDate: Date,
  },
  {
    timestamps: true,
  }
);

retailerProfileSchema.index({ businessName: 'text', contactPerson: 'text', email: 'text', gstin: 'text' });

export const RetailerProfile = mongoose.model('RetailerProfile', retailerProfileSchema);
