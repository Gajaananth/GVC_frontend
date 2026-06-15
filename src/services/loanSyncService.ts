/**
 * Loan Sync Service
 * Provides real-time fresh loan data without client-side caching
 * Ensures Customer Management always shows latest data from Loan Portfolio
 */

import { fetchApi } from './api';

export interface LoanPaymentData {
  id: string;
  loan_id: string;
  amount: number;
  principal_paid: number;
  interest_paid: number;
  payment_date: string;
  payment_type: string;
  reference_number?: string;
  payment_method?: string;
  notes?: string;
  staff_id?: string;
  created_by?: string;
  created_at: string;
}

export interface DueScheduleData {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  installment_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoanDetailData {
  id: string;
  customer_id: string;
  loan_code: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  created_date: string;
  approved_date?: string;
  maturity_date?: string;
  status: string;
  guarantor_id?: string;
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionHistoryData {
  id: string;
  loan_id: string;
  customer_id: string;
  amount: number;
  principal_collected?: number;
  interest_collected?: number;
  collection_date: string;
  staff_id: string;
  branch_id?: string;
  notes?: string;
  reference_number?: string;
  created_by: string;
  created_at: string;
}

/**
 * Get fresh loan details (bypasses client-side cache)
 * Always fetches from server for latest data
 */
export async function getFreshLoanDetails(
  loanId: string,
  options?: { forceRefresh?: boolean }
): Promise<any> { // Any to accommodate the nested schedule/payments
  try {
    // Add timestamp to bust any cache
    const timestamp = options?.forceRefresh ? `&_t=${Date.now()}` : '';
    const response = await fetchApi(`/loans/${loanId}?fresh=true${timestamp}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching loan details:', error);
    throw new Error('Failed to fetch loan details');
  }
}

/**
 * Get fresh payment history (bypasses client-side cache)
 */
export async function getFreshPaymentHistory(
  loanId: string,
  options?: { forceRefresh?: boolean }
): Promise<LoanPaymentData[]> {
  try {
    const fullData = await getFreshLoanDetails(loanId, options);
    return fullData.payments || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw new Error('Failed to fetch payment history');
  }
}

/**
 * Get fresh collection history (bypasses client-side cache)
 */
export async function getFreshCollectionHistory(
  loanId: string,
  options?: { forceRefresh?: boolean }
): Promise<CollectionHistoryData[]> {
  return []; // Collections endpoint does not exist on backend and isn't used by the UI (it uses payments)
}

/**
 * Get fresh due schedule (bypasses client-side cache)
 */
export async function getFreshDueSchedule(
  loanId: string,
  options?: { forceRefresh?: boolean }
): Promise<DueScheduleData[]> {
  try {
    const fullData = await getFreshLoanDetails(loanId, options);
    return fullData.schedule || [];
  } catch (error) {
    console.error('Error fetching due schedule:', error);
    throw new Error('Failed to fetch due schedule');
  }
}

/**
 * Get complete loan information (details + payments + schedule + collections)
 * in a single fresh fetch
 */
export async function getCompleteLoanData(
  loanId: string,
  options?: { forceRefresh?: boolean }
) {
  try {
    // Only 1 network request needed since the backend returns it all
    const fullData = await getFreshLoanDetails(loanId, options);

    return {
      loan: fullData,
      payments: fullData.payments || [],
      schedule: fullData.schedule || [],
      collections: [],
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching complete loan data:', error);
    throw new Error('Failed to fetch complete loan data');
  }
}

/**
 * Invalidate cache and force refresh from server
 * Call this when loan data is updated from Loan Portfolio
 */
export async function refreshLoanDataCache(loanId: string) {
  try {
    await fetchApi(`/loans/${loanId}/refresh-cache`, {
      method: 'POST',
    });
    return true;
  } catch (error) {
    console.error('Error refreshing cache:', error);
    // Don't throw - continue with fresh fetch
    return false;
  }
}

/**
 * Notify sync service of loan update (call from Loan Portfolio when updating)
 * This triggers cache invalidation across all clients
 */
export async function notifyLoanUpdated(loanId: string, updatedFields?: string[]) {
  try {
    await fetchApi(`/loans/${loanId}/notify-update`, {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        fields: updatedFields || [],
      }),
    });
    return true;
  } catch (error) {
    console.error('Error notifying loan update:', error);
    return false;
  }
}

/**
 * Get payment summary
 */
export function getPaymentSummary(payments: LoanPaymentData[]) {
  return {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    totalPrincipal: payments.reduce((sum, p) => sum + (p.principal_paid || 0), 0),
    totalInterest: payments.reduce((sum, p) => sum + (p.interest_paid || 0), 0),
    lastPaymentDate: payments.length > 0
      ? payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0].payment_date
      : null,
  };
}

/**
 * Get collection summary
 */
export function getCollectionSummary(collections: CollectionHistoryData[]) {
  return {
    totalCollections: collections.length,
    totalAmount: collections.reduce((sum, c) => sum + c.amount, 0),
    lastCollectionDate: collections.length > 0
      ? collections.sort((a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime())[0].collection_date
      : null,
  };
}

/**
 * Validate loan data consistency
 */
export function validateLoanDataConsistency(data: {
  loan: LoanDetailData;
  payments: LoanPaymentData[];
  schedule: DueScheduleData[];
  collections: CollectionHistoryData[];
}) {
  const issues: string[] = [];

  // Check 1: Total payments shouldn't exceed principal + interest
  const totalPayments = data.payments.reduce((sum, p) => sum + p.amount, 0);
  const expectedTotal = data.loan.principal_amount + (data.loan.principal_amount * data.loan.interest_rate / 100);
  
  if (totalPayments > expectedTotal * 1.1) { // 10% tolerance
    issues.push(`Total payments (${totalPayments}) exceeds expected total (${expectedTotal})`);
  }

  // Check 2: Schedule total should match loan terms
  const scheduledTotal = data.schedule.reduce((sum, s) => sum + s.installment_amount, 0);
  if (Math.abs(scheduledTotal - expectedTotal) > 1000) { // Allow 1000 variance
    issues.push(`Schedule total (${scheduledTotal}) doesn't match expected (${expectedTotal})`);
  }

  // Check 3: Status consistency
  if (!['active', 'approved', 'closed', 'rejected', 'pending'].includes(data.loan.status.toLowerCase())) {
    issues.push(`Invalid loan status: ${data.loan.status}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
