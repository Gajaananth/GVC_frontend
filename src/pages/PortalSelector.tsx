import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Briefcase, Eye } from 'lucide-react';

const portals = [
  {
    id: 'admin',
    title: 'Admin Portal',
    description: 'System administration and management',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700',
    link: '/login/admin'
  },
  {
    id: 'staff',
    title: 'Staff Portal',
    description: 'Daily operations and customer management',
    icon: Users,
    color: 'bg-orange-100 text-orange-700',
    link: '/login/staff'
  }
];

const PortalSelector = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest to-leaf/80 p-4">
      <div className="glass-card w-full max-w-4xl p-8 md:p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-forest/20 rounded-full blur-3xl -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 overflow-hidden p-1">
            <img src="/logo.png" alt="GVC Agro Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GVC Agro Finance</h1>
          <p className="text-gray-500 text-lg">Select your designated login portal</p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.id}
                to={portal.link}
                className="group bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-xl flex items-start gap-5"
              >
                <div className={`p-4 rounded-xl ${portal.color} transition-transform group-hover:scale-110`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-forest transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {portal.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortalSelector;
