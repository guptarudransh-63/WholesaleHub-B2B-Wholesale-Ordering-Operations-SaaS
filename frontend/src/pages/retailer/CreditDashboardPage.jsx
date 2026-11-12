import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import {
  CreditCard,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  FileText,
  DollarSign,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';

export default function CreditDashboardPage() {
  const [creditData, setCreditData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Remittance Form State
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState(null);

  useEffect(() => {
    loadCreditProfile();
  }, []);

  const loadCreditProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/retailer/credit');
      if (res.success) {
        setCreditData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentFeedback(null);

    const num = parseFloat(amount);
    if (!num || num <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (!transactionReference.trim()) {
      alert('Please provide the transaction reference or UTR number.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await api.post('/payments', {
        amount: num,
        paymentMethod,
        transactionReference,
        notes,
      });

      if (res.success) {
        setPaymentFeedback({
          type: 'success',
          message: res.message || 'Payment recorded and allocated successfully!',
        });
        setAmount('');
        setTransactionReference('');
        setNotes('');
        await loadCreditProfile();
        setTimeout(() => {
          setIsPaymentModalOpen(false);
          setPaymentFeedback(null);
        }, 2000);
      }
    } catch (err) {
      setPaymentFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-xs text-slate-500 font-semibold">Synchronizing account receivables & ledger...</p>
      </div>
    );
  }

  const { creditLimit = 0, outstandingBalance = 0, availableCredit = 0, paymentTerms = 'net_15', unpaidInvoices = [], ledgerHistory = [] } =
    creditData || {};

  const utilizationPercentage = creditLimit > 0 ? Math.min(100, Math.round((outstandingBalance / creditLimit) * 100)) : 0;

  const now = new Date();
  const overdueInvoices = unpaidInvoices.filter((inv) => new Date(inv.dueDate) < now);
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Credit Line & Account Receivables</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time credit limit utilization, unpaid invoices, payment terms, and double-entry transaction ledgers.
          </p>
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Record Payment Remittance (UTR)
        </button>
      </div>

      {/* Overdue Warning Alert (if any overdue invoices exist) */}
      {overdueTotal > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-sm">Overdue Payment Notice: </span>
            <span>
              You have {overdueInvoices.length} invoice(s) totalling{' '}
              <strong className="text-rose-700">₹{overdueTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> past
              their agreed {paymentTerms.toUpperCase().replace('_', ' ')} due date. Please remit payment promptly to maintain credit line privileges.
            </span>
          </div>
        </div>
      )}

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Credit Limit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Credit Limit</span>
            <CreditCard className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{creditLimit.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Approved Terms:{' '}
            <span className="font-bold text-slate-800 uppercase">{paymentTerms.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Available Credit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Available for Orders</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            ₹{availableCredit.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {creditLimit > 0 ? `${100 - utilizationPercentage}% limit remaining` : 'Credit not configured'}
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {unpaidInvoices.length} unpaid / partial invoice(s)
          </div>
        </div>

        {/* Overdue Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Overdue Amount</span>
            <AlertTriangle className={`w-4 h-4 ${overdueTotal > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-extrabold mt-2 ${overdueTotal > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            ₹{overdueTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overdueInvoices.length} past-due invoice(s)
          </div>
        </div>
      </div>

      {/* Credit Gauge Progress Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-slate-700">Credit Limit Utilization</span>
          <span className="text-teal-800">{utilizationPercentage}% used</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              utilizationPercentage > 85 ? 'bg-rose-500' : utilizationPercentage > 60 ? 'bg-amber-500' : 'bg-teal-600'
            }`}
            style={{ width: `${utilizationPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Unpaid Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Unpaid & Partially Paid Invoices ({unpaidInvoices.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Automatic FIFO payment allocation applied</span>
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-bold text-slate-800">All invoices settled!</p>
            <p className="text-[11px] text-slate-400">You currently have zero outstanding receivables.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Invoice Amount</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={inv.status === 'overdue' ? 'font-bold text-rose-600' : 'text-slate-800'}>
                        {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                      ₹{inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ₹{inv.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/api/invoices/${inv._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:text-teal-800 font-bold"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credit Ledger Audit History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Account Credit Ledger Audit Trail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4 text-right">Debit (+)</th>
                <th className="py-3 px-4 text-right">Credit (-)</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerHistory.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(item.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-semibold uppercase text-[11px] text-slate-800">
                    {item.transactionType.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {item.referenceNumber || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {item.debit > 0 ? `₹${item.debit.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    {item.credit > 0 ? `₹${item.credit.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                    ₹{item.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Remittance Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base">Record Payment Remittance</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Remittances will be automatically allocated against your oldest outstanding invoices and credited to your available limit.
              </p>

              {paymentFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    paymentFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {paymentFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{paymentFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Payment Amount (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Remittance Mode *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="upi">UPI / QR Remittance</option>
                  <option value="cheque">Cheque Deposit</option>
                  <option value="cash">Direct Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Bank UTR / Transaction Reference # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC-NEFT-991204819"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remittance Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid against INV-2026-1002"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50"
                >
                  {isSubmittingPayment ? 'Recording...' : 'Submit Remittance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
