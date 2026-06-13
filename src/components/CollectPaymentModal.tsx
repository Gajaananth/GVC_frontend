import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { fetchApi } from '../services/api';
import toast from 'react-hot-toast';
import { formatLKR } from '../utils/format';

export type PaymentMode = 'direct' | 'queue';

export interface QueuePaymentItem {
  id: string;
  loanId: string;
  customerId: string;
  loanCode?: string;
  customerName?: string;
  amount: number;
  cashAmount: number;
  onlineAmount: number;
  paymentType: 'regular' | 'partial' | 'advance' | 'full_settlement';
  notes?: string;
}

interface Props {
  loanId: string;
  customerId: string;
  loanCode?: string;
  customerName?: string;
  onClose: () => void;
  onCollected?: (result?: any) => void;
  onQueueAdd?: (item: QueuePaymentItem) => void;
  defaultAmount?: number;
  initialData?: Partial<QueuePaymentItem>;
  mode?: PaymentMode;
}

const CollectPaymentModal = ({
  loanId,
  customerId,
  loanCode,
  customerName,
  onClose,
  onCollected,
  onQueueAdd,
  defaultAmount,
  initialData,
  mode = 'direct'
}: Props) => {
  const [amount, setAmount] = useState<number>(initialData?.amount ?? defaultAmount ?? 0);
  const [cash, setCash] = useState<number>(initialData?.cashAmount ?? 0);
  const [online, setOnline] = useState<number>(initialData?.onlineAmount ?? 0);
  const [paymentType, setPaymentType] = useState<'regular' | 'partial' | 'advance' | 'full_settlement'>(initialData?.paymentType ?? 'regular');
  const [notes, setNotes] = useState<string>(initialData?.notes ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAmount(initialData?.amount ?? defaultAmount ?? 0);
    setCash(initialData?.cashAmount ?? 0);
    setOnline(initialData?.onlineAmount ?? 0);
    setPaymentType(initialData?.paymentType ?? 'regular');
    setNotes(initialData?.notes ?? '');
  }, [defaultAmount, initialData]);

  const submit = async () => {
    if (amount <= 0) return toast.error('Enter a valid amount');
    if (defaultAmount !== undefined && amount > defaultAmount) {
      return toast.error(`Amount cannot exceed ${formatLKR(defaultAmount)}`);
    }
    if (Math.abs((cash || 0) + (online || 0) - amount) > 0.01) return toast.error('Cash + online must equal total amount');
    setLoading(true);

    const payload = {
      id: initialData?.id || String(Date.now()),
      loanId,
      customerId,
      loanCode,
      customerName,
      amount,
      cashAmount: cash,
      onlineAmount: online,
      paymentType,
      notes: notes || undefined
    } as QueuePaymentItem;

    if (mode === 'queue' && onQueueAdd) {
      onQueueAdd(payload);
      toast.success(initialData?.id ? 'Updated queued payment' : 'Added payment to queue');
      onClose();
      setLoading(false);
      return;
    }

    try {
      const body = {
        loan_id: loanId,
        amount,
        cash_amount: cash,
        online_amount: online,
        payment_type: paymentType,
        payment_method: cash >= online ? 'cash' : 'mobile',
        reference_number: undefined,
        notes: notes || null,
        payment_date: new Date().toISOString()
      } as any;

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

  const actionLabel = mode === 'queue' ? (initialData?.id ? 'Update Queue' : 'Add to queue') : 'Record Payment';
  const title = mode === 'queue' ? 'Queue Payment' : 'Collect Payment';

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="input-field" />
          {defaultAmount !== undefined && (
            <p className="text-xs text-gray-500 mt-1">Maximum allowed amount is {formatLKR(defaultAmount)}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600">Payment Type</label>
            <select value={paymentType} onChange={e => setPaymentType(e.target.value as any)} className="input-field">
              <option value="regular">Regular</option>
              <option value="partial">Partial</option>
              <option value="advance">Advance</option>
              <option value="full_settlement">Full Settlement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Cash</label>
            <input type="number" value={cash} onChange={e => setCash(Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Online</label>
            <input type="number" value={online} onChange={e => setOnline(Number(e.target.value))} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field" rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary">{loading ? `${actionLabel}...` : actionLabel}</button>
        </div>
      </div>
    </Modal>
  );
};

export default CollectPaymentModal;
