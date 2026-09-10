import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './context/AuthContext';

import DashboardLayout from './layouts/DashboardLayout';

import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Students from './pages/students/Students';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
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
        {/* ================================
            PUBLIC ROUTES
        ================================= */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* ================================
            PROTECTED APPLICATION
        ================================= */}

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Students */}
          <Route path="/students" element={<Students />} />

          {/* Temporary routes */}
          <Route
            path="/teachers"
            element={<PlaceholderPage title="Teachers" />}
          />

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

          <Route path="/fees" element={<PlaceholderPage title="Fees" />} />

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

        {/* ================================
            DEFAULT ROUTES
        ================================= */}

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
