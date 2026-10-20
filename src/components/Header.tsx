import React, { useState, useRef, useEffect } from 'react';
import { User, ActiveScreen } from '../types';

interface HeaderProps {
  currentUser: User | null;
  activeScreen?: ActiveScreen;
  currentPath?: string;
  currentSearch?: string;
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
  onOpenMasterTables?: (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents') => void;
  onOpenStaffJourney?: () => void;
  onOpenAdmitCard?: () => void;
  onOpenPayModal?: () => void;
  viewMode?: 'desktop' | 'mobile-phone';
  onToggleViewMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeScreen,
  currentPath,
  currentSearch,
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
  onOpenPayModal,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<'bathinda_main' | 'faridkot_center' | 'all_campuses'>('bathinda_main');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pure Digit Canonical 12-13 Digit UID: [Type4]-[Seq2]-[Client2]-[State03]-[Inst01]
  const rawUid = currentUser?.enterprise_uid || (
    currentUser?.role === 'super_admin'
      ? '9001-01-01-03-01'
      : currentUser?.role === 'admin'
      ? '4001-01-01-03-01'
      : currentUser?.role === 'staff'
      ? '2001-14-01-03-01'
      : currentUser?.role === 'partner'
      ? '7001-01-01-03-01'
      : currentUser?.role === 'hostel'
      ? '10001-01-01-03-01'
      : '1001-88-01-03-01'
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
      case 'hr':
        return user.department ? `Chief HR & Establishment Officer (${user.department})` : 'Chief HR & Establishment Officer';
      case 'counselor':
        return 'Senior Admissions Counselor';
      case 'student':
        return user.department ? `Undergraduate Scholar (${user.department})` : 'Undergraduate Scholar';
      case 'partner':
        return 'Corporate Placement Partner';
      case 'hostel':
        return user.department ? `Chief Hostel Warden & Residence Officer (${user.department})` : 'Chief Hostel Warden & Campus Residence Officer';
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
  const userRole = currentUser?.role;

  const queryParams = new URLSearchParams(currentSearch || (typeof window !== 'undefined' ? window.location.search : ''));
  const currentTab = queryParams.get('tab');
  const currentView = queryParams.get('view');
  const effectivePath = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');

  const dashboardTarget: ActiveScreen =
    isSuperAdmin
      ? 'super-admin-dashboard'
      : currentUser?.role === 'admin'
      ? 'admin-dashboard'
      : userRole === 'hr'
      ? 'staff-management'
      : userRole === 'staff' || userRole === 'hod' || userRole === 'counselor'
      ? 'staff-dashboard'
      : userRole === 'partner'
      ? 'partner-portal'
      : userRole === 'hostel'
      ? 'hostel-management'
      : userRole === 'accounts'
      ? 'fee-ledger'
      : 'student-dashboard';

  const getActiveModuleTitle = (): string => {
    if (activeScreen === 'hostel-management' || effectivePath.startsWith('/hostel')) return 'Hostel & Residence';
    if (activeScreen === 'admin-dashboard' || effectivePath.startsWith('/admin')) return 'Operations Console';
    if (activeScreen === 'super-admin-dashboard') return 'Platform Overview';
    if (activeScreen === 'student-dashboard') return 'Scholar Home';
    if (activeScreen === 'staff-dashboard') return 'Faculty Desk';
    if (activeScreen === 'fee-ledger' || effectivePath.startsWith('/fees')) return 'Tuition & Ledgers';
    if (activeScreen === 'enquiries' || effectivePath.startsWith('/enquiries')) return 'Admissions CRM';
    if (activeScreen === 'admissions' || effectivePath.startsWith('/admissions')) return 'Admissions Desk';
    if (activeScreen === 'manage-students' || effectivePath.startsWith('/students')) return 'Student Directory';
    if (activeScreen === 'academics' || effectivePath.startsWith('/academics')) return 'Academics & Exams';
    if (activeScreen === 'examination' || effectivePath.startsWith('/examination')) return 'Admit Card & Exams';
    if (activeScreen === 'staff-management' || effectivePath.startsWith('/staff-management')) return 'Faculty & HRMS';
    if (activeScreen === 'user-management' || effectivePath.startsWith('/user-management')) return 'Institutional Governance';
    if (activeScreen === 'reports' || effectivePath.startsWith('/reports')) return 'Institutional MIS Reports';
    return 'Campus Console';
  };
  const activeModuleTitle = getActiveModuleTitle();

  let menuSections: Array<{
    id: string;
    label: string;
    defaultScreen: ActiveScreen;
    items?: Array<{ id?: ActiveScreen; label: string; action?: () => void }>;
    action?: () => void;
    isActive: boolean;
  }> = [];

  if (isSuperAdmin) {
    // Universal Provost & SaaS Platform Vendor: Apex Multi-Tenant Infrastructure Suite
    menuSections = [
      {
        id: 'platform',
        label: 'Platform Overview',
        defaultScreen: 'super-admin-dashboard',
        action: () => {
          onNavigate('super-admin-dashboard');
          setOpenDrawer(null);
        },
        isActive: effectivePath === '/dashboard' || activeScreen === 'super-admin-dashboard',
      },
      {
        id: 'tenants',
        label: 'Tenants & Campuses',
        defaultScreen: 'tenants' as any,
        action: () => {
          onNavigate('tenants' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'tenants' as any, label: 'Multi-Tenant Institutions & Subdomains', action: () => { onNavigate('tenants' as any); setOpenDrawer(null); } },
          { id: 'payment-gateways' as ActiveScreen, label: 'Payment Gateways & Current Accounts', action: () => { onNavigate('payment-gateways'); setOpenDrawer(null); } },
          { id: 'master-inst' as any, label: 'Multi-College Institutional Campuses', action: () => { onOpenMasterTables?.('institutions'); onNavigate('master-architecture?tab=institutions' as any); setOpenDrawer(null); } },
          { id: 'master-univ' as any, label: 'Affiliated Universities (PUP / MRSPTU / PU)', action: () => { onOpenMasterTables?.('institutions'); onNavigate('master-architecture?tab=institutions' as any); setOpenDrawer(null); } },
          { id: 'master-dept' as any, label: 'Academic Departments Catalog', action: () => { onOpenMasterTables?.('departments'); onNavigate('master-architecture?tab=departments' as any); setOpenDrawer(null); } },
        ],
        isActive: effectivePath.startsWith('/tenants') || effectivePath.startsWith('/payment-gateways'),
      },
      {
        id: 'access',
        label: 'Universal Access & RBAC',
        defaultScreen: 'user-management',
        items: [
          { id: 'user-management' as ActiveScreen, label: 'Universal User Directory & Security', action: () => { onNavigate('user-management'); setOpenDrawer(null); } },
          { id: 'field-permissions' as ActiveScreen, label: 'Field-Level Permissions Matrix', action: () => { onNavigate('field-permissions'); setOpenDrawer(null); } },
          { id: 'user-management' as ActiveScreen, label: 'Apex Institutional Role Delegation', action: () => { onNavigate('user-management'); setOpenDrawer(null); } },
          { id: 'user-management' as ActiveScreen, label: 'Universal Password Override & Security', action: () => { onNavigate('user-management'); setOpenDrawer(null); } },
        ],
        isActive: effectivePath.startsWith('/user-management') || effectivePath.startsWith('/field-permissions'),
      },
      {
        id: 'architecture',
        label: 'Master Architecture',
        defaultScreen: 'master-architecture' as any,
        action: () => {
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          setOpenDrawer(null);
          onNavigate('master-architecture' as any);
        },
        items: [
          {
            id: 'master-gst' as any,
            label: 'State GST Codes (GST-01 to 37)',
            action: () => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              setOpenDrawer(null);
              onNavigate('master-architecture?tab=states' as any);
              onOpenMasterTables?.('states');
            },
          },
          {
            id: 'master-types' as any,
            label: 'Enterprise User Type Codes (1001-9001)',
            action: () => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              setOpenDrawer(null);
              onNavigate('master-architecture?tab=userTypes' as any);
              onOpenMasterTables?.('userTypes');
            },
          },
          {
            id: 'master-degrees' as any,
            label: 'Approved Degrees (AICTE / UGC / PCI)',
            action: () => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              setOpenDrawer(null);
              onNavigate('master-architecture?tab=degrees' as any);
              onOpenMasterTables?.('degrees');
            },
          },
          {
            id: 'master-docs' as any,
            label: 'Statutory Document Types & MIME Rules',
            action: () => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              setOpenDrawer(null);
              onNavigate('master-architecture?tab=documents' as any);
              onOpenMasterTables?.('documents');
            },
          },
        ],
        isActive: effectivePath.startsWith('/master-architecture'),
      },
      {
        id: 'audit',
        label: 'Cryptographic Forensics',
        defaultScreen: 'audit-logs' as any,
        action: () => {
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          setOpenDrawer(null);
          onNavigate('audit-logs' as any);
        },
        items: [
          {
            id: 'audit-stream' as any,
            label: 'Immutable Audit Log Stream',
            action: () => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              setOpenDrawer(null);
              onNavigate('audit-logs' as any);
              onOpenAuditLogs?.();
            },
          },
          {
            id: 'audit-forensics' as any,
            label: 'Security & Actor Difference Forensics',
            action: () => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              setOpenDrawer(null);
              onNavigate('audit-logs?filter=security' as any);
              onOpenAuditLogs?.();
            },
          },
        ],
        isActive: effectivePath.startsWith('/audit-logs') || effectivePath.startsWith('/forensics'),
      },
      {
        id: 'telemetry',
        label: 'Database & Telemetry',
        defaultScreen: 'telemetry' as any,
        action: () => {
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          setOpenDrawer(null);
          onNavigate('telemetry' as any);
        },
        items: [
          { id: 'telemetry' as any, label: 'High-Throughput PostgreSQL DB Telemetry', action: () => { onNavigate('telemetry' as any); setOpenDrawer(null); } },
          { id: 'telemetry' as any, label: 'Cloud MariaDB Dual-Pool Health', action: () => { onNavigate('telemetry' as any); setOpenDrawer(null); } },
          { id: 'telemetry' as any, label: 'Platform Performance Metrics', action: () => { onNavigate('telemetry' as any); setOpenDrawer(null); } },
        ],
        isActive: effectivePath.startsWith('/telemetry'),
      },
    ];
  } else if (isAdmin) {
    // Institutional Administrator (Dean, Registrar, Principal): Daily Operational Management Suite
    menuSections = [
      {
        id: 'dashboard',
        label: 'Operations Console',
        defaultScreen: 'admin-dashboard',
        action: () => {
          onNavigate('admin-dashboard');
          setOpenDrawer(null);
        },
        isActive: effectivePath === '/dashboard' || activeScreen === 'admin-dashboard',
      },
      {
        id: 'crm',
        label: 'Admissions Desk',
        defaultScreen: 'enquiries' as ActiveScreen,
        items: [
          { id: 'enquiries' as ActiveScreen, label: 'Pre-Admission Leads Radar', action: () => { onNavigate('enquiries'); setOpenDrawer(null); } },
          { id: 'bulk-import' as ActiveScreen, label: 'Bulk Lead CSV / Excel Mapper', action: () => { onNavigate('bulk-import'); setOpenDrawer(null); } },
          { id: 'admissions' as ActiveScreen, label: 'Admissions Intake Desk', action: () => { onNavigate('admissions'); setOpenDrawer(null); } },
          { id: 'form-builder' as ActiveScreen, label: 'Application Form Builder', action: () => { onNavigate('form-builder'); setOpenDrawer(null); } },
        ],
        isActive: ['/enquiries', '/bulk-import', '/admissions', '/form-builder'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'fees',
        label: 'Tuition & Ledgers',
        defaultScreen: 'fee-ledger' as ActiveScreen,
        items: [
          { id: 'fee-ledger' as ActiveScreen, label: 'Tuition Fee Assessment & Ledger', action: () => { onNavigate('fee-ledger'); setOpenDrawer(null); } },
          { id: 'payment-gateways' as ActiveScreen, label: 'Payment Gateways (Test / Live Accounts)', action: () => { onNavigate('payment-gateways'); setOpenDrawer(null); } },
          { id: 'scholarships' as ActiveScreen, label: 'State & Merit Scholarships', action: () => { onNavigate('scholarships'); setOpenDrawer(null); } },
        ],
        isActive: ['/fees', '/scholarships', '/payment-gateways'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'students',
        label: 'Student Directory',
        defaultScreen: 'manage-students' as ActiveScreen,
        items: [
          { id: 'manage-students' as ActiveScreen, label: 'Student Master Directory', action: () => { onNavigate('manage-students'); setOpenDrawer(null); } },
          { id: 'student-documents' as ActiveScreen, label: 'Regulatory Document Compliance Vault', action: () => { onNavigate('student-documents'); setOpenDrawer(null); } },
          { id: 'grievances' as ActiveScreen, label: 'Statutory Grievance Redressal', action: () => { onNavigate('grievances'); setOpenDrawer(null); } },
        ],
        isActive: ['/manage-students', '/student-documents', '/grievances'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'examination',
        label: 'Academics & Exams',
        defaultScreen: 'examination' as ActiveScreen,
        items: [
          { id: 'examination?tab=regular' as any, label: 'University Examination Forms', action: () => { onNavigate('examination?tab=regular' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=reappear' as any, label: 'Reappear / Backlog Portal', action: () => { onNavigate('examination?tab=reappear' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=admit-card' as any, label: 'Admit Card & Gate Clearance', action: () => { onNavigate('examination?tab=admit-card' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=datesheet' as any, label: 'Datesheet & Examination Timetable', action: () => { onNavigate('examination?tab=datesheet' as any); setOpenDrawer(null); } },
          { id: 'academics?tab=syllabus' as any, label: 'Choice Based Credit System (CBCS)', action: () => { onNavigate('academics?tab=syllabus' as any); setOpenDrawer(null); } },
          { id: 'academics?tab=timetable' as any, label: 'Timetable & Combined Classes (CC)', action: () => { onNavigate('academics?tab=timetable' as any); setOpenDrawer(null); } },
          { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz & Examination LMS', action: () => { onNavigate('student-quiz-lms'); setOpenDrawer(null); } },
        ],
        isActive: ['/examination', '/academics', '/student-quiz-lms'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'staff',
        label: 'Faculty & HRMS',
        defaultScreen: 'staff-management' as ActiveScreen,
        items: [
          { id: 'staff-management' as ActiveScreen, label: 'Faculty & HRMS Directory', action: () => { onNavigate('staff-management'); setOpenDrawer(null); } },
          { id: 'teacher-documents' as ActiveScreen, label: 'Faculty Dossier Vault', action: () => { onNavigate('teacher-documents'); setOpenDrawer(null); } },
          { id: 'staff-management?tab=additional-roles' as any, label: 'Assign Multi-Roles & Administrative Duties', action: () => { onNavigate('staff-management?tab=additional-roles' as any); setOpenDrawer(null); } },
          { id: 'staff-academic-journey' as any, label: 'CAS Research Publications & Patents', action: onOpenStaffJourney },
        ],
        isActive: ['/staff-management', '/teacher-documents'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'governance',
        label: 'Institutional Governance',
        defaultScreen: 'user-management' as ActiveScreen,
        items: [
          { id: 'user-management' as ActiveScreen, label: 'Campus User Accounts & Access', action: () => { onNavigate('user-management'); setOpenDrawer(null); } },
          { id: 'field-permissions' as ActiveScreen, label: 'Field-Level Permissions Matrix', action: () => { onNavigate('field-permissions'); setOpenDrawer(null); } },
          { id: 'master-tables-admin' as any, label: 'Statutory Master Tables', action: () => { onOpenMasterTables?.('states'); onNavigate('master-architecture?tab=states' as any); setOpenDrawer(null); } },
          { id: 'audit-trail-admin' as any, label: 'Cryptographic Audit Trail', action: () => { onOpenAuditLogs?.(); onNavigate('audit-logs' as any); setOpenDrawer(null); } },
          { id: 'reports' as ActiveScreen, label: 'Institutional MIS Reports', action: () => { onNavigate('reports'); setOpenDrawer(null); } },
        ],
        isActive: ['/user-management', '/field-permissions', '/reports', '/master-architecture', '/audit-logs'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'hostel',
        label: 'Hostel & Residence',
        defaultScreen: 'hostel-management' as ActiveScreen,
        items: [
          { id: 'hostel-management?tab=overview' as any, label: 'Hostel Operations Command', action: () => { onNavigate('hostel-management?tab=overview' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=buildings' as any, label: 'Residence Blocks & Safety Checks', action: () => { onNavigate('hostel-management?tab=buildings' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=rooms' as any, label: 'Room Inventory & Bed Allocation', action: () => { onNavigate('hostel-management?tab=rooms' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=residents' as any, label: 'Resident Scholars Registry', action: () => { onNavigate('hostel-management?tab=residents' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=mess' as any, label: 'Mess & Digital No-Dues Clearance', action: () => { onNavigate('hostel-management?tab=mess' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=maintenance' as any, label: '360-Day Maintenance & Overhaul', action: () => { onNavigate('hostel-management?tab=maintenance' as any); setOpenDrawer(null); } },
          { id: 'transport' as any, label: 'Transport Fleet & Seat Queues', action: () => { onNavigate('transport' as any); setOpenDrawer(null); } },
        ],
        isActive: ['/hostel', '/hostel-management', '/transport'].some(p => effectivePath.startsWith(p)) || activeScreen === 'hostel-management',
      },
    ];
  } else if (userRole === 'hr') {
    // Chief HR & Establishment Officer: Enterprise HRMS, Lifecycle & Exit Suite
    const isStaffMgmt = effectivePath.startsWith('/staff-management') || effectivePath === '/dashboard';
    const isTeacherDocs = effectivePath.startsWith('/teacher-documents') || activeScreen === 'teacher-documents';
    const isGrievance = effectivePath.startsWith('/grievances') || activeScreen === 'grievances';

    menuSections = [
      {
        id: 'overview',
        label: 'HRMS Overview',
        defaultScreen: 'staff-management?tab=overview' as any,
        action: () => {
          onNavigate('staff-management?tab=overview' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'staff-management?tab=overview' as any, label: 'HR Executive Command & KPI Radar', action: () => { onNavigate('staff-management?tab=overview' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=additional-roles' as any, label: 'Multi-Role Allocation & Administrative Duties', action: () => { onNavigate('staff-management?tab=additional-roles' as any); setOpenDrawer(null); } },
        ],
        isActive: isStaffMgmt && (!currentTab || currentTab === 'overview' || currentTab === 'additional-roles'),
      },
      {
        id: 'roster',
        label: 'Faculty & Staff Roster',
        defaultScreen: 'staff-management?tab=overview' as any,
        action: () => {
          onNavigate('staff-management?tab=overview' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'staff-management?tab=overview' as any, label: 'Faculty & Non-Teaching Master Roster', action: () => { onNavigate('staff-management?tab=overview' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=addresses' as any, label: 'Residential Addresses & Domicile Verification', action: () => { onNavigate('staff-management?tab=addresses' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=banks' as any, label: 'Bank Accounts & Salary Disbursal Mandate', action: () => { onNavigate('staff-management?tab=banks' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=qualifications' as any, label: 'Academic Qualifications & UGC Net/PhD', action: () => { onNavigate('staff-management?tab=qualifications' as any); setOpenDrawer(null); } },
        ],
        isActive: isStaffMgmt && ['addresses', 'banks', 'qualifications'].includes(currentTab || ''),
      },
      {
        id: 'lifecycle',
        label: 'Status & Lifecycle',
        defaultScreen: 'staff-management?tab=journey' as any,
        action: () => {
          onNavigate('staff-management?tab=journey' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'staff-management?tab=journey' as any, label: 'Active / Resigned / Terminated / AWOL', action: () => { onNavigate('staff-management?tab=journey' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=journey' as any, label: 'Approaching Last Working Day Radar', action: () => { onNavigate('staff-management?tab=journey' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=journey' as any, label: 'Fresher vs Rejoiner Tracking', action: () => { onNavigate('staff-management?tab=journey' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=journey' as any, label: 'Multi-Role & Designation Transitions', action: () => { onNavigate('staff-management?tab=journey' as any); setOpenDrawer(null); } },
        ],
        isActive: isStaffMgmt && currentTab === 'journey',
      },
      {
        id: 'payroll',
        label: 'Payroll & Deductions',
        defaultScreen: 'staff-management?tab=payroll' as any,
        action: () => {
          onNavigate('staff-management?tab=payroll' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'staff-management?tab=payroll' as any, label: 'Security Deduction Schedule (₹30,000 Target)', action: () => { onNavigate('staff-management?tab=payroll' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=payroll' as any, label: 'Salary Structure & Statutory PF / ESI', action: () => { onNavigate('staff-management?tab=payroll' as any); setOpenDrawer(null); } },
        ],
        isActive: isStaffMgmt && currentTab === 'payroll',
      },
      {
        id: 'exit-noc',
        label: 'Exit NOC & Clearances',
        defaultScreen: 'staff-management?tab=exit-noc' as any,
        action: () => {
          onNavigate('staff-management?tab=exit-noc' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'staff-management?tab=exit-noc' as any, label: '5-Department Digital Exit NOC', action: () => { onNavigate('staff-management?tab=exit-noc' as any); setOpenDrawer(null); } },
          { id: 'staff-management?tab=exit-noc' as any, label: 'Caution Deposit Refund & Lock', action: () => { onNavigate('staff-management?tab=exit-noc' as any); setOpenDrawer(null); } },
        ],
        isActive: isStaffMgmt && currentTab === 'exit-noc',
      },
      {
        id: 'dossier',
        label: 'Staff Dossier & Docs',
        defaultScreen: 'teacher-documents',
        action: () => {
          onNavigate('teacher-documents');
          setOpenDrawer(null);
        },
        items: [
          { id: 'teacher-documents' as ActiveScreen, label: 'Statutory Credentials & Document Vault', action: () => { onNavigate('teacher-documents'); setOpenDrawer(null); } },
          { id: 'staff-academic-journey' as any, label: 'Organizational Journey & Experience Logs', action: onOpenStaffJourney },
        ],
        isActive: isTeacherDocs,
      },
      {
        id: 'grievances',
        label: 'Grievances',
        defaultScreen: 'grievances',
        action: () => {
          onNavigate('grievances');
          setOpenDrawer(null);
        },
        isActive: isGrievance,
      },
    ];
  } else if (userRole === 'partner') {
    // Corporate Placement Partner
    const isPartner = effectivePath.startsWith('/partner-portal') || activeScreen === 'partner-portal';
    menuSections = [
      {
        id: 'dashboard',
        label: 'Placements Home',
        defaultScreen: 'partner-portal',
        action: () => {
          onNavigate('partner-portal');
          setOpenDrawer(null);
        },
        isActive: isPartner && (!currentTab || currentTab === 'partners'),
      },
      {
        id: 'talent',
        label: 'Campus Talent Pool',
        defaultScreen: 'partner-portal?tab=talent' as any,
        action: () => {
          onNavigate('partner-portal?tab=talent' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'partner-portal?tab=talent' as any, label: 'Graduating Batch Talent Radar', action: () => { onNavigate('partner-portal?tab=talent' as any); setOpenDrawer(null); } },
          { id: 'partner-portal?tab=talent' as any, label: 'Shortlisted Candidate Profiles', action: () => { onNavigate('partner-portal?tab=talent' as any); setOpenDrawer(null); } },
        ],
        isActive: isPartner && currentTab === 'talent',
      },
      {
        id: 'drives',
        label: 'Placement Drives',
        defaultScreen: 'partner-portal?tab=jobs' as any,
        action: () => {
          onNavigate('partner-portal?tab=jobs' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'partner-portal?tab=jobs' as any, label: 'Scheduled Campus Hiring Drives', action: () => { onNavigate('partner-portal?tab=jobs' as any); setOpenDrawer(null); } },
          { id: 'partner-portal?tab=applications' as any, label: 'Candidate Applications & Offers', action: () => { onNavigate('partner-portal?tab=applications' as any); setOpenDrawer(null); } },
        ],
        isActive: isPartner && (currentTab === 'jobs' || currentTab === 'applications'),
      },
    ];
  } else if (userRole === 'accounts') {
    // Bursar & Chief Accounts Officer
    menuSections = [
      {
        id: 'dashboard',
        label: 'Collections Home',
        defaultScreen: 'fee-ledger',
        action: () => {
          onNavigate('fee-ledger');
          setOpenDrawer(null);
        },
        isActive: (effectivePath.startsWith('/fees') || activeScreen === 'fee-ledger') && !effectivePath.includes('payment-gateways'),
      },
      {
        id: 'fees',
        label: 'Fee Ledger & Registers',
        defaultScreen: 'fee-ledger',
        items: [
          { id: 'fee-ledger' as ActiveScreen, label: 'Tuition Fee Assessment & Collections', action: () => { onNavigate('fee-ledger'); setOpenDrawer(null); } },
          { id: 'payment-gateways' as ActiveScreen, label: 'Payment Gateways & Current Accounts', action: () => { onNavigate('payment-gateways'); setOpenDrawer(null); } },
          { id: 'scholarships' as ActiveScreen, label: 'State & Merit Scholarships', action: () => { onNavigate('scholarships'); setOpenDrawer(null); } },
        ],
        isActive: ['fee-ledger', 'scholarships', 'payment-gateways'].includes(activeScreen as any) || effectivePath.startsWith('/fees') || effectivePath.startsWith('/scholarships') || effectivePath.startsWith('/payment-gateways'),
      },
      {
        id: 'students',
        label: 'Student Directory',
        defaultScreen: 'manage-students',
        items: [
          { id: 'manage-students' as ActiveScreen, label: 'Student Billing & Master Directory', action: () => { onNavigate('manage-students'); setOpenDrawer(null); } },
          { id: 'student-documents' as ActiveScreen, label: 'Regulatory Document Compliance Vault', action: () => { onNavigate('student-documents'); setOpenDrawer(null); } },
        ],
        isActive: ['manage-students', 'student-documents'].includes(activeScreen as any) || effectivePath.startsWith('/manage-students') || effectivePath.startsWith('/student-documents'),
      },
      {
        id: 'examination',
        label: 'Exam Clearance',
        defaultScreen: 'examination?tab=admit-card' as any,
        action: () => {
          onNavigate('examination?tab=admit-card' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'examination?tab=admit-card' as any, label: 'Gate Clearance & Exam Fee Clearance', action: () => { onNavigate('examination?tab=admit-card' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=admit-card' as any, label: 'Admit Card Fee Verification', action: () => { onNavigate('examination?tab=admit-card' as any); setOpenDrawer(null); } },
        ],
        isActive: activeScreen === 'examination' || effectivePath.startsWith('/examination'),
      },
      {
        id: 'reports',
        label: 'Financial Reports',
        defaultScreen: 'reports',
        action: () => {
          onNavigate('reports?tab=financial' as any);
          setOpenDrawer(null);
        },
        isActive: activeScreen === 'reports' || effectivePath.startsWith('/reports'),
      },
    ];
  } else if (userRole === 'counselor') {
    // Senior Admissions Counselor
    menuSections = [
      {
        id: 'dashboard',
        label: 'Counselor Desk',
        defaultScreen: 'staff-dashboard',
        action: () => {
          onNavigate('staff-dashboard');
          setOpenDrawer(null);
        },
        isActive: effectivePath === '/dashboard' || activeScreen === 'staff-dashboard',
      },
      {
        id: 'crm',
        label: 'Admissions CRM',
        defaultScreen: 'enquiries',
        items: [
          { id: 'enquiries' as ActiveScreen, label: 'Pre-Admission Leads Radar', action: () => { onNavigate('enquiries'); setOpenDrawer(null); } },
          { id: 'bulk-import' as ActiveScreen, label: 'Bulk Lead CSV / Excel Mapper', action: () => { onNavigate('bulk-import'); setOpenDrawer(null); } },
          { id: 'admissions' as ActiveScreen, label: 'Admissions Intake Desk', action: () => { onNavigate('admissions'); setOpenDrawer(null); } },
        ],
        isActive: ['/enquiries', '/bulk-import', '/admissions'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'students',
        label: 'Enrolled Scholars',
        defaultScreen: 'manage-students',
        items: [
          { id: 'manage-students' as ActiveScreen, label: 'Student Master Directory', action: () => { onNavigate('manage-students'); setOpenDrawer(null); } },
          { id: 'student-documents' as ActiveScreen, label: 'Regulatory Document Compliance Vault', action: () => { onNavigate('student-documents'); setOpenDrawer(null); } },
        ],
        isActive: ['/manage-students', '/student-documents'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'fees',
        label: 'Fees & Scholarships',
        defaultScreen: 'fee-ledger',
        items: [
          { id: 'fee-ledger' as ActiveScreen, label: 'Course Fee Assessment & Structure', action: () => { onNavigate('fee-ledger'); setOpenDrawer(null); } },
          { id: 'scholarships' as ActiveScreen, label: 'State & Merit Scholarships', action: () => { onNavigate('scholarships'); setOpenDrawer(null); } },
        ],
        isActive: ['/fees', '/scholarships'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'grievances',
        label: 'Grievances',
        defaultScreen: 'grievances',
        action: () => {
          onNavigate('grievances');
          setOpenDrawer(null);
        },
        isActive: effectivePath.startsWith('/grievances'),
      },
    ];
  } else if (userRole === 'hod') {
    // Head of Department
    menuSections = [
      {
        id: 'dashboard',
        label: 'HOD Desk',
        defaultScreen: 'staff-dashboard',
        action: () => {
          onNavigate('staff-dashboard');
          setOpenDrawer(null);
        },
        isActive: effectivePath === '/dashboard' || activeScreen === 'staff-dashboard',
      },
      {
        id: 'academics',
        label: 'Academics',
        defaultScreen: 'academics',
        items: [
          { id: 'academics?tab=syllabus' as any, label: 'Department CBCS Curriculum', action: () => { onNavigate('academics?tab=syllabus' as any); setOpenDrawer(null); } },
          { id: 'academics?tab=batches' as any, label: 'Batch & Section Architecture', action: () => { onNavigate('academics?tab=batches' as any); setOpenDrawer(null); } },
          { id: 'academics?tab=timetable' as any, label: 'Timetable & Combined Classes', action: () => { onNavigate('academics?tab=timetable' as any); setOpenDrawer(null); } },
          { id: 'student-quiz-lms' as ActiveScreen, label: 'Continuous Assessment (CA) Quiz', action: () => { onNavigate('student-quiz-lms'); setOpenDrawer(null); } },
        ],
        isActive: ['/academics', '/student-quiz-lms'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'students',
        label: 'Department Students',
        defaultScreen: 'manage-students',
        items: [
          { id: 'manage-students' as ActiveScreen, label: 'Department Student Master Directory', action: () => { onNavigate('manage-students'); setOpenDrawer(null); } },
          { id: 'student-documents' as ActiveScreen, label: 'Regulatory Document Compliance Vault', action: () => { onNavigate('student-documents'); setOpenDrawer(null); } },
        ],
        isActive: ['/manage-students', '/student-documents'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'examination',
        label: 'Examination',
        defaultScreen: 'examination',
        items: [
          { id: 'examination?tab=regular' as any, label: 'Department Examination Approvals', action: () => { onNavigate('examination?tab=regular' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=datesheet' as any, label: 'Datesheet & Examination Timetable', action: () => { onNavigate('examination?tab=datesheet' as any); setOpenDrawer(null); } },
          { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz & Examination LMS', action: () => { onNavigate('student-quiz-lms'); setOpenDrawer(null); } },
        ],
        isActive: ['/examination', '/student-quiz-lms'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'faculty',
        label: 'Department Faculty',
        defaultScreen: 'staff-management',
        items: [
          { id: 'staff-management' as ActiveScreen, label: 'Faculty & HRMS Directory', action: () => { onNavigate('staff-management'); setOpenDrawer(null); } },
          { id: 'teacher-documents' as ActiveScreen, label: 'Faculty Dossier Vault', action: () => { onNavigate('teacher-documents'); setOpenDrawer(null); } },
          { id: 'staff-academic-journey' as any, label: 'CAS Research Publications & Patents', action: onOpenStaffJourney },
        ],
        isActive: ['/staff-management', '/teacher-documents'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'reports',
        label: 'Academic Reports',
        defaultScreen: 'reports',
        action: () => {
          onNavigate('reports?tab=academic_workload' as any);
          setOpenDrawer(null);
        },
        isActive: effectivePath.startsWith('/reports'),
      },
      {
        id: 'grievances',
        label: 'Grievances',
        defaultScreen: 'grievances',
        action: () => {
          onNavigate('grievances');
          setOpenDrawer(null);
        },
        isActive: effectivePath.startsWith('/grievances'),
      },
    ];
  } else if (userRole === 'staff') {
    // Faculty / Assistant Professor
    menuSections = [
      {
        id: 'dashboard',
        label: 'Faculty Desk',
        defaultScreen: 'staff-dashboard',
        action: () => {
          onNavigate('staff-dashboard');
          setOpenDrawer(null);
        },
        isActive: effectivePath === '/dashboard' || activeScreen === 'staff-dashboard',
      },
      {
        id: 'academics',
        label: 'Academics',
        defaultScreen: 'academics',
        items: [
          { id: 'academics?tab=syllabus' as any, label: 'CBCS Courses & Syllabus', action: () => { onNavigate('academics?tab=syllabus' as any); setOpenDrawer(null); } },
          { id: 'academics?tab=timetable' as any, label: 'Semester Timetable Schedule', action: () => { onNavigate('academics?tab=timetable' as any); setOpenDrawer(null); } },
          { id: 'student-quiz-lms' as ActiveScreen, label: 'Continuous Assessment (CA) Quiz', action: () => { onNavigate('student-quiz-lms'); setOpenDrawer(null); } },
        ],
        isActive: ['/academics', '/student-quiz-lms'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'students',
        label: 'Students',
        defaultScreen: 'manage-students',
        items: [
          { id: 'manage-students' as ActiveScreen, label: 'Student Master Directory', action: () => { onNavigate('manage-students'); setOpenDrawer(null); } },
          { id: 'student-documents' as ActiveScreen, label: 'Regulatory Document Compliance Vault', action: () => { onNavigate('student-documents'); setOpenDrawer(null); } },
        ],
        isActive: ['/manage-students', '/student-documents'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'examination',
        label: 'Examination',
        defaultScreen: 'examination',
        items: [
          { id: 'examination?tab=regular' as any, label: 'University Examination Forms', action: () => { onNavigate('examination?tab=regular' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=datesheet' as any, label: 'Datesheet & Examination Timetable', action: () => { onNavigate('examination?tab=datesheet' as any); setOpenDrawer(null); } },
          { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz & Examination LMS', action: () => { onNavigate('student-quiz-lms'); setOpenDrawer(null); } },
        ],
        isActive: ['/examination', '/student-quiz-lms'].some(p => effectivePath.startsWith(p)),
      },
      {
        id: 'dossier',
        label: 'Faculty Dossier',
        defaultScreen: 'teacher-documents',
        items: [
          { id: 'teacher-documents' as ActiveScreen, label: 'Teaching Dossier Vault', action: () => { onNavigate('teacher-documents'); setOpenDrawer(null); } },
          { id: 'staff-academic-journey' as any, label: 'CAS Research Publications & Patents', action: onOpenStaffJourney },
        ],
        isActive: effectivePath.startsWith('/teacher-documents'),
      },
      {
        id: 'grievances',
        label: 'Grievances',
        defaultScreen: 'grievances',
        action: () => {
          onNavigate('grievances');
          setOpenDrawer(null);
        },
        isActive: effectivePath.startsWith('/grievances'),
      },
    ];
  } else if (userRole === 'hostel') {
    // Chief Hostel Warden & Campus Residence Officer
    const isHostel = effectivePath.startsWith('/hostel') || activeScreen === 'hostel-management';
    menuSections = [
      {
        id: 'overview',
        label: 'Hostel Operations',
        defaultScreen: 'hostel-management?tab=overview' as any,
        action: () => {
          onNavigate('hostel-management?tab=overview' as any);
          setOpenDrawer(null);
        },
        isActive: isHostel && (!currentTab || currentTab === 'overview'),
      },
      {
        id: 'buildings',
        label: 'Buildings & Blocks',
        defaultScreen: 'hostel-management?tab=buildings' as any,
        action: () => {
          onNavigate('hostel-management?tab=buildings' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'hostel-management?tab=buildings' as any, label: 'Owned vs Leased Blocks Registry', action: () => { onNavigate('hostel-management?tab=buildings' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=maintenance' as any, label: '360-Day Maintenance & Overhaul', action: () => { onNavigate('hostel-management?tab=maintenance' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=maintenance' as any, label: 'Quarterly Electrical Safety Inspections', action: () => { onNavigate('hostel-management?tab=maintenance' as any); setOpenDrawer(null); } },
        ],
        isActive: isHostel && currentTab === 'buildings',
      },
      {
        id: 'rooms',
        label: 'Room Inventory & Beds',
        defaultScreen: 'hostel-management?tab=rooms' as any,
        action: () => {
          onNavigate('hostel-management?tab=rooms' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'hostel-management?tab=rooms' as any, label: 'Visual Room & Bed Layout', action: () => { onNavigate('hostel-management?tab=rooms' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=rooms' as any, label: 'AC vs Non-AC / Almirah Amenities', action: () => { onNavigate('hostel-management?tab=rooms' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=rooms' as any, label: 'Room Deletion Safety Guard', action: () => { onNavigate('hostel-management?tab=rooms' as any); setOpenDrawer(null); } },
        ],
        isActive: isHostel && currentTab === 'rooms',
      },
      {
        id: 'residents',
        label: 'Resident Scholars',
        defaultScreen: 'hostel-management?tab=residents' as any,
        action: () => {
          onNavigate('hostel-management?tab=residents' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'hostel-management?tab=residents' as any, label: 'Hostellers Master Directory', action: () => { onNavigate('hostel-management?tab=residents' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=residents' as any, label: 'Room Shifting & Rent Adjustment', action: () => { onNavigate('hostel-management?tab=residents' as any); setOpenDrawer(null); } },
        ],
        isActive: isHostel && currentTab === 'residents',
      },
      {
        id: 'mess',
        label: 'Mess Dues & Clearance',
        defaultScreen: 'hostel-management?tab=mess' as any,
        action: () => {
          onNavigate('hostel-management?tab=mess' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'hostel-management?tab=mess' as any, label: 'Diet Billing (Monthly vs Semester)', action: () => { onNavigate('hostel-management?tab=mess' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=mess' as any, label: 'Issue Digital No-Dues Certificate', action: () => { onNavigate('hostel-management?tab=mess' as any); setOpenDrawer(null); } },
          { id: 'hostel-management?tab=mess' as any, label: 'Caution Deposit Refund Release', action: () => { onNavigate('hostel-management?tab=mess' as any); setOpenDrawer(null); } },
        ],
        isActive: isHostel && currentTab === 'mess',
      },
      {
        id: 'transport',
        label: 'Transport Fleet',
        defaultScreen: 'transport' as any,
        action: () => {
          onNavigate('transport' as any);
          setOpenDrawer(null);
        },
        items: [
          { id: 'transport' as any, label: 'Bus Fleet Capacity & Drivers', action: () => { onNavigate('transport' as any); setOpenDrawer(null); } },
          { id: 'transport' as any, label: 'Unallocated Transport Queue', action: () => { onNavigate('transport' as any); setOpenDrawer(null); } },
        ],
        isActive: effectivePath.startsWith('/transport') || (isHostel && currentTab === 'transport'),
      },
      {
        id: 'grievances',
        label: 'Grievances',
        defaultScreen: 'grievances',
        action: () => {
          onNavigate('grievances');
          setOpenDrawer(null);
        },
        isActive: effectivePath.startsWith('/grievances'),
      },
    ];
  } else {
    // Enrolled Scholar (Student)
    const isDashboard = effectivePath === '/dashboard' || effectivePath === '/' || activeScreen === 'student-dashboard';
    const isAttendance = currentView === 'attendance' || effectivePath.includes('attendance');

    menuSections = [
      {
        id: 'dashboard',
        label: 'Scholar Home',
        defaultScreen: 'student-dashboard',
        action: () => {
          onNavigate('student-dashboard');
          setOpenDrawer(null);
        },
        isActive: isDashboard && !isAttendance,
      },
      {
        id: 'attendance',
        label: 'Attendance & Classes',
        defaultScreen: 'student-dashboard?view=attendance' as any,
        action: () => {
          onNavigate('student-dashboard?view=attendance' as any);
          setOpenDrawer(null);
        },
        items: [
          {
            id: 'attendance-lecture' as any,
            label: 'Lecture Attendance (75% Gate Tracking)',
            action: () => {
              onNavigate('student-dashboard?view=attendance' as any);
              setOpenDrawer(null);
              setTimeout(() => {
                const el = document.getElementById('student-attendance-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-2', 'ring-[#00236f]', 'transition-all');
                  setTimeout(() => el.classList.remove('ring-2', 'ring-[#00236f]'), 3000);
                }
              }, 150);
            },
          },
          {
            id: 'academics?tab=timetable' as any,
            label: 'Semester Timetable Schedule',
            action: () => {
              onNavigate('academics?tab=timetable' as any);
              setOpenDrawer(null);
            },
          },
        ],
        isActive: isAttendance || (effectivePath.startsWith('/academics') && currentTab === 'timetable'),
      },
      {
        id: 'fees',
        label: 'Tuition & Dues',
        defaultScreen: 'fee-ledger',
        action: () => {
          onNavigate('fee-ledger');
          setOpenDrawer(null);
        },
        items: [
          { id: 'fee-ledger' as ActiveScreen, label: 'Tuition Fee Assessment & Ledger', action: () => { onNavigate('fee-ledger'); setOpenDrawer(null); } },
          {
            id: 'pay-online-dues' as any,
            label: 'Pay Online Fee Heads',
            action: () => {
              setOpenDrawer(null);
              if (onOpenPayModal) {
                onOpenPayModal();
              } else {
                onNavigate('fee-ledger?pay=true' as any);
              }
            },
          },
          { id: 'scholarships' as ActiveScreen, label: 'State & Merit Scholarships', action: () => { onNavigate('scholarships'); setOpenDrawer(null); } },
        ],
        isActive: ['fee-ledger', 'scholarships'].includes(activeScreen as any) || effectivePath.startsWith('/fees') || effectivePath.startsWith('/scholarships'),
      },
      {
        id: 'examination',
        label: 'Admit Card & Exams',
        defaultScreen: 'examination',
        action: () => {
          onNavigate('examination');
          setOpenDrawer(null);
        },
        items: [
          {
            id: 'download-admit-card' as any,
            label: 'Download Admit Card & Hall Ticket',
            action: () => {
              setOpenDrawer(null);
              if (onOpenAdmitCard) {
                onOpenAdmitCard();
              } else {
                onNavigate('examination?tab=admit-card' as any);
              }
            },
          },
          { id: 'examination?tab=regular' as any, label: 'University Regular Examination Form', action: () => { onNavigate('examination?tab=regular' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=results' as any, label: 'CBCS Semester Grade Card & SGPA Gazette', action: () => { onNavigate('examination?tab=results' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=reappear' as any, label: 'Reappear / Backlog Form', action: () => { onNavigate('examination?tab=reappear' as any); setOpenDrawer(null); } },
          { id: 'examination?tab=datesheet' as any, label: 'Datesheet & Examination Timetable', action: () => { onNavigate('examination?tab=datesheet' as any); setOpenDrawer(null); } },
          { id: 'student-quiz-lms' as ActiveScreen, label: 'CBT Quiz & Examination LMS', action: () => { onNavigate('student-quiz-lms'); setOpenDrawer(null); } },
        ],
        isActive: ['examination', 'student-quiz-lms'].includes(activeScreen as any) || effectivePath.startsWith('/examination') || effectivePath.startsWith('/student-quiz-lms'),
      },
      {
        id: 'academics',
        label: 'Syllabus & LMS',
        defaultScreen: 'academics',
        action: () => {
          onNavigate('academics');
          setOpenDrawer(null);
        },
        items: [
          { id: 'academics?tab=syllabus' as any, label: 'Choice Based Credit System (CBCS)', action: () => { onNavigate('academics?tab=syllabus' as any); setOpenDrawer(null); } },
          { id: 'academics?tab=syllabus' as any, label: 'Curriculum Syllabi Archive', action: () => { onNavigate('academics?tab=syllabus' as any); setOpenDrawer(null); } },
          { id: 'student-quiz-lms' as ActiveScreen, label: 'Continuous Assessment (CA) Quiz & LMS', action: () => { onNavigate('student-quiz-lms'); setOpenDrawer(null); } },
        ],
        isActive: (effectivePath.startsWith('/academics') && currentTab !== 'timetable') || activeScreen === 'academics',
      },
      {
        id: 'documents',
        label: 'Compliance & Help',
        defaultScreen: 'student-documents',
        action: () => {
          onNavigate('student-documents');
          setOpenDrawer(null);
        },
        items: [
          { id: 'student-documents' as ActiveScreen, label: 'Regulatory Document Compliance Vault', action: () => { onNavigate('student-documents'); setOpenDrawer(null); } },
          { id: 'grievances' as ActiveScreen, label: 'Statutory Grievance Redressal', action: () => { onNavigate('grievances'); setOpenDrawer(null); } },
        ],
        isActive: ['student-documents', 'grievances'].includes(activeScreen as any) || effectivePath.startsWith('/student-documents') || effectivePath.startsWith('/grievances'),
      },
    ];
  }

  return (
    <header className="sticky top-0 z-50 select-none font-sans" ref={navRef}>
      {/* TIER 1: Prestigious Institutional Identity Banner (Cupertino Frosted Navy #00236f) */}
      <div className="bg-[#00236f]/95 backdrop-blur-2xl text-white px-3 sm:px-6 py-2 border-b border-white/10 flex flex-nowrap items-center justify-between gap-3 text-xs overflow-x-auto no-scrollbar">
        {/* Left: Crest + Bilingual Institution Typography + Campus Cluster Indicator */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isSuperAdmin ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md ring-1 ring-white/20">
                EDU
              </div>
              <button
                type="button"
                onClick={() => onNavigate('super-admin-dashboard')}
                className="flex flex-col text-left group cursor-pointer focus:outline-none"
              >
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300/95 tracking-wide leading-tight">
                  SaaS Multi-Tenant Cloud Platform
                </span>
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white uppercase leading-tight mt-0.5">
                  EDUCORE PLATFORM ORCHESTRATOR
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium text-slate-300/80 leading-tight hidden sm:inline">
                  Multi-Tenant Collegiate Infrastructure • PostgreSQL 18.6 & MariaDB
                </span>
              </button>
              <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[11px] text-slate-200 ml-2 select-none shadow-inner shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-amber-300 font-bold">Apex Cloud:</span>
                <span className="text-white font-medium">Global Multi-Tenant Root</span>
              </div>
            </>
          ) : (
            <>
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
                  Autonomous Higher Education Ecosystem • Punjab Campus
                </span>
              </button>
              {/* Campus Switcher: Dropdown for Admin/Super Admin only; Static Text for Student/Staff (Karanvir Sir Lecture 4) */}
              {isSuperAdmin || userRole === 'admin' ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full border border-white/20 text-[11px] text-slate-200 ml-2 shadow-inner shrink-0 transition-all">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-amber-300 font-bold">Campus:</span>
                  <select
                    id="header-campus-switcher"
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value as any)}
                    className="bg-transparent text-white font-semibold text-xs border-none focus:outline-none cursor-pointer pr-1"
                    title="Switch Campus Governance View"
                  >
                    <option value="bathinda_main" className="bg-[#00236f] text-white">Bathinda Campus 01 (Main)</option>
                    <option value="faridkot_center" className="bg-[#00236f] text-white">Faridkot Campus 02 (Regional)</option>
                    <option value="all_campuses" className="bg-[#00236f] text-white">All Campuses (Aggregated View)</option>
                  </select>
                </div>
              ) : (
                <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[11px] text-slate-200 ml-2 select-none shadow-inner shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-amber-300 font-bold">Campus:</span>
                  <span className="text-white font-medium">Bathinda Campus 01 (Assigned)</span>
                </div>
              )}

              {/* Karanvir Sir Lecture 4 Breadcrumb: Campus > Active Module */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs text-white ml-2 shrink-0">
                <span className="text-slate-300 font-medium">
                  {selectedCampus === 'bathinda_main' ? 'Campus 01' : selectedCampus === 'faridkot_center' ? 'Campus 02' : 'All Campuses'}
                </span>
                <span className="text-amber-300 font-bold">›</span>
                <span className="text-amber-300 font-black tracking-tight">{activeModuleTitle}</span>
              </div>

              {/* Prominent Orange Academic Session / Term Badge (Karanvir Sir Lecture 4 Segment 0) */}
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-[#ea580c]/35 border border-[#ea580c]/80 text-amber-200 font-black text-xs rounded-full shadow-sm ml-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse shrink-0" />
                <span className="text-amber-100 font-bold uppercase tracking-wide">Session 2025-2026</span>
                <span className="text-amber-400 font-bold">•</span>
                <span className="text-white font-medium text-[11px]">Odd Sem (Aug-Nov)</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Operational Controls, Canonical Digit UID & Utilities */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Global Search: Hidden for Students; Visible to Admin/Staff (Karanvir Sir Lecture 4: 13 digits student, 8-9 digits staff) */}
          {userRole !== 'student' && (
            <div className="hidden xl:flex items-center w-48 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search UID / Name... ⌘K"
                className="w-full h-8 pl-3.5 pr-8 bg-white/10 backdrop-blur-md hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/60 text-xs font-medium rounded-full border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all font-mono"
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-mono font-semibold text-white/60">
                ⌘K
              </span>

              {/* Live Search Results Popup: Exact Match vs Similar Matches (Karanvir Sir Lecture 4) */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white/98 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 text-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                    <span>Search Results: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Section 1: Exact Match */}
                  <div className="mt-2">
                    <span className="text-[10px] font-extrabold text-[#ea580c] tracking-wider uppercase block mb-1">
                      Exact Match (UID / EMP ID)
                    </span>
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#00236f] text-xs">
                          {searchQuery.replace(/[^0-9]/g, '').length === 13 ? 'Student Scholar Record' : 'Faculty / Staff Record'}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-[#00236f] border border-blue-200">
                          {searchQuery}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Match detected in canonical database. Direct dossier available.
                      </p>
                      <div className="pt-1 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('manage-students');
                            onSearchChange('');
                          }}
                          className="px-2 py-0.5 rounded bg-[#00236f] text-white text-[10px] font-bold hover:bg-[#001744]"
                        >
                          View Student Master →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('fee-ledger');
                            onSearchChange('');
                          }}
                          className="px-2 py-0.5 rounded bg-white text-[#00236f] border border-blue-200 text-[10px] font-bold hover:bg-slate-50"
                        >
                          Fee Ledger
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Similar / Nearby Matches */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase block mb-1">
                      Similar / Nearby Matches
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto text-[11px]">
                      {[
                        { name: 'Aryan Sharma', id: '1001-88-03-01', dept: 'CSE Sem 4', role: 'Student' },
                        { name: 'Priya Verma', id: '1001-88-03-02', dept: 'CSE Sem 4', role: 'Student' },
                        { name: 'Dr. Gurpreet Singh', id: '2001-14-03-01', dept: 'CSE Faculty', role: 'Professor' },
                        { name: 'Harpreet Kaur', id: '4001-01-03-01', dept: 'Admin Provost', role: 'Administrator' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onNavigate('manage-students');
                            onSearchChange('');
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-slate-700"
                        >
                          <div>
                            <span className="font-semibold block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.id} • {item.dept}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{item.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Welcome User & Institutional Role Pill with 3-Option Profile Popover (Karanvir Sir Lecture 4) */}
          {currentUser && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 h-8 px-3.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-xs cursor-pointer select-none shrink-0"
                title="Open Profile Options"
              >
                <div className="w-5 h-5 rounded-full bg-amber-400 text-[#00236f] flex items-center justify-center font-black text-[10px] shrink-0">
                  {(currentUser.full_name || currentUser.username || 'U')[0].toUpperCase()}
                </div>
                <span className="font-bold text-xs text-white tracking-tight truncate max-w-[120px] sm:max-w-[180px]">
                  {(currentUser.full_name || currentUser.username).replace(/\s*\(\d+\)\s*$/, '')}
                </span>
                <span className="text-white/40 text-xs font-bold hidden sm:inline">•</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-tight whitespace-nowrap">
                  {getInstitutionalRoleTitle(currentUser)}
                </span>
                <span className="text-xs text-amber-300 font-bold ml-0.5">▾</span>
              </button>

              {/* Profile Popover: Exactly 3 Items (Profile Information, Reset Password, Logout) */}
              {isProfileMenuOpen && (
                <div
                  onMouseLeave={() => setIsProfileMenuOpen(false)}
                  className="absolute right-0 top-full mt-2 w-56 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 text-slate-800 animate-in fade-in"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="block font-bold text-xs text-[#00236f]">
                      {(currentUser.full_name || currentUser.username).replace(/\s*\(\d+\)\s*$/, '')}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400">
                      {currentUser.email || displayUid}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (currentUser.role === 'student') {
                          onNavigate('student-dashboard');
                        } else {
                          onNavigate('staff-management');
                        }
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
                    >
                      <span>1. Profile Information</span>
                      <span className="text-slate-400 text-xs">👤</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        alert(`Password reset link dispatched to ${currentUser.email || 'your registered phone/email'}.`);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
                    >
                      <span>2. Reset Password</span>
                      <span className="text-slate-400 text-xs">🔑</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold hover:bg-rose-50 text-rose-600 flex items-center justify-between cursor-pointer"
                    >
                      <span>3. Logout</span>
                      <span className="text-rose-500 text-xs">🚪</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 flex items-center h-11 justify-between gap-3">
          {/* Left: Universal Back Pill + Main Navigation Hubs */}
          <div className="flex items-center gap-1.5 h-full overflow-x-auto no-scrollbar py-1 shrink-0">
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
            <nav className="flex items-center gap-1.5 h-full shrink-0">
              {menuSections.map(sec => {
                const isDrawerOpen = openDrawer === sec.id;
                const hasChildren = Boolean(sec.items && sec.items.length > 0);

                return (
                  <div
                    key={sec.id}
                    className="relative h-full flex items-center shrink-0"
                    onMouseEnter={() => hasChildren && handleMouseEnter(sec.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (closeTimerRef.current) {
                          clearTimeout(closeTimerRef.current);
                          closeTimerRef.current = null;
                        }
                        if (hasChildren) {
                          // Click toggles the drawer so touch/click users can easily open/close submenus
                          setOpenDrawer(isDrawerOpen ? null : sec.id);
                        } else {
                          setOpenDrawer(null);
                          if (sec.action) {
                            sec.action();
                          } else if (sec.defaultScreen) {
                            onNavigate(sec.defaultScreen);
                          }
                        }
                      }}
                      className={`h-8 sm:h-full px-2.5 sm:px-3 text-xs font-semibold tracking-tight transition-colors flex items-center gap-1.5 cursor-pointer select-none relative rounded-lg sm:rounded-none shrink-0 ${
                        sec.isActive || isDrawerOpen
                          ? 'text-[#00236f] font-bold bg-slate-100 sm:bg-transparent'
                          : 'text-slate-600 hover:text-[#00236f] hover:bg-slate-50 sm:hover:bg-transparent'
                      }`}
                      aria-expanded={hasChildren ? isDrawerOpen : undefined}
                      aria-haspopup={hasChildren ? 'true' : undefined}
                    >
                      <span className="whitespace-nowrap font-medium">{sec.label}</span>
                      {hasChildren && (
                        <span
                          title={`Toggle ${sec.label} menu`}
                          className={`text-[10px] transition-transform duration-200 pointer-events-none ${isDrawerOpen ? 'rotate-180 text-[#00236f] font-bold' : 'text-slate-400'}`}
                        >
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
                        className={`absolute top-full pt-1 z-50 select-none before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] ${
                          sec.items!.length > 4 ? 'w-[420px] sm:w-[480px]' : 'min-w-[280px] sm:min-w-[320px]'
                        } ${sec.id === 'governance' || sec.id === 'staff' ? 'right-0 left-auto' : 'left-0'}`}
                      >
                        <div className="bg-white/98 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_45px_-10px_rgba(0,35,111,0.18),0_0_0_1px_rgba(0,35,111,0.04)] rounded-2xl p-3 animate-flyout">
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

                          {/* Interactive Action Grid (Pure Text Hierarchy, Zero Icons) */}
                          <div className={`py-1.5 ${sec.items!.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2 gap-1' : 'space-y-0.5'}`}>
                            {sec.items!.map((item: any, itemIdx: number) => (
                              <button
                                key={`${sec.id}-${item.id || itemIdx}-${item.label}`}
                                type="button"
                                onClick={() => {
                                  if (closeTimerRef.current) {
                                    clearTimeout(closeTimerRef.current);
                                    closeTimerRef.current = null;
                                  }
                                  setOpenDrawer(null);
                                  if (item.action) {
                                    item.action();
                                  } else if (item.id) {
                                    onNavigate(item.id);
                                  }
                                }}
                                className={`w-full px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-left flex items-center justify-between cursor-pointer group ${
                                  activeScreen === item.id
                                    ? 'bg-[#00236f] text-white shadow-2xs font-bold'
                                    : 'text-slate-700 hover:bg-slate-100/90 hover:text-[#00236f]'
                                }`}
                              >
                                <span className="truncate">{item.label}</span>
                                {activeScreen === item.id && (
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-300 ml-2">Active</span>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Card Footer Quick Note */}
                          <div className="pt-2 mt-1 border-t border-slate-100 px-3 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Statutory Regulation Active</span>
                            <span className="font-semibold text-slate-500">Autonomous Campus</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right: Sleek Text-Only Session & Multi-University Accreditation Strip (Zero Boxes, Zero Icons) */}
          {isSuperAdmin ? (
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 font-medium select-none shrink-0 pr-2">
              <span className="text-slate-400">Environment: <strong className="text-emerald-700 font-semibold">Production Cloud</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-semibold tracking-tight">PostgreSQL 18.6 & MariaDB Multi-Pool</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium select-none shrink-0 pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-semibold tracking-tight">System Operational • Bathinda Main Campus</span>
            </div>
          )}
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

