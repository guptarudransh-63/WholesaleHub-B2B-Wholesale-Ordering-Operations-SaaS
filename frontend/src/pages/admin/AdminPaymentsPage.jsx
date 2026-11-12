import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { CreditCard, Plus, CheckCircle2, AlertCircle, X, Search, DollarSign } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetRetailerId, setTargetRetailerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadPayments();
    loadRetailers();
  }, []);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/payments?limit=100');
      if (res.success) setPayments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRetailers = async () => {
    try {
      const res = await api.get('/admin/retailers?status=approved&limit=100');
      if (res.success) setRetailers(res.data);
    } catch (e) {
      // ignore
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const num = parseFloat(amount);
    if (!targetRetailerId || !num || num <= 0) {
      alert('Please select a retailer and enter a valid payment amount.');
      return;
    }

    if (!transactionReference.trim()) {
      alert('Transaction reference or UTR is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/payments', {
        retailerId: targetRetailerId,
        amount: num,
        paymentMethod,
        transactionReference,
        notes,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await loadPayments();
        setTimeout(() => {
          setIsModalOpen(false);
          setAmount('');
          setTransactionReference('');
          setNotes('');
        }, 1500);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Payment Reconciliation & Settlements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record customer remittance entries (NEFT, UPI, Cheque), perform FIFO invoice allocations, and restore available credit limits.
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
          Record Customer Payment
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Total Collections Reconciled: </span>
            <span className="font-extrabold text-base text-slate-900 ml-1">
              ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="ml-2 text-slate-400">across {payments.length} transactions</span>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading payment transactions...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No payment transactions recorded</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Payment Ref #</th>
                  <th className="py-3.5 px-4">Retailer Customer</th>
                  <th className="py-3.5 px-4">Remittance Mode</th>
                  <th className="py-3.5 px-4">Bank UTR / Transaction #</th>
                  <th className="py-3.5 px-4 text-right">Amount Remitted</th>
                  <th className="py-3.5 px-4 text-center">Invoices Settled</th>
                  <th className="py-3.5 px-4">Date & Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800 text-sm">
                      {pay.paymentNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{pay.retailer?.businessName}</div>
                      <div className="text-[11px] text-slate-500">{pay.retailer?.contactPerson}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold uppercase text-[11px] text-slate-800">
                        {pay.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-slate-700">
                      {pay.transactionReference}
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                      ₹{pay.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-teal-800">
                      {pay.allocations?.length || 1} invoice(s)
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      <div>{new Date(pay.paymentDate).toLocaleDateString('en-IN')}</div>
                      <div className="text-[10px] text-slate-400">By {pay.recordedBy?.name || 'Operations'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Record Customer Remittance</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{feedback.message}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Customer Retailer *</label>
                <select
                  required
                  value={targetRetailerId}
                  onChange={(e) => setTargetRetailerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="">-- Choose Retailer Account --</option>
                  {retailers.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.businessName} (Balance: ₹{r.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Channel *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="upi">UPI Corporate</option>
                  <option value="cheque">Cheque Clearing</option>
                  <option value="cash">Direct Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank UTR / Cheque # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC-NEFT-991204819"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Remittance Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleared via HDFC bank statement dated 01 Nov"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Save & Reconcile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
