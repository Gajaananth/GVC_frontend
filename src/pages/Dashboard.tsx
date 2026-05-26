import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { 
  Users, 
  Wallet, 
  PiggyBank, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { formatLKR } from '../utils/format';

const Dashboard = () => {
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => fetchApi('/dashboard/summary'),
  });

  const { data: recentTxs, isLoading: loadingTxs } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => fetchApi('/dashboard/recent-transactions'),
  });

  const summary = summaryData?.data || {};

  const stats = [
    {
      title: 'Active Loans',
      value: summary.active_loans || 0,
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Outstanding',
      value: formatLKR(summary.total_outstanding || 0),
      icon: Clock,
      color: 'text-gold',
      bgColor: 'bg-gold/20',
    },
    {
      title: 'Total Savings',
      value: formatLKR(summary.total_savings || 0),
      icon: PiggyBank,
      color: 'text-leaf',
      bgColor: 'bg-leaf/20',
    },
    {
      title: 'Overdue Loans',
      value: summary.overdue_loans || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-6 flex items-center gap-4 hover:shadow-2xl transition-all group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                <Icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {loadingSummary ? <span className="animate-pulse bg-gray-200 text-transparent rounded">Loading...</span> : stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-card flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
          </div>
          <div className="p-0 overflow-y-auto flex-1">
            {loadingTxs ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">Loading transactions...</div>
            ) : recentTxs?.data?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No recent transactions found.</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentTxs?.data?.map((tx: any, i: number) => {
                  const isDeposit = tx.type === 'deposit' || tx.type === 'regular' || tx.type === 'partial' || tx.type === 'full_settlement' || tx.type === 'advance' || tx.type === 'interest';
                  const isLoan = tx.category === 'loan_payment';
                  
                  return (
                    <li key={i} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDeposit ? 'bg-leaf/10 text-leaf' : 'bg-red-100 text-red-600'}`}>
                          {isDeposit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{tx.customer?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 capitalize">{tx.type.replace('_', ' ')} • {isLoan ? 'Loan' : 'Savings'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isDeposit ? 'text-leaf' : 'text-gray-900'}`}>
                          {isDeposit ? '+' : '-'}{formatLKR(tx.amount)}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-card flex flex-col p-6 gap-6">
          <div className="bg-gradient-to-br from-forest to-leaf rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <h3 className="font-bold text-lg mb-2 relative z-10">Today's Collections</h3>
            <p className="text-3xl font-bold relative z-10">
              {loadingSummary ? '...' : formatLKR(summary.today_collections || 0)}
            </p>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-white border border-gray-200 hover:border-leaf hover:text-leaf text-left px-4 py-3 rounded-xl font-medium transition-all shadow-sm flex justify-between items-center group">
                Record Payment
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="w-full bg-white border border-gray-200 hover:border-leaf hover:text-leaf text-left px-4 py-3 rounded-xl font-medium transition-all shadow-sm flex justify-between items-center group">
                New Loan Application
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="w-full bg-white border border-gray-200 hover:border-leaf hover:text-leaf text-left px-4 py-3 rounded-xl font-medium transition-all shadow-sm flex justify-between items-center group">
                Add Customer
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add ArrowRight to Lucide imports
import { ArrowRight } from 'lucide-react';

export default Dashboard;
