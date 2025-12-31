// client/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import API from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // التغيير هنا: قراءة البيانات فوراً عند تهيئة المتغير (Lazy Initialization)
  // هذا يمنع المشكلة التي تجعله null للحظة وتسبب طردك
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // دالة لتحديث بيانات المستخدم يدوياً (سنحتاجها عند الانضمام لدوري)
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const login = async (username, password) => {
    try {
      const { data } = await API.post('/auth/login', { username, password });
      updateUser(data); // استخدام الدالة الموحدة
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'حدث خطأ ما' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    // نمرر updateUser لنستخدمها في لوحة التحكم
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};