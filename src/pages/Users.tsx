import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Search, Plus, Edit, Trash2, Shield, UserCog, X } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const Users = () => {
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'staff',
    mobile: '',
    address: '',
    branch_id: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const { isOwner, isAdmin, isBranchManager } = usePermissions();
  const { user } = useAuthStore();
  const canCreateUsers = isOwner || isBranchManager;
  const queryClient = useQueryClient();

  // Debug: log user and permissions
  React.useEffect(() => {
    console.log('Users page - user:', user, 'isOwner:', isOwner);
  }, [user, isOwner]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchApi(`/users?page=${page}&limit=20`),
  });

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchApi('/branches'),
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name || !formData.password) {
      toast.error('Email, name, and password are required');
      return;
    }

    const payload = {
      ...formData,
      branch_id: isBranchManager ? user?.branch_id || formData.branch_id : formData.branch_id
    };

    setIsCreating(true);
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      toast.success('User created successfully');
      setShowCreateModal(false);
      setFormData({ email: '', full_name: '', password: '', role: 'staff', mobile: '', address: '', branch_id: '' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

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
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">Staff & Users</h2>
          <p className="text-sm text-gray-500">Manage system access and roles.</p>
        </div>
        {user && canCreateUsers && (
          <button
            onClick={() => {
              setFormData({
                email: '',
                full_name: '',
                password: '',
                role: 'staff',
                mobile: '',
                address: '',
                branch_id: ''
              });
              if (isBranchManager) {
                setFormData(prev => ({ ...prev, branch_id: user?.branch_id || '' }));
              }
              setShowCreateModal(true);
            }}
            className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Add User
          </button>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 max-w-md w-full max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                >
                  {isOwner ? (
                    <>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="branch_manager">Branch Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="staff">Staff</option>
                      <option value="view_only">View Only</option>
                    </>
                  ) : (
                    <>
                      <option value="admin">Admin</option>
                      <option value="cashier">Cashier</option>
                      <option value="staff">Staff</option>
                      <option value="view_only">View Only</option>
                    </>
                  )}
                </select>
              </div>

              {(isOwner && formData.role !== 'owner') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                    disabled={branchesLoading}
                    required
                  >
                    <option value="">Select branch</option>
                    {branchesData?.data
                      ?.sort((a, b) => a.branch_name.localeCompare(b.branch_name))
                      ?.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branch_name} ({branch.branch_code})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Required for non-owner users</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  placeholder="+94 123 456 789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-forest text-white rounded-lg hover:bg-leaf transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
