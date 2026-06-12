import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Search, Plus, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatLKR, formatDate } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';
import LoanFormModal from '../components/loans/LoanFormModal';
import LoanDetailModal from '../components/loans/LoanDetailModal';

const Loans = () => {
  const { canIssueLoans, isStaff } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: loansData, isLoading } = useQuery({
    queryKey: ['loans', page, searchTerm, statusFilter, approvalFilter],
    queryFn: () => fetchApi(
      `/loans?page=${page}&limit=10&search=${searchTerm}${statusFilter ? `&status=${statusFilter}` : ''}${approvalFilter ? `&approval_status=${approvalFilter}` : ''}`
    ),
    staleTime: 1000 * 30, // 30 seconds
  });

  const getStatusBadge = (loan: any) => {
    if (loan.approval_status === 'pending_approval') {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 w-max">Awaiting Owner</span>;
    }
    if (loan.approval_status === 'rejected') {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 w-max">Rejected</span>;
    }
    switch (loan.status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Active</span>;
      case 'closed':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-leaf/20 text-leaf flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Closed</span>;
      case 'overdue':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      case 'pending_approval':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 w-max">Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 w-max">{loan.status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">Loans Portfolio</h2>
          <p className="text-sm text-gray-500">
            {isStaff
              ? 'View all loans and evidence. Loan applications are entered by admin after you submit physical forms.'
              : 'Create loans here after receiving staff paper forms. Owner approves before the loan becomes active.'}
          </p>
        </div>
        {canIssueLoans && (
          <button onClick={() => setShowNew(true)} className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            New Loan
          </button>
        )}
      </div>

      <div className="glass-card flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-full sm:min-w-[200px] max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by loan ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="closed">Closed</option>
          </select>
          <select className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 outline-none" value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)}>
            <option value="">All Approvals</option>
            <option value="pending_approval">Awaiting Owner</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Loan & Customer</th>
                <th className="p-4 font-medium">Staff</th>
                <th className="p-4 font-medium">Principal</th>
                <th className="p-4 font-medium">Balance</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading loans...</td></tr>
              ) : loansData?.data?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No loans found.</td></tr>
              ) : (
                loansData?.data?.map((loan: any) => (
                  <tr key={loan.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{loan.loan_code}</p>
                      <p className="text-sm text-gray-500">{loan.customers?.full_name}</p>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      <p>Applied: {loan.applied_by_user?.full_name || '—'}</p>
                      <p>In charge: {loan.in_charge_user?.full_name || '—'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{formatLKR(loan.principal_amount)}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {loan.repayment_frequency || 'monthly'}
                          {loan.term_count != null && (
                            <> · {loan.term_count} {loan.repayment_frequency === 'daily' ? 'days' : loan.repayment_frequency === 'weekly' ? 'weeks' : loan.repayment_frequency === 'biweekly' ? '×14d' : 'mo'}</>
                          )}
                        </p>
                        {loan.net_disbursement != null && (
                          <p className="text-xs text-gray-400">Net disbursed {formatLKR(loan.net_disbursement)}</p>
                        )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-forest">{formatLKR(loan.remaining_balance)}</p>
                      {loan.next_due_date && <p className="text-xs text-gray-500">Due {formatDate(loan.next_due_date)}</p>}
                    </td>
                    <td className="p-4">{getStatusBadge(loan)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setDetailId(loan.id)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1.5 ml-auto">
                        <FileText className="w-4 h-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500">
          <p>Page {page} of {loansData?.totalPages || 1}</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled={page === (loansData?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {showNew && <LoanFormModal onClose={() => setShowNew(false)} />}
      {detailId && <LoanDetailModal loanId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
};

export default Loans;
