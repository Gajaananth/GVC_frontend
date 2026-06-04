import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  preselectedCustomerId?: string;
}

const SubmitPhysicalFormModal = ({ onClose, preselectedCustomerId }: Props) => {
  const [mode, setMode] = useState<'existing' | 'walkin'>(preselectedCustomerId ? 'existing' : 'existing');
  const [form, setForm] = useState({
    customer_id: preselectedCustomerId || '',
    walk_in_full_name: '',
    walk_in_nic: '',
    walk_in_phone: '',
    form_type: 'both',
    staff_notes: '',
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-all-forms'],
    queryFn: () => fetchApi('/customers?limit=500&status=active'),
  });

  const mutation = useMutation({
    mutationFn: () =>
      fetchApi('/forms/submit', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: mode === 'existing' ? form.customer_id : null,
          walk_in_full_name: mode === 'walkin' ? form.walk_in_full_name : null,
          walk_in_nic: mode === 'walkin' ? form.walk_in_nic || null : null,
          walk_in_phone: mode === 'walkin' ? form.walk_in_phone || null : null,
          form_type: form.form_type,
          staff_notes: form.staff_notes,
        }),
      }),
    onSuccess: () => {
      toast.success('Physical form handed to admin for data entry');
      onClose();
    },
  });

  return (
    <Modal title="Submit Physical Form to Admin" onClose={onClose} wide>
      <form
        onSubmit={e => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-blue-800 bg-blue-50 p-3 rounded-lg">
          You verified evidence in person. Hand the paper form to admin — they will enter customer & loan details in the system and send to the owner for approval. You cannot enter loan or customer data yourself.
        </p>

        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('existing')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'existing' ? 'bg-forest text-white' : 'bg-gray-100'}`}>
            Existing customer
          </button>
          <button type="button" onClick={() => setMode('walkin')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'walkin' ? 'bg-forest text-white' : 'bg-gray-100'}`}>
            New walk-in
          </button>
        </div>

        {mode === 'existing' ? (
          <div>
            <label className="text-sm font-medium">Customer *</label>
            <select
              required
              className="input-field"
              value={form.customer_id}
              onChange={e => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select customer</option>
              {(customersData?.data || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.full_name} — {c.nic_number}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Name on form *</label>
              <input required className="input-field" value={form.walk_in_full_name} onChange={e => setForm({ ...form, walk_in_full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">NIC</label>
              <input className="input-field" value={form.walk_in_nic} onChange={e => setForm({ ...form, walk_in_nic: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input className="input-field" value={form.walk_in_phone} onChange={e => setForm({ ...form, walk_in_phone: e.target.value })} />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Form type *</label>
          <select className="input-field" value={form.form_type} onChange={e => setForm({ ...form, form_type: e.target.value })}>
            <option value="new_customer">New customer registration</option>
            <option value="new_loan">New loan application</option>
            <option value="both">Customer + loan application</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Notes for admin *</label>
          <textarea
            required
            minLength={10}
            rows={4}
            className="input-field"
            placeholder="What documents were collected? Any special conditions? Location visited?"
            value={form.staff_notes}
            onChange={e => setForm({ ...form, staff_notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 rounded-xl hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-forest text-white rounded-xl disabled:opacity-50">
            {mutation.isPending ? 'Submitting...' : 'Hand Form to Admin'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SubmitPhysicalFormModal;
