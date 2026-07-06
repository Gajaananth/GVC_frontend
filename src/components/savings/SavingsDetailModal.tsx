import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import { formatLKR, formatDate } from '../../utils/format';
import { Download, Printer, Search, FileText } from 'lucide-react';
import { ResponsiveTable, TableRow, TableCell } from '../ResponsiveTable';

interface Props {
  accountId: string;
  onClose: () => void;
}

const SavingsDetailModal = ({ accountId, onClose }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['savings-details', accountId],
    queryFn: () => fetchApi(`/savings/${accountId}`),
  });

  const handlePrintStatement = () => {
    // API endpoint for printing statement
    const token = localStorage.getItem('auth-storage'); // Depending on auth
    window.open(`/api/documents/statement/savings/${accountId}`, '_blank');
  };

  const handleExportExcel = () => {
    window.open(`/api/documents/statement/savings/${accountId}/excel`, '_blank');
  };

  if (isLoading) {
    return (
      <Modal title="Savings Account Details" onClose={onClose} wide>
        <div className="p-8 text-center text-gray-500 animate-pulse">Loading account details...</div>
      </Modal>
    );
  }

  if (!data?.data) {
    return (
      <Modal title="Savings Account Details" onClose={onClose} wide>
        <div className="p-8 text-center text-red-500">Failed to load account details.</div>
      </Modal>
    );
  }

  const account = data.data;
  const transactions = account.transactions || [];

  const filteredTransactions = transactions.filter((tx: any) => 
    tx.transaction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal title={`Savings Account - ${account.account_code}`} onClose={onClose} wide>
      <div className="space-y-6">
        
        {/* Account Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-leaf/5 rounded-xl p-4 border border-leaf/10">
            <p className="text-sm text-gray-600 mb-1">Current Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-leaf">{formatLKR(account.balance)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Deposited</p>
            <p className="text-lg font-bold text-gray-900">{formatLKR(account.total_deposited || 0)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Withdrawn</p>
            <p className="text-lg font-bold text-gray-900">{formatLKR(account.total_withdrawn || 0)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Customer</p>
            <p className="font-bold text-gray-900 truncate" title={account.customers?.full_name}>{account.customers?.full_name}</p>
            <p className="text-xs text-gray-500">{account.customers?.customer_code}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button onClick={handlePrintStatement} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Statement (PDF)
          </button>
          <button onClick={handleExportExcel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Passbook Print
          </button>
        </div>

        {/* Ledger Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-900">Transaction Ledger</h4>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ledger..."
                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-leaf outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <ResponsiveTable 
            headers={['Date & Time', 'Type', 'Amount', 'Balance', 'Remarks', 'Receipt']}
            maxHeight="max-h-[400px]"
          >
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <p className="font-medium text-gray-900">{formatDate(tx.transaction_date)}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleTimeString()}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize
                      ${tx.transaction_type === 'deposit' ? 'bg-green-100 text-green-700' : 
                        tx.transaction_type === 'withdrawal' ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-100 text-blue-700'}`}>
                      {tx.transaction_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className={`font-bold ${tx.transaction_type === 'deposit' || tx.transaction_type === 'interest' ? 'text-green-600' : 'text-orange-600'}`}>
                      {tx.transaction_type === 'deposit' || tx.transaction_type === 'interest' ? '+' : '-'} {formatLKR(tx.amount)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-gray-900">{formatLKR(tx.balance_after)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 max-w-[200px] truncate" title={tx.description}>{tx.description || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`/api/documents/receipt/savings/${tx.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg inline-flex items-center justify-center transition-colors"
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </ResponsiveTable>
        </div>
      </div>
    </Modal>
  );
};

export default SavingsDetailModal;
