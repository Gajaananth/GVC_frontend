import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuthStore();
  const location = useLocation();

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
