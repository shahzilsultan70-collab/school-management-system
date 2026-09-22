import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Loader2,
  Save,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getFee,
  updateFee,
  type Fee,
  type FeeType,
  type PaymentMethod,
  type UpdateFeePayload,
} from '../../services/fee.service';

const feeTypes: { value: FeeType; label: string }[] = [
  { value: 'tuition', label: 'Tuition' },
  { value: 'admission', label: 'Admission' },
  { value: 'exam', label: 'Exam' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
];

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'online', label: 'Online' },
  { value: 'other', label: 'Other' },
];

interface FormState {
  feeType: FeeType;
  academicSession: string;
  month: string;
  totalAmount: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

function formatDateForInput(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || 'Unable to update fee.';
}

export default function EditFee() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [fee, setFee] = useState<Fee | null>(null);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({
    feeType: 'tuition',
    academicSession: '',
    month: '',
    totalAmount: '',
    dueDate: '',
    paymentMethod: 'online',
    notes: '',
  });

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

        setForm({
          feeType: data.feeType,
          academicSession: data.academicSession,
          month: data.month || '',
          totalAmount: String(data.totalAmount),
          dueDate: formatDateForInput(data.dueDate),
          paymentMethod: data.paymentMethod || 'online',
          notes: data.notes || '',
        });
      } catch (err: any) {
        console.error('Fee loading error:', err);

        setError(err?.response?.data?.message || 'Failed to load fee.');
      } finally {
        setLoading(false);
      }
    };

    loadFee();
  }, [id]);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !fee) {
      return;
    }

    const amount = Number(form.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Fee amount must be greater than 0.');
      return;
    }

    if (!form.academicSession.trim()) {
      setError('Academic session is required.');
      return;
    }

    if (!form.dueDate) {
      setError('Due date is required.');
      return;
    }

    if (fee.status !== 'pending') {
      setError(
        'Paid or partially paid fees should not be edited because payment records are already associated with them.',
      );

      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload: UpdateFeePayload = {
        feeType: form.feeType,
        academicSession: form.academicSession.trim(),
        totalAmount: amount,
        dueDate: new Date(form.dueDate).toISOString(),
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim(),
      };

      if (form.month.trim()) {
        payload.month = form.month.trim();
      }

      await updateFee(id, payload);

      navigate(`/fees/${id}`, {
        replace: true,
      });
    } catch (err: any) {
      console.error('Update fee error:', err);

      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/fees')}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Fees
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'Fee not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/fees/${fee._id}`)}
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Fee</h1>

          <p className="mt-1 text-sm text-gray-500">
            Update this pending fee record.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {fee.status !== 'pending' && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          This fee is <strong>{fee.status}</strong>. Financially processed fees
          are locked from editing.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="p-6">
          <div className="mb-6 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Student
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {typeof fee.studentId === 'object'
                ? `${fee.studentId.firstName} ${fee.studentId.lastName}`
                : fee.studentId}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Fee Type
              </label>

              <select
                value={form.feeType}
                onChange={(event) =>
                  updateField('feeType', event.target.value as FeeType)
                }
                disabled={submitting || fee.status !== 'pending'}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                {feeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Academic Session
              </label>

              <input
                value={form.academicSession}
                onChange={(event) =>
                  updateField('academicSession', event.target.value)
                }
                disabled={submitting || fee.status !== 'pending'}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Month
              </label>

              <input
                value={form.month}
                onChange={(event) => updateField('month', event.target.value)}
                disabled={submitting || fee.status !== 'pending'}
                placeholder="September"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Total Amount (USD)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.totalAmount}
                onChange={(event) =>
                  updateField('totalAmount', event.target.value)
                }
                disabled={submitting || fee.status !== 'pending'}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Paid amount is controlled by the payment system.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Due Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    updateField('dueDate', event.target.value)
                  }
                  disabled={submitting || fee.status !== 'pending'}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Method
              </label>

              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  updateField(
                    'paymentMethod',
                    event.target.value as PaymentMethod,
                  )
                }
                disabled={submitting || fee.status !== 'pending'}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                disabled={submitting || fee.status !== 'pending'}
                className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(`/fees/${fee._id}`)}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || fee.status !== 'pending'}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
