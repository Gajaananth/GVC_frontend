// src/components/CustomerRegistration.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, type Customer } from '../services/customerService';
import { validateFacePhoto, isValidFacePhoto, getFaceValidationErrorMessage, type FaceDetectionResult } from '../utils/faceDetection';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

export function CustomerRegistration() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    nic_number: '',
    phone: '',
    email: '',
    address: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    occupation: '',
    monthly_income: '',
  });

  const [documents, setDocuments] = useState({
    face_photo: null as File | null,
    nic_front: null as File | null,
    nic_back: null as File | null,
  });

  const [uploads, setUploads] = useState({
    face_photo: { url: '', validating: false, valid: false, result: null as FaceDetectionResult | null },
    nic_front: { url: '', validating: false, valid: false },
    nic_back: { url: '', validating: false, valid: false },
  });

  const handleDocumentSelect = async (type: 'face_photo' | 'nic_front' | 'nic_back', file: File) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
    
    setUploads(prev => ({
      ...prev,
      [type]: { ...prev[type], validating: true }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload would call the API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/customers/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();

      if (type === 'face_photo') {
        const faceResult = await validateFacePhoto(file);
        setUploads(prev => ({
          ...prev,
          [type]: { 
            url: result.file_url, 
            validating: false, 
            valid: isValidFacePhoto(faceResult),
            result: faceResult
          }
        }));
        
        if (!isValidFacePhoto(faceResult)) {
          toast.error(getFaceValidationErrorMessage(faceResult));
        }
      } else {
        setUploads(prev => ({
          ...prev,
          [type]: { ...prev[type], url: result.file_url, validating: false, valid: true }
        }));
      }
    } catch (error: any) {
      toast.error(`Failed to upload ${type}: ${error.message}`);
      setUploads(prev => ({
        ...prev,
        [type]: { ...prev[type], validating: false }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploads.face_photo.valid) {
      toast.error('Face photo validation failed. Please upload a clear face photo.');
      return;
    }

    if (!uploads.nic_front.url || !uploads.nic_back.url) {
      toast.error('All documents are required');
      return;
    }

    setLoading(true);
    try {
      const customer = await customerService.createCustomer({
        ...formData,
        monthly_income: formData.monthly_income ? Number(formData.monthly_income) : undefined,
        branch_id: user?.branch_id || '',
        photo_url: uploads.face_photo.url,
        nic_front_url: uploads.nic_front.url,
        nic_back_url: uploads.nic_back.url,
      } as any);

      toast.success('Customer created successfully!');
      navigate(`/customers/${customer.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Register New Customer</h1>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-lg shadow p-6">
        
        {/* Personal Information */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NIC Number</label>
              <input
                type="text"
                required
                value={formData.nic_number}
                onChange={(e) => setFormData(prev => ({ ...prev, nic_number: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Contact & Employment */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact & Employment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income</label>
              <input
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_income: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Required Documents</h2>
          <p className="text-sm text-gray-600 mb-4">All three documents are mandatory</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Face Photo */}
            <DocumentUpload
              label="Customer Face Photo"
              type="face_photo"
              upload={uploads.face_photo}
              onSelect={(file) => handleDocumentSelect('face_photo', file)}
              required
              validating={uploads.face_photo.validating}
            />

            {/* NIC Front */}
            <DocumentUpload
              label="NIC Front"
              type="nic_front"
              upload={uploads.nic_front}
              onSelect={(file) => handleDocumentSelect('nic_front', file)}
              required
              validating={uploads.nic_front.validating}
            />

            {/* NIC Back */}
            <DocumentUpload
              label="NIC Back"
              type="nic_back"
              upload={uploads.nic_back}
              onSelect={(file) => handleDocumentSelect('nic_back', file)}
              required
              validating={uploads.nic_back.validating}
            />
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !uploads.face_photo.valid || !uploads.nic_front.valid || !uploads.nic_back.valid}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creating Customer...' : 'Create Customer'}
        </button>
      </form>
    </div>
  );
}

interface DocumentUploadProps {
  label: string;
  type: 'face_photo' | 'nic_front' | 'nic_back';
  upload: any;
  onSelect: (file: File) => void;
  required: boolean;
  validating: boolean;
}

function DocumentUpload({ label, type, upload, onSelect, required, validating }: DocumentUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <div className="text-center">
        {upload.url ? (
          <div>
            {upload.valid ? (
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            )}
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-600 mt-1">
              {validating ? 'Validating...' : upload.valid ? 'Validated ✓' : 'Validation failed'}
            </p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <label className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              Click to upload
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-600 mt-1">{label} {required ? '(Required)' : ''}</p>
          </>
        )}
      </div>
    </div>
  );
}
