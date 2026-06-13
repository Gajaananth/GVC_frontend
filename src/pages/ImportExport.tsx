import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const ImportExport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuthStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const { accessToken } = useAuthStore.getState();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (!accessToken) throw new Error('Not authenticated');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/import-export/import/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success(data.message);
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!accessToken) throw new Error('Not authenticated');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/import-export/export/customers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers_export.csv';
      a.click();
      toast.success('Export downloaded');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (user?.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-gray-500">Only the owner can access data import/export.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Upload className="w-6 h-6 text-leaf" />
          Bulk Import Customers
        </h2>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">Select CSV File to Upload</h3>
          <p className="text-sm text-gray-500 mb-6">File must contain columns: full_name, nic_number, phone, address, customer_code (optional)</p>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            id="csv-upload"
            onChange={handleFileChange}
          />
          <label 
            htmlFor="csv-upload"
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
          >
            Browse Files
          </label>
          
          {file && (
            <div className="mt-6 flex items-center gap-2 bg-leaf/10 text-leaf px-4 py-2 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-500" />
          Export Data
        </h2>
        <p className="text-gray-600 mb-6">Download a complete backup of all customer records in CSV format.</p>
        <button onClick={handleExport} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export All Customers
        </button>
      </div>
    </div>
  );
};

export default ImportExport;
