import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    invoiceNumber: { type: String },
    amountAllocated: {
      type: Number,
      required: true,
      min: [0.01, 'Allocation must be greater than 0'],
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
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
    totalAmount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    allocations: [allocationSchema],
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cash', 'cheque', 'razorpay', 'credit_adjustment'],
      required: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      required: [true, 'Transaction reference/UTR number is required'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
