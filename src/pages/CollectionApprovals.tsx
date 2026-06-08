import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { formatLKR, formatDate } from '../utils/format';
import { CheckCircle, XCircle, Scale } from 'lucide-react';
import toast from 'react-hot-toast';

const CollectionApprovals = () => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [staffId, setStaffId] = useState('');
  const [declaredCash, setDeclaredCash] = useState('');
  const [declaredOnline, setDeclaredOnline] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => fetchApi('/users'),
  });

  const staffUsers = (usersData?.data || []).filter((u: any) => u.role === 'staff' && u.is_active);

  const { data: pending } = useQuery({
    queryKey: ['pending-collections', date, staffId],
    queryFn: () => fetchApi(`/collections/pending?date=${date}${staffId ? `&staff_id=${staffId}` : ''}`),
  });

  const { data: reconData, refetch: refetchRecon } = useQuery({
    queryKey: ['reconciliation', staffId, date],
    queryFn: () => fetchApi(`/collections/reconciliation/${staffId}/${date}`),
    enabled: !!staffId,
  });

  const reconcileMutation = useMutation({
    mutationFn: () =>
      fetchApi('/collections/reconciliation', {
        method: 'POST',
        body: JSON.stringify({
          staff_user_id: staffId,
          reconciliation_date: date,
          declared_cash_total: Number(declaredCash),
          declared_online_total: Number(declaredOnline),
        }),
      }),
    onSuccess: (res: any) => {
      toast.success(res.message);
      refetchRecon();
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
    },
  });

  const approvePayment = useMutation({
    mutationFn: (id: string) => fetchApi(`/collections/payments/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Approved');
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
    },
  });

  const rejectPayment = useMutation({
    mutationFn: (id: string) => fetchApi(`/collections/payments/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: 'Rejected' }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-collections'] }),
  });

  const approveSavings = useMutation({
    mutationFn: (id: string) => fetchApi(`/collections/savings/${id}/approve`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-collections'] }),
  });

  const rejectSavings = useMutation({
    mutationFn: (id: string) => fetchApi(`/collections/savings/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: 'Rejected' }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-collections'] }),
  });

  const { data: approvedCorrections } = useQuery({
    queryKey: ['approved-corrections'],
    queryFn: () => fetchApi('/collections/corrections/approved'),
  });

  const [execForm, setExecForm] = useState<Record<string, { date: string; amount: string; void: boolean }>>({});

  const executeCorrection = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      fetchApi(`/collections/corrections/${id}/execute`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Correction applied');
      queryClient.invalidateQueries({ queryKey: ['approved-corrections'] });
    },
  });

  const recon = reconData?.data;
  const isBalanced = recon?.reconciliation?.status === 'balanced';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Collection Approvals</h2>
        <p className="text-sm text-gray-500">Verify each staff member&apos;s physical cash + online matches system entries, then approve collections.</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Scale className="w-5 h-5" /> Daily Reconciliation</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Staff Member</label>
            <select className="input-field" value={staffId} onChange={e => setStaffId(e.target.value)}>
              <option value="">Select staff</option>
              {staffUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {staffId && recon && (
          <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-2">
            <p><strong>System totals</strong> (from staff entries): Cash {formatLKR(recon.system_cash_total)} · Online {formatLKR(recon.system_online_total)}</p>
            <p className="text-gray-500">{recon.pending_count} pending approval · {recon.entry_count} total entries</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md pt-2">
              <div>
                <label className="text-sm">Physical Cash Counted</label>
                <input type="number" className="input-field" value={declaredCash} onChange={e => setDeclaredCash(e.target.value)} placeholder={String(recon.system_cash_total)} />
              </div>
              <div>
                <label className="text-sm">Physical Online Total</label>
                <input type="number" className="input-field" value={declaredOnline} onChange={e => setDeclaredOnline(e.target.value)} placeholder={String(recon.system_online_total)} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => reconcileMutation.mutate()}
              disabled={!declaredCash || !declaredOnline || reconcileMutation.isPending}
              className="px-4 py-2 bg-forest text-white rounded-xl text-sm mt-2"
            >
              Verify Cash & Online Match
            </button>
            {recon.reconciliation && (
              <p className={`font-medium ${isBalanced ? 'text-leaf' : 'text-red-600'}`}>
                Status: {recon.reconciliation.status.toUpperCase()}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Pending Collections — {formatDate(date)}</h3>
        {!isBalanced && staffId && (
          <p className="text-amber-700 text-sm mb-4 bg-amber-50 p-3 rounded-lg">Complete reconciliation for selected staff before approving entries.</p>
        )}

        <div className="space-y-3">
          {(pending?.data?.payments || []).map((p: any) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border border-gray-100 rounded-xl">
              <div className="min-w-0">
                <p className="font-medium">Loan: {p.loans?.loan_code} — {p.customers?.full_name}</p>
                <p className="text-sm text-gray-500">By {p.submitter?.full_name} · {formatLKR(p.amount)} (Cash {formatLKR(p.cash_amount)} / Online {formatLKR(p.online_amount)})</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => approvePayment.mutate(p.id)} className="p-2 bg-leaf/20 text-leaf rounded-lg" title="Approve"><CheckCircle className="w-5 h-5" /></button>
                <button onClick={() => rejectPayment.mutate(p.id)} className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
          {(pending?.data?.savings || []).map((s: any) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border border-gray-100 rounded-xl">
              <div className="min-w-0">
                <p className="font-medium capitalize">{s.transaction_type} — {s.savings_accounts?.account_code}</p>
                <p className="text-sm text-gray-500">By {s.submitter?.full_name} · {formatLKR(s.amount)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => approveSavings.mutate(s.id)} className="p-2 bg-leaf/20 text-leaf rounded-lg"><CheckCircle className="w-5 h-5" /></button>
                <button onClick={() => rejectSavings.mutate(s.id)} className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
          {!pending?.data?.payments?.length && !pending?.data?.savings?.length && (
            <p className="text-gray-500 text-center py-6">No pending collections for this date.</p>
          )}
        </div>
      </div>

      {(approvedCorrections?.data || []).length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 text-amber-800">Execute Owner-Approved Corrections</h3>
          <p className="text-xs text-gray-600 mb-4">Only admin/owner can adjust date and correct values here.</p>
          {(approvedCorrections?.data || []).map((c: any) => (
            <div key={c.id} className="border border-gray-100 rounded-xl p-4 mb-3">
              <p className="font-medium capitalize">{c.request_type} — {c.entity_type}</p>
              <p className="text-sm text-gray-500 italic mt-1">{c.letter_description}</p>
              {c.request_type === 'amend' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-md">
                  <input type="date" className="input-field" placeholder="Corrected date"
                    value={execForm[c.id]?.date || ''}
                    onChange={e => setExecForm({ ...execForm, [c.id]: { ...execForm[c.id], date: e.target.value, amount: execForm[c.id]?.amount || '', void: false } })}
                  />
                  <input type="number" className="input-field" placeholder="Corrected amount"
                    value={execForm[c.id]?.amount || ''}
                    onChange={e => setExecForm({ ...execForm, [c.id]: { ...execForm[c.id], amount: e.target.value, date: execForm[c.id]?.date || '', void: false } })}
                  />
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => executeCorrection.mutate({
                    id: c.id,
                    body: c.request_type === 'void'
                      ? { void_only: true }
                      : { transaction_date: execForm[c.id]?.date, amount: Number(execForm[c.id]?.amount) }
                  })}
                  className="px-4 py-2 bg-forest text-white rounded-xl text-sm"
                >
                  Execute Correction
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionApprovals;
