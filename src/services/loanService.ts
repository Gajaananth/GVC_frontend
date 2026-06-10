// src/services/loanService.ts
import { fetchApi } from './api';

export interface Loan {
  id: string;
  loan_code: string;
  customer_id: string;
  branch_id: string;
  applied_by: string;
  approval_status: 'pending_manager_review' | 'pending_owner_approval' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  loan_form_url?: string;
  loan_application_url: string; // PDF required
  principal_amount: number;
  interest_rate: number;
  interest_type: 'daily' | 'monthly';
  duration_months: number;
  start_date: string;
  end_date: string;
  total_interest: number;
  total_payable: number;
  installment_amount: number;
  amount_paid: number;
  remaining_balance: number;
  status: 'pending_approval' | 'active' | 'closed' | 'overdue' | 'restructured';
  is_fully_paid: boolean;
  last_payment_date?: string;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanCreateRequest {
  customer_id: string;
  branch_id: string;
  principal_amount: number;
  interest_rate: number;
  interest_type: 'daily' | 'monthly';
  duration_months: number;
  start_date: string;
  loan_application_url: string; // PDF URL required
  purpose?: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  collateral_notes?: string;
}

export const loanService = {
  // Get loan by ID
  async getLoan(loanId: string): Promise<Loan> {
    return fetchApi(`/loans/${loanId}`);
  },

  // Get branch loans
  async getBranchLoans(branchId: string, filters?: any): Promise<Loan[]> {
    const query = new URLSearchParams({ branch_id: branchId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return fetchApi(`/loans?${query.toString()}`);
  },

  // Get customer loans
  async getCustomerLoans(customerId: string): Promise<Loan[]> {
    return fetchApi(`/customers/${customerId}/loans`);
  },

  // Create loan (Admin/Cashier/BranchManager)
  // Workflow depends on whether branch has manager:
  // - Branch HAS Manager: pending_manager_review
  // - Branch NO Manager: pending_owner_approval
  async createLoan(data: LoanCreateRequest): Promise<Loan> {
    if (!data.loan_application_url) {
      throw new Error('Signed Loan Application PDF is required');
    }
    return fetchApi('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Loan approval workflow

  // 1. Branch Manager reviews (if manager exists)
  async reviewLoanAsManager(loanId: string, action: 'forward' | 'reject', notes?: string): Promise<Loan> {
    return fetchApi(`/loans/${loanId}/manager-review`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
  },

  // 2. Owner approves or rejects (final decision)
  async approveLoan(loanId: string): Promise<Loan> {
    return fetchApi(`/loans/${loanId}/approve`, {
      method: 'POST',
    });
  },

  async rejectLoan(loanId: string, rejection_reason: string): Promise<Loan> {
    return fetchApi(`/loans/${loanId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    });
  },

  // Get pending approvals for current user
  // Owner: all pending approvals
  // Manager: pending manager review in their branch
  async getPendingApprovals(userRole: string, branchId?: string): Promise<Loan[]> {
    const query = new URLSearchParams({ status: 'pending_approval' });
    if (branchId) {
      query.append('branch_id', branchId);
    }
    return fetchApi(`/loans/pending?${query.toString()}`);
  },

  // Get loans awaiting manager review
  async getLoansAwaitingManagerReview(branchId: string): Promise<Loan[]> {
    return fetchApi(`/loans?branch_id=${branchId}&approval_status=pending_manager_review`);
  },

  // Get loans awaiting owner approval
  async getLoansAwaitingOwnerApproval(): Promise<Loan[]> {
    return fetchApi('/loans?approval_status=pending_owner_approval');
  },

  // Update loan
  async updateLoan(loanId: string, data: Partial<Loan>): Promise<Loan> {
    return fetchApi(`/loans/${loanId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get loan payment history
  async getLoanPaymentHistory(loanId: string): Promise<any[]> {
    return fetchApi(`/loans/${loanId}/payments`);
  },

  // Get loan schedule
  async getLoanSchedule(loanId: string): Promise<any[]> {
    return fetchApi(`/loans/${loanId}/schedule`);
  },
};