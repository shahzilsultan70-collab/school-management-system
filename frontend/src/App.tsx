import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './context/AuthContext';

import DashboardLayout from './layouts/DashboardLayout';

import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Students from './pages/students/Students';
import Teachers from './pages/teacher/Teachers';

import Fees from './pages/fees/Fees';
import CreateFee from './pages/fees/CreateFee';
import EditFee from './pages/fees/EditFee';
import FeeDetails from './pages/fees/FeeDetails';

import Payments from './pages/payments/Payments';
import PaymentDetails from './pages/payments/PaymentDetails';
import PaymentReceipt from './pages/payments/PaymentReceipt';
import PaymentSuccess from './pages/payments/PaymentSuccess';
import PaymentCancel from './pages/payments/PaymentCancel';
import Subscriptions from './pages/payments/Subscriptions';

import AdminPayments from './pages/admin/AdminPayments';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* PROTECTED */}

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          {/* People */}

          <Route path="/students" element={<Students />} />

          <Route path="/teachers" element={<Teachers />} />

          {/* Academics */}

          <Route path="/admins" element={<PlaceholderPage title="Admins" />} />

          <Route
            path="/classes"
            element={<PlaceholderPage title="Classes" />}
          />

          <Route
            path="/subjects"
            element={<PlaceholderPage title="Subjects" />}
          />

          <Route
            path="/attendance"
            element={<PlaceholderPage title="Attendance" />}
          />

          <Route path="/exams" element={<PlaceholderPage title="Exams" />} />

          <Route
            path="/results"
            element={<PlaceholderPage title="Results" />}
          />

          {/* FEES */}

          <Route path="/fees" element={<Fees />} />

          <Route path="/fees/create" element={<CreateFee />} />

          <Route path="/fees/:id/edit" element={<EditFee />} />

          <Route path="/fees/:id" element={<FeeDetails />} />

          {/* STUDENT PAYMENTS */}

          <Route path="/payments/success" element={<PaymentSuccess />} />

          <Route path="/payments/cancel" element={<PaymentCancel />} />

          <Route path="/payments" element={<Payments />} />

          <Route path="/payments/subscriptions" element={<Subscriptions />} />

          <Route path="/payments/:id/receipt" element={<PaymentReceipt />} />

          <Route path="/payments/:id" element={<PaymentDetails />} />

          {/* ADMIN PAYMENTS */}

          <Route path="/admin/payments" element={<AdminPayments />} />

          {/* Other modules */}

          <Route path="/leaves" element={<PlaceholderPage title="Leaves" />} />

          <Route
            path="/assignments"
            element={<PlaceholderPage title="Assignments" />}
          />

          <Route
            path="/notices"
            element={<PlaceholderPage title="Notices" />}
          />

          <Route
            path="/settings"
            element={<PlaceholderPage title="Settings" />}
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

      <p className="mt-2 text-sm text-gray-500">
        This module will be implemented soon.
      </p>
    </div>
  );
}

export default App;
