import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PortalSelector from './pages/PortalSelector';
import LoginPage from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SidebarProvider } from './context/SidebarContext';

import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import Savings from './pages/Savings';
import FixedDeposits from './pages/FixedDeposits';
import DueReminders from './pages/DueReminders';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';
import Approvals from './pages/Approvals';
import StaffCollections from './pages/StaffCollections';
import CollectionApprovals from './pages/CollectionApprovals';
import OwnerCollections from './pages/OwnerCollections';
import PhysicalForms from './pages/PhysicalForms';
import Notifications from './pages/Notifications';
import ImportExport from './pages/ImportExport';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex min-h-screen bg-[#F8FBF8] font-sans relative w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full min-h-screen">
        <TopBar />
        <main className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 overflow-y-auto w-full min-w-0 pb-8 sm:pb-4">{children}</main>
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
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/customers/*" element={<Customers />} />
                  <Route path="/loans/*" element={<Loans />} />
                  <Route path="/savings/*" element={<Savings />} />
                  <Route path="/fixed-deposits/*" element={<FixedDeposits />} />
                  <Route path="/due/*" element={<DueReminders />} />
                  <Route path="/reports/*" element={<Reports />} />
                  <Route path="/approvals/*" element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <Approvals />
                    </ProtectedRoute>
                  } />
                  <Route path="/collections/*" element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffCollections />
                    </ProtectedRoute>
                  } />
                  <Route path="/collection-approvals/*" element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <CollectionApprovals />
                    </ProtectedRoute>
                  } />
                  <Route path="/owner-collections/*" element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <OwnerCollections />
                    </ProtectedRoute>
                  } />
                  <Route path="/physical-forms/*" element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <PhysicalForms />
                    </ProtectedRoute>
                  } />
                  
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
                  <Route path="/branches/*" element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <Branches />
                    </ProtectedRoute>
                  } />
                  <Route path="/logs/*" element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <ActivityLogs />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications/*" element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <Notifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/import-export/*" element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <ImportExport />
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
