import { useEffect, useMemo, useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Wallet,
  XCircle,
} from 'lucide-react';

import {
  cancelSubscription,
  createCheckout,
  createSubscription,
  getMyPayableFees,
  getMyPayments,
  getMySubscriptions,
  resumeSubscription,
} from '../../services/payment.service';

import type {
  PayableFee,
  Payment,
  Subscription,
} from '../../services/payment.service';

function formatMoney(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusClass(status: string) {
  switch (status) {
    case 'paid':
    case 'active':
      return 'bg-green-100 text-green-700';

    case 'failed':
    case 'past_due':
      return 'bg-red-100 text-red-700';

    case 'refunded':
      return 'bg-purple-100 text-purple-700';

    case 'pending':
    case 'trialing':
      return 'bg-yellow-100 text-yellow-700';

    case 'cancelled':
      return 'bg-gray-100 text-gray-700';

    case 'incomplete':
    case 'incomplete_expired':
      return 'bg-orange-100 text-orange-700';

    case 'unpaid':
      return 'bg-red-100 text-red-700';

    case 'paused':
      return 'bg-gray-100 text-gray-700';

    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getErrorMessage(error: any, fallback: string) {
  if (Array.isArray(error?.response?.data?.message)) {
    return error.response.data.message.join(', ');
  }

  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return fallback;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);

  const [fees, setFees] = useState<PayableFee[]>([]);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [paymentsData, feesData, subscriptionsData] = await Promise.all([
        getMyPayments(),
        getMyPayableFees(),
        getMySubscriptions(),
      ]);

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);

      setFees(Array.isArray(feesData) ? feesData : []);

      setSubscriptions(
        Array.isArray(subscriptionsData) ? subscriptionsData : [],
      );
    } catch (err: any) {
      console.error('Payment page error:', err);

      setError(getErrorMessage(err, 'Failed to load payment information.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPaid = useMemo(() => {
    return payments
      .filter((payment) => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  const failedPayments = payments.filter(
    (payment) => payment.status === 'failed',
  ).length;

  const pendingPayments = payments.filter(
    (payment) => payment.status === 'pending',
  ).length;

  const activeSubscription =
    subscriptions.find(
      (subscription) =>
        (subscription.status === 'active' ||
          subscription.status === 'trialing' ||
          subscription.status === 'past_due') &&
        !subscription.cancelAtPeriodEnd,
    ) || null;

  const handlePay = async (feeId: string) => {
    try {
      setActionLoading(`pay-${feeId}`);

      const result = await createCheckout(feeId);

      const checkoutUrl = result?.checkoutUrl || result?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      alert('Stripe checkout URL was not returned.');
    } catch (err: any) {
      console.error('Payment checkout error:', err);

      alert(getErrorMessage(err, 'Unable to start payment.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscribe = async (feeId: string) => {
    try {
      setActionLoading(`subscribe-${feeId}`);

      const result = await createSubscription(feeId);

      const checkoutUrl = result?.checkoutUrl || result?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      alert('Stripe subscription checkout URL was not returned.');
    } catch (err: any) {
      console.error('Subscription checkout error:', err);

      alert(getErrorMessage(err, 'Unable to start subscription.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const confirmed = window.confirm(
      'Cancel this subscription at the end of the current billing period?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`cancel-${subscriptionId}`);

      await cancelSubscription(subscriptionId);

      await loadData();
    } catch (err: any) {
      console.error('Cancel subscription error:', err);

      alert(getErrorMessage(err, 'Unable to cancel subscription.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeSubscription = async (subscriptionId: string) => {
    const confirmed = window.confirm(
      'Resume this subscription and continue automatic monthly payments?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`resume-${subscriptionId}`);

      await resumeSubscription(subscriptionId);

      await loadData();
    } catch (err: any) {
      console.error('Resume subscription error:', err);

      alert(getErrorMessage(err, 'Unable to resume subscription.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your school fees, payments and subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error */}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* Summary */}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Paid */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(totalPaid)}
              </p>
            </div>

            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Pending */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {pendingPayments}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Failed */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {failedPayments}
              </p>
            </div>

            <div className="rounded-lg bg-red-100 p-3 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Subscriptions */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Subscriptions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Automatically pay your monthly school fee.
            </p>
          </div>

          <CreditCard className="h-6 w-6 text-blue-600" />
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-gray-400" />

            <p className="mt-3 font-medium text-gray-900">No subscriptions</p>

            <p className="mt-1 text-sm text-gray-500">
              You don't have any monthly subscriptions yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {subscriptions.map((subscription) => (
              <div key={subscription._id} className="p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          subscription.status,
                        )}`}
                      >
                        {subscription.status.replace('_', ' ')}
                      </span>

                      {subscription.cancelAtPeriodEnd && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          Cancellation scheduled
                        </span>
                      )}

                      {activeSubscription?._id === subscription._id && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-gray-900">
                      {formatMoney(subscription.amount, subscription.currency)}
                      {' / month'}
                    </p>

                    {subscription.currentPeriodEnd && (
                      <p className="mt-1 text-sm text-gray-500">
                        Current period ends{' '}
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    )}

                    {subscription.cancelAtPeriodEnd && (
                      <p className="mt-1 text-sm text-orange-600">
                        Automatic payments will stop after the current billing
                        period.
                      </p>
                    )}

                    {subscription.status === 'past_due' && (
                      <p className="mt-1 text-sm text-red-600">
                        The latest monthly payment failed. Please check your
                        Stripe payment method.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Cancel */}

                    {(subscription.status === 'active' ||
                      subscription.status === 'trialing') &&
                      !subscription.cancelAtPeriodEnd && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCancelSubscription(subscription._id)
                          }
                          disabled={
                            actionLoading === `cancel-${subscription._id}`
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === `cancel-${subscription._id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          Cancel Subscription
                        </button>
                      )}

                    {/* Resume */}

                    {subscription.cancelAtPeriodEnd && (
                      <button
                        type="button"
                        onClick={() =>
                          handleResumeSubscription(subscription._id)
                        }
                        disabled={
                          actionLoading === `resume-${subscription._id}`
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === `resume-${subscription._id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Resume Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outstanding Fees */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Outstanding Fees
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Fees that still require payment.
          </p>
        </div>

        {fees.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />

            <p className="mt-3 font-medium text-gray-900">
              No outstanding fees
            </p>

            <p className="mt-1 text-sm text-gray-500">
              All your fees are paid.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {fees.map((fee) => (
              <div
                key={fee._id}
                className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center"
              >
                <div>
                  <h3 className="font-semibold capitalize text-gray-900">
                    {fee.feeType} Fee
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {fee.month || 'Fee'} • {fee.academicSession}
                  </p>

                  <p className="mt-2 text-sm">
                    Remaining:{' '}
                    <span className="font-semibold text-red-600">
                      {formatMoney(fee.remainingAmount)}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Due: {formatDate(fee.dueDate)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* One-time payment */}

                  <button
                    type="button"
                    onClick={() => handlePay(fee._id)}
                    disabled={actionLoading === `pay-${fee._id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === `pay-${fee._id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    Pay Now
                  </button>

                  {/* Monthly subscription */}

                  {!activeSubscription && (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(fee._id)}
                      disabled={actionLoading === `subscribe-${fee._id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {actionLoading === `subscribe-${fee._id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Monthly
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment History
          </h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No payment history yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Payment</th>

                  <th className="px-6 py-3">Type</th>

                  <th className="px-6 py-3">Amount</th>

                  <th className="px-6 py-3">Status</th>

                  <th className="px-6 py-3">Date</th>

                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {payment.receiptNumber || payment._id.slice(-8)}
                      </div>

                      {payment.failureMessage && (
                        <div className="mt-1 max-w-xs text-xs text-red-500">
                          {payment.failureMessage}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 capitalize text-gray-600">
                      {payment.paymentType.replace('_', ' ')}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          payment.status,
                        )}`}
                      >
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/payments/${payment._id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </a>

                        {(payment.status === 'paid' ||
                          payment.status === 'refunded') && (
                          <a
                            href={`/payments/${payment._id}/receipt`}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Receipt
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
