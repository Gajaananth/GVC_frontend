import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import { usePermissions } from '../../hooks/usePermissions';
import { Upload, FileText, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  { key: 'application_form', label: 'Scanned Application Form (PDF/Image)' },
  { key: 'nic_front', label: 'NIC Front' },
  { key: 'nic_back', label: 'NIC Back' },
  { key: 'photo', label: 'Customer Face Photo' },
  { key: 'home_photo', label: 'Home Photo' },
  { key: 'shop_photo', label: 'Shop / Business Photo' },
];

interface Props {
  customerId: string;
  onClose: () => void;
}

const CustomerDetailModal = ({ customerId, onClose }: Props) => {
  const { canUploadDocuments, isStaff } = usePermissions();
  const queryClient = useQueryClient();
  const [uploadType, setUploadType] = useState('application_form');

  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchApi(`/customers/${customerId}`),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('document_type', uploadType);
      return fetchApi(`/uploads/customers/${customerId}`, { method: 'POST', body: fd });
    },
    onSuccess: () => {
      toast.success('Document uploaded');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });

  const customer = data?.data;

  if (isLoading) {
    return (
      <Modal title="Customer Details" onClose={onClose} wide>
        <p className="text-center text-gray-500 animate-pulse py-8">Loading...</p>
      </Modal>
    );
  }

  if (!customer) {
    return (
      <Modal title="Customer Details" onClose={onClose}>
        <p className="text-red-600">Customer not found</p>
      </Modal>
    );
  }

  const docUrl = (type: string) => {
    const map: Record<string, string> = {
      nic_front: customer.nic_front_url,
      nic_back: customer.nic_back_url,
      photo: customer.photo_url,
      application_form: customer.application_form_url,
      home_photo: customer.home_photo_url,
      shop_photo: customer.shop_photo_url,
    };
    return map[type];
  };

  return (
    <Modal title={customer.full_name} onClose={onClose} wide>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">Code</span><p className="font-medium">{customer.customer_code}</p></div>
          <div><span className="text-gray-500">NIC</span><p className="font-medium">{customer.nic_number}</p></div>
          <div><span className="text-gray-500">Phone</span><p className="font-medium">{customer.phone}</p></div>
          <div className="col-span-2 md:col-span-3"><span className="text-gray-500">Address</span><p className="font-medium">{customer.address}</p></div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documents (Hard Copy Scans)
          </h4>
          {canUploadDocuments ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
              <p className="text-xs text-gray-600 mb-3">Admin only: upload scanned forms and premises photos after customer fills paper forms.</p>
              <div className="flex flex-wrap gap-3 items-end">
                <select className="input-field flex-1" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                  {DOC_TYPES.map(d => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
                <label className="px-4 py-2 bg-forest text-white rounded-xl cursor-pointer hover:bg-leaf flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) uploadMutation.mutate(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg mb-3">
              {isStaff
                ? 'Staff view only — verify physical documents in the field. Admin uploads scans after you hand the paper form to them.'
                : 'View only — document uploads are restricted to admin.'}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOC_TYPES.map(d => {
              const url = docUrl(d.key);
              return (
                <div key={d.key} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg text-sm">
                  <span className="text-gray-700">{d.label}</span>
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="text-forest flex items-center gap-1 text-xs font-medium">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not uploaded</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {customer.loans?.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Loans</h4>
            <ul className="space-y-2 text-sm">
              {customer.loans.map((l: any) => (
                <li key={l.id} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span>{l.loan_code}</span>
                  <span className="capitalize">{l.approval_status || l.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CustomerDetailModal;
