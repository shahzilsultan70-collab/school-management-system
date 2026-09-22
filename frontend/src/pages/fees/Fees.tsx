import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';

import {
  deleteFee,
  getFees,
  type Fee,
  type PaymentStatus,
} from '../../services/fee.service';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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

function getStudentName(fee: Fee) {
  if (typeof fee.studentId === 'string') {
    return fee.studentId;
  }

  return `${fee.studentId.firstName} ${fee.studentId.lastName}`.trim();
}

function getStudentEmail(fee: Fee) {
  if (typeof fee.studentId === 'string') {
    return '';
  }

  return fee.studentId.email;
}

function statusClass(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';

    case 'partial':
      return 'bg-blue-100 text-blue-700';

    case 'overdue':
      return 'bg-red-100 text-red-700';

    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}

function getErrorMessage(error: any, fallback: string) {
  if (Array.isArray(error?.response?.data?.message)) {
    return error.response.data.message.join(', ');
  }

  return (
    error?.response?.data?.message || error?.response?.data?.error || fallback
  );
}

export default function Fees() {
  const navigate = useNavigate();
  const location = useLocation();

  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>(
    'all',
  );
  const [typeFilter, setTypeFilter] = useState<'all' | Fee['feeType']>('all');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');

  const loadFees = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getFees();

      setFees(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load fees:', err);

      setError(
        getErrorMessage(err, 'Failed to load fee records. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  useEffect(() => {
    const state = location.state as {
      successMessage?: string;
    } | null;

    if (state?.successMessage) {
      setSuccessMessage(state.successMessage);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });

      const timer = window.setTimeout(() => {
        setSuccessMessage('');
      }, 4000);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [location.pathname, location.state, navigate]);

  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return fees.filter((fee) => {
      const studentName = getStudentName(fee).toLowerCase();
      const studentEmail = getStudentEmail(fee).toLowerCase();

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        studentEmail.includes(query) ||
        fee.feeType.toLowerCase().includes(query) ||
        fee.academicSession.toLowerCase().includes(query) ||
        (fee.month ?? '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || fee.status === statusFilter;

      const matchesType = typeFilter === 'all' || fee.feeType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [fees, search, statusFilter, typeFilter]);

  const statistics = useMemo(() => {
    const totalAmount = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);

    const paidAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);

    const remainingAmount = fees.reduce(
      (sum, fee) => sum + fee.remainingAmount,
      0,
    );

    const paidFees = fees.filter((fee) => fee.status === 'paid').length;

    const pendingFees = fees.filter(
      (fee) =>
        fee.status === 'pending' ||
        fee.status === 'partial' ||
        fee.status === 'overdue',
    ).length;

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      paidFees,
      pendingFees,
    };
  }, [fees]);

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);
      setError('');

      await deleteFee(deleteId);

      setFees((currentFees) =>
        currentFees.filter((fee) => fee._id !== deleteId),
      );

      setDeleteId(null);

      setSuccessMessage('Fee record deleted successfully.');

      window.setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err: any) {
      console.error('Failed to delete fee:', err);

      setError(
        getErrorMessage(err, 'Failed to delete fee record. Please try again.'),
      );
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
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
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage student fees, payments and outstanding balances.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadFees}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <Link
            to="/fees/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Fee
          </Link>
        </div>
      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />

          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Fees</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(statistics.totalAmount)}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {fees.length} records
              </p>
            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collected</p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {formatMoney(statistics.paidAmount)}
              </p>

              <p className="mt-1 text-xs text-gray-500">Amount received</p>
            </div>

            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {formatMoney(statistics.remainingAmount)}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Still to be collected
              </p>
            </div>

            <div className="rounded-lg bg-red-100 p-3 text-red-600">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid Fees</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {statistics.paidFees}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {statistics.pendingFees} outstanding records
              </p>
            </div>

            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, email, fee type, session..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | PaymentStatus)
            }
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as 'all' | Fee['feeType'])
            }
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Fee Types</option>
            <option value="tuition">Tuition</option>
            <option value="admission">Admission</option>
            <option value="exam">Exam</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>

          {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fee Records</h2>

            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredFees.length} of {fees.length} records
            </p>
          </div>
        </div>

        {filteredFees.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="mx-auto h-12 w-12 text-gray-300" />

            <h3 className="mt-4 font-semibold text-gray-900">
              No fee records found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {fees.length === 0
                ? 'Create your first student fee record.'
                : 'Try changing your search or filters.'}
            </p>

            {fees.length === 0 && (
              <Link
                to="/fees/create"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Fee
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Fee</th>
                  <th className="px-6 py-3">Session</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Paid</th>
                  <th className="px-6 py-3">Remaining</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredFees.map((fee) => (
                  <tr key={fee._id} className="hover:bg-gray-50">
                    {/* STUDENT */}

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {getStudentName(fee)}
                      </div>

                      {getStudentEmail(fee) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {getStudentEmail(fee)}
                        </div>
                      )}
                    </td>

                    {/* FEE TYPE */}

                    <td className="px-6 py-4">
                      <div className="font-medium capitalize text-gray-900">
                        {fee.feeType}
                      </div>

                      {fee.month && (
                        <div className="mt-1 text-xs capitalize text-gray-500">
                          {fee.month}
                        </div>
                      )}
                    </td>

                    {/* SESSION */}

                    <td className="px-6 py-4 text-gray-600">
                      {fee.academicSession}
                    </td>

                    {/* TOTAL */}

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatMoney(fee.totalAmount)}
                    </td>

                    {/* PAID */}

                    <td className="px-6 py-4 font-medium text-green-600">
                      {formatMoney(fee.paidAmount)}
                    </td>

                    {/* REMAINING */}

                    <td className="px-6 py-4 font-medium text-red-600">
                      {formatMoney(fee.remainingAmount)}
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                          fee.status,
                        )}`}
                      >
                        {fee.status}
                      </span>
                    </td>

                    {/* DUE DATE */}

                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(fee.dueDate)}
                    </td>

                    {/* ACTIONS */}

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/fees/${fee._id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>

                        <Link
                          to={`/fees/${fee._id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => setDeleteId(fee._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}

        {filteredFees.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              {filteredFees.length} fee
              {filteredFees.length === 1 ? '' : 's'} found
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-200 p-2 text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                1
              </span>

              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-200 p-2 text-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-red-100 p-3 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>

              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Delete Fee Record?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete this fee record? This action
              cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
