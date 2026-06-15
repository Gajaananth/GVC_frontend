/**
 * Due Status Calculator
 * Calculates accurate due status based on actual payment records
 * 
 * Statuses:
 * - PAID: 100% of installment settled
 * - PARTIAL: 1-99% of installment settled
 * - OVERDUE: Past due date and not fully settled
 * - PENDING: Future due date and not settled
 */

export interface DueScheduleItem {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string; // YYYY-MM-DD
  principal_amount: number;
  interest_amount: number;
  installment_amount: number;
  paid_amount?: number;
  status?: string;
}

export interface PaymentRecord {
  id: string;
  loan_id: string;
  installment_number?: number;
  amount: number;
  principal_paid?: number;
  interest_paid?: number;
  payment_date: string;
  payment_type: string;
}

/**
 * Calculate the accurate status of a due schedule item
 * based on actual payment records
 */
export function calculateDueStatus(
  schedule: DueScheduleItem,
  payments: PaymentRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING' {
  // Get all payments for this installment
  // Prefer authoritative paid_amount on schedule (server-side). Fallback to payments matching installment_number.
  let totalPaid = typeof schedule.paid_amount === 'number' ? schedule.paid_amount : 0;
  if (totalPaid === 0) {
    const relevantPayments = payments.filter(p => p.loan_id === schedule.loan_id && p.installment_number === schedule.installment_number);
    totalPaid = relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }
  
  const installmentAmount = schedule.installment_amount || 0;
  const dueDate = schedule.due_date;

  // Calculate payment percentage
  const paymentPercentage = installmentAmount > 0 ? (totalPaid / installmentAmount) * 100 : 0;

  // Rule 1: PAID - 100% of installment settled
  if (paymentPercentage >= 100) {
    return 'PAID';
  }

  // Rule 2: PARTIAL - 1-99% settled
  if (paymentPercentage > 0 && paymentPercentage < 100) {
    return 'PARTIAL';
  }

  // Rule 3 & 4: OVERDUE vs PENDING - based on due date
  const isPastDue = dueDate < today;

  if (isPastDue && paymentPercentage === 0) {
    return 'OVERDUE';
  }

  if (!isPastDue && paymentPercentage === 0) {
    return 'PENDING';
  }

  // Rule 3 (alternative): OVERDUE - Past due date and not fully settled (catch partial)
  if (isPastDue && paymentPercentage < 100) {
    return 'OVERDUE';
  }

  // Default to PENDING if unsure
  return 'PENDING';
}

/**
 * Calculate all due statuses for a loan's schedule
 */
export function calculateAllDueStatuses(
  schedules: DueScheduleItem[],
  payments: PaymentRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): (DueScheduleItem & { calculated_status: string })[] {
  return schedules.map(schedule => ({
    ...schedule,
    calculated_status: calculateDueStatus(schedule, payments, today),
  }));
}

/**
 * Validate that status calculations match payment records
 */
export function validateStatusCalculations(
  schedules: DueScheduleItem[],
  payments: PaymentRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): boolean {
  try {
    for (const schedule of schedules) {
      const calculatedStatus = calculateDueStatus(schedule, payments, today);
      // Status should always be one of the valid values
      if (!['PAID', 'PARTIAL', 'OVERDUE', 'PENDING'].includes(calculatedStatus)) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get status summary for a loan
 */
export function getStatusSummary(
  schedules: DueScheduleItem[],
  payments: PaymentRecord[],
  today: string = new Date().toISOString().slice(0, 10)
) {
  const statuses = calculateAllDueStatuses(schedules, payments, today);
  
  return {
    total: statuses.length,
    paid: statuses.filter(s => s.calculated_status === 'PAID').length,
    partial: statuses.filter(s => s.calculated_status === 'PARTIAL').length,
    overdue: statuses.filter(s => s.calculated_status === 'OVERDUE').length,
    pending: statuses.filter(s => s.calculated_status === 'PENDING').length,
  };
}
