// src/services/branchService.ts
import { fetchApi } from './api';

export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface BranchManager {
  id: string;
  user_code: string;
  email: string;
  full_name: string;
  branch_id: string;
  branch_name?: string;
}

export const branchService = {
  // Get all branches (Owner only)
  async getAllBranches(): Promise<Branch[]> {
    return fetchApi('/branches');
  },

  // Get branch by ID
  async getBranch(branchId: string): Promise<Branch> {
    return fetchApi(`/branches/${branchId}`);
  },

  // Create branch (Owner only)
  async createBranch(data: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch> {
    return fetchApi('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update branch (Owner only)
  async updateBranch(branchId: string, data: Partial<Branch>): Promise<Branch> {
    return fetchApi(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get branch manager (if exists)
  async getBranchManager(branchId: string): Promise<BranchManager | null> {
    return fetchApi(`/branches/${branchId}/manager`);
  },

  // Assign manager to branch - removes existing manager first
  async assignBranchManager(branchId: string, userId: string): Promise<void> {
    return fetchApi(`/branches/${branchId}/manager`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Get branch statistics
  async getBranchStats(branchId: string): Promise<any> {
    return fetchApi(`/branches/${branchId}/stats`);
  },
};