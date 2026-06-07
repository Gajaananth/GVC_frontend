// src/services/userService.ts
import { fetchApi } from './api';
import type { User } from '../store/authStore';

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'branch_manager' | 'admin' | 'cashier' | 'staff';
  branch_id: string; // Required for all non-owner roles
  mobile?: string;
  address?: string;
  avatar_url?: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  mobile?: string;
  address?: string;
  avatar_url?: string;
  branch_id?: string;
  is_active?: boolean;
}

export const userService = {
  // Login
  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    return fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    return fetchApi('/api/auth/me');
  },

  // Get user by ID
  async getUser(userId: string): Promise<User> {
    return fetchApi(`/api/users/${userId}`);
  },

  // Get branch users (Branch Manager and Admin can see branch users)
  async getBranchUsers(branchId: string): Promise<User[]> {
    return fetchApi(`/api/branches/${branchId}/users`);
  },

  // Create user - must specify branch for non-owner roles
  async createUser(data: UserCreateRequest): Promise<User> {
    if (!data.branch_id && data.role !== 'owner') {
      throw new Error('Branch selection is mandatory for non-owner users');
    }
    return fetchApi('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update user
  async updateUser(userId: string, data: UserUpdateRequest): Promise<User> {
    return fetchApi(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete user (Owner only)
  async deleteUser(userId: string): Promise<void> {
    return fetchApi(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Promote user to Branch Manager (removes existing manager first)
  async promoteToBranchManager(userId: string, branchId: string): Promise<User> {
    return fetchApi(`/api/users/${userId}/promote`, {
      method: 'POST',
      body: JSON.stringify({ new_role: 'branch_manager', branch_id: branchId }),
    });
  },

  // Demote Branch Manager to another role
  async demoteFromBranchManager(userId: string, newRole: 'admin' | 'cashier' | 'staff'): Promise<User> {
    return fetchApi(`/api/users/${userId}/demote`, {
      method: 'POST',
      body: JSON.stringify({ new_role: newRole }),
    });
  },

  // Transfer user to another branch (Admin/Owner only)
  async transferUserToBranch(userId: string, newBranchId: string): Promise<User> {
    return fetchApi(`/api/users/${userId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ branch_id: newBranchId }),
    });
  },

  // Deactivate user
  async deactivateUser(userId: string): Promise<User> {
    return fetchApi(`/api/users/${userId}/deactivate`, {
      method: 'POST',
    });
  },

  // Reactivate user
  async reactivateUser(userId: string): Promise<User> {
    return fetchApi(`/api/users/${userId}/reactivate`, {
      method: 'POST',
    });
  },

  // Logout
  async logout(): Promise<void> {
    return fetchApi('/api/auth/logout', {
      method: 'POST',
    });
  },
};
