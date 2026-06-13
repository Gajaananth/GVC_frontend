import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { FileText, Download, Filter, Calendar, Mail, FileSpreadsheet } from 'lucide-react';
import { formatLKR, formatDate } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';
import { ResponsiveTable, TableRow, TableCell } from '../components/ResponsiveTable';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ALL_REPORT_TYPES = [
  { id: 'daily_collection', name: 'Daily Collection Report', description: 'Collections recorded today or in a date range.' },
  { id: 'monthly_finance', name: 'Monthly Finance Summary', description: 'Net income, disbursements, and savings movement.' },
  { id: 'loan_summary', name: 'Loan Portfolio Summary', description: 'Overview of all active, overdue, and closed loans.' },
  { id: 'savings_summary', name: 'Savings Account Summary', description: 'Total deposits, withdrawals, and balances.' },
  { id: 'due_payment', name: 'Due Payments Report', description: 'List of all current overdue balances.' },
  { id: 'customer_wise', name: 'Customer-Wise Report', description: 'Loans and savings per customer.' },
  { id: 'income', name: 'Income Report', description: 'Interest income earned in a period.' },
];

const Reports = () => {
  const { isStaff } = usePermissions();
  
  const reportTypes = isStaff 
    ? ALL_REPORT_TYPES.filter(r => ['daily_collection', 'customer_wise'].includes(r.id))
    : ALL_REPORT_TYPES;

  const [selectedReport, setSelectedReport] = useState(reportTypes[0]?.id || '');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: reportData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['reports', selectedReport, dateRange],
    queryFn: () => {
      let url = `/reports/${selectedReport}`;
      if (dateRange.start) url += `?start_date=${dateRange.start}`;
      if (dateRange.end) url += `${dateRange.start ? '&' : '?'}end_date=${dateRange.end}`;
      return fetchApi(url);
    },
    enabled: false, // Wait for user to click Generate
  });

  const handleGenerate = () => {
    refetch();
  };

  const downloadReport = async (format: 'pdf' | 'excel') => {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      alert('Please log in to export reports.');
      return;
    }

    const url = `${API_URL}/reports/${selectedReport}/export/${format}?start_date=${dateRange.start}&end_date=${dateRange.end}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Failed to export report' }));
      throw new Error(data.error || 'Failed to export report');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${selectedReport}-${dateRange.start || 'start'}-to-${dateRange.end || 'end'}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const handleExportPDF = () => {
    downloadReport('pdf').catch((err) => alert(err.message));
  };

  const handleExportExcel = () => {
    downloadReport('excel').catch((err) => alert(err.message));
  };

  const handleEmailReport = async () => {
    const email = prompt("Enter email address to send this report:");
    if (email) {
      try {
        await fetchApi(`/reports/${selectedReport}/email`, {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        alert('Email sent successfully!');
      } catch (err) {
        alert('Failed to send email');
      }
    }
  };

  const renderReportPreview = () => {
    if (!reportData) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p>Select a report and click Generate to view data</p>
      </div>
    );

    const { type, data } = reportData;

    switch (type) {
      case 'daily_collection':
        return (
          <div className="space-y-4">
            <div className="bg-forest/5 p-4 rounded-xl border border-forest/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-gray-800">Total Collected</h3>
                <p className="text-sm text-gray-500">{formatDate(data.period.start)} to {formatDate(data.period.end)}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-forest break-words">{formatLKR(data.total_collected)}</p>
            </div>
            <ResponsiveTable headers={['Receipt', 'Date', 'Customer', 'Type', 'Amount (LKR)']} minWidth="min-w-[600px]">
              {data.payments.map((p: any) => (
                <TableRow key={p.payment_code}>
                  <TableCell>{p.payment_code}</TableCell>
                  <TableCell>{formatDate(p.payment_date)}</TableCell>
                  <TableCell>{p.customers?.full_name}</TableCell>
                  <TableCell className="capitalize">{p.payment_type}</TableCell>
                  <TableCell className="text-right font-medium">{formatLKR(p.amount)}</TableCell>
                </TableRow>
              ))}
            </ResponsiveTable>
          </div>
        );

      case 'monthly_finance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">Collections</p>
                <p className="text-2xl font-bold">{formatLKR(data.loan_collections)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-600">Loans Disbursed</p>
                <p className="text-2xl font-bold text-blue-700">{formatLKR(data.loans_disbursed)}</p>
              </div>
              <div className="bg-leaf/10 p-4 rounded-xl border border-leaf/20">
                <p className="text-sm text-forest">Net Income</p>
                <p className="text-2xl font-bold text-forest">{formatLKR(data.net_income)}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">Period</p>
              <p className="font-medium">{formatDate(data.period.start)} to {formatDate(data.period.end)}</p>
            </div>
          </div>
        );

      case 'loan_summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">Total Loans</p>
                <p className="text-xl font-bold">{data.summary.total}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-600">Active</p>
                <p className="text-xl font-bold text-blue-700">{data.summary.active}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-sm text-red-600">Overdue</p>
                <p className="text-xl font-bold text-red-700">{data.summary.overdue}</p>
              </div>
              <div className="bg-leaf/10 p-4 rounded-xl border border-leaf/20">
                <p className="text-sm text-forest">Outstanding Bal</p>
                <p className="text-xl font-bold text-forest break-words">{formatLKR(data.summary.total_outstanding)}</p>
              </div>
            </div>
          </div>
        );

      case 'savings_summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">Total Accounts</p>
                <p className="text-xl font-bold">{data.summary.total_accounts}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-600">Active Accounts</p>
                <p className="text-xl font-bold text-blue-700">{data.summary.active_accounts}</p>
              </div>
              <div className="bg-leaf/10 p-4 rounded-xl border border-leaf/20">
                <p className="text-sm text-forest">Total Balance</p>
                <p className="text-xl font-bold text-forest break-words">{formatLKR(data.summary.total_balance)}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-sm text-amber-700">Total Deposited</p>
                <p className="text-xl font-bold text-amber-800 break-words">{formatLKR(data.summary.total_deposited)}</p>
              </div>
            </div>
          </div>
        );

      case 'customer_wise':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">Customers</p>
              <p className="text-xl font-bold">{data.customers.length}</p>
            </div>
            <ResponsiveTable headers={['Customer', 'Loans', 'Savings Accounts']} minWidth="min-w-[400px]">
              {data.customers.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.full_name}</TableCell>
                  <TableCell>{customer.loans?.length || 0}</TableCell>
                  <TableCell>{customer.savings_accounts?.length || 0}</TableCell>
                </TableRow>
              ))}
            </ResponsiveTable>
          </div>
        );

      case 'due_payment':
        return (
          <div className="space-y-4">
            <div className="bg-forest/5 p-4 rounded-xl border border-forest/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-gray-800">Total Due Outstanding</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-forest break-words">{formatLKR(data.total_outstanding)}</p>
            </div>
            <ResponsiveTable headers={['Loan Code', 'Customer', 'Balance (LKR)', 'Days Overdue']} minWidth="min-w-[560px]">
              {data.overdue_loans.map((loan: any) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.loan_code}</TableCell>
                  <TableCell>{loan.full_name || loan.customer_name || 'N/A'}</TableCell>
                  <TableCell>{formatLKR(loan.remaining_balance)}</TableCell>
                  <TableCell>{loan.days_overdue || '-'}</TableCell>
                </TableRow>
              ))}
            </ResponsiveTable>
          </div>
        );

      case 'income':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">Income Period</p>
                <p>{formatDate(data.period.start)} to {formatDate(data.period.end)}</p>
              </div>
              <div className="bg-forest/10 p-4 rounded-xl border border-forest/20">
                <p className="text-sm text-forest">Interest Income</p>
                <p className="text-2xl font-bold text-forest break-words">{formatLKR(data.total_interest_income)}</p>
              </div>
            </div>
            <ResponsiveTable headers={['Date', 'Method', 'Interest (LKR)']} minWidth="min-w-[480px]">
              {data.payments.map((payment: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                  <TableCell className="text-right">{formatLKR(payment.interest_paid || 0)}</TableCell>
                </TableRow>
              ))}
            </ResponsiveTable>
          </div>
        );

      default:
        return <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full min-w-0">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Generate, view, and export financial reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar Filters */}
        <div className="glass-card p-4 sm:p-6 flex flex-col gap-6 lg:col-span-1 overflow-y-auto">
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-forest" /> Report Type
            </h3>
            <div className="space-y-2">
              {reportTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    selectedReport === type.id 
                      ? 'bg-forest text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-sm">{type.name}</p>
                  {selectedReport === type.id && <p className="text-xs text-gray-300 mt-1">{type.description}</p>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest" /> Date Range
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isFetching}
            className="mt-auto w-full bg-forest hover:bg-leaf text-white font-medium py-3 rounded-xl transition-all shadow-md flex items-center justify-center disabled:opacity-70"
          >
            {isFetching ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Preview Area */}
        <div className="glass-card flex flex-col lg:col-span-3 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white/50">
            <h3 className="font-bold text-base sm:text-lg text-gray-800">
              {reportData ? reportData.data?.report_name || reportTypes.find(r => r.id === selectedReport)?.name : 'Report Preview'}
            </h3>
            
            {reportData && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleEmailReport}
                  className="px-3 sm:px-4 py-2 bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="px-3 sm:px-4 py-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-3 sm:px-4 py-2 bg-white border border-gray-200 hover:border-red-500 hover:text-red-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4" />
                  PDF Export
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isFetching ? (
              <div className="flex flex-col items-center justify-center h-full text-forest animate-pulse">
                <FileText className="w-12 h-12 mb-4" />
                <p className="font-medium">Crunching the numbers...</p>
              </div>
            ) : (
              renderReportPreview()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
