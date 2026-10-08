import React, { useState, useRef, useEffect } from 'react';
import { User, ActiveScreen } from '../types';

interface HeaderProps {
  currentUser: User | null;
  activeScreen?: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCopilot?: () => void;
  onLogout?: () => void;
  onToggleTelephony?: () => void;
  isTelephonyOpen?: boolean;
  onOpenAuditLogs?: () => void;
  onOpenMasterTables?: () => void;
  onOpenStaffJourney?: () => void;
  onOpenAdmitCard?: () => void;
  viewMode?: 'desktop' | 'mobile-phone';
  onToggleViewMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeScreen,
  onNavigate,
  canGoBack,
  onGoBack,
  searchQuery,
  onSearchChange,
  onOpenCopilot,
  onLogout,
  onToggleTelephony,
  isTelephonyOpen,
  onOpenAuditLogs,
  onOpenMasterTables,
  onOpenStaffJourney,
  onOpenAdmitCard,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pure Digit Canonical UID (No alphabetic text, strict 10 digits formatted)
  const rawUid = currentUser?.enterprise_uid || (
    currentUser?.role === 'super_admin'
      ? '9001-01-03-01'
      : currentUser?.role === 'admin'
      ? '4001-01-03-01'
      : currentUser?.role === 'staff'
      ? '2001-14-03-01'
      : currentUser?.role === 'partner'
      ? '7001-01-03-01'
      : '1001-88-03-01'
  );
  const displayUid = rawUid.replace(/BFGI/g, '01');

