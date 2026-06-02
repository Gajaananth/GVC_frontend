import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { formatLKR } from '../utils/format';
import { CheckCircle, XCircle, UserCog, Shield, FileWarning } from 'lucide-react';
import toast from 'react-hot-toast';

const Approvals = () => {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [creditDates, setCreditDates] = useState<Record<string, string>>({});

  const { data: pendingLoans, isLoading: loadingLoans } = useQuery({
    queryKey: ['pending-loans'],
    queryFn: () => fetchApi('/approvals/loans/pending'),
  });

  const { data: pendingAssignments, isLoading: loadingAssign } = useQuery({
    queryKey: ['pending-assignments'],
    queryFn: () => fetchApi('/approvals/assignments/pending'),
  });

  const { data: pendingCorrections, isLoading: loadingCorr } = useQuery({
    queryKey: ['pending-corrections'],
    queryFn: () => fetchApi('/collections/corrections/pending'),
  });

  const approveLoan = useMutation({
    mutationFn: ({ id, credit_date }: { id: string; credit_date?: string }) =>
      fetchApi(`/approvals/loans/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(credit_date ? { credit_date } : {}),
      }),
    onSuccess: () => {
      toast.success('Loan approved');
      queryClient.invalidateQueries({ queryKey: ['pending-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const rejectLoan = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      fetchApi(`/approvals/loans/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: reason }) }),
    onSuccess: () => {
      toast.success('Loan rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-loans'] });
    },
  });

  const approveAssignment = useMutation({
    mutationFn: (id: string) => fetchApi(`/approvals/assignments/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('In-charge change approved');
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
    },
  });

  const rejectAssignment = useMutation({
    mutationFn: (id: string) => fetchApi(`/approvals/assignments/${id}/reject`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Change rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
    },
  });

  const approveCorrection = useMutation({
    mutationFn: (id: string) => fetchApi(`/collections/corrections/${id}/approve`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      toast.success('Correction approved — admin can now fix amount/date');
      queryClient.invalidateQueries({ queryKey: ['pending-corrections'] });
    },
  });

  const rejectCorrection = useMutation({
    mutationFn: (id: string) => fetchApi(`/collections/corrections/${id}/reject`, { method: 'POST', body: JSON.stringify({ owner_notes: 'Rejected' }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-corrections'] }),
  });

  const loans = pendingLoans?.data || [];
  const assignments = pendingAssignments?.data || [];
  const corrections = pendingCorrections?.data || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-7 h-7 text-forest" />
          Owner Approvals
        </h2>
        <p className="text-sm text-gray-500">Loans, staff handovers, and collection mistake letters require your approval.</p>
      </div>

      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-amber-600" />
          Staff Correction Letters ({corrections.length})
        </h3>
        {loadingCorr ? (
          <p className="text-gray-500 animate-pulse">Loading...</p>
        ) : corrections.length === 0 ? (
          <p className="text-gray-500">No correction requests.</p>
        ) : (
          <div className="space-y-4">
            {corrections.map((c: any) => (
              <div key={c.id} className="border border-amber-100 bg-amber-50/50 rounded-xl p-4">
                <p className="font-semibold capitalize">{c.request_type} — {c.entity_type.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600 mt-1">From {c.requester?.full_name}</p>
                <p className="text-sm mt-2 italic">&quot;{c.letter_description}&quot;</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approveCorrection.mutate(c.id)} className="px-4 py-2 bg-leaf text-white rounded-xl text-sm">Approve Correction</button>
                  <button onClick={() => rejectCorrection.mutate(c.id)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Pending Loan Approvals ({loans.length})</h3>
        {loadingLoans ? (
          <p className="text-gray-500 animate-pulse">Loading...</p>
        ) : loans.length === 0 ? (
          <p className="text-gray-500">No loans awaiting approval.</p>
        ) : (
          <div className="space-y-4">
            {loans.map((loan: any) => (
              <div key={loan.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{loan.loan_code} — {loan.customers?.full_name}</p>
                  <p className="text-sm text-gray-600">
                    Gross {formatLKR(loan.gross_loan_amount || loan.principal_amount)} → Net {formatLKR(loan.net_disbursement || '—')}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {loan.repayment_frequency || 'monthly'} loan · {loan.term_count || loan.duration_months}{' '}
                    {loan.repayment_frequency === 'daily' ? 'days' : loan.repayment_frequency === 'weekly' ? 'weeks' : loan.repayment_frequency === 'biweekly' ? 'periods (14d)' : 'months'}
                    {' '}@ {loan.interest_rate_per_period || loan.interest_rate}% per period
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Credit: {loan.credit_date || loan.start_date} · First collection: {loan.first_collection_date || 'on approve'}
                    · Staff: {loan.in_charge_user?.full_name}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="date"
                    className="input-field sm:max-w-[160px]"
                    title="Actual credit date if disbursed later"
                    value={creditDates[loan.id] ?? loan.credit_date ?? loan.start_date ?? ''}
                    onChange={e => setCreditDates({ ...creditDates, [loan.id]: e.target.value })}
                  />
                  <input
                    className="input-field sm:max-w-[200px]"
                    placeholder="Rejection reason"
                    value={rejectReason[loan.id] || ''}
                    onChange={e => setRejectReason({ ...rejectReason, [loan.id]: e.target.value })}
                  />
                  <button
                    onClick={() => approveLoan.mutate({ id: loan.id, credit_date: creditDates[loan.id] })}
                    disabled={approveLoan.isPending}
                    className="px-4 py-2 bg-leaf text-white rounded-xl flex items-center justify-center gap-1 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = rejectReason[loan.id];
                      if (!reason?.trim()) { toast.error('Enter rejection reason'); return; }
                      rejectLoan.mutate({ id: loan.id, reason });
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-xl flex items-center justify-center gap-1 text-sm"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Pending In-Charge Changes ({assignments.length})
        </h3>
        {loadingAssign ? (
          <p className="text-gray-500 animate-pulse">Loading...</p>
        ) : assignments.length === 0 ? (
          <p className="text-gray-500">No staff handover requests.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((ch: any) => (
              <div key={ch.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="font-semibold">{ch.loans?.loan_code} — {ch.loans?.customers?.full_name}</p>
                  <p className="text-sm text-gray-600">
                    New in-charge: <strong>{ch.proposed?.full_name}</strong>
                    {ch.previous?.full_name && <> (was {ch.previous.full_name})</>}
                  </p>
                  <p className="text-xs text-gray-500">Requested by {ch.requester?.full_name}: {ch.reason || '—'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveAssignment.mutate(ch.id)} className="px-4 py-2 bg-leaf text-white rounded-xl text-sm">Approve</button>
                  <button onClick={() => rejectAssignment.mutate(ch.id)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Approvals;
