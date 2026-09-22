import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Edit,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';

import teacherService from '../../services/teacher.service';

import type {
  Teacher,
  CreateTeacherData,
  UpdateTeacherData,
  TeacherUser,
} from '../../types/teacher';

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  qualification: string;
  phone: string;
}

const emptyForm: TeacherFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  qualification: '',
  phone: '',
};

function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState<TeacherFormData>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'activate' | 'deactivate';
    teacher: Teacher;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // =========================================================
  // Load Teachers
  // =========================================================

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await teacherService.getAll();

      setTeachers(data);
    } catch (err: any) {
      console.error(err);

      setError(err?.response?.data?.message || 'Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // =========================================================
  // Get User
  // =========================================================

  const getTeacherUser = (teacher: Teacher): TeacherUser | null => {
    if (typeof teacher.userId === 'object' && teacher.userId !== null) {
      return teacher.userId;
    }

    return null;
  };

  // =========================================================
  // Search
  // =========================================================

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      const user = getTeacherUser(teacher);

      const name =
        `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.toLowerCase();

      const email = user?.email?.toLowerCase() ?? '';

      return (
        name.includes(query) ||
        email.includes(query) ||
        teacher.employeeId.toLowerCase().includes(query) ||
        teacher.qualification.toLowerCase().includes(query) ||
        teacher.phone.toLowerCase().includes(query)
      );
    });
  }, [teachers, search]);

  // =========================================================
  // Statistics
  // =========================================================

  const totalTeachers = teachers.length;

  const activeTeachers = teachers.filter((teacher) => teacher.isActive).length;

  const inactiveTeachers = totalTeachers - activeTeachers;

  // =========================================================
  // Open Create Modal
  // =========================================================

  const openCreateModal = () => {
    setEditingTeacher(null);
    setFormData(emptyForm);
    setError('');
    setShowModal(true);
  };

  // =========================================================
  // Open Edit Modal
  // =========================================================

  const openEditModal = (teacher: Teacher) => {
    const user = getTeacherUser(teacher);

    setEditingTeacher(teacher);

    setFormData({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      password: '',
      qualification: teacher.qualification,
      phone: teacher.phone,
    });

    setError('');
    setShowModal(true);
  };

  // =========================================================
  // Close Modal
  // =========================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingTeacher(null);
    setFormData(emptyForm);
    setError('');
  };

  // =========================================================
  // Form Change
  // =========================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // Submit
  // =========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    // -------------------------------------------------------
    // Validation
    // -------------------------------------------------------

    if (!formData.firstName.trim()) {
      setError('First name is required.');
      return;
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!editingTeacher && !formData.password) {
      setError('Password is required.');
      return;
    }

    if (!editingTeacher && formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.qualification.trim()) {
      setError('Qualification is required.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    try {
      setSaving(true);

      if (editingTeacher) {
        const updateData: UpdateTeacherData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          qualification: formData.qualification.trim(),
          phone: formData.phone.trim(),
        };

        if (formData.password.trim()) {
          updateData.password = formData.password.trim();
        }

        const updatedTeacher = await teacherService.update(
          editingTeacher._id,
          updateData,
        );

        setTeachers((previous) =>
          previous.map((teacher) =>
            teacher._id === editingTeacher._id ? updatedTeacher : teacher,
          ),
        );
      } else {
        const createData: CreateTeacherData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          qualification: formData.qualification.trim(),
          phone: formData.phone.trim(),
        };

        const newTeacher = await teacherService.create(createData);

        setTeachers((previous) => [newTeacher, ...previous]);
      }

      closeModal();
    } catch (err: any) {
      console.error(err);

      setError(err?.response?.data?.message || 'Failed to save teacher.');
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // Confirm Action
  // =========================================================

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }

    try {
      setActionLoading(true);

      const { type, teacher } = confirmAction;

      if (type === 'delete') {
        await teacherService.remove(teacher._id);

        setTeachers((previous) =>
          previous.filter((item) => item._id !== teacher._id),
        );
      }

      if (type === 'activate') {
        const updated = await teacherService.activate(teacher._id);

        setTeachers((previous) =>
          previous.map((item) => (item._id === teacher._id ? updated : item)),
        );
      }

      if (type === 'deactivate') {
        const updated = await teacherService.deactivate(teacher._id);

        setTeachers((previous) =>
          previous.map((item) => (item._id === teacher._id ? updated : item)),
        );
      }

      setConfirmAction(null);
    } catch (err: any) {
      console.error(err);

      setError(err?.response?.data?.message || 'Action failed.');

      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // Teacher Name
  // =========================================================

  const getTeacherName = (teacher: Teacher) => {
    const user = getTeacherUser(teacher);

    if (!user) {
      return 'Unknown Teacher';
    }

    return `${user.firstName} ${user.lastName}`;
  };

  // =========================================================
  // Teacher Initials
  // =========================================================

  const getTeacherInitials = (teacher: Teacher) => {
    const user = getTeacherUser(teacher);

    if (!user) {
      return 'T';
    }

    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  };

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="space-y-6">
      {/* =====================================================
          Header
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage teacher accounts and employment information.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      {/* =====================================================
          Statistics
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <User size={20} className="text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Teachers</p>

              <p className="text-2xl font-bold text-gray-800">
                {totalTeachers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3">
              <UserCheck size={20} className="text-green-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">Active Teachers</p>

              <p className="text-2xl font-bold text-gray-800">
                {activeTeachers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-3">
              <UserX size={20} className="text-red-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">Inactive Teachers</p>

              <p className="text-2xl font-bold text-gray-800">
                {inactiveTeachers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          Main Card
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Search */}

        <div className="border-b border-gray-200 p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Error */}

        {error && !showModal && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading teachers...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-10 text-center">
            <User size={40} className="mx-auto text-gray-300" />

            <p className="mt-3 text-sm font-medium text-gray-600">
              No teachers found
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Add a teacher to get started.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                Desktop Table
            ================================================== */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-4">Teacher</th>

                    <th className="px-6 py-4">Employee ID</th>

                    <th className="px-6 py-4">Qualification</th>

                    <th className="px-6 py-4">Phone</th>

                    <th className="px-6 py-4">Status</th>

                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredTeachers.map((teacher) => {
                    const user = getTeacherUser(teacher);

                    return (
                      <tr
                        key={teacher._id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* Teacher */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user?.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={getTeacherName(teacher)}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                {getTeacherInitials(teacher)}
                              </div>
                            )}

                            <div>
                              <p className="font-medium text-gray-800">
                                {getTeacherName(teacher)}
                              </p>

                              <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                <Mail size={12} />

                                {user?.email ?? 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Employee ID */}

                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {teacher.employeeId}
                        </td>

                        {/* Qualification */}

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {teacher.qualification}
                        </td>

                        {/* Phone */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} />

                            {teacher.phone}
                          </div>
                        </td>

                        {/* Status */}

                        <td className="px-6 py-4">
                          {teacher.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                              <CheckCircle size={13} />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              <UserX size={13} />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit size={17} />
                            </button>

                            {teacher.isActive ? (
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'deactivate',
                                    teacher,
                                  })
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
                                title="Deactivate"
                              >
                                <UserX size={17} />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'activate',
                                    teacher,
                                  })
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-green-50 hover:text-green-600"
                                title="Activate"
                              >
                                <UserCheck size={17} />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'delete',
                                  teacher,
                                })
                              }
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =================================================
                Mobile Cards
            ================================================== */}

            <div className="space-y-3 p-4 md:hidden">
              {filteredTeachers.map((teacher) => {
                const user = getTeacherUser(teacher);

                return (
                  <div
                    key={teacher._id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {user?.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={getTeacherName(teacher)}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {getTeacherInitials(teacher)}
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-gray-800">
                            {getTeacherName(teacher)}
                          </p>

                          <p className="text-xs text-gray-500">
                            {teacher.employeeId}
                          </p>
                        </div>
                      </div>

                      {teacher.isActive ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Email:</span>{' '}
                        {user?.email ?? 'No email'}
                      </p>

                      <p>
                        <span className="font-medium">Qualification:</span>{' '}
                        {teacher.qualification}
                      </p>

                      <p>
                        <span className="font-medium">Phone:</span>{' '}
                        {teacher.phone}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit size={17} />
                      </button>

                      {teacher.isActive ? (
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: 'deactivate',
                              teacher,
                            })
                          }
                          className="rounded-lg p-2 text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <UserX size={17} />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: 'activate',
                              teacher,
                            })
                          }
                          className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                        >
                          <UserCheck size={17} />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: 'delete',
                            teacher,
                          })
                        }
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          Create/Edit Modal
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingTeacher
                    ? 'Update the teacher account and employment information.'
                    : 'Create a new teacher account and employment record.'}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* =================================================
                  Account Information
              ================================================== */}

              <div>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-800">
                    Account Information
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Basic information for the teacher's system account.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* First Name */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      First Name
                      <span className="text-red-500"> *</span>
                    </label>

                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Last Name */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Last Name
                      <span className="text-red-500"> *</span>
                    </label>

                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Email */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email Address
                      <span className="text-red-500"> *</span>
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="teacher@example.com"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Password */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Password
                      {!editingTeacher && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        editingTeacher
                          ? 'Leave blank to keep current password'
                          : 'Enter password'
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    {!editingTeacher && (
                      <p className="mt-1 text-xs text-gray-400">
                        The password will be securely hashed before storage.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================
                  Teacher Information
              ================================================== */}

              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-800">
                    Teacher Information
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Employment information for the teacher.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Employee ID */}

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Employee ID
                    </label>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                      <p className="text-sm font-medium text-gray-500">
                        Automatically generated
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        The Employee ID will be generated automatically when the
                        teacher is created.
                      </p>
                    </div>
                  </div>

                  {/* Qualification */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Qualification
                      <span className="text-red-500"> *</span>
                    </label>

                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      placeholder="e.g. MSc Computer Science"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Phone */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Phone
                      <span className="text-red-500"> *</span>
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="03XXXXXXXXX"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Error */}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingTeacher
                      ? 'Update Teacher'
                      : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          Confirmation Modal
      ====================================================== */}

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">
              {confirmAction.type === 'delete'
                ? 'Delete Teacher'
                : confirmAction.type === 'activate'
                  ? 'Activate Teacher'
                  : 'Deactivate Teacher'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {confirmAction.type === 'delete'
                ? 'This will delete the teacher record and the linked teacher account. This action cannot be undone.'
                : confirmAction.type === 'activate'
                  ? 'Are you sure you want to activate this teacher account?'
                  : 'Are you sure you want to deactivate this teacher account?'}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction.type === 'activate'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {actionLoading
                  ? 'Processing...'
                  : confirmAction.type === 'delete'
                    ? 'Delete'
                    : confirmAction.type === 'activate'
                      ? 'Activate'
                      : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
