import { useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function Login() {
  const navigate = useNavigate();

  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      await login({
        email,
        password,
      });

      navigate('/dashboard');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Invalid email or password. Please try again.';

      setError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Left Side */}
      <div className="hidden w-1/2 bg-slate-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <School size={26} />
            </div>

            <div>
              <h1 className="text-xl font-bold">School Management</h1>

              <p className="text-sm text-slate-400">Management System</p>
            </div>
          </div>

          <div className="mt-24 max-w-lg">
            <h2 className="text-5xl font-bold leading-tight">
              Manage your school
              <span className="text-blue-500"> smarter.</span>
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-400">
              Manage students, teachers, attendance, fees, examinations and more
              from one powerful platform.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500">School Management System</p>
      </div>

      {/* Right Side */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <School size={24} />
            </div>

            <div>
              <h1 className="font-bold text-gray-800">School Management</h1>

              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome back</h2>

            <p className="mt-2 text-sm text-gray-500">
              Sign in to access your dashboard.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                onClick={() => {
                  // We'll implement this in the next authentication step.
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Secure access for authorized school users
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
