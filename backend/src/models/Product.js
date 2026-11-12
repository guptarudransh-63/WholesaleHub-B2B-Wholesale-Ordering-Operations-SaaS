import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
    },
    unitOfMeasurement: {
      type: String,
      enum: ['piece', 'carton', 'case', 'box', 'kg', 'pack', 'pallet', 'crate', 'bundle', 'roll'],
      default: 'case',
    },
    packSize: {
      type: String,
      default: 'Standard Pack',
    },
    basePrice: {
      type: Number,
      required: [true, 'Base wholesale price is required'],
      min: [0, 'Price must be positive'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price must be positive'],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Available stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative'],
    },
    minOrderQty: {
      type: Number,
      default: 1,
      min: [1, 'Minimum order quantity must be at least 1'],
    },
    orderQtyIncrement: {
      type: Number,
      default: 1,
      min: [1, 'Order quantity increment must be at least 1'],
    },
    maxOrderQty: {
      type: Number,
      default: 10000,
    },
    taxRate: {
      type: Number,
      enum: [0, 5, 12, 18, 28],
      default: 18,
    },
    isTaxInclusive: {
      type: Boolean,
      default: false,
    },
    hsnCode: {
      type: String,
      default: '999999',
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'discontinued'],
      default: 'active',
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 20,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', sku: 'text', brand: 'text', description: 'text', category: 'text' });

export const Product = mongoose.model('Product', productSchema);
