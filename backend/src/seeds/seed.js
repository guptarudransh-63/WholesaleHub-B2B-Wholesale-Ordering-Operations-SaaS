import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';
import { RetailerProfile } from '../models/RetailerProfile.js';
import { Product } from '../models/Product.js';
import { PricingRule } from '../models/PricingRule.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { CreditLedger } from '../models/CreditLedger.js';
import { InventoryMovement } from '../models/InventoryMovement.js';

import { sampleProducts } from './seedData.js';
import { recalculateRetailerCredit } from '../services/creditService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wholesalehub';

async function seedDatabase() {
  console.log(`\n======================================================`);
  console.log(`🌱 Seeding WholesaleHub B2B SaaS Database...`);
  console.log(`📡 Connecting to: ${MONGODB_URI}`);
  console.log(`======================================================\n`);

  await mongoose.connect(MONGODB_URI);

  // 1. Clear existing collections
  console.log('🧹 Purging existing collections...');
  await Promise.all([
    User.deleteMany({}),
    RetailerProfile.deleteMany({}),
    Product.deleteMany({}),
    PricingRule.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    CreditLedger.deleteMany({}),
    InventoryMovement.deleteMany({}),
  ]);

  // 2. Create Administrator Account
  console.log('👤 Creating Administrator and Staff accounts...');
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const retailerPassword = await bcrypt.hash('Retailer@123456', 10);

  const admin = await User.create({
    name: 'Rajesh Sharma (Operations VP)',
    email: 'admin@wholesalehub.io',
    password: adminPassword,
    role: 'admin',
    status: 'approved',
    phone: '+91 98100 23456',
  });

  // 3. Create Retailer Users & Profiles
  console.log('🏬 Creating Retailer Accounts across all tiers and regions...');

  // Retailer 1: Platinum - Apex Hypermarkets (Mumbai)
  const u1 = await User.create({
    name: 'Vikramaditya Singhania',
    email: 'platinum.retailer@supermart.com',
    password: retailerPassword,
    role: 'retailer',
    status: 'approved',
    phone: '+91 98201 11223',
  });

  const p1 = await RetailerProfile.create({
    user: u1._id,
    businessName: 'Apex Hypermarkets & Superstores Pvt Ltd',
    contactPerson: 'Vikramaditya Singhania',
    phone: '+91 98201 11223',
    email: 'platinum.retailer@supermart.com',
    gstin: '27AABCA1234F1Z5',
    businessType: 'Supermarket',
    billingAddress: {
      street: 'Tower 4, Bandra Kurla Complex, G-Block',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400051',
      country: 'India',
      phone: '+91 98201 11223',
    },
    shippingAddresses: [
      {
        street: 'Central Distribution Hub, Warehouse 12, Bhiwandi',
        city: 'Thane',
        state: 'Maharashtra',
        postalCode: '421302',
        country: 'India',
        phone: '+91 98201 11224',
        label: 'Bhiwandi Central Warehouse',
        isDefault: true,
      },
    ],
    retailerGroup: 'platinum',
    creditLimit: 500000,
    availableCredit: 500000,
    outstandingBalance: 0,
    paymentTerms: 'net_30',
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: admin._id,
  });

  // Retailer 2: Gold - Metro Regional Wholesale (Bengaluru)
  const u2 = await User.create({
    name: 'Ananya Deshmukh',
    email: 'gold.retailer@metrofmcg.in',
    password: retailerPassword,
    role: 'retailer',
    status: 'approved',
    phone: '+91 98765 43210',
  });

  const p2 = await RetailerProfile.create({
    user: u2._id,
    businessName: 'Metro Regional Wholesale & FMCG Mart',
    contactPerson: 'Ananya Deshmukh',
    phone: '+91 98765 43210',
    email: 'gold.retailer@metrofmcg.in',
    gstin: '29ABCDE5678G2Z1',
    businessType: 'Regional Distributor',
    billingAddress: {
      street: '7th Cross, Peenya Industrial Area Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560058',
      country: 'India',
      phone: '+91 98765 43210',
    },
    retailerGroup: 'gold',
    creditLimit: 250000,
    availableCredit: 250000,
    outstandingBalance: 0,
    paymentTerms: 'net_15',
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: admin._id,
  });

  // Retailer 3: Silver - City Grocers (Delhi)
  const u3 = await User.create({
    name: 'Rohan Mehra',
    email: 'silver.retailer@citygrocery.com',
    password: retailerPassword,
    role: 'retailer',
    status: 'approved',
    phone: '+91 99112 33445',
  });

  const p3 = await RetailerProfile.create({
    user: u3._id,
    businessName: 'City Grocers & Convenience Store',
    contactPerson: 'Rohan Mehra',
    phone: '+91 99112 33445',
    email: 'silver.retailer@citygrocery.com',
    gstin: '07AAACR9081P1ZP',
    businessType: 'Retail Store',
    billingAddress: {
      street: 'Shop 18, Block M, Greater Kailash 2',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110048',
      country: 'India',
      phone: '+91 99112 33445',
    },
    retailerGroup: 'silver',
    creditLimit: 100000,
    availableCredit: 100000,
    outstandingBalance: 0,
    paymentTerms: 'net_7',
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: admin._id,
  });

  // Retailer 4: Pending - FreshBazaar (Gurugram)
  const u4 = await User.create({
    name: 'Sunil Verma',
    email: 'pending.retailer@freshbazaar.org',
    password: retailerPassword,
    role: 'retailer',
    status: 'pending',
    phone: '+91 97110 55667',
  });

  const p4 = await RetailerProfile.create({
    user: u4._id,
    businessName: 'FreshBazaar Retail Ventures',
    contactPerson: 'Sunil Verma',
    phone: '+91 97110 55667',
    email: 'pending.retailer@freshbazaar.org',
    gstin: '06AAEFF9988K1ZQ',
    businessType: 'FMCG Retailer',
    billingAddress: {
      street: 'SCO 45, Sector 14',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122001',
      country: 'India',
      phone: '+91 97110 55667',
    },
    retailerGroup: 'standard',
    creditLimit: 0,
    availableCredit: 0,
    outstandingBalance: 0,
    paymentTerms: 'advance',
    approvalStatus: 'pending',
  });

  // Retailer 5: Platinum - Titan Mega Retail (Bengaluru)
  const u5 = await User.create({
    name: 'Harish Vardhan',
    email: 'platinum2.retailer@titanretail.com',
    password: retailerPassword,
    role: 'retailer',
    status: 'approved',
    phone: '+91 98450 77889',
  });

  const p5 = await RetailerProfile.create({
    user: u5._id,
    businessName: 'Titan Mega Retail Stores Pvt Ltd',
    contactPerson: 'Harish Vardhan',
    phone: '+91 98450 77889',
    email: 'platinum2.retailer@titanretail.com',
    gstin: '29AAACT9812M1ZK',
    businessType: 'Supermarket',
    billingAddress: {
      street: 'Brigade Gateway Campus, 26/1 Dr. Rajkumar Road, Malleshwaram',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560055',
      country: 'India',
      phone: '+91 98450 77889',
    },
    shippingAddresses: [
      {
        street: 'Titan Logistic Park, Plot 88, Nelamangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '562123',
        country: 'India',
        phone: '+91 98450 77890',
        label: 'Nelamangala Distribution Centre',
        isDefault: true,
      },
    ],
    retailerGroup: 'platinum',
    creditLimit: 800000,
    availableCredit: 800000,
    outstandingBalance: 0,
    paymentTerms: 'net_30',
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: admin._id,
  });

  // Retailer 6: Gold - Zenith Provision & Departmental (Hyderabad)
  const u6 = await User.create({
    name: 'Sridevi Reddy',
    email: 'gold2.retailer@zenithstores.in',
    password: retailerPassword,
    role: 'retailer',
    status: 'approved',
    phone: '+91 99490 33441',
  });

  const p6 = await RetailerProfile.create({
    user: u6._id,
    businessName: 'Zenith Provision & Departmental Stores',
    contactPerson: 'Sridevi Reddy',
    phone: '+91 99490 33441',
    email: 'gold2.retailer@zenithstores.in',
    gstin: '36AAECZ4432Q1Z9',
    businessType: 'Regional Distributor',
    billingAddress: {
      street: 'Road No 36, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500033',
      country: 'India',
      phone: '+91 99490 33441',
    },
    retailerGroup: 'gold',
    creditLimit: 350000,
    availableCredit: 350000,
    outstandingBalance: 0,
    paymentTerms: 'net_15',
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: admin._id,
  });

  // Retailer 7: Silver - Kalyan Daily Essentials (Ahmedabad)
  const u7 = await User.create({
    name: 'Chirag Patel',
    email: 'silver2.retailer@kalyangrocery.in',
    password: retailerPassword,
    role: 'retailer',
    status: 'approved',
    phone: '+91 98980 12345',
  });

  const p7 = await RetailerProfile.create({
    user: u7._id,
    businessName: 'Kalyan Daily Essentials & Provisions',
    contactPerson: 'Chirag Patel',
    phone: '+91 98980 12345',
    email: 'silver2.retailer@kalyangrocery.in',
    gstin: '24AAGCK1239P1ZD',
    businessType: 'Retail Store',
    billingAddress: {
      street: 'Shop 12-14, Navrangpura Commercial Complex',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380009',
      country: 'India',
      phone: '+91 98980 12345',
    },
    retailerGroup: 'silver',
    creditLimit: 150000,
    availableCredit: 150000,
    outstandingBalance: 0,
    paymentTerms: 'net_7',
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: admin._id,
  });

  // Retailer 8: Standard - Sunrise Cash & Carry (Kolkata)
  const u8 = await User.create({
    name: 'Subhashis Bose',
    email: 'standard.retailer@sunrisemart.com',
    password: retailerPassword,
    role: 'retailer',
    status: 'approved',
    phone: '+91 98310 99881',
  });

  const p8 = await RetailerProfile.create({
    user: u8._id,
    businessName: 'Sunrise Cash & Carry Outlets',
    contactPerson: 'Subhashis Bose',
    phone: '+91 98310 99881',
    email: 'standard.retailer@sunrisemart.com',
    gstin: '19AAHCS8821F1ZX',
    businessType: 'General Merchant',
    billingAddress: {
      street: 'Block EP & GP, Sector V, Salt Lake City',
      city: 'Kolkata',
      state: 'West Bengal',
      postalCode: '700091',
      country: 'India',
      phone: '+91 98310 99881',
    },
    retailerGroup: 'standard',
    creditLimit: 0,
    availableCredit: 0,
    outstandingBalance: 0,
    paymentTerms: 'advance',
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: admin._id,
  });

  // Retailer 9: Rejected - Horizon Retail Network (Lucknow)
  const u9 = await User.create({
    name: 'Amit Tandon',
    email: 'rejected.retailer@horizon.com',
    password: retailerPassword,
    role: 'retailer',
    status: 'rejected',
    phone: '+91 94150 22334',
  });

  const p9 = await RetailerProfile.create({
    user: u9._id,
    businessName: 'Horizon Retail Network',
    contactPerson: 'Amit Tandon',
    phone: '+91 94150 22334',
    email: 'rejected.retailer@horizon.com',
    gstin: '09AAFFH1122K1Z4',
    businessType: 'FMCG Retailer',
    billingAddress: {
      street: 'Hazratganj Main Market',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      postalCode: '226001',
      country: 'India',
      phone: '+91 94150 22334',
    },
    retailerGroup: 'standard',
    creditLimit: 0,
    availableCredit: 0,
    outstandingBalance: 0,
    paymentTerms: 'advance',
    approvalStatus: 'rejected',
    internalNotes: 'Trade license verification mismatch; GSTIN portal indicates inactive registration.',
  });

  // Retailer 10: Suspended - QuickMart Outlets (Pune)
  const u10 = await User.create({
    name: 'Mahesh Joshi',
    email: 'suspended.retailer@quickmart.com',
    password: retailerPassword,
    role: 'retailer',
    status: 'suspended',
    phone: '+91 98220 55661',
  });

  const p10 = await RetailerProfile.create({
    user: u10._id,
    businessName: 'QuickMart Outlets',
    contactPerson: 'Mahesh Joshi',
    phone: '+91 98220 55661',
    email: 'suspended.retailer@quickmart.com',
    gstin: '27AABCQ9944M1Z2',
    businessType: 'Retail Store',
    billingAddress: {
      street: 'FC Road, Shivajinagar',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411005',
      country: 'India',
      phone: '+91 98220 55661',
    },
    retailerGroup: 'standard',
    creditLimit: 50000,
    availableCredit: 0,
    outstandingBalance: 50000,
    paymentTerms: 'net_7',
    approvalStatus: 'suspended',
    internalNotes: 'Account suspended by Finance due to persistent payment defaults beyond 60 days.',
  });

  // Initialize carts for all retailers
  for (const prof of [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10]) {
    await Cart.create({ retailer: prof._id, items: [] });
  }

  // Record initial credit facility ledgers
  for (const prof of [p1, p2, p3, p5, p6, p7, p10]) {
    if (prof.creditLimit > 0) {
      await CreditLedger.create({
        retailer: prof._id,
        transactionType: 'credit_limit_set',
        debit: 0,
        credit: 0,
        balanceAfter: 0,
        availableCreditAfter: prof.creditLimit,
        referenceNumber: `FAC-${prof.retailerGroup.toUpperCase()}-2026`,
        note: `Approved credit facility of ₹${prof.creditLimit.toLocaleString('en-IN')} with ${prof.paymentTerms.replace('_', ' ').toUpperCase()} terms`,
        actor: admin._id,
      });
    }
  }

  // 4. Seed Products
  console.log(`📦 Seeding Catalogue Products (${sampleProducts.length} wholesale SKUs)...`);
  const createdProducts = await Product.insertMany(sampleProducts);

  // Record initial stock movements
  for (const prod of createdProducts) {
    await InventoryMovement.create({
      product: prod._id,
      movementType: 'initial_stock',
      quantityChange: prod.stock,
      previousStock: 0,
      newStock: prod.stock,
      actor: admin._id,
      note: 'Initial catalogue import batch',
    });
  }

  // 5. Seed Pricing Rules
  console.log('🎯 Configuring Personalized Pricing Rules & Volume Tiers...');

  const getProd = (sku) => createdProducts.find((p) => p.sku === sku);

  const basmatiRice = getProd('FMCG-RICE-001');
  const espressoBeans = getProd('BEV-COFF-001');
  const corrugatedBoxes = getProd('PKG-BOX-001');
  const typeCCables = getProd('ELEC-CBL-001');
  const a2Ghee = getProd('FMCG-GHEE-006');
  const palletStretch = getProd('PKG-STR-004');
  const thermalLabels = getProd('PKG-LBL-006');
  const greenTea = getProd('BEV-GRN-005');
  const posRolls = getProd('GEN-POS-001');
  const copierPaper = getProd('GEN-PPR-003');

  // Rule 1: Apex Contract on Basmati Rice
  if (basmatiRice) {
    await PricingRule.create({
      ruleName: 'Apex Exclusive Supply Contract (Basmati 50kg)',
      ruleType: 'retailer_specific',
      product: basmatiRice._id,
      retailer: p1._id,
      fixedPrice: 3600, // Base is 4200
      priority: 10,
      isActive: true,
      notes: 'Annual negotiated contract rate signed Q1',
    });

    await PricingRule.create({
      ruleName: 'Bulk Volume Slab (Basmati Rice)',
      ruleType: 'volume_tier',
      product: basmatiRice._id,
      volumeTiers: [
        { minQty: 1, maxQty: 9, unitPrice: 4200, discountPercentage: 0 },
        { minQty: 10, maxQty: 24, unitPrice: 3950, discountPercentage: 5.95 },
        { minQty: 25, maxQty: 49, unitPrice: 3750, discountPercentage: 10.7 },
        { minQty: 50, maxQty: null, unitPrice: 3500, discountPercentage: 16.6 },
      ],
      priority: 5,
      isActive: true,
      notes: 'Tiered bulk pallet pricing',
    });
  }

  // Rule 2: Titan Mega Retail contract on Pallet Stretch Film and A2 Ghee
  if (palletStretch) {
    await PricingRule.create({
      ruleName: 'Titan Enterprise Contract (Stretch Film)',
      ruleType: 'retailer_specific',
      product: palletStretch._id,
      retailer: p5._id,
      fixedPrice: 2450, // Base is 2950
      priority: 10,
      isActive: true,
      notes: 'Titan Central Logistics distribution supply agreement',
    });
  }

  if (a2Ghee) {
    await PricingRule.create({
      ruleName: 'Titan Enterprise Contract (A2 Bilona Ghee)',
      ruleType: 'retailer_specific',
      product: a2Ghee._id,
      retailer: p5._id,
      fixedPrice: 9900, // Base is 11400
      priority: 10,
      isActive: true,
      notes: 'Key gourmet partner pricing',
    });

    // Platinum & Gold group tier on A2 Ghee
    await PricingRule.create({
      ruleName: 'Platinum Partner Discount - A2 Bilona Ghee',
      ruleType: 'retailer_group',
      product: a2Ghee._id,
      retailerGroup: 'platinum',
      discountPercentage: 10,
      priority: 8,
      isActive: true,
    });

    await PricingRule.create({
      ruleName: 'Gold Partner Discount - A2 Bilona Ghee',
      ruleType: 'retailer_group',
      product: a2Ghee._id,
      retailerGroup: 'gold',
      discountPercentage: 5,
      priority: 7,
      isActive: true,
    });
  }

  // Rule 3: Group Discounts on Espresso Beans & Green Tea
  if (espressoBeans) {
    await PricingRule.create({
      ruleName: 'Platinum Partner Discount - Espresso Blend',
      ruleType: 'retailer_group',
      product: espressoBeans._id,
      retailerGroup: 'platinum',
      discountPercentage: 12,
      priority: 8,
      isActive: true,
    });

    await PricingRule.create({
      ruleName: 'Gold Partner Discount - Espresso Blend',
      ruleType: 'retailer_group',
      product: espressoBeans._id,
      retailerGroup: 'gold',
      discountPercentage: 7,
      priority: 7,
      isActive: true,
    });
  }

  if (greenTea) {
    await PricingRule.create({
      ruleName: 'Platinum Partner Discount - Darjeeling Green Tea',
      ruleType: 'retailer_group',
      product: greenTea._id,
      retailerGroup: 'platinum',
      discountPercentage: 10,
      priority: 8,
      isActive: true,
    });
  }

  // Rule 4: Volume Tiers on Packaging & Stationery
  if (corrugatedBoxes) {
    await PricingRule.create({
      ruleName: 'Logistics Volume Tier (Shipping Boxes)',
      ruleType: 'volume_tier',
      product: corrugatedBoxes._id,
      volumeTiers: [
        { minQty: 1, maxQty: 19, unitPrice: 1750, discountPercentage: 0 },
        { minQty: 20, maxQty: 49, unitPrice: 1550, discountPercentage: 11.4 },
        { minQty: 50, maxQty: null, unitPrice: 1380, discountPercentage: 21.1 },
      ],
      priority: 5,
      isActive: true,
    });
  }

  if (thermalLabels) {
    await PricingRule.create({
      ruleName: 'Bulk Tier (Direct Thermal Shipping Labels 4x6)',
      ruleType: 'volume_tier',
      product: thermalLabels._id,
      volumeTiers: [
        { minQty: 1, maxQty: 9, unitPrice: 2400, discountPercentage: 0 },
        { minQty: 10, maxQty: 24, unitPrice: 2160, discountPercentage: 10 },
        { minQty: 25, maxQty: null, unitPrice: 1920, discountPercentage: 20 },
      ],
      priority: 5,
      isActive: true,
    });
  }

  if (posRolls) {
    await PricingRule.create({
      ruleName: 'POS Thermal Roll High-Volume Tier',
      ruleType: 'volume_tier',
      product: posRolls._id,
      volumeTiers: [
        { minQty: 1, maxQty: 9, unitPrice: 2250, discountPercentage: 0 },
        { minQty: 10, maxQty: 24, unitPrice: 2025, discountPercentage: 10 },
        { minQty: 25, maxQty: null, unitPrice: 1800, discountPercentage: 20 },
      ],
      priority: 5,
      isActive: true,
    });
  }

  if (copierPaper) {
    await PricingRule.create({
      ruleName: 'Paper Mills Bulk Tier (A4 Copier Paper)',
      ruleType: 'volume_tier',
      product: copierPaper._id,
      volumeTiers: [
        { minQty: 1, maxQty: 9, unitPrice: 2900, discountPercentage: 0 },
        { minQty: 10, maxQty: 24, unitPrice: 2610, discountPercentage: 10 },
        { minQty: 25, maxQty: null, unitPrice: 2320, discountPercentage: 20 },
      ],
      priority: 5,
      isActive: true,
    });
  }

  if (typeCCables) {
    await PricingRule.create({
      ruleName: 'Tiered Cable Discount for Platinum Partners',
      ruleType: 'retailer_group',
      product: typeCCables._id,
      retailerGroup: 'platinum',
      fixedPrice: 6500, // Base is 7500
      priority: 8,
      isActive: true,
    });
  }

  // 6. Helper for Creating Realistic Orders, Invoices, Payments, and Ledger
  console.log('📜 Generating Historical Orders, Invoices, and Payment Ledgers...');

  async function createSeedOrder({
    orderNumber,
    retailerProfile,
    user,
    items, // array of { product, quantity, appliedUnitPrice, pricingType, pricingRuleName }
    daysAgo,
    orderStatus,
    paymentStatus,
    paymentMethod,
    paymentTerms,
    paidAmount = 0,
    trackingCarrier,
    trackingNumber,
    cancelReason,
  }) {
    const orderDate = new Date(Date.now() - daysAgo * 86400000);

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const processedItems = items.map((item) => {
      const prod = item.product;
      const basePrice = prod.basePrice;
      const unitPrice = item.appliedUnitPrice ?? basePrice;
      const discountPerUnit = Math.max(0, basePrice - unitPrice);
      const lineSubtotal = Number((unitPrice * item.quantity).toFixed(2));
      const taxRate = prod.taxRate;
      const taxAmount = Number(((lineSubtotal * taxRate) / 100).toFixed(2));
      const lineTotal = Number((lineSubtotal + taxAmount).toFixed(2));

      subtotal += lineSubtotal;
      totalDiscount += Number((discountPerUnit * item.quantity).toFixed(2));
      totalTax += taxAmount;

      return {
        product: prod._id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category,
        unitOfMeasurement: prod.unitOfMeasurement,
        packSize: prod.packSize,
        quantity: item.quantity,
        basePrice,
        appliedUnitPrice: unitPrice,
        pricingType: item.pricingType || (discountPerUnit > 0 ? 'retailer_group' : 'base_wholesale'),
        pricingRuleName: item.pricingRuleName || (discountPerUnit > 0 ? 'Tier Discount' : null),
        discountPerUnit,
        taxRate,
        taxAmount,
        subtotal: lineSubtotal,
        total: lineTotal,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    totalDiscount = Number(totalDiscount.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));
    const grandTotal = Number((subtotal + totalTax).toFixed(2));

    const timeline = [
      { status: 'Order Placed', note: `Requisition submitted via ${paymentTerms}`, actor: user.name, timestamp: orderDate },
    ];
    if (['confirmed', 'processing', 'packed', 'dispatched', 'delivered'].includes(orderStatus)) {
      timeline.push({ status: 'Confirmed', note: 'Purchase requisition confirmed by sales desk', actor: admin.name, timestamp: new Date(orderDate.getTime() + 4 * 3600000) });
    }
    if (['processing', 'packed', 'dispatched', 'delivered'].includes(orderStatus)) {
      timeline.push({ status: 'Processing', note: 'Order routed to regional fulfillment facility', actor: 'Warehouse Ops', timestamp: new Date(orderDate.getTime() + 10 * 3600000) });
    }
    if (['packed', 'dispatched', 'delivered'].includes(orderStatus)) {
      timeline.push({ status: 'Packed', note: 'Cartons barcoded, strapped and palletized', actor: 'Packing Staging', timestamp: new Date(orderDate.getTime() + 18 * 3600000) });
    }
    if (['dispatched', 'delivered'].includes(orderStatus)) {
      timeline.push({ status: 'Dispatched', note: `Handed over to carrier: ${trackingCarrier || 'BlueDart Express'}`, actor: 'Dispatch Officer', timestamp: new Date(orderDate.getTime() + 26 * 3600000) });
    }
    if (orderStatus === 'delivered') {
      timeline.push({ status: 'Delivered', note: 'Consignment verified and receipt stamped at dock', actor: 'Logistics', timestamp: new Date(orderDate.getTime() + 46 * 3600000) });
    }
    if (orderStatus === 'cancelled') {
      timeline.push({ status: 'Cancelled', note: cancelReason || 'Order cancelled by customer before dispatch', actor: user.name, timestamp: new Date(orderDate.getTime() + 6 * 3600000) });
    }

    const trackingInfo = trackingNumber
      ? {
          carrier: trackingCarrier || 'BlueDart Apex Freight',
          trackingNumber,
          dispatchedAt: new Date(orderDate.getTime() + 26 * 3600000),
          estimatedDelivery: new Date(orderDate.getTime() + 48 * 3600000),
          actualDelivery: orderStatus === 'delivered' ? new Date(orderDate.getTime() + 46 * 3600000) : null,
        }
      : undefined;

    const order = await Order.create({
      orderNumber,
      retailer: retailerProfile._id,
      items: processedItems,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      paymentTerms,
      paymentMethod,
      paymentStatus,
      orderStatus,
      shippingAddress: retailerProfile.shippingAddresses?.[0] || retailerProfile.billingAddress,
      billingAddress: retailerProfile.billingAddress,
      trackingInfo,
      timeline,
      createdAt: orderDate,
      updatedAt: orderDate,
    });

    // Invoice calculation
    let termDays = 0;
    if (paymentTerms === 'net_30') termDays = 30;
    else if (paymentTerms === 'net_15') termDays = 15;
    else if (paymentTerms === 'net_7') termDays = 7;
    const dueDate = new Date(orderDate.getTime() + termDays * 86400000);

    const invoiceNumber = `INV-${orderNumber.replace('WH-ORD-', '')}`;
    const invStatus = orderStatus === 'cancelled'
      ? 'cancelled'
      : paymentStatus === 'paid'
      ? 'paid'
      : paymentStatus === 'partially_paid'
      ? 'partially_paid'
      : dueDate < new Date()
      ? 'overdue'
      : 'unpaid';

    const outstandingAmount = invStatus === 'paid' || invStatus === 'cancelled'
      ? 0
      : Number((grandTotal - paidAmount).toFixed(2));

    const invoice = await Invoice.create({
      invoiceNumber,
      order: order._id,
      retailer: retailerProfile._id,
      invoiceDate: orderDate,
      dueDate,
      items: processedItems.map((i) => ({
        product: i.product,
        name: i.name,
        sku: i.sku,
        unitOfMeasurement: i.unitOfMeasurement,
        quantity: i.quantity,
        unitPrice: i.appliedUnitPrice,
        discount: Number((i.discountPerUnit * i.quantity).toFixed(2)),
        taxRate: i.taxRate,
        taxableAmount: i.subtotal,
        cgstAmount: Number((i.taxAmount / 2).toFixed(2)),
        sgstAmount: Number((i.taxAmount / 2).toFixed(2)),
        totalTax: i.taxAmount,
        totalAmount: i.total,
      })),
      subtotal,
      discountTotal: totalDiscount,
      taxBreakdown: {
        taxableAmount: subtotal,
        cgstTotal: Number((totalTax / 2).toFixed(2)),
        sgstTotal: Number((totalTax / 2).toFixed(2)),
        totalTax,
      },
      grandTotal,
      paidAmount,
      outstandingAmount,
      status: invStatus,
      paymentTerms,
      createdAt: orderDate,
    });

    order.invoiceGenerated = true;
    order.invoiceId = invoice._id;
    await order.save();

    // Credit ledger charge for credit orders
    if (paymentMethod === 'credit' && orderStatus !== 'cancelled') {
      await CreditLedger.create({
        retailer: retailerProfile._id,
        transactionType: 'order_charge',
        debit: grandTotal,
        credit: 0,
        balanceAfter: grandTotal,
        availableCreditAfter: Math.max(0, (retailerProfile.creditLimit || 0) - grandTotal),
        order: order._id,
        invoice: invoice._id,
        referenceNumber: orderNumber,
        note: `Order requisition debit on ${paymentTerms}`,
        actor: admin._id,
        createdAt: orderDate,
      });
    }

    // Payment creation
    if (paidAmount > 0 && invStatus !== 'cancelled') {
      const payNum = `WH-PAY-${orderNumber.replace('WH-ORD-', '')}`;
      const paymentDate = new Date(orderDate.getTime() + Math.min(termDays, 4) * 86400000);
      const payDoc = await Payment.create({
        paymentNumber: payNum,
        retailer: retailerProfile._id,
        totalAmount: paidAmount,
        allocations: [{ invoice: invoice._id, invoiceNumber, amountAllocated: paidAmount }],
        paymentMethod: paymentMethod === 'credit' ? 'bank_transfer' : paymentMethod,
        transactionReference: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paymentDate,
        status: 'completed',
        recordedBy: admin._id,
        notes: `Remittance received for ${invoiceNumber}`,
      });

      if (paymentMethod === 'credit') {
        await CreditLedger.create({
          retailer: retailerProfile._id,
          transactionType: 'payment_received',
          debit: 0,
          credit: paidAmount,
          balanceAfter: Number(Math.max(0, grandTotal - paidAmount).toFixed(2)),
          availableCreditAfter: Math.min(retailerProfile.creditLimit || 0, (retailerProfile.creditLimit || 0) - Math.max(0, grandTotal - paidAmount)),
          payment: payDoc._id,
          invoice: invoice._id,
          referenceNumber: payNum,
          note: `Remittance allocation against invoice ${invoiceNumber}`,
          actor: admin._id,
          createdAt: paymentDate,
        });
      }
    }

    if (orderStatus === 'cancelled') {
      await CreditLedger.create({
        retailer: retailerProfile._id,
        transactionType: 'order_cancelled',
        debit: 0,
        credit: grandTotal,
        balanceAfter: 0,
        availableCreditAfter: retailerProfile.creditLimit || 0,
        order: order._id,
        invoice: invoice._id,
        referenceNumber: orderNumber,
        note: `Order cancellation credit reversal: ${cancelReason || 'Cancelled before dispatch'}`,
        actor: admin._id,
        createdAt: new Date(orderDate.getTime() + 6 * 3600000),
      });
    }

    // Adjust product stock and record movement
    if (orderStatus !== 'cancelled') {
      for (const item of processedItems) {
        const prodDoc = await Product.findById(item.product);
        const prevStock = prodDoc ? prodDoc.stock : 100;
        const nextStock = Math.max(0, prevStock - item.quantity);
        if (prodDoc) {
          prodDoc.stock = nextStock;
          await prodDoc.save();
        }
        await InventoryMovement.create({
          product: item.product,
          movementType: 'order_fulfillment',
          quantityChange: -item.quantity,
          previousStock: prevStock,
          newStock: nextStock,
          order: order._id,
          actor: admin._id,
          note: `Fulfilled for ${orderNumber}`,
        });
      }
    }

    return { order, invoice };
  }

  // --- Seed Orders 1 to 16 ---

  // Order 1: Apex Hypermarkets (Delivered & Paid 25 days ago)
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1001',
    retailerProfile: p1,
    user: u1,
    items: [
      { product: basmatiRice, quantity: 20, appliedUnitPrice: 3600, pricingType: 'retailer_specific', pricingRuleName: 'Apex Exclusive Supply Contract' },
      { product: espressoBeans, quantity: 5, appliedUnitPrice: 6864, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
    ],
    daysAgo: 25,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'credit',
    paymentTerms: 'net_30',
    paidAmount: 116097.6,
    trackingCarrier: 'BlueDart Apex Freight',
    trackingNumber: 'BD-9988220194',
  });

  // Order 2: Metro FMCG (Dispatched & Unpaid 5 days ago)
  const mustardOil = getProd('FMCG-OIL-002');
  const sugar = getProd('FMCG-SUG-003');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1002',
    retailerProfile: p2,
    user: u2,
    items: [
      { product: mustardOil, quantity: 20, appliedUnitPrice: 1881, pricingType: 'retailer_group', pricingRuleName: 'Gold Tier Discount' },
      { product: sugar, quantity: 10, appliedUnitPrice: 2042.5, pricingType: 'retailer_group', pricingRuleName: 'Gold Tier Discount' },
    ],
    daysAgo: 5,
    orderStatus: 'dispatched',
    paymentStatus: 'unpaid',
    paymentMethod: 'credit',
    paymentTerms: 'net_15',
    paidAmount: 0,
    trackingCarrier: 'Delhivery Surface Pro',
    trackingNumber: 'DEL-209930184',
  });

  // Order 3: City Grocers (Delivered & Overdue 14 days ago, partial 10,000 paid)
  const tea = getProd('BEV-TEA-002');
  const lentils = getProd('FMCG-DAL-005');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1003',
    retailerProfile: p3,
    user: u3,
    items: [
      { product: tea, quantity: 5, appliedUnitPrice: 3332, pricingType: 'retailer_group', pricingRuleName: 'Silver Tier Discount' },
      { product: lentils, quantity: 6, appliedUnitPrice: 2156, pricingType: 'retailer_group', pricingRuleName: 'Silver Tier Discount' },
    ],
    daysAgo: 14,
    orderStatus: 'delivered',
    paymentStatus: 'overdue',
    paymentMethod: 'credit',
    paymentTerms: 'net_7',
    paidAmount: 10000,
    trackingCarrier: 'SafeExpress Road Cargo',
    trackingNumber: 'SE-88221948',
  });

  // Order 4: Titan Mega Retail (Delivered & Paid 18 days ago)
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1004',
    retailerProfile: p5,
    user: u5,
    items: [
      { product: a2Ghee, quantity: 15, appliedUnitPrice: 9900, pricingType: 'retailer_specific', pricingRuleName: 'Titan Enterprise Contract' },
      { product: palletStretch, quantity: 20, appliedUnitPrice: 2450, pricingType: 'retailer_specific', pricingRuleName: 'Titan Enterprise Contract' },
      { product: thermalLabels, quantity: 15, appliedUnitPrice: 2160, pricingType: 'volume_tier', pricingRuleName: 'Bulk Tier Labels' },
    ],
    daysAgo: 18,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'credit',
    paymentTerms: 'net_30',
    paidAmount: 268686,
    trackingCarrier: 'TCI Freight Logistics',
    trackingNumber: 'TCI-554422110',
  });

  // Order 5: Titan Mega Retail (Active Processing 1 day ago)
  const wheatFlour = getProd('FMCG-ATTA-004');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1005',
    retailerProfile: p5,
    user: u5,
    items: [
      { product: wheatFlour, quantity: 40, appliedUnitPrice: 1850, pricingType: 'base_wholesale' },
      { product: mustardOil, quantity: 25, appliedUnitPrice: 1782, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
      { product: corrugatedBoxes, quantity: 30, appliedUnitPrice: 1550, pricingType: 'volume_tier', pricingRuleName: 'Logistics Volume Tier' },
    ],
    daysAgo: 1,
    orderStatus: 'processing',
    paymentStatus: 'unpaid',
    paymentMethod: 'credit',
    paymentTerms: 'net_30',
    paidAmount: 0,
  });

  // Order 6: Apex Hypermarkets (Active Confirmed 2 days ago)
  const dryFruits = getProd('FMCG-DRY-008');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1006',
    retailerProfile: p1,
    user: u1,
    items: [
      { product: dryFruits, quantity: 12, appliedUnitPrice: 8010, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
      { product: greenTea, quantity: 8, appliedUnitPrice: 4410, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
      { product: getProd('PKG-BUB-003'), quantity: 10, appliedUnitPrice: 2205, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
    ],
    daysAgo: 2,
    orderStatus: 'confirmed',
    paymentStatus: 'unpaid',
    paymentMethod: 'credit',
    paymentTerms: 'net_30',
    paidAmount: 0,
  });

  // Order 7: Zenith Provision Stores (Delivered & Paid 10 days ago)
  const handwash = getProd('HYG-WASH-001');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1007',
    retailerProfile: p6,
    user: u6,
    items: [
      { product: tea, quantity: 12, appliedUnitPrice: 3162, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
      { product: sugar, quantity: 15, appliedUnitPrice: 2042.5, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
      { product: handwash, quantity: 10, appliedUnitPrice: 1785.6, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
    ],
    daysAgo: 10,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentTerms: 'net_15',
    paidAmount: 93504.6,
    trackingCarrier: 'Gati KWE Surface',
    trackingNumber: 'GATI-77665544',
  });

  // Order 8: Zenith Provision Stores (Active Packed today, awaiting courier pickup)
  const turmeric = getProd('FMCG-SPIC-007');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1008',
    retailerProfile: p6,
    user: u6,
    items: [
      { product: turmeric, quantity: 8, appliedUnitPrice: 4607.5, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
      { product: posRolls, quantity: 15, appliedUnitPrice: 2025, pricingType: 'volume_tier', pricingRuleName: 'POS High-Volume Tier' },
      { product: getProd('HYG-TWL-002'), quantity: 6, appliedUnitPrice: 2976, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
    ],
    daysAgo: 0,
    orderStatus: 'packed',
    paymentStatus: 'unpaid',
    paymentMethod: 'credit',
    paymentTerms: 'net_15',
    paidAmount: 0,
  });

  // Order 9: Kalyan Daily Essentials (Active Order Placed today, pending admin approval)
  const pinkSalt = getProd('FMCG-SALT-009');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1009',
    retailerProfile: p7,
    user: u7,
    items: [
      { product: lentils, quantity: 8, appliedUnitPrice: 2156, pricingType: 'retailer_group', pricingRuleName: 'Silver Partner Discount' },
      { product: pinkSalt, quantity: 12, appliedUnitPrice: 1323, pricingType: 'retailer_group', pricingRuleName: 'Silver Partner Discount' },
      { product: mustardOil, quantity: 6, appliedUnitPrice: 1940.4, pricingType: 'retailer_group', pricingRuleName: 'Silver Partner Discount' },
    ],
    daysAgo: 0,
    orderStatus: 'order_placed',
    paymentStatus: 'unpaid',
    paymentMethod: 'credit',
    paymentTerms: 'net_7',
    paidAmount: 0,
  });

  // Order 10: Sunrise Cash & Carry (Delivered & Paid 8 days ago via UPI)
  const scanner = getProd('GEN-SCN-002');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1010',
    retailerProfile: p8,
    user: u8,
    items: [
      { product: copierPaper, quantity: 15, appliedUnitPrice: 2610, pricingType: 'volume_tier', pricingRuleName: 'Paper Mills Bulk Tier' },
      { product: scanner, quantity: 2, appliedUnitPrice: 16800, pricingType: 'base_wholesale' },
      { product: typeCCables, quantity: 4, appliedUnitPrice: 7500, pricingType: 'base_wholesale' },
    ],
    daysAgo: 8,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    paymentTerms: 'advance',
    paidAmount: 119562,
    trackingCarrier: 'DTDC Express Parcel',
    trackingNumber: 'DTDC-4400192',
  });

  // Order 11: Sunrise Cash & Carry (Active Confirmed yesterday, paid in advance)
  const cashDrawer = getProd('GEN-DRW-005');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1011',
    retailerProfile: p8,
    user: u8,
    items: [
      { product: cashDrawer, quantity: 4, appliedUnitPrice: 5600, pricingType: 'base_wholesale' },
      { product: posRolls, quantity: 10, appliedUnitPrice: 2025, pricingType: 'volume_tier', pricingRuleName: 'POS High-Volume Tier' },
    ],
    daysAgo: 1,
    orderStatus: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    paymentTerms: 'advance',
    paidAmount: 49454,
  });

  // Order 12: Metro Regional Wholesale (Delivered & Paid 35 days ago)
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1012',
    retailerProfile: p2,
    user: u2,
    items: [
      { product: basmatiRice, quantity: 25, appliedUnitPrice: 3750, pricingType: 'volume_tier', pricingRuleName: 'Bulk Volume Slab' },
      { product: wheatFlour, quantity: 20, appliedUnitPrice: 1757.5, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
    ],
    daysAgo: 35,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentTerms: 'net_15',
    paidAmount: 135345,
    trackingCarrier: 'Delhivery Surface Pro',
    trackingNumber: 'DEL-100293881',
  });

  // Order 13: City Grocers (Delivered & Paid 48 days ago)
  const sparklingWater = getProd('BEV-WTR-003');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1013',
    retailerProfile: p3,
    user: u3,
    items: [
      { product: sparklingWater, quantity: 15, appliedUnitPrice: 1411.2, pricingType: 'retailer_group', pricingRuleName: 'Silver Partner Discount' },
      { product: tea, quantity: 8, appliedUnitPrice: 3332, pricingType: 'retailer_group', pricingRuleName: 'Silver Partner Discount' },
    ],
    daysAgo: 48,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentTerms: 'net_7',
    paidAmount: 52932.96,
    trackingCarrier: 'SafeExpress Road Cargo',
    trackingNumber: 'SE-77112239',
  });

  // Order 14: Apex Hypermarkets (Delivered & Paid 65 days ago)
  const mangoPulp = getProd('BEV-PULP-004');
  const boppTape = getProd('PKG-TAPE-002');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1014',
    retailerProfile: p1,
    user: u1,
    items: [
      { product: mangoPulp, quantity: 25, appliedUnitPrice: 2565, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
      { product: corrugatedBoxes, quantity: 50, appliedUnitPrice: 1380, pricingType: 'volume_tier', pricingRuleName: 'Logistics Volume Tier' },
      { product: boppTape, quantity: 20, appliedUnitPrice: 1782, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
    ],
    daysAgo: 65,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentTerms: 'net_30',
    paidAmount: 198944,
    trackingCarrier: 'BlueDart Apex Freight',
    trackingNumber: 'BD-88001192',
  });

  // Order 15: Titan Mega Retail (Delivered & Paid 80 days ago)
  const dock = getProd('ELEC-DOK-004');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1015',
    retailerProfile: p5,
    user: u5,
    items: [
      { product: basmatiRice, quantity: 50, appliedUnitPrice: 3500, pricingType: 'volume_tier', pricingRuleName: 'Bulk Volume Slab' },
      { product: a2Ghee, quantity: 20, appliedUnitPrice: 9900, pricingType: 'retailer_specific', pricingRuleName: 'Titan Enterprise Contract' },
      { product: dock, quantity: 4, appliedUnitPrice: 22050, pricingType: 'retailer_group', pricingRuleName: 'Platinum Partner Discount' },
    ],
    daysAgo: 80,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentTerms: 'net_30',
    paidAmount: 517454,
    trackingCarrier: 'TCI Freight Logistics',
    trackingNumber: 'TCI-44119922',
  });

  // Order 16: Metro FMCG (Cancelled 15 days ago)
  const floorCleaner = getProd('HYG-FLR-004');
  await createSeedOrder({
    orderNumber: 'WH-ORD-2026-1016',
    retailerProfile: p2,
    user: u2,
    items: [
      { product: handwash, quantity: 15, appliedUnitPrice: 1824, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
      { product: floorCleaner, quantity: 10, appliedUnitPrice: 1691, pricingType: 'retailer_group', pricingRuleName: 'Gold Partner Discount' },
    ],
    daysAgo: 15,
    orderStatus: 'cancelled',
    paymentStatus: 'cancelled',
    paymentMethod: 'credit',
    paymentTerms: 'net_15',
    paidAmount: 0,
    cancelReason: 'Client requested order cancellation before packing to adjust case specifications.',
  });

  // 7. Synchronize credit balances for all retailers
  console.log('💳 Synchronizing Credit Balances and Ledger Accounts...');
  for (const r of [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10]) {
    await recalculateRetailerCredit(r._id);
  }

  console.log(`\n======================================================`);
  console.log(`✅ DATABASE SEED COMPLETE!`);
  console.log(`======================================================`);
  console.log(`\n🔑 Development & Evaluation Credentials:\n`);
  console.log(`👤 Administrator:`);
  console.log(`   Email:    admin@wholesalehub.io`);
  console.log(`   Password: Admin@123456\n`);
  console.log(`🏢 Retailer 1 (Platinum - Apex Hypermarkets, Mumbai):`);
  console.log(`   Email:    platinum.retailer@supermart.com`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`🏢 Retailer 2 (Gold - Metro Regional FMCG, Bengaluru):`);
  console.log(`   Email:    gold.retailer@metrofmcg.in`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`🏢 Retailer 3 (Silver - City Grocers, New Delhi):`);
  console.log(`   Email:    silver.retailer@citygrocery.com`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`🏢 Retailer 4 (Pending Approval - FreshBazaar, Gurugram):`);
  console.log(`   Email:    pending.retailer@freshbazaar.org`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`🏢 Retailer 5 (Platinum 2 - Titan Mega Retail, Bengaluru):`);
  console.log(`   Email:    platinum2.retailer@titanretail.com`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`🏢 Retailer 6 (Gold 2 - Zenith Provision Stores, Hyderabad):`);
  console.log(`   Email:    gold2.retailer@zenithstores.in`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`🏢 Retailer 7 (Silver 2 - Kalyan Daily Essentials, Ahmedabad):`);
  console.log(`   Email:    silver2.retailer@kalyangrocery.in`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`🏢 Retailer 8 (Standard Tier - Sunrise Cash & Carry, Kolkata):`);
  console.log(`   Email:    standard.retailer@sunrisemart.com`);
  console.log(`   Password: Retailer@123456\n`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
