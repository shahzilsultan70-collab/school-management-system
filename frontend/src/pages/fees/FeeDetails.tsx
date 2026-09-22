import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Edit,
  Loader2,
  UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { getFee, type Fee } from '../../services/fee.service';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
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
    case 'paid':
      return 'bg-green-100 text-green-700';

    case 'partial':
      return 'bg-blue-100 text-blue-700';

    case 'overdue':
      return 'bg-red-100 text-red-700';

    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}

export default function FeeDetails() {
  const { id } = useParams<{ id: string }>();

  const [fee, setFee] = useState<Fee | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    const loadFee = async () => {
      if (!id) {
        setError('Fee ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const data = await getFee(id);

        setFee(data);
      } catch (err: any) {
        console.error('Fee details error:', err);

        setError(err?.response?.data?.message || 'Failed to load fee details.');
      } finally {
        setLoading(false);
      }
    };

    loadFee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !fee) {
    return (
      <div className="space-y-4">
        <Link
          to="/fees"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Fees
        </Link>

        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={19} />
          {error || 'Fee not found.'}
        </div>
      </div>
    );
  }

  const student = typeof fee.studentId === 'object' ? fee.studentId : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/fees"
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Details</h1>

            <p className="mt-1 text-sm text-gray-500">
              Complete information for this fee record.
            </p>
          </div>
        </div>

        {fee.status === 'pending' && (
          <Link
            to={`/fees/${fee._id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Edit size={17} />
            Edit Fee
          </Link>
        )}
      </div>

      {/* Status */}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-gray-500">Fee Status</p>

            <div className="mt-2 flex items-center gap-2">
              {fee.status === 'paid' ? (
                <CheckCircle2 className="text-green-600" size={21} />
              ) : (
                <CreditCard className="text-blue-600" size={21} />
              )}

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                  fee.status,
                )}`}
              >
                {fee.status}
              </span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">Remaining Amount</p>

            <p className="mt-1 text-3xl font-bold text-red-600">
              {formatMoney(fee.remainingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Student */}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Student</h2>

            <p className="text-sm text-gray-500">
              Account associated with this fee.
            </p>
          </div>
        </div>

        {student ? (
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>

              <p className="mt-1 font-medium text-gray-900">
                {student.firstName} {student.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>

              <p className="mt-1 text-gray-900">{student.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Role</p>

              <p className="mt-1 capitalize text-gray-900">{student.role}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Student information is unavailable.
          </p>
        )}
      </div>

      {/* Fee information */}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Fee Information</h2>

            <p className="text-sm text-gray-500">
              Billing and payment information.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Fee Type</p>

            <p className="mt-1 capitalize font-medium text-gray-900">
              {fee.feeType}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Academic Session</p>

            <p className="mt-1 text-gray-900">{fee.academicSession}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Month</p>

            <p className="mt-1 text-gray-900">{fee.month || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Total Amount</p>

            <p className="mt-1 font-semibold text-gray-900">
              {formatMoney(fee.totalAmount)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Paid Amount</p>

            <p className="mt-1 font-semibold text-green-600">
              {formatMoney(fee.paidAmount)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Remaining</p>

            <p className="mt-1 font-semibold text-red-600">
              {formatMoney(fee.remainingAmount)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Due Date</p>

            <p className="mt-1 text-gray-900">{formatDate(fee.dueDate)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Payment Date</p>

            <p className="mt-1 text-gray-900">{formatDate(fee.paymentDate)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Payment Method</p>

            <p className="mt-1 capitalize text-gray-900">
              {fee.paymentMethod || '-'}
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-sm text-gray-500">Notes</p>

            <p className="mt-1 whitespace-pre-wrap text-gray-900">
              {fee.notes || 'No notes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
