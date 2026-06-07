import { useAuthStore } from '../store/authStore';
import { ROLE_PERMISSIONS, type UserRole, hasPermission } from '../utils/rolePermissions';

export const usePermissions = () => {
  const { user } = useAuthStore();
  const role = (user?.role ?? 'view_only') as UserRole;

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isBranchManager = role === 'branch_manager';
  const isCashier = role === 'cashier';
  const isStaff = role === 'staff';
  const isViewOnly = role === 'view_only';

  const permissions = ROLE_PERMISSIONS[role];

  return {
    // Role checks
    isOwner,
    isAdmin,
    isBranchManager,
    isCashier,
    isStaff,
    isViewOnly,
    
    // Branch Management
    canManageBranches: permissions.canManageBranch,
    canCreateBranch: permissions.canCreateBranch,
    canViewBranches: !isViewOnly,
    canViewOwnBranch: isOwner || isAdmin || isBranchManager || isCashier || isStaff,
    
    // User Management
    canManageUsers: isOwner || isBranchManager,
    canCreateAdmin: permissions.canCreateAdmin,
    canCreateCashier: permissions.canCreateCashier,
    canCreateStaff: permissions.canCreateStaff,
    canEditBranchUser: permissions.canEditBranchUser,
    
    // Customer Management
    canCreateCustomers: permissions.canCreateCustomer,
    canEditCustomers: permissions.canEditCustomer,
    canDeleteCustomers: isOwner || isBranchManager,
    canUploadDocuments: permissions.canUploadDocuments,
    canViewCustomers: permissions.canViewBranchCustomers,
    canAssignCustomer: permissions.canAssignCustomer,
    canViewAssignedCustomers: permissions.canViewAssignedCustomers,
    
    // Loan Management
    canCreateLoan: permissions.canCreateLoan,
    canEditLoan: permissions.canEditLoan,
    canApproveLoan: permissions.canApproveLoan,
    canRejectLoan: permissions.canRejectLoan,
    canForwardLoan: permissions.canForwardLoan,
    canIssueLoans: permissions.canCreateLoan,
    canApproveLoans: permissions.canApproveLoan,
    canChangeLoanStatus: permissions.canManageLoan,
    
    // Collection & Payment Management
    canSubmitCollections: permissions.canSubmitCollectionRecords,
    canApproveCollections: isOwner || isBranchManager,
    canRecordPaymentsDirect: permissions.canRecordPayment,
    canRecordDeposit: permissions.canRecordDeposit,
    canRecordWithdrawal: permissions.canRecordWithdrawal,
    
    // Savings Management
    canManageSavingsAccounts: permissions.canManageSavings,
    
    // Reports & Activity
    canGenerateReport: permissions.canGenerateReport,
    canViewActivityLog: permissions.canViewActivityLog,
    canViewTransaction: permissions.canViewTransaction,
    
    // Receipt & Operations
    canPrintReceipt: permissions.canPrintReceipt,
    canViewDashboard: permissions.canViewBranchDashboard,
    
    // Settings
    canConfigureSystem: permissions.canConfigureSystem,
    
    // Utility
    canViewOnly: isStaff || isViewOnly,
  };
};
