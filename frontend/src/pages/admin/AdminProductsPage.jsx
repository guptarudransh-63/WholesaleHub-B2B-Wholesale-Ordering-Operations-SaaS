import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Package, Plus, Search, Edit2, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Grocery & FMCG',
    brand: '',
    description: '',
    unitOfMeasurement: 'case',
    packSize: '',
    basePrice: '',
    costPrice: '',
    stock: '',
    minOrderQty: 1,
    orderQtyIncrement: 1,
    taxRate: 18,
    status: 'active',
    lowStockThreshold: 20,
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
  });

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [categoryFilter]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      let url = `/admin/products?limit=100`;
      if (categoryFilter !== 'all') url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Grocery & FMCG',
      brand: '',
      description: '',
      unitOfMeasurement: 'case',
      packSize: '',
      basePrice: '',
      costPrice: '',
      stock: '',
      minOrderQty: 1,
      orderQtyIncrement: 1,
      taxRate: 18,
      status: 'active',
      lowStockThreshold: 20,
      images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
    });
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleOpenEdit = (prod) => {
    setIsEditing(true);
    setCurrentId(prod._id);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      brand: prod.brand,
      description: prod.description || '',
      unitOfMeasurement: prod.unitOfMeasurement || 'case',
      packSize: prod.packSize || '',
      basePrice: prod.basePrice,
      costPrice: prod.costPrice || 0,
      stock: prod.stock,
      minOrderQty: prod.minOrderQty || 1,
      orderQtyIncrement: prod.orderQtyIncrement || 1,
      taxRate: prod.taxRate || 18,
      status: prod.status || 'active',
      lowStockThreshold: prod.lowStockThreshold || 20,
      images: prod.images || [],
    });
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      ...formData,
      basePrice: parseFloat(formData.basePrice),
      costPrice: parseFloat(formData.costPrice || 0),
      stock: parseInt(formData.stock, 10),
      minOrderQty: parseInt(formData.minOrderQty, 10),
      orderQtyIncrement: parseInt(formData.orderQtyIncrement, 10),
      taxRate: parseInt(formData.taxRate, 10),
      lowStockThreshold: parseInt(formData.lowStockThreshold, 10),
    };

    try {
      if (isEditing) {
        const res = await api.patch(`/admin/products/${currentId}`, payload);
        if (res.success) {
          setFeedback({ type: 'success', message: 'Product updated successfully.' });
          await loadProducts();
          setTimeout(() => setIsModalOpen(false), 1200);
        }
      } else {
        const res = await api.post('/admin/products', payload);
        if (res.success) {
          setFeedback({ type: 'success', message: 'New wholesale product created.' });
          await loadProducts();
          setTimeout(() => setIsModalOpen(false), 1200);
        }
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
            Wholesale Product Inventory & Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure base wholesale prices, MOQ increments, pack dimensions, and safety stock thresholds.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Wholesale Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Grocery & FMCG', 'Food & Beverages', 'Packaging Supplies', 'Personal Care', 'Electronics'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading catalogue inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No products found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">SKU & Item Name</th>
                  <th className="py-3.5 px-4">Category & Brand</th>
                  <th className="py-3.5 px-4">Pack Spec</th>
                  <th className="py-3.5 px-4">MOQ & Step</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Base Wholesale Rate</th>
                  <th className="py-3.5 px-4 text-center">Stock Level</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => {
                  const isLowStock = prod.stock <= prod.lowStockThreshold;

                  return (
                    <tr key={prod._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{prod.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 font-bold">{prod.sku}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{prod.brand}</div>
                        <div className="text-[10px] text-slate-500">{prod.category}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{prod.packSize}</span>
                        <div className="text-[10px] text-slate-500 capitalize">{prod.unitOfMeasurement}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-teal-700">Min {prod.minOrderQty}</span>
                        {prod.orderQtyIncrement > 1 && (
                          <div className="text-[10px] text-slate-500">Step x{prod.orderQtyIncrement}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        ₹{prod.costPrice ? prod.costPrice.toLocaleString('en-IN') : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                        ₹{prod.basePrice.toLocaleString('en-IN')}
                        <div className="text-[10px] text-slate-400 font-normal">+{prod.taxRate}% GST</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {prod.stock} units
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {prod.stock} units
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isEditing ? `Edit Product: ${formData.sku}` : 'Add New Wholesale Product'}
              </h3>
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
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU (Unique Code) *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Grocery & FMCG">Grocery & FMCG</option>
                    <option value="Food & Beverages">Food & Beverages</option>
                    <option value="Packaging Supplies">Packaging Supplies</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Electronics">Electronics</option>
                    <option value="General Merchandise">General Merchandise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measurement</label>
                  <select
                    value={formData.unitOfMeasurement}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasurement: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="case">Case</option>
                    <option value="carton">Carton</option>
                    <option value="box">Box</option>
                    <option value="piece">Piece</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="pallet">Pallet</option>
                    <option value="bundle">Bundle</option>
                    <option value="roll">Roll</option>
                    <option value="crate">Crate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pack Size Specification</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Bags x 5kg (50kg Case)"
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Wholesale Price (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Price (Supplier Internal)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Warehouse Stock *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Minimum Order Qty (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minOrderQty}
                    onChange={(e) => setFormData({ ...formData, minOrderQty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Qty Increment Step</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.orderQtyIncrement}
                    onChange={(e) => setFormData({ ...formData, orderQtyIncrement: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {isEditing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
