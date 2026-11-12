import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RetailerProfile } from '../models/RetailerProfile.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to proceed.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_wholesalehub_2026_enterprise_b2b'
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;

    // If user is a retailer, attach their RetailerProfile
    if (user.role === 'retailer') {
      const retailerProfile = await RetailerProfile.findOne({ user: user._id });
      req.retailerProfile = retailerProfile;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

export const requireApprovedRetailer = (req, res, next) => {
  if (req.user?.role === 'admin') return next();

  if (!req.retailerProfile) {
    return res.status(403).json({
      success: false,
      message: 'Retailer profile not found for this account.',
    });
  }

  if (req.retailerProfile.approvalStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      approvalStatus: req.retailerProfile.approvalStatus,
      message: `Your account is currently '${req.retailerProfile.approvalStatus}'. An administrator must approve your business verification before you can view custom wholesale pricing or place orders.`,
    });
  }

  next();
};
