import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show header on admin pages (AdminLayout has its own header)
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <header className="bg-dark-900 border-b-2 border-neon-cyan/30 sticky top-0 z-50 backdrop-blur-sm bg-dark-900/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <span className="text-2xl">💻</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white group-hover:text-neon-cyan transition-colors">
                CodeChallenge
              </h1>
              <p className="text-xs text-gray-400 font-mono">Master coding, one challenge at a time</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/languages" 
                  className="text-gray-300 hover:text-neon-cyan transition-colors font-display"
                >
                  Challenges
                </Link>
                
                {/* Admin Panel Link - NEW! */}
                {isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    className="flex items-center gap-2 text-neon-purple hover:text-neon-purple/80 transition-colors font-display font-semibold"
                  >
                    <span>⚙️</span>
                    <span>Admin</span>
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-neon-cyan">{user?.username}</p>
                      {/* Admin Badge - NEW! */}
                      {isAdmin && (
                        <span className="px-2 py-0.5 bg-neon-purple/20 border border-neon-purple/50 rounded text-xs font-mono text-neon-purple">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

