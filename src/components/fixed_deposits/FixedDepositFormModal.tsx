import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import FDCustomerFormModal from './FDCustomerFormModal';
import SearchableSelect from '../SearchableSelect';

interface Props {
  onClose: () => void;
}

const FixedDepositFormModal = ({ onClose }: Props) => {
  const queryClient = useQueryClient();

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => fetchApi('/customers?limit=1000'),
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState({
    customer_id: '',
    principal_amount: '',
    interest_rate: '',
    term_months: '',
    payout_method: 'cash',
    notes: '',
  });

  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => fetchApi('/fixed-deposits', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-deposits'] });
      toast.success('Fixed Deposit created successfully');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create fixed deposit');
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
      principal_amount: Number(form.principal_amount),
      interest_rate: Number(form.interest_rate),
      term_months: Number(form.term_months),
      payout_method: form.payout_method,
      notes: form.notes
    });
  };

  if (showAddCustomer) {
    return (
      <FDCustomerFormModal 
        onClose={() => setShowAddCustomer(false)} 
        onSuccess={(newCustomerId) => {
          setForm({ ...form, customer_id: newCustomerId });
          setShowAddCustomer(false);
        }} 
      />
    );
  }

  return (
    <Modal title="New Fixed Deposit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex-1 min-w-0">
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
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="p-2.5 bg-forest/10 text-forest rounded-xl hover:bg-forest/20 flex items-center justify-center flex-shrink-0"
              title="Add New FD Customer"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (LKR) *</label>
            <input
              type="number"
              required
              min="1000"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.principal_amount}
              onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
            />
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Interest Rate (%) *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0.1"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.interest_rate}
              onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
            />
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months) *</label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.term_months}
              onChange={(e) => setForm({ ...form, term_months: e.target.value })}
            />
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payout Method *</label>
            <select
              required
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
              value={form.payout_method}
              onChange={(e) => setForm({ ...form, payout_method: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
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
            {mutation.isPending ? 'Creating...' : 'Create FD'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FixedDepositFormModal;
