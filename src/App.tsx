import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PortalSelector from './pages/PortalSelector';
import LoginPage from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SidebarProvider } from './context/SidebarContext';

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
  <SidebarProvider>
    <div className="flex h-screen bg-[#F8FBF8] font-sans overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  </SidebarProvider>
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
          <Route path="/login" element={<PortalSelector />} />
          <Route path="/login/:role" element={<LoginPage />} />
          
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
                  
                  {/* Role-Restricted Routes */}
                  <Route path="/users/*" element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <Users />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/*" element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/logs/*" element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <ActivityLogs />
                    </ProtectedRoute>
                  } />
                  
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
