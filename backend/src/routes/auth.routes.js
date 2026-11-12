import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RetailerProfile } from '../models/RetailerProfile.js';
import { Cart } from '../models/Cart.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_wholesalehub_2026_enterprise_b2b',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new retailer account
router.post('/register', async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      businessName,
      contactPerson,
      gstin,
      businessType,
      street,
      city,
      state,
      postalCode,
      country = 'India',
    } = req.body;

    if (!email || !password || !businessName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required business and login fields.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Create User
    const user = await User.create({
      name: name || contactPerson,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'retailer',
      status: 'pending', // Requires admin approval
    });

    // Create Retailer Profile
    const profile = await RetailerProfile.create({
      user: user._id,
      businessName,
      contactPerson: contactPerson || name,
      phone,
      email: email.toLowerCase(),
      gstin: gstin ? gstin.toUpperCase().trim() : '',
      businessType: businessType || 'Retail Store',
      billingAddress: {
        street: street || 'Commercial Complex',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        postalCode: postalCode || '400001',
        country,
        phone,
      },
      shippingAddresses: [
        {
          street: street || 'Commercial Complex',
          city: city || 'Mumbai',
          state: state || 'Maharashtra',
          postalCode: postalCode || '400001',
          country,
          phone,
          label: 'Primary Delivery Location',
          isDefault: true,
        },
      ],
      retailerGroup: 'standard',
      creditLimit: 0,
      availableCredit: 0,
      outstandingBalance: 0,
      paymentTerms: 'advance',
      approvalStatus: 'pending',
    });

    // Initialize Empty Cart
    await Cart.create({
      retailer: profile._id,
      items: [],
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      retailerProfile: profile,
      message: 'Retailer account registered successfully. Verification is pending administrator review.',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & return token
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    let retailerProfile = null;
    if (user.role === 'retailer') {
      retailerProfile = await RetailerProfile.findOne({ user: user._id });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      retailerProfile,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res, next) => {
  try {
    let retailerProfile = null;
    if (req.user.role === 'retailer') {
      retailerProfile = await RetailerProfile.findOne({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        phone: req.user.phone,
      },
      retailerProfile,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
