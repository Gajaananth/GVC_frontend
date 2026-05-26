import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Search, Plus, Filter, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatLKR, formatDate } from '../utils/format';

const Loans = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: loansData, isLoading } = useQuery({
    queryKey: ['loans', page, searchTerm, statusFilter],
    queryFn: () => fetchApi(`/loans?page=${page}&limit=10&search=${searchTerm}${statusFilter ? `&status=${statusFilter}` : ''}`),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Active</span>;
      case 'closed':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-leaf/20 text-leaf flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Closed</span>;
      case 'overdue':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 w-max">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loans Portfolio</h2>
          <p className="text-sm text-gray-500">Manage all loans, statuses, and balances.</p>
        </div>
        <button className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" />
          New Loan
        </button>
      </div>

      <div className="glass-card flex flex-col">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by loan ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:ring-2 focus:ring-leaf transition-all outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Loan ID & Customer</th>
                <th className="p-4 font-medium">Principal & Duration</th>
                <th className="p-4 font-medium">Remaining Balance</th>
                <th className="p-4 font-medium">Next Due</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading loans...</td>
                </tr>
              ) : loansData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No loans found.</td>
                </tr>
              ) : (
                loansData?.data?.map((loan: any) => (
                  <tr key={loan.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{loan.loan_code}</p>
                        <p className="text-sm text-gray-500">{loan.customers?.full_name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{formatLKR(loan.principal_amount)}</p>
                        <p className="text-xs text-gray-500">{loan.duration_months} Months @ {loan.interest_rate}%</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className={`font-bold ${loan.remaining_balance > 0 ? 'text-forest' : 'text-gray-400'}`}>
                        {formatLKR(loan.remaining_balance)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-700">{formatDate(loan.next_due_date)}</p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="p-4 text-right">
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ml-auto">
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

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <p>Showing page {page} of {loansData?.totalPages || 1}</p>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button 
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={page === (loansData?.totalPages || 1)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loans;
