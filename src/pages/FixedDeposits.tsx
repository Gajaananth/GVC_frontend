import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Search, Plus, MoreVertical, ShieldCheck, Download, Ban } from 'lucide-react';
import { formatLKR, formatDate } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';
import { ResponsiveTable, TableRow, TableCell } from '../components/ResponsiveTable';
import FixedDepositFormModal from '../components/fixed_deposits/FixedDepositFormModal';
import FDEarlyCloseModal from '../components/fixed_deposits/FDEarlyCloseModal';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/env';

const FixedDeposits = () => {
  const { user } = useAuthStore();
  const isAdminOrOwner = ['admin', 'owner'].includes(user?.role || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: fdData, isLoading } = useQuery({
    queryKey: ['fixed-deposits', page, searchTerm, statusFilter],
    queryFn: () => {
      let url = `/fixed-deposits?page=${page}&limit=10&search=${searchTerm}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      return fetchApi(url);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">Fixed Deposits</h2>
          <p className="text-sm text-gray-500">Manage customer fixed deposits, terms, and maturity.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          New Fixed Deposit
        </button>
      </div>

      <div className="glass-card flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by FD code or customer..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="p-2 border border-gray-200 rounded-xl bg-gray-50 outline-none min-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="matured">Matured</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <ResponsiveTable headers={['FD Details', 'Customer', 'Amount & Term', 'Status', 'Maturity Info', 'Actions']}>
          {isLoading ? (
            <TableRow>
              <TableCell className="p-8 text-center text-gray-500 animate-pulse" colSpan={6}>Loading fixed deposits...</TableCell>
            </TableRow>
          ) : fdData?.data?.length === 0 ? (
            <TableRow>
              <TableCell className="p-8 text-center text-gray-500" colSpan={6}>No fixed deposits found.</TableCell>
            </TableRow>
          ) : (
            fdData?.data?.map((fd: any) => (
              <TableRow key={fd.id}>
                <TableCell>
                  <div className="font-medium text-gray-900">{fd.fd_code}</div>
                  <div className="text-xs text-gray-500">Created: {formatDate(fd.created_at)}</div>
                  {fd.branches && <div className="text-xs text-gray-400">{fd.branches.branch_name}</div>}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{fd.customers?.full_name}</div>
                  <div className="text-sm text-gray-500">{fd.customers?.customer_code}</div>
                  <div className="text-xs text-gray-400">NIC: {fd.customers?.nic_number}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-forest">{formatLKR(fd.principal_amount)}</div>
                  <div className="text-sm text-gray-600">{fd.interest_rate}% p.a.</div>
                  <div className="text-xs text-gray-500">{fd.term_months} Months Term</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    fd.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                    fd.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    fd.status === 'matured' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    fd.status === 'closed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {fd.status.charAt(0).toUpperCase() + fd.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{formatDate(fd.maturity_date)}</div>
                  <div className="text-xs text-gray-500">Est. Total:</div>
                  <div className="text-sm font-bold text-gray-900">{formatLKR(fd.total_maturity_amount)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-forest bg-gray-50 hover:bg-green-50 rounded-lg transition-colors" title="View Details">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {(fd.status === 'active' || fd.status === 'matured') && (
                      <>
                        <button 
                          onClick={() => {
                            const url = `${API_URL}/fixed-deposits/${fd.id}/certificate`;
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `FD-Certificate-${fd.fd_code}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Print Certificate"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {isAdminOrOwner && (
                          <button 
                            onClick={() => setShowCloseModal(fd)}
                            className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Close / Cancel FD"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </ResponsiveTable>
      </div>

      {showModal && <FixedDepositFormModal onClose={() => setShowModal(false)} />}
      {showCloseModal && <FDEarlyCloseModal fd={showCloseModal} onClose={() => setShowCloseModal(null)} />}
    </div>
  );
};

export default FixedDeposits;
