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
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpenDrawer(null);
    }, 350);
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

      {/* TIER 2: Ultra-Sleek Apple Horizontal Ribbon & Mega Navigation Strip */}
      <div className="w-full bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] relative z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center h-11 justify-between gap-3">
          {/* Left: Universal Back Pill + Main Navigation Hubs */}
          <div className="flex items-center gap-1.5 h-full overflow-x-auto no-scrollbar py-1">
            {/* Apple-Grade Universal Back Button (Visible when on any sub-screen) */}
            {canGoBack && onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                title="Navigate Back to Previous Screen (Alt + ←)"
                className="h-8 px-3 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 text-[#00236f] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200/90 group mr-1.5 shrink-0 select-none shadow-2xs"
              >
                <span className="text-sm font-black group-hover:-translate-x-0.5 transition-transform leading-none">‹</span>
                <span>Back</span>
                <span className="hidden md:inline text-[10px] text-slate-400 font-mono ml-0.5">Alt+‹</span>
              </button>
            )}

            {/* Continuous Horizontal Strip of Text Options (Responsive: Scrollable on mobile, Mega Flyout on Desktop) */}
            <nav className="flex items-center gap-1 h-full shrink-0">
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
                        if (closeTimerRef.current) {
                          clearTimeout(closeTimerRef.current);
                          closeTimerRef.current = null;
                        }
                        if (hasChildren) {
                          setOpenDrawer(isDrawerOpen ? null : sec.id);
                        } else if (sec.action) {
                          sec.action();
                        }
                      }}
                      className={`h-8 sm:h-full px-2.5 sm:px-3 text-xs font-semibold tracking-tight transition-colors flex items-center gap-1 cursor-pointer select-none relative rounded-lg sm:rounded-none ${
                        sec.isActive || isDrawerOpen
                          ? 'text-[#00236f] font-bold bg-slate-100 sm:bg-transparent'
                          : 'text-slate-600 hover:text-[#00236f] hover:bg-slate-50 sm:hover:bg-transparent'
                      }`}
                    >
                      <span className="whitespace-nowrap">{sec.label}</span>
                      {hasChildren && (
                        <span className={`text-[9px] transition-transform duration-200 ${isDrawerOpen ? 'rotate-180 text-[#00236f]' : 'text-slate-400'}`}>
                          ▾
                        </span>
                      )}
                      {/* Active / Open Subtle Bottom Indicator Bar (Desktop) */}
                      {(sec.isActive || isDrawerOpen) && (
                        <span className="hidden sm:block absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#00236f] rounded-full" />
                      )}
                    </button>

                    {/* Apple-Grade Multi-Column Frosted Flyout Card (Opens Under Hovered/Clicked Item) */}
                    {hasChildren && isDrawerOpen && (
                      <div
                        onMouseEnter={() => {
                          if (closeTimerRef.current) {
                            clearTimeout(closeTimerRef.current);
                            closeTimerRef.current = null;
                          }
                        }}
                        onMouseLeave={handleMouseLeave}
                        className={`absolute top-full mt-1.5 bg-white/98 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_45px_-10px_rgba(0,35,111,0.18),0_0_0_1px_rgba(0,35,111,0.04)] rounded-2xl p-3 z-50 animate-fadeIn select-none ${
                          sec.items!.length > 4 ? 'w-[420px] sm:w-[480px]' : 'min-w-[280px] sm:min-w-[320px]'
                        } ${sec.id === 'governance' || sec.id === 'partners' ? 'right-0 left-auto' : 'left-0'}`}
                      >
                        {/* Section Header with Tripartite Branding */}
                        <div className="px-3 pt-1.5 pb-2 text-[11px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-100 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[#00236f] font-black">
                            <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                            {sec.label} Console
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            PUP • MRSPTU • PU
                          </span>
                        </div>

                        {/* Interactive Action Grid */}
                        <div className={`py-2 ${sec.items!.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2 gap-1.5' : 'space-y-1'}`}>
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
                              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between cursor-pointer group ${
                                activeScreen === item.id
                                  ? 'bg-[#00236f] text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100/90 hover:text-[#00236f]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className={`text-[10px] shrink-0 font-bold ${activeScreen === item.id ? 'text-amber-300' : 'text-slate-400 group-hover:text-[#00236f]'}`}>
                                  •
                                </span>
                                <span className="truncate">{item.label}</span>
                              </div>
                              <span className={`text-xs shrink-0 transition-transform group-hover:translate-x-0.5 ${activeScreen === item.id ? 'text-white/80' : 'text-slate-400'}`}>
                                ›
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Card Footer Quick Note */}
                        <div className="pt-2 mt-1 border-t border-slate-100 px-3 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Statutory Ordinance 7.4 Active</span>
                          <span className="font-semibold text-slate-500">Autonomous Campus</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right: Institutional Session Term & Live Gateway Indicators (Fills Desktop Void) */}
          <div className="hidden md:flex items-center gap-2 shrink-0 select-none">
            {/* Term Badge */}
            <div className="flex items-center gap-1.5 h-7 px-2.5 bg-slate-100/80 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-700">
              <span className="text-[#00236f] font-bold">AY 2026-27</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">Jan–Jun Term</span>
            </div>

            {/* University Tag */}
            <div className="hidden xl:flex items-center gap-1 h-7 px-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-900">
              <span className="text-amber-600 font-extrabold">UGC</span>
              <span>MRSPTU • PUP • PU</span>
            </div>

            {/* Real-Time Engine Heartbeat */}
            <div className="flex items-center gap-1.5 h-7 px-2.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Online (120Hz)</span>
            </div>
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

      {/* Mobile Drawer (High-End iOS Sheet Modal Style - Zero Disconnect) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-0 z-50 bg-[#00236f]/60 backdrop-blur-xl flex flex-col justify-end animate-fadeIn">
          {/* Backdrop Dismiss Area */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />

          {/* iOS Bottom / Slide-Up Control Sheet */}
          <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto space-y-4">
            {/* Grabber Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-2" />

            {/* Header with User Info & Close */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-[#00236f] uppercase tracking-wider">
                  BABA FARID GROUP OF INSTITUTIONS
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {(currentUser?.full_name || currentUser?.username || 'User').replace(/\s*\(\d+\)\s*$/, '')}
                </div>
                <div className="text-[11px] font-semibold text-amber-600">
                  {getInstitutionalRoleTitle(currentUser)} • UID: {displayUid}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Fast Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuSections.map(sec => (
                <div key={sec.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                  <div className="flex items-center justify-between font-bold text-[#00236f] text-xs uppercase tracking-wider mb-2">
                    <span>{sec.label}</span>
                    {sec.items && <span className="text-[10px] text-slate-400 font-normal">{sec.items.length} items</span>}
                  </div>

                  {sec.items ? (
                    <div className="space-y-1">
                      {sec.items.map((item: any) => (
                        <button
                          key={item.id || item.label}
                          type="button"
                          onClick={() => {
                            if (item.action) item.action();
                            else if (item.id) onNavigate(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                            activeScreen === item.id
                              ? 'bg-[#00236f] text-white font-bold'
                              : 'text-slate-700 hover:bg-slate-200/70 hover:text-[#00236f]'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          <span className="text-[10px] opacity-60">›</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (sec.action) sec.action();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold bg-[#00236f] text-white flex items-center justify-between"
                    >
                      <span>Open {sec.label}</span>
                      <span>›</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Sign Out
                </button>
              )}
              <div className="text-[10px] font-mono text-slate-400">
                PUP Patiala • MRSPTU • PU Affiliated
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

