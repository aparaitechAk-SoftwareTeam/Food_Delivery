import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  const user = localStorage.getItem('admin_user');
  
  if (!token || !user) {
    // Clear storage just in case
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const parsedUser = JSON.parse(user);
    if (parsedUser.role !== 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      return <Navigate to="/admin/login" replace />;
    }
  } catch (e) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
