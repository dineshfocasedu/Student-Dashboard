import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">Exam Portal</span>
                <span className="text-blue-400 text-xs font-medium">Admin</span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/exams"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/exams')
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Exams
              </Link>
              <Link
                to="/admin/users"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Users
              </Link>
              <Link
                to="/admin/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/settings')
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <span className="text-gray-300 text-sm font-medium">{user?.name || 'Admin'}</span>
            </div>
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              Student View
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-gray-700 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-700">
            <div className="flex flex-col gap-1">
              <Link to="/admin" className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/exams" className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md" onClick={() => setMenuOpen(false)}>Exams</Link>
              <Link to="/admin/users" className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md" onClick={() => setMenuOpen(false)}>Users</Link>
              <Link to="/admin/settings" className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md" onClick={() => setMenuOpen(false)}>Settings</Link>
              <Link to="/" className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md" onClick={() => setMenuOpen(false)}>Student View</Link>
              <button onClick={handleLogout} className="text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-md">Logout</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
