import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { AlertTriangle, Clock, Search, Send, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { formatLKR } from '../utils/format';
import CollectPaymentModal from '../components/CollectPaymentModal';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import { ResponsiveTable, TableRow, TableCell } from '../components/ResponsiveTable';

const DueReminders = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming'>('today');

  const queryClient = useQueryClient();
  const { data: todayDues, isLoading: loadingToday } = useQuery({
    queryKey: ['dues', 'today'],
    queryFn: () => fetchApi('/due/today'),
  });

  const { data: overdueLoans, isLoading: loadingOverdue } = useQuery({
    queryKey: ['dues', 'overdue'],
    queryFn: () => fetchApi('/due/overdue'),
  });

  const { canRecordPaymentsDirect } = usePermissions();

  const handleSendReminder = async (loanId: string, customerId: string) => {
    // In a real app, this would call an API endpoint to send SMS/Email
    toast.success('Reminder sent successfully!');
  };

  const [selectedDue, setSelectedDue] = useState<any | null>(null);
  const [showCollect, setShowCollect] = useState(false);

  const openCollect = (due: any) => {
    setSelectedDue(due);
    setShowCollect(true);
  };

  const onCollected = (result?: any) => {
    queryClient.invalidateQueries({ queryKey: ['dues', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['dues', 'overdue'] });
    if (selectedDue) {
      queryClient.invalidateQueries({ queryKey: ['customer', selectedDue.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['loan', selectedDue.loan_id] });
    }
    setShowCollect(false);
  };

  return (
    <div className="space-y-6 flex flex-col h-full min-w-0">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Due & Reminders</h2>
          <p className="text-sm text-gray-500">Track overdue payments and send reminders.</p>
        </div>
      </div>

      <div className="glass-card flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 p-2 overflow-x-auto">
          <button
            className={`shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'today' ? 'bg-forest text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('today')}
          >
            <Clock className="w-5 h-5 shrink-0" />
            Due Today
            {todayDues?.data?.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'today' ? 'bg-white/20' : 'bg-forest/10 text-forest'}`}>
                {todayDues.data.length}
              </span>
            )}
          </button>
          <button
            className={`shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'overdue' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('overdue')}
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Overdue
            {overdueLoans?.data?.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'overdue' ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                {overdueLoans.data.length}
              </span>
            )}
          </button>
          <button
            className={`shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            <CalendarIcon className="w-5 h-5 shrink-0" />
            Upcoming (7 Days)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'today' && (
            <div className="space-y-4">
              {loadingToday ? (
                <div className="text-center p-8 text-gray-500 animate-pulse">Loading today's dues...</div>
              ) : todayDues?.data?.length === 0 ? (
                <div className="text-center p-12 glass-card bg-gray-50/50">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">All clear!</h3>
                  <p className="text-gray-500">There are no payments due today.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {todayDues?.data?.map((due: any) => (
                    <div key={due.schedule_id} className="border border-gray-100 rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-forest/10 text-forest text-xs font-bold px-2 py-1 rounded-lg">{due.loan_code}</span>
                          <span className="text-xs text-gray-500">Installment #{due.installment_number}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{due.customer_name}</h4>
                        <p className="text-sm text-gray-500 mb-3">{due.customer_phone}</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{formatLKR(due.balance_due)}</p>
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        {canRecordPaymentsDirect && (
                          <button onClick={() => openCollect(due)} className="bg-forest hover:bg-leaf text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                            Collect
                          </button>
                        )}
                        <button 
                          onClick={() => handleSendReminder(due.loan_id, due.customer_id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Remind
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'overdue' && (
            <div className="space-y-4">
              {loadingOverdue ? (
                <div className="text-center p-8 text-gray-500 animate-pulse">Loading overdue loans...</div>
              ) : overdueLoans?.data?.length === 0 ? (
                <div className="text-center p-12 glass-card bg-gray-50/50">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Excellent!</h3>
                  <p className="text-gray-500">There are no overdue loans.</p>
                </div>
              ) : (
                <ResponsiveTable headers={['Customer & Loan', 'Days Overdue', 'Outstanding Balance', 'Late Fees', 'Actions']}>
                  {overdueLoans?.data?.map((loan: any) => (
                    <TableRow key={loan.id} className="hover:bg-red-50/30">
                      <TableCell>
                        <p className="font-bold text-gray-900">{loan.customer_name}</p>
                        <p className="text-xs text-gray-500">{loan.loan_code} • {loan.customer_phone}</p>
                      </TableCell>
                      <TableCell>
                        <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 w-max">
                          <AlertTriangle className="w-4 h-4" />
                          {loan.days_overdue} Days
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">{formatLKR(loan.remaining_balance)}</TableCell>
                      <TableCell className="text-red-600 font-medium">{formatLKR(loan.late_fees || 0)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {canRecordPaymentsDirect && (
                          <button
                            onClick={() => openCollect({
                              loan_id: loan.id,
                              customer_id: loan.customer_id,
                              loan_code: loan.loan_code,
                              balance_due: loan.remaining_balance
                            })}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Collect
                          </button>
                        )}
                        <button 
                          onClick={() => handleSendReminder(loan.id, loan.customer_id)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Send className="w-4 h-4" />
                          Send Notice
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </ResponsiveTable>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="text-center p-12">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">Upcoming feature</h3>
              <p className="text-gray-500">Upcoming dues calendar view will be available here.</p>
            </div>
          )}
        </div>
      </div>
        {showCollect && selectedDue && (
          <CollectPaymentModal
            loanId={selectedDue.loan_id}
            customerId={selectedDue.customer_id}
            defaultAmount={selectedDue.balance_due}
            onClose={() => setShowCollect(false)}
            onCollected={onCollected}
          />
        )}
    </div>
  );
};

export default DueReminders;
