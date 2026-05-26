import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TopBar = () => {
  const location = useLocation();
  
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
    <div className="h-20 bg-white/60 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{getPageTitle()}</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ID, name, or phone..." 
            className="pl-10 pr-4 py-2 bg-gray-100/50 border-none rounded-xl focus:ring-2 focus:ring-leaf w-64 text-sm transition-all"
          />
        </div>
        
        <button className="relative p-2 text-gray-500 hover:text-forest transition-colors rounded-full hover:bg-forest/5">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gold rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
