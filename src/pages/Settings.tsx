import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Settings as SettingsIcon, Save, Building2, Calculator, BellRing } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Password state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetchApi('/settings'),
  });

  useEffect(() => {
    if (settingsData?.data) setFormData(settingsData.data);
  }, [settingsData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/settings', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      toast.success('Settings saved successfully');
    } catch {
      // handled by api service
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPwdSaving(true);
    try {
      await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword
        })
      });
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
        <p className="text-sm text-gray-500">Configure company details, rates, and notifications.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building2 className="w-5 h-5 text-forest" /> Company Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.company_name || ''} onChange={e => setFormData({...formData, company_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.company_email || ''} onChange={e => setFormData({...formData, company_email: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.company_address || ''} onChange={e => setFormData({...formData, company_address: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 pb-2">
            <Calculator className="w-5 h-5 text-forest" /> Financial Defaults
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Interest (%)</label>
              <input type="number" step="0.1" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.default_loan_interest_rate || 0} onChange={e => setFormData({...formData, default_loan_interest_rate: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Savings Interest (%)</label>
              <input type="number" step="0.1" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.default_savings_interest_rate || 0} onChange={e => setFormData({...formData, default_savings_interest_rate: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee (%)</label>
              <input type="number" step="0.1" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.late_fee_percentage || 0} onChange={e => setFormData({...formData, late_fee_percentage: parseFloat(e.target.value)})} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-forest text-white p-3 rounded-xl font-bold hover:bg-leaf transition-colors flex justify-center items-center gap-2">
          {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Settings</>}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="glass-card p-6 space-y-6">
        <h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 pb-2 text-red-700">
          Security Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
            <input required type="password" placeholder="Current password" className="w-full p-2 border rounded-lg bg-gray-50" value={pwdForm.currentPassword} onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
            <input required type="password" minLength={8} placeholder="Min 8 characters" className="w-full p-2 border rounded-lg bg-gray-50" value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New *</label>
            <input required type="password" minLength={8} placeholder="Confirm new password" className="w-full p-2 border rounded-lg bg-gray-50" value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} />
          </div>
        </div>
        <button type="submit" disabled={pwdSaving || !pwdForm.currentPassword || !pwdForm.newPassword} className="w-full md:w-auto px-6 py-2 bg-gray-800 text-white rounded-xl font-medium hover:bg-black transition-colors">
          {pwdSaving ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
