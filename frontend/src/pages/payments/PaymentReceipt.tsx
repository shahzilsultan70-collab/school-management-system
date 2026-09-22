import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { getPaymentReceipt } from '../../services/payment.service';

import type { PaymentReceipt as PaymentReceiptType } from '../../services/payment.service';

export default function PaymentReceipt() {
  const { id } = useParams<{ id: string }>();

  const [receipt, setReceipt] = useState<PaymentReceiptType | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReceipt = async () => {
      if (!id) {
        setError('Payment ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await getPaymentReceipt(id);

        setReceipt(data);
      } catch (err: any) {
        console.error('Receipt error:', err);

        setError(
          err?.response?.data?.message || 'Failed to load payment receipt.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
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

  if (!receipt) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        Receipt not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>

          <p className="mt-2 text-sm text-gray-500">
            Receipt #{receipt.receiptNumber}
          </p>
        </div>

        <div className="mt-8 grid gap-6 border-t border-gray-200 pt-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Student</p>

            <p className="mt-1 font-medium text-gray-900">
              {receipt.student.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>

            <p className="mt-1 text-gray-900">{receipt.student.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Fee Type</p>

            <p className="mt-1 capitalize text-gray-900">
              {receipt.fee.feeType}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Academic Session</p>

            <p className="mt-1 text-gray-900">{receipt.fee.academicSession}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Amount</p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: receipt.currency.toUpperCase(),
              }).format(receipt.amount)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>

            <p className="mt-1 font-medium capitalize text-green-600">
              {receipt.paymentStatus}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Payment Type</p>

            <p className="mt-1 capitalize text-gray-900">
              {receipt.paymentType.replace('_', ' ')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Paid At</p>

            <p className="mt-1 text-gray-900">
              {receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
