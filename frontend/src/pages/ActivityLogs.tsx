// Activity Logs Page (Stub to finish routes)
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Clock } from 'lucide-react';
import { formatDate } from '../utils/format';

const ActivityLogs = () => {
  const { data, isLoading } = useQuery({ queryKey: ['logs'], queryFn: () => fetchApi('/logs?limit=50') });
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">System Activity Logs</h2>
      <div className="glass-card p-4">
        {isLoading ? <p>Loading...</p> : (
          <ul className="space-y-3">
            {data?.data?.map((log: any) => (
              <li key={log.id} className="flex gap-4 p-3 border-b text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-bold">{log.users?.full_name}</span>
                <span className="text-gray-600">{log.action}</span>
                <span className="text-gray-500">{log.entity_type} ({log.entity_id})</span>
                <span className="ml-auto text-gray-400">{formatDate(log.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
export default ActivityLogs;
