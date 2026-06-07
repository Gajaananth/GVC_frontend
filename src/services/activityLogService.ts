// src/services/activityLogService.ts
import { fetchApi } from './api';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  branch_id: string;
  action: string;
  record_type: string;
  record_id: string;
  created_at: string;
}

export const activityLogService = {
  // Get activity logs
  // Owner: all logs
  // Branch users: logs from their branch only
  async getActivityLogs(filters?: any): Promise<ActivityLog[]> {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString();
    return fetchApi(`/api/activity-logs${queryStr ? '?' + queryStr : ''}`);
  },

  // Get branch activity logs
  async getBranchActivityLogs(branchId: string, filters?: any): Promise<ActivityLog[]> {
    const query = new URLSearchParams({ branch_id: branchId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return fetchApi(`/api/activity-logs?${query.toString()}`);
  },

  // Get user activity logs
  async getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]> {
    const query = new URLSearchParams({ user_id: userId });
    if (limit) {
      query.append('limit', limit.toString());
    }
    return fetchApi(`/api/activity-logs?${query.toString()}`);
  },

  // Get activity logs by record type
  async getActivityLogsByRecordType(recordType: string, recordId?: string): Promise<ActivityLog[]> {
    const query = new URLSearchParams({ record_type: recordType });
    if (recordId) {
      query.append('record_id', recordId);
    }
    return fetchApi(`/api/activity-logs?${query.toString()}`);
  },

  // Get activity logs for specific date range
  async getActivityLogsByDateRange(startDate: string, endDate: string, branchId?: string): Promise<ActivityLog[]> {
    const query = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (branchId) {
      query.append('branch_id', branchId);
    }
    return fetchApi(`/api/activity-logs?${query.toString()}`);
  },
};
