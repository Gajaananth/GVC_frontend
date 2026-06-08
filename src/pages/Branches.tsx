import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BranchStats {
  managers: number;
  users: number;
  customers: number;
  activeLoans: number;
}

const Branches: React.FC = () => {
  const { user } = useAuthStore();
  const { canManageBranches } = usePermissions();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<Record<string, BranchStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    address: '',
    phone: '',
    email: '',
    status: 'active'
  });

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/branches');
      setBranches(response.data || []);

      // Fetch stats for each branch
      if (canManageBranches) {
        const statsMap: Record<string, BranchStats> = {};
        for (const branch of response.data || []) {
          try {
            const statsRes = await fetchApi(`/branches/${branch.id}/stats`);
            statsMap[branch.id] = statsRes.data;
          } catch (err) {
            // Silently fail for stats
          }
        }
        setStats(statsMap);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canManageBranches) {
      navigate('/');
      return;
    }
    fetchBranches();
  }, [user, canManageBranches, navigate]);

  const handleCreateClick = () => {
    setFormData({
      branch_code: '',
      branch_name: '',
      address: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      status: branch.status
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/branches', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      toast.success('Branch created successfully');
      setShowCreateModal(false);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create branch');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;

    try {
      await fetchApi(`/branches/${selectedBranch.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      toast.success('Branch updated successfully');
      setShowEditModal(false);
      setSelectedBranch(null);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update branch');
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;

    try {
      await fetchApi(`/branches/${branchId}`, {
        method: 'DELETE'
      });
      toast.success('Branch deleted successfully');
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete branch');
    }
  };

  if (!canManageBranches) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You do not have permission to manage branches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">Branch Management</h2>
          <p className="text-sm text-gray-500">Create and manage business branches</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="bg-forest hover:bg-leaf text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Branch
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="h-8 w-8 border-4 border-forest border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-2">Loading branches...</p>
        </div>
      )}

      {/* Branches Table */}
      {!loading && branches.length > 0 && (
        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">UUID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stats</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {branches.map(branch => (
                <tr key={branch.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{branch.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{branch.branch_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{branch.branch_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{branch.address}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{branch.phone}</div>
                    <div className="text-xs text-gray-500">{branch.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      branch.status === 'active'
                        ? 'bg-green-100/80 text-green-700'
                        : 'bg-red-100/80 text-red-700'
                    }`}>
                      {branch.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {stats[branch.id] && (
                      <div className="text-xs space-y-0.5">
                        <div>Managers: {stats[branch.id].managers}</div>
                        <div>Users: {stats[branch.id].users}</div>
                        <div>Customers: {stats[branch.id].customers}</div>
                        <div>Loans: {stats[branch.id].activeLoans}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(branch)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && branches.length === 0 && (
        <div className="glass-card p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">No Branches</h3>
          <p className="text-gray-600 mt-2">Create your first branch to get started</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 w-full max-w-md max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Branch</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code *</label>
                <input
                  type="text"
                  name="branch_code"
                  value={formData.branch_code}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-forest text-white rounded-lg hover:bg-leaf transition-colors font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 w-full max-w-md max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Branch</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code *</label>
                <input
                  type="text"
                  name="branch_code"
                  value={formData.branch_code}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBranch(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-forest text-white rounded-lg hover:bg-leaf transition-colors font-medium"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
