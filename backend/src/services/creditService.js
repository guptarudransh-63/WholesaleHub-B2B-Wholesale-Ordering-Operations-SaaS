import { RetailerProfile } from '../models/RetailerProfile.js';
import { Invoice } from '../models/Invoice.js';
import { CreditLedger } from '../models/CreditLedger.js';

/**
 * Recalculates and synchronizes retailer's outstanding balance and available credit from invoices.
 */
export async function recalculateRetailerCredit(retailerId) {
  const profile = await RetailerProfile.findById(retailerId);
  if (!profile) {
    throw new Error('Retailer profile not found');
  }

  // Sum all outstanding amounts from unpaid and partially paid non-cancelled invoices
  const unpaidInvoices = await Invoice.find({
    retailer: retailerId,
    status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
  });

  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);
  const roundedOutstanding = Number(totalOutstanding.toFixed(2));
  const creditLimit = profile.creditLimit || 0;
  const availableCredit = Math.max(0, Number((creditLimit - roundedOutstanding).toFixed(2)));

  profile.outstandingBalance = roundedOutstanding;
  profile.availableCredit = availableCredit;
  await profile.save();

  return {
    creditLimit,
    outstandingBalance: roundedOutstanding,
    availableCredit,
    unpaidInvoicesCount: unpaidInvoices.length,
  };
}

/**
 * Validates if retailer has sufficient credit to place an order.
 */
export async function checkCreditAvailability(retailerId, orderTotal) {
  const profile = await RetailerProfile.findById(retailerId);
  if (!profile) {
    return { allowed: false, reason: 'Retailer profile not found' };
  }

  if (profile.approvalStatus !== 'approved') {
    return { allowed: false, reason: 'Retailer account is not approved for credit orders' };
  }

  const { availableCredit, creditLimit, outstandingBalance } = await recalculateRetailerCredit(retailerId);

  if (orderTotal > availableCredit) {
    return {
      allowed: false,
      availableCredit,
      creditLimit,
      outstandingBalance,
      shortfall: Number((orderTotal - availableCredit).toFixed(2)),
      reason: `Order total (₹${orderTotal.toLocaleString('en-IN')}) exceeds available credit limit (₹${availableCredit.toLocaleString('en-IN')}). Shortfall: ₹${(orderTotal - availableCredit).toLocaleString('en-IN')}`,
    };
  }

  return {
    allowed: true,
    availableCredit,
    creditLimit,
    outstandingBalance,
  };
}

/**
 * Records an order charge against credit limit in the ledger and updates balances.
 */
export async function recordCreditCharge({
  retailerId,
  orderId,
  invoiceId,
  amount,
  referenceNumber,
  actorId = null,
  note = 'Order placed on credit terms',
}) {
  const profile = await RetailerProfile.findById(retailerId);
  if (!profile) throw new Error('Retailer profile not found');

  const newBalance = Number(((profile.outstandingBalance || 0) + amount).toFixed(2));
  const newAvailable = Math.max(0, Number(((profile.creditLimit || 0) - newBalance).toFixed(2)));

  profile.outstandingBalance = newBalance;
  profile.availableCredit = newAvailable;
  await profile.save();

  const ledgerEntry = await CreditLedger.create({
    retailer: retailerId,
    transactionType: 'order_charge',
    debit: amount,
    credit: 0,
    balanceAfter: newBalance,
    availableCreditAfter: newAvailable,
    order: orderId,
    invoice: invoiceId,
    referenceNumber,
    note,
    actor: actorId,
  });

  return ledgerEntry;
}

/**
 * Records a payment credit in the ledger and recalculates balances.
 */
export async function recordCreditPayment({
  retailerId,
  paymentId,
  amount,
  referenceNumber,
  actorId = null,
  note = 'Payment received and allocated to invoices',
}) {
  const profile = await RetailerProfile.findById(retailerId);
  if (!profile) throw new Error('Retailer profile not found');

  const newBalance = Math.max(0, Number(((profile.outstandingBalance || 0) - amount).toFixed(2)));
  const newAvailable = Math.max(0, Number(((profile.creditLimit || 0) - newBalance).toFixed(2)));

  profile.outstandingBalance = newBalance;
  profile.availableCredit = newAvailable;
  await profile.save();

  const ledgerEntry = await CreditLedger.create({
    retailer: retailerId,
    transactionType: 'payment_received',
    debit: 0,
    credit: amount,
    balanceAfter: newBalance,
    availableCreditAfter: newAvailable,
    payment: paymentId,
    referenceNumber,
    note,
    actor: actorId,
  });

  return ledgerEntry;
}
