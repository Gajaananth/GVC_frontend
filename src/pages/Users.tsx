import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Search, Plus, Edit, Trash2, Shield, UserCog } from 'lucide-react';

const Users = () => {
  const [page, setPage] = useState(1);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchApi(`/users?page=${page}&limit=20`),
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-bold">Owner</span>;
      case 'branch_manager':
        return <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold">Branch Manager</span>;
      case 'cashier':
        return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg text-xs font-bold">Cashier</span>;
      case 'admin':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold">Admin</span>;
      case 'staff':
        return <span className="bg-leaf/20 text-leaf px-2.5 py-1 rounded-lg text-xs font-bold">Staff</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold">View Only</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff & Users</h2>
          <p className="text-sm text-gray-500">Manage system access and roles.</p>
        </div>
        <button className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="glass-card flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-leaf transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">User Details</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 animate-pulse">Loading users...</td></tr>
              ) : (
                usersData?.data?.map((u: any) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-500">{u.user_code}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-900">{u.email}</p>
                      <p className="text-xs text-gray-500">{u.mobile || 'No mobile'}</p>
                    </td>
                    <td className="p-4">{getRoleBadge(u.role)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
