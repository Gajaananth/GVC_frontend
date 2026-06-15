import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSidebar } from '../context/SidebarContext';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  PiggyBank, 
  CalendarClock, 
  FileText, 
  Settings, 
  LogOut,
  X,
  Banknote,
  ClipboardCheck,
  FileInput,
  Bell,
  Database,
  ShieldCheck,
  Building2,
  ShoppingCart
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const { isOpen, close } = useSidebar();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['owner', 'admin', 'staff', 'view_only'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['owner', 'admin', 'staff', 'view_only'] },
    { name: 'Loans', path: '/loans', icon: Wallet, roles: ['owner', 'admin', 'staff', 'view_only'] },
    { name: 'Savings', path: '/savings', icon: PiggyBank, roles: ['owner', 'admin', 'staff', 'view_only'] },
    { name: 'Fixed Deposits', path: '/fixed-deposits', icon: Wallet, roles: ['owner', 'admin', 'staff', 'view_only'] },
    { name: 'Collections', path: '/collections', icon: Banknote, roles: ['staff'] },
    { name: 'Owner Collections', path: '/owner-collections', icon: ShoppingCart, roles: ['owner'] },
    { name: 'Approve Collections', path: '/collection-approvals', icon: ClipboardCheck, roles: ['owner', 'admin'] },
    { name: 'Physical Forms', path: '/physical-forms', icon: FileInput, roles: ['owner', 'admin'] },
    { name: 'Import/Export', path: '/import-export', icon: Database, roles: ['owner'] },
    { name: 'Due & Reminders', path: '/due', icon: CalendarClock, roles: ['owner', 'admin', 'staff', 'view_only'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['owner', 'admin', 'staff', 'view_only'] },
    { name: 'Owner Approvals', path: '/approvals', icon: ShieldCheck, roles: ['owner'] },
    { name: 'Branches', path: '/branches', icon: Building2, roles: ['owner'] },
    { name: 'Staff & Users', path: '/users', icon: Users, roles: ['owner', 'admin'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['owner', 'admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['owner'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 w-72 lg:w-64 bg-forest text-white flex flex-col h-screen overflow-y-auto shadow-2xl`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-md flex items-center justify-center w-12 h-12 overflow-hidden">
              <img src="/logo.png" alt="GVC Agro Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">GVC Agro</h2>
              <p className="text-leaf text-xs font-medium">Finance System</p>
            </div>
          </div>
          <button onClick={close} className="lg:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 touch-target">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-2 px-4">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const isDashboard = item.name === 'Dashboard';

            const baseClasses = isDashboard
              ? 'flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-base touch-target'
              : 'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm sm:text-base touch-target';

            const activeClasses = isActive
              ? 'bg-leaf/20 text-white shadow-inner font-medium border border-leaf/30'
              : 'text-gray-300 hover:bg-white/5 hover:text-white';

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={close}
                className={`${baseClasses} ${activeClasses}`}
              >
                <Icon className={`flex-shrink-0 ${isDashboard ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? 'text-leaf' : 'opacity-70'}`} />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-leaf/20 border border-leaf/30 flex items-center justify-center text-leaf font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
