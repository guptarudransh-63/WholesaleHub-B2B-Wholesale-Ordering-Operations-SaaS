import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { useCartStore } from '../../store/cartStore';
import { Package, Search, ExternalLink, RefreshCw, FileText, Calendar, Truck, ArrowRight } from 'lucide-react';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { fetchCart } = useCartStore();

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reorderLoadingId, setReorderLoadingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      let url = `/orders?limit=50`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (orderId) => {
    setReorderLoadingId(orderId);
    try {
      const res = await api.post(`/orders/${orderId}/reorder`);
      if (res.success) {
        await fetchCart();
        navigate('/cart');
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setReorderLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wholesale Purchase Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track live dispatch status, review historical pricing snapshots, download GST invoices, and 1-click reorder.
          </p>
        </div>

        <Link
          to="/quick-order"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs"
        >
          Create New Order
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'order_placed', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading purchase orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No purchase orders found</h3>
          <p className="text-xs text-slate-500 mt-1">Place your first bulk order from the catalogue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Order Number & Date</th>
                  <th className="py-3.5 px-4">Line Items</th>
                  <th className="py-3.5 px-4">Payment Terms</th>
                  <th className="py-3.5 px-4 text-right">Order Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/orders/${order._id}`}
                        className="font-extrabold text-teal-800 hover:text-teal-900 text-sm flex items-center"
                      >
                        {order.orderNumber}
                        <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                      </Link>
                      <div className="text-[11px] text-slate-500 flex items-center mt-0.5">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {order.items.length} product(s) (
                        {order.items.reduce((s, i) => s + i.quantity, 0)} units)
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {order.items.map((i) => i.name).join(', ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold uppercase text-[11px] text-slate-800">
                        {order.paymentTerms.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-500 capitalize">via {order.paymentMethod}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-sm text-slate-900">
                      ₹{order.grandTotal.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={order.orderStatus} />
                      {order.trackingInfo?.trackingNumber && (
                        <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-center">
                          <Truck className="w-3 h-3 mr-0.5 text-teal-600" />
                          {order.trackingInfo.carrier}: {order.trackingInfo.trackingNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={order.paymentStatus} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {order.invoiceId && (
                          <a
                            href={`/api/invoices/${order.invoiceId._id || order.invoiceId}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-500 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            title="Download Tax Invoice PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          disabled={reorderLoadingId === order._id}
                          onClick={() => handleReorder(order._id)}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold text-xs inline-flex items-center border border-teal-200 transition-colors"
                          title="1-Click Reorder"
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${reorderLoadingId === order._id ? 'animate-spin' : ''}`} />
                          Reorder
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
