import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginPage from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import Savings from './pages/Savings';
import DueReminders from './pages/DueReminders';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-[#F8FBF8] font-sans">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/customers/*" element={<Customers />} />
                  <Route path="/loans/*" element={<Loans />} />
                  <Route path="/savings/*" element={<Savings />} />
                  <Route path="/due/*" element={<DueReminders />} />
                  <Route path="/reports/*" element={<Reports />} />
                  <Route path="/users/*" element={<Users />} />
                  <Route path="/settings/*" element={<Settings />} />
                  <Route path="/logs/*" element={<ActivityLogs />} />
                  {/* Catch-all redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'shadow-xl border border-gray-100 rounded-xl',
          duration: 4000,
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
