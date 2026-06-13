import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, API_URL } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Modal from '../Modal';
import toast from 'react-hot-toast';
import { formatLKR } from '../../utils/format';

interface Props {
  fd: any;
  onClose: () => void;
}

const FDEarlyCloseModal = ({ fd, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [payoutAmount, setPayoutAmount] = useState(fd.total_maturity_amount.toString());
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => fetchApi(`/fixed-deposits/${fd.id}/close`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-deposits'] });
      toast.success('Fixed Deposit closed successfully');
      await downloadClosureCertificate();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to close fixed deposit');
    }
  });

  const downloadClosureCertificate = async () => {
    const toastId = toast.loading('Downloading closure certificate...');
    try {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        toast.dismiss(toastId);
        toast.error('Not authenticated. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/fixed-deposits/${fd.id}/closure-certificate`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate closure certificate');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Closure certificate file is empty');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FD-Closure-Certificate-${fd.fd_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('Closure certificate downloaded successfully');
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Failed to download closure certificate');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) < 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }
    
    mutation.mutate({
      payout_amount: Number(payoutAmount),
      notes: notes
    });
  };

  return (
    <Modal title={`Close Fixed Deposit: ${fd.fd_code}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-sm text-yellow-800">
          <p className="font-semibold mb-1">Status: {fd.status === 'active' ? 'Early Closure' : 'Maturity Closure'}</p>
          <p>Principal: {formatLKR(fd.principal_amount)}</p>
          <p>Target Maturity: {formatLKR(fd.total_maturity_amount)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Final Payout Amount (LKR) *</label>
          <input
            type="number"
            required
            step="0.01"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Adjust if penalty applies for early withdrawal.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
          <textarea
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf outline-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Early withdrawal requested by customer. 2% penalty applied."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Closing...' : 'Confirm Closure'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FDEarlyCloseModal;
