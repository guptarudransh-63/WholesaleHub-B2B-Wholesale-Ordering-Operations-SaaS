import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/client';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  Building,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Truck,
  Package,
} from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const { user, retailerProfile, isAuthenticated } = useAuthStore();
  const { cart, items, subtotal, totalDiscount, totalTax, grandTotal, updateQuantity, removeItem, clearCart, fetchCart, isLoading } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [shippingAddress, setShippingAddress] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const isApproved = retailerProfile?.approvalStatus === 'approved';
  const availableCredit = retailerProfile?.availableCredit || 0;
  const isCreditShortfall = paymentMethod === 'credit' && grandTotal > availableCredit;
  const creditShortfallAmount = Math.max(0, grandTotal - availableCredit);

  const handleQtyChange = async (productId, newQty, increment = 1, min = 1) => {
    if (newQty < min) newQty = min;
    await updateQuantity(productId, newQty);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError(null);

    if (items.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    if (!isApproved) {
      setCheckoutError('Your retailer account is pending approval. You cannot place wholesale orders until verified.');
      return;
    }

    if (isCreditShortfall) {
      setCheckoutError(
        `Credit Limit Exceeded: Order total (₹${grandTotal.toLocaleString('en-IN')}) exceeds available credit of ₹${availableCredit.toLocaleString('en-IN')}. Shortfall: ₹${creditShortfallAmount.toLocaleString('en-IN')}. Please choose another payment method or contact your account manager.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/orders', {
        paymentMethod,
        shippingAddress: shippingAddress || retailerProfile.billingAddress,
        customerNotes,
      });

      if (res.success && res.data?.order) {
        await fetchCart();
        navigate(`/orders/${res.data.order._id}`);
      }
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400 mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Your wholesale cart is empty</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Explore our supplier catalogue to add bulk packaging, grocery, beverages, and industrial supplies.
        </p>
        <div className="mt-6 flex justify-center space-x-3">
          <Link
            to="/catalogue"
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs"
          >
            Browse Catalogue
          </Link>
          <Link
            to="/quick-order"
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
          >
            Quick Order Sheet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wholesale Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prices reflect your personalized {retailerProfile?.retailerGroup ? `${retailerProfile.retailerGroup.toUpperCase()} tier` : 'wholesale'} contract rates and volume tiers.
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50"
        >
          Clear All Items
        </button>
      </div>

      {checkoutError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">Checkout Validation Blocked</p>
            <p className="mt-0.5">{checkoutError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Wholesale Rate</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const prod = item.product;
                    const hasDiscount = item.discountPerUnit > 0;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900">{prod.name}</div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500 font-bold">{prod.sku}</span>
                            <span className="text-[10px] text-slate-400">·</span>
                            <span className="text-[10px] text-slate-600">{prod.packSize}</span>
                          </div>
                          {item.pricingType !== 'base_wholesale' && (
                            <span className="inline-block mt-1 bg-teal-50 text-teal-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-200">
                              {item.ruleName}
                            </span>
                          )}
                          {item.stockWarning && (
                            <div className="text-[10px] text-amber-600 font-semibold mt-1">
                              ⚠️ {item.stockWarning}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-extrabold text-slate-900">
                            ₹{item.unitPrice.toLocaleString('en-IN')}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-slate-400 line-through">
                              ₹{item.basePrice.toLocaleString('en-IN')}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500">
                            + {prod.taxRate}% GST
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                handleQtyChange(
                                  prod._id,
                                  item.quantity - (prod.orderQtyIncrement || 1),
                                  prod.orderQtyIncrement,
                                  prod.minOrderQty
                                )
                              }
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={prod.minOrderQty || 1}
                              step={prod.orderQtyIncrement || 1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleQtyChange(
                                  prod._id,
                                  parseInt(e.target.value, 10) || prod.minOrderQty,
                                  prod.orderQtyIncrement,
                                  prod.minOrderQty
                                )
                              }
                              className="w-12 text-center text-xs font-bold py-1 text-slate-900 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleQtyChange(
                                  prod._id,
                                  item.quantity + (prod.orderQtyIncrement || 1),
                                  prod.orderQtyIncrement,
                                  prod.minOrderQty
                                )
                              }
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {prod.unitOfMeasurement}s
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-extrabold text-sm text-slate-900">
                          ₹{item.total.toLocaleString('en-IN')}
                        </td>

                        <td className="py-4 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(prod._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
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

          {/* Delivery & Billing Address Snapshot */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center">
              <Truck className="w-4 h-4 mr-1.5 text-teal-700" />
              Delivery & Billing Destination
            </h3>
            <p className="text-xs text-slate-700">
              <span className="font-bold">{retailerProfile?.businessName || user?.name}</span>
              <br />
              {retailerProfile?.billingAddress?.street}, {retailerProfile?.billingAddress?.city},{' '}
              {retailerProfile?.billingAddress?.state} - {retailerProfile?.billingAddress?.postalCode}
              <br />
              <span className="text-slate-500 text-[11px]">
                GSTIN: {retailerProfile?.gstin || 'Unregistered'} | Contact: {retailerProfile?.phone}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Financial Summary & Checkout Options */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Order Financial Summary
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Taxable Subtotal:</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Volume & Tier Savings:
                  </span>
                  <span>- ₹{totalDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Applicable GST (CGST + SGST):</span>
                <span className="font-bold text-slate-900">₹{totalTax.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">Final Total (INR):</span>
                <span className="text-xl font-extrabold text-teal-800">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select B2B Payment Term
              </label>

              {/* Credit Terms Option */}
              <label
                className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit"
                  checked={paymentMethod === 'credit'}
                  onChange={() => setPaymentMethod('credit')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Approved Credit Terms ({(retailerProfile?.paymentTerms || 'net_15').toUpperCase().replace('_', ' ')})
                    </span>
                    <CreditCard className="w-4 h-4 text-teal-700" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Available Credit: <span className="font-bold text-slate-900">₹{availableCredit.toLocaleString('en-IN')}</span>
                  </div>
                  {isCreditShortfall && (
                    <div className="text-[11px] text-rose-700 font-bold mt-1 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                      ⚠️ Limit Exceeded: Shortfall of ₹{creditShortfallAmount.toLocaleString('en-IN')}.
                    </div>
                  )}
                </div>
              </label>

              {/* Bank Transfer / NEFT */}
              <label
                className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-900">Direct Bank Transfer (NEFT / RTGS)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Invoice generated immediately with supplier HDFC Bank IFSC details for remittance.
                  </p>
                </div>
              </label>

              {/* UPI */}
              <label
                className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-900">Corporate UPI</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pay instantly via UPI QR or VPA.</p>
                </div>
              </label>

              {/* COD */}
              <label
                className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-900">Cash on Delivery (COD)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Payment due at freight delivery dock.</p>
                </div>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Order / Delivery Notes
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Deliver to Gate 4 between 10am - 4pm"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="button"
              disabled={isSubmitting || isCreditShortfall || !isApproved}
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-teal-700/25 transition-all flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Validating & Submitting Order...
                </span>
              ) : (
                <span className="flex items-center">
                  Confirm & Place Wholesale Order
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </button>

            {!isApproved && (
              <p className="text-[11px] text-rose-600 text-center font-medium">
                * Order placement locked until administrator approves your business verification.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
