import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { formatLKR, formatDate } from '../utils/format';
import {
  Search, ShoppingCart, Trash2, Send, Download, FileSpreadsheet,
  FileText, CheckCircle, XCircle, Wallet, ChevronDown, ChevronUp,
  Info, AlertTriangle, PlusCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ─── types ────────────────────────────────────────────────────────
interface QueueItem {
  id: string; // temp uuid
  loan_id: string;
  loan_code: string;
  customer_name: string;
  customer_code: string;
  remaining_balance: number;
  amount: number;
  cash_amount: number;
  online_amount: number;
  payment_type: 'regular' | 'partial' | 'full_settlement' | 'advance';
  notes: string;
}

interface SubmitResult {
  payment_code?: string;
  loan_id?: string;
  loan_code?: string;
  customer_name?: string;
  amount?: number;
  cash_amount?: number;
  online_amount?: number;
  payment_date?: string;
  error?: string | null;
}

// ─── helpers ──────────────────────────────────────────────────────
function tempId() {
  return Math.random().toString(36).slice(2);
}

// ─── PDF download (client‑side via pdfmake style — uses the reports export endpoint) ──
async function downloadCollectionFile(
  format: 'pdf' | 'excel',
  results: SubmitResult[],
  summary: any,
  accessToken: string
) {
  // We encode the results into query params and hit a dedicated export endpoint.
  // Since the data is already on the client, we build the file client‑side for xlsx
  // and use the backend for PDF (reuse existing infrastructure).
  if (format === 'excel') {
    // Dynamic import of sheetjs (already likely in node_modules via exceljs on backend)
    // Since we're in the browser, use a simple CSV approach that opens as Excel
    const headers = ['Receipt', 'Date', 'Loan Code', 'Customer', 'Amount (LKR)', 'Cash', 'Online', 'Type', 'Status'];
    const rows = results.map(r => [
      r.payment_code || '',
      r.payment_date || summary.collection_date,
      r.loan_code || '',
      r.customer_name || '',
      r.amount ?? '',
      r.cash_amount ?? '',
      r.online_amount ?? '',
      '',
      r.error ? 'FAILED' : 'OK',
    ]);
    // totals row
    rows.push(['', '', '', 'TOTAL', summary.total_collected, summary.total_cash, summary.total_online, '', '']);

    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-${summary.collection_date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  // PDF: use the backend export
  const url = `${API_URL}/reports/daily_collection/export/pdf?start_date=${summary.collection_date}&end_date=${summary.collection_date}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    toast.error('Failed to download PDF');
    return;
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `collection-${summary.collection_date}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

// ─── component ────────────────────────────────────────────────────
const OwnerCollections = () => {
  const { accessToken } = useAuthStore();
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<{ summary: any; results: SubmitResult[] } | null>(null);
  const [showQueue, setShowQueue] = useState(true);

  // ── Add-item form (per loan selected) ──
  const [addForm, setAddForm] = useState({
    loan_id: '',
    amount: '',
    cash_amount: '',
    online_amount: '',
    payment_type: 'regular' as QueueItem['payment_type'],
    notes: '',
  });

  // ── Search / load loans ──
  const { data: loansData } = useQuery({
    queryKey: ['owner-loans-active'],
    queryFn: () => fetchApi('/loans?status=active&limit=2000'),
  });

  const activeLoans: any[] = (loansData?.data || []).filter(
    (l: any) => l.approval_status === 'approved' && !l.is_fully_paid
  );

  const filteredLoans = activeLoans.filter((l: any) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      l.loan_code?.toLowerCase().includes(t) ||
      l.customers?.full_name?.toLowerCase().includes(t) ||
      l.customers?.nic_number?.toLowerCase().includes(t) ||
      l.customers?.phone?.toLowerCase().includes(t) ||
      l.customers?.customer_code?.toLowerCase().includes(t)
    );
  });

  // Loan detail query for selected loan
  const selectedLoanQuery = useQuery({
    queryKey: ['loan-detail-owner', addForm.loan_id],
    queryFn: () => fetchApi(`/loans/${addForm.loan_id}`),
    enabled: !!addForm.loan_id,
    staleTime: 30_000,
  });
  const selectedLoan = selectedLoanQuery.data?.data;
  const remaining = Number(selectedLoan?.remaining_balance ?? 0);
  const overdue = selectedLoan?.schedule?.reduce((s: number, item: any) => {
    if (item.status !== 'overdue') return s;
    return s + Math.max(0, Number(item.installment_amount) - Number(item.paid_amount || 0));
  }, 0) ?? 0;

  // Pick a loan from the table
  const pickLoan = useCallback((loan: any) => {
    setAddForm(f => ({
      ...f,
      loan_id: loan.id,
      amount: String(loan.installment_amount || ''),
      cash_amount: String(loan.installment_amount || ''),
      online_amount: '0',
      payment_type: 'regular',
    }));
    setEditingId(null);
  }, []);

  // Add to queue
  const addToQueue = () => {
    if (!addForm.loan_id) { toast.error('Select a loan first'); return; }
    const amount = Number(addForm.amount);
    const cash = Number(addForm.cash_amount);
    const online = Number(addForm.online_amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (Math.abs(cash + online - amount) > 0.01) { toast.error('Cash + Online must equal total amount'); return; }
    if (amount > remaining + 1) { toast.error('Amount exceeds remaining balance'); return; }

    const loan = activeLoans.find(l => l.id === addForm.loan_id);
    if (!loan) return;

    const item: QueueItem = {
      id: tempId(),
      loan_id: loan.id,
      loan_code: loan.loan_code,
      customer_name: loan.customers?.full_name || '',
      customer_code: loan.customers?.customer_code || '',
      remaining_balance: Number(loan.remaining_balance),
      amount,
      cash_amount: cash,
      online_amount: online,
      payment_type: addForm.payment_type,
      notes: addForm.notes,
    };

    setQueue(q => [...q, item]);
    toast.success(`${loan.customers?.full_name} added to queue`);
    setAddForm({ loan_id: '', amount: '', cash_amount: '', online_amount: '', payment_type: 'regular', notes: '' });
    setSearch('');
  };

  const removeFromQueue = (id: string) => setQueue(q => q.filter(i => i.id !== id));

  // ── totals ──
  const totalAmount = queue.reduce((s, i) => s + i.amount, 0);
  const totalCash = queue.reduce((s, i) => s + i.cash_amount, 0);
  const totalOnline = queue.reduce((s, i) => s + i.online_amount, 0);

  // ── Submit ──
  const submitMutation = useMutation({
    mutationFn: () =>
      fetchApi('/collections/owner-batch-submit', {
        method: 'POST',
        body: JSON.stringify(
          queue.map(i => ({
            loan_id: i.loan_id,
            amount: i.amount,
            cash_amount: i.cash_amount,
            online_amount: i.online_amount,
            payment_type: i.payment_type,
            notes: i.notes || null,
          }))
        ),
      }),
    onSuccess: async (res: any) => {
      const { data } = res;
      setLastResults({ summary: data.summary, results: data.results });
      setQueue([]);
      toast.success(res.message || 'Collections submitted!');

      // Auto-download both
      try {
        await downloadCollectionFile('pdf', data.results, data.summary, accessToken || '');
        await downloadCollectionFile('excel', data.results, data.summary, accessToken || '');
      } catch {
        toast.error('Downloads failed — check Reports page');
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Submission failed');
    },
  });

  const handleSubmit = () => {
    if (queue.length === 0) { toast.error('Queue is empty'); return; }
    submitMutation.mutate();
  };

  // ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Owner Collections</h2>
        <p className="text-sm text-gray-500 mt-1">
          Search any customer, add dues to the queue, then submit all at once. PDF + Excel will auto-download on submit.
        </p>
      </div>

      {/* ─── Search + Loan Table ─── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Search by name, NIC, phone, loan code, customer code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {search && (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredLoans.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No active loans found</p>
            ) : (
              filteredLoans.slice(0, 30).map((loan: any) => {
                const alreadyInQueue = queue.some(q => q.loan_id === loan.id);
                return (
                  <div
                    key={loan.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border transition-all ${
                      addForm.loan_id === loan.id
                        ? 'bg-forest/5 border-forest/40'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{loan.customers?.full_name}</p>
                      <p className="text-xs text-gray-500">{loan.loan_code} · {loan.repayment_frequency} · Bal {formatLKR(loan.remaining_balance)}</p>
                      <p className="text-xs text-gray-400">{loan.customers?.phone} · {loan.customers?.nic_number}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {alreadyInQueue && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">In queue</span>
                      )}
                      <button
                        type="button"
                        onClick={() => pickLoan(loan)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Select
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ─── Add-to-queue form (shows after picking a loan) ─── */}
      {addForm.loan_id && selectedLoan && (
        <div className="glass-card p-6 border-2 border-forest/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-forest flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {selectedLoan.customers?.full_name} — {selectedLoan.loan_code}
            </h3>
            <button type="button" onClick={() => setAddForm(f => ({ ...f, loan_id: '' }))} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
          </div>

          {/* Loan info strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-3 text-sm">
            <div><p className="text-gray-400 text-xs">Total Payable</p><p className="font-semibold">{formatLKR(selectedLoan.total_payable)}</p></div>
            <div><p className="text-gray-400 text-xs">Remaining</p><p className="font-semibold text-forest">{formatLKR(remaining)}</p></div>
            <div><p className="text-gray-400 text-xs">Overdue Amt</p><p className={`font-semibold ${overdue > 0 ? 'text-red-600' : 'text-gray-700'}`}>{formatLKR(overdue)}</p></div>
            <div><p className="text-gray-400 text-xs">Installment</p><p className="font-semibold">{formatLKR(selectedLoan.installment_amount)}</p></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Payment Type</label>
              <select
                className="input-field"
                value={addForm.payment_type}
                onChange={e => {
                  const v = e.target.value as QueueItem['payment_type'];
                  setAddForm(f => ({
                    ...f,
                    payment_type: v,
                    amount: v === 'full_settlement' ? String(remaining) : f.amount,
                    cash_amount: v === 'full_settlement' ? String(remaining) : f.cash_amount,
                    online_amount: '0',
                  }));
                }}
              >
                <option value="regular">Regular</option>
                <option value="partial">Partial</option>
                <option value="advance">Advance</option>
                <option value="full_settlement">Full Settlement</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Total Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={remaining}
                className="input-field"
                value={addForm.amount}
                onChange={e => {
                  const val = e.target.value;
                  setAddForm(f => ({ ...f, amount: val, cash_amount: val, online_amount: '0' }));
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Cash</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={addForm.cash_amount}
                onChange={e => {
                  const val = e.target.value;
                  setAddForm(f => ({ ...f, cash_amount: val, online_amount: String(Math.max(0, Number(f.amount) - Number(val))) }));
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Online</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={addForm.online_amount}
                onChange={e => {
                  const val = e.target.value;
                  setAddForm(f => ({ ...f, online_amount: val, cash_amount: String(Math.max(0, Number(f.amount) - Number(val))) }));
                }}
              />
            </div>
          </div>

          {Math.abs(Number(addForm.cash_amount) + Number(addForm.online_amount) - Number(addForm.amount)) > 0.01 && addForm.amount && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Cash + Online must equal total amount
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addToQueue}
              className="flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-xl hover:bg-forest/90 transition-colors font-medium"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Queue
            </button>
          </div>
        </div>
      )}

      {/* ─── Collection Queue ─── */}
      <div className="glass-card p-6 space-y-4">
        <button
          type="button"
          onClick={() => setShowQueue(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-forest" />
            Collection Queue
            {queue.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-forest text-white text-xs rounded-full">{queue.length}</span>
            )}
          </h3>
          {showQueue ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showQueue && (
          <>
            {queue.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No items in queue yet. Search a customer above to add.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((item, idx) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-forest/10 text-forest text-xs flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.customer_name}</p>
                        <p className="text-xs text-gray-500">{item.loan_code} · <span className="capitalize">{item.payment_type.replace('_', ' ')}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <p className="font-bold text-forest">{formatLKR(item.amount)}</p>
                        <p className="text-xs text-gray-400">Cash {formatLKR(item.cash_amount)} / Online {formatLKR(item.online_amount)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromQueue(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {queue.length > 0 && (
              <div className="bg-gradient-to-r from-forest/5 to-leaf/5 rounded-xl p-4 border border-forest/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Collection</p>
                    <p className="text-xl font-bold text-forest">{formatLKR(totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Cash</p>
                    <p className="text-lg font-semibold text-gray-700">{formatLKR(totalCash)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Online</p>
                    <p className="text-lg font-semibold text-gray-700">{formatLKR(totalOnline)}</p>
                  </div>
                </div>
                <div className="mt-3 text-center text-xs text-gray-400">
                  {queue.length} customer{queue.length !== 1 ? 's' : ''} · PDF + Excel will auto-download on submit
                </div>
              </div>
            )}

            {/* Submit button */}
            {queue.length > 0 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-forest to-leaf text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
              >
                {submitMutation.isPending ? (
                  <>Processing…</>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit All {queue.length} Collection{queue.length !== 1 ? 's' : ''} — {formatLKR(totalAmount)}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* ─── Last submission results ─── */}
      {lastResults && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-leaf" />
              Last Submission Results — {formatDate(lastResults.summary.collection_date)}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadCollectionFile('pdf', lastResults.results, lastResults.summary, accessToken || '')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button
                type="button"
                onClick={() => downloadCollectionFile('excel', lastResults.results, lastResults.summary, accessToken || '')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel / CSV
              </button>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-leaf/10 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs">Total Collected</p>
              <p className="font-bold text-forest text-lg">{formatLKR(lastResults.summary.total_collected)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs">Cash</p>
              <p className="font-bold text-gray-700">{formatLKR(lastResults.summary.total_cash)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs">Online</p>
              <p className="font-bold text-gray-700">{formatLKR(lastResults.summary.total_online)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs">Success / Total</p>
              <p className="font-bold text-gray-700">{lastResults.summary.total_success} / {lastResults.summary.total_items}</p>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {lastResults.results.map((r, i) => (
              <div key={i} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg text-sm ${r.error ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                <div>
                  {r.error ? (
                    <p className="text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> {r.loan_code || r.loan_id} — {r.error}</p>
                  ) : (
                    <>
                      <p className="font-medium">{r.payment_code} — {r.customer_name}</p>
                      <p className="text-gray-500 text-xs">{r.loan_code} · {formatDate(r.payment_date || '')}</p>
                    </>
                  )}
                </div>
                {!r.error && (
                  <p className="font-bold text-forest shrink-0">{formatLKR(r.amount ?? 0)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerCollections;
