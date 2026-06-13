import React, { useState } from 'react';
import Modal from './Modal';
import { fetchApi } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  loanId: string;
  customerId: string;
  onClose: () => void;
  onCollected?: (result?: any) => void;
  defaultAmount?: number;
}

const CollectPaymentModal = ({ loanId, customerId, onClose, onCollected, defaultAmount }: Props) => {
  const [amount, setAmount] = useState<number>(defaultAmount || 0);
  const [cash, setCash] = useState<number>(0);
  const [online, setOnline] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (amount <= 0) return toast.error('Enter a valid amount');
    if (Math.abs((cash || 0) + (online || 0) - amount) > 0.01) return toast.error('Cash + online must equal total amount');
    setLoading(true);
    try {
      const body = {
        loan_id: loanId,
        amount,
        cash_amount: cash,
        online_amount: online,
        payment_type: amount === (defaultAmount || 0) ? 'regular' : 'partial',
        payment_method: cash >= online ? 'cash' : 'mobile',
        payment_date: new Date().toISOString()
      } as any;

      // Call the centralized payment service
      const res = await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      toast.success(res.message || 'Payment recorded');
      onCollected && onCollected(res.data || res);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Collect Payment" onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">Cash</label>
            <input type="number" value={cash} onChange={e => setCash(Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Online</label>
            <input type="number" value={online} onChange={e => setOnline(Number(e.target.value))} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary">{loading ? 'Recording...' : 'Record Payment'}</button>
        </div>
      </div>
    </Modal>
  );
};

export default CollectPaymentModal;
