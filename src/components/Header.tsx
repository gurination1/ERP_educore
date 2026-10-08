import React, { useState, useRef, useEffect } from 'react';
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
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const displayUid = currentUser?.enterprise_uid || (
    currentUser?.role === 'super_admin'
      ? '9001-01-03-BFGI'
      : currentUser?.role === 'admin'
      ? '4001-01-03-BFGI'
      : currentUser?.role === 'staff'
      ? '2001-14-03-BFGI'
      : currentUser?.role === 'partner'
      ? '7001-01-03-BFGI'
      : '1001-88-03-BFGI'
  );

  const handleCopyUid = () => {
    if (displayUid) {
      navigator.clipboard.writeText(displayUid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  // Close drawers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDrawer(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;
  const isCounselor = currentUser?.role === 'counselor' || isAdmin;
  const isFaculty = currentUser?.role === 'staff' || isAdmin;

  const dashboardTarget: ActiveScreen =
    isAdmin
      ? 'admin-dashboard'
      : currentUser?.role === 'staff' || currentUser?.role === 'hod' || currentUser?.role === 'counselor'
      ? 'staff-dashboard'
      : currentUser?.role === 'partner'
      ? 'partner-portal'
      : 'student-dashboard';

  const menuSections = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      action: () => {
        onNavigate(dashboardTarget);
        setOpenDrawer(null);
      },
      isActive: activeScreen === 'admin-dashboard' || activeScreen === 'staff-dashboard' || activeScreen === 'student-dashboard',
    },
    {
      id: 'academics',
      label: 'ACADEMICS',
      action: () => {
        onNavigate('academics');
        setOpenDrawer(null);
      },
      isActive: activeScreen === 'academics',
    },
    {
      id: 'students',
      label: 'STUDENT LIFECYCLE',
      items: [
        { id: 'manage-students' as ActiveScreen, label: 'STUDENT DIRECTORY', badge: 'MASTER' },
        { id: 'student-documents' as ActiveScreen, label: 'REGULATORY DOCUMENTS VAULT', badge: 'AI VERIFIED' },
        { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT QUIZ & LMS ENGINE', badge: 'EXAM CELL' },
        { id: 'fee-ledger' as ActiveScreen, label: 'STUDENT FEE LEDGER', badge: 'FINANCE' },
        { id: 'grievances' as ActiveScreen, label: 'GRIEVANCE & DISPUTE CELL' },
      ],
      isActive: ['manage-students', 'student-documents', 'student-quiz-lms', 'fee-ledger', 'grievances'].includes(activeScreen as any),
    },
    {
      id: 'crm',
      label: 'CRM & ADMISSIONS',
      items: [
        { id: 'enquiries' as ActiveScreen, label: 'PRE-ADMISSION LEADS & ENQUIRIES', badge: 'RADAR 0-100%' },
        { id: 'bulk-import' as ActiveScreen, label: 'DYNAMIC BULK CSV MAPPER', badge: '3-TIER CHECK' },
        ...(isCounselor ? [{ id: 'admissions' as ActiveScreen, label: 'ADMISSION INTAKE DESK' }] : []),
      ],
      isActive: ['enquiries', 'bulk-import', 'admissions'].includes(activeScreen as any),
    },
    {
      id: 'staff',
      label: 'STAFF & HR',
      items: [
        { id: 'staff-management' as ActiveScreen, label: 'STAFF DIRECTORY & MULTI-TABLE PROFILE', badge: 'ORG JOURNEY' },
        ...(isFaculty ? [{ id: 'teacher-documents' as ActiveScreen, label: 'FACULTY CREDENTIALS VAULT', badge: 'DOSSIER' }] : []),
        { id: 'staff-academic-journey' as any, label: 'CAS RESEARCH & ACADEMIC DOSSIER', action: onOpenStaffJourney },
      ],
      isActive: activeScreen === 'staff-management' || activeScreen === 'teacher-documents',
    },
    {
      id: 'partners',
      label: 'HIRING PARTNERS',
      action: () => {
        onNavigate('partner-portal');
        setOpenDrawer(null);
      },
      isActive: activeScreen === 'partner-portal',
    },
    ...(isAdmin
      ? [
          {
            id: 'governance',
            label: 'ADMIN & GOVERNANCE',
            items: [
              { id: 'master-tables' as any, label: 'INSTITUTIONAL MASTER TABLES & TAGGING', badge: 'CANONICAL', action: onOpenMasterTables },
              { id: 'audit-trail' as any, label: 'CRYPTOGRAPHIC AUDIT TRAIL', badge: 'IMMUTABLE', action: onOpenAuditLogs },
              { id: 'user-management' as ActiveScreen, label: 'USER ACCOUNTS & APEX PRIVILEGES' },
              { id: 'scholarships' as ActiveScreen, label: 'SCHOLARSHIP DISBURSEMENT MATRIX' },
              { id: 'form-builder' as ActiveScreen, label: 'DYNAMIC FORM & SURVEY DESIGNER' },
              { id: 'reports' as ActiveScreen, label: 'INSTITUTIONAL MIS REPORTS' },
            ],
            isActive: ['user-management', 'scholarships', 'form-builder', 'reports'].includes(activeScreen as any),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#00236f] text-white border-b border-[#00174a] shadow-md select-none font-sans text-[11px]">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-2" ref={navRef}>
        {/* Left Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onNavigate(dashboardTarget)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
          >
            <div className="bg-[#ea580c] text-white font-black px-2 py-0.5 rounded text-[11px] tracking-wider">
              EDUCORE
            </div>
            <span className="font-bold tracking-tight text-[12px] text-white hidden sm:inline">
              CAMPUS ERP
            </span>
          </div>

          <span className="text-[#ea580c] text-[10px] font-mono hidden md:inline">
            [PUNJAB REGION]
          </span>
        </div>

        {/* Center Primary Nav (Pure Text-Based Drawers) */}
        <nav className="hidden lg:flex items-center gap-1">
          {menuSections.map(sec => {
            const isDrawerOpen = openDrawer === sec.id;
            const hasChildren = Boolean(sec.items && sec.items.length > 0);

            return (
              <div key={sec.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren) {
                      setOpenDrawer(isDrawerOpen ? null : sec.id);
                    } else if (sec.action) {
                      sec.action();
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded font-bold tracking-wide transition text-[10px] uppercase flex items-center gap-1 ${
                    sec.isActive || isDrawerOpen
                      ? 'bg-white text-[#00236f] shadow-xs'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{sec.label}</span>
                  {hasChildren && (
                    <span className="text-[8px] font-mono opacity-70">
                      {isDrawerOpen ? '▲' : '▼'}
                    </span>
                  )}
                </button>

                {/* Dropdown Drawer */}
                {hasChildren && isDrawerOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white text-[#00236f] border border-[#00236f]/30 rounded shadow-xl py-1.5 z-50 animate-fadeIn">
                    <div className="px-3 py-1 text-[9px] font-bold text-gray-400 border-b border-gray-100 uppercase tracking-wider">
                      {sec.label} MODULES
                    </div>

                    <div className="py-1">
                      {sec.items!.map((item: any) => (
                        <div
                          key={item.id || item.label}
                          onClick={() => {
                            if (item.action) {
                              item.action();
                            } else if (item.id) {
                              onNavigate(item.id);
                            }
                            setOpenDrawer(null);
                          }}
                          className={`px-3 py-1.5 text-[10px] font-semibold flex items-center justify-between cursor-pointer transition ${
                            activeScreen === item.id
                              ? 'bg-[#00236f]/10 text-[#00236f] font-bold'
                              : 'hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="bg-[#ea580c] text-white px-1.5 py-0.2 rounded text-[8px] font-mono font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 shrink-0 text-[10px]">
          {/* Canonical UID Copy Indicator */}
          <button
            onClick={handleCopyUid}
            title="Click to copy canonical Enterprise UID"
            className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded font-mono text-[9px] transition"
          >
            <span className="text-[#ea580c] font-bold">UID:</span>
            <span className="text-white font-bold">{displayUid}</span>
            <span className="text-white/70 ml-0.5">{copiedUid ? '[COPIED]' : '[COPY]'}</span>
          </button>

          {/* Role Badge */}
          <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-[#ea580c] text-white tracking-wider">
            {currentUser?.role === 'super_admin' ? 'APEX PROVOST' : currentUser?.role?.replace(/_/g, ' ') || 'GUEST'}
          </span>

          {/* Telephony Headset Toggle */}
          {onToggleTelephony && (
            <button
              onClick={onToggleTelephony}
              className={`px-2 py-1 rounded font-bold transition text-[9px] border ${
                isTelephonyOpen
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
              }`}
            >
              {isTelephonyOpen ? '[HEADSET: LIVE]' : '[HEADSET: OFF]'}
            </button>
          )}

          {/* AI Copilot */}
          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="px-2 py-1 bg-white text-[#00236f] hover:bg-white/90 font-bold rounded text-[9px] transition"
            >
              [AI COPILOT]
            </button>
          )}

          {/* Phone / Desktop View Mode Switcher */}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded font-bold text-[9px] text-white transition hidden sm:inline"
            >
              {viewMode === 'desktop' ? '[VIEW: DESKTOP]' : '[VIEW: PHONE]'}
            </button>
          )}

          {/* User Signout */}
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="px-2 py-1 bg-white/10 hover:bg-rose-600 border border-white/20 rounded font-bold text-[9px] text-white transition"
            >
              [LOGOUT]
            </button>
          )}
        </div>
      </div>

      {/* Secondary Mobile/Compact Drawer Bar for Small Screens */}
      <div className="lg:hidden bg-[#001c57] border-t border-white/10 px-3 py-1 flex overflow-x-auto gap-1 text-[9px] font-bold">
        {menuSections.map(sec => (
          <button
            key={sec.id}
            onClick={() => {
              if (sec.action) sec.action();
              else if (sec.items && sec.items[0]) {
                if (sec.items[0].action) sec.items[0].action();
                else onNavigate(sec.items[0].id);
              }
            }}
            className={`px-2 py-1 rounded whitespace-nowrap uppercase ${
              sec.isActive ? 'bg-[#ea580c] text-white' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>
    </header>
  );
};
