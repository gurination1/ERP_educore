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
      label: 'Home',
      action: () => {
        onNavigate(dashboardTarget);
        setOpenDrawer(null);
      },
      isActive: ['admin-dashboard', 'staff-dashboard', 'student-dashboard'].includes(activeScreen as string),
    },
    {
      id: 'academics',
      label: 'Examination & Academics',
      items: [
        { id: 'academics' as ActiveScreen, label: 'CBCS Syllabi & Datesheet', badge: 'MRSPTU' },
        { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz LMS & Exams', badge: 'Active' },
        { id: 'academics' as ActiveScreen, label: 'Evaluation & Sessional Scheme' },
      ],
      isActive: ['academics', 'student-quiz-lms'].includes(activeScreen as any),
    },
    {
      id: 'students',
      label: 'Student Lifecycle',
      items: [
        { id: 'manage-students' as ActiveScreen, label: 'Student Master Directory', badge: 'Master' },
        { id: 'student-documents' as ActiveScreen, label: 'Document Vault (85% Domicile)', badge: 'Verified' },
        { id: 'fee-ledger' as ActiveScreen, label: 'Tuition Assessment & Ledger', badge: 'Finance' },
        { id: 'scholarships' as ActiveScreen, label: 'State & Merit Scholarships' },
        { id: 'grievances' as ActiveScreen, label: 'Statutory Grievance Cell' },
      ],
      isActive: ['manage-students', 'student-documents', 'fee-ledger', 'scholarships', 'grievances'].includes(activeScreen as any),
    },
    {
      id: 'crm',
      label: 'Admissions CRM',
      items: [
        { id: 'enquiries' as ActiveScreen, label: 'Pre-Admission Leads Radar', badge: 'Radar' },
        { id: 'bulk-import' as ActiveScreen, label: '3-Tier Bulk CSV Mapper', badge: 'Verify' },
        ...(isCounselor ? [{ id: 'admissions' as ActiveScreen, label: 'Admissions Counter Desk' }] : []),
        { id: 'form-builder' as ActiveScreen, label: 'Application Form Builder' },
      ],
      isActive: ['enquiries', 'bulk-import', 'admissions', 'form-builder'].includes(activeScreen as any),
    },
    {
      id: 'staff',
      label: 'Staff & HRMS',
      items: [
        { id: 'staff-management' as ActiveScreen, label: 'Faculty & HRMS Directory', badge: 'Roster' },
        ...(isFaculty ? [{ id: 'teacher-documents' as ActiveScreen, label: 'Faculty Dossier Vault', badge: 'Verified' }] : []),
        { id: 'staff-academic-journey' as any, label: 'CAS Research Publications', action: onOpenStaffJourney },
      ],
      isActive: ['staff-management', 'teacher-documents'].includes(activeScreen as any),
    },
    {
      id: 'partners',
      label: 'Placements & Partners',
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
            label: 'Governance & Audits',
            items: [
              { id: 'master-tables' as any, label: 'Institutional Master Tables', badge: 'Canonical', action: onOpenMasterTables },
              { id: 'audit-trail' as any, label: 'Cryptographic Audit Trail', badge: 'Logs', action: onOpenAuditLogs },
              { id: 'user-management' as ActiveScreen, label: 'User Accounts & Roles' },
              { id: 'reports' as ActiveScreen, label: 'Institutional MIS Reports' },
            ],
            isActive: ['user-management', 'reports'].includes(activeScreen as any),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 select-none font-sans shadow-md" ref={navRef}>
      {/* TIER 1: Sleek Masthead (Height: 40px) */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 h-10 flex items-center justify-between gap-3 text-xs">
        {/* Left: University & Campus Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(dashboardTarget)}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-[#00236f] flex items-center justify-center text-white font-extrabold text-[11px] shadow-xs ring-1 ring-black/5 group-hover:scale-105 transition-transform">
              <span className="tracking-tighter">BFGI</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-xs tracking-tight text-[#00236f]">
                  EduCore Enterprise
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">•</span>
                <span className="text-[10px] font-semibold text-slate-600 tracking-tight">
                  MRSPTU Affiliated
                </span>
              </div>
              <span className="text-[9px] font-medium text-slate-400 leading-tight">
                Baba Farid Group of Institutions • Punjab (03)
              </span>
            </div>
          </button>
        </div>

        {/* Center: High-Density Search Input */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="w-full relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search student UID, marks, fees, circulars... ⌘K"
              className="w-full h-7 pl-3 pr-8 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-[11px] font-medium text-slate-800 rounded-lg border border-slate-200/70 focus:outline-none focus:ring-1 focus:ring-[#00236f] transition-all"
            />
            <span className="absolute right-2 top-1.5 text-[9px] font-mono font-semibold text-slate-400">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Operational Controls & Canonical UID */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Canonical UID Copy Badge */}
          <button
            type="button"
            onClick={handleCopyUid}
            title="Click to copy canonical Enterprise UID"
            className="flex items-center gap-1.5 h-6 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-mono text-[10px] text-slate-700 transition cursor-pointer"
          >
            <span className="text-[#ea580c] font-bold">UID</span>
            <span className="font-semibold text-slate-900">{displayUid}</span>
            <span className="text-slate-400 text-[9px]">
              {copiedUid ? '✓' : 'Copy'}
            </span>
          </button>

          {/* Role Pill */}
          <span className="hidden sm:inline-flex h-6 items-center px-2 rounded text-[9px] font-bold bg-[#00236f] text-white tracking-wider uppercase">
            {currentUser?.role === 'super_admin'
              ? 'Apex Provost'
              : currentUser?.role?.replace(/_/g, ' ') || 'Guest'}
          </span>

          {/* Telephony CRM Switch */}
          {onToggleTelephony && (
            <button
              type="button"
              onClick={onToggleTelephony}
              className={`hidden lg:inline-flex h-6 items-center px-2 rounded text-[10px] font-bold transition border cursor-pointer ${
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
              className="h-6 px-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded text-[10px] transition shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>AI Copilot</span>
            </button>
          )}

          {/* Sign Out Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="h-6 px-2 rounded text-[10px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              Sign Out
            </button>
          )}

          {/* Mobile Navigation Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* TIER 2: MRSPTU-Style Horizontal Examination Navigation Bar (Height: 34px) */}
      <nav className="mrsptu-nav-bar hidden lg:flex items-center px-4 sm:px-6 h-8 text-[11px] font-medium">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-0.5">
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
                    className={`mrsptu-nav-item h-8 px-3.5 flex items-center gap-1 font-semibold tracking-tight cursor-pointer ${
                      sec.isActive ? 'active' : ''
                    }`}
                  >
                    <span>{sec.label}</span>
                    {hasChildren && (
                      <span className="text-[8px] opacity-70 ml-0.5">
                        {isDrawerOpen ? '▴' : '▾'}
                      </span>
                    )}
                  </button>

                  {/* Glassmorphic Dropdown Drawer */}
                  {hasChildren && isDrawerOpen && (
                    <div className="absolute top-full left-0 w-64 apple-glass-dropdown rounded-b-xl rounded-tr-xl p-1.5 z-50 animate-fadeIn text-slate-800">
                      <div className="px-3 py-1 text-[9px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                        {sec.label}
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
                            className={`w-full px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between cursor-pointer transition text-left ${
                              activeScreen === item.id
                                ? 'bg-blue-50 text-[#00236f] font-bold'
                                : 'text-slate-700 hover:bg-slate-100/90 hover:text-black'
                            }`}
                          >
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="bg-[#ea580c] text-white px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-tight">
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
          </div>

          {/* Right Status Pill */}
          <div className="hidden xl:flex items-center gap-2 text-white/80 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span>MRSPTU Examination Portal • CBCS 2025-26</span>
          </div>
        </div>
      </nav>

      {/* TIER 3: Institutional Notice Ticker (Height: 24px - MRSPTU Marquee Upgrade) */}
      <div className="mrsptu-ticker-container h-6 flex items-center px-3 sm:px-6 text-[10px]">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3 overflow-hidden">
          {/* Fixed Alert Tag */}
          <div className="flex items-center gap-1.5 shrink-0 z-10 bg-[#001744] pr-2">
            <span className="bg-[#ea580c] text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-2xs">
              MRSPTU GAZETTE
            </span>
          </div>

          {/* Marquee Track */}
          <div className="flex-1 overflow-hidden relative">
            <div className="mrsptu-ticker-track text-slate-200">
              <span className="mx-6 text-orange-200 font-semibold">
                ★ Amendment – VII to Final Date sheet for semester examinations May-2026 released by Controller of Examinations
              </span>
              <span className="mx-6 text-slate-300">
                • MRSPTU Convocation Merit List Published • Check Student Dossier Vault
              </span>
              <span className="mx-6 text-slate-300">
                • CBCS Regulations 2025-26 Curricular Scheme & External Assessment Active
              </span>
              <span className="mx-6 text-emerald-300 font-semibold">
                • Campus Placement Drive with Infosys & TCS Verified for 2026 Batch
              </span>
              <span className="mx-6 text-slate-300">
                • Odd-Semester Tuition Clearance & Exam Hall Ticket Generation Open
              </span>
              {/* Duplicate track for seamless infinite scroll */}
              <span className="mx-6 text-orange-200 font-semibold">
                ★ Amendment – VII to Final Date sheet for semester examinations May-2026 released by Controller of Examinations
              </span>
              <span className="mx-6 text-slate-300">
                • MRSPTU Convocation Merit List Published • Check Student Dossier Vault
              </span>
            </div>
          </div>

          {/* Quick Notice Action */}
          <div className="shrink-0 z-10 bg-[#001744] pl-2 hidden sm:block">
            <button
              type="button"
              onClick={() => onNavigate('academics')}
              className="text-[#ea580c] hover:text-orange-300 font-bold text-[9px] uppercase tracking-wider hover:underline cursor-pointer"
            >
              [View Scheme &rarr;]
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden apple-glass-dropdown border-t border-slate-200/80 px-4 py-3 space-y-2 animate-fadeIn max-h-[80vh] overflow-y-auto">
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
