import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();
  const role = (user?.role ?? 'view_only') as string;

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isBranchManager = role === 'branch_manager';
  const isCashier = role === 'cashier';
  const isStaff = role === 'staff';
  const isViewOnly = role === 'view_only';

  const canManageCustomers = isOwner || isAdmin || isBranchManager || isCashier;

  return {
    isOwner,
    isAdmin,
    isBranchManager,
    isCashier,
    isStaff,
    isViewOnly,
    canCreateCustomers: canManageCustomers,
    canEditCustomers: canManageCustomers,
    canDeleteCustomers: isOwner || isAdmin || isBranchManager, // Usually delete is more restricted, but keeping it open per instructions if needed. Let's allow branch manager too.
    canUploadDocuments: canManageCustomers,
    canViewOnly: isStaff || isViewOnly,
    canIssueLoans: isOwner || isAdmin || isBranchManager || isCashier,
    canApproveLoans: isOwner,
    canChangeLoanStatus: isOwner || isAdmin || isBranchManager,
    canRequestInChargeChange: isOwner || isAdmin || isBranchManager,
    canSubmitCollections: isStaff,
    canApproveCollections: isOwner || isAdmin || isBranchManager,
    canReconcileCollections: isOwner || isAdmin || isBranchManager,
    canExecuteCorrections: isOwner || isAdmin,
    canApproveCorrections: isOwner,
    canRecordPaymentsDirect: isOwner || isAdmin || isBranchManager || isCashier,
    canManageSavingsAccounts: isOwner || isAdmin || isBranchManager,
    canManageUsers: isOwner || isAdmin,
    canManageSettings: isOwner,
    canSubmitPhysicalForm: isStaff,
    canProcessPhysicalForms: isOwner || isAdmin || isBranchManager || isCashier,
    canEnterCustomerOrLoanData: isOwner || isAdmin || isBranchManager || isCashier,
  };
};
