import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatLKR } from '../utils/format';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export const DashboardCharts = () => {
  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['monthly-chart'],
    queryFn: () => fetchApi('/dashboard/monthly-chart'),
  });

  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['loan-status-chart'],
    queryFn: () => fetchApi('/dashboard/loan-status-chart'),
  });

  const chartMonthly = monthlyData?.data || [];
  const chartStatus = statusData?.data || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6 min-w-0">
      {/* Monthly Collections Bar Chart */}
      <div className="glass-card p-4 sm:p-6 flex flex-col h-80 sm:h-96 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4">6-Month Collections Trend</h2>
        <div className="flex-1 w-full h-full min-h-0">
          {loadingMonthly ? (
            <div className="flex items-center justify-center h-full text-gray-400 animate-pulse">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMonthly} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `₨${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatLKR(value)}
                />
                <Bar dataKey="collections" fill="#10b981" radius={[4, 4, 0, 0]} name="Collections" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Portfolio Status Donut Chart */}
      <div className="glass-card p-4 sm:p-6 flex flex-col h-80 sm:h-96 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Portfolio Status</h2>
        <div className="flex-1 w-full h-full min-h-0">
          {loadingStatus ? (
            <div className="flex items-center justify-center h-full text-gray-400 animate-pulse">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {chartStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [value, name.toUpperCase()]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-gray-600 font-medium capitalize">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
