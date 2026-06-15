import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { startKeepAlive, stopKeepAlive } from '../services/keepAlive';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      // Start keep-alive service when user is authenticated
      startKeepAlive();

      // Clean up when component unmounts or user logs out
      return () => {
        // Keep-alive will stop when user fully logs out
      };
    } else {
      // Stop keep-alive if user is not authenticated
      stopKeepAlive();
    }
  }, [user]);

  useEffect(() => {
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      toast.error('You do not have permission to access this page.');
    }
  }, [user, allowedRoles]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
