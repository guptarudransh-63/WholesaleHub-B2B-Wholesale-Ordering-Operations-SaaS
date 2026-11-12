import express from 'express';
import jwt from 'jsonwebtoken';
import { Product } from '../models/Product.js';
import { RetailerProfile } from '../models/RetailerProfile.js';
import { User } from '../models/User.js';
import { getRetailerCatalogPrices, calculateItemPrice } from '../services/pricingEngine.js';
import { PricingRule } from '../models/PricingRule.js';

const router = express.Router();

// Helper to optionally resolve retailer from token without blocking public browse
const resolveOptionalRetailer = async (req) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_wholesalehub_2026_enterprise_b2b');
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'retailer') return null;

    return await RetailerProfile.findOne({ user: user._id });
  } catch (e) {
    return null;
  }
};

// @route   GET /api/products
// @desc    Get published products with personalized pricing
router.get('/', async (req, res, next) => {
  try {
    const { category, search, brand, inStock, page = 1, limit = 50, sort = 'featured' } = req.query;

    const query = { status: 'active' };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (brand && brand !== 'All') {
      query.brand = brand;
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions = { featured: -1, createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { basePrice: 1 };
    if (sort === 'price_desc') sortOptions = { basePrice: -1 };
    if (sort === 'name_asc') sortOptions = { name: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const retailerProfile = await resolveOptionalRetailer(req);

    // Apply pricing engine if retailer is authenticated and approved
    let processedProducts = products;
    if (retailerProfile && retailerProfile.approvalStatus === 'approved') {
      processedProducts = await getRetailerCatalogPrices(products, retailerProfile);
    } else {
      // Return base pricing with volume tiers attached
      processedProducts = await Promise.all(
        products.map(async (p) => {
          const tiers = await PricingRule.find({
            product: p._id,
            ruleType: 'volume_tier',
            isActive: true,
          });
          return {
            ...p.toObject(),
            calculatedPrice: p.basePrice,
            pricingType: 'base_wholesale',
            volumeTiers: tiers.length > 0 && tiers[0].volumeTiers ? tiers[0].volumeTiers : [],
          };
        })
      );
    }

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      retailerTier: retailerProfile?.retailerGroup || 'guest',
      data: processedProducts,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/categories
// @desc    Get all distinct categories with counts
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categories.map((c) => ({ name: c._id, count: c.count })),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product details with pricing rule resolution
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const retailerProfile = await resolveOptionalRetailer(req);
    const pricingCalculation = await calculateItemPrice({
      product,
      quantity: product.minOrderQty || 1,
      retailerProfile,
    });

    const volumeRules = await PricingRule.find({
      product: product._id,
      ruleType: 'volume_tier',
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        pricing: pricingCalculation,
        volumeTiers: volumeRules.length > 0 && volumeRules[0].volumeTiers ? volumeRules[0].volumeTiers : [],
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