  const handleCopyUid = () => {
    if (displayUid) {
      navigator.clipboard.writeText(displayUid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleMouseEnter = (id: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenDrawer(id);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpenDrawer(null);
    }, 180);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDrawer(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
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
      id: 'examination',
      label: 'Examination',
      items: [
        { id: 'academics' as ActiveScreen, label: 'Regular Examination Form' },
        { id: 'academics' as ActiveScreen, label: 'Reappear / Backlog Form' },
        { id: 'admit-card' as any, label: 'Admit Card / Hall Ticket', action: onOpenAdmitCard || (() => onNavigate('academics')) },
        { id: 'academics' as ActiveScreen, label: 'Datesheet & Examination Timetable' },
        { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz & Examination LMS' },
        { id: 'fee-ledger' as ActiveScreen, label: 'Fee Clearance for Examination' },
      ],
      isActive: ['academics', 'student-quiz-lms'].includes(activeScreen as any),
    },
    {
      id: 'academics',
      label: 'Academics',
      items: [
        { id: 'academics' as ActiveScreen, label: 'Choice Based Credit System (CBCS)' },
        { id: 'academics' as ActiveScreen, label: 'Evaluation & Sessional Scheme' },
        { id: 'student-quiz-lms' as ActiveScreen, label: 'Continuous Assessment (CA) Quiz' },
        { id: 'academics' as ActiveScreen, label: 'Curriculum Syllabi Archive' },
      ],
      isActive: ['academics'].includes(activeScreen as any),
    },
    {
      id: 'students',
      label: 'Students',
      items: [
        { id: 'manage-students' as ActiveScreen, label: 'Student Master Directory' },
        { id: 'student-documents' as ActiveScreen, label: 'Regulatory Document Compliance Vault' },
        { id: 'fee-ledger' as ActiveScreen, label: 'Tuition Fee Assessment & Ledger' },
        { id: 'scholarships' as ActiveScreen, label: 'State & Merit Scholarships' },
        { id: 'grievances' as ActiveScreen, label: 'Statutory Grievance Redressal' },
      ],
      isActive: ['manage-students', 'student-documents', 'fee-ledger', 'scholarships', 'grievances'].includes(activeScreen as any),
    },
    {
      id: 'crm',
      label: 'Admissions',
      items: [
        { id: 'enquiries' as ActiveScreen, label: 'Pre-Admission Leads Radar' },
        { id: 'bulk-import' as ActiveScreen, label: 'Bulk Lead CSV / Excel Mapper' },
        ...(isCounselor ? [{ id: 'admissions' as ActiveScreen, label: 'Admissions Counter Desk' }] : []),
        { id: 'form-builder' as ActiveScreen, label: 'Application Form Builder' },
      ],
      isActive: ['enquiries', 'bulk-import', 'admissions', 'form-builder'].includes(activeScreen as any),
    },
    {
      id: 'staff',
      label: 'Faculty & HR',
      items: [
        { id: 'staff-management' as ActiveScreen, label: 'Faculty & HRMS Directory' },
        ...(isFaculty ? [{ id: 'teacher-documents' as ActiveScreen, label: 'Faculty Dossier Vault' }] : []),
        { id: 'staff-academic-journey' as any, label: 'CAS Research Publications & Patents', action: onOpenStaffJourney },
      ],
      isActive: ['staff-management', 'teacher-documents'].includes(activeScreen as any),
    },
    {
      id: 'partners',
      label: 'Placements',
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
              { id: 'master-tables' as any, label: 'Statutory Master Tables', action: onOpenMasterTables },
              { id: 'audit-trail' as any, label: 'Cryptographic Audit Trail', action: onOpenAuditLogs },
              { id: 'user-management' as ActiveScreen, label: 'User Accounts & Roles' },
              { id: 'reports' as ActiveScreen, label: 'Institutional MIS Reports' },
            ],
            isActive: ['user-management', 'reports'].includes(activeScreen as any),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 select-none font-sans" ref={navRef}>
      {/* TIER 1: Prestigious Institutional Identity Banner (Cupertino Frosted Navy #00236f) */}
      <div className="bg-[#00236f]/95 backdrop-blur-2xl text-white px-3 sm:px-6 py-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Crest + Bilingual Institution Typography */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-white/10 flex items-center justify-center text-amber-300 font-black text-[11px] shadow-sm">
            BFGI
          </div>
          <button
            type="button"
            onClick={() => onNavigate(dashboardTarget)}
            className="flex flex-col text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300/95 tracking-wide leading-tight">
              ਬਾਬਾ ਫ਼ਰੀਦ ਗਰੁੱਪ ਆਫ਼ ਇੰਸਟੀਚਿਊਟਸ (ਬਠਿੰਡਾ, ਪੰਜਾਬ)
            </span>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white uppercase leading-tight mt-0.5">
              BABA FARID GROUP OF INSTITUTIONS
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-300/80 leading-tight hidden sm:inline">
              Autonomous Campus ERP • PUP Patiala • MRSPTU • PU Affiliated
            </span>
          </button>
        </div>

        {/* Right: Operational Controls, Canonical Digit UID & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search - iOS Spotlight Pill */}
          <div className="hidden xl:flex items-center w-36 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search... ⌘K"
              className="w-full h-7 pl-3 pr-7 bg-white/10 backdrop-blur-md hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/50 text-[11px] font-medium rounded-full border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/80 transition-all"
            />
            <span className="absolute right-2 top-1.5 text-[8px] font-mono font-semibold text-white/50">
              ⌘K
            </span>
          </div>

          {/* Pure Digit Canonical UID Dynamic Island Pill */}
          <button
            type="button"
            onClick={handleCopyUid}
            title="Click to copy canonical 10-digit UID"
            className="flex items-center gap-1.5 h-7 px-3 bg-white/10 backdrop-blur-md hover:bg-white/15 border border-white/20 rounded-full font-mono text-[10px] text-white transition-all shadow-inner cursor-pointer"
          >
            <span className="text-amber-400 font-bold">UID</span>
            <span className="font-bold tracking-tight text-white">{displayUid}</span>
            <span className="text-white/60 text-[9px]">
              {copiedUid ? '✓' : 'Copy'}
            </span>
          </button>

          {/* Role Pill */}
          <span className="hidden sm:inline-flex h-7 items-center px-2.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
            {currentUser?.role === 'super_admin'
              ? 'Apex Provost'
              : currentUser?.role?.replace(/_/g, ' ') || 'Guest'}
          </span>

          {/* Telephony CRM Switch */}
          {onToggleTelephony && (
            <button
              type="button"
              onClick={onToggleTelephony}
              className={`hidden md:inline-flex h-7 items-center px-3 rounded-full text-[10px] font-semibold transition border backdrop-blur-md cursor-pointer ${
                isTelephonyOpen
                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50'
                  : 'bg-white/10 text-slate-200 border-white/20 hover:bg-white/20'
              }`}
            >
              Telephony
            </button>
          )}

          {/* AI Copilot Action */}
          {onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              className="h-7 px-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-full text-[10px] shadow-sm transition-all cursor-pointer"
            >
              AI Copilot
            </button>
          )}

          {/* Sign Out Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="h-7 px-2 text-[10px] font-semibold text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          )}

          {/* Mobile Back Button */}
          {canGoBack && onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              title="Go Back"
              className="lg:hidden h-7 px-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-white/20"
            >
              <span className="text-sm leading-none font-bold">‹</span>
              <span>Back</span>
            </button>
          )}

          {/* Mobile Navigation Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded-full cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* TIER 2: Dedicated MRSTU Horizontal Navigation Ribbon - iPhoneish Pill Segmented Style */}
      <div className="w-full bg-white/80 backdrop-blur-2xl border-b border-black/[0.06] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center h-[42px] justify-between">
          <div className="flex items-center gap-1.5 h-full overflow-x-auto">
            {/* Apple-Grade Universal Back Button (Visible when on any sub-screen) */}
            {canGoBack && onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                title="Navigate Back to Previous Screen (Alt + ←)"
                className="h-7 px-3 bg-slate-100 hover:bg-slate-200/90 text-slate-800 rounded-full font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer mr-1.5 shrink-0 select-none group border border-slate-200/80"
              >
                <span className="text-sm font-black text-[#00236f] group-hover:-translate-x-0.5 transition-transform leading-none">‹</span>
                <span>Back</span>
              </button>
            )}

