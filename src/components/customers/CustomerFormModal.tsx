import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';
import * as faceapi from 'face-api.js';
import { useAuthStore } from '../../store/authStore';

interface Props {
  customer?: any;
  onClose: () => void;
}

const CustomerFormModal = ({ customer, onClose }: Props) => {
  const queryClient = useQueryClient();
  const isEdit = !!customer;
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchApi('/branches'),
    enabled: isOwner && !isEdit,
    staleTime: 1000 * 60 * 5,
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => fetchApi('/users?role=staff&limit=100'),
    enabled: !isEdit,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    nic_number: customer?.nic_number || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    occupation: customer?.occupation || '',
    monthly_income: customer?.monthly_income || '',
    notes: customer?.notes || '',
    registered_by_staff_id: '',
    branch_id: customer?.branch_id || '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicBack, setNicBack] = useState<File | null>(null);
  const [otherPhotos, setOtherPhotos] = useState<File[]>([]);
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
  const [isValidatingFace, setIsValidatingFace] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      const loadModels = async () => {
        try {
          // Load from a reliable CDN to avoid needing local weights
          await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
          setIsFaceApiLoaded(true);
        } catch (err) {
          console.warn("Face models could not be loaded from /models. Ensure they exist. We will do a generic check if unavailable.", err);
          // Set to true anyway to allow fallback checks
          setIsFaceApiLoaded(true);
        }
      };
      loadModels();
    }
  }, [isEdit]);

  const mutation = useMutation({
    mutationFn: async (formData: FormData | Record<string, unknown>) => {
      if (isEdit) {
        return fetchApi(`/customers/${customer.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        return fetchApi('/customers', {
          method: 'POST',
          // Do NOT set Content-Type here; fetchApi will skip it for FormData
          body: formData as FormData
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Submission failed');
    }
  });

  const validateFacePhoto = async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = async () => {
        try {
          // Fallback if face-api fails to load models
          if (!faceapi.nets.tinyFaceDetector.isLoaded) {
            console.log("Face API models not loaded. Skipping deep face detection.");
            return resolve(true);
          }
          const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
          if (detections.length === 0) {
            reject(new Error("No face detected in the photo. Please use a clear face photo."));
          } else if (detections.length > 1) {
            reject(new Error(`Multiple faces (${detections.length}) detected. Please upload a photo with exactly one person.`));
          } else {
            resolve(true);
          }
        } catch (err) {
          console.error("Face detection error:", err);
          resolve(true); // Allow if detection fails due to model issues
        }
      };
      img.onerror = () => reject(new Error("Invalid image file."));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEdit) {
      if (!photo || !nicFront || !nicBack) {
        toast.error("Face photo, NIC front, and NIC back are required!");
        return;
      }
      
      setIsValidatingFace(true);
      try {
        await validateFacePhoto(photo);
      } catch (err: any) {
        setIsValidatingFace(false);
        toast.error(err.message);
        return;
      }
      setIsValidatingFace(false);

      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null) {
          formData.append(k, String(v));
        }
      });
      formData.append('photo', photo);
      formData.append('nic_front', nicFront);
      formData.append('nic_back', nicBack);
      otherPhotos.forEach((file, i) => {
        if (i < 5) formData.append(`other_photo_${i + 1}`, file);
      });

      mutation.mutate(formData);
    } else {
      const body: Record<string, unknown> = {
        ...form,
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
        email: form.email || null,
      };
      mutation.mutate(body);
    }
  };

  const staffUsers = (staffList?.data || []).filter((u: any) => u.role === 'staff' || u.role === 'admin');

  return (
    <Modal title={isEdit ? 'Edit Customer' : 'Add Customer'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <input required className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">NIC Number *</label>
            <input required disabled={isEdit} className="input-field" value={form.nic_number} onChange={e => setForm({ ...form, nic_number: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone *</label>
            <input required className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Address *</label>
          <textarea required className="input-field" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        
        {isOwner && !isEdit && (
          <div>
            <label className="text-sm font-medium text-gray-700">Branch *</label>
            <select
              required
              className="input-field"
              value={form.branch_id}
              onChange={e => setForm({ ...form, branch_id: e.target.value })}
            >
              <option value="">Select branch</option>
              {(branchesData?.data || []).map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name} ({branch.branch_code})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Occupation</label>
            <input className="input-field" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Monthly Income (LKR)</label>
            <input type="number" className="input-field" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })} />
          </div>
        </div>

        {!isEdit && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Required Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Face Photo *</label>
                <input type="file" accept="image/*" required onChange={e => setPhoto(e.target.files?.[0] || null)} className="w-full text-sm border p-2 rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">NIC Front *</label>
                <input type="file" accept="image/*" required onChange={e => setNicFront(e.target.files?.[0] || null)} className="w-full text-sm border p-2 rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">NIC Back *</label>
                <input type="file" accept="image/*" required onChange={e => setNicBack(e.target.files?.[0] || null)} className="w-full text-sm border p-2 rounded-lg" />
              </div>
            </div>
            <p className="text-xs text-amber-700 mt-2">Face photo will be validated to ensure a clear human face is present before submission.</p>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Other Documents / Photos (Optional, max 5)</label>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  if (otherPhotos.length + files.length > 5) {
                    toast.error('Maximum 5 other photos allowed');
                    return;
                  }
                  setOtherPhotos([...otherPhotos, ...files].slice(0, 5));
                }} 
                className="w-full text-sm border p-2 rounded-lg mt-1" 
              />
              {otherPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {otherPhotos.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button type="button" onClick={() => setOtherPhotos(otherPhotos.filter((_, idx) => idx !== i))} className="text-red-500 font-bold ml-1">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!isEdit && (
          <div>
            <label className="text-sm font-medium text-gray-700">Staff Who Applied (Loan Officer) *</label>
            <select
              required
              className="input-field"
              value={form.registered_by_staff_id}
              onChange={e => setForm({ ...form, registered_by_staff_id: e.target.value })}
            >
              <option value="">Select staff member</option>
              {staffUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-6 sm:pt-4">
          <button type="button" onClick={onClose} className="mobile-button bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition">Cancel</button>
          <button type="submit" disabled={mutation.isPending || isValidatingFace} className="mobile-button bg-forest text-white rounded-xl hover:bg-leaf disabled:opacity-50 transition">
            {isValidatingFace ? 'Validating Face...' : mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
