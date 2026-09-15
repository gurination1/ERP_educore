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
      case '/dashboard':
      default:
        return currentUser?.role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
    }
  };

  const handleNavigate = (screen: ActiveScreen) => {
    if (screen === 'fee-ledger') {
      navigate('/fees');
    } else if (screen === 'student-dashboard' || screen === 'admin-dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/${screen}`);
    }
  };

  return (
    <div id="educore-app-root" className="min-h-screen flex bg-[#f8f9fa] text-[#191c1d]">
      <Sidebar
        activeScreen={getActiveScreenFromPath(location.pathname)}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <Header
          currentUser={currentUser}
          activeScreen={getActiveScreenFromPath(location.pathname)}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenCopilot={() => setShowCopilot(true)}
          onLogout={onLogout}
        />
        <main className="flex-1 pb-16">{children}</main>
      </div>

      <AICopilotModal
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        currentUser={currentUser}
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
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isEmailRemindersOpen, setIsEmailRemindersOpen] = useState(false);
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

  const handleLogout = () => {
    const wasAdmin = currentUser?.role === 'admin';
    removeStoredToken();
    setCurrentUser(null);
    setCurrentStudent(null);
    navigate(wasAdmin ? '/admin' : '/', { replace: true });
  };

  const handleScreenNavigate = (target: string) => {
    if (target === 'fee-ledger' || target === 'fees') {
      navigate('/fees');
    } else if (target === 'student-dashboard' || target === 'admin-dashboard' || target === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/${target}`);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0a1428] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-[#86f2e4] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wider text-[#86f2e4] uppercase">
          Initializing EduCore ERP...
        </p>
      </div>
    );
  }

  return (
    <>
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
                {currentUser.role === 'admin' ? (
                  <AdminDashboardView
                    onNavigate={handleScreenNavigate}
                    onOpenEmailReminders={() => setIsEmailRemindersOpen(true)}
                  />
                ) : (
                  <StudentDashboardView
                    student={currentStudent}
                    notices={notices}
                    onNavigate={handleScreenNavigate}
                    onOpenPayModal={() => {
                      setTargetPayFeeId(undefined);
                      setIsPayModalOpen(true);
                    }}
                    onOpenReceiptModal={() => {
                      setActiveReceiptNo('REC-2024-0088');
                      setIsReceiptOpen(true);
                    }}
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
                  currentStudent={currentStudent}
                  onOpenPayModal={feeId => {
                    setTargetPayFeeId(feeId);
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
                {currentUser.role === 'admin' ? (
                  <AdmissionsAdminView
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
            ) : currentUser.role !== 'admin' ? (
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
                <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-[#191c1d]">Academics & Course Curriculum</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
                      <span className="text-xs font-bold uppercase text-[#00236f] bg-[#dce1ff] px-2 py-0.5 rounded">
                        Computer Science & Engineering
                      </span>
                      <h3 className="text-lg font-bold text-[#191c1d] mt-3">CS-401: Distributed Cloud Architecture</h3>
                      <p className="text-xs text-[#757682] mt-1">Instructor: Prof. K. Venkatesh • 4 Credits</p>
                      <div className="mt-4 pt-3 border-t border-[#f3f4f5] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#006a61]">Attendance: 88%</span>
                        <button className="text-[#00236f] font-bold hover:underline cursor-pointer">Download Syllabus</button>
                      </div>
                    </div>

                    <div className="p-6 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
                      <span className="text-xs font-bold uppercase text-[#00236f] bg-[#dce1ff] px-2 py-0.5 rounded">
                        Computer Science & Engineering
                      </span>
                      <h3 className="text-lg font-bold text-[#191c1d] mt-3">CS-402: Advanced Relational DBMS & MariaDB</h3>
                      <p className="text-xs text-[#757682] mt-1">Instructor: Dr. Ramesh Chandra • 4 Credits</p>
                      <div className="mt-4 pt-3 border-t border-[#f3f4f5] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#006a61]">Attendance: 92%</span>
                        <button className="text-[#00236f] font-bold hover:underline cursor-pointer">Download Syllabus</button>
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#191c1d]">Institutional Analytical Reports</h2>
                      <p className="text-sm text-[#444651] mt-1">Financial reconciliation and enrollment audits</p>
                    </div>
                    {currentUser.role === 'admin' && (
                      <a
                        href="/api/reports/export-students-csv"
                        download
                        className="px-4 py-2 bg-[#00236f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#1e3a8a] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Export Master Data (CSV)</span>
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
                      <h4 className="text-sm font-bold text-[#191c1d]">Semester Fee Audit 2025-26</h4>
                      <p className="text-xs text-[#757682] mt-1">Total ₹ 2.4 Cr collected, ₹ 18 L overdue</p>
                      <span className="inline-block mt-4 text-xs font-bold text-[#00236f]">
                        Active Financial Ledger
                      </span>
                    </div>
                    <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
                      <h4 className="text-sm font-bold text-[#191c1d]">Department Enrollment Roster</h4>
                      <p className="text-xs text-[#757682] mt-1">1,432 active student registrations</p>
                      <span className="inline-block mt-4 text-xs font-bold text-[#00236f]">
                        MariaDB Seeded Roster
                      </span>
                    </div>
                    <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
                      <h4 className="text-sm font-bold text-[#191c1d]">Scholarship Grant Allocation</h4>
                      <p className="text-xs text-[#757682] mt-1">₹ 14.5 Lakhs disbursed across 35 scholars</p>
                      <span className="inline-block mt-4 text-xs font-bold text-[#00236f]">
                        Active Merit Grants
                      </span>
                    </div>
                  </div>
                </div>
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006a61] bg-[#86f2e4]/30 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
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
                        <strong className="text-[#006a61]">2025-26 (Fall Admissions)</strong>
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
          student={currentStudent}
          feeId={targetPayFeeId}
          onClose={() => setIsPayModalOpen(false)}
          onPaymentSuccess={receiptNo => {
            setIsPayModalOpen(false);
            setActiveReceiptNo(receiptNo);
            setIsReceiptOpen(true);
          }}
        />
      )}

      {isForgotPasswordOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotPasswordOpen(false)} />
      )}

      {isEmailRemindersOpen && (
        <EmailRemindersModal onClose={() => setIsEmailRemindersOpen(false)} />
      )}

      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onPayFee={() => {
            setViewingStudent(null);
            setIsPayModalOpen(true);
          }}
        />
      )}
    </>
  );
}
