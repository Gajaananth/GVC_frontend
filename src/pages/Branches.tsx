import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
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
  const { user, accessToken } = useAuthStore();
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
    status: 'active' as const
  });

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/branches', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setBranches(response.data.data || []);

      // Fetch stats for each branch
      if (canManageBranches) {
        const statsMap: Record<string, BranchStats> = {};
        for (const branch of response.data.data || []) {
          try {
            const statsRes = await axios.get(`http://localhost:5000/api/branches/${branch.id}/stats`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            statsMap[branch.id] = statsRes.data.data;
          } catch (err) {
            // Silently fail for stats
          }
        }
        setStats(statsMap);
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canManageBranches) {
      navigate('/dashboard');
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
      await axios.post('http://localhost:5000/api/branches', formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowCreateModal(false);
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create branch');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;

    try {
      await axios.put(`http://localhost:5000/api/branches/${selectedBranch.id}`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowEditModal(false);
      setSelectedBranch(null);
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update branch');
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/branches/${branchId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete branch');
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
          {user?.role === 'owner' && (
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Add Branch
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <p className="text-gray-600 mt-2">Loading branches...</p>
          </div>
        )}

        {/* Branches Table */}
        {!loading && branches.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  {user?.role === 'owner' && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stats</th>}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {branches.map(branch => (
                  <tr key={branch.id} className="hover:bg-gray-50">
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
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {user?.role === 'owner' && (
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {stats[branch.id] && (
                          <div className="text-xs">
                            <div>Managers: {stats[branch.id].managers}</div>
                            <div>Users: {stats[branch.id].users}</div>
                            <div>Customers: {stats[branch.id].customers}</div>
                            <div>Loans: {stats[branch.id].activeLoans}</div>
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {user?.role === 'owner' && (
                          <>
                            <button
                              onClick={() => handleEditClick(branch)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(branch.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
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
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No Branches</h3>
            <p className="text-gray-600 mt-2">
              {user?.role === 'owner' ? 'Create your first branch to get started' : 'You do not have access to any branches'}
            </p>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Branch</h2>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                    <input
                      type="text"
                      name="branch_code"
                      value={formData.branch_code}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                    <input
                      type="text"
                      name="branch_name"
                      value={formData.branch_name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Branch</h2>
              <form onSubmit={handleUpdateSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                    <input
                      type="text"
                      name="branch_code"
                      value={formData.branch_code}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                    <input
                      type="text"
                      name="branch_name"
                      value={formData.branch_name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedBranch(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Branches;
