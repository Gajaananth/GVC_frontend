import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const role = user?.role || 'view_only';
  
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  
  return {
    isOwner,
    isAdmin,
    isStaff,
    canEditCustomers: isOwner || isAdmin,
    canDeleteCustomers: isOwner || isAdmin,
    canIssueLoans: isOwner || isAdmin,
    canChangeLoanStatus: isOwner || isAdmin,
    canManageUsers: isOwner || isAdmin,
    canManageSettings: isOwner
  };
};
