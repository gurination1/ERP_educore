import React, { useState } from 'react';
import { User, ActiveScreen } from '../types';

interface HeaderProps {
  currentUser: User | null;
  activeScreen?: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCopilot?: () => void;
  onLogout?: () => void;
  onToggleTelephony?: () => void;
  isTelephonyOpen?: boolean;
  onOpenAuditLogs?: () => void;
  onOpenMasterTables?: () => void;
  onOpenStaffJourney?: () => void;
  viewMode?: 'desktop' | 'mobile-phone';
  onToggleViewMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeScreen,
  onNavigate,
  searchQuery,
  onSearchChange,
  onOpenCopilot,
  onLogout,
  onToggleTelephony,
  isTelephonyOpen,
  onOpenAuditLogs,
  onOpenMasterTables,
  onOpenStaffJourney,
  viewMode = 'desktop',
  onToggleViewMode,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const displayUid = currentUser?.enterprise_uid || (
    currentUser?.role === 'super_admin'
      ? '9001-03-BFGI-000001'
      : currentUser?.role === 'admin'
      ? '4001-03-BFGI-0001'
      : currentUser?.role === 'staff'
      ? '2001-03-BFGI-0014'
      : '1001-03-BFGI-260088'
  );

  const handleCopyUid = () => {
    if (displayUid) {
      navigator.clipboard.writeText(displayUid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdminOrSuper = currentUser?.role === 'admin' || isSuperAdmin;
  const isFacultyOrAdmin = currentUser?.role === 'staff' || isAdminOrSuper;

  const navKeys: { id: ActiveScreen; label: string; icon: string; badge?: string }[] = [
    {
      id: isAdminOrSuper ? 'admin-dashboard' : currentUser?.role === 'staff' ? 'staff-dashboard' : 'student-dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
    },
    {
      id: 'academics',
      label: 'Academics',
      icon: 'school',
    },
    {
      id: 'student-quiz-lms',
      label: 'LMS & Quiz',
      icon: 'psychology',
      badge: 'CBT',
    },
    {
      id: 'student-documents',
      label: 'Student Vault',
      icon: 'folder_shared',
    },
    ...(isFacultyOrAdmin
      ? [
          {
            id: 'teacher-documents' as ActiveScreen,
            label: 'Faculty Vault',
            icon: 'workspace_premium',
          },
        ]
      : []),
    {
      id: 'fee-ledger',
      label: 'Fees',
      icon: 'receipt_long',
    },
    ...(isAdminOrAdminStaff(currentUser?.role)
      ? [
          {
            id: 'manage-students' as ActiveScreen,
            label: 'Students',
            icon: 'group',
          },
          {
            id: 'admissions' as ActiveScreen,
            label: 'Intake',
            icon: 'how_to_reg',
          },
        ]
      : []),
    ...(isAdminOrSuper
      ? [
          {
            id: 'user-management' as ActiveScreen,
            label: 'Governance',
            icon: 'manage_accounts',
            badge: isSuperAdmin ? 'Apex' : undefined,
          },
        ]
      : []),
  ];

  function isAdminOrAdminStaff(role?: string) {
    return ['admin', 'super_admin', 'staff', 'counselor', 'hod'].includes(role || '');
  }

  return (
    <header
      id="educore-topbar"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#e1e3e4] px-3 sm:px-5 py-2 flex flex-col gap-2 shadow-xs"
    >
      {/* Top Strip: Dynamic Island, Global Spotlight & Quick Utilities */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand + Dynamic Island Enterprise Capsule */}
        <div className="flex items-center gap-2.5">
          {/* Logo Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00236f] to-[#1e3a8a] text-white flex items-center justify-center font-black text-sm shadow-xs border border-[#b6c4ff]/30">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div className="hidden sm:block leading-none">
              <span className="text-sm font-black tracking-tight text-[#191c1d]">EduCore</span>
              <span className="block text-[9px] font-bold text-[#006a61] uppercase tracking-wider">MRSPTU ERP</span>
            </div>
          </div>

          {/* Dynamic Island Capsule Pill (Enterprise UID) */}
          <button
            type="button"
            onClick={handleCopyUid}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-all cursor-pointer select-none ${
              isSuperAdmin
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs ring-1 ring-amber-300/40'
                : 'bg-[#f3f4f5] border-[#e1e3e4] text-[#191c1d] hover:bg-[#eceef0]'
            }`}
            title="Click to copy canonical Enterprise UID"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isSuperAdmin && <span className="text-amber-500">👑</span>}
            <span className="tracking-tight">{displayUid}</span>
            <span className="text-[9px] text-[#757682] uppercase ml-0.5">
              {copiedUid ? '✓ Copied' : 'UID'}
            </span>
          </button>
        </div>

        {/* Center: Search Field */}
        <div className="relative hidden lg:block w-64 xl:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-[16px]">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Spotlight search (Ctrl+K)..."
            className="w-full pl-8 pr-3 py-1 bg-[#f3f4f5] border border-transparent rounded-full text-xs text-[#191c1d] placeholder-[#757682] focus:bg-white focus:border-[#00236f]/30 focus:outline-none transition-all"
          />
        </div>

        {/* Right: Action Keys & Device Mode Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Phone vs Desktop Prototype Toggle Key */}
          {onToggleViewMode && (
            <button
              type="button"
              id="header-view-mode-toggle-btn"
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                viewMode === 'mobile-phone'
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white border-purple-900 ring-2 ring-purple-300'
                  : 'bg-white hover:bg-slate-50 text-[#191c1d] border-[#e1e3e4]'
              }`}
              title="Toggle between Mobile Native App Prototype (iPhone 16) and Desktop Web Portal"
            >
              <span className="material-symbols-outlined text-[15px]">
                {viewMode === 'mobile-phone' ? 'phone_iphone' : 'desktop_windows'}
              </span>
              <span className="hidden sm:inline">
                {viewMode === 'mobile-phone' ? 'iPhone App Mode' : 'Web Portal'}
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-black/10 rounded font-mono">
                {viewMode === 'mobile-phone' ? 'NATIVE' : 'REACT'}
              </span>
            </button>
          )}

          {/* CTI CallKit Key */}
          {onToggleTelephony && (
            <button
              type="button"
              id="header-telephony-switch-btn"
              onClick={onToggleTelephony}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                isTelephonyOpen
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Toggle iPhone-Style CTI CallKit Dialer"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span className="hidden xl:inline">CallKit</span>
            </button>
          )}

          {/* Audit Trail Drawer Key */}
          {isAdminOrSuper && onOpenAuditLogs && (
            <button
              type="button"
              id="header-audit-trail-btn"
              onClick={onOpenAuditLogs}
              className="p-1.5 sm:px-2.5 sm:py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Universal Immutable Cryptographic Audit Trail"
            >
              <span className="material-symbols-outlined text-[16px] text-[#00236f]">verified_user</span>
              <span className="hidden xl:inline">Audit Trail</span>
            </button>
          )}

          {/* Master Registry Tables Key */}
          {onOpenMasterTables && (
            <button
              type="button"
              id="header-master-tables-btn"
              onClick={onOpenMasterTables}
              className="p-1.5 sm:px-2.5 sm:py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Tenant-Agnostic GST States & CBCS Master Tables"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-700">account_balance</span>
              <span className="hidden xl:inline">Master Registry</span>
            </button>
          )}

          {/* Faculty R&D Key */}
          {onOpenStaffJourney && (
            <button
              type="button"
              id="header-staff-journey-btn"
              onClick={onOpenStaffJourney}
              className="p-1.5 sm:px-2.5 sm:py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Faculty Academic Journey & Scopus / Patent Metrics"
            >
              <span className="material-symbols-outlined text-[16px] text-purple-700">school</span>
              <span className="hidden xl:inline">Faculty R&D</span>
            </button>
          )}

          {/* AI Copilot Key */}
          {onOpenCopilot && (
            <button
              id="ai-copilot-btn"
              type="button"
              onClick={onOpenCopilot}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#00236f] to-[#1a4bb0] text-white text-xs font-bold rounded-full shadow-xs hover:brightness-110 transition-all cursor-pointer"
              title="Ask EduCore AI Campus Copilot"
            >
              <span className="material-symbols-outlined text-[15px] text-amber-300">smart_toy</span>
              <span className="hidden sm:inline">Copilot</span>
            </button>
          )}

          {/* User Profile Pill */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-[#e1e3e4]">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-[#c5c5d3]"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser ? currentUser.full_name.charAt(0) : 'U'}
              </div>
            )}
            <span className="hidden md:inline text-xs font-bold text-[#191c1d] max-w-[100px] truncate">
              {currentUser?.full_name?.split(' ')[0] || 'User'}
            </span>
          </div>

          {/* Logout Key */}
          {onLogout && (
            <button
              id="header-logout-btn"
              type="button"
              onClick={onLogout}
              className="w-7 h-7 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-bold transition-all cursor-pointer"
              title="Log Out of EduCore"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Strip: Header-Based Primary Navigation Keys */}
      <nav
        aria-label="Header Navigation Command Center"
        className="flex items-center gap-1 overflow-x-auto py-0.5 border-t border-[#f3f4f5] scrollbar-none"
      >
        {navKeys.map(key => {
          const isActive = activeScreen === key.id;
          return (
            <button
              key={key.id}
              type="button"
              onClick={() => onNavigate(key.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-[#444651] hover:text-[#191c1d] hover:bg-[#f3f4f5]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{key.icon}</span>
              <span>{key.label}</span>
              {key.badge && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {key.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
