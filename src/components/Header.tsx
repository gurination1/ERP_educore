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
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      label: 'Dashboard',
      action: () => {
        onNavigate(dashboardTarget);
        setOpenDrawer(null);
      },
      isActive: ['admin-dashboard', 'staff-dashboard', 'student-dashboard'].includes(activeScreen as string),
    },
    {
      id: 'academics',
      label: 'Academics',
      action: () => {
        onNavigate('academics');
        setOpenDrawer(null);
      },
      isActive: activeScreen === 'academics',
    },
    {
      id: 'students',
      label: 'Student Lifecycle',
      items: [
        { id: 'manage-students' as ActiveScreen, label: 'Student Directory', badge: 'Master' },
        { id: 'student-documents' as ActiveScreen, label: 'Document Vault', badge: 'Verified' },
        { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz & LMS', badge: 'Exams' },
        { id: 'fee-ledger' as ActiveScreen, label: 'Fee Ledger', badge: 'Accounts' },
        { id: 'grievances' as ActiveScreen, label: 'Grievance Cell' },
      ],
      isActive: ['manage-students', 'student-documents', 'student-quiz-lms', 'fee-ledger', 'grievances'].includes(activeScreen as any),
    },
    {
      id: 'crm',
      label: 'Admissions CRM',
      items: [
        { id: 'enquiries' as ActiveScreen, label: 'Pre-Admission Leads', badge: 'Radar' },
        { id: 'bulk-import' as ActiveScreen, label: 'Bulk CSV Mapper', badge: '3-Tier' },
        ...(isCounselor ? [{ id: 'admissions' as ActiveScreen, label: 'Admission Desk' }] : []),
      ],
      isActive: ['enquiries', 'bulk-import', 'admissions'].includes(activeScreen as any),
    },
    {
      id: 'staff',
      label: 'Staff & HR',
      items: [
        { id: 'staff-management' as ActiveScreen, label: 'Staff HRMS Directory', badge: 'Profiles' },
        ...(isFaculty ? [{ id: 'teacher-documents' as ActiveScreen, label: 'Faculty Dossier Vault', badge: 'Verified' }] : []),
        { id: 'staff-academic-journey' as any, label: 'CAS Research Dossier', action: onOpenStaffJourney },
      ],
      isActive: ['staff-management', 'teacher-documents'].includes(activeScreen as any),
    },
    {
      id: 'partners',
      label: 'Hiring Partners',
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
            label: 'Governance',
            items: [
              { id: 'master-tables' as any, label: 'Institutional Master Tables', badge: 'Canonical', action: onOpenMasterTables },
              { id: 'audit-trail' as any, label: 'Cryptographic Audit Trail', badge: 'Logs', action: onOpenAuditLogs },
              { id: 'user-management' as ActiveScreen, label: 'User Accounts & Roles' },
              { id: 'scholarships' as ActiveScreen, label: 'Scholarship Matrix' },
              { id: 'form-builder' as ActiveScreen, label: 'Dynamic Form Builder' },
              { id: 'reports' as ActiveScreen, label: 'Institutional MIS Reports' },
            ],
            isActive: ['user-management', 'scholarships', 'form-builder', 'reports'].includes(activeScreen as any),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 select-none font-sans transition-all duration-200 apple-glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3" ref={navRef}>
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(dashboardTarget)}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00236f] to-[#001744] flex items-center justify-center text-white font-extrabold text-xs shadow-sm ring-1 ring-black/5 group-hover:scale-105 transition-transform">
              <span className="tracking-tighter">EC</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[13px] tracking-tight text-[#00236f] leading-none">
                EduCore
              </span>
              <span className="text-[10px] font-semibold text-slate-500 tracking-tight leading-tight mt-0.5">
                BFGI Enterprise
              </span>
            </div>
          </button>

          <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-orange-50 text-[#ea580c] border border-orange-200/60 font-mono">
            PUNJAB • 03
          </span>
        </div>

        {/* Center: Apple-style Segmented Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/70 shadow-xs">
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
                  className={`px-3 py-1 rounded-full font-medium transition-all text-[11px] tracking-tight flex items-center gap-1 cursor-pointer ${
                    sec.isActive || isDrawerOpen
                      ? 'bg-white text-[#00236f] font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{sec.label}</span>
                  {hasChildren && (
                    <span className="text-[8px] text-slate-400 ml-0.5 font-bold">
                      {isDrawerOpen ? '▴' : '▾'}
                    </span>
                  )}
                </button>

                {/* Glassmorphic Dropdown Drawer */}
                {hasChildren && isDrawerOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 apple-glass-dropdown rounded-2xl p-1.5 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                      {sec.label} Hub
                    </div>

                    <div className="py-1 space-y-0.5">
                      {sec.items!.map((item: any) => (
                        <button
                          key={item.id || item.label}
                          type="button"
                          onClick={() => {
                            if (item.action) {
                              item.action();
                            } else if (item.id) {
                              onNavigate(item.id);
                            }
                            setOpenDrawer(null);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-[11px] font-medium flex items-center justify-between cursor-pointer transition text-left ${
                            activeScreen === item.id
                              ? 'bg-blue-50 text-[#00236f] font-bold'
                              : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded-full text-[8px] font-mono font-bold tracking-tight shadow-2xs">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: User Utility & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Canonical UID Copy Pill */}
          <button
            type="button"
            onClick={handleCopyUid}
            title="Click to copy canonical Enterprise UID"
            className="flex items-center gap-1.5 px-3 py-1 bg-white/90 hover:bg-white border border-slate-200/80 rounded-full font-mono text-[10px] text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <span className="text-[#ea580c] font-bold">UID</span>
            <span className="font-semibold text-slate-900">{displayUid}</span>
            <span className="text-slate-400 text-[9px]">
              {copiedUid ? '✓ Copied' : 'Copy'}
            </span>
          </button>

          {/* Role Pill */}
          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00236f] text-white shadow-2xs tracking-wide uppercase">
            {currentUser?.role === 'super_admin'
              ? 'Apex Provost'
              : currentUser?.role?.replace(/_/g, ' ') || 'Guest'}
          </span>

          {/* Telephony CRM Switch */}
          {onToggleTelephony && (
            <button
              type="button"
              onClick={onToggleTelephony}
              className={`hidden md:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold transition border cursor-pointer ${
                isTelephonyOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isTelephonyOpen ? 'Telephony: Live' : 'Telephony'}
            </button>
          )}

          {/* AI Copilot Action */}
          {onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              className="px-3 py-1 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-full text-[10px] transition shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>AI Copilot</span>
            </button>
          )}

          {/* Sign Out Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              Sign Out
            </button>
          )}

          {/* Mobile Navigation Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Responsive Website Navigation) */}
      {mobileMenuOpen && (
        <div className="lg:hidden apple-glass-dropdown border-t border-slate-200/80 px-4 py-3 space-y-2 animate-fadeIn">
          {menuSections.map(sec => (
            <div key={sec.id} className="py-1 border-b border-slate-100 last:border-b-0">
              {sec.action ? (
                <button
                  type="button"
                  onClick={() => {
                    sec.action();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left font-bold text-xs py-1.5 text-[#00236f]"
                >
                  {sec.label}
                </button>
              ) : (
                <>
                  <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider py-1">
                    {sec.label}
                  </div>
                  <div className="grid grid-cols-2 gap-1 py-1">
                    {sec.items?.map((item: any) => (
                      <button
                        key={item.id || item.label}
                        type="button"
                        onClick={() => {
                          if (item.action) item.action();
                          else if (item.id) onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className="text-left text-xs text-slate-700 hover:text-black py-1 px-2 rounded-lg hover:bg-slate-100/70"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
