import React, { useState, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, StudentProfile, NoticeItem, UserRole, ActiveScreen } from './types';
import { api, getStoredToken, setStoredToken, removeStoredToken, setStoredUser } from './api/client';
import { isGitHubPages } from './api/supabaseClient';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StudentDashboardView } from './components/StudentDashboardView';
import { LoginView } from './components/LoginView';
import { AdmissionFormView } from './components/AdmissionFormView';
import { AdmissionsAdminView } from './components/AdmissionsAdminView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ManageStudentsView } from './components/ManageStudentsView';
import { FeeLedgerView } from './components/FeeLedgerView';
import { ScholarshipsView } from './components/ScholarshipsView';
import { DynamicFormBuilderView } from './components/DynamicFormBuilderView';
import { ReceiptModal } from './components/ReceiptModal';
import { PayNowModal } from './components/PayNowModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { EmailRemindersModal } from './components/EmailRemindersModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { AICopilotModal } from './components/AICopilotModal';
import { GrievanceView } from './components/GrievanceView';
import { MRSPTUAdmitCardModal } from './components/MRSPTUAdmitCardModal';
import { StaffDashboardView } from './components/StaffDashboardView';
import { AcademicsView } from './components/AcademicsView';
import { ReportsView } from './components/ReportsView';
import { UserManagementView } from './components/UserManagementView';
import { AuditTrailModal } from './components/AuditTrailModal';
import { MasterTablesModal } from './components/MasterTablesModal';
import { StaffAcademicJourneyModal } from './components/StaffAcademicJourneyModal';
import { TelephonyCallDock, TelephonyCandidate } from './components/TelephonyCallDock';
import { StudentDocumentsView } from './components/StudentDocumentsView';
import { TeacherDocumentsView } from './components/TeacherDocumentsView';
import { StudentQuizLMSView } from './components/StudentQuizLMSView';
import { StaffManagementView } from './components/StaffManagementView';
import { PartnerPortalView } from './components/PartnerPortalView';
import { BulkImportView } from './components/BulkImportView';
import { EnquiriesView } from './components/EnquiriesView';
import { UniversityExamPortalView } from './components/UniversityExamPortalView';
import { TenantsManagementView } from './components/TenantsManagementView';
import { PaymentGatewaysView } from './components/PaymentGatewaysView';
import { FieldPermissionsView } from './components/FieldPermissionsView';
import { SuperAdminDashboardView } from './components/SuperAdminDashboardView';
import { HostelManagementView } from './components/HostelManagementView';
import { ErrorBoundary } from './components/ErrorBoundary';

