import { useEffect, useState } from 'react';

import {
  AlertCircle,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  RotateCcw,
  Users,
  XCircle,
} from 'lucide-react';

import {
  getAdminPaymentDashboard,
  getAdminPayments,
  refundPayment,
} from '../../services/payment.service';

import type { Payment, PaymentDashboard } from '../../types/payment';

function money(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

function statusClass(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';

    case 'failed':
      return 'bg-red-100 text-red-700';

    case 'refunded':
      return 'bg-purple-100 text-purple-700';

    case 'pending':
      return 'bg-yellow-100 text-yellow-700';

    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function AdminPayments() {
  const [dashboard, setDashboard] = useState<PaymentDashboard | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardData, paymentsData] = await Promise.all([
        getAdminPaymentDashboard(),
        getAdminPayments(),
      ]);

      setDashboard(dashboardData);

      setPayments(paymentsData || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to load admin payment data.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefund = async (paymentId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to refund this payment?',
    );

    if (!confirmed) return;

    try {
      setActionLoading(paymentId);

      await refundPayment(paymentId);

      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Refund failed.');
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor school payments, refunds and subscriptions.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {dashboard && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={money(dashboard.totalRevenue)}
            icon={<DollarSign className="h-6 w-6" />}
          />

          <StatCard
            title="Net Revenue"
            value={money(dashboard.netRevenue)}
            icon={<CreditCard className="h-6 w-6" />}
          />

          <StatCard
            title="Refunded"
            value={money(dashboard.totalRefunded)}
            icon={<RotateCcw className="h-6 w-6" />}
          />

          <StatCard
            title="Subscriptions"
            value={String(dashboard.activeSubscriptions)}
            icon={<Users className="h-6 w-6" />}
          />
        </div>
      )}

      {dashboard && (
        <div className="grid gap-4 md:grid-cols-4">
          <SmallStat title="Paid" value={dashboard.paidPayments} />

          <SmallStat title="Pending" value={dashboard.pendingPayments} />

          <SmallStat title="Failed" value={dashboard.failedPayments} />

          <SmallStat title="Refunded" value={dashboard.refundedPayments} />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">All Payments</h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Student</th>

                  <th className="px-6 py-3">Amount</th>

                  <th className="px-6 py-3">Type</th>

                  <th className="px-6 py-3">Status</th>

                  <th className="px-6 py-3">Date</th>

                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => {
                  const student =
                    typeof payment.studentId === 'object'
                      ? payment.studentId
                      : null;

                  return (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {student
                            ? `${student.firstName} ${student.lastName}`
                            : 'Unknown'}
                        </p>

                        {student && (
                          <p className="text-xs text-gray-500">
                            {student.email}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {money(payment.amount, payment.currency)}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {payment.paymentType.replace('_', ' ')}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            payment.status,
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        {payment.status === 'paid' && (
                          <button
                            onClick={() => handleRefund(payment._id)}
                            disabled={actionLoading === payment._id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            {actionLoading === payment._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            Refund
                          </button>
                        )}

                        {payment.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="h-3.5 w-3.5" />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>

        <div className="rounded-lg bg-blue-100 p-3 text-blue-600">{icon}</div>
      </div>
    </div>
  );
}

function SmallStat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
