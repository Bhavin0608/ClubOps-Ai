import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clubops_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('clubops_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('clubops_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[AuthContext] Stale session, clearing token');
          localStorage.removeItem('clubops_token');
          localStorage.removeItem('clubops_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('clubops_token', res.token);
      localStorage.setItem('clubops_user', JSON.stringify(res.user));
      return res.user;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('clubops_token', res.token);
      localStorage.setItem('clubops_user', JSON.stringify(res.user));
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('clubops_token');
    localStorage.removeItem('clubops_user');
    setUser(null);
    setToken(null);
  };

  const isOrganizer = user?.role === 'ORGANIZER';

  return (
    <AuthContext.Provider value={{ user, token, loading, isOrganizer, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
