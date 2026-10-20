import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Send,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';

interface LoginViewProps {
  presetRole?: UserRole;
  onLogin: (credentials: { username: string; password: string; role: UserRole }) => Promise<void>;
  onOpenForgotPassword?: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

interface DemoAccount {
  role: UserRole;
  label: string;
  badge: string;
  uid: string;
  pass: string;
  desc: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'admin', label: 'Admin', badge: 'Provost', uid: '4001-01-03-01', pass: 'admin123', desc: 'Registrar & Governance' },
  { role: 'super_admin', label: 'Super Admin', badge: 'Platform', uid: '9001-01-03-01', pass: 'super123', desc: 'Global Cloud Orchestrator' },
  { role: 'staff', label: 'Faculty', badge: 'Teaching', uid: '2001-14-03-01', pass: 'staff123', desc: 'Academic Professor' },
  { role: 'hod', label: 'HOD', badge: 'CSE Dept', uid: '3001-01-03-01', pass: 'hod123', desc: 'Department Head' },
  { role: 'student', label: 'Student', badge: 'Scholar', uid: '1001-88-03-01', pass: 'student123', desc: 'Undergraduate' },
  { role: 'accounts', label: 'Finance', badge: 'Bursar', uid: '5001-05-03-01', pass: 'accounts123', desc: 'Fee Ledgers & Cash' },
  { role: 'counselor', label: 'Counselor', badge: 'Admissions', uid: '6001-02-03-01', pass: 'counselor123', desc: 'CRM & Pipeline' },
  { role: 'hostel', label: 'Hostel', badge: 'Warden', uid: '10001-01-03-01', pass: 'warden123', desc: 'Residence & Mess' },
  { role: 'partner', label: 'Partner', badge: 'Recruiter', uid: '7001-01-03-01', pass: 'partner123', desc: 'Corporate Placement' },
];

