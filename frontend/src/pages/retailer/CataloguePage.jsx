import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/client';
import { StatusBadge, TierBadge } from '../../components/common/Badge';
import {
  Search,
  SlidersHorizontal,
  Package,
  Layers,
  ShoppingCart,
  Check,
  AlertTriangle,
  Info,
  Grid,
  List,
  Sparkles,
  Tag,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export default function CataloguePage() {
  const { user, retailerProfile, isAuthenticated } = useAuthStore();
  const { addToCart, fetchCart } = useCartStore();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isLoading, setIsLoading] = useState(true);

  // Quantities entered per product
  const [quantities, setQuantities] = useState({});
  const [selectedTierModalProduct, setSelectedTierModalProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const isApproved = retailerProfile?.approvalStatus === 'approved';

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [selectedCategory, inStockOnly]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      let url = `/products?limit=100`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (inStockOnly) url += `&inStock=true`;

      const res = await api.get(url);
      if (res.success) {
        setProducts(res.data);

        // Pre-fill default quantity to product's minOrderQty
        const initialQtys = {};
        res.data.forEach((p) => {
          initialQtys[p._id] = p.minOrderQty || 1;
        });
        setQuantities((prev) => ({ ...initialQtys, ...prev }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      if (res.success) {
        setCategories(res.data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleQuantityChange = (productId, value, increment = 1, min = 1) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = min;
    setQuantities((prev) => ({ ...prev, [productId]: num }));
  };

  const handleStepQuantity = (productId, delta, increment = 1, min = 1) => {
    const current = quantities[productId] || min;
    const step = increment > 1 ? increment : 1;
    let next = current + delta * step;
    if (next < min) next = min;
    setQuantities((prev) => ({ ...prev, [productId]: next }));
  };

  const handleAddToCart = async (product) => {
    const qty = quantities[product._id] || product.minOrderQty || 1;

    // Validate MOQ and increment
    if (product.minOrderQty && qty < product.minOrderQty) {
      alert(`Minimum order quantity is ${product.minOrderQty} ${product.unitOfMeasurement}(s).`);
      return;
    }

    if (product.orderQtyIncrement && product.orderQtyIncrement > 1 && qty % product.orderQtyIncrement !== 0) {
      alert(`Quantity must be an increment/multiple of ${product.orderQtyIncrement} (e.g. ${product.packSize}).`);
      return;
    }

    const res = await addToCart(product._id, qty);
    if (res.success) {
      setToastMessage(`Added ${qty} ${product.unitOfMeasurement}(s) of "${product.name}" to cart.`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      alert(res.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom">
          <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Account Verification Barrier Notification */}
      {isAuthenticated && !isApproved && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-sm">Account Verification In Progress</p>
            <p className="mt-0.5">
              Your wholesale retailer registration is currently under review by our operations team.
              You are currently viewing standard wholesale base prices. Once approved, your personalized negotiated rates, volume tiers, and credit terms will be unlocked.
            </p>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Wholesale B2B Catalogue
            </h1>
            {isApproved && retailerProfile && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <Sparkles className="w-3 h-3 mr-1 text-teal-600" />
                {retailerProfile.retailerGroup.toUpperCase()} Tier Pricing Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified wholesale inventory with pack sizes, minimum order quantities, and live volume pricing.
          </p>
        </div>

        {/* View Switcher & Search Bar */}
        <div className="flex items-center space-x-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, item, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="High-Speed Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex items-center justify-between overflow-x-auto pb-3 gap-2 border-b border-slate-200 mb-6">
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.name
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer shrink-0 ml-4">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
          />
          <span>In-Stock Only</span>
        </label>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-semibold">Calculating personalized wholesale pricing...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No products match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters, search keyword, or category.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const qty = quantities[product._id] || product.minOrderQty || 1;
            const hasDiscount = product.calculatedPrice < product.basePrice;
            const discountPct = product.discountPercentage || 
              (product.basePrice > 0 ? Math.round(((product.basePrice - product.calculatedPrice) / product.basePrice) * 100) : 0);

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                {/* Product Image Header */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      {product.sku}
                    </span>
                    {hasDiscount && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center">
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {product.stock > product.lowStockThreshold ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {product.stock} in stock
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                        Low: {product.stock} left
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Information */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {product.brand} · {product.category}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2 leading-snug">
                    {product.name}
                  </h3>

                  {/* Packaging & Unit Info */}
                  <div className="mt-2.5 p-2 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-slate-500">Pack Spec:</span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">{product.packSize}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">MOQ & Step:</span>
                      <span className="font-bold text-teal-700">
                        Min {product.minOrderQty} {product.unitOfMeasurement}s
                        {product.orderQtyIncrement > 1 ? ` (x${product.orderQtyIncrement})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-lg font-extrabold text-slate-900">
                            ₹{(product.calculatedPrice || product.basePrice).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            / {product.unitOfMeasurement}
                          </span>
                        </div>
                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{product.basePrice.toLocaleString('en-IN')} base
                          </span>
                        )}
                      </div>

                      {product.volumeTiers && product.volumeTiers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedTierModalProduct(product)}
                          className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center bg-teal-50 px-2 py-1 rounded-lg"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          Volume Slabs
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      + {product.taxRate}% GST (HSN: {product.hsnCode || '999999'})
                    </div>
                  </div>

                  {/* Quantity & Add to Cart Controls */}
                  <div className="mt-4 pt-2 flex items-center space-x-2">
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(product._id, -1, product.orderQtyIncrement, product.minOrderQty)}
                        className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={product.minOrderQty || 1}
                        step={product.orderQtyIncrement || 1}
                        value={qty}
                        onChange={(e) => handleQuantityChange(product._id, e.target.value, product.orderQtyIncrement, product.minOrderQty)}
                        className="w-12 text-center text-xs font-bold py-1.5 text-slate-900 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(product._id, 1, product.orderQtyIncrement, product.minOrderQty)}
                        className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-xs shadow-teal-700/20"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* FAST TABULAR VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Brand & Category</th>
                  <th className="py-3 px-4">Pack Spec</th>
                  <th className="py-3 px-4">MOQ & Increment</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Wholesale Rate</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const qty = quantities[product._id] || product.minOrderQty || 1;
                  const hasDiscount = product.calculatedPrice < product.basePrice;

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{product.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 font-bold">{product.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{product.brand}</div>
                        <div className="text-[10px] text-slate-500">{product.category}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">{product.packSize}</span>
                        <div className="text-[10px] text-slate-500">{product.unitOfMeasurement}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-teal-700">Min {product.minOrderQty}</span>
                        {product.orderQtyIncrement > 1 && (
                          <div className="text-[10px] text-slate-500">Step of {product.orderQtyIncrement}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {product.stock > 0 ? (
                          <span className="font-bold text-emerald-700">{product.stock} units</span>
                        ) : (
                          <span className="font-bold text-rose-600">Out of Stock</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-extrabold text-sm text-slate-900">
                          ₹{(product.calculatedPrice || product.basePrice).toLocaleString('en-IN')}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₹{product.basePrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(product._id, -1, product.orderQtyIncrement, product.minOrderQty)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={product.minOrderQty || 1}
                            step={product.orderQtyIncrement || 1}
                            value={qty}
                            onChange={(e) => handleQuantityChange(product._id, e.target.value, product.orderQtyIncrement, product.minOrderQty)}
                            className="w-12 text-center text-xs font-bold py-1 text-slate-900 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(product._id, 1, product.orderQtyIncrement, product.minOrderQty)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={product.stock <= 0}
                          onClick={() => handleAddToCart(product)}
                          className="py-1.5 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs inline-flex items-center"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          Add
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

      {/* Volume Tiers Modal Drawer */}
      {selectedTierModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Volume Pricing Slabs</h4>
                <p className="text-xs text-slate-400">{selectedTierModalProduct.name}</p>
              </div>
              <button
                onClick={() => setSelectedTierModalProduct(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <p className="text-xs text-slate-600 mb-3">
                Bulk discounts are calculated automatically when your cart reaches the required quantity threshold.
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Quantity Slab</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTierModalProduct.volumeTiers?.map((tier, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {tier.minQty} {tier.maxQty ? `to ${tier.maxQty}` : '+'} {selectedTierModalProduct.unitOfMeasurement}s
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-teal-800">
                          ₹{tier.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          {tier.discountPercentage > 0 ? `${tier.discountPercentage}% OFF` : 'Base Tier'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5">
                <button
                  onClick={() => setSelectedTierModalProduct(null)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
