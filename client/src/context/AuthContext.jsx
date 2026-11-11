import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sweety_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on page load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('sweety_token');
      if (storedToken) {
        try {
          const data = await authService.getProfile();
          setUser(data.user);
          setToken(storedToken);
        } catch (err) {
          console.warn('Session expired or invalid. Clearing saved token.');
          localStorage.removeItem('sweety_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem('sweety_token', data.token);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await authService.signup({ name, email, password });
    localStorage.setItem('sweety_token', data.token);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sweety_token');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
