import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import LoanRestructureModal from './LoanRestructureModal';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';
import { formatLKR, formatDate } from '../../utils/format';
import { Download, RefreshCw, CheckCircle2, Calendar, Save, FileText, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  loanId: string;
  onClose: () => void;
}

interface BackdateEntry {
  installment_number: number;
  paid_amount: number;
  paid_date: string;
  notes?: string;
}

const LoanDetailModal = ({ loanId, onClose }: Props) => {
  const { canRequestInChargeChange, isOwner } = usePermissions();
  const queryClient = useQueryClient();
  const [proposedStaff, setProposedStaff] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [showRestructure, setShowRestructure] = useState(false);
  const [backdateEntries, setBackdateEntries] = useState<Map<number, BackdateEntry>>(new Map());
  const [showBackdateMode, setShowBackdateMode] = useState(false);
  const token = useAuthStore(state => state.accessToken);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const { data, isLoading } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => fetchApi(`/loans/${loanId}`),
  });

  const { data: usersData } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => fetchApi('/users'),
    enabled: canRequestInChargeChange,
  });

  const changeMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/approvals/loans/${loanId}/request-in-charge-change`, {
        method: 'POST',
        body: JSON.stringify({ proposed_in_charge_id: proposedStaff, reason: changeReason }),
      }),
    onSuccess: () => {
      toast.success('In-charge change sent to owner for approval');
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      setProposedStaff('');
      setChangeReason('');
    },
  });

  const backdateMutation = useMutation({
    mutationFn: (payments: BackdateEntry[]) =>
      fetchApi(`/loans/${loanId}/backdate-payments`, {
        method: 'POST',
        body: JSON.stringify({ payments }),
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Payments backdated successfully');
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setBackdateEntries(new Map());
      setShowBackdateMode(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to backdate payments');
    },
  });

  const loan = data?.data;
  const staffUsers = (usersData?.data || []).filter((u: any) => u.is_active && ['staff', 'admin'].includes(u.role));

  const toggleBackdateEntry = (installment: any) => {
    const num = installment.installment_number;
    const newMap = new Map(backdateEntries);
    if (newMap.has(num)) {
      newMap.delete(num);
    } else {
      newMap.set(num, {
        installment_number: num,
        paid_amount: Number(installment.installment_amount),
        paid_date: installment.due_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        notes: '',
      });
    }
    setBackdateEntries(newMap);
  };

  const updateBackdateEntry = (num: number, field: keyof BackdateEntry, value: any) => {
    const newMap = new Map(backdateEntries);
    const entry = newMap.get(num);
    if (entry) {
      (entry as any)[field] = value;
      newMap.set(num, { ...entry });
    }
    setBackdateEntries(newMap);
  };

  const handleBackdateSubmit = () => {
    const payments = Array.from(backdateEntries.values());
    if (payments.length === 0) {
      toast.error('Select at least one installment to mark as paid');
      return;
    }
    backdateMutation.mutate(payments);
  };

  if (isLoading || !loan) {
    return (
      <Modal title="Loan Details" onClose={onClose} wide>
        <p className="text-center py-8 text-gray-500">{isLoading ? 'Loading...' : 'Not found'}</p>
      </Modal>
    );
  }

  const pendingInstallments = (loan.schedule || []).filter(
    (s: any) => ['pending', 'partial', 'overdue'].includes(s.status)
  );

  return (
    <Modal title={`Loan ${loan.loan_code}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-lg bg-gray-100 capitalize">Status: {loan.status}</span>
          <span className={`px-2 py-1 rounded-lg capitalize ${loan.approval_status === 'approved' ? 'bg-leaf/20 text-leaf' : loan.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
            Approval: {loan.approval_status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><span className="text-gray-500">Customer</span><p className="font-medium">{loan.customers?.full_name}</p></div>
          <div><span className="text-gray-500">Principal</span><p className="font-medium">{formatLKR(loan.principal_amount)}</p></div>
          <div><span className="text-gray-500">Total Paid</span><p className="font-medium text-forest">{formatLKR(loan.amount_paid || 0)}</p></div>
          <div><span className="text-gray-500">Remaining</span><p className="font-medium text-amber-600">{formatLKR(loan.remaining_balance)}</p></div>
          <div><span className="text-gray-500">Applied By</span><p className="font-medium">{loan.applied_by_user?.full_name || '—'}</p></div>
          <div><span className="text-gray-500">In Charge</span><p className="font-medium">{loan.in_charge_user?.full_name || '—'}</p></div>
          <div><span className="text-gray-500">Next Due</span><p className="font-medium">{loan.next_due_date ? formatDate(loan.next_due_date) : '—'}</p></div>
        </div>

        <div className="flex gap-2 border-b border-gray-100 pb-3 flex-wrap">
          <a
            href={`${API_URL}/documents/statement/${loan.customer_id}?token=${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Customer Statement
          </a>
          {loan.loan_application_url && (
            <a
              href={`${loan.loan_application_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Application PDF
            </a>
          )}
          {loan.loan_form_url && (
            <a
              href={`${loan.loan_form_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Auto-Generated Form
            </a>
          )}
          
          {loan.status === 'closed' && loan.is_fully_paid && (
            <a
              href={`${API_URL}/documents/loan-certificate/${loan.id}?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-forest hover:bg-leaf text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" /> Completion Certificate
            </a>
          )}
        </div>

        {canRequestInChargeChange && loan.approval_status === 'approved' && (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-gray-800 mb-2">Request In-Charge Change</h4>
            <p className="text-xs text-gray-600 mb-3">Owner must approve before the new staff member takes over this loan.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select className="input-field" value={proposedStaff} onChange={e => setProposedStaff(e.target.value)}>
                <option value="">New in-charge staff</option>
                {staffUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
              <input className="input-field" placeholder="Reason (e.g. previous staff left)" value={changeReason} onChange={e => setChangeReason(e.target.value)} />
            </div>
            <button
              type="button"
              disabled={!proposedStaff || changeMutation.isPending}
              onClick={() => changeMutation.mutate()}
              className="mt-3 px-4 py-2 bg-forest text-white rounded-xl text-sm disabled:opacity-50"
            >
              Submit for Owner Approval
            </button>
          </div>
        )}

        {/* Restructure Loan Button — Owner only, on approved active/overdue loans */}
        {isOwner && loan.approval_status === 'approved' && !['closed', 'restructured'].includes(loan.status) && (
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-orange-900">Restructure This Loan</h4>
                <p className="text-xs text-orange-700">Change interest rate, extend term, or alter repayment frequency. Creates a new loan from the remaining balance.</p>
              </div>
              <button
                onClick={() => setShowRestructure(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" />
                Restructure
              </button>
            </div>
          </div>
        )}

        {/* Schedule Section with Backdate Payments */}
        {loan.schedule?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h4 className="font-semibold">Schedule</h4>
              <div className="flex items-center gap-2">
                <a
                  href={`${API_URL}/documents/loan-schedule/${loan.id}/pdf?token=${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-gray-200"
                >
                  <FileText className="w-3.5 h-3.5" /> PDF
                </a>
                <a
                  href={`${API_URL}/documents/loan-schedule/${loan.id}/excel?token=${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </a>
                {isOwner && loan.approval_status === 'approved' && pendingInstallments.length > 0 && !loan.is_fully_paid && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowBackdateMode(!showBackdateMode);
                      if (showBackdateMode) setBackdateEntries(new Map());
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      showBackdateMode
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-forest text-white hover:bg-leaf'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {showBackdateMode ? 'Cancel Backdate' : 'Backdate Payments'}
                  </button>
                )}
              </div>
            </div>

            {showBackdateMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-amber-800 mb-2 font-medium">
                  📝 Select installments below and set the actual payment date. This is for adding old records where payments were already collected.
                </p>
                {backdateEntries.size > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-amber-700">
                      {backdateEntries.size} installment(s) selected — Total: {formatLKR(
                        Array.from(backdateEntries.values()).reduce((sum, e) => sum + e.paid_amount, 0)
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={handleBackdateSubmit}
                      disabled={backdateMutation.isPending}
                      className="px-4 py-1.5 bg-forest text-white rounded-lg text-xs font-medium hover:bg-leaf disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {backdateMutation.isPending ? 'Saving...' : 'Save Backdated Payments'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="border border-gray-100 rounded-lg overflow-x-auto">
              <table className="w-full text-xs min-w-[600px] whitespace-nowrap">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {showBackdateMode && <th className="p-2 w-8"></th>}
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Due Date</th>
                    <th className="p-2 text-right">Due Amount</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Paid Date</th>
                    <th className="p-2 text-right">Paid Amount</th>
                    <th className="p-2 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {loan.schedule.map((s: any) => {
                    const isPending = ['pending', 'partial', 'overdue'].includes(s.status);
                    const isSelected = backdateEntries.has(s.installment_number);
                    const entry = backdateEntries.get(s.installment_number);

                    return (
                      <tr
                        key={s.id}
                        className={`border-t border-gray-50 ${
                          showBackdateMode && isPending ? 'cursor-pointer hover:bg-forest/5' : ''
                        } ${isSelected ? 'bg-forest/10' : ''} ${
                          s.status === 'paid' ? 'bg-green-50/50' : ''
                        }`}
                        onClick={() => {
                          if (showBackdateMode && isPending) {
                            toggleBackdateEntry(s);
                          }
                        }}
                      >
                        {showBackdateMode && (
                          <td className="p-2 text-center">
                            {isPending && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleBackdateEntry(s)}
                                onClick={(e) => e.stopPropagation()}
                                className="accent-forest w-4 h-4"
                              />
                            )}
                            {s.status === 'paid' && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                            )}
                          </td>
                        )}
                        <td className="p-2">{s.installment_number}</td>
                        <td className="p-2">{formatDate(s.due_date)}</td>
                        <td className="p-2 text-right">{formatLKR(s.installment_amount)}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                            s.status === 'paid' ? 'bg-green-100 text-green-700' :
                            s.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                            s.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        {showBackdateMode && isSelected && entry ? (
                          <>
                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="date"
                                value={entry.paid_date}
                                onChange={(e) => updateBackdateEntry(s.installment_number, 'paid_date', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-[140px] focus:ring-1 focus:ring-forest focus:border-forest outline-none"
                              />
                            </td>
                            <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={entry.paid_amount}
                                onChange={(e) => updateBackdateEntry(s.installment_number, 'paid_amount', Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-[100px] text-right focus:ring-1 focus:ring-forest focus:border-forest outline-none"
                                min={0}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2">{s.paid_date ? formatDate(s.paid_date) : '—'}</td>
                            <td className="p-2 text-right text-forest font-medium">{Number(s.paid_amount) > 0 ? formatLKR(s.paid_amount) : '—'}</td>
                            <td className="p-2 text-center">
                              {(() => {
                                if (!s.paid_date) return <span className="text-gray-400">—</span>;
                                // Find payment by exact installment number in notes (primary), then by date (fallback)
                                const pmt = loan.payments?.find((p: any) => {
                                  if (!p.notes) return false;
                                  const m = p.notes.match(/installment\s*#(\d+)/);
                                  return m && parseInt(m[1], 10) === s.installment_number;
                                }) || loan.payments?.find((p: any) =>
                                  p.approval_status === 'approved' &&
                                  p.payment_date && s.paid_date &&
                                  p.payment_date.split('T')[0] === s.paid_date.split('T')[0]
                                );
                                if (pmt && pmt.approval_status === 'approved') {
                                  return (
                                    <a
                                      href={`${API_URL}/documents/receipt/${pmt.id}?token=${token}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-forest hover:text-leaf inline-flex p-1 bg-green-50 rounded"
                                      title="Download Receipt"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </a>
                                  );
                                }
                                return <span className="text-gray-400">—</span>;
                              })()}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loan.payments?.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Payments</h4>
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr><th className="p-2">Code</th><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Type</th><th className="p-2">Receipt</th></tr></thead>
                <tbody>
                  {loan.payments.map((p: any) => (
                    <tr key={p.id} className="border-t border-gray-50">
                      <td className="p-2">{p.payment_code}</td>
                      <td className="p-2">{formatDate(p.payment_date)}</td>
                      <td className="p-2">{formatLKR(p.amount)}</td>
                      <td className="p-2 capitalize">{p.payment_type}</td>
                      <td className="p-2">
                        <a
                          href={`${API_URL}/documents/receipt/${p.id}?token=${token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forest hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showRestructure && (
        <LoanRestructureModal loan={loan} onClose={() => setShowRestructure(false)} />
      )}
    </Modal>
  );
};

export default LoanDetailModal;
