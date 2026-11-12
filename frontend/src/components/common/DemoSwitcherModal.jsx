import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Shield, Sparkles, Building2, Store, Clock, LogOut, X } from 'lucide-react';

export default function DemoSwitcherModal({ isOpen, onClose }) {
  const { user, retailerProfile, quickSwitchUser, logout } = useAuthStore();
  const { fetchCart } = useCartStore();

  if (!isOpen) return null;

  const handleSwitch = async (role) => {
    await quickSwitchUser(role);
    await fetchCart();
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-lg">One-Click Persona Switcher</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Instantly switch accounts to test role-based permissions, personalized tier pricing, credit limits, and approval workflows.
          </p>

          <div className="space-y-2.5">
            {/* Admin */}
            <button
              onClick={() => handleSwitch('admin')}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                user?.role === 'admin'
                  ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-1 ring-teal-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-slate-900 text-white rounded-lg mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Administrator Portal</span>
                  <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-mono">Operations VP</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">admin@wholesalehub.io</p>
                <p className="text-[11px] text-slate-600 mt-1">Full access to orders, approval CRM, pricing rules, invoices, payments & analytics.</p>
              </div>
            </button>

            {/* Platinum Retailer */}
            <button
              onClick={() => handleSwitch('platinum')}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                retailerProfile?.retailerGroup === 'platinum'
                  ? 'border-purple-500 bg-purple-50/70 shadow-sm ring-1 ring-purple-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-purple-600 text-white rounded-lg mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Apex Superstores (Platinum)</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">Net 30 | ₹5L Limit</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">platinum.retailer@supermart.com</p>
                <p className="text-[11px] text-slate-600 mt-1">Receives exclusive contract rates (₹3,600 Basmati) and 12% group discounts.</p>
              </div>
            </button>

            {/* Gold Retailer */}
            <button
              onClick={() => handleSwitch('gold')}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                retailerProfile?.retailerGroup === 'gold'
                  ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-amber-600 text-white rounded-lg mt-0.5">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Metro FMCG Mart (Gold)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Net 15 | ₹2.5L Limit</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">gold.retailer@metrofmcg.in</p>
                <p className="text-[11px] text-slate-600 mt-1">Has active dispatched order (WH-ORD-1002) with ₹60,947 unpaid balance.</p>
              </div>
            </button>

            {/* Silver Retailer */}
            <button
              onClick={() => handleSwitch('silver')}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                retailerProfile?.retailerGroup === 'silver'
                  ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-slate-700 text-white rounded-lg mt-0.5">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">City Grocers (Silver)</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">Net 7 | Overdue Alert</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">silver.retailer@citygrocery.com</p>
                <p className="text-[11px] text-slate-600 mt-1">Has past-due invoice with partial payment (₹10,000 paid, ₹21,075 balance).</p>
              </div>
            </button>

            {/* Pending Approval Retailer */}
            <button
              onClick={() => handleSwitch('pending')}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                retailerProfile?.approvalStatus === 'pending'
                  ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-amber-500 text-white rounded-lg mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">FreshBazaar (Pending Approval)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Unapproved</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">pending.retailer@freshbazaar.org</p>
                <p className="text-[11px] text-slate-600 mt-1">Shows locked wholesale prices and approval barrier until verified by admin.</p>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 py-2 px-3 rounded-lg hover:bg-rose-50"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out (Browse as Guest)
            </button>
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