export const LoginView: React.FC<LoginViewProps> = ({
  presetRole = 'student',
  onLogin,
  isLoading,
  errorMessage,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(presetRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 3D Card Flip State
  const [flipMode, setFlipMode] = useState<'none' | 'forgot_password' | 'contact_admin'>('none');

  // Forgot password form state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Contact support form state
  const [supportCategory, setSupportCategory] = useState<'login_issue' | 'password_reset' | 'general'>('login_issue');
  const [supportIdentifier, setSupportIdentifier] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(presetRole);
  }, [presetRole]);

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    const clean = val.replace(/[^0-9]/g, '');

    // Auto-infer role from canonical numeric prefix
    if (clean.startsWith('10001')) setSelectedRole('hostel');
    else if (clean.startsWith('1001')) setSelectedRole('student');
    else if (clean.startsWith('4001')) setSelectedRole('admin');
    else if (clean.startsWith('2001')) setSelectedRole('staff');
    else if (clean.startsWith('9001')) setSelectedRole('super_admin');
    else if (clean.startsWith('8001')) setSelectedRole('hr');
    else if (clean.startsWith('5001')) setSelectedRole('accounts');
    else if (clean.startsWith('6001')) setSelectedRole('counselor');
    else if (clean.startsWith('3001')) setSelectedRole('hod');
    else if (clean.startsWith('7001')) setSelectedRole('partner');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onLogin({ username, password, role: selectedRole });
  };

  const handleFastDemoLogin = (acc: DemoAccount) => {
    setUsername(acc.uid);
    setPassword(acc.pass);
    setSelectedRole(acc.role);
    onLogin({ username: acc.uid, password: acc.pass, role: acc.role });
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier) return;
    setResetSuccess(`A password recovery dispatch was sent to ${resetIdentifier}.`);
    setTimeout(() => {
      setResetSuccess(null);
      setFlipMode('none');
    }, 3000);
  };

  const handleSendSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    const ticketNo = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    setSupportTicketId(ticketNo);
    setTimeout(() => {
      setFlipMode('none');
      setSupportMessage('');
      setSupportIdentifier('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      {/* Subtle minimalist background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[440px] z-10 space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1.5 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            EduCore
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Enterprise Higher Education Operating System
          </p>
        </div>

        {/* 3D Flip Card Container with physical depth */}
        <div className="w-full [perspective:1400px]">
          <div
            className={`relative w-full transition-transform duration-700 ease-in-out transform-style-3d min-h-[580px] ${
              flipMode === 'forgot_password'
                ? 'rotate-y-180'
                : flipMode === 'contact_admin'
                ? '-rotate-y-180'
                : 'rotate-y-0'
            }`}
          >
            {/* ======================================================== */}
            {/* FRONT FACE: REGULAR SIGN IN                              */}
            {/* ======================================================== */}
            <div
              className={`w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 backface-hidden flex flex-col justify-between ${
                flipMode !== 'none' ? 'pointer-events-none select-none' : ''
              }`}
            >
              <div>
                {/* Support Ticket Dispatched Notification */}
                {supportTicketId && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ticket #{supportTicketId} logged to Campus Administrator</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSupportTicketId(null)}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-username-input"
                      className="block text-xs font-bold text-slate-700 tracking-tight mb-1.5"
                    >
                      UID or Registered Email
                    </label>
                    <input
                      id="login-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="e.g. 4001-01-03-01 or admin"
                      disabled={isLoading}
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password-input"
                        className="block text-xs font-bold text-slate-700 tracking-tight"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        id="login-forgot-password-trigger"
                        onClick={() => setFlipMode('forgot_password')}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-600 text-[11px]">Remember session</span>
                    </label>

                    <button
                      type="button"
                      id="login-contact-admin-trigger"
                      onClick={() => setFlipMode('contact_admin')}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Contact Admin</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#00236f] hover:bg-[#001744] active:bg-[#001030] text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to EduCore</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Fast Demo Access (1-Click Evaluator Accounts across all 9 roles) */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Fast Demo Login (1-Click Role Access)
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      9 Roles Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-left">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        type="button"
                        data-demo-role={acc.role}
                        onClick={() => handleFastDemoLogin(acc)}
                        disabled={isLoading}
                        title={`${acc.label} (${acc.desc}) - UID: ${acc.uid}`}
                        className="p-2 rounded-xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/50 bg-slate-50/70 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center justify-between leading-none">
                          <span className="font-bold text-[11px] text-slate-800 group-hover:text-blue-700">
                            {acc.label}
                          </span>
                          <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-slate-200/70 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                            {acc.badge}
                          </span>
                        </div>
                        <span className="block text-[9px] font-mono text-slate-400 mt-1 truncate">
                          {acc.uid}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* BACK FACE 1: FORGOT PASSWORD (In-Place 3D Flip)          */}
            {/* ======================================================== */}
            <div
              className={`absolute inset-0 w-full h-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 backface-hidden rotate-y-180 flex flex-col justify-between overflow-y-auto transition-opacity duration-300 ${
                flipMode === 'forgot_password'
                  ? 'pointer-events-auto opacity-100 z-20'
                  : 'pointer-events-none opacity-0 -z-10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFlipMode('none')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Password Recovery
                  </span>
                </div>

                <div className="space-y-1.5 mb-5">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Reset Account Password</span>
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enter your institutional UID or registered email address. A recovery authorization link will be generated.
                  </p>
                </div>

                {resetSuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recovery Link Dispatched</span>
                    </div>
                    <p className="font-normal text-emerald-800">{resetSuccess}</p>
                    <button
                      type="button"
                      onClick={() => setFlipMode('none')}
                      className="mt-2 text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Return to Sign In</span> &rarr;
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendResetLink} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Registered UID or Institutional Email
                      </label>
                      <input
                        type="text"
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        placeholder="e.g. 1001-88-03-01 or user@educore.edu"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Recovery Instructions</span>
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
                <span>Account locked? Contact campus administration via </span>
                <button
                  type="button"
                  onClick={() => setFlipMode('contact_admin')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Helpdesk
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* BACK FACE 2: CONTACT ADMIN (In-Place 3D Reverse Flip)    */}
            {/* ======================================================== */}
            <div
              className={`absolute inset-0 w-full h-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 backface-hidden -rotate-y-180 flex flex-col justify-between overflow-y-auto transition-opacity duration-300 ${
                flipMode === 'contact_admin'
                  ? 'pointer-events-auto opacity-100 z-20'
                  : 'pointer-events-none opacity-0 -z-10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFlipMode('none')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Institutional Desk
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Contact Campus Administrator</span>
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Submit an official inquiry to the institutional IT governance desk.
                  </p>
                </div>

                <form onSubmit={handleSendSupportTicket} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Concern Category
                    </label>
                    <select
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    >
                      <option value="login_issue">UID Authentication / Sign-in Failure</option>
                      <option value="password_reset">Password Recovery Hold</option>
                      <option value="general">Role Clearance / Access Permission</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      UID or Registered Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={supportIdentifier}
                      onChange={(e) => setSupportIdentifier(e.target.value)}
                      placeholder="e.g. 1001-88-03-01 or +91 90411 72159"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message / Issue Summary
                    </label>
                    <textarea
                      rows={3}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Describe the issue you are experiencing..."
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Support Ticket</span>
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
                Emergency IT Hotline: +91 90411 72159 • EduCore Registrar Office
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} EduCore Enterprise ERP • All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};
