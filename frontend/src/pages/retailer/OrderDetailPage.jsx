import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { useCartStore } from '../../store/cartStore';
import {
  Package,
  Calendar,
  FileText,
  Truck,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCart } = useCartStore();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async () => {
    setIsReordering(true);
    try {
      const res = await api.post(`/orders/${id}/reorder`);
      if (res.success) {
        await fetchCart();
        navigate('/cart');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsReordering(false);
    }
  };

  const handleCancelOrder = async () => {
    const reason = prompt('Please specify reason for order cancellation:');
    if (!reason) return;

    setIsCancelling(true);
    try {
      const res = await api.post(`/orders/${id}/cancel`, { reason });
      if (res.success) {
        alert(res.message);
        loadOrder();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800">Order not found</h2>
        <Link to="/orders" className="mt-4 inline-block text-xs font-bold text-teal-700 underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const canCancel = ['order_placed', 'pending_approval', 'confirmed', 'processing'].includes(order.orderStatus);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/orders"
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to All Orders
        </Link>

        <div className="flex items-center space-x-3">
          {order.invoiceId && (
            <a
              href={`/api/invoices/${order.invoiceId._id || order.invoiceId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs"
            >
              <FileText className="w-4 h-4 mr-1.5 text-teal-700" />
              Download GST Tax Invoice (PDF)
            </a>
          )}

          <button
            type="button"
            disabled={isReordering}
            onClick={handleReorder}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isReordering ? 'animate-spin' : ''}`} />
            Reorder Items
          </button>

          {canCancel && (
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancelOrder}
              className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Order Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900">{order.orderNumber}</h1>
            <StatusBadge status={order.orderStatus} />
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </span>
            <span>·</span>
            <span>Terms: {(order.paymentTerms || 'net_15').toUpperCase().replace('_', ' ')}</span>
            <span>·</span>
            <span className="capitalize">Method: {order.paymentMethod}</span>
          </div>
        </div>

        <div className="md:text-right">
          <div className="text-xs text-slate-500">Order Grand Total</div>
          <div className="text-2xl font-extrabold text-teal-800">
            ₹{order.grandTotal.toLocaleString('en-IN')}
          </div>
          <div className="mt-1">
            <StatusBadge status={order.paymentStatus} />
          </div>
        </div>
      </div>

      {/* Dispatch Tracking Card (if available) */}
      {order.trackingInfo?.trackingNumber && (
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-teal-300">Active Freight Dispatch</p>
              <p className="text-base font-extrabold mt-0.5">
                {order.trackingInfo.carrier}: {order.trackingInfo.trackingNumber}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Dispatched on: {order.trackingInfo.dispatchedAt ? new Date(order.trackingInfo.dispatchedAt).toLocaleDateString('en-IN') : 'Recently'}
              </p>
            </div>
          </div>
          {order.trackingInfo.estimatedDelivery && (
            <div className="sm:text-right">
              <div className="text-xs text-slate-300">Estimated Dock Delivery:</div>
              <div className="text-sm font-bold text-white">
                {new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid: Line Items & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Line Item Snapshots Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Purchased Line Item Snapshots ({order.items.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Applied Unit Rate</th>
                    <th className="py-3 px-4 text-right">Tax (GST)</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-bold">{item.sku}</div>
                        {item.pricingRuleName && (
                          <div className="mt-1 text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded inline-block">
                            {item.pricingRuleName}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {item.quantity} {item.unitOfMeasurement}s
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          ₹{item.appliedUnitPrice.toLocaleString('en-IN')}
                        </div>
                        {item.discountPerUnit > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Saved ₹{item.discountPerUnit}/unit
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        <div>₹{item.taxAmount.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">({item.taxRate}%)</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                        ₹{item.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown Totals */}
            <div className="p-6 bg-slate-50/60 border-t border-slate-200">
              <div className="max-w-xs ml-auto space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal (Pre-tax):</span>
                  <span className="font-bold text-slate-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Applied Volume & Tier Discounts:</span>
                    <span>- ₹{order.totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Taxes Total:</span>
                  <span className="font-bold text-slate-900">₹{order.totalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-teal-800 text-base">₹{order.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Activity History & Delivery Address */}
        <div className="space-y-6">
          {/* Order Activity Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-teal-700" />
              Order Activity Trail
            </h3>
            <div className="space-y-4">
              {order.timeline?.map((step, idx) => (
                <div key={idx} className="relative pl-6 pb-2 border-l-2 border-teal-200 last:border-0 last:pb-0">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-teal-700 ring-4 ring-white"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{step.status}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {step.note && <p className="text-xs text-slate-600 mt-0.5">{step.note}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">By {step.actor || 'System'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Billing Address */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center">
              <Building className="w-4 h-4 mr-1.5 text-teal-700" />
              Shipping Destination
            </h3>
            <div className="text-xs text-slate-700">
              <p className="font-bold">{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
              </p>
              <p className="text-slate-500 mt-1">Phone: {order.shippingAddress?.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
