import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';
import SearchableSelect from '../SearchableSelect';

interface Props {
  onClose: () => void;
}

const SavingsFormModal = ({ onClose }: Props) => {
  const queryClient = useQueryClient();

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => fetchApi('/customers?limit=1000'),
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState({
    customer_id: '',
    account_type: 'regular',
    interest_rate: '0',
    interest_frequency: 'monthly',
    minimum_balance: '0',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetchApi('/savings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast.success('Savings account created successfully');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create savings account');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    mutation.mutate({
      customer_id: form.customer_id,
      account_type: form.account_type,
      interest_rate: Number(form.interest_rate),
      interest_frequency: form.interest_frequency,
      minimum_balance: Number(form.minimum_balance),
      notes: form.notes || null,
    });
  };

  return (
    <Modal title="Open Savings Account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <SearchableSelect
            options={
              customersData?.data?.map((c: any) => ({
                id: c.id,
                label: `${c.customer_code} - ${c.full_name} (${c.nic_number})`,
                value: c.id
              })) || []
            }
            value={form.customer_id}
            onChange={(value) => setForm({ ...form, customer_id: String(value) })}
            placeholder="Search by name, code, or NIC..."
            isLoading={!customersData}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
            <select
              required
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value })}
            >
              <option value="regular">Regular</option>
              <option value="fixed">Fixed</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.interest_rate}
              onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
            />
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Frequency</label>
            <select
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.interest_frequency}
              onChange={(e) => setForm({ ...form, interest_frequency: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Balance (LKR)</label>
            <input
              type="number"
              min="0"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.minimum_balance}
              onChange={(e) => setForm({ ...form, minimum_balance: e.target.value })}
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none resize-none"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            disabled={mutation.isPending}
            className="px-5 py-2.5 bg-forest text-white font-medium rounded-xl hover:bg-leaf transition-colors shadow-sm disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Open Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SavingsFormModal;
