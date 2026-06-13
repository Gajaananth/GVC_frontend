import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Bell, Send, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';
import { ResponsiveTable, TableRow, TableCell } from '../components/ResponsiveTable';

const Notifications = () => {
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [message, setMessage] = useState('');

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['notifications-history'],
    queryFn: () => fetchApi('/notifications/history'),
    enabled: isAdmin
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => fetchApi('/customers?limit=1000'),
    enabled: isAdmin
  });

  const sendMutation = useMutation({
    mutationFn: () => fetchApi('/notifications/send-sms', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, message })
    }),
    onSuccess: () => {
      toast.success('SMS Sent successfully!');
      setCustomerId('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['notifications-history'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send SMS');
    }
  });

  if (!isAdmin) {
    return <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>;
  }

  const customers = customersData?.data?.customers || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-sm text-gray-500">Send manual SMS alerts and view automated reminder history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-forest" />
            Send Manual SMS
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select 
                className="input-field"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
              >
                <option value="">Select a customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.customer_code})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                className="input-field min-h-[100px] resize-none"
                placeholder="Enter SMS message..."
                value={message}
                maxLength={160}
                onChange={e => setMessage(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{message.length}/160 chars</p>
            </div>

            <button
              onClick={() => sendMutation.mutate()}
              disabled={!customerId || !message || sendMutation.isPending}
              className="w-full py-2.5 bg-forest hover:bg-leaf text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {sendMutation.isPending ? 'Sending...' : 'Send SMS'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-forest" />
            <h3 className="font-semibold">Notification History</h3>
          </div>
          <ResponsiveTable headers={['Date', 'Customer', 'Status']}>
            {isLoading ? (
              <TableRow><TableCell className="p-8 text-center text-gray-500 animate-pulse" colSpan={3}>Loading history...</TableCell></TableRow>
            ) : historyData?.data?.length === 0 ? (
              <TableRow><TableCell className="p-8 text-center text-gray-500" colSpan={3}>No notifications sent yet.</TableCell></TableRow>
            ) : (
              historyData?.data?.map((notif: any) => (
                <TableRow key={notif.id}>
                  <TableCell>{formatDate(notif.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{notif.customers?.full_name}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-6">{notif.customers?.phone}</span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-leaf/20 text-leaf capitalize">
                      {notif.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </ResponsiveTable>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
