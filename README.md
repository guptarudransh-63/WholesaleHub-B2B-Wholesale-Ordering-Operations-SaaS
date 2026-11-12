# WholesaleHub — B2B Wholesale Ordering, Customer Pricing, Credit & Order Management SaaS

**WholesaleHub** is an enterprise-grade full-stack B2B wholesale commerce and operations SaaS platform that connects suppliers and distributors with commercial retailers.

It replaces fragmented phone calls, spreadsheets, and manual bookkeeping with a centralized digital platform supporting **personalized customer pricing engines**, **multi-tiered bulk volume discounts**, **credit limits with Net terms**, **automated GST tax invoices with PDF downloads**, **payment ledger reconciliation**, and **real-time business analytics**.

---

## 🚀 Live Demo & Evaluation Credentials

Both the backend and frontend are running and configured. You can test each persona immediately using the built-in **"Demo Persona Switcher"** in the top navigation bar, or log in with these credentials:

| Persona | Email | Password | Role & Benefits |
|---|---|---|---|
| **👑 Administrator** | `admin@wholesalehub.io` | `Admin@123456` | Full operations access: Retailer approvals, credit limits, pricing engine, order fulfillment & analytics |
| **💎 Platinum Retailer 1** | `platinum.retailer@supermart.com` | `Retailer@123456` | Apex Supermarkets (Mumbai): Net 30 terms, ₹5,00,000 credit limit, ₹3,600 contract price on Basmati Rice |
| **💎 Platinum Retailer 2** | `platinum2.retailer@titanretail.com` | `Retailer@123456` | Titan Mega Retail (Bengaluru): Net 30 terms, ₹8,00,000 credit limit, contract rates on Ghee & Stretch Film |
| **🥇 Gold Retailer 1** | `gold.retailer@metrofmcg.in` | `Retailer@123456` | Metro FMCG (Bengaluru): Net 15 terms, ₹2,50,000 credit limit, 5% group discount, active dispatched order |
| **🥇 Gold Retailer 2** | `gold2.retailer@zenithstores.in` | `Retailer@123456` | Zenith Stores (Hyderabad): Net 15 terms, ₹3,50,000 credit limit, active packed order |
| **🥈 Silver Retailer 1** | `silver.retailer@citygrocery.com` | `Retailer@123456` | City Grocers (Delhi): Net 7 terms, overdue invoice with partial payment (₹10,000 paid) |
| **🥈 Silver Retailer 2** | `silver2.retailer@kalyangrocery.in` | `Retailer@123456` | Kalyan Daily Essentials (Ahmedabad): Net 7 terms, newly placed order pending approval |
| **🏬 Standard Retailer** | `standard.retailer@sunrisemart.com` | `Retailer@123456` | Sunrise Cash & Carry (Kolkata): Advance terms (UPI payments, 0 credit line) |
| **⏳ Pending Retailer** | `pending.retailer@freshbazaar.org` | `Retailer@123456` | FreshBazaar: Unapproved account showing locked wholesale pricing and verification barrier |
| **❌ Rejected Retailer** | `rejected.retailer@horizon.com` | `Retailer@123456` | Horizon Retail: Rejected verification status |
| **⛔ Suspended Retailer** | `suspended.retailer@quickmart.com` | `Retailer@123456` | QuickMart Outlets: Suspended account due to 60+ days payment default |

---

## 🛠️ Technology Stack

- **Frontend:**
  - React 19 + Vite 8
  - Tailwind CSS v4
  - React Router v7
  - Zustand (Auth & Cart state management)
  - Axios (with Bearer token & session interceptors)
  - Recharts (Database-driven revenue trends, category charts, order status distribution)
  - Lucide React icons
- **Backend:**
  - Node.js (v26) + Express.js (ES Modules)
  - MongoDB 8 + Mongoose 9
  - JWT Authentication + bcryptjs password hashing
  - PDFKit (Compliant Indian GST Tax Invoice PDF generation)
  - Morgan logger + Centralized error handler

---

## 📦 Core Architecture & Modules

