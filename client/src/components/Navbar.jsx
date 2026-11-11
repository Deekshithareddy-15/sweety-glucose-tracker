import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, LayoutDashboard, History, BarChart3, Menu, X, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Reading History', path: '/history', icon: History },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-400 via-rose-300 to-purple-300 flex items-center justify-center text-white shadow-sm shadow-pink-200 transition-transform group-hover:scale-105">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Sweety
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">
                  Tracker
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Blood Glucose Tracker
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-pink-50 text-pink-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-pink-600' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: User profile & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-medium">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
              title="Log out of Sweety"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-2">
          {user && (
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100 mb-2">
              Signed in as <span className="text-slate-800">{user.name}</span> ({user.email})
            </div>
          )}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-pink-50 text-pink-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-pink-600' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
