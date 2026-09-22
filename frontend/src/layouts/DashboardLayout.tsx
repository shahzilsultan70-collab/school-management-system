import { useState } from 'react';
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import AIChatAssistant from '../components/ai/AIChatAssistant';

type UserRole = 'admin' | 'teacher' | 'student';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'teacher', 'student'],
      },
    ],
  },

  {
    title: 'People',
    items: [
      {
        label: 'Students',
        path: '/students',
        icon: GraduationCap,
        roles: ['admin', 'teacher'],
      },
      {
        label: 'Teachers',
        path: '/teachers',
        icon: UserCheck,
        roles: ['admin'],
      },
      {
        label: 'Admins',
        path: '/admins',
        icon: ShieldCheck,
        roles: ['admin'],
      },
    ],
  },

  {
    title: 'Academics',
    items: [
      {
        label: 'Classes',
        path: '/classes',
        icon: School,
        roles: ['admin', 'teacher'],
      },
      {
        label: 'Subjects',
        path: '/subjects',
        icon: BookOpen,
        roles: ['admin', 'teacher'],
      },
      {
        label: 'Attendance',
        path: '/attendance',
        icon: UserCog,
        roles: ['admin', 'teacher', 'student'],
      },
      {
        label: 'Exams',
        path: '/exams',
        icon: ClipboardList,
        roles: ['admin', 'teacher', 'student'],
      },
      {
        label: 'Results',
        path: '/results',
        icon: ClipboardList,
        roles: ['admin', 'teacher', 'student'],
      },
    ],
  },

  {
    title: 'Finance',
    items: [
      {
        label: 'Fees',
        path: '/fees',
        icon: CreditCard,
        roles: ['admin', 'student'],
      },
      {
        label: 'Payments',
        path: '/payments',
        icon: Receipt,
        roles: ['student'],
      },
      {
        label: 'Payment Management',
        path: '/admin/payments',
        icon: CreditCard,
        roles: ['admin'],
      },
    ],
  },

  {
    title: 'Management',
    items: [
      {
        label: 'Leaves',
        path: '/leaves',
        icon: CalendarDays,
        roles: ['admin', 'teacher', 'student'],
      },
      {
        label: 'Assignments',
        path: '/assignments',
        icon: ClipboardList,
        roles: ['admin', 'teacher', 'student'],
      },
      {
        label: 'Notices',
        path: '/notices',
        icon: Bell,
        roles: ['admin', 'teacher', 'student'],
      },
    ],
  },
];

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const role = (user?.role ?? 'student') as UserRole;

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';

  const fullName =
    `${firstName} ${lastName}`.trim() || user?.name || user?.email || 'User';

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    fullName.charAt(0).toUpperCase();

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-slate-200 bg-white
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[78px]' : 'w-[260px]'}
          ${
            mobileSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        {/* Logo */}
        <div
          className={`
            flex h-[72px] shrink-0 items-center border-b border-slate-100
            ${sidebarCollapsed ? 'justify-center px-3' : 'px-5'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Building2 size={21} strokeWidth={2.2} />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                  SchoolHub
                </h1>

                <p className="truncate text-[11px] font-medium text-slate-400">
                  Management System
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.roles.includes(role),
            );

            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div key={group.title} className="mb-6 last:mb-0">
                {!sidebarCollapsed && (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {group.title}
                  </p>
                )}

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileSidebar}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `
                          group relative flex items-center gap-3 rounded-xl
                          px-3 py-2.5 text-[13px] font-medium
                          transition-all duration-200
                          ${
                            sidebarCollapsed
                              ? 'justify-center'
                              : 'justify-start'
                          }
                          ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                        `
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                            )}

                            <Icon
                              size={18}
                              strokeWidth={isActive ? 2.3 : 2}
                              className={`
                                shrink-0 transition-colors
                                ${
                                  isActive
                                    ? 'text-blue-600'
                                    : 'text-slate-400 group-hover:text-slate-600'
                                }
                              `}
                            />

                            {!sidebarCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar bottom */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          {/* Settings */}
          <NavLink
            to="/settings"
            onClick={closeMobileSidebar}
            title={sidebarCollapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `
              group flex items-center gap-3 rounded-xl px-3 py-2.5
              text-[13px] font-medium transition-all
              ${sidebarCollapsed ? 'justify-center' : ''}
              ${
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }
            `
            }
          >
            <Settings
              size={18}
              className="shrink-0 text-slate-400 group-hover:text-slate-600"
            />

            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
            className={`
              group mt-1 flex w-full items-center gap-3 rounded-xl
              px-3 py-2.5 text-[13px] font-medium
              text-slate-500 transition-all
              hover:bg-red-50 hover:text-red-600
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut
              size={18}
              className="shrink-0 text-slate-400 transition-colors group-hover:text-red-500"
            />

            {!sidebarCollapsed && <span>Logout</span>}
          </button>

          {/* User card */}
          <div
            className={`
              mt-2 rounded-xl bg-slate-50 p-2
              ${sidebarCollapsed ? 'flex justify-center' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {user?.profilePicture ? (
                <img
                  src={`http://localhost:3000${user.profilePicture}`}
                  alt={fullName}
                  className="h-9 w-9 shrink-0 rounded-lg object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-bold text-white">
                  {initials}
                </div>
              )}

              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {fullName}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] capitalize text-slate-400">
                    {roleLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main wrapper */}
      <div
        className={`
          min-h-screen transition-all duration-300
          ${sidebarCollapsed ? 'lg:pl-[78px]' : 'lg:pl-[260px]'}
        `}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-[72px] border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Header left */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={21} />
              </button>

              <button
                type="button"
                onClick={() => setSidebarCollapsed((previous) => !previous)}
                className="hidden rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={
                  sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen size={20} />
                ) : (
                  <PanelLeftClose size={20} />
                )}
              </button>

              <div className="hidden h-6 w-px bg-slate-200 sm:block" />

              <div className="hidden min-w-0 sm:block">
                <p className="text-xs font-medium text-slate-400">
                  School Management System
                </p>

                <p className="truncate text-sm font-semibold text-slate-800">
                  Welcome back, {firstName || 'User'}
                </p>
              </div>
            </div>

            {/* Header right */}
            <div className="flex items-center gap-2">
              {/* AI shortcut */}
              <button
                type="button"
                className="group hidden items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 sm:flex"
                title="Open AI Assistant"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                }}
              >
                <Sparkles
                  size={15}
                  className="transition-transform group-hover:rotate-12"
                />

                <span>AI Assistant</span>
              </button>

              {/* Notification */}
              <button
                type="button"
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notifications"
              >
                <Bell size={19} />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-blue-600" />
              </button>

              <div className="hidden h-7 w-px bg-slate-200 sm:block" />

              {/* Header profile */}
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
              >
                {user?.profilePicture ? (
                  <img
                    src={`http://localhost:3000${user.profilePicture}`}
                    alt={fullName}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-[11px] font-bold text-white">
                    {initials}
                  </div>
                )}

                <div className="hidden text-left md:block">
                  <p className="max-w-[130px] truncate text-xs font-semibold text-slate-800">
                    {fullName}
                  </p>

                  <p className="text-[10px] capitalize text-slate-400">
                    {roleLabel}
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className="hidden text-slate-400 md:block"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <AIChatAssistant />
    </div>
  );
}

export default DashboardLayout;
