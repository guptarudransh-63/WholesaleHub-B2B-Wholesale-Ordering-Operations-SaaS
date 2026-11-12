import React from 'react';

export function StatusBadge({ status, type = 'order' }) {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      // Order & Account Statuses
      case 'approved':
      case 'delivered':
      case 'paid':
      case 'active':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'pending':
      case 'pending_approval':
      case 'order_placed':
      case 'processing':
      case 'partially_paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'confirmed':
      case 'packed':
      case 'dispatched':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'rejected':
      case 'cancelled':
      case 'overdue':
      case 'suspended':
      case 'discontinued':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {formatText(status)}
    </span>
  );
}

export function TierBadge({ tier }) {
  const getTierStyle = () => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'gold':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'silver':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase border ${getTierStyle()}`}
    >
      {tier || 'Standard'}
    </span>
  );
}
