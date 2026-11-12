import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import DemoSwitcherModal from '../common/DemoSwitcherModal';
import { TierBadge } from '../common/Badge';
import {
  Boxes,
  ShoppingCart,
  Receipt,
  CreditCard,
  Zap,
  LayoutDashboard,
  Users,
  Package,
  Layers,
  ChevronDown,
  LogOut,
  User,
  SlidersHorizontal,
  Bell,
  Search,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, retailerProfile, isAuthenticated, logout } = useAuthStore();
  const { itemsCount, grandTotal } = useCartStore();

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isRetailer = user?.role === 'retailer';
  const isApproved = retailerProfile?.approvalStatus === 'approved';

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top Announcement & Demo Switcher Bar */}
        <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-200">
              WholesaleHub B2B Commerce & Wholesale Operations SaaS
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">
              GSTIN: 27AABCU9603R1ZM (All prices in INR)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 font-semibold border border-teal-500/30 transition-all text-[11px]"
            >
              <Zap className="w-3 h-3 mr-1 text-teal-400" />
              Demo Persona Switcher
              <span className="ml-1.5 bg-teal-400 text-slate-950 px-1.5 py-0.2 rounded font-bold uppercase text-[9px]">
                {isAdmin ? 'Admin' : retailerProfile?.retailerGroup || (isAuthenticated ? 'Retailer' : 'Guest')}
              </span>
            </button>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 bg-teal-700 rounded-xl flex items-center justify-center text-white shadow-sm shadow-teal-700/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Wholesale<span className="text-teal-700">Hub</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 -mt-1">
                B2B Procurement SaaS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/dashboard') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/orders"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/orders') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  to="/admin/retailers"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/retailers') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Retailers CRM
                </Link>
                <Link
                  to="/admin/products"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/products') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Catalogue
                </Link>
                <Link
                  to="/admin/pricing"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/pricing') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pricing Engine
                </Link>
                <Link
                  to="/admin/invoices"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/invoices') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Invoices & Receivables
                </Link>
                <Link
                  to="/admin/payments"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/payments') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Payments
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/catalogue"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/catalogue') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Product Catalogue
                </Link>
                <Link
                  to="/quick-order"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/quick-order') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center">
                    <Zap className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    Quick Order Sheet
                  </span>
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/orders"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isActive('/orders') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/invoices"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isActive('/invoices') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Invoices
                    </Link>
                    <Link
                      to="/credit"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isActive('/credit') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Credit & Receivables
                    </Link>
                    <Link
                      to="/contract-pricing"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isActive('/contract-pricing') ? 'bg-slate-100 text-teal-800' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      My Pricing
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center space-x-3">
            {/* Retailer Credit Summary Badge (if logged in retailer) */}
            {isRetailer && isApproved && retailerProfile && (
              <Link
                to="/credit"
                className="hidden md:flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs transition-colors"
                title="View Account Credit Dashboard"
              >
                <CreditCard className="w-4 h-4 text-teal-700" />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Avail. Credit:</span>
                    <span className="font-bold text-slate-900">
                      ₹{(retailerProfile.availableCredit || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Shopping Cart Button */}
            {!isAdmin && (
              <Link
                to="/cart"
                className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-teal-700 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                    {itemsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Authentication Buttons or Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name ? user.name.substring(0, 2) : 'WH'}
                  </div>
                  <div className="hidden sm:block text-left pr-1">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {retailerProfile?.businessName || user?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      {isAdmin ? 'Administrator' : `${retailerProfile?.retailerGroup || 'Standard'} Tier`}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      {retailerProfile && (
                        <div className="mt-2 flex items-center space-x-1.5">
                          <TierBadge tier={retailerProfile.retailerGroup} />
                          <span className="text-[11px] text-slate-600 font-medium capitalize">
                            {(retailerProfile.paymentTerms || 'net_15').replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      {isAdmin ? (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <LayoutDashboard className="w-4 h-4 mr-2 text-slate-400" />
                            Admin Operations Hub
                          </Link>
                          <Link
                            to="/admin/retailers"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Users className="w-4 h-4 mr-2 text-slate-400" />
                            Retailer Approvals & CRM
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/orders"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Package className="w-4 h-4 mr-2 text-slate-400" />
                            Order History & Reorder
                          </Link>
                          <Link
                            to="/credit"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <CreditCard className="w-4 h-4 mr-2 text-slate-400" />
                            Outstanding Credit & Invoices
                          </Link>
                          <Link
                            to="/contract-pricing"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" />
                            Negotiated Wholesale Pricing
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setIsDemoModalOpen(true);
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                      >
                        <Zap className="w-4 h-4 mr-2 text-teal-600" />
                        Switch Persona (Admin/Retailer)
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4 mr-2 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl bg-white"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs shadow-teal-700/20"
                >
                  Register Business
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Persona Switcher Modal */}
      <DemoSwitcherModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </>
  );
}