interface LayoutProps {
  currentUser: User | null;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAuditLogs?: () => void;
  onOpenMasterTables?: (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents') => void;
  onOpenPayModal?: () => void;
  onOpenAdmitCard?: () => void;
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<LayoutProps> = ({
  currentUser,
  onLogout,
  searchQuery,
  onSearchChange,
  onOpenAuditLogs: propOnOpenAuditLogs,
  onOpenMasterTables: propOnOpenMasterTables,
  onOpenPayModal: propOnOpenPayModal,
  onOpenAdmitCard: propOnOpenAdmitCard,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCopilot, setShowCopilot] = useState(false);
  const [internalShowAuditLogs, setInternalShowAuditLogs] = useState(false);
  const [internalShowMasterTables, setInternalShowMasterTables] = useState(false);
  const [internalMasterTablesTab, setInternalMasterTablesTab] = useState<'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents'>('states');
  const [showStaffJourney, setShowStaffJourney] = useState(false);
  const [showAdmitCard, setShowAdmitCard] = useState(false);
  const [isTelephonyOpen, setIsTelephonyOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<TelephonyCandidate | null>({
    id: 'cand-001',
    name: 'Gurpreet Singh',
    phone: '+91 98765 11221',
    course: 'B.Tech CSE',
    quota: 'punjab_85',
  });

  const handleAudit = propOnOpenAuditLogs || (() => setInternalShowAuditLogs(true));
  const handleMaster = (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents') => {
    if (propOnOpenMasterTables) {
      propOnOpenMasterTables(tab);
    } else {
      if (tab) setInternalMasterTablesTab(tab);
      setInternalShowMasterTables(true);
    }
  };
  const handleOpenAdmit = propOnOpenAdmitCard || (() => setShowAdmitCard(true));
  const handleOpenPay = propOnOpenPayModal;

  const getActiveScreenFromPath = (path: string): ActiveScreen => {
    switch (path) {
      case '/fees':
        return 'fee-ledger';
      case '/admissions':
        return 'admissions';
      case '/manage-students':
        return 'manage-students';
      case '/scholarships':
        return 'scholarships';
      case '/form-builder':
        return 'form-builder';
      case '/academics':
        return 'academics';
      case '/reports':
        return 'reports';
      case '/settings':
        return 'settings';
      case '/grievances':
        return 'grievances';
      case '/user-management':
        return 'user-management';
      case '/student-documents':
        return 'student-documents';
      case '/teacher-documents':
        return 'teacher-documents';
      case '/student-quiz-lms':
        return 'student-quiz-lms';
      case '/staff-management':
        return 'staff-management';
      case '/partner-portal':
        return 'partner-portal';
      case '/bulk-import':
        return 'bulk-import';
      case '/enquiries':
        return 'enquiries';
      case '/examination':
      case '/examination-portal':
        return 'examination';
      case '/tenants':
        return 'tenants';
      case '/payment-gateways':
        return 'payment-gateways';
      case '/field-permissions':
        return 'field-permissions';
      case '/master-architecture':
        return 'master-architecture' as any;
      case '/audit-logs':
      case '/forensics':
        return 'audit-logs' as any;
      case '/telemetry':
        return 'telemetry' as any;
      case '/dashboard':
      default:
        return currentUser?.role === 'super_admin'
          ? 'super-admin-dashboard'
          : currentUser?.role === 'admin'
          ? 'admin-dashboard'
          : currentUser?.role === 'hr'
          ? 'staff-management'
          : (currentUser?.role === 'staff' || currentUser?.role === 'counselor' || currentUser?.role === 'hod')
          ? 'staff-dashboard'
          : currentUser?.role === 'partner'
          ? 'partner-portal'
          : currentUser?.role === 'accounts'
          ? 'fee-ledger'
          : 'student-dashboard';
    }
  };

  const handleNavigate = (screen: any) => {
    const screenStr = String(screen);
    const [pathPart, queryPart] = screenStr.split('?');
    const qs = queryPart ? `?${queryPart}` : '';

    if (pathPart === 'fee-ledger' || pathPart === 'fees') {
      navigate(`/fees${qs}`);
    } else if (
      pathPart === 'student-dashboard' ||
      pathPart === 'admin-dashboard' ||
      pathPart === 'super-admin-dashboard' ||
      pathPart === 'staff-dashboard' ||
      pathPart === 'dashboard'
    ) {
      navigate(`/dashboard${qs}`);
    } else if (pathPart.startsWith('/')) {
      navigate(`${pathPart}${qs}`);
    } else {
      navigate(`/${pathPart}${qs}`);
    }
  };

  const currentScreenId = getActiveScreenFromPath(location.pathname);

  const canGoBack = location.pathname !== '/dashboard' && location.pathname !== '/';

  const handleGoBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        if (canGoBack) {
          e.preventDefault();
          handleGoBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack]);

  const getBreadcrumbData = (path: string) => {
    switch (path) {
      case '/dashboard':
        return currentUser?.role === 'super_admin'
          ? { category: 'Super Admin Architecture', title: 'Universal Provost & SaaS Master Cockpit' }
          : currentUser?.role === 'admin'
          ? { category: 'Operations & Governance', title: 'Institutional Executive Governance Cockpit' }
          : currentUser?.role === 'hr'
          ? { category: 'HRMS & Establishment', title: 'Faculty & Staff Establishment Console' }
          : currentUser?.role === 'staff' || currentUser?.role === 'hod'
          ? { category: 'Faculty Desk', title: 'Academic Classroom & Sessional Console' }
          : currentUser?.role === 'student'
          ? { category: 'Scholar Home', title: 'Enrolled Scholar Academic Cockpit' }
          : { category: 'Operations', title: 'Console Module' };
      case '/fees':
        return { category: 'Finance & Accounts', title: 'Fee Ledger & Collections' };
      case '/admissions':
        return { category: 'Admissions & CRM', title: 'Application Desk & Scrutiny' };
      case '/manage-students':
        return { category: 'Students & Registry', title: 'Student Master Directory' };
      case '/scholarships':
        return { category: 'Finance & Accounts', title: 'Scholarships & Merit Waivers' };
      case '/form-builder':
        return { category: 'Administration', title: 'Dynamic Form Builder' };
      case '/academics':
        return { category: 'Academics & Exams', title: 'Academics & Course Curriculum' };
      case '/reports':
        return { category: 'Analytics & MIS', title: 'Institutional Reports & Exports' };
      case '/settings':
        return { category: 'Administration', title: 'Institutional & Stack Settings' };
      case '/grievances':
        return { category: 'Campus Welfare', title: 'Student Grievances & Redressal' };
      case '/user-management':
        return { category: 'Administration', title: 'RBAC & Identity Directory' };
      case '/student-documents':
        return { category: 'Academics & Exams', title: 'Student Regulatory Documents Vault' };
      case '/teacher-documents':
        return { category: 'Faculty & Research', title: 'Faculty Research Dossier & CV' };
      case '/student-quiz-lms':
        return { category: 'Academics & Exams', title: 'Online CBT Quiz & LMS Assessment' };
      case '/staff-management':
        return { category: 'Human Resources', title: 'Faculty & Staff Registry' };
      case '/partner-portal':
        return { category: 'Admissions & CRM', title: 'Consultant & Agency Portal' };
      case '/bulk-import':
        return { category: 'Admissions & CRM', title: 'Bulk CSV Lead Mapper' };
      case '/enquiries':
        return { category: 'Admissions & CRM', title: 'Admissions CRM & Inquiries Pipeline' };
      case '/examination':
      case '/examination-portal':
        return { category: 'Academics & Exams', title: 'University Examination & Gate Clearance Portal' };
      case '/tenants':
        return { category: 'Tenants & Campuses', title: 'Multi-Tenant Institutions & Subdomains' };
      case '/payment-gateways':
        return { category: 'Finance & Accounts', title: 'Payment Gateways & Current Accounts' };
      case '/field-permissions':
        return { category: 'Universal Access & RBAC', title: 'Field-Level Permissions Matrix' };
      case '/master-architecture':
        return { category: 'Master Architecture', title: 'Tenant-Agnostic Master Relational System' };
      case '/audit-logs':
      case '/forensics':
        return { category: 'Cryptographic Forensics', title: 'Universal Immutable Audit Trail' };
      case '/telemetry':
        return { category: 'Database & Telemetry', title: 'High-Throughput PostgreSQL & MariaDB Health' };
      case '/hostel':
      case '/hostel-management':
        return { category: 'Campus Residences', title: 'Hostel Operations, Residence & Logistics Command' };
      default:
        return { category: 'Portal', title: 'Console Module' };
    }
  };

  const breadcrumb = getBreadcrumbData(location.pathname);

  return (
    <div id="educore-app-root" className="min-h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f] antialiased">
      <Header
        currentUser={currentUser}
        activeScreen={currentScreenId}
        currentPath={location.pathname}
        currentSearch={location.search}
        onNavigate={handleNavigate}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenCopilot={() => setShowCopilot(true)}
        onLogout={onLogout}
        onToggleTelephony={() => setIsTelephonyOpen(!isTelephonyOpen)}
        isTelephonyOpen={isTelephonyOpen}
        onOpenAuditLogs={handleAudit}
        onOpenMasterTables={handleMaster}
        onOpenStaffJourney={() => setShowStaffJourney(true)}
        onOpenAdmitCard={handleOpenAdmit}
        onOpenPayModal={handleOpenPay}
      />

      <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 pb-12">
        {/* Cupertino Breadcrumb Ribbon (Clean single-back navigation) */}
        {canGoBack && (
          <nav aria-label="Breadcrumb Navigation" className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] text-xs text-slate-600">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Breadcrumb Steps */}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="hover:text-[#00236f] font-semibold transition-colors cursor-pointer flex items-center gap-1 text-xs"
              >
                <span>Console</span>
              </button>

              <span className="text-slate-300 font-bold select-none text-xs">›</span>

              <span className="text-slate-500 font-medium text-xs">
                {breadcrumb.category}
              </span>

              <span className="text-slate-300 font-bold select-none text-xs">›</span>

              <span className="font-bold text-[#00236f] truncate max-w-[240px] sm:max-w-md text-xs">
                {breadcrumb.title}
              </span>
            </div>

            {/* Right Institutional Pill */}
            <div className="hidden sm:flex items-center gap-2 shrink-0 text-xs">
              {currentUser?.role === 'super_admin' ? (
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Global Multi-Tenant Cloud Root
                </span>
              ) : (
                <span className="font-semibold text-[#00236f] bg-blue-50/90 px-2.5 py-0.5 rounded-full border border-blue-100">
                  PUP Patiala • MRSPTU • PU Affiliated
                </span>
              )}
            </div>
          </nav>
        )}

        {children}
      </main>

      {/* Global Modals */}
      <AICopilotModal
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        currentUser={currentUser}
      />
      <AuditTrailModal
        isOpen={internalShowAuditLogs}
        onClose={() => setInternalShowAuditLogs(false)}
      />
      <MasterTablesModal
        isOpen={internalShowMasterTables}
        initialTab={internalMasterTablesTab}
        onClose={() => setInternalShowMasterTables(false)}
      />
      <StaffAcademicJourneyModal
        isOpen={showStaffJourney}
        onClose={() => setShowStaffJourney(false)}
        currentUser={currentUser}
      />
      {showAdmitCard && (
        <MRSPTUAdmitCardModal
          studentId={currentUser?.role === 'student' ? (currentUser.id || 'me') : 'stu-rec-aryan'}
          onClose={() => setShowAdmitCard(false)}
          onOpenPayModal={() => {
            setShowAdmitCard(false);
            navigate('/fees');
          }}
        />
      )}
      <TelephonyCallDock
        isOpen={isTelephonyOpen}
        onClose={() => setIsTelephonyOpen(false)}
        activeCandidate={activeCandidate}
      />
    </div>
  );
};

export default function App() {
  const RouterComponent = isGitHubPages ? HashRouter : BrowserRouter;
  return (
    <RouterComponent>
      <MainApp />
    </RouterComponent>
  );
}

function MainApp() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Modals state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceiptNo, setActiveReceiptNo] = useState<string | undefined>(undefined);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetPayFeeId, setTargetPayFeeId] = useState<string | undefined>(undefined);
  const [targetPayStudent, setTargetPayStudent] = useState<any | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isEmailRemindersOpen, setIsEmailRemindersOpen] = useState(false);
  const [isAdmitCardOpen, setIsAdmitCardOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);

  // Master Architecture & Cryptographic Forensics Global Modals
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showMasterTables, setShowMasterTables] = useState(false);
  const [masterTablesTab, setMasterTablesTab] = useState<'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents'>('states');

  const handleOpenMasterTables = (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents') => {
    if (tab) setMasterTablesTab(tab);
    setShowMasterTables(true);
  };
  const handleOpenAuditLogs = () => {
    setShowAuditLogs(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as any;
    if (tab && ['states', 'departments', 'institutions', 'userTypes', 'degrees', 'documents'].includes(tab)) {
      setMasterTablesTab(tab);
    }
  }, [location.search]);
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
            setCurrentStudent(res.student || null);
          } else {
            removeStoredToken();
            setCurrentUser(null);
            setCurrentStudent(null);
          }
        } catch {
          removeStoredToken();
          setCurrentUser(null);
          setCurrentStudent(null);
        }
      }

      // Check DB health and load notices
      api.getHealth().then(res => {
        if (res.success) {
          setDbStatus(res);
        }
      });

      api.getNotices().then(res => {
        if (res.success && res.notices) {
          setNotices(res.notices);
        }
      });

      setIsInitializing(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (credentials: { username: string; password: string; role: UserRole }) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.login(credentials);
      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        setStoredUser(res.user);
        setCurrentUser(res.user);
        setCurrentStudent(res.student || null);
        navigate('/dashboard', { replace: true });
      } else {
        setAuthError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Server error occurred during authentication.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const refreshCurrentStudent = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.student) {
          setCurrentStudent(res.student);
        }
      }
    } catch (err) {
      console.error('Failed to refresh current student:', err);
    }
  };

  const handleLogout = () => {
    const wasAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';
    removeStoredToken();
    setCurrentUser(null);
    setCurrentStudent(null);
    navigate(wasAdmin ? '/admin' : '/', { replace: true });
  };

  const handleScreenNavigate = (target: string) => {
    const [pathPart, queryPart] = String(target).split('?');
    const qs = queryPart ? `?${queryPart}` : '';

    if (pathPart === 'fee-ledger' || pathPart === 'fees') {
      navigate(`/fees${qs}`);
    } else if (pathPart === 'hostel-management' || pathPart === 'hostel') {
      navigate(`/hostel${qs}`);
    } else if (
      pathPart === 'student-dashboard' ||
      pathPart === 'admin-dashboard' ||
      pathPart === 'super-admin-dashboard' ||
      pathPart === 'staff-dashboard' ||
      pathPart === 'dashboard'
    ) {
      navigate(`/dashboard${qs}`);
    } else if (pathPart.startsWith('/')) {
      navigate(`${pathPart}${qs}`);
    } else {
      navigate(`/${pathPart}${qs}`);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#001744] flex flex-col items-center justify-center text-white space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-[12px] font-black tracking-widest text-white uppercase">
            EDUCORE ENTERPRISE ERP
          </p>
          <p className="text-[10px] font-mono text-[#ea580c] uppercase mt-0.5">
            [BFGI CAMPUS PORTAL • INITIALIZING CANONICAL SESSION]
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* PUBLIC ROUTES: Student & Admin Login */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginView
                presetRole="student"
                onLogin={handleLogin}
                onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
                isLoading={isAuthLoading}
                errorMessage={authError}
              />
            )
          }
        />

        <Route
          path="/admin"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginView
                presetRole="admin"
                onLogin={handleLogin}
                onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
                isLoading={isAuthLoading}
                errorMessage={authError}
              />
            )
          }
        />

        {/* PROTECTED ROUTES */}
        <Route
          path="/dashboard"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenMasterTables={handleOpenMasterTables}
                onOpenAuditLogs={handleOpenAuditLogs}
                onOpenPayModal={() => {
                  setTargetPayFeeId(undefined);
                  setTargetPayStudent(currentStudent);
                  setIsPayModalOpen(true);
                }}
                onOpenAdmitCard={() => setIsAdmitCardOpen(true)}
              >
                {currentUser.role === 'super_admin' ? (
                  <SuperAdminDashboardView
                    currentUser={currentUser}
                    onNavigate={handleScreenNavigate}
                    onOpenMasterTables={handleOpenMasterTables}
                    onOpenAuditLogs={handleOpenAuditLogs}
                  />
                ) : currentUser.role === 'admin' ? (
                  <AdminDashboardView
                    onNavigate={handleScreenNavigate}
                    onOpenEmailReminders={() => setIsEmailRemindersOpen(true)}
                  />
                ) : currentUser.role === 'hr' ? (
                  <StaffManagementView currentUser={currentUser} />
                ) : (currentUser.role === 'staff' || currentUser.role === 'counselor' || currentUser.role === 'hod') ? (
                  <StaffDashboardView
                    currentUser={currentUser}
                    onNavigate={handleScreenNavigate}
                  />
                ) : currentUser.role === 'partner' ? (
                  <PartnerPortalView currentUser={currentUser} />
                ) : currentUser.role === 'hostel' ? (
                  <HostelManagementView currentUser={currentUser} />
                ) : currentUser.role === 'accounts' ? (
                  <FeeLedgerView
                    currentUser={currentUser}
                    onOpenReceiptModal={receiptNo => {
                      setActiveReceiptNo(receiptNo);
                      setIsReceiptOpen(true);
                    }}
                    onOpenPayModal={(feeId, student) => {
                      setTargetPayFeeId(feeId);
                      setTargetPayStudent(student);
                      setIsPayModalOpen(true);
                    }}
                  />
                ) : (
                  <StudentDashboardView
                    student={currentStudent}
                    notices={notices}
                    onNavigate={handleScreenNavigate}
                    onOpenPayModal={() => {
                      setTargetPayFeeId(undefined);
                      setTargetPayStudent(currentStudent);
                      setIsPayModalOpen(true);
                    }}
                    onOpenReceiptModal={receiptNo => {
                      setActiveReceiptNo(receiptNo || 'REC-2024-0088');
                      setIsReceiptOpen(true);
                    }}
                    onOpenAdmitCardModal={() => setIsAdmitCardOpen(true)}
                  />
                )}
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/fees"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenPayModal={() => {
                  setTargetPayFeeId(undefined);
                  setTargetPayStudent(currentStudent);
                  setIsPayModalOpen(true);
                }}
                onOpenAdmitCard={() => setIsAdmitCardOpen(true)}
              >
                <FeeLedgerView
                  currentUser={currentUser}
                  currentStudent={currentStudent}
                  onOpenPayModal={(feeId, studentObj) => {
                    setTargetPayFeeId(feeId);
                    setTargetPayStudent(studentObj || currentStudent);
                    setIsPayModalOpen(true);
                  }}
                  onOpenReceiptModal={receiptNo => {
                    setActiveReceiptNo(receiptNo || 'REC-2024-0088');
                    setIsReceiptOpen(true);
                  }}
                />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/admissions"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                {['admin', 'super_admin', 'staff', 'counselor', 'hod'].includes(currentUser.role) ? (
                  <AdmissionsAdminView
                    currentUser={currentUser}
                    onSelectStudent={student => setViewingStudent(student)}
                  />
                ) : (
                  <AdmissionFormView
                    onApplicationSubmitted={() => {
                      navigate('/dashboard');
                    }}
                  />
                )}
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/manage-students"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'staff', 'counselor', 'hod', 'accounts', 'hr'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <ManageStudentsView
                  currentUser={currentUser}
                  onSelectStudent={student => setViewingStudent(student)}
                  onOpenEmailReminders={() => setIsEmailRemindersOpen(true)}
                />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/scholarships"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <ScholarshipsView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/form-builder"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <DynamicFormBuilderView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/academics"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <AcademicsView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/examination"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <UniversityExamPortalView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/examination-portal"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <UniversityExamPortalView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/reports"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'staff', 'accounts', 'hod', 'hr', 'counselor'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <ReportsView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/telemetry"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenMasterTables={handleOpenMasterTables}
                onOpenAuditLogs={handleOpenAuditLogs}
              >
                <ReportsView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/master-architecture"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenMasterTables={handleOpenMasterTables}
                onOpenAuditLogs={handleOpenAuditLogs}
              >
                <div className="w-full">
                  <MasterTablesModal
                    isOpen={true}
                    initialTab={masterTablesTab}
                    onClose={() => navigate('/dashboard')}
                    isEmbeddedView={true}
                  />
                </div>
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/audit-logs"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenMasterTables={handleOpenMasterTables}
                onOpenAuditLogs={handleOpenAuditLogs}
              >
                <div className="w-full">
                  <AuditTrailModal
                    isOpen={true}
                    onClose={() => navigate('/dashboard')}
                    isEmbeddedView={true}
                  />
                </div>
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/forensics"
          element={<Navigate to="/audit-logs" replace />}
        />

        <Route
          path="/settings"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-[#191c1d]">System & Security Settings</h2>
                  <div className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs space-y-4 text-xs">
                    <h3 className="text-sm font-bold text-[#191c1d] border-b border-[#f3f4f5] pb-2 flex items-center justify-between">
                      <span>Institutional Infrastructure & Node.js/MariaDB Stack</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00236f] bg-[#ffedd5] px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                        {dbStatus?.activeEngine || 'SQL Database Engine Connected'}
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[#757682] block">Database Engine:</span>
                        <strong className="text-[#191c1d] capitalize">
                          {dbStatus?.mode === 'mariadb' ? 'MariaDB 11.4 Relational Pool' : 'SQLite Persistent File Engine'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#757682] block">Auth Protocol:</span>
                        <strong className="text-[#191c1d]">JWT Bearer Tokens + Bcrypt Hashes</strong>
                      </div>
                      <div>
                        <span className="text-[#757682] block">Active Session:</span>
                        <strong className="text-[#00236f]">2025-26 (Fall Admissions)</strong>
                      </div>
                      <div>
                        <span className="text-[#757682] block">Storage Location:</span>
                        <strong className="text-[#191c1d]">{dbStatus?.storageLocation || '/uploads & /database'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/grievances"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <GrievanceView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/user-management"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <UserManagementView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/student-documents"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <StudentDocumentsView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/teacher-documents"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'staff', 'hod', 'hr'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <TeacherDocumentsView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/student-quiz-lms"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <StudentQuizLMSView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/staff-management"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'hod', 'hr'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <StaffManagementView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/partner-portal"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'partner'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <PartnerPortalView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/hostel"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'hostel'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <HostelManagementView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/hostel-management"
          element={<Navigate to="/hostel" replace />}
        />

        <Route
          path="/bulk-import"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'staff', 'counselor', 'hod', 'hr'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <BulkImportView currentUser={currentUser} onNavigateToCRM={() => navigate('/enquiries')} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/enquiries"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['admin', 'super_admin', 'staff', 'counselor', 'hod', 'hr'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <EnquiriesView
                  currentUser={currentUser}
                  onNavigateToBulkImport={() => navigate('/bulk-import')}
                  onNavigateToManageStudents={() => navigate('/manage-students')}
                />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/tenants"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['super_admin', 'admin'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <TenantsManagementView
                  currentUser={currentUser}
                  onNavigate={handleScreenNavigate}
                />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/payment-gateways"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['super_admin', 'admin', 'accounts'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <PaymentGatewaysView />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/field-permissions"
          element={
            !currentUser ? (
              <Navigate to="/" replace />
            ) : !['super_admin', 'admin'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <FieldPermissionsView />
              </AuthenticatedLayout>
            )
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      {isReceiptOpen && (
        <ReceiptModal
          receiptNo={activeReceiptNo}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

      {isPayModalOpen && (
        <PayNowModal
          student={targetPayStudent || currentStudent}
          feeId={targetPayFeeId}
          onClose={() => {
            setIsPayModalOpen(false);
            setTargetPayStudent(null);
            setTargetPayFeeId(undefined);
          }}
          onPaymentSuccess={receiptNo => {
            setIsPayModalOpen(false);
            setTargetPayStudent(null);
            setTargetPayFeeId(undefined);
            setActiveReceiptNo(receiptNo);
            setIsReceiptOpen(true);
            refreshCurrentStudent();
          }}
        />
      )}

      {isForgotPasswordOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotPasswordOpen(false)} />
      )}

      {isEmailRemindersOpen && (
        <EmailRemindersModal onClose={() => setIsEmailRemindersOpen(false)} />
      )}

      {isAdmitCardOpen && (
        <MRSPTUAdmitCardModal
          studentId={targetPayStudent?.id || currentStudent?.id || 'me'}
          onClose={() => setIsAdmitCardOpen(false)}
          onOpenPayModal={() => {
            setIsAdmitCardOpen(false);
            setTargetPayStudent(targetPayStudent || currentStudent);
            setTargetPayFeeId(undefined);
            setIsPayModalOpen(true);
          }}
        />
      )}

      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          currentUser={currentUser}
          onStudentUpdated={refreshCurrentStudent}
          onClose={() => setViewingStudent(null)}
          onPayFee={() => {
            setTargetPayStudent(viewingStudent);
            setTargetPayFeeId(undefined);
            setViewingStudent(null);
            setIsPayModalOpen(true);
          }}
          onOpenAdmitCard={() => {
            setTargetPayStudent(viewingStudent);
            setViewingStudent(null);
            setIsAdmitCardOpen(true);
          }}
        />
      )}

      <AuditTrailModal
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
      />
      <MasterTablesModal
        isOpen={showMasterTables}
        initialTab={masterTablesTab}
        onClose={() => setShowMasterTables(false)}
      />
    </ErrorBoundary>
  );
}
