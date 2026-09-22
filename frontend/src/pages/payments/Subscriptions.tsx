import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';

import {
  cancelSubscription,
  getMySubscriptions,
  resumeSubscription,
  type Subscription,
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
    month: 'long',
    day: 'numeric',
  });
}

function statusClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';

    case 'trialing':
      return 'bg-blue-100 text-blue-700';

    case 'past_due':
    case 'unpaid':
      return 'bg-red-100 text-red-700';

    case 'cancelled':
      return 'bg-gray-100 text-gray-700';

    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || 'Unable to manage subscription.';
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState('');

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getMySubscriptions();

      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Subscription loading error:', err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleCancel = async (subscription: Subscription) => {
    const confirmed = window.confirm(
      'Cancel this subscription at the end of the current billing period?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`cancel-${subscription._id}`);
      setError('');

      await cancelSubscription(subscription._id);

      await loadSubscriptions();
    } catch (err: any) {
      console.error('Cancel subscription error:', err);

      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (subscription: Subscription) => {
    try {
      setActionLoading(`resume-${subscription._id}`);
      setError('');

      await resumeSubscription(subscription._id);

      await loadSubscriptions();
    } catch (err: any) {
      console.error('Resume subscription error:', err);

      setError(getErrorMessage(err));
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
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your recurring monthly school-fee payments.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSubscriptions}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <CreditCard className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 font-semibold text-gray-900">No subscriptions</h2>

          <p className="mt-1 text-sm text-gray-500">
            You haven't created a monthly payment subscription yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const cancelling = actionLoading === `cancel-${subscription._id}`;

            const resuming = actionLoading === `resume-${subscription._id}`;

            const canCancel =
              subscription.status === 'active' &&
              !subscription.cancelAtPeriodEnd;

            const canResume =
              subscription.cancelAtPeriodEnd &&
              subscription.status === 'active';

            return (
              <div
                key={subscription._id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                          subscription.status,
                        )}`}
                      >
                        {subscription.status}
                      </span>

                      {subscription.cancelAtPeriodEnd && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          Cancellation scheduled
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <CreditCard size={21} />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          Monthly School Fee
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {formatMoney(
                            subscription.amount,
                            subscription.currency,
                          )}{' '}
                          <span className="text-sm font-normal text-gray-500">
                            / month
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-gray-500">Current period ends</p>

                        <p className="mt-1 font-medium text-gray-900">
                          {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Subscription created</p>

                        <p className="mt-1 font-medium text-gray-900">
                          {formatDate(subscription.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancel(subscription)}
                        disabled={cancelling}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelling ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <XCircle size={17} />
                        )}
                        Cancel
                      </button>
                    )}

                    {canResume && (
                      <button
                        type="button"
                        onClick={() => handleResume(subscription)}
                        disabled={resuming}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {resuming ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <RotateCcw size={17} />
                        )}
                        Resume
                      </button>
                    )}

                    {subscription.status === 'active' &&
                      !subscription.cancelAtPeriodEnd && (
                        <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
                          <CheckCircle2 size={17} />
                          Active
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
