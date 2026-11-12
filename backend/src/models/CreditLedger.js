import mongoose from 'mongoose';

const creditLedgerSchema = new mongoose.Schema(
  {
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RetailerProfile',
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        'credit_limit_set',
        'order_charge',
        'payment_received',
        'order_cancelled',
        'manual_adjustment',
      ],
      required: true,
      index: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    }, // Increases outstanding debt
    credit: {
      type: Number,
      default: 0,
      min: 0,
    }, // Decreases outstanding debt (e.g. payment made or cancellation refund)
    balanceAfter: {
      type: Number,
      required: true,
    },
    availableCreditAfter: {
      type: Number,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

creditLedgerSchema.index({ createdAt: -1 });

export const CreditLedger = mongoose.model('CreditLedger', creditLedgerSchema);
