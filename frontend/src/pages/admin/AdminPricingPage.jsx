import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { SlidersHorizontal, Plus, Trash2, CheckCircle2, AlertCircle, X, Tag, Sparkles } from 'lucide-react';

export default function AdminPricingPage() {
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [ruleTypeFilter, setRuleTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // New Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    ruleName: '',
    ruleType: 'retailer_specific',
    product: '',
    retailer: '',
    retailerGroup: 'platinum',
    fixedPrice: '',
    discountPercentage: '',
    volumeTiers: [
      { minQty: 10, maxQty: 49, unitPrice: '' },
      { minQty: 50, maxQty: null, unitPrice: '' },
    ],
    priority: 10,
    notes: '',
  });

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadPricingRules();
    loadLookups();
  }, [ruleTypeFilter]);

  const loadPricingRules = async () => {
    setIsLoading(true);
    try {
      let url = `/admin/pricing`;
      if (ruleTypeFilter !== 'all') url += `?ruleType=${ruleTypeFilter}`;
      const res = await api.get(url);
      if (res.success) setRules(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/admin/products?limit=200'),
        api.get('/admin/retailers?status=approved&limit=100'),
      ]);
      if (pRes.success) setProducts(pRes.data);
      if (rRes.success) setRetailers(rRes.data);
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to deactivate and remove this pricing agreement?')) return;
    try {
      const res = await api.delete(`/admin/pricing/${ruleId}`);
      if (res.success) {
        await loadPricingRules();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      ...formData,
      priority: parseInt(formData.priority, 10) || 5,
      fixedPrice: formData.fixedPrice ? parseFloat(formData.fixedPrice) : undefined,
      discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,
    };

    if (payload.ruleType !== 'retailer_specific') delete payload.retailer;
    if (payload.ruleType !== 'retailer_group') delete payload.retailerGroup;
    if (payload.ruleType !== 'volume_tier') delete payload.volumeTiers;

    try {
      const res = await api.post('/admin/pricing', payload);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Pricing rule configured successfully.' });
        await loadPricingRules();
        setTimeout(() => setIsModalOpen(false), 1200);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Pricing Engine & Discount Agreements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure individual contract overrides, tier-based group discounts, and bulk volume discount slabs.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFeedback(null);
          }}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Pricing Rule
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        {['all', 'retailer_specific', 'retailer_group', 'volume_tier', 'promotion'].map((t) => (
          <button
            key={t}
            onClick={() => setRuleTypeFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
              ruleTypeFilter === t
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading pricing rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No pricing rules configured</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Agreement Name</th>
                  <th className="py-3.5 px-4">Rule Classification</th>
                  <th className="py-3.5 px-4">Target Product</th>
                  <th className="py-3.5 px-4">Target Customer / Group</th>
                  <th className="py-3.5 px-4 text-right">Base Wholesale Rate</th>
                  <th className="py-3.5 px-4 text-right">Negotiated Rate / Slab</th>
                  <th className="py-3.5 px-4 text-center">Priority</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => {
                  const prod = rule.product;
                  const ret = rule.retailer;

                  return (
                    <tr key={rule._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {rule.ruleName}
                        {rule.notes && <div className="text-[10px] text-slate-400 font-normal">{rule.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {rule.ruleType.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {prod ? (
                          <div>
                            <span className="font-semibold text-slate-900">{prod.name}</span>
                            <div className="font-mono text-[10px] text-slate-500">{prod.sku}</div>
                          </div>
                        ) : (
                          'Global All Products'
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {ret ? (
                          <div className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded inline-block">
                            {ret.businessName}
                          </div>
                        ) : rule.retailerGroup ? (
                          <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {rule.retailerGroup} Group
                          </span>
                        ) : (
                          <span className="text-slate-500">All Customers (Volume Tier)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-500 line-through">
                        {prod ? `₹${prod.basePrice.toLocaleString('en-IN')}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {rule.fixedPrice != null ? (
                          <span className="font-extrabold text-teal-800 text-sm">
                            ₹{rule.fixedPrice.toLocaleString('en-IN')} / {prod?.unitOfMeasurement || 'unit'}
                          </span>
                        ) : rule.discountPercentage > 0 ? (
                          <span className="font-bold text-emerald-700">{rule.discountPercentage}% OFF Base</span>
                        ) : rule.volumeTiers?.length > 0 ? (
                          <span className="font-semibold text-teal-700">{rule.volumeTiers.length} Slabs Configured</span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-600">{rule.priority}</td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRule(rule._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Remove Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Pricing Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Configure Wholesale Pricing Rule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rule Agreement Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hypermarkets Exclusive Basmati Contract"
                  value={formData.ruleName}
                  onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pricing Rule Classification *</label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="retailer_specific">Retailer-Specific Contract (Individual)</option>
                    <option value="retailer_group">Customer Group Tier (Silver/Gold/Platinum)</option>
                    <option value="volume_tier">Volume Slabs (Quantity Based)</option>
                    <option value="promotion">Promotional Discount</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicable Product *</label>
                  <select
                    required
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="">-- Choose Catalogue Product --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        [{p.sku}] {p.name} (Base: ₹{p.basePrice})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Target Picker */}
              {formData.ruleType === 'retailer_specific' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Approved Retailer *</label>
                  <select
                    required
                    value={formData.retailer}
                    onChange={(e) => setFormData({ ...formData, retailer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="">-- Choose Retailer Account --</option>
                    {retailers.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.businessName} ({r.contactPerson} - {r.retailerGroup.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.ruleType === 'retailer_group' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Tier Group *</label>
                  <select
                    value={formData.retailerGroup}
                    onChange={(e) => setFormData({ ...formData, retailerGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="platinum">Platinum Retailers</option>
                    <option value="gold">Gold Retailers</option>
                    <option value="silver">Silver Retailers</option>
                    <option value="standard">Standard Retailers</option>
                  </select>
                </div>
              )}

              {/* Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fixed Unit Price Override (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 3600"
                    value={formData.fixedPrice}
                    onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Overrides standard base wholesale price</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Or Percentage Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 10 for 10% off"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Calculated on product's base price</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Agreement Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual committed contract signed by procurement board"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold"
                >
                  Save Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
