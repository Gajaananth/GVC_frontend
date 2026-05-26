import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', page, searchTerm],
    queryFn: () => fetchApi(`/customers?page=${page}&limit=10&search=${searchTerm}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
          <p className="text-sm text-gray-500">Manage your client base and view their details.</p>
        </div>
        <button className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      <div className="glass-card flex flex-col">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, NIC, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf focus:border-leaf transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">NIC Number</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Active Loans</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading customers...</td>
                </tr>
              ) : customersData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No customers found.</td>
                </tr>
              ) : (
                customersData?.data?.map((customer: any) => {
                  const activeLoansCount = customer.loans?.filter((l: any) => l.status === 'active' || l.status === 'overdue').length || 0;
                  return (
                    <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-leaf/10 border border-leaf/20 flex items-center justify-center text-leaf font-bold">
                            {customer.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.full_name}</p>
                            <p className="text-xs text-gray-500">{customer.customer_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{customer.nic_number}</td>
                      <td className="p-4">
                        <p className="text-gray-900">{customer.phone}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${activeLoansCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {activeLoansCount} Active
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${customer.is_active ? 'bg-leaf/20 text-leaf' : 'bg-red-100 text-red-600'}`}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 text-gray-400 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <p>Showing page {page} of {customersData?.totalPages || 1}</p>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button 
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={page === (customersData?.totalPages || 1)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
