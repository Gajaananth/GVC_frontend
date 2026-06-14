/**
 * Fixed Deposits Service
 * Manages FD operations including block/unblock with proper status updates
 */

import { fetchApi } from './api';

export interface FixedDepositData {
  id: string;
  fd_code: string;
  customer_id: string;
  branch_id: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  maturity_date: string;
  status: 'pending' | 'active' | 'matured' | 'closed' | 'rejected' | 'blocked';
  is_blocked: boolean;
  block_reason?: string;
  blocked_at?: string;
  blocked_by?: string;
  closed_at?: string;
  closed_by?: string;
  payout_amount?: number;
  closure_reason?: string;
  total_interest?: number;
  total_maturity_amount?: number;
  payout_method?: string;
  notes?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlockFDRequest {
  reason: string;
  notes?: string;
}

export interface UnblockFDRequest {
  reason?: string;
  notes?: string;
}

export interface CloseFDRequest {
  payout_amount: number;
  closure_reason: string;
  payout_method: string;
  notes?: string;
}

/**
 * Get fresh FD data (bypass cache)
 */
export async function getFreshFDData(fdId: string): Promise<FixedDepositData> {
  try {
    const response = await fetchApi(`/fixed-deposits/${fdId}?fresh=true&_t=${Date.now()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching FD data:', error);
    throw new Error('Failed to fetch fixed deposit data');
  }
}

/**
 * Get FD status (derives from is_blocked flag and actual status)
 */
export function getDerivedFDStatus(fd: FixedDepositData): string {
  // If explicitly blocked, status is BLOCKED regardless of other status
  if (fd.is_blocked === true) {
    return 'BLOCKED';
  }

  // Otherwise use actual status field
  return fd.status || 'active';
}

/**
 * Block an FD
 * Sets is_blocked = true, block_reason, blocked_at, blocked_by
 * IMPORTANT: Status should show BLOCKED after this
 */
export async function blockFixedDeposit(
  fdId: string,
  request: BlockFDRequest,
  userId: string
): Promise<FixedDepositData> {
  try {
    const response = await fetchApi(`/fixed-deposits/${fdId}/block`, {
      method: 'POST',
      body: JSON.stringify({
        block_reason: request.reason,
        notes: request.notes || '',
        blocked_by: userId,
        blocked_at: new Date().toISOString(),
      }),
    });

    // Validate that status changed to BLOCKED
    if (!response.data.is_blocked) {
      throw new Error('Block operation did not set is_blocked flag');
    }

    return response.data;
  } catch (error) {
    console.error('Error blocking FD:', error);
    throw new Error('Failed to block fixed deposit');
  }
}

/**
 * Unblock an FD
 * Sets is_blocked = false, clears block_reason, blocked_at, blocked_by
 * IMPORTANT: Status should return to original (ACTIVE) after this
 */
export async function unblockFixedDeposit(
  fdId: string,
  request: UnblockFDRequest,
  userId: string
): Promise<FixedDepositData> {
  try {
    const response = await fetchApi(`/fixed-deposits/${fdId}/unblock`, {
      method: 'POST',
      body: JSON.stringify({
        reason: request.reason || '',
        notes: request.notes || '',
        unblocked_by: userId,
        unblocked_at: new Date().toISOString(),
      }),
    });

    // Validate that is_blocked is now false
    if (response.data.is_blocked === true) {
      throw new Error('Unblock operation did not clear is_blocked flag');
    }

    return response.data;
  } catch (error) {
    console.error('Error unblocking FD:', error);
    throw new Error('Failed to unblock fixed deposit');
  }
}

/**
 * Close an FD (maturity/settlement)
 * Sets status = CLOSED, closed_at, closed_by, payout_amount, closure_reason
 */
export async function closeFixedDeposit(
  fdId: string,
  request: CloseFDRequest,
  userId: string
): Promise<FixedDepositData> {
  try {
    const response = await fetchApi(`/fixed-deposits/${fdId}/close`, {
      method: 'POST',
      body: JSON.stringify({
        payout_amount: request.payout_amount,
        closure_reason: request.closure_reason,
        payout_method: request.payout_method,
        notes: request.notes || '',
        closed_by: userId,
        closed_at: new Date().toISOString(),
      }),
    });

    // Validate status changed to CLOSED
    if (response.data.status !== 'closed') {
      throw new Error('Close operation did not set status to closed');
    }

    return response.data;
  } catch (error) {
    console.error('Error closing FD:', error);
    throw new Error('Failed to close fixed deposit');
  }
}

/**
 * Get FD status display
 * Returns user-friendly status with color/icon info
 */
export function getFDStatusDisplay(fd: FixedDepositData) {
  const derivedStatus = getDerivedFDStatus(fd);

  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    'pending': { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    'active': { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-50' },
    'matured': { label: 'Matured', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    'closed': { label: 'Closed', color: 'text-gray-700', bgColor: 'bg-gray-50' },
    'blocked': { label: 'Blocked', color: 'text-red-700', bgColor: 'bg-red-50' },
    'rejected': { label: 'Rejected', color: 'text-red-800', bgColor: 'bg-red-100' },
  };

  return statusMap[derivedStatus.toLowerCase()] || { label: derivedStatus, color: 'text-gray-700', bgColor: 'bg-gray-50' };
}

/**
 * Get FD details with summary
 */
export async function getFDWithSummary(fdId: string) {
  const fd = await getFreshFDData(fdId);

  const maturityDate = new Date(fd.maturity_date);
  const today = new Date();
  const daysToMaturity = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    ...fd,
    derivedStatus: getDerivedFDStatus(fd),
    daysToMaturity: daysToMaturity >= 0 ? daysToMaturity : 0,
    isMatured: maturityDate <= today,
    totalInterest: fd.total_interest || (fd.principal_amount * fd.interest_rate * fd.term_months / 100 / 12),
    totalMaturityAmount: fd.total_maturity_amount || (fd.principal_amount + (fd.principal_amount * fd.interest_rate * fd.term_months / 100 / 12)),
    statusDisplay: getFDStatusDisplay(fd),
  };
}

/**
 * List all FDs for a customer (fetch fresh)
 */
export async function getFDsForCustomer(customerId: string): Promise<FixedDepositData[]> {
  try {
    const response = await fetchApi(`/customers/${customerId}/fixed-deposits?fresh=true&_t=${Date.now()}`);
    return Array.isArray(response.data) ? response.data : response.data.fixed_deposits || [];
  } catch (error) {
    console.error('Error fetching customer FDs:', error);
    throw new Error('Failed to fetch fixed deposits');
  }
}

/**
 * List all FDs in a branch
 */
export async function getFDsForBranch(branchId: string): Promise<FixedDepositData[]> {
  try {
    const response = await fetchApi(`/branches/${branchId}/fixed-deposits?fresh=true&_t=${Date.now()}`);
    return Array.isArray(response.data) ? response.data : response.data.fixed_deposits || [];
  } catch (error) {
    console.error('Error fetching branch FDs:', error);
    throw new Error('Failed to fetch fixed deposits');
  }
}

/**
 * Validate FD data
 */
export function validateFDData(fd: FixedDepositData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!fd.principal_amount || fd.principal_amount <= 0) {
    errors.push('Principal amount must be greater than 0');
  }

  if (!fd.interest_rate || fd.interest_rate < 0) {
    errors.push('Interest rate must be valid');
  }

  if (!fd.term_months || fd.term_months <= 0) {
    errors.push('Term months must be greater than 0');
  }

  if (!fd.maturity_date) {
    errors.push('Maturity date is required');
  }

  // Check status validity
  const validStatuses = ['pending', 'active', 'matured', 'closed', 'rejected', 'blocked'];
  if (!validStatuses.includes(fd.status.toLowerCase())) {
    errors.push(`Invalid status: ${fd.status}`);
  }

  // Check block/unblock consistency
  if (fd.is_blocked && !fd.block_reason) {
    errors.push('Blocked FD must have block_reason');
  }

  if (!fd.is_blocked && fd.block_reason) {
    errors.push('Non-blocked FD should not have block_reason');
  }

  // Check closed consistency
  if (fd.status === 'closed' && !fd.payout_amount) {
    errors.push('Closed FD must have payout_amount');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
