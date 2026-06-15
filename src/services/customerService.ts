// src/services/customerService.ts
import { fetchApi } from './api';

export interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  nic_number: string;
  phone: string;
  email?: string;
  address: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  monthly_income?: number;
  branch_id?: string | null;
  photo_url?: string;
  nic_front_url?: string;
  nic_back_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assigned_staff_id?: string;
}

export interface DocumentValidationRequest {
  customer_id: string;
  document_type: 'face_photo' | 'nic_front' | 'nic_back';
  file_url: string;
}

export interface FaceDetectionResult {
  face_detected: boolean;
  face_count: number;
  face_quality_score: number;
  is_valid: boolean;
  validation_notes?: string;
}

export const customerService = {
  // Get customer by ID
  async getCustomer(customerId: string): Promise<Customer> {
    return fetchApi(`/customers/${customerId}`);
  },

  // Get customers in branch
  async getBranchCustomers(branchId: string, filters?: any): Promise<Customer[]> {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString();
    return fetchApi(`/customers?branch_id=${branchId}${queryStr ? '&' + queryStr : ''}`);
  },

  // Get assigned customers for Staff
  async getAssignedCustomers(staffId: string): Promise<Customer[]> {
    return fetchApi(`/staff/${staffId}/customers`);
  },

  // Create customer (JSON payload for cases where files are uploaded separately)
  async createCustomer(data: Partial<Customer> & { photo_url?: string; nic_front_url?: string; nic_back_url?: string; branch_id?: string; }): Promise<Customer> {
    return fetchApi('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create customer using multipart form data so documents upload in one request.
  async createCustomerWithFiles(data: {
    full_name: string;
    nic_number: string;
    phone: string;
    email?: string;
    address: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    monthly_income?: number;
    branch_id?: string;
    registered_by_staff_id?: string;
    assigned_staff_id?: string;
    notes?: string;
    photo: File;
    nic_front: File;
    nic_back: File;
    home_photo?: File;
    shop_photo?: File;
    application_form?: File;
    other_files?: File[];
  }): Promise<Customer> {
    const formData = new FormData();
    formData.append('full_name', data.full_name);
    formData.append('nic_number', data.nic_number);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    if (data.email) formData.append('email', data.email);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.gender) formData.append('gender', data.gender);
    if (data.occupation) formData.append('occupation', data.occupation);
    if (data.monthly_income !== undefined) formData.append('monthly_income', String(data.monthly_income));
    formData.append('branch_id', data.branch_id);
    if (data.registered_by_staff_id) formData.append('registered_by_staff_id', data.registered_by_staff_id);
    if (data.assigned_staff_id) formData.append('assigned_staff_id', data.assigned_staff_id);
    if (data.notes) formData.append('notes', data.notes);
    formData.append('photo', data.photo);
    formData.append('nic_front', data.nic_front);
    formData.append('nic_back', data.nic_back);
    if (data.home_photo) formData.append('home_photo', data.home_photo);
    if (data.shop_photo) formData.append('shop_photo', data.shop_photo);
    if (data.application_form) formData.append('application_form', data.application_form);
    if (data.other_files?.length) {
      data.other_files.forEach((file, index) => formData.append(`other_photo_${index + 1}`, file));
    }

    return fetchApi('/customers', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload customer document and validate (especially face detection)
  async uploadDocument(customerId: string, document_type: 'face_photo' | 'nic_front' | 'nic_back', file: File): Promise<any> {
    const formData = new FormData();
    formData.append('document_type', document_type);
    formData.append('file', file);

    return fetchApi(`/customers/${customerId}/documents`, {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
    });
  },

  // Update customer
  async updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer> {
    return fetchApi(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },


  // Validate face detection on uploaded photo
  async validateFaceDetection(customerId: string, photo_url: string): Promise<FaceDetectionResult> {
    return fetchApi(`/customers/${customerId}/validate-face`, {
      method: 'POST',
      body: JSON.stringify({ photo_url }),
    });
  },

  // Assign customer to staff member
  async assignCustomerToStaff(customerId: string, staffId: string): Promise<Customer> {
    return fetchApi(`/customers/${customerId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ staff_id: staffId }),
    });
  },

  // Get customer portfolio (all loans and savings)
  async getCustomerPortfolio(customerId: string): Promise<any> {
    return fetchApi(`/customers/${customerId}/portfolio`);
  },

  // Deactivate customer
  async deactivateCustomer(customerId: string): Promise<Customer> {
    return fetchApi(`/customers/${customerId}/deactivate`, {
      method: 'POST',
    });
  },
};