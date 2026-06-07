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
  const canManageUsers = isOwner || isAdmin || isBranchManager;

  return {
    isOwner,
    isAdmin,
    isBranchManager,
    isCashier,
    isStaff,
    isViewOnly,
    // Branch Management
    canManageBranches: isOwner,
    canViewBranches: !isViewOnly,
    canViewOwnBranch: isOwner || isAdmin || isBranchManager || isCashier || isStaff,
    // User Management
    canManageUsers,
    // Customer Management
    canCreateCustomers: canManageCustomers,
    canEditCustomers: canManageCustomers,
    canDeleteCustomers: isOwner || isAdmin || isBranchManager,
    canUploadDocuments: canManageCustomers,
    canViewOnly: isStaff || isViewOnly,
    // Loan Management
    canIssueLoans: isOwner || isAdmin || isBranchManager || isCashier,
    canApproveLoans: isOwner,
    canChangeLoanStatus: isOwner || isAdmin || isBranchManager,
    canRequestInChargeChange: isOwner || isAdmin || isBranchManager,
    // Collection Management
    canSubmitCollections: isStaff,
    canApproveCollections: isOwner || isAdmin || isBranchManager,
    canReconcileCollections: isOwner || isAdmin || isBranchManager,
    canExecuteCorrections: isOwner || isAdmin,
    canApproveCorrections: isOwner,
    // Payments & Savings
    canRecordPaymentsDirect: isOwner || isAdmin || isBranchManager || isCashier,
    canManageSavingsAccounts: isOwner || isAdmin || isBranchManager,
    // Settings Management
    canManageSettings: isOwner,
    // Physical Forms
    canSubmitPhysicalForm: isStaff,
    canProcessPhysicalForms: isOwner || isAdmin || isBranchManager || isCashier,
    canEnterCustomerOrLoanData: isOwner || isAdmin || isBranchManager || isCashier,
  };
};
