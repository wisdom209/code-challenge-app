import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/admin/AdminLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { LanguageSelection } from './pages/LanguageSelection';
import { CategorySelection } from './pages/CategorySelection';
import { CategoryTasks } from './pages/CategoryTasks';
import { TaskDetails } from './pages/TaskDetails';
import { LessonPage } from './pages/LessonPage';
import { Dashboard } from './pages/admin/Dashboard';
import { CreateTask } from './pages/admin/CreateTask';
import { EditTask } from './pages/admin/EditTask';
import { TaskList } from './pages/admin/TaskList';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin Route Component - NEW!
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-display font-bold text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-400 font-mono mb-6">
            You need admin privileges to access this page
          </p>
          <Navigate to="/languages" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with regular Layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />

        {/* Protected User Routes with regular Layout */}
        <Route
          path="/languages"
          element={
            <Layout>
              <ProtectedRoute>
                <LanguageSelection />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/languages/:language/categories"
          element={
            <Layout>
              <ProtectedRoute>
                <CategorySelection />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/languages/:language/:category"
          element={
            <Layout>
              <ProtectedRoute>
                <CategoryTasks />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/task/:id"
          element={
            <Layout>
              <ProtectedRoute>
                <TaskDetails />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/lesson/:language/:category"
          element={
            <Layout>
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Admin Routes with AdminLayout - FIXED! */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <AdminRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </AdminRoute>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <AdminRoute>
                  <AdminLayout>
                    <TaskList />
                  </AdminLayout>
                </AdminRoute>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks/new"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <AdminRoute>
                  <AdminLayout>
                    <CreateTask />
                  </AdminLayout>
                </AdminRoute>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks/edit/:id"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <AdminRoute>
                  <AdminLayout>
                    <EditTask />
                  </AdminLayout>
                </AdminRoute>
              </AdminProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminProvider>
                <AdminRoute>
                  <AdminLayout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-display font-bold text-white mb-4">
                        User Management
                      </h2>
                      <p className="text-gray-400 font-mono">Coming soon...</p>
                    </div>
                  </AdminLayout>
                </AdminRoute>
              </AdminProvider>
            </ProtectedRoute>
          }
        />

        {/* Redirect /admin to /admin/dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

