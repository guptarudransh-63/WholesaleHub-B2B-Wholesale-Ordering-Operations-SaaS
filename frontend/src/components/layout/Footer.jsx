import React from 'react';
import { Boxes, ShieldCheck, Truck, CreditCard, Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      {/* Feature Highlights */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Verified B2B Suppliers</p>
              <p className="text-[11px] text-slate-400">Direct factory & distributor sourcing</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-teal-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Flexible Credit Limits</p>
              <p className="text-[11px] text-slate-400">Net 7, Net 15 & Net 30 terms</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-teal-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Scheduled Logistics</p>
              <p className="text-[11px] text-slate-400">Palletized freight & tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-teal-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Dedicated Account Desk</p>
              <p className="text-[11px] text-slate-400">+91 124 4987 200 (Mon-Sat)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-teal-700 rounded-lg flex items-center justify-center text-white">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">WholesaleHub Operations SaaS</span>
            <span className="text-[11px] block text-slate-500">
              Enterprise B2B Wholesale Ordering & Receivables Management Platform
            </span>
          </div>
        </div>

        <div className="text-center md:text-right text-[11px] text-slate-500">
          <p>WholesaleHub Global Distribution Pvt. Ltd. | GSTIN: 27AABCU9603R1ZM</p>
          <p className="mt-0.5">Plot 42, Sector 18, Udyog Vihar Phase 4, Gurugram, Haryana 122015</p>
        </div>
      </div>
    </footer>
  );
}
