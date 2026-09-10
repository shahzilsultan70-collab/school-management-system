import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Trophy,
  CreditCard,
  Mail,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  UserCog,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

type UserRole = 'admin' | 'teacher' | 'student';

interface MenuItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    name: 'Students',
    path: '/students',
    icon: GraduationCap,
    roles: ['admin', 'teacher'],
  },
  {
    name: 'Teachers',
    path: '/teachers',
    icon: Users,
    roles: ['admin'],
  },
  {
    name: 'Admins',
    path: '/admins',
    icon: UserCog,
    roles: ['admin'],
  },
  {
    name: 'Classes',
    path: '/classes',
    icon: School,
    roles: ['admin', 'teacher'],
  },
  {
    name: 'Subjects',
    path: '/subjects',
    icon: BookOpen,
    roles: ['admin', 'teacher'],
  },
  {
    name: 'Attendance',
    path: '/attendance',
    icon: CalendarCheck,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    name: 'Exams',
    path: '/exams',
    icon: ClipboardList,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    name: 'Results',
    path: '/results',
    icon: Trophy,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    name: 'Fees',
    path: '/fees',
    icon: CreditCard,
    roles: ['admin', 'student'],
  },
  {
    name: 'Leaves',
    path: '/leaves',
    icon: Mail,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    name: 'Assignments',
    path: '/assignments',
    icon: FileText,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    name: 'Notices',
    path: '/notices',
    icon: Bell,
    roles: ['admin', 'teacher', 'student'],
  },
];

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const userRole = user?.role as UserRole | undefined;

  const visibleMenuItems = menuItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : false,
  );

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();

      navigate('/login', {
        replace: true,
      });
    } catch (error) {
      console.error('Logout failed:', error);

      navigate('/login', {
        replace: true,
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const getInitials = () => {
    if (!user) {
      return 'U';
    }

    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }

    if (user.name) {
      const nameParts = user.name.trim().split(' ');

      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[
          nameParts.length - 1
        ].charAt(0)}`.toUpperCase();
      }

      return user.name.charAt(0).toUpperCase();
    }

    return 'U';
  };

  const getRoleName = () => {
    if (!user?.role) {
      return 'User';
    }

    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 transform bg-slate-900 text-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-700 px-6">
          <div>
            <h1 className="text-lg font-bold">School Management</h1>

            <p className="text-xs text-slate-400">{getRoleName()} Portal</p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-140px)] overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={19} />

                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* System */}
          <div className="mt-8">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              System
            </p>

            <NavLink
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Settings size={19} />

              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        {/* User / Logout */}
        <div className="absolute bottom-0 left-0 w-full border-t border-slate-700 p-3">
          {/* Logged-in User */}
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-semibold text-white">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials()
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || 'User'}
              </p>

              <p className="text-xs text-slate-400">{getRoleName()}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={19} />

            <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="lg:ml-64">
        {/* Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                School Management System
              </h2>

              <p className="hidden text-xs text-gray-500 sm:block">
                Manage your school efficiently
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Notification */}
            <button
              type="button"
              className="relative rounded-full p-2.5 text-gray-600 transition hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell size={20} />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-600 font-semibold text-white">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>

              <div className="hidden sm:block">
                <p className="max-w-40 truncate text-sm font-semibold text-gray-800">
                  {user?.name || 'User'}
                </p>

                <p className="text-xs text-gray-500">{getRoleName()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
