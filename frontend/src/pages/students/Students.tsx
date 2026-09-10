import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Edit,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  X,
} from 'lucide-react';

import studentService from '../../services/student.service';

import type {
  CreateStudentData,
  Student,
  UpdateStudentData,
} from '../../types/student';

interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rollNumber: string;
  className: string;
  section: string;
}

interface ConfirmationState {
  type: 'delete' | 'activate' | 'deactivate';
  student: Student;
}

const initialFormData: StudentFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  rollNumber: '',
  className: '',
  section: '',
};

function Students() {
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState<StudentFormData>(initialFormData);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );

  useEffect(() => {
    loadStudents();
  }, []);

  // ==========================================
  // LOAD STUDENTS
  // ==========================================

  const loadStudents = async () => {
    try {
      setError('');

      const data = await studentService.getAll();

      setStudents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load students:', err);

      setError(
        err?.response?.data?.message ||
          'Failed to load students. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadStudents();
  };

  // ==========================================
  // GET USER
  // Handles populated user and fallback cases
  // ==========================================

  const getStudentUser = (student: Student) => {
    if (student.user && typeof student.user === 'object') {
      return student.user;
    }

    if (student.userId && typeof student.userId === 'object') {
      return student.userId;
    }

    return null;
  };

  // ==========================================
  // GET USER NAME
  // ==========================================

  const getStudentName = (student: Student) => {
    const user = getStudentUser(student);

    if (!user) {
      return 'Unknown Student';
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return fullName || 'Unknown Student';
  };

  // ==========================================
  // GET USER EMAIL
  // ==========================================

  const getStudentEmail = (student: Student) => {
    const user = getStudentUser(student);

    return user?.email || '-';
  };

  // ==========================================
  // GET INITIALS
  // ==========================================

  const getInitials = (student: Student) => {
    const user = getStudentUser(student);

    if (!user) {
      return 'ST';
    }

    const firstName = user.firstName?.trim().charAt(0) || '';
    const lastName = user.lastName?.trim().charAt(0) || '';

    const initials = `${firstName}${lastName}`.toUpperCase();

    return initials || 'ST';
  };

  // ==========================================
  // GET PROFILE PICTURE
  // ==========================================

  const getProfilePicture = (student: Student) => {
    const user = getStudentUser(student);

    if (!user?.profilePicture) {
      return null;
    }

    if (
      user.profilePicture.startsWith('http://') ||
      user.profilePicture.startsWith('https://')
    ) {
      return user.profilePicture;
    }

    return `http://localhost:3000${user.profilePicture}`;
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return students;
    }

    return students.filter((student) => {
      const user = getStudentUser(student);

      const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

      const email = user?.email || '';

      return (
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        String(student.studentId || '')
          .toLowerCase()
          .includes(search) ||
        String(student.rollNumber || '')
          .toLowerCase()
          .includes(search) ||
        String(student.className || '')
          .toLowerCase()
          .includes(search) ||
        String(student.section || '')
          .toLowerCase()
          .includes(search)
      );
    });
  }, [students, searchTerm]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalStudents = students.length;

  const activeStudents = students.filter((student) => student.isActive).length;

  const inactiveStudents = students.filter(
    (student) => !student.isActive,
  ).length;

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    setEditingStudent(null);

    setFormData({
      ...initialFormData,
    });

    setError('');
    setSuccess('');

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (student: Student) => {
    const user = getStudentUser(student);

    setEditingStudent(student);

    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',
      rollNumber: student.rollNumber || '',
      className: student.className || '',
      section: student.section || '',
    });

    setError('');
    setSuccess('');

    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);

    setEditingStudent(null);

    setFormData({
      ...initialFormData,
    });

    setError('');
  };

  // ==========================================
  // FORM INPUT
  // ==========================================

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError('');
    }
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required.');
      return false;
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required.');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return false;
    }

    if (!editingStudent && !formData.password.trim()) {
      setError('Password is required when creating a student.');
      return false;
    }

    if (!editingStudent && formData.password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }

    if (editingStudent && formData.password.trim()) {
      if (formData.password.trim().length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }
    }

    if (!formData.rollNumber.trim()) {
      setError('Roll number is required.');
      return false;
    }

    if (!formData.className.trim()) {
      setError('Class is required.');
      return false;
    }

    if (!formData.section.trim()) {
      setError('Section is required.');
      return false;
    }

    return true;
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingStudent) {
        const updateData: UpdateStudentData = {
          user: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim().toLowerCase(),
          },
          rollNumber: formData.rollNumber.trim(),
          className: formData.className.trim(),
          section: formData.section.trim(),
        };

        if (formData.password.trim()) {
          updateData.user!.password = formData.password.trim();
        }

        const updatedStudent = await studentService.update(
          editingStudent._id,
          updateData,
        );

        setStudents((previous) =>
          previous.map((student) =>
            student._id === editingStudent._id ? updatedStudent : student,
          ),
        );

        setSuccess('Student updated successfully.');
      } else {
        const createData: CreateStudentData = {
          user: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password.trim(),
          },
          rollNumber: formData.rollNumber.trim(),
          className: formData.className.trim(),
          section: formData.section.trim(),
        };

        const newStudent = await studentService.create(createData);

        setStudents((previous) => [newStudent, ...previous]);

        setSuccess('Student created successfully.');
      }

      setTimeout(() => {
        setShowModal(false);

        setEditingStudent(null);

        setFormData({
          ...initialFormData,
        });

        setSuccess('');
      }, 700);
    } catch (err: any) {
      console.error('Student save error:', err);

      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Unable to save student. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // OPEN DELETE CONFIRMATION
  // ==========================================

  const openDeleteConfirmation = (student: Student) => {
    if (actionLoading) {
      return;
    }

    setError('');
    setSuccess('');

    setConfirmation({
      type: 'delete',
      student,
    });
  };

  // ==========================================
  // OPEN STATUS CONFIRMATION
  // ==========================================

  const openStatusConfirmation = (student: Student) => {
    if (actionLoading) {
      return;
    }

    setError('');
    setSuccess('');

    setConfirmation({
      type: student.isActive ? 'deactivate' : 'activate',
      student,
    });
  };

  // ==========================================
  // CLOSE CONFIRMATION
  // ==========================================

  const closeConfirmation = () => {
    if (actionLoading) {
      return;
    }

    setConfirmation(null);
  };

  // ==========================================
  // CONFIRM ACTION
  // ==========================================

  const handleConfirmedAction = async () => {
    if (!confirmation) {
      return;
    }

    const { type, student } = confirmation;

    setActionLoading(student._id);
    setError('');
    setSuccess('');

    try {
      if (type === 'delete') {
        await studentService.remove(student._id);

        setStudents((previous) =>
          previous.filter((item) => item._id !== student._id),
        );

        setSuccess(`${getStudentName(student)} was deleted successfully.`);
      }

      if (type === 'activate') {
        const updatedStudent = await studentService.activate(student._id);

        setStudents((previous) =>
          previous.map((item) =>
            item._id === student._id ? updatedStudent : item,
          ),
        );

        setSuccess(`${getStudentName(student)} was activated successfully.`);
      }

      if (type === 'deactivate') {
        const updatedStudent = await studentService.deactivate(student._id);

        setStudents((previous) =>
          previous.map((item) =>
            item._id === student._id ? updatedStudent : item,
          ),
        );

        setSuccess(`${getStudentName(student)} was deactivated successfully.`);
      }

      setConfirmation(null);
    } catch (err: any) {
      console.error('Student action error:', err);

      setError(
        err?.response?.data?.message ||
          'Unable to complete the requested action. Please try again.',
      );

      setConfirmation(null);
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // CONFIRMATION MODAL CONTENT
  // ==========================================

  const confirmationTitle = confirmation
    ? confirmation.type === 'delete'
      ? 'Delete Student'
      : confirmation.type === 'activate'
        ? 'Activate Student'
        : 'Deactivate Student'
    : '';

  const confirmationDescription = confirmation
    ? confirmation.type === 'delete'
      ? `Are you sure you want to permanently delete ${getStudentName(
          confirmation.student,
        )}? This will also remove the student's linked user account.`
      : confirmation.type === 'activate'
        ? `Are you sure you want to activate ${getStudentName(
            confirmation.student,
          )}? The student will be able to use the system again.`
        : `Are you sure you want to deactivate ${getStudentName(
            confirmation.student,
          )}? The student's account will also be deactivated.`
    : '';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ======================================
          PAGE HEADER
      ======================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage student accounts, enrollment and academic information.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* ======================================
          ERROR ALERT
      ======================================= */}

      {error && !showModal && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">Something went wrong</p>

            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="rounded p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ======================================
          SUCCESS ALERT
      ======================================= */}

      {success && !showModal && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={19} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess('')}
            className="ml-auto rounded p-1 hover:bg-green-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ======================================
          STATISTICS
      ======================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total Students</p>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserRound size={20} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-gray-800">
            {totalStudents}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Active Students</p>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <UserCheck size={20} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-green-600">
            {activeStudents}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Inactive Students
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <UserX size={20} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-red-600">
            {inactiveStudents}
          </p>
        </div>
      </div>

      {/* ======================================
          STUDENTS TABLE
      ======================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}

        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, ID, class..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading */}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2 size={32} className="animate-spin text-blue-600" />

              <p className="text-sm">Loading students...</p>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          /* Empty */

          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Search size={25} className="text-gray-400" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-800">
              {searchTerm ? 'No students found' : 'No students available'}
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              {searchTerm
                ? 'Try changing your search keywords.'
                : 'Add your first student to start managing student records.'}
            </p>

            {!searchTerm && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Student
              </button>
            )}
          </div>
        ) : (
          /* Table */

          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Student
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Student ID
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Roll Number
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Class
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Section
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const isActionLoading = actionLoading === student._id;

                  const profilePicture = getProfilePicture(student);

                  return (
                    <tr
                      key={student._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Student */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {profilePicture ? (
                            <img
                              src={profilePicture}
                              alt={getStudentName(student)}
                              className="h-11 w-11 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {getInitials(student)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-800">
                              {getStudentName(student)}
                            </p>

                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail size={12} />

                              <span className="truncate">
                                {getStudentEmail(student)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {student.studentId || '-'}
                        </span>
                      </td>

                      {/* Roll Number */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {student.rollNumber || '-'}
                      </td>

                      {/* Class */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {student.className || '-'}
                      </td>

                      {/* Section */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {student.section || '-'}
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        {student.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle size={13} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <UserX size={13} />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit */}

                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            disabled={isActionLoading}
                            title="Edit student"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Edit size={16} />
                          </button>

                          {/* Activate / Deactivate */}

                          <button
                            type="button"
                            onClick={() => openStatusConfirmation(student)}
                            disabled={isActionLoading}
                            title={
                              student.isActive
                                ? 'Deactivate student'
                                : 'Activate student'
                            }
                            className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              student.isActive
                                ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {isActionLoading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : student.isActive ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() => openDeleteConfirmation(student)}
                            disabled={isActionLoading}
                            title="Delete student"
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}

        {!loading && filteredStudents.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-700">
                {filteredStudents.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-700">
                {students.length}
              </span>{' '}
              students
            </p>
          </div>
        )}
      </div>

      {/* ======================================
          CREATE / EDIT MODAL
      ======================================= */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editingStudent ? 'Edit Student' : 'Add Student'}
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  {editingStudent
                    ? 'Update the student account and enrollment information.'
                    : 'Create a new student account and enrollment record.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleSubmit}>
              <div className="max-h-[72vh] overflow-y-auto p-6">
                {/* Error */}

                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />

                    <span className="flex-1">{error}</span>

                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="rounded p-1 hover:bg-red-100"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* =================================
                    ACCOUNT INFORMATION
                ================================== */}

                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <UserRound size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Account Information
                      </h3>

                      <p className="text-xs text-gray-500">
                        Basic information for the student's system account.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* First Name */}

                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        First Name
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(event) =>
                          handleInputChange('firstName', event.target.value)
                        }
                        placeholder="Enter first name"
                        disabled={submitting}
                        autoComplete="given-name"
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                      />
                    </div>

                    {/* Last Name */}

                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Last Name
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(event) =>
                          handleInputChange('lastName', event.target.value)
                        }
                        placeholder="Enter last name"
                        disabled={submitting}
                        autoComplete="family-name"
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                      />
                    </div>

                    {/* Email */}

                    <div className={editingStudent ? 'sm:col-span-2' : ''}>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Email Address
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <Mail
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(event) =>
                            handleInputChange('email', event.target.value)
                          }
                          placeholder="student@example.com"
                          disabled={submitting}
                          autoComplete="email"
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Password */}

                    <div className={editingStudent ? 'sm:col-span-2' : ''}>
                      <label
                        htmlFor="password"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Password
                        {!editingStudent && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>

                      <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(event) =>
                          handleInputChange('password', event.target.value)
                        }
                        placeholder={
                          editingStudent
                            ? 'Leave blank to keep current password'
                            : 'Minimum 6 characters'
                        }
                        disabled={submitting}
                        autoComplete={
                          editingStudent ? 'new-password' : 'new-password'
                        }
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                      />

                      <p className="mt-1.5 text-xs text-gray-400">
                        {editingStudent
                          ? 'Only enter a password if you want to change it.'
                          : 'The password will be securely hashed before storage.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* =================================
                    STUDENT INFORMATION
                ================================== */}

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <ShieldCheck size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Student Information
                      </h3>

                      <p className="text-xs text-gray-500">
                        Enrollment information for the student.
                      </p>
                    </div>
                  </div>

                  {/* Auto Student ID */}

                  <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                          Student ID
                        </p>

                        <p className="mt-1 text-sm text-blue-800">
                          {editingStudent
                            ? editingStudent.studentId
                            : 'Automatically generated'}
                        </p>
                      </div>

                      <div className="rounded-lg border border-blue-200 bg-white px-4 py-2">
                        <span className="font-mono text-sm font-bold text-blue-700">
                          {editingStudent
                            ? editingStudent.studentId
                            : 'STU-2026-XXXX'}
                        </span>
                      </div>
                    </div>

                    {!editingStudent && (
                      <p className="mt-2 text-xs text-blue-600">
                        The actual Student ID will be generated automatically
                        when the student is created.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Roll Number */}

                    <div>
                      <label
                        htmlFor="rollNumber"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Roll Number
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        id="rollNumber"
                        type="text"
                        value={formData.rollNumber}
                        onChange={(event) =>
                          handleInputChange('rollNumber', event.target.value)
                        }
                        placeholder="e.g. 001"
                        disabled={submitting}
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                      />
                    </div>

                    {/* Class */}

                    <div>
                      <label
                        htmlFor="className"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Class
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        id="className"
                        type="text"
                        value={formData.className}
                        onChange={(event) =>
                          handleInputChange('className', event.target.value)
                        }
                        placeholder="e.g. Grade 05"
                        disabled={submitting}
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                      />
                    </div>

                    {/* Section */}

                    <div>
                      <label
                        htmlFor="section"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Section
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        id="section"
                        type="text"
                        value={formData.section}
                        onChange={(event) =>
                          handleInputChange('section', event.target.value)
                        }
                        placeholder="e.g. A"
                        disabled={submitting}
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && <Loader2 size={17} className="animate-spin" />}

                  {submitting
                    ? 'Saving...'
                    : editingStudent
                      ? 'Update Student'
                      : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================
          CONFIRMATION MODAL
      ======================================= */}

      {confirmation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Confirmation Header */}

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    confirmation.type === 'delete'
                      ? 'bg-red-100 text-red-600'
                      : confirmation.type === 'deactivate'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-green-100 text-green-600'
                  }`}
                >
                  {confirmation.type === 'delete' ? (
                    <Trash2 size={22} />
                  ) : confirmation.type === 'deactivate' ? (
                    <UserX size={22} />
                  ) : (
                    <UserCheck size={22} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-800">
                    {confirmationTitle}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {confirmationDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeConfirmation}
                  disabled={!!actionLoading}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Student Preview */}

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                {getProfilePicture(confirmation.student) ? (
                  <img
                    src={getProfilePicture(confirmation.student) || ''}
                    alt={getStudentName(confirmation.student)}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {getInitials(confirmation.student)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {getStudentName(confirmation.student)}
                  </p>

                  <p className="text-xs text-gray-500">
                    {confirmation.student.studentId}
                    {' • '}
                    {confirmation.student.className}
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Footer */}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={!!actionLoading}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmedAction}
                disabled={!!actionLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmation.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmation.type === 'deactivate'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionLoading && (
                  <Loader2 size={17} className="animate-spin" />
                )}

                {actionLoading
                  ? 'Processing...'
                  : confirmation.type === 'delete'
                    ? 'Delete Student'
                    : confirmation.type === 'deactivate'
                      ? 'Deactivate Student'
                      : 'Activate Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
