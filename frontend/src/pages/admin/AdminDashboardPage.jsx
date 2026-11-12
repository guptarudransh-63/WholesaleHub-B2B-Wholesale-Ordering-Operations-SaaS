import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Package,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, anaRes] = await Promise.all([
        api.get(`/admin/dashboard?timeRange=${timeRange}`),
        api.get(`/admin/analytics?timeRange=${timeRange}`),
      ]);

      if (dashRes.success) setMetrics(dashRes.data);
      if (anaRes.success) setAnalytics(anaRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0f766e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Business Analytics & Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics calculated from real database orders, invoices, and double-entry payment ledgers.
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'all', label: 'All Time' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === range.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !metrics ? (
        <div className="py-24 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-semibold">Compiling enterprise analytics from MongoDB...</p>
        </div>
      ) : (
        <>
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Sales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Completed Net Sales</span>
                <DollarSign className="w-4 h-4 text-teal-700" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                ₹{metrics.totalSales.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center">
                <span className="font-bold text-teal-800 mr-1">{metrics.totalOrders} order(s)</span>
                <span>(Avg: ₹{metrics.avgOrderValue.toLocaleString('en-IN')})</span>
              </div>
            </div>

            {/* Total Outstanding Receivables */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Receivables Balance</span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                ₹{metrics.totalOutstanding.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Across active retailer accounts</div>
            </div>

            {/* Overdue Payments Alert */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Overdue Receivables</span>
                <AlertTriangle className={`w-4 h-4 ${metrics.totalOverdue > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
              </div>
              <div className={`text-2xl font-extrabold mt-2 ${metrics.totalOverdue > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                ₹{metrics.totalOverdue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Requires accounts follow-up</div>
            </div>

            {/* Retailer Network */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Retailer Network</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                {metrics.activeRetailers} <span className="text-sm font-semibold text-slate-400">/ {metrics.totalRetailers}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {metrics.pendingRetailers > 0 ? (
                  <span className="font-bold text-amber-600">
                    ⚠️ {metrics.pendingRetailers} pending verification
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">All accounts verified</span>
                )}
              </div>
            </div>
          </div>

          {/* Alert Ribbons */}
          {(metrics.pendingRetailers > 0 || metrics.lowStockCount > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.pendingRetailers > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      <strong>{metrics.pendingRetailers} Retailer Application(s)</strong> awaiting administrative review and credit assignment.
                    </span>
                  </div>
                  <a href="/admin/retailers" className="font-bold text-amber-800 underline shrink-0">
                    Review CRM
                  </a>
                </div>
              )}

              {metrics.lowStockCount > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>
                      <strong>{metrics.lowStockCount} Product(s)</strong> have dropped below minimum warehouse safety stock thresholds.
                    </span>
                  </div>
                  <a href="/admin/products" className="font-bold text-rose-800 underline shrink-0">
                    Restock
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Charts Row 1: Sales Trend & Order Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Revenue Generation Trend</h3>
                  <p className="text-xs text-slate-500">Gross order sales over selected timeframe</p>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                  Total: ₹{metrics.totalSales.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.salesTrend || []}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Revenue by Category</h3>
                <p className="text-xs text-slate-500">Top revenue generating categories</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.categoryStats || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#334155' }} />
                    <Tooltip
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="revenue" fill="#0f766e" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Top Retailers & Order Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Retailers Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Top Wholesale Retailers by Volume</h3>
                  <p className="text-xs text-slate-500">Highest grossing customer accounts</p>
                </div>
                <a href="/admin/retailers" className="text-xs font-bold text-teal-700 hover:underline">
                  Manage CRM &gt;
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Business Entity</th>
                      <th className="py-2.5 px-3">Tier Group</th>
                      <th className="py-2.5 px-3 text-center">Orders</th>
                      <th className="py-2.5 px-3 text-right">Total Purchases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics?.topRetailers?.map((ret) => (
                      <tr key={ret._id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{ret.businessName}</td>
                        <td className="py-2.5 px-3">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {ret.group}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{ret.orderCount}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-teal-800">
                          ₹{ret.totalSpent.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Order Lifecycle Statuses</h3>
                <p className="text-xs text-slate-500">Distribution across active workflow stages</p>
              </div>

              <div className="space-y-2 pt-2">
                {analytics?.statusDistribution?.map((st) => (
                  <div key={st.status} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                    <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                      {st.status.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {st.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
