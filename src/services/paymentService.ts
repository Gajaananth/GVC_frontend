// src/services/paymentService.ts
import { fetchApi } from './api';

export interface Payment {
  id: string;
  payment_code: string;
  loan_id: string;
  customer_id: string;
  branch_id: string;
  payment_date: string;
  amount: number;
  principal_paid: number;
  interest_paid: number;
  late_fee_paid: number;
  payment_type: 'regular' | 'partial' | 'full_settlement' | 'advance';
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'mobile';
  reference_number?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
}

export interface PaymentCreateRequest {
  loan_id: string;
  amount: number;
  payment_type: 'regular' | 'partial' | 'full_settlement' | 'advance';
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'mobile';
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

export const paymentService = {
  // Record payment (Cashier/Admin/BranchManager/Staff can record)
  async recordPayment(data: PaymentCreateRequest): Promise<Payment> {
    return fetchApi('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get loan payments
  async getLoanPayments(loanId: string): Promise<Payment[]> {
    return fetchApi(`/loans/${loanId}/payments`);
  },

  // Get customer payment history
  async getCustomerPaymentHistory(customerId: string): Promise<Payment[]> {
    return fetchApi(`/customers/${customerId}/payments`);
  },

  // Get branch payments
  async getBranchPayments(branchId: string, filters?: any): Promise<Payment[]> {
    const query = new URLSearchParams({ branch_id: branchId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return fetchApi(`/payments?${query.toString()}`);
  },

  // Get payment by ID
  async getPayment(paymentId: string): Promise<Payment> {
    return fetchApi(`/payments/${paymentId}`);
  },

  // Print receipt
  async printReceipt(paymentId: string): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/${paymentId}/receipt`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    return response.blob();
  },

  // Get daily collection summary (for Staff)
  async getDailyCollectionSummary(staffId: string, date: string): Promise<any> {
    return fetchApi(`/staff/${staffId}/daily-collection?date=${date}`);
  },
};