            <nav className="hidden lg:flex items-center gap-1">
            {menuSections.map(sec => {
              const isDrawerOpen = openDrawer === sec.id;
              const hasChildren = Boolean(sec.items && sec.items.length > 0);

              return (
                <div
                  key={sec.id}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => hasChildren && handleMouseEnter(sec.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (hasChildren) {
                        setOpenDrawer(isDrawerOpen ? null : sec.id);
                      } else if (sec.action) {
                        sec.action();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold tracking-tight transition-all duration-150 flex items-center gap-1 cursor-pointer select-none ${
                      sec.isActive || isDrawerOpen
                        ? 'bg-[#00236f] text-white shadow-sm ring-1 ring-black/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                    }`}
                  >
                    <span>{sec.label}</span>
                    {hasChildren && (
                      <span className={`text-[8px] transition-transform duration-150 ${isDrawerOpen ? 'rotate-180 opacity-90' : 'opacity-60'}`}>
                        ▾
                      </span>
                    )}
                  </button>

                  {/* MRSTU-Style Vertical Popover Card (Opens Vertically Under Hovered/Clicked Item - iPhone / macOS Style) */}
                  {hasChildren && isDrawerOpen && (
                    <div
                      onMouseEnter={() => {
                        if (closeTimerRef.current) {
                          clearTimeout(closeTimerRef.current);
                          closeTimerRef.current = null;
                        }
                      }}
                      onMouseLeave={handleMouseLeave}
                      className="absolute top-full left-0 mt-1 min-w-[260px] bg-white/95 backdrop-blur-3xl border border-slate-200/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] rounded-2xl p-1.5 z-50 animate-fadeIn"
                    >
                      <div className="px-3 pt-2 pb-1 text-[9px] font-bold text-slate-400 tracking-wider uppercase border-b border-slate-100/80">
                        {sec.label} Directory
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
                            className={`w-full px-3 py-2 rounded-xl text-[11px] font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                              activeScreen === item.id
                                ? 'bg-blue-50/90 text-[#00236f] font-bold'
                                : 'text-slate-700 hover:bg-slate-100/80 hover:text-[#00236f]'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className="text-[10px] text-slate-400 opacity-60">›</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>

      {/* SUB-TIER: Razor-Sharp Institutional Notice Ticker (Height: 20px) - Zero Hardcoded MRSPTU */}
      <div className="bg-[#001744]/95 backdrop-blur-md text-slate-200 h-[22px] flex items-center px-3 sm:px-6 text-[10px] border-b border-white/5">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3 overflow-hidden">
          {/* Alert Tag */}
          <div className="flex items-center gap-1 shrink-0 z-10 pr-2">
            <span className="bg-[#ea580c] text-white font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              CAMPUS GAZETTE
            </span>
          </div>

          {/* Marquee Track */}
          <div className="flex-1 overflow-hidden relative">
            <div className="mrsptu-ticker-track text-slate-200">
              <span className="mx-6 text-orange-200 font-semibold">
                ★ University Examination Schedule & Sessional Datesheets Active • Check Examination Portal
              </span>
              <span className="mx-6 text-slate-300">
                • Multi-University Affiliated (Punjabi University Patiala / MRSPTU / Panjab University)
              </span>
              <span className="mx-6 text-slate-300">
                • Mandatory 75% Attendance Threshold Required for Examination Hall Ticket Generation
              </span>
              <span className="mx-6 text-emerald-300 font-semibold">
                • Campus Placement Drives with Tier-1 Partners Active for 2026 Batch
              </span>
              <span className="mx-6 text-slate-300">
                • Semester Tuition Fee Reconciliation & Exam Clearance Window Open
              </span>
              {/* Duplicate track for seamless infinite scroll */}
              <span className="mx-6 text-orange-200 font-semibold">
                ★ University Examination Schedule & Sessional Datesheets Active • Check Examination Portal
              </span>
              <span className="mx-6 text-slate-300">
                • Multi-University Affiliated (Punjabi University Patiala / MRSPTU / Panjab University)
              </span>
            </div>
          </div>

          {/* Quick Notice Action */}
          <div className="shrink-0 z-10 bg-[#00236f] pl-2 hidden sm:block">
            <button
              type="button"
              onClick={() => onNavigate('academics')}
              className="text-orange-300 hover:text-white font-bold text-[9px] uppercase tracking-wider hover:underline cursor-pointer"
            >
              [View Scheme &rarr;]
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Accordion Style) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 p-3 space-y-2 animate-fadeIn text-xs shadow-lg max-h-[80vh] overflow-y-auto">
          {menuSections.map(sec => (
            <div key={sec.id} className="border-b border-slate-100 pb-1.5">
              {sec.items ? (
                <div>
                  <div className="font-bold text-[#00236f] uppercase text-[10px] py-1">
                    {sec.label}
                  </div>
                  <div className="pl-2 space-y-1">
                    {sec.items.map((item: any) => (
                      <button
                        key={item.id || item.label}
                        type="button"
                        onClick={() => {
                          if (item.action) item.action();
                          else if (item.id) onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left py-1 text-[11px] text-slate-700 hover:text-[#00236f]"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (sec.action) sec.action();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left font-bold text-slate-800 hover:text-[#00236f] py-1"
                >
                  {sec.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
