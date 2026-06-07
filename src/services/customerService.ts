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
  branch_id: string;
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
    return fetchApi(`/api/customers/${customerId}`);
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
    return fetchApi(`/api/customers?branch_id=${branchId}${queryStr ? '&' + queryStr : ''}`);
  },

  // Get assigned customers for Staff
  async getAssignedCustomers(staffId: string): Promise<Customer[]> {
    return fetchApi(`/api/staff/${staffId}/customers`);
  },

  // Create customer - requires face photo validation
  async createCustomer(data: Omit<Customer, 'id' | 'customer_code' | 'created_at' | 'updated_at' | 'branch_id'> & { branch_id: string }): Promise<Customer> {
    if (!data.photo_url || !data.nic_front_url || !data.nic_back_url) {
      throw new Error('Customer face photo, NIC front, and NIC back are mandatory');
    }
    return fetchApi('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update customer
  async updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer> {
    return fetchApi(`/api/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Upload customer document and validate (especially face detection)
  async uploadDocument(customerId: string, document_type: 'face_photo' | 'nic_front' | 'nic_back', file: File): Promise<any> {
    const formData = new FormData();
    formData.append('document_type', document_type);
    formData.append('file', file);

    return fetchApi(`/api/customers/${customerId}/documents`, {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
    });
  },

  // Validate face detection on uploaded photo
  async validateFaceDetection(customerId: string, photo_url: string): Promise<FaceDetectionResult> {
    return fetchApi(`/api/customers/${customerId}/validate-face`, {
      method: 'POST',
      body: JSON.stringify({ photo_url }),
    });
  },

  // Assign customer to staff member
  async assignCustomerToStaff(customerId: string, staffId: string): Promise<Customer> {
    return fetchApi(`/api/customers/${customerId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ staff_id: staffId }),
    });
  },

  // Get customer portfolio (all loans and savings)
  async getCustomerPortfolio(customerId: string): Promise<any> {
    return fetchApi(`/api/customers/${customerId}/portfolio`);
  },

  // Deactivate customer
  async deactivateCustomer(customerId: string): Promise<Customer> {
    return fetchApi(`/api/customers/${customerId}/deactivate`, {
      method: 'POST',
    });
  },
};
