import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  Send,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck
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

  // Modals for Forgot Password and Contact Support
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);

  // Forgot password form state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetChannel, setResetChannel] = useState<'email' | 'sms'>('email');
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
    setResetSuccess(`A recovery link has been dispatched to ${resetIdentifier}. Please check your inbox.`);
    setTimeout(() => {
      setResetSuccess(null);
      setIsForgotPasswordOpen(false);
    }, 3500);
  };

  const handleSendSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    const ticketNo = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    setSupportTicketId(ticketNo);
    setTimeout(() => {
      setSupportTicketId(null);
      setIsContactSupportOpen(false);
      setSupportMessage('');
      setSupportIdentifier('');
    }, 4000);
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

        {/* Minimalist Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          {/* Support Ticket Badge */}
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
                  onClick={() => setIsForgotPasswordOpen(true)}
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
                onClick={() => setIsContactSupportOpen(true)}
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

        {/* Minimal Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} EduCore Enterprise ERP • All Rights Reserved</p>
        </div>
      </div>

      {/* MODAL 1: Forgot Password */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Link Dispatched</span>
                </div>
                <p>{resetSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Enter your registered UID or institutional email address. We will send a secure password reset link.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Identifier
                  </label>
                  <input
                    type="text"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="e.g. 4001-01-03-01 or user@educore.edu"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Contact Admin Support */}
      {isContactSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Contact Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsContactSupportOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendSupportTicket} className="space-y-3">
              <p className="text-xs text-slate-500">
                Submit an urgent support ticket directly to the campus administrator desk.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue Category
                </label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="login_issue">UID Authentication Issue</option>
                  <option value="password_reset">Password Reset Request</option>
                  <option value="general">Account Access / Role Permission</option>
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
                  Message / Concern
                </label>
                <textarea
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactSupportOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
