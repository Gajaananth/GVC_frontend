import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { FileInput, CheckCircle, User } from 'lucide-react';
import { formatDate } from '../utils/format';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const PhysicalForms = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-physical-forms'],
    queryFn: () => fetchApi('/forms/pending'),
  });

  const processMutation = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/forms/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: 'Entered in system and submitted to owner' }),
      }),
    onSuccess: () => {
      toast.success('Marked processed');
      queryClient.invalidateQueries({ queryKey: ['pending-physical-forms'] });
    },
  });

  const forms = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileInput className="w-7 h-7 text-forest" />
          Physical Forms from Staff
        </h2>
        <p className="text-sm text-gray-500">
          Staff verified evidence and handed paper forms. Enter customer & loan details here, upload scans, then submit to owner for approval.
        </p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 animate-pulse">Loading...</p>
      ) : forms.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">No pending physical forms from staff.</div>
      ) : (
        <div className="space-y-4">
          {forms.map((f: any) => (
            <div key={f.id} className="glass-card p-5 border-l-4 border-forest">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 capitalize">{f.form_type.replace('_', ' ')}</p>
                  {f.customers ? (
                    <p className="text-sm text-gray-700 mt-1">
                      Customer: <strong>{f.customers.full_name}</strong> ({f.customers.customer_code})
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700 mt-1">
                      Walk-in: <strong>{f.walk_in_full_name}</strong>
                      {f.walk_in_nic && <> · NIC {f.walk_in_nic}</>}
                      {f.walk_in_phone && <> · {f.walk_in_phone}</>}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <User className="w-3 h-3" /> Submitted by {f.submitter?.full_name} · {formatDate(f.created_at)}
                  </p>
                  <p className="text-sm mt-3 bg-gray-50 p-3 rounded-lg italic">&quot;{f.staff_notes}&quot;</p>
                </div>
                <div className="flex flex-col gap-2">
                  {f.customer_id && (
                    <Link to="/customers" className="text-sm text-forest underline text-center">
                      Open Customers
                    </Link>
                  )}
                  <Link to="/loans" className="px-4 py-2 bg-forest text-white rounded-xl text-sm text-center">
                    Create / Enter Loan
                  </Link>
                  <button
                    onClick={() => processMutation.mutate(f.id)}
                    className="px-4 py-2 bg-leaf/20 text-leaf rounded-xl text-sm flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Processed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhysicalForms;
