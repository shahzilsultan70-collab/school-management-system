import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Loader2,
  Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import studentService from '../../services/student.service';

import {
  createFee,
  type CreateFeePayload,
  type FeeType,
  type PaymentMethod,
} from '../../services/fee.service';

import type { Student } from '../../types/student';

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
  studentId: string;
  feeType: FeeType;
  academicSession: string;
  month: string;
  totalAmount: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

const initialForm: FormState = {
  studentId: '',
  feeType: 'tuition',
  academicSession: '2026-2027',
  month: '',
  totalAmount: '',
  dueDate: '',
  paymentMethod: 'online',
  notes: '',
};

function getStudentUser(student: Student) {
  if (student.user && typeof student.user === 'object') {
    return student.user;
  }

  if (student.userId && typeof student.userId === 'object') {
    return student.userId;
  }

  return null;
}

function getStudentUserId(student: Student): string {
  if (student.userId && typeof student.userId === 'string') {
    return student.userId;
  }

  const user = getStudentUser(student);

  if (user?._id) {
    return user._id;
  }

  return '';
}

function getStudentName(student: Student) {
  const user = getStudentUser(student);

  if (!user) {
    return student.studentId || 'Unknown Student';
  }

  return (
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    student.studentId ||
    'Unknown Student'
  );
}

function getStudentEmail(student: Student) {
  const user = getStudentUser(student);

  return user?.email || '';
}

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || error?.message || 'Unable to create fee. Please try again.';
}

export default function CreateFee() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    let mounted = true;

    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');

        const data = await studentService.getAll();

        if (!mounted) {
          return;
        }

        const activeStudents = Array.isArray(data)
          ? data.filter((student) => student.isActive !== false)
          : [];

        setStudents(activeStudents);
      } catch (err: any) {
        console.error('Students loading error:', err);

        if (mounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load students. Please try again.',
          );
        }
      } finally {
        if (mounted) {
          setLoadingStudents(false);
        }
      }
    };

    loadStudents();

    return () => {
      mounted = false;
    };
  }, []);

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

  const validate = () => {
    if (!form.studentId) {
      setError('Please select a student.');
      return false;
    }

    if (!form.academicSession.trim()) {
      setError('Academic session is required.');
      return false;
    }

    const amount = Number(form.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Fee amount must be greater than 0.');
      return false;
    }

    if (!form.dueDate) {
      setError('Due date is required.');
      return false;
    }

    const dueDate = new Date(form.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      setError('Please select a valid due date.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload: CreateFeePayload = {
        studentId: form.studentId,
        feeType: form.feeType,
        academicSession: form.academicSession.trim(),
        totalAmount: Number(form.totalAmount),
        dueDate: new Date(form.dueDate).toISOString(),
        paymentMethod: form.paymentMethod,
      };

      if (form.month.trim()) {
        payload.month = form.month.trim();
      }

      if (form.notes.trim()) {
        payload.notes = form.notes.trim();
      }

      await createFee(payload);

      navigate('/fees', {
        replace: true,
        state: {
          success: 'Fee created successfully.',
        },
      });
    } catch (err: any) {
      console.error('Create fee error:', err);
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudent = students.find(
    (student) => getStudentUserId(student) === form.studentId,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/fees')}
          disabled={submitting}
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Back to fees"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Fee</h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new fee record for a student.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900">Fee Information</h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the amount and billing information for this fee.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Student */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Student <span className="text-red-500">*</span>
              </label>

              <select
                value={form.studentId}
                onChange={(event) =>
                  updateField('studentId', event.target.value)
                }
                disabled={loadingStudents || submitting}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingStudents
                    ? 'Loading students...'
                    : students.length === 0
                      ? 'No active students found'
                      : 'Select a student'}
                </option>

                {students.map((student) => {
                  const userId = getStudentUserId(student);

                  if (!userId) {
                    return null;
                  }

                  return (
                    <option key={student._id} value={userId}>
                      {getStudentName(student)}
                      {student.studentId ? ` — ${student.studentId}` : ''}
                    </option>
                  );
                })}
              </select>

              <p className="mt-1.5 text-xs text-gray-400">
                The fee will belong to the selected student's account.
              </p>

              {selectedStudent && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-blue-800">
                    Selected student
                  </p>

                  <p className="mt-0.5 text-sm text-blue-700">
                    {getStudentName(selectedStudent)}
                  </p>

                  {getStudentEmail(selectedStudent) && (
                    <p className="text-xs text-blue-600">
                      {getStudentEmail(selectedStudent)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Fee Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Fee Type <span className="text-red-500">*</span>
              </label>

              <select
                value={form.feeType}
                onChange={(event) =>
                  updateField('feeType', event.target.value as FeeType)
                }
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                {feeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Session */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Academic Session <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.academicSession}
                onChange={(event) =>
                  updateField('academicSession', event.target.value)
                }
                placeholder="2026-2027"
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            {/* Month */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Month
              </label>

              <input
                type="text"
                value={form.month}
                onChange={(event) => updateField('month', event.target.value)}
                placeholder="September"
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Useful for monthly tuition fees.
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Total Amount (USD) <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.totalAmount}
                onChange={(event) =>
                  updateField('totalAmount', event.target.value)
                }
                placeholder="20.00"
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Students can pay the outstanding amount through Stripe.
              </p>
            </div>

            {/* Due Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Due Date <span className="text-red-500">*</span>
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
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Default Payment Method
              </label>

              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  updateField(
                    'paymentMethod',
                    event.target.value as PaymentMethod,
                  )
                }
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-gray-400">
                This is the fee record's default method. Stripe payments are
                processed separately.
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                rows={4}
                placeholder="Optional notes..."
                disabled={submitting}
                className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/fees')}
            disabled={submitting}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || loadingStudents || students.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {submitting ? 'Creating...' : 'Create Fee'}
          </button>
        </div>
      </form>
    </div>
  );
}
