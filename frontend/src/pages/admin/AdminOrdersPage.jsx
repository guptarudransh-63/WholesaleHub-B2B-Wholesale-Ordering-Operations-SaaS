import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import {
  Package,
  Search,
  Filter,
  Truck,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
  Sliders,
  X,
  AlertCircle,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Status Update & Tracking Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [carrier, setCarrier] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      let url = `/admin/orders?limit=100`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.success) setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setStatusNote('');
    setCarrier(order.trackingInfo?.carrier || 'Delhivery Express');
    setTrackingNumber(order.trackingInfo?.trackingNumber || '');
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsUpdating(true);
    setFeedback(null);

    try {
      // 1. Update status
      const resStatus = await api.patch(`/admin/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        note: statusNote,
      });

      // 2. If tracking info provided or dispatched
      if (trackingNumber.trim()) {
        await api.patch(`/admin/orders/${selectedOrder._id}/tracking`, {
          carrier,
          trackingNumber,
        });
      }

      if (resStatus.success) {
        setFeedback({ type: 'success', message: 'Order status & logistics updated successfully.' });
        await loadOrders();
        setTimeout(() => setIsModalOpen(false), 1200);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Orders Processing & Dispatch Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process bulk fulfillment workflows, manage order lifecycle transitions, and record carrier tracking details.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'order_placed', 'confirmed', 'processing', 'packed', 'dispatched', 'delivered', 'cancelled'].map((st) => (
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
          <p className="text-xs text-slate-500 font-semibold">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No orders found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Order Number & Date</th>
                  <th className="py-3.5 px-4">Retailer Account</th>
                  <th className="py-3.5 px-4">Line Items</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const ret = order.retailer;

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800 text-sm">
                        {order.orderNumber}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{ret?.businessName || 'Retailer Account'}</div>
                        <div className="text-[11px] text-slate-500">{ret?.contactPerson} · {ret?.phone}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{order.items.length} product(s)</div>
                        <div className="text-[10px] text-slate-500">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} total units
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-sm text-slate-900">
                        ₹{order.grandTotal.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={order.orderStatus} />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={order.paymentStatus} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openOrderModal(order)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                        >
                          Process & Dispatch
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

      {/* Order Status & Dispatch Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Fulfillment: {selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-400">
                  {selectedOrder.retailer?.businessName} · ₹{selectedOrder.grandTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrderStatus} className="p-6 space-y-4 text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{feedback.message}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Update Fulfillment Stage *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                >
                  <option value="order_placed">Order Placed</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="confirmed">Confirmed (Procurement Approved)</option>
                  <option value="processing">Processing (Picking in Warehouse)</option>
                  <option value="packed">Packed (Ready at Dock)</option>
                  <option value="dispatched">Dispatched (In Transit)</option>
                  <option value="delivered">Delivered (Received by Retailer)</option>
                  <option value="cancelled">Cancelled (Restore Stock & Credit)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Timeline Note</label>
                <input
                  type="text"
                  placeholder="e.g. Pallets loaded on Delhivery truck #DL-1AB-4920"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Dispatch Logistics Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center">
                  <Truck className="w-4 h-4 mr-1 text-teal-700" />
                  Logistics Carrier & Tracking Details
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Carrier / Transporter</label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                    >
                      <option value="Delhivery Express">Delhivery Express</option>
                      <option value="BlueDart Apex Freight">BlueDart Apex Freight</option>
                      <option value="GATI-KWE Surface">GATI-KWE Surface</option>
                      <option value="V-Trans Logistics">V-Trans Logistics</option>
                      <option value="Supplier Local Fleet">Supplier Local Fleet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Airway Bill / Tracking #</label>
                    <input
                      type="text"
                      placeholder="e.g. DEL-209930184"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                    />
                  </div>
                </div>
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
                  disabled={isUpdating}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Save Order State'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
