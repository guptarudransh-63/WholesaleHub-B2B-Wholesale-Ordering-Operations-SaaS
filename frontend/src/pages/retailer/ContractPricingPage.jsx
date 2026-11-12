import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { TierBadge } from '../../components/common/Badge';
import { SlidersHorizontal, Sparkles, Tag, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ContractPricingPage() {
  const { retailerProfile } = useAuthStore();
  const [pricingRules, setPricingRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/retailer/pricing');
      if (res.success) {
        setPricingRules(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              My Negotiated Wholesale Pricing Agreements
            </h1>
            {retailerProfile && <TierBadge tier={retailerProfile.retailerGroup} />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent view of your contractual fixed prices, tier-level discounts, and active agreement periods.
          </p>
        </div>

        <Link
          to="/catalogue"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs"
        >
          Shop Catalogue with Contract Rates
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Link>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start space-x-3 text-xs">
        <Sparkles className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Automated Price Resolution Engine</p>
          <p className="mt-0.5">
            WholesaleHub automatically applies your highest priority contract rate at checkout.
            Pricing precedence: <strong>1. Retailer-Specific Negotiated Fixed Rate &gt; 2. Group Tier Discount ({retailerProfile?.retailerGroup?.toUpperCase() || 'Standard'}) &gt; 3. Volume Slab &gt; 4. Base Wholesale Price</strong>.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading contractual price agreements...</p>
        </div>
      ) : pricingRules.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No custom agreements configured</h3>
          <p className="text-xs text-slate-500 mt-1">
            You are currently receiving standard tier discounts. Speak to your supplier representative to negotiate volume contracts.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Agreement Name</th>
                  <th className="py-3.5 px-4">Applicable Product</th>
                  <th className="py-3.5 px-4">Rule Classification</th>
                  <th className="py-3.5 px-4 text-right">Standard Base Rate</th>
                  <th className="py-3.5 px-4 text-right">Your Contracted Price</th>
                  <th className="py-3.5 px-4 text-center">Effective Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pricingRules.map((rule) => {
                  const prod = rule.product;
                  const isSpecific = rule.ruleType === 'retailer_specific';

                  return (
                    <tr key={rule._id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{rule.ruleName}</div>
                        {rule.notes && <div className="text-[10px] text-slate-500">{rule.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        {prod ? (
                          <div>
                            <span className="font-semibold text-slate-900">{prod.name}</span>
                            <div className="font-mono text-[10px] text-slate-500 font-bold">{prod.sku}</div>
                          </div>
                        ) : (
                          'Global Product Rule'
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isSpecific
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {rule.ruleType.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-500 font-semibold line-through">
                        {prod ? `₹${prod.basePrice.toLocaleString('en-IN')}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {rule.fixedPrice != null ? (
                          <div className="font-extrabold text-sm text-teal-800">
                            ₹{rule.fixedPrice.toLocaleString('en-IN')} / {prod?.unitOfMeasurement || 'unit'}
                          </div>
                        ) : rule.discountPercentage > 0 ? (
                          <div className="font-extrabold text-sm text-emerald-700">
                            {rule.discountPercentage}% OFF Base
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
