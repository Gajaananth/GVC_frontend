import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import { formatLKR } from '../../utils/format';
import { getTermConfig, type RepaymentFrequency } from '../../utils/loanTermConfig';
import toast from 'react-hot-toast';
import { Calculator, Upload, FileCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const LoanFormModal = ({ onClose }: Props) => {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<any>(null);
  const [applicationPdf, setApplicationPdf] = useState<File | null>(null);

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => fetchApi('/customers?limit=500&status=active'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: usersData } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => fetchApi('/users'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const staffUsers = (usersData?.data || []).filter((u: any) => u.is_active && ['staff', 'admin'].includes(u.role));

  const [form, setForm] = useState({
    customer_id: '',
    gross_loan_amount: '',
    insurance_fee_percent: '5',
    insurance_fee_amount: '0',
    documentation_fee: '2000',
    interest_rate_per_period: '2.5',
    term_count: '90',
    repayment_frequency: 'daily' as RepaymentFrequency,
    credit_date: new Date().toISOString().slice(0, 10),
    applied_by: '',
    in_charge_user_id: '',
    purpose: '',
    notes: '',
  });

  const termCfg = useMemo(
    () => getTermConfig(form.repayment_frequency),
    [form.repayment_frequency]
  );

  useEffect(() => {
    const cfg = getTermConfig(form.repayment_frequency);
    setForm(f => ({ ...f, term_count: String(cfg.default) }));
    setPreview(null);
  }, [form.repayment_frequency]);

  const clampTerm = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return termCfg.min;
    return Math.min(termCfg.max, Math.max(termCfg.min, n));
  };

  const calcMutation = useMutation({
    mutationFn: () =>
      fetchApi('/loans/calculate', {
        method: 'POST',
        body: JSON.stringify({
          gross_loan_amount: Number(form.gross_loan_amount),
          insurance_fee_percent: Number(form.insurance_fee_percent),
          insurance_fee_amount: Number(form.insurance_fee_amount),
          documentation_fee: Number(form.documentation_fee),
          interest_rate_per_period: Number(form.interest_rate_per_period),
          term_count: clampTerm(form.term_count),
          repayment_frequency: form.repayment_frequency,
          credit_date: form.credit_date,
        }),
      }),
    onSuccess: (res) => setPreview(res.data),
  });

  useEffect(() => {
    if (form.gross_loan_amount && Number(form.gross_loan_amount) > 0) {
      const t = setTimeout(() => calcMutation.mutate(), 400);
      return () => clearTimeout(t);
    }
  }, [
    form.gross_loan_amount,
    form.insurance_fee_percent,
    form.insurance_fee_amount,
    form.documentation_fee,
    form.interest_rate_per_period,
    form.term_count,
    form.repayment_frequency,
    form.credit_date,
  ]);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('customer_id', form.customer_id);
      formData.append('gross_loan_amount', String(Number(form.gross_loan_amount)));
      formData.append('insurance_fee_percent', String(Number(form.insurance_fee_percent)));
      formData.append('insurance_fee_amount', String(Number(form.insurance_fee_amount)));
      formData.append('documentation_fee', String(Number(form.documentation_fee)));
      formData.append('interest_rate_per_period', String(Number(form.interest_rate_per_period)));
      formData.append('term_count', String(clampTerm(form.term_count)));
      formData.append('repayment_frequency', form.repayment_frequency);
      formData.append('credit_date', form.credit_date);
      formData.append('applied_by', form.applied_by);
      formData.append('in_charge_user_id', form.in_charge_user_id);
      if (form.purpose) formData.append('purpose', form.purpose);
      if (form.notes) formData.append('notes', form.notes);
      if (applicationPdf) formData.append('loan_application_pdf', applicationPdf);

      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/loans`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create loan');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Loan submitted for owner approval');
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) {
      toast.error('Wait for loan calculation preview');
      return;
    }
    if (!applicationPdf) {
      toast.error('Please upload the loan application PDF');
      return;
    }
    mutation.mutate();
  };

  const setStaffBoth = (id: string) => {
    setForm(f => ({ ...f, applied_by: id, in_charge_user_id: id }));
  };

  const termNum = clampTerm(form.term_count);

  return (
    <Modal title="New Loan Application" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">
          Choose collection type and loan length in <strong>days / weeks / 14-day periods / months</strong>.
          Schedule is built from credit date. Owner approves before the loan goes live.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Customer *</label>
            <select required className="input-field" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select customer</option>
              {(customersData?.data || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.full_name} — {c.customer_code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Credit Date (cash to customer) *</label>
            <input required type="date" className="input-field" value={form.credit_date} onChange={e => setForm({ ...form, credit_date: e.target.value })} />
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
          <h4 className="font-semibold text-gray-800 mb-3">Loan Amount & Fees</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium">Gross Loan (LKR) *</label>
              <input required type="number" min="1" className="input-field" placeholder="100000" value={form.gross_loan_amount} onChange={e => setForm({ ...form, gross_loan_amount: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Insurance %</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.insurance_fee_percent} onChange={e => setForm({ ...form, insurance_fee_percent: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Insurance Fixed (LKR)</label>
              <input type="number" min="0" className="input-field" value={form.insurance_fee_amount} onChange={e => setForm({ ...form, insurance_fee_amount: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Documentation Fee</label>
              <input type="number" min="0" className="input-field" value={form.documentation_fee} onChange={e => setForm({ ...form, documentation_fee: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="border border-forest/20 rounded-xl p-4 bg-white">
          <h4 className="font-semibold text-gray-800 mb-3">Collection Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Collection Type *</label>
              <select
                className="input-field"
                value={form.repayment_frequency}
                onChange={e => setForm({ ...form, repayment_frequency: e.target.value as RepaymentFrequency })}
              >
                <option value="daily">Daily loan</option>
                <option value="weekly">Weekly loan</option>
                <option value="biweekly">14-day loan</option>
                <option value="monthly">Monthly loan</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">{termCfg.collectionHint}</p>
            </div>
            <div>
              <label className="text-sm font-medium">
                Loan term ({termCfg.min}–{termCfg.max} {termCfg.unitLabelPlural}) *
              </label>
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="range"
                  min={termCfg.min}
                  max={termCfg.max}
                  value={termNum}
                  onChange={e => setForm({ ...form, term_count: e.target.value })}
                  className="flex-1 accent-forest"
                />
                <input
                  type="number"
                  min={termCfg.min}
                  max={termCfg.max}
                  required
                  className="input-field"
                  value={form.term_count}
                  onChange={e => setForm({ ...form, term_count: e.target.value })}
                />
              </div>
              <p className="text-xs text-forest font-medium mt-1">
                {termNum} {termNum === 1 ? termCfg.unitLabel : termCfg.unitLabelPlural} = {termNum} collections
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {termCfg.presets.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, term_count: String(p) })}
                    className={`px-2 py-1 text-xs rounded-lg border ${termNum === p ? 'bg-forest text-white border-forest' : 'bg-gray-50 border-gray-200 hover:border-forest'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium">
              Interest Rate (% per month) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              value={form.interest_rate_per_period}
              onChange={e => setForm({ ...form, interest_rate_per_period: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">{termCfg.interestRateHint}</p>
          </div>
        </div>

        {preview && (
          <div className="bg-forest/5 border border-forest/20 rounded-xl p-4">
            <h4 className="font-semibold text-forest flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5" /> Calculator Preview
            </h4>
            <p className="text-sm text-gray-700 mb-3 font-medium">{preview.termSummary} · {preview.totalDurationDays} calendar days</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-500">Gross Loan</span><p className="font-bold">{formatLKR(preview.grossLoanAmount)}</p></div>
              <div><span className="text-gray-500">Total Fees</span><p className="font-bold text-red-600">−{formatLKR(preview.totalFees)}</p></div>
              <div><span className="text-gray-500">Net to Customer</span><p className="font-bold text-leaf">{formatLKR(preview.netDisbursement)}</p></div>
              <div><span className="text-gray-500">Per Collection</span><p className="font-bold">{formatLKR(preview.installmentAmount)}</p></div>
              <div><span className="text-gray-500">Total Interest</span><p>{formatLKR(preview.totalInterest)}</p></div>
              <div><span className="text-gray-500">Total Repayable</span><p className="font-bold">{formatLKR(preview.totalPayable)}</p></div>
              <div><span className="text-gray-500">First Collection</span><p>{preview.firstCollectionDate}</p></div>
              <div><span className="text-gray-500">Final Due</span><p>{preview.endDate}</p></div>
            </div>
            {preview.schedule?.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-forest cursor-pointer">
                  Full schedule ({preview.schedule.length} due dates)
                </summary>
                <div className="max-h-40 overflow-y-auto mt-2 text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left p-1">#</th>
                        <th className="text-left p-1">Due date</th>
                        <th className="text-right p-1">Principal</th>
                        <th className="text-right p-1">Interest</th>
                        <th className="text-right p-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.schedule.map((s: any) => (
                        <tr key={s.installmentNumber} className="border-t border-gray-100">
                          <td className="p-1">{s.installmentNumber}</td>
                          <td className="p-1">{s.dueDate}</td>
                          <td className="p-1 text-right">{formatLKR(s.principalAmount)}</td>
                          <td className="p-1 text-right">{formatLKR(s.interestAmount)}</td>
                          <td className="p-1 text-right font-medium">{formatLKR(s.installmentAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}

        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Loan Application Document *
          </h4>
          <p className="text-xs text-gray-500 mb-3">Upload the scanned PDF of the physical loan application form. This is required before submission.</p>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {applicationPdf ? 'Change PDF' : 'Select PDF'}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.type !== 'application/pdf') {
                    toast.error('Only PDF files are allowed');
                    return;
                  }
                  if (file && file.size > 10 * 1024 * 1024) {
                    toast.error('File must be under 10MB');
                    return;
                  }
                  setApplicationPdf(file);
                }}
              />
            </label>
            {applicationPdf && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                <FileCheck className="w-4 h-4" />
                <span className="font-medium truncate">{applicationPdf.name}</span>
                <span className="text-xs text-gray-400">({(applicationPdf.size / 1024).toFixed(0)} KB)</span>
                <button type="button" onClick={() => setApplicationPdf(null)} className="text-red-400 hover:text-red-600 ml-1 text-xs">✕</button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="text-sm font-medium">Staff Who Applied *</label>
            <select required className="input-field" value={form.applied_by} onChange={e => setForm({ ...form, applied_by: e.target.value })}>
              <option value="">Select staff</option>
              {staffUsers.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Staff In Charge *</label>
            <select required className="input-field" value={form.in_charge_user_id} onChange={e => setForm({ ...form, in_charge_user_id: e.target.value })}>
              <option value="">Select staff</option>
              {staffUsers.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
        </div>
        {staffUsers.length > 0 && (
          <button type="button" className="text-xs text-forest underline" onClick={() => setStaffBoth(staffUsers[0].id)}>
            Same staff for applied & in-charge
          </button>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !preview || !applicationPdf} className="px-4 py-2 bg-forest text-white rounded-xl hover:bg-leaf disabled:opacity-50">
            {mutation.isPending ? 'Submitting...' : 'Submit for Owner Approval'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LoanFormModal;
