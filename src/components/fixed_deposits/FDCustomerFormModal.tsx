import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

interface Props {
  onClose: () => void;
  onSuccess?: (customerId: string) => void;
}

const FDCustomerFormModal = ({ onClose, onSuccess }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchApi('/branches'),
    enabled: isOwner,
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState({
    full_name: '',
    nic_number: '',
    phone: '',
    email: '',
    address: '',
    occupation: '',
    notes: '',
    branch_id: '',
  });

  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicBack, setNicBack] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return fetchApi('/customers/fd', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: (res: any) => {
      toast.success('FD Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (onSuccess && res?.data?.id) {
        onSuccess(res.data.id);
      } else {
        onClose();
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Submission failed');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nicFront || !nicBack) {
      toast.error("NIC front and NIC back are required!");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null) {
        formData.append(k, String(v));
      }
    });
    formData.append('nic_front', nicFront);
    formData.append('nic_back', nicBack);

    mutation.mutate(formData);
  };

  return (
    <Modal title="Add FD Customer" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 mb-4">
          This simplified form is for Fixed Deposit customers only. Face photos are not required.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <input required className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">NIC Number *</label>
            <input required className="input-field" value={form.nic_number} onChange={e => setForm({ ...form, nic_number: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone *</label>
            <input required className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Address *</label>
          <textarea required className="input-field" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        
        {isOwner && (
          <div>
            <label className="text-sm font-medium text-gray-700">Branch</label>
            <select
              className="input-field"
              value={form.branch_id}
              onChange={e => setForm({ ...form, branch_id: e.target.value })}
            >
              <option value="">No branch (optional)</option>
              {(branchesData?.data || []).map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name} ({branch.branch_code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Owner may leave branch unset when adding a Fixed Deposit customer.</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Occupation</label>
          <input className="input-field" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Required Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">NIC Front *</label>
              <input type="file" accept="image/*" required onChange={e => setNicFront(e.target.files?.[0] || null)} className="w-full text-sm border p-2 rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">NIC Back *</label>
              <input type="file" accept="image/*" required onChange={e => setNicBack(e.target.files?.[0] || null)} className="w-full text-sm border p-2 rounded-lg" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-forest text-white rounded-xl hover:bg-leaf disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Create FD Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FDCustomerFormModal;
