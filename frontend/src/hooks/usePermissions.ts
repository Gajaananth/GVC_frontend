import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'view_only';

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isViewOnly = role === 'view_only';

  return {
    isOwner,
    isAdmin,
    isStaff,
    isViewOnly,
    canCreateCustomers: isOwner || isAdmin,
    canEditCustomers: isOwner || isAdmin,
    canDeleteCustomers: isOwner || isAdmin,
    canUploadDocuments: isOwner || isAdmin,
    canViewOnly: isStaff || isViewOnly,
    canIssueLoans: isOwner || isAdmin,
    canApproveLoans: isOwner,
    canChangeLoanStatus: isOwner || isAdmin,
    canRequestInChargeChange: isOwner || isAdmin,
    canSubmitCollections: isStaff,
    canApproveCollections: isOwner || isAdmin,
    canReconcileCollections: isOwner || isAdmin,
    canExecuteCorrections: isOwner || isAdmin,
    canApproveCorrections: isOwner,
    canRecordPaymentsDirect: isOwner || isAdmin,
    canManageSavingsAccounts: isOwner || isAdmin,
    canManageUsers: isOwner || isAdmin,
    canManageSettings: isOwner,
    canSubmitPhysicalForm: isStaff,
    canProcessPhysicalForms: isOwner || isAdmin,
    canEnterCustomerOrLoanData: isOwner || isAdmin,
  };
};
