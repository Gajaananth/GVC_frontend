import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { useCompleteLoanData, useLoanUpdateListener } from '../../hooks/useLoanSync';
import Modal from '../Modal';
import { usePermissions } from '../../hooks/usePermissions';
import { Upload, FileText, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import CollectPaymentModal from '../CollectPaymentModal';
import { formatLKR } from '../../utils/format';

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
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);

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

  const { data: selectedLoanData, isLoading: loanLoading } = useCompleteLoanData(selectedLoanId);

  // Fallback to the loan summary included on the customer payload if the detailed loan data isn't loaded yet
  const selectedLoanMeta = data?.data?.loans?.find((l: any) => l.id === selectedLoanId) ?? null;
  const selectedLoan = selectedLoanData?.loan ?? selectedLoanMeta;
  const selectedLoanPayments = selectedLoanData?.payments || [];
  const selectedLoanSchedule = selectedLoanData?.schedule || [] as any[];
  const selectedLoanRemainingBalance = selectedLoanMeta?.remaining_balance ?? (selectedLoanSchedule.length > 0 ? selectedLoanSchedule[selectedLoanSchedule.length - 1]?.remaining_balance ?? 0 : 0);
  const selectedLoanNextDueDate = selectedLoanSchedule.find((row: any) => ['pending', 'partial', 'overdue'].includes(row.status))?.due_date || selectedLoanMeta?.next_due_date;
  const selectedLoanInstallmentAmount = selectedLoanMeta?.installment_amount ?? selectedLoanSchedule[0]?.installment_amount ?? 0;
  const selectedLoanTotalPayable = selectedLoanMeta?.total_payable ?? selectedLoanSchedule.reduce((sum, row: any) => sum + (row.installment_amount || 0), 0);

  // Listen for external loan updates to keep UI fresh
  const { emitLoanUpdate } = useLoanUpdateListener();

  const customer = data?.data;
  const today = new Date().toISOString().slice(0, 10);
  const isDueToday = selectedLoanSchedule.some((row: any) =>
    row.due_date === today && ['pending', 'partial', 'overdue'].includes(row.status)
  );

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
            <div className="space-y-3">
              {customer.loans.map((l: any) => (
                <div key={l.id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{l.loan_code}</p>
                      <p className="text-sm text-gray-500">Next due: {l.next_due_date || 'N/A'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">Balance: {formatLKR(l.remaining_balance)}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700">Status: {l.status}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLoanId(l.id);
                      }}
                      className="bg-forest hover:bg-leaf text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      View Loan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedLoan && (
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Selected Loan</p>
                  <p className="font-semibold text-gray-900">{selectedLoan.loan_code}</p>
                </div>
                {isDueToday ? (
                  <button
                    onClick={() => setShowCollectModal(true)}
                    className="bg-forest hover:bg-leaf text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Collect Payment
                  </button>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-500">
                    Payment entry only allowed for today's due installment
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Loan Summary</p>
                  <p>Principal: {formatLKR(selectedLoan.principal_amount)}</p>
                  <p>Total Payable: {formatLKR(selectedLoanTotalPayable)}</p>
                  <p>Remaining Balance: {formatLKR(selectedLoanRemainingBalance)}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Schedule</p>
                  <p>Installment Amount: {formatLKR(selectedLoanInstallmentAmount)}</p>
                  <p>Next Due: {selectedLoanNextDueDate || 'N/A'}</p>
                  <p>Status: {selectedLoan.status}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
                <h5 className="font-semibold text-gray-800 mb-3">Collection History</h5>
                {selectedLoanPayments.length > 0 ? (
                  <div className="space-y-3 text-sm">
                    {selectedLoanPayments.map((payment: any) => (
                      <div key={payment.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex justify-between gap-3 items-center">
                          <span className="font-medium text-gray-900">{payment.payment_code}</span>
                          <span className="text-sm text-gray-500">{payment.payment_date}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                          <div>Amount: {formatLKR(payment.amount)}</div>
                          <div>Type: {payment.payment_type}</div>
                          <div>Method: {payment.payment_method}</div>
                          <div>Cash: {formatLKR(payment.cash_amount || 0)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No payments recorded yet for this loan.</p>
                )}
              </div>

              <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm overflow-x-auto">
                <h5 className="font-semibold text-gray-800 mb-3">Due Schedule</h5>
                {selectedLoanSchedule.length > 0 ? (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoanSchedule.map((row: any) => (
                        <tr key={row.installment_number} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-700">{row.installment_number}</td>
                          <td className="py-2 px-3 text-gray-700">{row.due_date}</td>
                          <td className="py-2 px-3 text-gray-700">{formatLKR(row.installment_amount)}</td>
                          <td className="py-2 px-3 text-gray-700 capitalize">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm">No loan schedule available.</p>
                )}
              </div>
            </div>
          </div>
        )}
        {showCollectModal && selectedLoan && isDueToday && (
          <CollectPaymentModal
            loanId={selectedLoan.id}
            customerId={customer.id}
            defaultAmount={selectedLoanRemainingBalance}
            onClose={() => setShowCollectModal(false)}
            onCollected={() => {
              queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
              queryClient.invalidateQueries({ queryKey: ['loan', selectedLoan.id] });
              setShowCollectModal(false);
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default CustomerDetailModal;
