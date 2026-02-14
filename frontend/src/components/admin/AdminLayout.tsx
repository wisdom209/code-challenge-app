import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/tasks', label: 'Tasks', icon: '📝' },
  { path: '/admin/tasks/new', label: 'Create Task', icon: '➕' },
  { path: '/admin/users', label: 'Users', icon: '👥', superAdminOnly: true },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r-2 border-neon-purple/30 z-40">
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-lg flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
              <h1 className="text-xl font-display font-bold text-white">
                Admin Panel
              </h1>
            </div>
            
            {/* Back to App Button - NEW! */}
            <Link
              to="/languages"
              className="flex items-center gap-2 text-gray-400 hover:text-neon-cyan transition-colors font-mono text-sm"
            >
              <span>←</span>
              <span>Back to App</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              // Hide super admin only items from regular admins
              if (item.superAdminOnly && !isSuperAdmin) return null;
              
              const isActive = location.pathname === item.path || 
                              (item.path === '/admin/tasks' && location.pathname.startsWith('/admin/tasks'));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-neon-purple/20 border-l-4 border-neon-purple text-neon-purple'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-neon-purple'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-mono font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info at Bottom - NEW! */}
          <div className="border-t border-dark-700 pt-4 mt-4">
            <div className="mb-3">
              <p className="text-xs text-gray-500 font-mono mb-1">Logged in as</p>
              <p className="text-sm font-mono text-white">{user?.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-neon-purple/20 border border-neon-purple/50 rounded text-xs font-mono text-neon-purple">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-neon-pink/20 border border-neon-pink text-neon-pink font-display font-semibold rounded-lg hover:bg-neon-pink/30 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-dark-800 border-b-2 border-neon-purple/30 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-white capitalize">
                  {location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
                </h2>
                <p className="text-gray-400 font-mono text-sm">
                  Manage your platform
                </p>
              </div>
              
              {/* Breadcrumb - NEW! */}
              <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                <Link to="/admin/dashboard" className="hover:text-neon-cyan">
                  Admin
                </Link>
                {location.pathname !== '/admin/dashboard' && (
                  <>
                    <span>/</span>
                    <span className="text-neon-cyan">
                      {location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-6 py-8 min-h-screen">
          {children}
        </main>

        {/* Footer - NEW! */}
        <footer className="border-t border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between text-xs font-mono text-gray-500">
            <p>CodeChallenge Admin Panel v1.0</p>
            <p>© 2026 CodeChallenge Platform</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

