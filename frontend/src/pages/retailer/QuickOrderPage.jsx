import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/client';
import { Zap, Plus, Trash2, ShoppingCart, FileSpreadsheet, Check, AlertCircle, ArrowRight } from 'lucide-react';

export default function QuickOrderPage() {
  const navigate = useNavigate();
  const { bulkAdd } = useCartStore();

  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([
    { id: 1, productId: '', quantity: 1, productObj: null },
    { id: 2, productId: '', quantity: 1, productObj: null },
    { id: 3, productId: '', quantity: 1, productObj: null },
    { id: 4, productId: '', quantity: 1, productObj: null },
    { id: 5, productId: '', quantity: 1, productObj: null },
  ]);

  const [csvText, setCsvText] = useState('');
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'csv'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products?limit=200');
      if (res.success) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSelect = (rowId, productId) => {
    const p = products.find((prod) => prod._id === productId);
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              productId,
              productObj: p || null,
              quantity: p?.minOrderQty || 1,
            }
          : r
      )
    );
  };

  const handleQuantityChange = (rowId, qty) => {
    const val = parseInt(qty, 10);
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, quantity: isNaN(val) ? 1 : val } : r))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), productId: '', quantity: 1, productObj: null },
    ]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleManualSubmit = async () => {
    const itemsToAdd = rows
      .filter((r) => r.productId && r.quantity > 0)
      .map((r) => ({ productId: r.productId, quantity: r.quantity }));

    if (itemsToAdd.length === 0) {
      alert('Please select at least one product with quantity.');
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const res = await bulkAdd(itemsToAdd);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Successfully added ${itemsToAdd.length} items to cart!`,
      });
      setTimeout(() => navigate('/cart'), 1500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCsvSubmit = async () => {
    if (!csvText.trim()) {
      alert('Paste CSV data in format: SKU,Quantity');
      return;
    }

    const lines = csvText.trim().split('\n');
    const items = [];

    for (const line of lines) {
      const parts = line.split(/[,;\t]/);
      if (parts.length >= 2) {
        const sku = parts[0].trim();
        const qty = parseInt(parts[1].trim(), 10);
        if (sku && !isNaN(qty) && qty > 0) {
          items.push({ sku, quantity: qty });
        }
      }
    }

    if (items.length === 0) {
      alert('No valid items found in CSV. Format should be: SKU,Quantity (e.g. FMCG-RICE-001,10)');
      return;
    }

    setIsSubmitting(true);
    const res = await bulkAdd(items);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Processed CSV: Added ${res.added?.length || items.length} line items to your cart!`,
      });
      setTimeout(() => navigate('/cart'), 1500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-teal-700 text-white rounded-xl shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            High-Speed Bulk Order Sheet
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Designed for high-frequency purchasing: enter SKUs directly or paste multi-line order sheets to populate your cart instantly.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === 'manual'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          Quick Tabular Form
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === 'csv'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
          CSV Paste / Bulk Upload
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-xs flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {activeTab === 'manual' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Select Product / SKU</th>
                  <th className="py-3 px-3">Pack & MOQ</th>
                  <th className="py-3 px-3">Unit Wholesale Rate</th>
                  <th className="py-3 px-3 text-center">Order Quantity</th>
                  <th className="py-3 px-3 text-right">Row Subtotal</th>
                  <th className="py-3 px-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const p = row.productObj;
                  const rowSubtotal = p ? (p.calculatedPrice || p.basePrice) * row.quantity : 0;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                      <td className="py-3 px-3">
                        <select
                          value={row.productId}
                          onChange={(e) => handleProductSelect(row.id, e.target.value)}
                          className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                        >
                          <option value="">-- Choose Wholesale Product --</option>
                          {products.map((prod) => (
                            <option key={prod._id} value={prod._id}>
                              [{prod.sku}] {prod.name} ({prod.unitOfMeasurement})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        {p ? (
                          <div>
                            <span className="font-semibold text-slate-800">{p.packSize}</span>
                            <div className="text-[10px] text-teal-700 font-bold">
                              MOQ: {p.minOrderQty} {p.unitOfMeasurement}s
                              {p.orderQtyIncrement > 1 ? ` (step ${p.orderQtyIncrement})` : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        {p ? `₹${(p.calculatedPrice || p.basePrice).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={p?.minOrderQty || 1}
                          step={p?.orderQtyIncrement || 1}
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                          disabled={!p}
                          className="w-20 px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {rowSubtotal > 0 ? `₹${rowSubtotal.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
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

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Another Line Item
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleManualSubmit}
              className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md shadow-teal-700/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Add All Selected Lines to Cart
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* CSV PASTE TAB */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Paste Bulk Order Data (CSV / Tab Delimited)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter one item per line using format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 font-mono font-bold">SKU,Quantity</code>
            </p>
          </div>

          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`FMCG-RICE-001,10\nFMCG-OIL-002,12\nBEV-COFF-001,5\nPKG-BOX-001,20`}
            className="w-full font-mono text-xs p-4 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          ></textarea>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCsvText(`FMCG-RICE-001,10\nFMCG-OIL-002,6\nBEV-COFF-001,3\nPKG-BOX-001,10`)}
              className="text-xs text-teal-700 font-bold hover:underline"
            >
              Load Example Template
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCsvSubmit}
              className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md shadow-teal-700/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Upload & Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
