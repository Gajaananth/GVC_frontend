/**
 * Schedule Calculator
 * Generates flexible due schedules with dynamic extension support
 * 
 * Features:
 * - Auto-extends beyond original term when balance remains
 * - Handles underpayments and overpayments
 * - Calculates remaining balance accurately
 * - Generates future installments as needed
 */

export interface LoanData {
  id: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  installment_amount?: number;
}

export interface ScheduleItem {
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  installment_amount: number;
  remaining_balance: number;
}

export interface PaymentData {
  installment_number: number;
  amount: number;
  principal_paid: number;
  interest_paid: number;
  payment_date: string;
}

/**
 * Generate initial loan schedule
 */
export function generateInitialSchedule(loan: LoanData): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  
  const principal = loan.principal_amount;
  const monthlyRate = loan.interest_rate / 100 / 12;
  const months = loan.term_months;
  
  // Calculate EMI (monthly installment)
  const emi = calculateEMI(principal, monthlyRate, months);
  
  let remainingBalance = principal;
  let remainingInterest = (principal * loan.interest_rate * loan.term_months) / (100 * 12);
  
  const startDate = new Date(loan.start_date);
  
  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    // Interest for this month
    const interestAmount = remainingBalance * monthlyRate;
    
    // Principal for this month
    const principalAmount = Math.min(emi - interestAmount, remainingBalance);
    
    // Actual installment (may be less in final month)
    const installmentAmount = principalAmount + interestAmount;
    
    remainingBalance -= principalAmount;
    remainingInterest -= interestAmount;
    
    // Ensure no negative balance
    if (remainingBalance < 0) {
      remainingBalance = 0;
    }
    
    schedule.push({
      installment_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal_amount: Math.round(principalAmount * 100) / 100,
      interest_amount: Math.round(interestAmount * 100) / 100,
      installment_amount: Math.round(installmentAmount * 100) / 100,
      remaining_balance: Math.round(remainingBalance * 100) / 100,
    });
  }
  
  return schedule;
}

/**
 * Calculate EMI (Equated Monthly Installment)
 * P = principal, r = monthly rate, n = months
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEMI(
  principal: number,
  monthlyRate: number,
  months: number
): number {
  if (monthlyRate === 0) {
    return principal / months;
  }
  
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  return numerator / denominator;
}

/**
 * Extend schedule if balance remains (handles underpayments)
 */
export function extendScheduleForRemainingBalance(
  originalSchedule: ScheduleItem[],
  payments: PaymentData[],
  loan: LoanData
): ScheduleItem[] {
  // Calculate total paid
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate remaining balance
  const remainingBalance = loan.principal_amount - totalPaid;
  
  if (remainingBalance <= 0) {
    return originalSchedule;
  }
  
  // Get the last scheduled installment
  const lastSchedule = originalSchedule[originalSchedule.length - 1];
  const lastDueDate = new Date(lastSchedule.due_date);
  
  // Generate extension schedule for remaining balance
  const extendedSchedule = [...originalSchedule];
  let currentBalance = remainingBalance;
  let installmentNum = originalSchedule.length + 1;
  
  // Calculate monthly rate for extensions
  const monthlyRate = loan.interest_rate / 100 / 12;
  
  // Generate new installments until balance is zero
  while (currentBalance > 0) {
    const nextDueDate = new Date(lastDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + (installmentNum - originalSchedule.length));
    
    // Calculate interest on remaining balance
    const interestAmount = currentBalance * monthlyRate;
    
    // Principal = average of remaining balance over the period
    const principalAmount = Math.min(
      currentBalance,
      (loan.principal_amount / loan.term_months) * 0.8 // Estimate based on original
    );
    
    const installmentAmount = principalAmount + interestAmount;
    currentBalance -= principalAmount;
    
    if (currentBalance < 0) {
      currentBalance = 0;
    }
    
    extendedSchedule.push({
      installment_number: installmentNum,
      due_date: nextDueDate.toISOString().split('T')[0],
      principal_amount: Math.round(principalAmount * 100) / 100,
      interest_amount: Math.round(interestAmount * 100) / 100,
      installment_amount: Math.round(installmentAmount * 100) / 100,
      remaining_balance: Math.round(currentBalance * 100) / 100,
    });
    
    installmentNum++;
    
    // Safety: prevent infinite loop
    if (installmentNum > originalSchedule.length + 60) {
      break;
    }
  }
  
  return extendedSchedule;
}

/**
 * Recalculate schedule with new payment
 */
export function recalculateScheduleWithPayment(
  originalSchedule: ScheduleItem[],
  allPayments: PaymentData[],
  loan: LoanData
): ScheduleItem[] {
  // First extend for any remaining balance
  let schedule = extendScheduleForRemainingBalance(
    originalSchedule,
    allPayments,
    loan
  );
  
  // Recalculate remaining balances based on actual payments
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  let outstandingBalance = loan.principal_amount - totalPaid;
  
  // Update remaining balance for each installment
  schedule = schedule.map((item, index) => {
    if (index === schedule.length - 1) {
      return {
        ...item,
        remaining_balance: Math.max(0, outstandingBalance),
      };
    }
    
    // For non-final items, estimate the outstanding
    const ratioOfSchedule = (index + 1) / schedule.length;
    const estimatedPrincipalPaid = loan.principal_amount * ratioOfSchedule - totalPaid;
    
    return {
      ...item,
      remaining_balance: Math.max(0, outstandingBalance - estimatedPrincipalPaid),
    };
  });
  
  return schedule;
}

/**
 * Get detailed schedule report
 */
export function getScheduleReport(
  schedule: ScheduleItem[],
  payments: PaymentData[]
) {
  const totalInstallments = schedule.length;
  const totalPrincipal = schedule.reduce((sum, s) => sum + s.principal_amount, 0);
  const totalInterest = schedule.reduce((sum, s) => sum + s.interest_amount, 0);
  const totalAmount = totalPrincipal + totalInterest;
  
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = totalAmount - totalPaid;
  
  const originalTermMonths = schedule.length;
  const extendedMonths = Math.max(0, schedule.length - originalTermMonths);
  
  return {
    totalInstallments,
    originalTermMonths: originalTermMonths,
    extendedMonths: extendedMonths,
    isExtended: extendedMonths > 0,
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
  };
}
