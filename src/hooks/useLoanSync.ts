/**
 * useLoanSync Hook
 * Custom React hook for fresh loan data fetching
 * Ensures real-time data updates without stale cache
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as loanSyncService from '../services/loanSyncService';

export const LOAN_QUERY_KEYS = {
  loanDetails: (loanId: string) => ['loan-details', loanId],
  payments: (loanId: string) => ['loan-payments', loanId],
  schedule: (loanId: string) => ['loan-schedule', loanId],
  collections: (loanId: string) => ['loan-collections', loanId],
  completeLoan: (loanId: string) => ['loan-complete', loanId],
};

interface UseLoanSyncOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number; // 0 = immediately stale (always fetch fresh)
  gcTime?: number; // garbage collect time
  retryCount?: number;
}

/**
 * Fetch fresh loan details
 */
export function useFreshLoanDetails(
  loanId: string | null | undefined,
  options?: UseLoanSyncOptions
) {
  const defaultOptions: UseLoanSyncOptions = {
    enabled: !!loanId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fresh
    gcTime: 5 * 60 * 1000, // 5 minutes
    retryCount: 2,
    ...options,
  };

  return useQuery({
    queryKey: LOAN_QUERY_KEYS.loanDetails(loanId || ''),
    queryFn: () => loanSyncService.getFreshLoanDetails(loanId!, { forceRefresh: true }),
    enabled: defaultOptions.enabled,
    staleTime: defaultOptions.staleTime,
    gcTime: defaultOptions.gcTime,
    refetchOnMount: defaultOptions.refetchOnMount,
    refetchOnWindowFocus: defaultOptions.refetchOnWindowFocus,
    retry: defaultOptions.retryCount,
  });
}

/**
 * Fetch fresh payment history
 */
export function useFreshPaymentHistory(
  loanId: string | null | undefined,
  options?: UseLoanSyncOptions
) {
  const defaultOptions: UseLoanSyncOptions = {
    enabled: !!loanId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retryCount: 2,
    ...options,
  };

  return useQuery({
    queryKey: LOAN_QUERY_KEYS.payments(loanId || ''),
    queryFn: () => loanSyncService.getFreshPaymentHistory(loanId!, { forceRefresh: true }),
    enabled: defaultOptions.enabled,
    staleTime: defaultOptions.staleTime,
    gcTime: defaultOptions.gcTime,
    refetchOnMount: defaultOptions.refetchOnMount,
    refetchOnWindowFocus: defaultOptions.refetchOnWindowFocus,
    retry: defaultOptions.retryCount,
  });
}

/**
 * Fetch fresh collection history
 */
export function useFreshCollectionHistory(
  loanId: string | null | undefined,
  options?: UseLoanSyncOptions
) {
  const defaultOptions: UseLoanSyncOptions = {
    enabled: !!loanId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retryCount: 2,
    ...options,
  };

  return useQuery({
    queryKey: LOAN_QUERY_KEYS.collections(loanId || ''),
    queryFn: () => loanSyncService.getFreshCollectionHistory(loanId!, { forceRefresh: true }),
    enabled: defaultOptions.enabled,
    staleTime: defaultOptions.staleTime,
    gcTime: defaultOptions.gcTime,
    refetchOnMount: defaultOptions.refetchOnMount,
    refetchOnWindowFocus: defaultOptions.refetchOnWindowFocus,
    retry: defaultOptions.retryCount,
  });
}

/**
 * Fetch fresh due schedule
 */
export function useFreshDueSchedule(
  loanId: string | null | undefined,
  options?: UseLoanSyncOptions
) {
  const defaultOptions: UseLoanSyncOptions = {
    enabled: !!loanId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retryCount: 2,
    ...options,
  };

  return useQuery({
    queryKey: LOAN_QUERY_KEYS.schedule(loanId || ''),
    queryFn: () => loanSyncService.getFreshDueSchedule(loanId!, { forceRefresh: true }),
    enabled: defaultOptions.enabled,
    staleTime: defaultOptions.staleTime,
    gcTime: defaultOptions.gcTime,
    refetchOnMount: defaultOptions.refetchOnMount,
    refetchOnWindowFocus: defaultOptions.refetchOnWindowFocus,
    retry: defaultOptions.retryCount,
  });
}

