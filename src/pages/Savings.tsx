import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Search, Plus, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';
import { formatLKR } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';

const Savings = () => {
  const { canManageSavingsAccounts } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: savingsData, isLoading } = useQuery({
    queryKey: ['savings', page, searchTerm],
    queryFn: () => fetchApi(`/savings?page=${page}&limit=10&search=${searchTerm}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Savings Accounts</h2>
          <p className="text-sm text-gray-500">Manage customer deposits, withdrawals, and interest.</p>
        </div>
        {canManageSavingsAccounts && (
          <button className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-5 h-5" />
            Open Account
          </button>
        )}
      </div>

      <div className="glass-card flex flex-col">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Account Details</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Current Balance</th>
                <th className="p-4 font-medium">Interest Rate</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading savings accounts...</td>
                </tr>
              ) : savingsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No savings accounts found.</td>
                </tr>
              ) : (
                savingsData?.data?.map((account: any) => (
                  <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{account.account_code}</p>
                        <p className="text-xs text-gray-500 capitalize">{account.account_type} Account</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{account.customers?.full_name}</p>
                        <p className="text-xs text-gray-500">{account.customers?.customer_code}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-leaf">{formatLKR(account.balance)}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-700">{account.interest_rate}% <span className="text-xs text-gray-400 capitalize">p.a.</span></p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {account.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-3 py-1.5 bg-leaf/10 hover:bg-leaf/20 text-leaf rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                          <ArrowDownRight className="w-4 h-4" />
                          Deposit
                        </button>
                        <button className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                          <ArrowUpRight className="w-4 h-4" />
                          Withdraw
                        </button>
                        <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <p>Showing page {page} of {savingsData?.totalPages || 1}</p>
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
              disabled={page === (savingsData?.totalPages || 1)}
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

export default Savings;
