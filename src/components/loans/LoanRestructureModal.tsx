import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';
import { formatLKR } from '../../utils/format';

interface Props {
  loan: {
    id: string;
    loan_code: string;
    remaining_balance: number;
    interest_rate_per_period?: number;
    interest_rate?: number;
    repayment_frequency?: string;
    term_count?: number;
    customers?: { full_name: string };
  };
  onClose: () => void;
}

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly (14 days)' },
  { value: 'monthly', label: 'Monthly' },
];

const LoanRestructureModal = ({ loan, onClose }: Props) => {
  const queryClient = useQueryClient();
  const currentRate = Number(loan.interest_rate_per_period || loan.interest_rate || 0);

  const [form, setForm] = useState({
    new_interest_rate_per_period: currentRate,
    new_term_count: loan.term_count || 12,
    repayment_frequency: loan.repayment_frequency || 'monthly',
  });

  const [preview, setPreview] = useState<any>(null);

  const previewMutation = useMutation({
    mutationFn: () =>
      fetchApi('/loans/calculate', {
        method: 'POST',
        body: JSON.stringify({
          gross_loan_amount: Number(loan.remaining_balance),
          insurance_fee_percent: 0,
          insurance_fee_amount: 0,
          documentation_fee: 0,
          interest_rate_per_period: form.new_interest_rate_per_period,
          term_count: form.new_term_count,
          repayment_frequency: form.repayment_frequency,
          credit_date: new Date().toISOString().split('T')[0],
        }),
      }),
    onSuccess: (res) => setPreview(res.data),
  });

  const restructureMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/loans/${loan.id}/restructure`, {
        method: 'POST',
        body: JSON.stringify(form),
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Loan restructured successfully');
      queryClient.invalidateQueries({ queryKey: ['loan', loan.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      onClose();
    },
  });

  const handleUpdate = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setPreview(null);
  };

  return (
    <Modal title={`Restructure Loan ${loan.loan_code}`} onClose={onClose} wide>
      <div className="space-y-5">
        {/* Current Loan Summary */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Current Loan</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{loan.customers?.full_name}</span></div>
            <div><span className="text-gray-500">Remaining Balance:</span> <span className="font-bold text-red-600">{formatLKR(loan.remaining_balance)}</span></div>
            <div><span className="text-gray-500">Current Rate:</span> <span className="font-medium">{currentRate}%</span></div>
            <div><span className="text-gray-500">Frequency:</span> <span className="font-medium capitalize">{loan.repayment_frequency || 'monthly'}</span></div>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            The remaining balance of {formatLKR(loan.remaining_balance)} becomes the principal of the new restructured loan.
          </p>
        </div>

        {/* New Terms Form */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">New Terms</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Interest Rate per Period (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-leaf focus:border-leaf"
                value={form.new_interest_rate_per_period}
                onChange={e => handleUpdate('new_interest_rate_per_period', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Number of Installments</label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-leaf focus:border-leaf"
                value={form.new_term_count}
                onChange={e => handleUpdate('new_term_count', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Repayment Frequency</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-leaf focus:border-leaf"
                value={form.repayment_frequency}
                onChange={e => handleUpdate('repayment_frequency', e.target.value)}
              >
                {FREQ_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview Button */}
        <button
          onClick={() => previewMutation.mutate()}
          disabled={previewMutation.isPending}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
        >
          {previewMutation.isPending ? 'Calculating...' : 'Preview New Schedule'}
        </button>

        {/* Preview Result */}
        {preview && (
          <div className="bg-forest/5 border border-forest/10 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-forest">New Loan Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">New Principal</span>
                <span className="font-bold">{formatLKR(preview.grossLoanAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Total Interest</span>
                <span className="font-bold">{formatLKR(preview.totalInterest)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Total Payable</span>
                <span className="font-bold">{formatLKR(preview.totalPayable)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Installment</span>
                <span className="font-bold text-forest">{formatLKR(preview.installmentAmount)}</span>
              </div>
            </div>
            {preview.schedule && preview.schedule.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg mt-2">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Due Date</th><th className="p-2 text-right">Amount</th></tr>
                  </thead>
                  <tbody>
                    {preview.schedule.slice(0, 10).map((s: any) => (
                      <tr key={s.installmentNumber} className="border-t border-gray-50">
                        <td className="p-2">{s.installmentNumber}</td>
                        <td className="p-2">{s.dueDate}</td>
                        <td className="p-2 text-right">{formatLKR(s.installmentAmount)}</td>
                      </tr>
                    ))}
                    {preview.schedule.length > 10 && (
                      <tr><td colSpan={3} className="p-2 text-center text-gray-400">...and {preview.schedule.length - 10} more installments</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => restructureMutation.mutate()}
            disabled={restructureMutation.isPending || !preview}
            className="flex-1 bg-forest hover:bg-leaf text-white font-medium py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {restructureMutation.isPending ? 'Restructuring...' : 'Confirm Restructure'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          This action will mark the current loan as "restructured" and create a new active loan with the updated terms. This cannot be undone.
        </p>
      </div>
    </Modal>
  );
};

export default LoanRestructureModal;
