import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import LoanRestructureModal from './LoanRestructureModal';
import { usePermissions } from '../../hooks/usePermissions';
import { formatLKR, formatDate } from '../../utils/format';
import { Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  loanId: string;
  onClose: () => void;
}

const LoanDetailModal = ({ loanId, onClose }: Props) => {
  const { canRequestInChargeChange, isOwner } = usePermissions();
  const queryClient = useQueryClient();
  const [proposedStaff, setProposedStaff] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [showRestructure, setShowRestructure] = useState(false);

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

  const loan = data?.data;
  const staffUsers = (usersData?.data || []).filter((u: any) => u.is_active && ['staff', 'admin'].includes(u.role));

  if (isLoading || !loan) {
    return (
      <Modal title="Loan Details" onClose={onClose} wide>
        <p className="text-center py-8 text-gray-500">{isLoading ? 'Loading...' : 'Not found'}</p>
      </Modal>
    );
  }

  return (
    <Modal title={`Loan ${loan.loan_code}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-lg bg-gray-100 capitalize">Status: {loan.status}</span>
          <span className={`px-2 py-1 rounded-lg capitalize ${loan.approval_status === 'approved' ? 'bg-leaf/20 text-leaf' : loan.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
            Approval: {loan.approval_status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><span className="text-gray-500">Customer</span><p className="font-medium">{loan.customers?.full_name}</p></div>
          <div><span className="text-gray-500">Principal</span><p className="font-medium">{formatLKR(loan.principal_amount)}</p></div>
          <div><span className="text-gray-500">Remaining</span><p className="font-medium">{formatLKR(loan.remaining_balance)}</p></div>
          <div><span className="text-gray-500">Applied By</span><p className="font-medium">{loan.applied_by_user?.full_name || '—'}</p></div>
          <div><span className="text-gray-500">In Charge</span><p className="font-medium">{loan.in_charge_user?.full_name || '—'}</p></div>
          <div><span className="text-gray-500">Next Due</span><p className="font-medium">{loan.next_due_date ? formatDate(loan.next_due_date) : '—'}</p></div>
        </div>

        <div className="flex gap-2 border-b border-gray-100 pb-3">
          <a
            href={`${API_URL}/documents/statement/${loan.customer_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Customer Statement
          </a>
          
          {loan.status === 'closed' && loan.is_fully_paid && (
            <a
              href={`${API_URL}/documents/loan-certificate/${loan.id}`}
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

        {loan.schedule?.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Schedule</h4>
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr><th className="p-2">#</th><th className="p-2">Due</th><th className="p-2">Amount</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {loan.schedule.map((s: any) => (
                    <tr key={s.id} className="border-t border-gray-50">
                      <td className="p-2">{s.installment_number}</td>
                      <td className="p-2">{formatDate(s.due_date)}</td>
                      <td className="p-2">{formatLKR(s.installment_amount)}</td>
                      <td className="p-2 capitalize">{s.status}</td>
                    </tr>
                  ))}
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
                          href={`${API_URL}/documents/receipt/${p.id}`}
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