### 1. Personalized Pricing Resolution Engine
Every product price is calculated on the backend using an immutable priority hierarchy:
1. **Retailer-Specific Contract Price:** Direct fixed rate or percentage discount negotiated for an individual retailer (e.g. Apex Supermarkets contract rate of ₹3,600 on Basmati Rice).
2. **Retailer Group Tier Discount:** Automatic tier benefits for Platinum, Gold, and Silver retailer cohorts.
3. **Volume Discount Slabs:** Tiered quantity discounts (e.g. 10–24 units: ₹3,950; 25–49 units: ₹3,750; 50+ units: ₹3,500).
4. **Base Wholesale Rate:** Default approved wholesale rate.

### 2. High-Speed Bulk Ordering & MOQ Rules
- Enforces **Minimum Order Quantity (MOQ)** and **Order Quantity Increment steps** (e.g., must be ordered in case multiples of 6, 12, or 24).
- **Quick Order Sheet:** Enter bulk quantities across multiple SKUs simultaneously, or paste multi-line CSV order sheets (`SKU,Quantity`).

### 3. Account Receivables & Credit Limit Management
- Real-time calculation: `Available Credit = Max(0, Credit Limit - Total Outstanding Invoices)`.
- At checkout, if an order is placed on credit, the engine verifies available credit and prevents order submission if there is a shortfall.
- Double-entry **CreditLedger** tracks all debits (order charges) and credits (payments remitted, order cancellations).

### 4. Compliant Tax Invoices & PDF Generation
- Invoices are automatically generated upon order placement.
- Calculates taxable value, CGST, SGST, IGST, and HSN codes.
- Streams downloadable PDF invoices with supplier GSTIN, retailer GSTIN, itemized rates, taxes, and bank remittance instructions.

### 5. Multi-Stage Order Lifecycle & Dispatch Tracking
- Status transitions: `Order Placed` ➔ `Confirmed` ➔ `Processing` ➔ `Packed` ➔ `Dispatched` ➔ `Delivered` (or `Cancelled`).
- Records carrier name and AWB / tracking number with live dock delivery estimates.
- Preserves order snapshots and timeline audit trails.

### 6. Retailer CRM & Business Analytics
- Complete retailer directory with approval, rejection, and suspension controls.
- Configurable credit limits and payment terms (Advance, COD, Net 7, Net 15, Net 30).
- Database-backed analytics charts: Revenue trends, category sales, top customer rankings, and aging receivables.

---

## 🏃 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (running on `mongodb://127.0.0.1:27017`)

### 1. Start MongoDB
Ensure MongoDB daemon is running locally:
```bash
mongod --dbpath <data_dir>
```

### 2. Seed Database
Seed products, retailer tiers, contract pricing rules, sample orders, and invoices:
```bash
npm run seed
```

### 3. Run Backend (Port 5005)
```bash
npm run dev:backend
```

### 4. Run Frontend (Port 5174)
```bash
npm run dev:frontend
```
Open **`http://localhost:5174`** in your browser.

---

## 📁 Repository Structure

```
wholesale-b2b-website/
├── backend/
│   ├── src/
│   │   ├── config/db.js               # Database connection
│   │   ├── models/                    # 10 Mongoose models (User, Product, RetailerProfile, Order, etc.)
│   │   ├── services/                  # Pricing engine, Credit service, Inventory, PDF Invoices
│   │   ├── middleware/                # Auth, Role guards, Error handling
│   │   ├── routes/                    # REST API routes (Auth, Products, Cart, Orders, Admin, etc.)
│   │   ├── seeds/                     # Realistic B2B seed data & execution script
│   │   └── server.js                  # Express application setup
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js              # Axios client with interceptors
│   │   ├── store/                     # Zustand Auth & Cart stores
│   │   ├── components/                # Navbar, Footer, Badges, Demo Switcher Modal
│   │   ├── pages/
│   │   │   ├── auth/                  # Login & Retailer Onboarding pages
│   │   │   ├── retailer/              # Catalogue, Quick Order, Cart, Orders, Invoices, Credit
│   │   │   └── admin/                 # Analytics Dashboard, CRM, Inventory, Pricing Manager
│   │   ├── App.jsx                    # React Router configuration
│   │   └── index.css                  # Tailwind CSS styling
│   ├── vite.config.js
│   └── package.json
└── package.json                       # Monorepo root scripts
```
