import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { StatusBadge, TierBadge } from '../../components/common/Badge';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Edit,
  ExternalLink,
  Shield,
  Eye,
  Sliders,
  X,
} from 'lucide-react';

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Retailer for 360 CRM Modal
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Quick Edit States
  const [editCreditLimit, setEditCreditLimit] = useState('');
  const [editTerms, setEditTerms] = useState('net_15');
  const [editGroup, setEditGroup] = useState('standard');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadRetailers();
  }, [statusFilter, groupFilter]);

  const loadRetailers = async () => {
    setIsLoading(true);
    try {
      let url = `/admin/retailers?limit=100`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (groupFilter !== 'all') url += `&group=${groupFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.success) {
        setRetailers(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openRetailerModal = async (ret) => {
    setSelectedRetailer(ret);
    setEditCreditLimit(ret.creditLimit || 0);
    setEditTerms(ret.paymentTerms || 'net_15');
    setEditGroup(ret.retailerGroup || 'standard');
    setIsModalOpen(true);
    setIsLoadingDetails(true);

    try {
      const res = await api.get(`/admin/retailers/${ret._id}`);
      if (res.success) {
        setModalDetails(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (retailerId, newStatus) => {
    try {
      const res = await api.patch(`/admin/retailers/${retailerId}/status`, {
        status: newStatus,
        internalNotes: `Status changed to ${newStatus} by admin`,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await loadRetailers();
        if (selectedRetailer?._id === retailerId) {
          openRetailerModal({ ...selectedRetailer, approvalStatus: newStatus });
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveCreditAndTerms = async (e) => {
    e.preventDefault();
    if (!selectedRetailer) return;

    try {
      const resCredit = await api.patch(`/admin/retailers/${selectedRetailer._id}/credit`, {
        creditLimit: parseFloat(editCreditLimit),
        paymentTerms: editTerms,
      });

      const resGroup = await api.patch(`/admin/retailers/${selectedRetailer._id}/group`, {
        retailerGroup: editGroup,
      });

      if (resCredit.success && resGroup.success) {
        setFeedback({ type: 'success', message: 'Updated credit limits, payment terms, and tier.' });
        await loadRetailers();
        openRetailerModal({
          ...selectedRetailer,
          creditLimit: parseFloat(editCreditLimit),
          paymentTerms: editTerms,
          retailerGroup: editGroup,
        });
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
            Retailer Accounts CRM & Credit Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review onboarding registrations, approve/reject retailer applications, assign credit limits, and set pricing tiers.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {['all', 'pending', 'approved', 'rejected', 'suspended'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Group Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {['all', 'platinum', 'gold', 'silver', 'standard'].map((grp) => (
              <button
                key={grp}
                onClick={() => setGroupFilter(grp)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                  groupFilter === grp
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search business, contact, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRetailers()}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Retailers Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading retailer directory...</p>
        </div>
      ) : retailers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No retailers match your filters</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting filters or search criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Business & Contact</th>
                  <th className="py-3.5 px-4">Entity & GSTIN</th>
                  <th className="py-3.5 px-4">Tier Group</th>
                  <th className="py-3.5 px-4 text-center">Account Status</th>
                  <th className="py-3.5 px-4">Payment Terms</th>
                  <th className="py-3.5 px-4 text-right">Credit Limit</th>
                  <th className="py-3.5 px-4 text-right">Outstanding</th>
                  <th className="py-3.5 px-4 text-center">CRM Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {retailers.map((ret) => (
                  <tr key={ret._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">{ret.businessName}</div>
                      <div className="text-[11px] text-slate-500">
                        {ret.contactPerson} · {ret.phone}
                      </div>
                      <div className="text-[10px] text-slate-400">{ret.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{ret.businessType}</div>
                      <div className="font-mono text-[10px] text-slate-500 uppercase font-bold">
                        {ret.gstin || 'Unregistered'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <TierBadge tier={ret.retailerGroup} />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={ret.approvalStatus} />
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 uppercase text-[11px]">
                        {(ret.paymentTerms || 'net_15').replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      ₹{(ret.creditLimit || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-amber-700">
                      ₹{(ret.outstandingBalance || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openRetailerModal(ret)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                      >
                        Manage Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360-Degree Retailer Management Modal */}
      {isModalOpen && selectedRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{selectedRetailer.businessName}</h3>
                <p className="text-xs text-slate-400">
                  GSTIN: {selectedRetailer.gstin || 'Unregistered'} · Entity: {selectedRetailer.businessType}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFeedback(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Status Action Buttons Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Current Status:</span>
                  <StatusBadge status={selectedRetailer.approvalStatus} />
                </div>

                <div className="flex items-center space-x-2">
                  {selectedRetailer.approvalStatus !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRetailer._id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                    >
                      ✓ Approve Retailer
                    </button>
                  )}
                  {selectedRetailer.approvalStatus !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRetailer._id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                    >
                      ✕ Reject
                    </button>
                  )}
                  {selectedRetailer.approvalStatus === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRetailer._id, 'suspended')}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                    >
                      Suspend Account
                    </button>
                  )}
                </div>
              </div>

              {/* Credit Limit & Tier Configuration Form */}
              <form onSubmit={handleSaveCreditAndTerms} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center">
                  <CreditCard className="w-4 h-4 mr-1.5 text-teal-700" />
                  Credit Limit & Wholesale Pricing Tier
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assigned Group Tier</label>
                    <select
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="standard">Standard Tier (Base Wholesale)</option>
                      <option value="silver">Silver Tier (2% off)</option>
                      <option value="gold">Gold Tier (5% off)</option>
                      <option value="platinum">Platinum Tier (Custom Contract Rates)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Credit Limit (INR)</label>
                    <input
                      type="number"
                      value={editCreditLimit}
                      onChange={(e) => setEditCreditLimit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Approved Payment Terms</label>
                    <select
                      value={editTerms}
                      onChange={(e) => setEditTerms(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="advance">Advance Payment (No Credit)</option>
                      <option value="cod">Cash on Delivery (COD)</option>
                      <option value="net_7">Net 7 Days</option>
                      <option value="net_15">Net 15 Days</option>
                      <option value="net_30">Net 30 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    Save Credit & Terms
                  </button>
                </div>
              </form>

              {/* Invoices & Order Snapshots */}
              {isLoadingDetails ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Loading customer financial ledger...
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Recent Purchase Invoices ({modalDetails?.invoices?.length || 0})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Grand Total</th>
                          <th className="py-2.5 px-3 text-right">Paid Amount</th>
                          <th className="py-2.5 px-3 text-right">Outstanding</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalDetails?.invoices?.map((inv) => (
                          <tr key={inv._id}>
                            <td className="py-2 px-3 font-mono font-bold text-teal-800">{inv.invoiceNumber}</td>
                            <td className="py-2 px-3 text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                            <td className="py-2 px-3 text-right text-emerald-700">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                            <td className="py-2 px-3 text-right font-extrabold text-amber-700">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                            <td className="py-2 px-3 text-center"><StatusBadge status={inv.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