/**
 * Fetch complete loan data (details + payments + schedule + collections)
 */
export function useCompleteLoanData(
  loanId: string | null | undefined,
  options?: UseLoanSyncOptions
) {
  const defaultOptions: UseLoanSyncOptions = {
    enabled: !!loanId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retryCount: 2,
    ...options,
  };

  return useQuery({
    queryKey: LOAN_QUERY_KEYS.completeLoan(loanId || ''),
    queryFn: () => loanSyncService.getCompleteLoanData(loanId!, { forceRefresh: true }),
    enabled: defaultOptions.enabled,
    staleTime: defaultOptions.staleTime,
    gcTime: defaultOptions.gcTime,
    refetchOnMount: defaultOptions.refetchOnMount,
    refetchOnWindowFocus: defaultOptions.refetchOnWindowFocus,
    retry: defaultOptions.retryCount,
  });
}

/**
 * Hook to invalidate and refresh loan cache
 * Call this when loan data is updated from Loan Portfolio
 */
export function useInvalidateLoanCache() {
  const queryClient = useQueryClient();

  const invalidateLoanDetails = (loanId: string) => {
    queryClient.invalidateQueries({
      queryKey: LOAN_QUERY_KEYS.loanDetails(loanId),
    });
  };

  const invalidatePayments = (loanId: string) => {
    queryClient.invalidateQueries({
      queryKey: LOAN_QUERY_KEYS.payments(loanId),
    });
  };

  const invalidateSchedule = (loanId: string) => {
    queryClient.invalidateQueries({
      queryKey: LOAN_QUERY_KEYS.schedule(loanId),
    });
  };

  const invalidateCollections = (loanId: string) => {
    queryClient.invalidateQueries({
      queryKey: LOAN_QUERY_KEYS.collections(loanId),
    });
  };

  const invalidateCompleteLoan = (loanId: string) => {
    queryClient.invalidateQueries({
      queryKey: LOAN_QUERY_KEYS.completeLoan(loanId),
    });
  };

  const invalidateAllLoanData = (loanId: string) => {
    invalidateLoanDetails(loanId);
    invalidatePayments(loanId);
    invalidateSchedule(loanId);
    invalidateCollections(loanId);
    invalidateCompleteLoan(loanId);
  };

  return {
    invalidateLoanDetails,
    invalidatePayments,
    invalidateSchedule,
    invalidateCollections,
    invalidateCompleteLoan,
    invalidateAllLoanData,
  };
}

/**
 * Hook to automatically refresh loan data when activated
 */
export function useAutoRefreshLoanData(
  loanId: string | null | undefined,
  enabled: boolean = true,
  intervalMs: number = 30000 // 30 seconds
) {
  const queryClient = useQueryClient();
  const { invalidateAllLoanData } = useInvalidateLoanCache();

  useEffect(() => {
    if (!enabled || !loanId) return;

    // Refetch immediately
    invalidateAllLoanData(loanId);

    // Set up interval for periodic refresh
    const interval = setInterval(() => {
      invalidateAllLoanData(loanId);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, loanId, intervalMs, invalidateAllLoanData]);
}

/**
 * Hook to listen for loan update events
 * Useful for real-time updates across tabs/windows
 */
export function useLoanUpdateListener() {
  const queryClient = useQueryClient();
  const { invalidateAllLoanData } = useInvalidateLoanCache();

  useEffect(() => {
    const handleLoanUpdate = (event: CustomEvent<{ loanId: string }>) => {
      invalidateAllLoanData(event.detail.loanId);
      // Optionally emit a toast notification
    };

    window.addEventListener('loanUpdated', handleLoanUpdate as EventListener);

    return () => {
      window.removeEventListener('loanUpdated', handleLoanUpdate as EventListener);
    };
  }, [invalidateAllLoanData]);

  // Function to emit loan update event
  const emitLoanUpdate = (loanId: string) => {
    window.dispatchEvent(
      new CustomEvent('loanUpdated', {
        detail: { loanId },
      })
    );
  };

  return { emitLoanUpdate };
}
