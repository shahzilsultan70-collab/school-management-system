import { useEffect, useState } from 'react';

import {
  GraduationCap,
  Users,
  School,
  CreditCard,
  ArrowUpRight,
  Clock,
  CheckCircle,
  UserPlus,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface DashboardCounts {
  students: number;
  teachers: number;
  classes: number;
}

const activities = [
  {
    title: 'New student registered',
    description: 'A new student was added to the system.',
    time: '10 minutes ago',
    icon: UserPlus,
  },
  {
    title: 'Fee payment received',
    description: 'Student fee payment was recorded.',
    time: '35 minutes ago',
    icon: CreditCard,
  },
  {
    title: 'Leave request approved',
    description: 'A student leave request was approved.',
    time: '1 hour ago',
    icon: CheckCircle,
  },
  {
    title: 'Attendance updated',
    description: 'Teacher attendance was updated.',
    time: '2 hours ago',
    icon: Clock,
  },
];

function Dashboard() {
  const { user } = useAuth();

  const [counts, setCounts] = useState<DashboardCounts>({
    students: 0,
    teachers: 0,
    classes: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const userName = user?.name || 'User';

  const userRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'User';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [studentsResponse, teachersResponse, classesResponse] =
          await Promise.all([
            api.get('/students'),
            api.get('/teachers'),
            api.get('/classes'),
          ]);

        const students = Array.isArray(studentsResponse.data)
          ? studentsResponse.data.length
          : 0;

        const teachers = Array.isArray(teachersResponse.data)
          ? teachersResponse.data.length
          : 0;

        const classes = Array.isArray(classesResponse.data)
          ? classesResponse.data.length
          : 0;

        setCounts({
          students,
          teachers,
          classes,
        });
      } catch (err: any) {
        console.error('Dashboard data error:', err);

        const message =
          err?.response?.data?.message ||
          'Unable to load dashboard statistics.';

        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Students',
      value: isLoading ? '...' : counts.students.toString(),
      change: 'Live',
      description: 'from database',
      icon: GraduationCap,
    },
    {
      title: 'Total Teachers',
      value: isLoading ? '...' : counts.teachers.toString(),
      change: 'Live',
      description: 'from database',
      icon: Users,
    },
    {
      title: 'Total Classes',
      value: isLoading ? '...' : counts.classes.toString(),
      change: 'Live',
      description: 'from database',
      icon: School,
    },
    {
      title: 'Fee Collection',
      value: '85%',
      change: '+8%',
      description: 'from last month',
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
          Welcome back, {userRole} 👋
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Hello {userName}, here's what's happening in your school today.
        </p>
      </div>

      {/* Dashboard Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-gray-800">
                    {stat.value}
                  </h2>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Icon size={24} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-sm">
                <span className="font-semibold text-green-600">
                  {stat.change}
                </span>

                <span className="text-gray-500">{stat.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Attendance */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Attendance Overview
              </h2>

              <p className="text-sm text-gray-500">
                Student attendance this week
              </p>
            </div>

            <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View details
              <ArrowUpRight size={16} />
            </button>
          </div>

          {/* Simple chart placeholder */}
          <div className="mt-8 flex h-64 items-end justify-between gap-3 border-b border-l border-gray-200 px-4 pb-0">
            {[65, 80, 72, 90, 76, 88, 94].map((height, index) => (
              <div
                key={index}
                className="flex h-full flex-1 items-end justify-center"
              >
                <div
                  className="w-full max-w-10 rounded-t-lg bg-blue-500 transition hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between px-3 text-xs text-gray-500">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Fee Overview */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Fee Overview</h2>

          <p className="text-sm text-gray-500">Current fee collection</p>

          <div className="mt-8 flex justify-center">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-blue-500">
              <div className="absolute inset-0 rounded-full border-[18px] border-transparent border-r-gray-200 border-b-gray-200" />

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">85%</p>

                <p className="text-xs text-gray-500">Collected</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Collected</span>

              <span className="font-semibold text-gray-800">Rs. 850,000</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pending</span>

              <span className="font-semibold text-gray-800">Rs. 150,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Activities
            </h2>

            <p className="text-sm text-gray-500">
              Latest activities in the system
            </p>
          </div>

          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all
          </button>
        </div>

        <div className="mt-6 divide-y divide-gray-100">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div
                key={activity.title}
                className="flex items-center gap-4 py-4"
              >
                <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                  <Icon size={20} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {activity.title}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {activity.description}
                  </p>
                </div>

                <span className="hidden text-xs text-gray-400 sm:block">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
