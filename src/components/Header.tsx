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

  const getInstitutionalRoleTitle = (user: User | null): string => {
    if (!user) return 'Guest';
    if (user.role === 'super_admin') {
      return 'SaaS Platform Operator (Software Vendor)';
    }
    if (user.designation) return user.designation;
    switch (user.role) {
      case 'admin':
        return user.department ? `Dean / Campus Director (${user.department})` : 'Dean / Campus Administrator';
      case 'staff':
        return user.department ? `Assistant Professor (${user.department})` : 'Faculty Advisor';
      case 'hod':
        return user.department ? `Head of Department (${user.department})` : 'Head of Department';
      case 'accounts':
        return 'Bursar & Chief Accounts Officer';
      case 'counselor':
        return 'Senior Admissions Counselor';
      case 'student':
        return user.department ? `Undergraduate Scholar (${user.department})` : 'Undergraduate Scholar';
      case 'partner':
        return 'Corporate Placement Partner';
      default:
        return 'Campus Member';
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
        { id: 'examination' as ActiveScreen, label: 'Regular Examination Form', action: () => { onNavigate('examination'); setOpenDrawer(null); } },
        { id: 'examination' as ActiveScreen, label: 'Reappear / Backlog Form', action: () => { onNavigate('examination'); setOpenDrawer(null); } },
        { id: 'examination' as ActiveScreen, label: 'Admit Card & Gate Clearance', action: () => { onNavigate('examination'); setOpenDrawer(null); } },
        { id: 'examination' as ActiveScreen, label: 'Datesheet & Examination Timetable', action: () => { onNavigate('examination'); setOpenDrawer(null); } },
        { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz & Examination LMS' },
        { id: 'fee-ledger' as ActiveScreen, label: 'Fee Clearance for Examination' },
      ],
      isActive: ['examination', 'student-quiz-lms'].includes(activeScreen as any),
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
          <div className="hidden xl:flex items-center w-40 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search... ⌘K"
              className="w-full h-8 pl-3.5 pr-8 bg-white/10 backdrop-blur-md hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/60 text-xs font-medium rounded-full border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
            />
            <span className="absolute right-2.5 top-2 text-[10px] font-mono font-semibold text-white/60">
              ⌘K
            </span>
          </div>

          {/* Pure Digit Canonical UID Dynamic Island Pill */}
          <button
            type="button"
            onClick={handleCopyUid}
            title="Click to copy canonical 10-digit UID"
            className="flex items-center gap-1.5 h-8 px-3.5 bg-white/10 backdrop-blur-md hover:bg-white/15 border border-white/20 rounded-full font-mono text-xs text-white transition-all shadow-inner cursor-pointer"
          >
            <span className="text-amber-400 font-bold">UID</span>
            <span className="font-bold tracking-tight text-white">{displayUid}</span>
            <span className="text-white/60 text-[10px]">
              {copiedUid ? '✓' : 'Copy'}
            </span>
          </button>

          {/* Welcome User & Institutional Role Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 h-8 px-3.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-xs select-none shrink-0">
              <span className="text-amber-300 font-semibold text-xs">Welcome,</span>
              <span className="font-bold text-xs text-white tracking-tight truncate max-w-[140px] sm:max-w-[220px]" title={(currentUser.full_name || currentUser.username).replace(/\s*\(\d+\)\s*$/, '')}>
                {(currentUser.full_name || currentUser.username).replace(/\s*\(\d+\)\s*$/, '')}
              </span>
              <span className="text-white/40 text-xs font-bold hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-tight whitespace-nowrap">
                {getInstitutionalRoleTitle(currentUser)}
              </span>
            </div>
          )}

          {/* Telephony CRM Switch */}
          {onToggleTelephony && (
            <button
              type="button"
              onClick={onToggleTelephony}
              className={`hidden md:inline-flex h-8 items-center px-3.5 rounded-full text-xs font-semibold transition border backdrop-blur-md cursor-pointer ${
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
              className="h-8 px-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-full text-xs shadow-xs transition-all cursor-pointer"
            >
              AI Copilot
            </button>
          )}

          {/* Sign Out Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="h-8 px-2.5 text-xs font-semibold text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
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
              className="lg:hidden h-8 px-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs flex items-center gap-1 cursor-pointer border border-white/20"
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

      {/* TIER 2: Ultra-Sleek Horizontal Text Strip Navigation (University Portal & Apple Ribbon Style - No Clunky Boxes) */}
      <div className="w-full bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] relative z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center h-11 justify-between">
          <div className="flex items-center gap-2 h-full">
            {/* Apple-Grade Universal Back Button (Visible when on any sub-screen) */}
            {canGoBack && onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                title="Navigate Back to Previous Screen (Alt + ←)"
                className="h-7.5 px-3 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 text-[#00236f] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200/90 group mr-2 shrink-0 select-none shadow-2xs"
              >
                <span className="text-sm font-black group-hover:-translate-x-0.5 transition-transform leading-none">‹</span>
                <span>Back</span>
                <span className="hidden md:inline text-[10px] text-slate-400 font-mono ml-0.5">Alt+‹</span>
              </button>
            )}

            {/* Continuous Horizontal Strip of Text Options */}
            <nav className="hidden lg:flex items-center gap-1 h-full">
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
                      className={`h-full px-3.5 text-xs font-semibold tracking-tight transition-colors flex items-center gap-1.5 cursor-pointer select-none relative ${
                        sec.isActive || isDrawerOpen
                          ? 'text-[#00236f] font-bold'
                          : 'text-slate-600 hover:text-[#00236f]'
                      }`}
                    >
                      <span>{sec.label}</span>
                      {hasChildren && (
                        <span className={`text-[9px] transition-transform duration-200 ${isDrawerOpen ? 'rotate-180 text-[#00236f]' : 'text-slate-400'}`}>
                          ▾
                        </span>
                      )}
                      {/* Active / Open Subtle Bottom Indicator Bar */}
                      {(sec.isActive || isDrawerOpen) && (
                        <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-[#00236f] rounded-full" />
                      )}
                    </button>

                    {/* Smooth Vertical Section / Flyout Card (Opens Under Hovered Text Item) */}
                    {hasChildren && isDrawerOpen && (
                      <div
                        onMouseEnter={() => {
                          if (closeTimerRef.current) {
                            clearTimeout(closeTimerRef.current);
                            closeTimerRef.current = null;
                          }
                        }}
                        onMouseLeave={handleMouseLeave}
                        className="absolute top-full left-0 mt-1 min-w-[280px] bg-white border border-slate-200/90 shadow-[0_20px_40px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] rounded-2xl p-2 z-50 animate-fadeIn select-none"
                      >
                        <div className="px-3 pt-2 pb-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase border-b border-slate-100 flex items-center justify-between">
                          <span>{sec.label} Section</span>
                          <span className="text-[10px] font-mono text-slate-400">PUP • MRSPTU • PU</span>
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
                              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between cursor-pointer ${
                                activeScreen === item.id
                                  ? 'bg-[#00236f] text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100/90 hover:text-[#00236f]'
                              }`}
                            >
                              <span>{item.label}</span>
                              <span className={`text-xs ${activeScreen === item.id ? 'text-white/80' : 'text-slate-400'}`}>›</span>
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

      {/* SUB-TIER: Razor-Sharp Campus Bulletin Notice Ticker (Height: 24px) - Strictly Tripartite Affiliated */}
      <div className="bg-[#001744] text-slate-200 h-6 flex items-center px-3 sm:px-6 text-xs border-b border-white/5">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3 overflow-hidden">
          {/* Alert Tag */}
          <div className="flex items-center gap-1 shrink-0 z-10 pr-2">
            <span className="bg-[#ea580c] text-white font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              CAMPUS BULLETIN
            </span>
          </div>

          {/* Marquee Track with Hover Pause */}
          <div className="flex-1 overflow-hidden relative">
            <div className="campus-ticker-track text-slate-200 text-xs">
              <span className="mx-6 text-amber-300 font-semibold">
                ★ Multi-University Affiliated (Punjabi University Patiala • MRSPTU • Panjab University)
              </span>
              <span className="mx-6 text-slate-200">
                • University Examination Schedule & Sessional Datesheets Active • Check Examination Portal
              </span>
              <span className="mx-6 text-slate-200">
                • Mandatory 75% Attendance Threshold Required for Examination Hall Ticket Generation
              </span>
              <span className="mx-6 text-emerald-300 font-semibold">
                • Campus Placement Drives with Tier-1 Partners Active for 2026 Batch
              </span>
              <span className="mx-6 text-slate-200">
                • Semester Tuition Fee Reconciliation & Exam Clearance Window Open
              </span>
              {/* Duplicate track for seamless infinite scroll */}
              <span className="mx-6 text-amber-300 font-semibold">
                ★ Multi-University Affiliated (Punjabi University Patiala • MRSPTU • Panjab University)
              </span>
              <span className="mx-6 text-slate-200">
                • University Examination Schedule & Sessional Datesheets Active • Check Examination Portal
              </span>
            </div>
          </div>

          {/* Quick Notice Action */}
          <div className="shrink-0 z-10 bg-[#001744] pl-2 hidden sm:block">
            <button
              type="button"
              onClick={() => onNavigate('academics')}
              className="text-amber-300 hover:text-white font-bold text-xs uppercase tracking-wider hover:underline cursor-pointer"
            >
              [View Academics &rarr;]
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
