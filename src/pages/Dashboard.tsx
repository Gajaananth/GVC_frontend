import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Wallet, 
  PiggyBank, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Award
} from 'lucide-react';
import { formatLKR } from '../utils/format';
import { DashboardCharts } from '../components/DashboardCharts';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => fetchApi('/dashboard/summary'),
  });

  const { data: recentTxs, isLoading: loadingTxs } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => fetchApi('/dashboard/recent-transactions'),
  });

  const { data: advancedMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['advanced-metrics'],
    queryFn: () => fetchApi('/dashboard/advanced-metrics'),
    enabled: user?.role === 'owner' || user?.role === 'admin'
  });

  const summary = summaryData?.data || {};
  const metrics = advancedMetrics?.data || {};

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

  const pendingTotal = (summary.pending_loan_approvals || 0) + (summary.pending_assignment_approvals || 0) + (summary.pending_correction_requests || 0);

  return (
    <div className="space-y-6 flex flex-col h-full max-w-7xl mx-auto px-4">
      {(user?.role === 'admin' || user?.role === 'owner') && (summary.pending_physical_forms || 0) > 0 && (
        <Link to="/physical-forms" className="block bg-orange-50 border border-orange-200 rounded-2xl p-4 hover:bg-orange-100 transition-colors mb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-orange-700" />
            <div>
              <p className="font-semibold text-orange-900">{summary.pending_physical_forms} physical form(s) from staff awaiting data entry</p>
              <p className="text-sm text-orange-700">Enter customer & loan details, then submit to owner</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-700 ml-auto" />
          </div>
        </Link>
      )}
      {(user?.role === 'admin' || user?.role === 'owner') && (summary.pending_collection_approvals || 0) > 0 && (
        <Link to="/collection-approvals" className="block bg-blue-50 border border-blue-200 rounded-2xl p-4 hover:bg-blue-100 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-700" />
            <div>
              <p className="font-semibold text-blue-900">{summary.pending_collection_approvals} staff collection(s) awaiting approval</p>
              <p className="text-sm text-blue-700">Verify cash & online totals before approving</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-700 ml-auto" />
          </div>
        </Link>
      )}
      {user?.role === 'owner' && pendingTotal > 0 && (
        <Link to="/approvals" className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-900">{pendingTotal} item(s) need your approval</p>
              <p className="text-sm text-amber-700">
                {summary.pending_loan_approvals || 0} loan(s), {summary.pending_assignment_approvals || 0} handover(s), {summary.pending_correction_requests || 0} correction letter(s)
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-700 ml-auto" />
          </div>
        </Link>
      )}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-4 flex flex-row items-center gap-3 h-full w-full">
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[11px] sm:text-xs font-medium text-gray-500 mb-0.5 leading-tight break-words whitespace-normal" title={stat.title}>
                  {stat.title}
                </p>
                <h3 className="text-sm sm:text-base lg:text-sm xl:text-lg font-bold text-gray-900 break-words whitespace-normal" title={String(stat.value)}>
                  {loadingSummary ? <span className="animate-pulse bg-gray-200 text-transparent rounded">Loading...</span> : stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Charts */}
      <DashboardCharts />

      {/* Advanced Analytics Section */}
      {(user?.role === 'owner' || user?.role === 'admin') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0 mt-6">
          {/* Portfolio at Risk */}
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-gray-500 font-medium mb-1">Portfolio at Risk (PAR)</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {loadingMetrics ? '...' : `${metrics.portfolio_at_risk_pct?.toFixed(2) || 0}%`}
            </div>
            <p className="text-xs text-gray-400">
              {formatLKR(metrics.overdue_outstanding || 0)} overdue of {formatLKR(metrics.total_outstanding || 0)} total
            </p>
          </div>

          {/* Top Overdue Loans */}
          <div className="glass-card p-6 flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Highest Overdue Loans
            </h3>
            <div className="flex-1 overflow-y-auto">
              {loadingMetrics ? (
                <div className="text-center text-gray-400 text-sm py-4 animate-pulse">Loading...</div>
              ) : metrics.top_overdue?.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-4">No overdue loans found.</div>
              ) : (
                <ul className="space-y-3">
                  {metrics.top_overdue?.map((loan: any, i: number) => (
                    <li key={i} className="flex justify-between items-center bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{loan.customer_name}</p>
                        <p className="text-xs text-orange-600 font-medium">{loan.days_overdue} days overdue</p>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{formatLKR(loan.remaining_balance)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Staff Performance */}
          <div className="glass-card p-6 flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              Top Staff (This Month)
            </h3>
            <div className="flex-1 overflow-y-auto">
              {loadingMetrics ? (
                <div className="text-center text-gray-400 text-sm py-4 animate-pulse">Loading...</div>
              ) : metrics.staff_performance?.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-4">No collections this month.</div>
              ) : (
                <ul className="space-y-3">
                  {metrics.staff_performance?.map((staff: any, i: number) => (
                    <li key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </div>
                        <p className="font-medium text-gray-800 text-sm">{staff.name}</p>
                      </div>
                      <p className="font-bold text-gray-900 text-sm text-leaf">{formatLKR(staff.total)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 mt-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-card flex flex-col p-6 gap-4">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
          </div>
          <div className="p-0 overflow-y-auto flex-1 max-h-80 md:max-h-full">
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
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDeposit ? 'bg-leaf/10 text-leaf' : 'bg-red-100 text-red-600'}`}>
                          {isDeposit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden break-words">
                          <p className="font-semibold text-gray-800 truncate" title={tx.customer?.full_name}>{tx.customer?.full_name || 'Unknown'}</p>
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
          <div className="glass-card flex flex-col p-6 gap-6 max-h-80 md:max-h-full overflow-y-auto">
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

export default Dashboard;
