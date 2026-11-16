import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('smartspend_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartspend_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('smartspend_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartspend_token', res.data.token);
      localStorage.setItem('smartspend_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  };

  const verifyEmail = async (email, otp) => {
    const res = await api.post('/auth/verify-email', { email, otp });
    if (res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartspend_token', res.data.token);
      localStorage.setItem('smartspend_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const resendOtp = async (email, purpose = 'VERIFY_EMAIL') => {
    const res = await api.post('/auth/resend-otp', { email, purpose });
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, otp, newPassword });
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    localStorage.setItem('smartspend_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  };

  const getLatestOtp = async (email) => {
    const res = await api.get(`/auth/latest-otp?email=${encodeURIComponent(email)}`);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartspend_token');
    localStorage.removeItem('smartspend_user');
  };

  const currency = user?.currency || '₹';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        currency,
        login,
        register,
        verifyEmail,
        resendOtp,
        getLatestOtp,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
