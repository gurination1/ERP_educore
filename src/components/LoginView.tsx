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
  X,
  PhoneCall,
  MessageSquare,
  KeyRound,
  Check,
} from 'lucide-react';
import { formatUIDWithDashes } from '../utils/uid';

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

// Canonical 12-Digit Pure Digit Student UID Architecture:
// [Server 1]-[Client 01]-[Session 26]-[Course 01]-[Student 0001]
const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'student', label: 'Student', badge: '12-Digit UID', uid: '1-01-26-01-0001', pass: 'student123', desc: 'Undergraduate Scholar (10126010001)' },
  { role: 'admin', label: 'Admin', badge: 'Provost', uid: '4001-01-03-01', pass: 'admin123', desc: 'Registrar & Governance' },
  { role: 'super_admin', label: 'Super Admin', badge: 'Platform', uid: '9001-01-03-01', pass: 'super123', desc: 'Global Cloud Orchestrator' },
  { role: 'staff', label: 'Faculty', badge: 'Teaching', uid: '2001-14-03-01', pass: 'staff123', desc: 'Academic Professor' },
  { role: 'hod', label: 'HOD', badge: 'CSE Dept', uid: '3001-01-03-01', pass: 'hod123', desc: 'Department Head' },
  { role: 'accounts', label: 'Finance', badge: 'Bursar', uid: '5001-05-03-01', pass: 'accounts123', desc: 'Fee Ledgers & Cash' },
  { role: 'counselor', label: 'Counselor', badge: 'Admissions', uid: '6001-02-03-01', pass: 'counselor123', desc: 'CRM & Pipeline' },
  { role: 'hostel', label: 'Hostel', badge: 'Warden', uid: '10001-01-03-01', pass: 'warden123', desc: 'Residence & Mess' },
  { role: 'hr', label: 'HR Officer', badge: 'Personnel', uid: '8001-01-03-01', pass: 'hr123', desc: 'Faculty & HRMS' },
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

  // 3D Card Flip State (Karanvir Sir Mentorship Instruction: "Jab Forgot Password koi click karega, toh flip style mein dikhana jaise sikke ki tarah palat gaya")
  const [flipMode, setFlipMode] = useState<'none' | 'forgot_password' | 'contact_admin'>('none');

  // Notice banners after returning from flip cards
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);

  // Forgot password form state (Orange Theme)
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtpMode, setResetOtpMode] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetDispatchedMsg, setResetDispatchedMsg] = useState<string | null>(null);

  // Contact support form state (Blue Theme)
  const [supportRegarding, setSupportRegarding] = useState<'Regarding Username' | 'Regarding Password' | 'Regarding Others'>('Regarding Password');
  const [supportIdentifier, setSupportIdentifier] = useState('');
  const [supportConcern, setSupportConcern] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    setSelectedRole(presetRole);
  }, [presetRole]);

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    const clean = val.replace(/[^0-9]/g, '');

    // Auto-infer role from canonical numeric prefix:
    // 1-01-26-01-0001 or 10126... -> Student
    if (clean.startsWith('10126') || clean.startsWith('010126') || clean.startsWith('1001') || clean.length === 11 || clean.length === 12) {
      setSelectedRole('student');
    } else if (clean.startsWith('10001')) {
      setSelectedRole('hostel');
    } else if (clean.startsWith('4001')) {
      setSelectedRole('admin');
    } else if (clean.startsWith('2001')) {
      setSelectedRole('staff');
    } else if (clean.startsWith('9001')) {
      setSelectedRole('super_admin');
    } else if (clean.startsWith('8001')) {
      setSelectedRole('hr');
    } else if (clean.startsWith('5001')) {
      setSelectedRole('accounts');
    } else if (clean.startsWith('6001')) {
      setSelectedRole('counselor');
    } else if (clean.startsWith('3001')) {
      setSelectedRole('hod');
    } else if (clean.startsWith('7001')) {
      setSelectedRole('partner');
    }
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

  // Karanvir Sir Instruction: "Jaise hi Send Details batayega, toh jo bhi OTP mode enabled hai system mein us mode se usko uski login details chali jayengi... aur wapis flip ho jayega is pe: Please check your SMS / WhatsApp / Email for your password"
  const handleSendResetDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) return;

    setIsSendingReset(true);
    setTimeout(() => {
      setIsSendingReset(false);
      setResetDispatchedMsg(`Login credentials dispatched via ${resetOtpMode.toUpperCase()}!`);
      
      // Auto flip back to login card with persistent verification banner
      setTimeout(() => {
        setResetDispatchedMsg(null);
        setFlipMode('none');
        setOtpNotice(`Please check your ${resetOtpMode === 'whatsapp' ? 'WhatsApp message' : resetOtpMode === 'email' ? 'registered Email' : 'SMS'} for your login password.`);
        setUsername(resetIdentifier.trim());
      }, 1200);
    }, 800);
  };

  // Karanvir Sir Instruction: "Contact Admin mein blue theme de dena... Dropdown Regarding: Regarding Username, Regarding Password, Regarding Others... concern likhega, Submit... ticket generate ho jayegi"
  const handleSendSupportConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportConcern.trim()) return;

    setIsSubmittingTicket(true);
    setTimeout(() => {
      const ticketNo = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
      setIsSubmittingTicket(false);
      
      // Flip back to login card with ticket confirmation
      setFlipMode('none');
      setSupportTicketId(ticketNo);
      setSupportConcern('');
      setSupportIdentifier('');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      {/* Dynamic 3D Ambient Atmosphere Glow: Shifts colors based on active flip mode! */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          flipMode === 'forgot_password'
            ? 'bg-orange-500/25 scale-110'
            : flipMode === 'contact_admin'
            ? 'bg-blue-600/30 scale-110'
            : 'bg-indigo-600/15'
        }`}
      />

      {/* Main Container */}
      <div className="w-full max-w-[460px] z-10 space-y-3">
        {/* Brand Header */}
        <div className="text-center space-y-1 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00236f] to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-1 border border-white/10">
            <Shield className="w-6 h-6 text-amber-300" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>EduCore Enterprise</span>
            <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
              12-DIGIT UID
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Collegiate Enterprise Resource Planning • Single Sign-On Gateway
          </p>
        </div>

        {/* 3D Flip Card Container with Physical 3D Depth & Perspective */}
        <div className="w-full [perspective:1400px]">
          <div
            className={`relative w-full transition-transform duration-700 ease-in-out transform-style-3d min-h-[590px] ${
              flipMode === 'forgot_password'
                ? 'rotate-y-180'
                : flipMode === 'contact_admin'
                ? '-rotate-y-180'
                : 'rotate-y-0'
            }`}
          >
            {/* ======================================================== */}
            {/* FRONT FACE: REGULAR SIGN IN (Default Theme)              */}
            {/* ======================================================== */}
            <div
              className={`w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 backface-hidden flex flex-col justify-between transition-all duration-300 ${
                flipMode !== 'none' ? 'pointer-events-none select-none opacity-0' : 'opacity-100'
              }`}
            >
              <div>
                {/* Header Subtitle */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#00236f] tracking-tight">
                      Sign In via your Digit
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Enter your permanent 11-12 digit UID or Staff EMP ID
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#00236f] border border-blue-200 font-mono">
                    Node: S1-C01
                  </span>
                </div>

                {/* OTP Verification Dispatched Notification (Returned from Forgot Password) */}
                {otpNotice && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#ea580c] shrink-0" />
                      <span>{otpNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpNotice(null)}
                      className="text-amber-800 hover:text-black text-xs font-bold p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Support Ticket Dispatched Notification (Returned from Contact Admin) */}
                {supportTicketId && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Support Ticket #{supportTicketId} dispatched to Campus Admin desk</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSupportTicketId(null)}
                      className="text-emerald-800 hover:text-black text-xs font-bold p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
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
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="login-username-input"
                      className="block text-xs font-bold text-slate-700 tracking-tight mb-1"
                    >
                      Registered UID / EMP ID *
                    </label>
                    <input
                      id="login-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="e.g. 1-01-26-01-0001 (12-Digit UID) or 4001-01-03-01"
                      disabled={isLoading}
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition font-mono font-medium"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Format: S-CC-SS-CO-NNNN (11-12 Digits)</span>
                      <span className="font-bold text-[#00236f] capitalize">Role: {selectedRole.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="login-password-input"
                        className="block text-xs font-bold text-slate-700 tracking-tight"
                      >
                        Password *
                      </label>
                      {/* Karanvir Sir 3D Coin-flip Trigger: Orange theme on hover */}
                      <button
                        type="button"
                        id="login-forgot-password-trigger"
                        onClick={() => {
                          setResetIdentifier(username);
                          setFlipMode('forgot_password');
                        }}
                        className="text-[11px] font-bold text-[#ea580c] hover:text-[#c2410c] hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                        title="Click to flip card and reset password"
                      >
                        <KeyRound className="w-3 h-3 text-[#ea580c]" />
                        <span>Forgot password? ↻</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter account password"
                        disabled={isLoading}
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition font-medium"
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
                        className="rounded border-slate-300 text-[#00236f] focus:ring-[#00236f] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-600 text-[11px]">Remember session</span>
                    </label>

                    {/* Karanvir Sir 3D Coin-flip Trigger: Blue theme on hover */}
                    <button
                      type="button"
                      id="login-contact-admin-trigger"
                      onClick={() => {
                        setSupportIdentifier(username);
                        setFlipMode('contact_admin');
                      }}
                      className="text-[11px] font-bold text-[#00236f] hover:text-blue-800 cursor-pointer flex items-center gap-1 transition-colors hover:underline"
                      title="Click to flip card and contact administrator"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#00236f]" />
                      <span>Contact Admin ↺</span>
                    </button>
                  </div>

                  <button
                    id="login-submit-button"
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
                        <span>Sign In to EduCore ERP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Fast Demo Access across all 10 roles */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Fast Demo Login (1-Click Role Access)
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {DEMO_ACCOUNTS.length} Roles Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-left">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        type="button"
                        data-demo-role={acc.role}
                        onClick={() => handleFastDemoLogin(acc)}
                        disabled={isLoading}
                        title={`${acc.label} (${acc.desc}) - UID: ${acc.uid}`}
                        className={`p-2 rounded-xl border transition-all text-left group cursor-pointer ${
                          acc.role === 'student'
                            ? 'bg-amber-50/70 border-amber-300 hover:border-amber-500 hover:bg-amber-100/50'
                            : 'bg-slate-50/70 border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between leading-none">
                          <span className="font-bold text-[11px] text-slate-800 group-hover:text-blue-700">
                            {acc.label}
                          </span>
                          <span className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded ${
                            acc.role === 'student'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-200/70 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                          }`}>
                            {acc.badge}
                          </span>
                        </div>
                        <span className="block text-[9px] font-mono text-slate-500 mt-1 truncate">
                          {acc.uid}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* BACK FACE 1: FORGOT PASSWORD (VIBRANT ORANGE THEME)     */}
            {/* ======================================================== */}
            <div
              className={`absolute inset-0 w-full h-full bg-gradient-to-b from-orange-50/90 via-white to-amber-50/50 rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#ea580c]/80 backface-hidden rotate-y-180 flex flex-col justify-between overflow-y-auto transition-opacity duration-300 ${
                flipMode === 'forgot_password'
                  ? 'pointer-events-auto opacity-100 z-20'
                  : 'pointer-events-none opacity-0 -z-10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-orange-200/80">
                  <button
                    type="button"
                    onClick={() => setFlipMode('none')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ea580c] hover:text-[#c2410c] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-[10px] uppercase font-black text-[#ea580c] bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200 tracking-wider">
                    Orange Theme • Recovery Mode
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#ea580c] text-white shadow-md shadow-orange-500/20 mb-1">
                    <KeyRound className="w-5 h-5 text-amber-200" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Forgot Password
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter your Registered UID or Employee ID. Your login credentials will be fetched from system and dispatched via your enabled recovery channel.
                  </p>
                </div>

                {resetDispatchedMsg ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{resetDispatchedMsg}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">Flipping back to sign-in terminal...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendResetDetails} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Enter Your UID or EMP ID *
                      </label>
                      <input
                        type="text"
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        placeholder="e.g. 1-01-26-01-0001 (12-Digit UID) or 2001-14-03-01"
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-orange-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/30 focus:border-[#ea580c] font-mono font-medium shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preferred Dispatch Channel (OTP Mode)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setResetOtpMode('sms')}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                            resetOtpMode === 'sms'
                              ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>SMS OTP</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetOtpMode('whatsapp')}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                            resetOtpMode === 'whatsapp'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetOtpMode('email')}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                            resetOtpMode === 'email'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-orange-100/60 border border-orange-200/90 rounded-xl text-[11px] text-orange-900 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-[#ea580c]" />
                        <span>Instant Automated Gateway</span>
                      </div>
                      <p className="text-[10px] text-orange-800">
                        Upon clicking "Send Details", your temporary login password will be fetched from system and dispatched immediately.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSendingReset ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Dispatching Credentials...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Details & Flip Back</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-3 border-t border-orange-100 text-center text-[11px] text-slate-500">
                <span>Account locked? Contact campus administration via </span>
                <button
                  type="button"
                  onClick={() => setFlipMode('contact_admin')}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Helpdesk
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* BACK FACE 2: CONTACT ADMIN (DEEP BLUE THEME)            */}
            {/* ======================================================== */}
            <div
              className={`absolute inset-0 w-full h-full bg-gradient-to-b from-blue-50/90 via-white to-indigo-50/50 rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#00236f]/80 backface-hidden -rotate-y-180 flex flex-col justify-between overflow-y-auto transition-opacity duration-300 ${
                flipMode === 'contact_admin'
                  ? 'pointer-events-auto opacity-100 z-20'
                  : 'pointer-events-none opacity-0 -z-10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-200/80">
                  <button
                    type="button"
                    onClick={() => setFlipMode('none')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00236f] hover:text-[#001744] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-[10px] uppercase font-black text-[#00236f] bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 tracking-wider">
                    Blue Theme • Governance Desk
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#00236f] text-white shadow-md shadow-blue-500/20 mb-1">
                    <HelpCircle className="w-5 h-5 text-amber-300" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Contact Admin
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Submit your concern to the institutional administrator. An official support ticket will be created on the administrative console.
                  </p>
                </div>

                <form onSubmit={handleSendSupportConcern} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your UID or Employee ID
                    </label>
                    <input
                      type="text"
                      value={supportIdentifier}
                      onChange={(e) => setSupportIdentifier(e.target.value)}
                      placeholder="e.g. 1-01-26-01-0001 or 4001-01-03-01"
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 font-mono font-medium shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Regarding *
                    </label>
                    <select
                      value={supportRegarding}
                      onChange={(e) => setSupportRegarding(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 shadow-2xs"
                    >
                      <option value="Regarding Username">Regarding Username</option>
                      <option value="Regarding Password">Regarding Password</option>
                      <option value="Regarding Others">Regarding Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter Your Concern / Issue *
                    </label>
                    <textarea
                      rows={3}
                      value={supportConcern}
                      onChange={(e) => setSupportConcern(e.target.value)}
                      placeholder="Explain your access issue or concern in detail..."
                      required
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 resize-none font-medium shadow-2xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="w-full py-2.5 px-4 bg-[#00236f] hover:bg-[#001744] active:bg-[#001030] text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Logging Support Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Concern & Flip Back</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t border-blue-100 text-center text-[10px] text-slate-500">
                Institutional Directorate Desk: +91 90411 72159 • Registrar Office
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
