import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, StudentProfile, NoticeItem, UserRole, ActiveScreen } from './types';
import { api, getStoredToken, setStoredToken, removeStoredToken, setStoredUser } from './api/client';
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
import { ErrorBoundary } from './components/ErrorBoundary';

interface LayoutProps {
  currentUser: User | null;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<LayoutProps> = ({
  currentUser,
  onLogout,
  searchQuery,
  onSearchChange,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCopilot, setShowCopilot] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showMasterTables, setShowMasterTables] = useState(false);
  const [showStaffJourney, setShowStaffJourney] = useState(false);
  const [isTelephonyOpen, setIsTelephonyOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile-phone'>('desktop');
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<TelephonyCandidate | null>({
    id: 'cand-001',
    name: 'Gurpreet Singh',
    phone: '+91 98765 11221',
    course: 'B.Tech CSE',
    quota: 'punjab_85',
  });

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdminOrSuper = currentUser?.role === 'admin' || isSuperAdmin;
  const isFacultyOrAdmin = currentUser?.role === 'staff' || isAdminOrSuper;

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
      case '/dashboard':
      default:
        return (currentUser?.role === 'admin' || currentUser?.role === 'super_admin')
          ? 'admin-dashboard'
          : (currentUser?.role === 'staff' || currentUser?.role === 'counselor' || currentUser?.role === 'hod')
          ? 'staff-dashboard'
          : currentUser?.role === 'accounts'
          ? 'fee-ledger'
          : 'student-dashboard';
    }
  };

  const handleNavigate = (screen: ActiveScreen) => {
    if (screen === 'fee-ledger') {
      navigate('/fees');
    } else if (screen === 'student-dashboard' || screen === 'admin-dashboard' || screen === 'staff-dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/${screen}`);
    }
  };

  const currentScreenId = getActiveScreenFromPath(location.pathname);

  // DESKTOP: Header-First Layout (No clunky static sidebar; primary navigation on the Header)
  if (viewMode === 'desktop') {
    return (
      <div id="educore-app-root" className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#191c1d]">
        <Header
          currentUser={currentUser}
          activeScreen={currentScreenId}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenCopilot={() => setShowCopilot(true)}
          onLogout={onLogout}
          onToggleTelephony={() => setIsTelephonyOpen(!isTelephonyOpen)}
          isTelephonyOpen={isTelephonyOpen}
          onOpenAuditLogs={() => setShowAuditLogs(true)}
          onOpenMasterTables={() => setShowMasterTables(true)}
          onOpenStaffJourney={() => setShowStaffJourney(true)}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode('mobile-phone')}
        />

        <div className="flex-1 flex min-w-0">
          <main className="flex-1 min-w-0 overflow-y-auto pb-16">
            {children}
          </main>
        </div>

        {/* Slide-out Navigation Drawer if opened */}
        {isSidebarDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarDrawerOpen(false)}
            />
            <div className="relative z-10 w-72 h-full bg-white shadow-2xl flex flex-col animate-fadeIn">
              <div className="p-3 border-b flex justify-between items-center bg-[#f8f9fa]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
                  System Navigation Tree
                </span>
                <button
                  onClick={() => setIsSidebarDrawerOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-xs font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeScreen={currentScreenId}
                  onNavigate={screen => {
                    handleNavigate(screen);
                    setIsSidebarDrawerOpen(false);
                  }}
                  currentUser={currentUser}
                  onLogout={onLogout}
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Modals */}
        <AICopilotModal
          isOpen={showCopilot}
          onClose={() => setShowCopilot(false)}
          currentUser={currentUser}
        />
        <AuditTrailModal
          isOpen={showAuditLogs}
          onClose={() => setShowAuditLogs(false)}
        />
        <MasterTablesModal
          isOpen={showMasterTables}
          onClose={() => setShowMasterTables(false)}
        />
        <StaffAcademicJourneyModal
          isOpen={showStaffJourney}
          onClose={() => setShowStaffJourney(false)}
          currentUser={currentUser}
        />
        <TelephonyCallDock
          isOpen={isTelephonyOpen}
          onClose={() => setIsTelephonyOpen(false)}
          activeCandidate={activeCandidate}
        />
      </div>
    );
  }

  // MOBILE: iPhone 16 Pro Native App Prototype Mode (Flutter/iOS Engine Frame)
  return (
    <div id="educore-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-6 px-3 sm:px-4">
      {/* Top Prototype Banner & Desktop Toggle */}
      <div className="max-w-md w-full mb-3 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <span className="text-xs font-bold text-white block">iPhone 16 Pro Prototype</span>
            <span className="text-[10px] text-slate-400 font-mono">Flutter / iOS Native • 393 × 852 pt</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('desktop')}
            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Switch back to Widescreen Desktop Web Portal"
          >
            
            <span>Web Portal</span>
          </button>
        </div>
      </div>

      {/* Quick Screen Switcher Pills for rapid testing */}
      <div className="max-w-md w-full mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => handleNavigate(isAdminOrSuper ? 'admin-dashboard' : 'student-dashboard')}
          className={`px-2.5 py-1 rounded-full font-medium shrink-0 cursor-pointer transition-colors ${
            ['admin-dashboard', 'student-dashboard', 'staff-dashboard'].includes(currentScreenId)
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => handleNavigate('student-quiz-lms')}
          className={`px-2.5 py-1 rounded-full font-medium shrink-0 cursor-pointer transition-colors ${
            currentScreenId === 'student-quiz-lms'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50'
          }`}
        >
          LMS Quiz CBT
        </button>
        <button
          onClick={() => handleNavigate('student-documents')}
          className={`px-2.5 py-1 rounded-full font-medium shrink-0 cursor-pointer transition-colors ${
            currentScreenId === 'student-documents'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/50'
          }`}
        >
          Student Docs
        </button>
        {isFacultyOrAdmin && (
          <button
            onClick={() => handleNavigate('teacher-documents')}
            className={`px-2.5 py-1 rounded-full font-medium shrink-0 cursor-pointer transition-colors ${
              currentScreenId === 'teacher-documents'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/50'
            }`}
          >
            Faculty Docs
          </button>
        )}
        <button
          onClick={() => handleNavigate('fee-ledger')}
          className={`px-2.5 py-1 rounded-full font-medium shrink-0 cursor-pointer transition-colors ${
            currentScreenId === 'fee-ledger'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          Fee Ledger
        </button>
      </div>

      {/* iPhone 16 Pro Titanium Chassis Frame */}
      <div className="relative w-full max-w-[393px] h-[844px] max-h-[85vh] bg-[#1a1a1f] rounded-[50px] p-[9px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-4 border-[#3a3a42] ring-1 ring-white/10 flex flex-col overflow-hidden">
        {/* Physical Button Accents */}
        <div className="hidden sm:block absolute -left-[13px] top-24 w-[4px] h-9 bg-slate-600 rounded-l-md"></div>
        <div className="hidden sm:block absolute -left-[13px] top-38 w-[4px] h-12 bg-slate-600 rounded-l-md"></div>
        <div className="hidden sm:block absolute -left-[13px] top-54 w-[4px] h-12 bg-slate-600 rounded-l-md"></div>
        <div className="hidden sm:block absolute -right-[13px] top-36 w-[4px] h-16 bg-slate-600 rounded-r-md"></div>

        {/* Screen Display Viewport */}
        <div className="w-full h-full bg-[#f8f9fa] text-[#191c1d] rounded-[42px] overflow-hidden flex flex-col relative">
          {/* iOS Status Bar */}
          <div className="h-11 px-6 flex items-center justify-between text-xs font-semibold text-black bg-white/95 backdrop-blur z-30 select-none shrink-0 border-b border-black/5">
            <span className="font-bold tracking-tight text-[13px]">9:41</span>
            {/* Dynamic Island Capsule */}
            <div className="w-28 h-6 bg-black rounded-full flex items-center justify-between px-2 text-[9px] text-white shadow-inner">
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
              </div>
              <span className="font-mono text-[8px] text-slate-300 tracking-wider">
                {isSuperAdmin ? '👑 APEX' : 'EduCore'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-mono text-[9px] font-bold">5G</span>
              
              
            </div>
          </div>

          {/* Compact Mobile Top App Bar */}
          <div className="px-3.5 py-2 bg-white border-b border-[#e1e3e4] flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#00236f] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                
              </div>
              <div>
                <h1 className="text-xs font-extrabold text-[#191c1d] leading-none">EduCore Mobile</h1>
                <span className="text-[8px] font-mono font-semibold text-[#00236f]">
                  {currentUser?.enterprise_uid || '1001-88-03-BFGI'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCopilot(true)}
                className="p-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                title="AI Copilot"
              >
                
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="Sign Out"
              >
                
              </button>
            </div>
          </div>

          {/* Scrollable Main Content inside device */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {children}
          </div>

          {/* Native Mobile Bottom Tab Bar */}
          <div className="h-14 bg-white/95 backdrop-blur border-t border-[#e1e3e4] flex items-center justify-around px-2 shrink-0 z-30">
            <button
              onClick={() => handleNavigate(isAdminOrSuper ? 'admin-dashboard' : 'student-dashboard')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
                ['admin-dashboard', 'student-dashboard', 'staff-dashboard'].includes(currentScreenId)
                  ? 'text-[#00236f]'
                  : 'text-slate-400'
              }`}
            >
              
              <span>Home</span>
            </button>
            <button
              onClick={() => handleNavigate('student-quiz-lms')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
                currentScreenId === 'student-quiz-lms'
                  ? 'text-purple-700'
                  : 'text-slate-400'
              }`}
            >
              
              <span>LMS</span>
            </button>
            <button
              onClick={() => handleNavigate('student-documents')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
                currentScreenId === 'student-documents'
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              
              <span>Docs</span>
            </button>
            {isFacultyOrAdmin ? (
              <button
                onClick={() => handleNavigate('teacher-documents')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
                  currentScreenId === 'teacher-documents'
                    ? 'text-indigo-700'
                    : 'text-slate-400'
                }`}
              >
                
                <span>Faculty</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('academics')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
                  currentScreenId === 'academics'
                    ? 'text-blue-700'
                    : 'text-slate-400'
                }`}
              >
                
                <span>Courses</span>
              </button>
            )}
            <button
              onClick={() => handleNavigate('fee-ledger')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
                currentScreenId === 'fee-ledger'
                  ? 'text-[#00236f]'
                  : 'text-slate-400'
              }`}
            >
              
              <span>Fees</span>
            </button>
          </div>

          {/* iOS Home Indicator */}
          <div className="h-3.5 bg-white flex items-center justify-center shrink-0">
            <div className="w-28 h-1 bg-black/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Global Modals for Mobile */}
      <AICopilotModal
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        currentUser={currentUser}
      />
      <AuditTrailModal
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
      />
      <MasterTablesModal
        isOpen={showMasterTables}
        onClose={() => setShowMasterTables(false)}
      />
      <StaffAcademicJourneyModal
        isOpen={showStaffJourney}
        onClose={() => setShowStaffJourney(false)}
        currentUser={currentUser}
      />
      <TelephonyCallDock
        isOpen={isTelephonyOpen}
        onClose={() => setIsTelephonyOpen(false)}
        activeCandidate={activeCandidate}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
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

  // Check auth state on load
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
    if (target === 'fee-ledger' || target === 'fees') {
      navigate('/fees');
    } else if (target === 'student-dashboard' || target === 'admin-dashboard' || target === 'staff-dashboard' || target === 'dashboard') {
      navigate('/dashboard');
    } else if (target === 'student-documents') {
      navigate('/student-documents');
    } else if (target === 'teacher-documents') {
      navigate('/teacher-documents');
    } else if (target === 'student-quiz-lms') {
      navigate('/student-quiz-lms');
    } else {
      navigate(`/${target}`);
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
              >
                {(currentUser.role === 'admin' || currentUser.role === 'super_admin') ? (
                  <AdminDashboardView
                    onNavigate={handleScreenNavigate}
                    onOpenEmailReminders={() => setIsEmailRemindersOpen(true)}
                  />
                ) : (currentUser.role === 'staff' || currentUser.role === 'counselor' || currentUser.role === 'hod') ? (
                  <StaffDashboardView
                    currentUser={currentUser}
                    onNavigate={handleScreenNavigate}
                  />
                ) : currentUser.role === 'partner' ? (
                  <PartnerPortalView currentUser={currentUser} />
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
              <Navigate to="/admin" replace />
            ) : !['admin', 'super_admin', 'staff', 'counselor', 'hod'].includes(currentUser.role) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              >
                <ManageStudentsView
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
          path="/reports"
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
                <ReportsView currentUser={currentUser} />
              </AuthenticatedLayout>
            )
          }
        />

        <Route
          path="/settings"
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
              <Navigate to="/admin" replace />
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
          path="/bulk-import"
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
          studentId={currentStudent?.id || 'me'}
          onClose={() => setIsAdmitCardOpen(false)}
          onOpenPayModal={() => {
            setIsAdmitCardOpen(false);
            setTargetPayStudent(currentStudent);
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
        />
      )}
    </ErrorBoundary>
  );
}
