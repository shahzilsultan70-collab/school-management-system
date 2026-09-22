import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { getPayment } from '../../services/payment.service';

import type { Payment } from '../../services/payment.service';

export default function PaymentDetails() {
  const { id } = useParams<{ id: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPayment = async () => {
      if (!id) {
        setError('Payment ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await getPayment(id);

        setPayment(data);
      } catch (err: any) {
        console.error('Payment details error:', err);

        setError(
          err?.response?.data?.message || 'Failed to load payment details.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        Payment not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>

        <p className="mt-1 text-sm text-gray-500">
          Payment information and transaction details.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Payment ID</p>

            <p className="mt-1 break-all font-medium text-gray-900">
              {payment._id}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Amount</p>

            <p className="mt-1 text-lg font-semibold text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: payment.currency.toUpperCase(),
              }).format(payment.amount)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Type</p>

            <p className="mt-1 capitalize text-gray-900">
              {payment.paymentType.replace('_', ' ')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>

            <p className="mt-1 capitalize text-gray-900">{payment.status}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Receipt Number</p>

            <p className="mt-1 text-gray-900">{payment.receiptNumber || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Paid At</p>

            <p className="mt-1 text-gray-900">
              {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Stripe Payment Intent</p>

            <p className="mt-1 break-all text-sm text-gray-900">
              {payment.stripePaymentIntentId || '-'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Stripe Checkout Session</p>

            <p className="mt-1 break-all text-sm text-gray-900">
              {payment.stripeCheckoutSessionId || '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
