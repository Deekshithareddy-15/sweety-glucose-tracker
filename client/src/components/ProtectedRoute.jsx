import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm font-medium">Loading Sweety...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
