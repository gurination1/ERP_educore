import React from 'react';
import { ActiveScreen, User } from '../types';

interface SidebarProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  currentUser,
  onLogout,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    {
      id: isAdmin ? ('admin-dashboard' as ActiveScreen) : ('student-dashboard' as ActiveScreen),
      label: 'Dashboard',
      icon: 'dashboard',
      badge: undefined,
    },
    {
      id: 'fee-ledger' as ActiveScreen,
      label: 'Fee Ledger',
      icon: 'receipt_long',
      badge: undefined,
    },
    {
      id: 'admissions' as ActiveScreen,
      label: 'Admissions',
      icon: 'edit_document',
      badge: 'New',
    },
    ...(isAdmin
      ? [
          {
            id: 'manage-students' as ActiveScreen,
            label: 'Manage Students',
            icon: 'group',
            badge: undefined,
          },
        ]
      : []),
    {
      id: 'scholarships' as ActiveScreen,
      label: 'Scholarships & Schemes',
      icon: 'workspace_premium',
      badge: undefined,
    },
    {
      id: 'form-builder' as ActiveScreen,
      label: isAdmin ? 'Form Builder' : 'Dynamic Forms',
      icon: 'dynamic_form',
      badge: undefined,
    },
    {
      id: 'academics' as ActiveScreen,
      label: 'Academics',
      icon: 'menu_book',
      badge: undefined,
    },
    ...(isAdmin
      ? [
          {
            id: 'reports' as ActiveScreen,
            label: 'Reports',
            icon: 'analytics',
            badge: undefined,
          },
        ]
      : []),
    {
      id: 'settings' as ActiveScreen,
      label: 'Settings',
      icon: 'settings',
      badge: undefined,
    },
  ];

  return (
    <aside
      id="educore-sidebar"
      className="w-64 bg-[#f8f9fa] border-r border-[#e1e3e4] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30"
    >
      {/* Brand & Logo Section */}
      <div>
        <div className="p-6 border-b border-[#e1e3e4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00236f] flex items-center justify-center text-white shadow-sm font-bold text-lg">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#191c1d] leading-none">
                EduCore
              </h1>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#00236f] mt-1">
                College Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items list */}
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#dce1ff] text-[#00236f] font-semibold'
                    : 'text-[#444651] hover:bg-[#edeeef] hover:text-[#191c1d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'filled text-[#00236f]' : 'text-[#757682]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#006a61] text-white rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer / Log Out */}
      <div className="p-4 border-t border-[#e1e3e4] space-y-2">
        {currentUser && (
          <div className="flex items-center gap-3 px-3 py-2 bg-[#ffffff] rounded-lg border border-[#e1e3e4] shadow-xs">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-[#c5c5d3]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#00236f] text-white flex items-center justify-center text-xs font-bold">
                {currentUser.full_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#191c1d] truncate">
                {currentUser.full_name}
              </p>
              <p className="text-[10px] uppercase font-bold text-[#00236f]">
                {currentUser.role}
              </p>
            </div>
          </div>
        )}

        <button
          id="logout-button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
