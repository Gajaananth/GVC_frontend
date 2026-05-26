import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { formatLKR, formatDate } from '../utils/format';

const reportTypes = [
  { id: 'daily_collection', name: 'Daily Collection Report', description: 'Collections recorded today or in a date range.' },
  { id: 'monthly_finance', name: 'Monthly Finance Summary', description: 'Net income, disbursements, and savings movement.' },
  { id: 'loan_summary', name: 'Loan Portfolio Summary', description: 'Overview of all active, overdue, and closed loans.' },
  { id: 'savings_summary', name: 'Savings Account Summary', description: 'Total deposits, withdrawals, and balances.' },
  { id: 'due_payment', name: 'Due Payments Report', description: 'List of all current overdue balances.' },
];

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(reportTypes[0].id);
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

  const handleExportPDF = () => {
    // In a real app, this would use jsPDF or call a backend PDF generation endpoint
    alert('Exporting PDF... (Not implemented in demo)');
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
            <div className="bg-forest/5 p-4 rounded-xl border border-forest/10 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">Total Collected</h3>
                <p className="text-sm text-gray-500">{formatDate(data.period.start)} to {formatDate(data.period.end)}</p>
              </div>
              <p className="text-3xl font-bold text-forest">{formatLKR(data.total_collected)}</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2">Receipt</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p: any) => (
                  <tr key={p.payment_code} className="border-b border-gray-100">
                    <td className="py-2">{p.payment_code}</td>
                    <td className="py-2">{formatDate(p.payment_date)}</td>
                    <td className="py-2">{p.customers?.full_name}</td>
                    <td className="py-2 capitalize">{p.payment_type}</td>
                    <td className="py-2 text-right font-medium">{formatLKR(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'loan_summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-xl font-bold text-forest">{formatLKR(data.summary.total_outstanding)}</p>
              </div>
            </div>
          </div>
        );

      default:
        return <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Generate, view, and export financial reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar Filters */}
        <div className="glass-card p-6 flex flex-col gap-6 lg:col-span-1 overflow-y-auto">
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
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50">
            <h3 className="font-bold text-lg text-gray-800">
              {reportData ? reportData.data?.report_name || reportTypes.find(r => r.id === selectedReport)?.name : 'Report Preview'}
            </h3>
            
            {reportData && (
              <div className="flex gap-2">
                <button 
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-white border border-gray-200 hover:border-red-500 hover:text-red-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  PDF Export
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
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
