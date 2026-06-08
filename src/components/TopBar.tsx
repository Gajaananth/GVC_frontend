import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { GlobalSearch } from './GlobalSearch';

const TopBar = () => {
  const location = useLocation();
  const { toggle } = useSidebar();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/customers')) return 'Customer Management';
    if (path.startsWith('/loans')) return 'Loan Portfolio';
    if (path.startsWith('/savings')) return 'Savings Accounts';
    if (path.startsWith('/due')) return 'Due & Reminders';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/users')) return 'Staff Management';
    if (path.startsWith('/settings')) return 'System Settings';
    return '';
  };

  return (
    <div className="h-16 sm:h-20 bg-white/60 backdrop-blur-md border-b border-gray-100 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 sticky top-0 z-10 shadow-sm w-full">
      <div className="flex items-center min-w-0">
        <button onClick={toggle} className="lg:hidden p-2 mr-1 sm:mr-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0">
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-800 tracking-tight truncate">{getPageTitle()}</h1>
          <p className="hidden md:block text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-6 shrink-0">
        <div className="relative hidden md:block">
          <GlobalSearch />
        </div>
        <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <Search className="w-5 h-5" />
        </button>
        
        <button className="relative p-2 text-gray-500 hover:text-forest transition-colors rounded-full hover:bg-forest/5">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gold rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
