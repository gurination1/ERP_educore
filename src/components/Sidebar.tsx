import React from 'react';
import { ActiveScreen, User } from '../types';
import {
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Headphones,
  UserCheck,
  Users,
  Receipt,
  UserPlus,
  Award,
  FileText,
  BookOpen,
  Brain,
  FolderCheck,
  AlertCircle,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Building2,
  Briefcase,
  Bus,
  Shield,
  PhoneCall,
} from 'lucide-react';

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
      id: isSuperAdmin
        ? ('super-admin-dashboard' as ActiveScreen)
        : isAdmin
        ? ('admin-dashboard' as ActiveScreen)
        : role === 'hr'
        ? ('staff-management' as ActiveScreen)
        : role === 'partner'
        ? ('partner-portal' as ActiveScreen)
        : role === 'hostel'
        ? ('hostel-management' as any)
        : role === 'counselor'
        ? ('enquiries' as ActiveScreen)
        : role === 'accounts'
        ? ('fee-ledger' as ActiveScreen)
        : isFacultyOrCounselor
        ? ('staff-dashboard' as ActiveScreen)
        : ('student-dashboard' as ActiveScreen),
      label: isSuperAdmin
        ? 'Platform Overview'
        : isAdmin
        ? 'Provost / Admin'
        : role === 'hr'
        ? 'Faculty HRMS'
        : role === 'partner'
        ? 'Placements & Partners'
        : role === 'hostel'
        ? 'Hostel Command'
        : role === 'counselor'
        ? 'Admissions CRM'
        : role === 'hod'
        ? 'HOD Console'
        : role === 'staff'
        ? 'Faculty Console'
        : role === 'accounts'
        ? 'Accounts & Finance'
        : 'Dashboard',
      icon: 'dashboard',
      badge: isSuperAdmin ? 'Apex' : role === 'admin' ? 'Super' : undefined,
    },
    ...(isAdmin
      ? [
          {
            id: 'user-management' as ActiveScreen,
            label: 'User & Staff Roles',
            icon: 'manage_accounts',
            badge: 'Extreme',
          },
          {
            id: 'field-permissions' as ActiveScreen,
            label: 'Rights & Permissions',
            icon: 'security',
            badge: undefined,
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
      id: 'partner-portal' as ActiveScreen,
      label: 'Corporate Partners',
      icon: 'business',
      badge: undefined,
    },
    {
      id: 'enquiries' as ActiveScreen,
      label: 'Admissions CRM',
      icon: 'phone_in_talk',
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
      id: 'hostel-management' as any,
      label: 'Hostel & Residence',
      icon: 'apartment',
      badge: undefined,
    },
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

  const renderNavIcon = (id: string, isActive: boolean) => {
    const iconClass = `w-4 h-4 shrink-0 ${isActive ? 'text-[#00236f]' : 'text-[#757682]'}`;
    switch (id) {
      case 'super-admin-dashboard':
      case 'admin-dashboard':
        return <ShieldCheck className={iconClass} />;
      case 'staff-dashboard':
        return <UserCheck className={iconClass} />;
      case 'student-dashboard':
        return <LayoutDashboard className={iconClass} />;
      case 'user-management':
      case 'staff-management':
        return <Users className={iconClass} />;
      case 'field-permissions':
        return <Shield className={iconClass} />;
      case 'enquiries':
        return <PhoneCall className={iconClass} />;
      case 'partner-portal':
        return <Briefcase className={iconClass} />;
      case 'hostel-management':
        return <Building2 className={iconClass} />;
      case 'transport':
        return <Bus className={iconClass} />;
      case 'fee-ledger':
        return <Receipt className={iconClass} />;
      case 'admissions':
        return <UserPlus className={iconClass} />;
      case 'manage-students':
        return <GraduationCap className={iconClass} />;
      case 'scholarships':
        return <Award className={iconClass} />;
      case 'form-builder':
        return <FileText className={iconClass} />;
      case 'academics':
        return <BookOpen className={iconClass} />;
      case 'student-quiz-lms':
        return <Brain className={iconClass} />;
      case 'student-documents':
      case 'teacher-documents':
        return <FolderCheck className={iconClass} />;
      case 'grievances':
        return <AlertCircle className={iconClass} />;
      case 'reports':
        return <BarChart3 className={iconClass} />;
      case 'settings':
        return <SettingsIcon className={iconClass} />;
      default:
        return <LayoutDashboard className={iconClass} />;
    }
  };

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
              <GraduationCap className="w-6 h-6 text-white" />
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
                  {renderNavIcon(item.id, isActive)}
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
                alt={currentUser.full_name || currentUser.username}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-[#c5c5d3]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#00236f] text-white flex items-center justify-center text-xs font-bold">
                {(currentUser.full_name || currentUser.username || 'U')
                  .split(' ')
                  .filter(Boolean)
                  .map(n => n[0] || '')
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
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
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#ba1a1a] shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
