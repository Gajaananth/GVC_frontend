import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';

interface Props {
  customer?: any;
  onClose: () => void;
}

const CustomerFormModal = ({ customer, onClose }: Props) => {
  const queryClient = useQueryClient();
  const isEdit = !!customer;

  const { data: staffList } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => fetchApi('/users?role=staff&limit=100'),
    enabled: !isEdit,
  });

  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    nic_number: customer?.nic_number || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    occupation: customer?.occupation || '',
    monthly_income: customer?.monthly_income || '',
    notes: customer?.notes || '',
    registered_by_staff_id: '',
  });

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      isEdit
        ? fetchApi(`/customers/${customer.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : fetchApi('/customers', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      ...form,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      email: form.email || null,
    };
    if (!isEdit && form.registered_by_staff_id) {
      body.registered_by_staff_id = form.registered_by_staff_id;
    }
    mutation.mutate(body);
  };

  const staffUsers = (staffList?.data || []).filter((u: any) => u.role === 'staff' || u.role === 'admin');

  return (
    <Modal title={isEdit ? 'Edit Customer' : 'Add Customer'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <input required className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">NIC Number *</label>
            <input required disabled={isEdit} className="input-field" value={form.nic_number} onChange={e => setForm({ ...form, nic_number: e.target.value })} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Occupation</label>
            <input className="input-field" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Monthly Income (LKR)</label>
            <input type="number" className="input-field" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })} />
          </div>
        </div>
        {!isEdit && (
          <div>
            <label className="text-sm font-medium text-gray-700">Staff Who Applied (Loan Officer) *</label>
            <select
              required
              className="input-field"
              value={form.registered_by_staff_id}
              onChange={e => setForm({ ...form, registered_by_staff_id: e.target.value })}
            >
              <option value="">Select staff member</option>
              {staffUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Tracks which officer brought this customer (for handover if they leave).</p>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
          After saving, upload scanned application form, NIC copies, customer photo, home and shop images (admin only).
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-forest text-white rounded-xl hover:bg-leaf disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
