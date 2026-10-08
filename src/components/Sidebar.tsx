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
  const role = currentUser?.role;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isFacultyOrCounselor = role === 'staff' || role === 'counselor' || role === 'hod';
  const isStaffOrAdmin = ['admin', 'super_admin', 'staff', 'counselor', 'hod', 'accounts'].includes(role || '');
  const canManageIntake = ['admin', 'super_admin', 'staff', 'counselor', 'hod'].includes(role || '');

  const navItems = [
    {
      id: isAdmin
        ? ('admin-dashboard' as ActiveScreen)
        : isFacultyOrCounselor
        ? ('staff-dashboard' as ActiveScreen)
        : ('student-dashboard' as ActiveScreen),
      label: isAdmin
        ? 'Provost / Admin'
        : role === 'counselor'
        ? 'Counselor Desk'
        : role === 'hod'
        ? 'HOD Console'
        : role === 'staff'
        ? 'Faculty Console'
        : role === 'accounts'
        ? 'Accounts & Finance'
        : 'Dashboard',
      icon: isAdmin
        ? 'admin_panel_settings'
        : role === 'counselor'
        ? 'support_agent'
        : role === 'hod'
        ? 'supervisor_account'
        : role === 'staff'
        ? 'co_present'
        : role === 'accounts'
        ? 'account_balance'
        : 'dashboard',
      badge: role === 'admin' ? 'Super' : isFacultyOrCounselor ? 'Active' : undefined,
    },
    ...(isAdmin
      ? [
          {
            id: 'user-management' as ActiveScreen,
            label: 'User & Staff Roles',
            icon: 'manage_accounts',
            badge: 'Extreme',
          },
        ]
      : []),
    {
      id: 'fee-ledger' as ActiveScreen,
      label: 'Fee Ledger',
      icon: 'receipt_long',
      badge: undefined,
    },
    {
      id: 'admissions' as ActiveScreen,
      label: canManageIntake ? 'Admissions & Intake' : 'Admissions',
      icon: 'edit_document',
      badge: 'Active',
    },
    ...(canManageIntake || isAdmin
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
      label: isStaffOrAdmin ? 'Form Builder' : 'Dynamic Forms',
      icon: 'dynamic_form',
      badge: undefined,
    },
    {
      id: 'academics' as ActiveScreen,
      label: 'Academics',
      icon: 'menu_book',
      badge: undefined,
    },
    {
      id: 'student-quiz-lms' as ActiveScreen,
      label: 'LMS & Quiz CBT',
      icon: 'psychology',
      badge: 'CBT',
    },
    {
      id: 'student-documents' as ActiveScreen,
      label: 'Student Docs Vault',
      icon: 'folder_shared',
      badge: '85%',
    },
    ...(isStaffOrAdmin
      ? [
          {
            id: 'teacher-documents' as ActiveScreen,
            label: 'Faculty Docs Vault',
            icon: 'workspace_premium',
            badge: 'AICTE',
          },
        ]
      : []),
    {
      id: 'grievances' as ActiveScreen,
      label: 'Grievance Cell',
      icon: 'report_problem',
      badge: undefined,
    },
    ...(isStaffOrAdmin
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
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-[#ea580c] font-bold">[{item.id.slice(0, 3).toUpperCase()}]</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#ea580c] text-white rounded">
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
          
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
