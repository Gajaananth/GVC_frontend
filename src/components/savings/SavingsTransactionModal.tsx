import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';
import { formatLKR } from '../../utils/format';
import { AlertCircle } from 'lucide-react';

interface Props {
  account: any;
  type: 'deposit' | 'withdrawal';
  onClose: () => void;
}

const SavingsTransactionModal = ({ account, type, onClose }: Props) => {
  const queryClient = useQueryClient();
  const isDeposit = type === 'deposit';

  const [form, setForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    description: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetchApi(`/savings/${account.id}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast.success(data.message || `Cash ${type} successful`);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || `Failed to process ${type}`);
    }
  });

  const amountNum = Number(form.amount);
  const willBeNegative = !isDeposit && amountNum > account.balance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    if (willBeNegative) {
      toast.error('Insufficient balance for withdrawal');
      return;
    }

    mutation.mutate({
      transaction_type: type,
      amount: amountNum,
      payment_method: form.payment_method,
      reference_number: form.reference_number || null,
      description: form.description || `Cash ${type}`,
    });
  };

  return (
    <Modal title={isDeposit ? 'Cash Deposit' : 'Cash Withdrawal'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Account</span>
            <span className="font-semibold text-gray-900">{account.account_code}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Customer</span>
            <span className="font-semibold text-gray-900">{account.customers?.full_name}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
            <span className="text-sm text-gray-600">Current Balance</span>
            <span className="font-bold text-leaf text-lg">{formatLKR(account.balance)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (LKR) *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
          />
          {willBeNegative && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Amount exceeds current balance.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
            <input
              type="text"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            rows={2}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Any additional notes..."
          ></textarea>
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || willBeNegative || amountNum <= 0}
            className={`px-5 py-2.5 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 ${isDeposit ? 'bg-forest hover:bg-leaf' : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            {mutation.isPending ? 'Processing...' : isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SavingsTransactionModal;
