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
  onOpenAdmitCard?: () => void;
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
      {/* TIER 1: Prestigious Institutional Identity Banner (Deep Navy #00236f) */}
      <div className="bg-[#00236f] text-white px-3 sm:px-6 py-2 border-b border-blue-950 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Crest + Bilingual Institution Typography */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-[11px] shadow-inner">
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
            <span className="font-black text-xs sm:text-sm tracking-tight text-white uppercase leading-tight mt-0.5">
              BABA FARID GROUP OF INSTITUTIONS
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-300 leading-tight hidden sm:inline">
              Autonomous Campus ERP • PUP Patiala • MRSPTU • PU Affiliated
            </span>
          </button>
        </div>

        {/* Right: Operational Controls, Canonical Digit UID & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search */}
          <div className="hidden xl:flex items-center w-36 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search... ⌘K"
              className="w-full h-6.5 pl-2 pr-6 bg-blue-950/70 hover:bg-blue-950 focus:bg-[#001744] text-[11px] font-medium text-white placeholder:text-blue-300/50 rounded border border-blue-400/30 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
            />
            <span className="absolute right-1.5 top-1.5 text-[8px] font-mono font-semibold text-blue-300/60">
              ⌘K
            </span>
          </div>

          {/* Pure Digit Canonical UID Copy Badge */}
          <button
            type="button"
            onClick={handleCopyUid}
            title="Click to copy canonical 10-digit UID"
            className="flex items-center gap-1.5 h-6.5 px-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-400/40 rounded font-mono text-[10px] text-white transition cursor-pointer"
          >
            <span className="text-amber-400 font-bold">UID</span>
            <span className="font-bold tracking-tight text-white">{displayUid}</span>
            <span className="text-blue-300 text-[9px]">
              {copiedUid ? '✓' : 'Copy'}
            </span>
          </button>

          {/* Role Pill */}
          <span className="hidden sm:inline-flex h-6.5 items-center px-2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
            {currentUser?.role === 'super_admin'
              ? 'Apex Provost'
              : currentUser?.role?.replace(/_/g, ' ') || 'Guest'}
          </span>

          {/* Telephony CRM Switch */}
          {onToggleTelephony && (
            <button
              type="button"
              onClick={onToggleTelephony}
              className={`hidden md:inline-flex h-6.5 items-center px-2 rounded text-[10px] font-semibold transition border cursor-pointer ${
                isTelephonyOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
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
              className="h-6.5 px-2 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded text-[10px] transition cursor-pointer"
            >
              AI Copilot
            </button>
          )}

          {/* Sign Out Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="h-6.5 px-1.5 text-[10px] font-semibold text-slate-300 hover:text-rose-300 transition cursor-pointer"
            >
              Sign Out
            </button>
          )}

          {/* Mobile Navigation Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1 text-white hover:bg-blue-900 rounded cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* TIER 2: Dedicated MRSTU-Style Horizontal Navigation Strip (White Background, Vertical Dividers, Flush Dropdowns) */}
      <div className="w-full bg-white border-b border-slate-300 shadow-2xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center h-[38px]">
          <nav className="hidden lg:flex items-stretch h-full border-l border-slate-200">
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
                    className={`h-full px-3.5 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer border-r border-slate-200 select-none ${
                      sec.isActive || isDrawerOpen
                        ? 'bg-[#00236f] text-white'
                        : 'text-slate-800 hover:bg-[#00236f] hover:text-white'
                    }`}
                  >
                    <span>{sec.label}</span>
                    {hasChildren && (
                      <span className="text-[8px] opacity-70 ml-0.5">
                        {isDrawerOpen ? '▴' : '▾'}
                      </span>
                    )}
                  </button>

                  {/* MRSTU-Style Vertical Dropdown Section (Opens Vertically Under Hovered/Clicked Item) */}
                  {hasChildren && isDrawerOpen && (
                    <div
                      onMouseEnter={() => {
                        if (closeTimerRef.current) {
                          clearTimeout(closeTimerRef.current);
                          closeTimerRef.current = null;
                        }
                      }}
                      onMouseLeave={handleMouseLeave}
                      className="absolute top-full left-0 min-w-[260px] bg-[#00236f] text-white border-t-2 border-[#ea580c] shadow-2xl z-50 py-1 rounded-b-md animate-fadeIn"
                    >
                      <div className="px-3.5 py-1.5 text-[9px] font-bold text-amber-300 border-b border-blue-900 uppercase tracking-wider">
                        {sec.label} Directory
                      </div>
                      <div className="py-0.5">
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
                            className={`w-full px-3.5 py-2 text-[11px] font-medium flex items-center justify-between cursor-pointer transition text-left border-b border-blue-950/60 last:border-b-0 ${
                              activeScreen === item.id
                                ? 'bg-[#001744] text-amber-300 font-bold pl-4'
                                : 'text-slate-200 hover:bg-[#001744] hover:text-amber-300 hover:pl-4'
                            }`}
                          >
                            <span>{item.label}</span>
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

      {/* SUB-TIER: Razor-Sharp Institutional Notice Ticker (Height: 20px) - Zero Hardcoded MRSPTU */}
      <div className="bg-[#00236f] text-slate-200 h-[20px] flex items-center px-3 sm:px-6 text-[10px] border-b border-black/10">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3 overflow-hidden">
          {/* Alert Tag */}
          <div className="flex items-center gap-1 shrink-0 z-10 bg-[#00236f] pr-2">
            <span className="bg-[#ea580c] text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded">
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
