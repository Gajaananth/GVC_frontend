import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { formatLKR, formatDate } from '../utils/format';
import { Wallet, PiggyBank, AlertTriangle, Send, CalendarDays, Phone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const StaffCollections = () => {
  const { user } = useAuthStore();
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<'loan' | 'savings'>('loan');
  const [showCorrection, setShowCorrection] = useState<string | null>(null);
  const [correctionForm, setCorrectionForm] = useState({ letter: '', type: 'void' as 'void' | 'amend' });

  const { data: dailyDues } = useQuery({
    queryKey: ['daily-dues', collectionDate],
    queryFn: () => fetchApi(`/collections/daily-dues?date=${collectionDate}`),
  });

  const { data: loansData } = useQuery({
    queryKey: ['loans-active'],
    queryFn: () => fetchApi('/loans?status=active&limit=200'),
  });

  const { data: savingsData } = useQuery({
    queryKey: ['savings-active'],
    queryFn: () => fetchApi('/savings?limit=200'),
  });

  const { data: myData, refetch } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => fetchApi('/collections/my-submissions'),
  });

  const [loanForm, setLoanForm] = useState({
    loan_id: '',
    amount: '',
    cash_amount: '',
    online_amount: '',
    payment_type: 'regular',
    notes: '',
  });

  const [savingsForm, setSavingsForm] = useState({
    account_id: '',
    transaction_type: 'deposit',
    amount: '',
    cash_amount: '',
    online_amount: '',
    description: '',
  });

  const submitLoan = useMutation({
    mutationFn: () => {
      const amount = Number(loanForm.amount);
      return fetchApi('/collections/submit/payment', {
        method: 'POST',
        body: JSON.stringify({
          loan_id: loanForm.loan_id,
          amount,
          cash_amount: Number(loanForm.cash_amount),
          online_amount: Number(loanForm.online_amount),
          payment_type: loanForm.payment_type,
          notes: loanForm.notes || null,
        }),
      });
    },
    onSuccess: () => {
      toast.success('Due collection submitted — awaiting admin approval');
      setLoanForm({ loan_id: '', amount: '', cash_amount: '', online_amount: '', payment_type: 'regular', notes: '' });
      refetch();
    },
  });

  const submitSavings = useMutation({
    mutationFn: () => {
      const amount = Number(savingsForm.amount);
      return fetchApi('/collections/submit/savings', {
        method: 'POST',
        body: JSON.stringify({
          account_id: savingsForm.account_id,
          transaction_type: savingsForm.transaction_type,
          amount,
          cash_amount: Number(savingsForm.cash_amount),
          online_amount: Number(savingsForm.online_amount),
          description: savingsForm.description || null,
        }),
      });
    },
    onSuccess: () => {
      toast.success('Savings entry submitted — awaiting admin approval');
      setSavingsForm({ account_id: '', transaction_type: 'deposit', amount: '', cash_amount: '', online_amount: '', description: '' });
      refetch();
    },
  });

  const submitCorrection = useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: string; entityId: string }) =>
      fetchApi('/collections/corrections', {
        method: 'POST',
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          request_type: correctionForm.type,
          letter_description: correctionForm.letter,
        }),
      }),
    onSuccess: () => {
      toast.success('Correction request sent to owner');
      setShowCorrection(null);
      setCorrectionForm({ letter: '', type: 'void' });
    },
  });

  const activeLoans = (loansData?.data || []).filter((l: any) => l.approval_status === 'approved');
  const dues = dailyDues?.data;

  const pickDue = (item: any) => {
    setTab('loan');
    setLoanForm(f => ({
      ...f,
      loan_id: item.loan_id,
      amount: String(item.amount_due),
      cash_amount: String(item.amount_due),
      online_amount: '0',
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Daily Collections</h2>
        <p className="text-sm text-gray-500">
          Your customers and today&apos;s dues based on loan type (daily / weekly / 14-day / monthly). Collection entry date is locked to today.
        </p>
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-forest">
            <CalendarDays className="w-5 h-5" />
            Who to collect from — {user?.full_name}
          </h3>
          <input type="date" className="input-field w-auto" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} />
        </div>
        {dues && (
          <div className="mb-4 p-3 bg-leaf/10 rounded-xl flex flex-wrap gap-6 text-sm">
            <span><strong>{dues.total_customers}</strong> customers due</span>
            <span>Total to collect: <strong>{formatLKR(dues.total_amount_due)}</strong></span>
          </div>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(dues?.collections || []).length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No loan installments due on this date for your portfolio.</p>
          ) : (
            dues?.collections?.map((item: any) => (
              <div key={item.schedule_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="min-w-0">
                  <p className="font-medium">{item.customer?.full_name}</p>
                  <p className="text-xs text-gray-500">{item.loan_code} · {item.repayment_frequency} · Inst #{item.installment_number}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{item.customer?.phone}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-bold text-forest break-words">{formatLKR(item.amount_due)}</span>
                  <button type="button" onClick={() => pickDue(item)} className="text-xs px-3 py-1.5 bg-forest text-white rounded-lg">Collect</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('loan')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'loan' ? 'bg-forest text-white' : 'bg-gray-100'}`}>
          <Wallet className="w-4 h-4 inline mr-1" /> Loan Due
        </button>
        <button onClick={() => setTab('savings')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'savings' ? 'bg-forest text-white' : 'bg-gray-100'}`}>
          <PiggyBank className="w-4 h-4 inline mr-1" /> Savings
        </button>
      </div>

      <div className="glass-card p-6">
        {tab === 'loan' ? (
          <form onSubmit={e => { e.preventDefault(); submitLoan.mutate(); }} className="space-y-4 max-w-xl">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg">Collection date: <strong>{formatDate(new Date().toISOString())}</strong> (cannot be changed)</div>
            <div>
              <label className="text-sm font-medium">Loan *</label>
              <select required className="input-field" value={loanForm.loan_id} onChange={e => setLoanForm({ ...loanForm, loan_id: e.target.value })}>
                <option value="">Select loan</option>
                {activeLoans.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.loan_code} — {l.customers?.full_name} (Bal {formatLKR(l.remaining_balance)})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Total *</label>
                <input required type="number" className="input-field" value={loanForm.amount} onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Cash *</label>
                <input required type="number" className="input-field" value={loanForm.cash_amount} onChange={e => setLoanForm({ ...loanForm, cash_amount: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Online *</label>
                <input required type="number" className="input-field" value={loanForm.online_amount} onChange={e => setLoanForm({ ...loanForm, online_amount: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={submitLoan.isPending} className="w-full sm:w-auto px-4 py-2 bg-forest text-white rounded-xl flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Submit for Admin Approval
            </button>
          </form>
        ) : (
          <form onSubmit={e => { e.preventDefault(); submitSavings.mutate(); }} className="space-y-4 max-w-xl">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg">Transaction date: <strong>{formatDate(new Date().toISOString())}</strong> (locked)</div>
            <div>
              <label className="text-sm font-medium">Savings Account *</label>
              <select required className="input-field" value={savingsForm.account_id} onChange={e => setSavingsForm({ ...savingsForm, account_id: e.target.value })}>
                <option value="">Select account</option>
                {(savingsData?.data || []).filter((a: any) => a.is_active).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.account_code} — {a.customers?.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <select className="input-field" value={savingsForm.transaction_type} onChange={e => setSavingsForm({ ...savingsForm, transaction_type: e.target.value })}>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="text-sm font-medium">Total *</label><input required type="number" className="input-field" value={savingsForm.amount} onChange={e => setSavingsForm({ ...savingsForm, amount: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Cash *</label><input required type="number" className="input-field" value={savingsForm.cash_amount} onChange={e => setSavingsForm({ ...savingsForm, cash_amount: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Online *</label><input required type="number" className="input-field" value={savingsForm.online_amount} onChange={e => setSavingsForm({ ...savingsForm, online_amount: e.target.value })} /></div>
            </div>
            <button type="submit" disabled={submitSavings.isPending} className="w-full sm:w-auto px-4 py-2 bg-forest text-white rounded-xl flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Submit for Admin Approval
            </button>
          </form>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">My Submissions</h3>
        <div className="space-y-3 text-sm">
          {(myData?.data?.payments || []).map((p: any) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0">
                <p className="font-medium">{p.payment_code} — {p.customers?.full_name}</p>
                <p className="text-gray-500">{formatLKR(p.amount)} (Cash {formatLKR(p.cash_amount)} / Online {formatLKR(p.online_amount)}) · {formatDate(p.payment_date)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs capitalize ${p.approval_status === 'approved' ? 'bg-leaf/20 text-leaf' : p.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                  {p.approval_status?.replace('_', ' ')}
                </span>
                {['pending_admin', 'approved'].includes(p.approval_status) && (
                  <button onClick={() => setShowCorrection(`payment-${p.id}`)} className="text-xs text-red-600 underline">Report mistake</button>
                )}
              </div>
            </div>
          ))}
          {(myData?.data?.savings || []).map((s: any) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0">
                <p className="font-medium capitalize">{s.transaction_type} — {s.transaction_code}</p>
                <p className="text-gray-500">{formatLKR(s.amount)} · {formatDate(s.transaction_date)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs capitalize ${s.approval_status === 'approved' ? 'bg-leaf/20 text-leaf' : 'bg-amber-100 text-amber-800'}`}>
                  {s.approval_status?.replace('_', ' ')}
                </span>
                <button onClick={() => setShowCorrection(`savings-${s.id}`)} className="text-xs text-red-600 underline">Report mistake</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCorrection && (
        <div className="glass-card p-6 border-2 border-amber-200">
          <h3 className="font-semibold flex items-center gap-2 text-amber-800"><AlertTriangle className="w-5 h-5" /> Request Correction (Letter to Admin & Owner)</h3>
          <p className="text-xs text-gray-600 mt-1 mb-3">You cannot edit entries yourself. Describe the mistake. Owner must approve before admin corrects the amount/date.</p>
          <select className="input-field mb-3" value={correctionForm.type} onChange={e => setCorrectionForm({ ...correctionForm, type: e.target.value as 'void' | 'amend' })}>
            <option value="void">Wrong entry — void/remove</option>
            <option value="amend">Wrong amount — needs correction</option>
          </select>
          <textarea required className="input-field mb-3" rows={4} placeholder="Explain the mistake in detail (like a formal letter)..." value={correctionForm.letter} onChange={e => setCorrectionForm({ ...correctionForm, letter: e.target.value })} />
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={() => setShowCorrection(null)} className="px-4 py-2 text-gray-600">Cancel</button>
            <button
              type="button"
              onClick={() => {
                const [type, id] = showCorrection.split('-');
                const entityType = type === 'payment' ? 'loan_payment' : 'savings_transaction';
                submitCorrection.mutate({ entityType, entityId: id });
              }}
              disabled={correctionForm.letter.length < 10 || submitCorrection.isPending}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl"
            >
              Submit to Owner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffCollections;
