import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  Shield,
  KeyRound,
  Mail,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  AlertTriangle,
  Building2,
} from 'lucide-react';

interface LoginViewProps {
  presetRole?: UserRole;
  onLogin: (credentials: { username: string; password: string; role: UserRole }) => Promise<void>;
  onOpenForgotPassword?: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

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

  // In-place flip state (Karanvir Sir Lecture 4: Orange theme for Forgot Password, Blue theme for Contact Admin flipped from opposite direction)
  const [flipMode, setFlipMode] = useState<'none' | 'forgot_password' | 'contact_admin'>('none');
  const [otpChannel, setOtpChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');
  const [otpDestination, setOtpDestination] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  // Contact Admin state (Karanvir Sir Lecture 4: Dropdown regarding username/password/others + concern)
  const [contactSubject, setContactSubject] = useState<'regarding_username' | 'regarding_password' | 'regarding_others'>('regarding_password');
  const [contactIdentifier, setContactIdentifier] = useState('');
  const [contactConcern, setContactConcern] = useState('');
  const [contactSuccessMessage, setContactSuccessMessage] = useState<string | null>(null);
  const [activeTicketBadge, setActiveTicketBadge] = useState<string | null>(null);

  // Validation warning (Karanvir Sir Lecture 4: 13 digits for student, 8-10 for employee)
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(presetRole);
  }, [presetRole]);

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    const clean = val.replace(/[^0-9]/g, '');

    // Auto-infer role from canonical prefix if available (Check 10001 hostel before 1001 student)
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

    // Strict validation length checking per Karanvir Sir Lecture 4 Segment 0
    if (clean.length > 0) {
      if (clean.length !== 13 && clean.length !== 8 && clean.length !== 9 && clean.length !== 10 && clean.length !== 11) {
        setValidationWarning(
          `Canonical Pure-Digit Rule: Entered ${clean.length} digits. Student UID is strictly 13 digits; Staff/Admin EMP ID is 8-11 digits.`
        );
      } else {
        setValidationWarning(null);
      }
    } else {
      setValidationWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username, password, role: selectedRole });
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSentMessage(
      `Please check your ${otpChannel.toUpperCase()} (${otpDestination || 'registered contact'}) for your temporary OTP credentials.`
    );
    setTimeout(() => {
      setOtpSentMessage(null);
      setFlipMode('none');
    }, 3200);
  };

  const handleContactAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tktId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket = {
      id: tktId,
      ticket_number: tktId,
      user_identifier: contactIdentifier || username || 'GUEST',
      category: contactSubject,
      concern_text: contactConcern,
      source: 'Login Page',
      status: 'open',
      created_at: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem('educore_support_tickets') || '[]');
      localStorage.setItem('educore_support_tickets', JSON.stringify([newTicket, ...existing]));
    } catch (err) {
      console.warn('Could not persist ticket to localStorage', err);
    }
    setContactSuccessMessage(
      `Support ticket #${tktId} generated successfully in Authority Console. Admin team notified.`
    );
    setActiveTicketBadge(tktId);
    setTimeout(() => {
      setContactSuccessMessage(null);
      setFlipMode('none');
      setContactConcern('');
    }, 2800);
  };

  return (
    <div
      id="educore-login-screen"
      className="min-h-screen relative flex items-center justify-center p-4 bg-[#020b22] text-slate-900 font-sans text-xs antialiased"
    >
      {/* Ambient Radial Lighting Accents */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/25 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 right-10 w-[500px] h-[400px] bg-gradient-to-t from-orange-600/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Main 3D Perspective Container */}
      <div className="relative z-10 w-full max-w-lg my-8 perspective-1000">
        {/* Institutional Branding Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-orange-400 text-[10px] font-bold tracking-widest uppercase mb-2.5 shadow-sm">
            <span>EduCore Enterprise ERP</span>
            <span className="w-1 h-1 rounded-full bg-orange-400"></span>
            <span className="font-mono text-white/80">Autonomous Collegiate System</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">
            Baba Farid Group of Institutions
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Canonical UID Architecture • State GST 03 (Punjab)
          </p>
        </div>

        {/* 3D Flip Card Container (Karanvir Sir Lecture 4 Segment 0: Physical coin-flip rotation) */}
        <div
          className={`relative w-full transition-transform duration-700 ease-in-out transform-style-3d min-h-[520px] ${
            flipMode === 'forgot_password'
              ? 'rotate-y-180'
              : flipMode === 'contact_admin'
              ? '-rotate-y-180'
              : 'rotate-y-0'
          }`}
        >
          {/* FRONT FACE: REGULAR LOGIN */}
          <div
            className={`w-full bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/60 backface-hidden ${
              flipMode !== 'none' ? 'pointer-events-none' : ''
            }`}
          >
            {/* Header Title (Clean single unified institutional login per Karanvir Sir Lecture 4 Segment 0) */}
            <div className="mb-5 text-center">
              <h2 className="text-base font-extrabold text-[#00236f] uppercase tracking-tight">
                Institutional Access & Identity Console
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Sign In via Pure-Digit UID • 13 Digits (Student) / 8-10 Digits (Staff & Admin)
              </p>
            </div>

            {/* Support Ticket Dispatched Badge */}
            {activeTicketBadge && (
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-[11px] font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Support Ticket #{activeTicketBadge} active in Admin Console queue</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTicketBadge(null)}
                  className="text-blue-500 hover:text-blue-800 text-[10px] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* UID Validation Warning */}
            {validationWarning && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{validationWarning}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="login-username-input"
                  className="block text-[11px] font-bold text-slate-700 tracking-tight mb-1"
                >
                  Registered UID / EMP ID (13 Digits Student / 8-10 Digits Staff)
                </label>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="e.g. 1001-88-03-01, 4001-01-03-01, or 10001-01-03-01"
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password-input"
                    className="block text-[11px] font-bold text-slate-700 tracking-tight"
                  >
                    Password
                  </label>
                  {/* Flip 1: Forgot Password (Orange Theme Flip) */}
                  <button
                    type="button"
                    onClick={() => setFlipMode('forgot_password')}
                    className="text-[11px] font-semibold text-[#ea580c] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition-all pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Keep Active Checkbox (Karanvir Sir Lecture 4 Segment 0) */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#00236f] focus:ring-[#00236f]"
                  />
                  <span className="text-[11px] text-slate-600 font-medium">Keep active session</span>
                </label>

                {/* Flip 2: Contact Admin (Blue Theme Flip - In-Place Coin Flip) */}
                <button
                  type="button"
                  onClick={() => setFlipMode('contact_admin')}
                  className="text-[11px] font-bold text-[#00236f] hover:underline cursor-pointer"
                >
                  Contact Admin
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-xs tracking-wide bg-gradient-to-r from-[#00236f] to-[#001744] hover:opacity-95 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying Enterprise Credentials...</span>
                  </>
                ) : (
                  <span>Access Secure ERP Portal →</span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Zero-Trust Architecture • Session Active</span>
              <span>Punjab 03 • GST Compliant</span>
            </div>
          </div>

          {/* BACK FACE 1: FORGOT PASSWORD (Orange Theme, Karanvir Sir Lecture 4 Segment 0) */}
          <div
            className={`absolute inset-0 w-full h-full bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(234,88,12,0.3)] border-2 border-orange-400 backface-hidden rotate-y-180 flex flex-col justify-between overflow-y-auto transition-opacity duration-300 ${
              flipMode === 'forgot_password' ? 'pointer-events-auto opacity-100 z-20' : 'pointer-events-none opacity-0 -z-10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setFlipMode('none')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#ea580c] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] font-black text-[10px] uppercase">
                  Orange Theme • OTP Dispatch
                </span>
              </div>

              <h2 className="text-base font-extrabold text-[#ea580c] tracking-tight mb-1">
                Password Recovery via Secure OTP
              </h2>
              <p className="text-[11px] text-slate-600 mb-4">
                Select your enabled communication channel to receive instant login credentials:
              </p>

              {otpSentMessage ? (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#ea580c]">
                    <CheckCircle2 className="w-4 h-4 text-[#ea580c]" />
                    <span>OTP Dispatched Successfully</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">{otpSentMessage}</p>
                  <p className="text-[10px] text-orange-700 italic">
                    Please check your SMS / WhatsApp / Email for your password. Returning to login...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Channel Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'email', label: 'Email OTP', icon: Mail },
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                      { id: 'sms', label: 'SMS Carrier', icon: PhoneCall },
                    ].map((ch) => {
                      const Icon = ch.icon;
                      const isSel = otpChannel === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setOtpChannel(ch.id as any)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            isSel
                              ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-xs'
                              : 'bg-slate-50 hover:bg-orange-50/50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold">{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Enter 13-Digit Student UID / 8-10 Digit EMP ID / Registered Handle:
                    </label>
                    <input
                      type="text"
                      required
                      value={otpDestination}
                      onChange={(e) => setOtpDestination(e.target.value)}
                      placeholder={
                        otpChannel === 'email'
                          ? 'scholar@bfgi.edu.in or 1001-88-03-01'
                          : '+91 98XXX XXXXX or 1001-88-03-01'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm transition-all cursor-pointer"
                  >
                    Send Temporary Credentials / OTP →
                  </button>
                </form>
              )}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-100">
              Facing account lockout? Use "Contact Admin" to dispatch an urgent support ticket.
            </div>
          </div>

          {/* BACK FACE 2: CONTACT ADMIN (Blue Theme In-Place Flip, Karanvir Sir Lecture 4 Segment 0) */}
          <div
            className={`absolute inset-0 w-full h-full bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,35,111,0.3)] border-2 border-blue-500 backface-hidden -rotate-y-180 flex flex-col justify-between overflow-y-auto transition-opacity duration-300 ${
              flipMode === 'contact_admin' ? 'pointer-events-auto opacity-100 z-20' : 'pointer-events-none opacity-0 -z-10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setFlipMode('none')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#00236f] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#00236f] font-black text-[10px] uppercase">
                  Blue Theme • Admin Authority Helpdesk
                </span>
              </div>

              <h2 className="text-base font-extrabold text-[#00236f] tracking-tight mb-1">
                Contact Authority & Log Support Ticket
              </h2>
              <p className="text-[11px] text-slate-600 mb-3">
                Submit credentials or account accessibility issues directly to the Institution Provost & System Admin:
              </p>

              {contactSuccessMessage ? (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#00236f]">
                    <CheckCircle2 className="w-4 h-4 text-[#00236f]" />
                    <span>Ticket Logged into Admin Authority Console</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">{contactSuccessMessage}</p>
                  <p className="text-[10px] text-blue-700 italic">
                    Support queue updated. Returning to login screen automatically...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactAdminSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Regarding (Karanvir Sir Master Ordinance):
                    </label>
                    <select
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f]"
                    >
                      <option value="regarding_username">Regarding Username</option>
                      <option value="regarding_password">Regarding Password</option>
                      <option value="regarding_others">Regarding Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Your UID, Employee ID, or Phone:
                    </label>
                    <input
                      type="text"
                      required
                      value={contactIdentifier}
                      onChange={(e) => setContactIdentifier(e.target.value)}
                      placeholder="e.g. 1001-88-03-01, 4001-01-03-01, or +91 90411 72159"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-[#00236f]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Describe your concern / access issue:
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={contactConcern}
                      onChange={(e) => setContactConcern(e.target.value)}
                      placeholder="Explain the credential, password, or system access obstacle you encountered..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:bg-white focus:outline-none focus:border-[#00236f] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setFlipMode('none')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00236f] hover:bg-[#001744] text-white shadow-sm cursor-pointer transition-all active:scale-[0.99]"
                    >
                      Submit Ticket to Admin Panel →
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
              Source: Login Page • Automatically recorded in Authority Support Tickets Queue.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
