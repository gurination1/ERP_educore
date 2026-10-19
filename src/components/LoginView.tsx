import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  Shield,
  KeyRound,
  Mail,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  Lock,
  UserCheck,
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

  // In-place flip state (Karanvir Sir Lecture 4)
  const [isFlipped, setIsFlipped] = useState(false);
  const [otpChannel, setOtpChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');
  const [otpDestination, setOtpDestination] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  // Contact Admin state (Karanvir Sir Lecture 4: Dropdown regarding username/password/others + concern)
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState<'regarding_username' | 'regarding_password' | 'regarding_others'>('regarding_password');
  const [contactIdentifier, setContactIdentifier] = useState('');
  const [contactConcern, setContactConcern] = useState('');
  const [contactSuccessMessage, setContactSuccessMessage] = useState<string | null>(null);

  // Validation warning (Karanvir Sir Lecture 4: 13 digits for student, 8-9 for employee)
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(presetRole);
  }, [presetRole]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setValidationWarning(null);
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length > 0) {
      if (selectedRole === 'student' && clean.length > 0 && clean.length !== 13) {
        setValidationWarning(`Student UID requires exactly 13 digits (Current: ${clean.length} digits)`);
      } else if (
        ['admin', 'staff', 'hod', 'accounts', 'hr', 'hostel', 'counselor'].includes(selectedRole) &&
        clean.length > 0 &&
        clean.length !== 8 &&
        clean.length !== 9 &&
        clean.length !== 10
      ) {
        setValidationWarning(`Staff / Employee ID requires 8-10 digits (Current: ${clean.length} digits)`);
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
      setIsFlipped(false);
    }, 3800);
  };

  const handleContactAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tktId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setContactSuccessMessage(
      `Support ticket #${tktId} generated successfully in the Authority Console. Admin team notified.`
    );
    setTimeout(() => {
      setContactSuccessMessage(null);
      setIsContactAdminOpen(false);
      setContactConcern('');
    }, 3500);
  };

  return (
    <div
      id="educore-login-screen"
      className="min-h-screen relative flex items-center justify-center p-4 bg-[#020b22] text-slate-900 font-sans text-xs antialiased overflow-hidden"
    >
      {/* Ambient Radial Lighting Accents */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/25 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 right-10 w-[500px] h-[400px] bg-gradient-to-t from-orange-600/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg my-8 perspective-1000">
        {/* Institutional Branding Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-orange-400 text-[10px] font-bold tracking-widest uppercase mb-2.5 shadow-sm">
            <span>EduCore Enterprise ERP</span>
            <span className="w-1 h-1 rounded-full bg-orange-400"></span>
            <span className="font-mono text-white/80">PUP • MRSPTU • PU Affiliated</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">
            Baba Farid Group of Institutions
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Canonical UID Architecture • State GST 03 (Punjab)
          </p>
        </div>

        {/* 3D Flip Card Container */}
        <div
          className={`relative transition-all duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE: REGULAR LOGIN */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/60 backface-hidden">
            {/* Header Title (Clean, no fake secure gateway badge per Karanvir Sir) */}
            <div className="mb-4 text-center">
              <h2 className="text-base font-extrabold text-[#00236f] uppercase tracking-tight">
                {selectedRole === 'super_admin'
                  ? 'Super Admin Apex Platform'
                  : selectedRole === 'admin'
                  ? 'Institutional Administration Portal'
                  : selectedRole === 'hostel'
                  ? 'Campus Residences & Hostel Administration'
                  : selectedRole === 'hr'
                  ? 'Chief HR & Establishment Console'
                  : selectedRole === 'staff'
                  ? 'Faculty & Academics Portal'
                  : selectedRole === 'partner'
                  ? 'Corporate Placement Partner'
                  : 'Student Campus & Academics Portal'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">
                Canonical Pure-Digit UID • 13 Digits (Student) / 8-10 Digits (Staff/Admin)
              </p>
            </div>

            {/* Apple Segmented Role Control (Includes New Role: Hostel) */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 mb-4 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 text-[10px] font-bold">
              {[
                { id: 'student', label: 'Student' },
                { id: 'staff', label: 'Faculty' },
                { id: 'admin', label: 'Admin' },
                { id: 'hostel', label: 'Hostel' },
                { id: 'accounts', label: 'Accounts' },
                { id: 'hr', label: 'HRMS' },
                { id: 'super_admin', label: 'Super' },
              ].map((r) => {
                const isActive = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleChange(r.id as UserRole)}
                    className={`py-1.5 rounded-xl text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#00236f] shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            {/* Instant Demo Credentials Matrix */}
            <div className="mb-4 p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl text-[10px]">
              <div className="flex items-center justify-between font-bold text-slate-700 mb-2">
                <span className="text-[10px] tracking-tight uppercase text-slate-500 font-extrabold">Instant Demo Accounts</span>
                <span className="font-mono text-[9px] text-[#ea580c] font-bold">Pure Digits • Punjab 03</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setUsername('4001-01-03-01');
                    setPassword('admin123');
                    setValidationWarning(null);
                  }}
                  className="p-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-xl text-[#00236f] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-blue-300"
                >
                  <span className="font-bold text-[10px]">[ADMIN]</span>
                  <span className="text-slate-500 text-[10px]">4001-01-03-01</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('hostel');
                    setUsername('10001-01-03-01');
                    setPassword('warden123');
                    setValidationWarning(null);
                  }}
                  className="p-2 text-left bg-white hover:bg-orange-50/60 border border-slate-200/90 rounded-xl text-[#ea580c] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-orange-300"
                >
                  <span className="font-bold text-[10px]">[HOSTEL WARDEN]</span>
                  <span className="text-slate-500 text-[10px]">10001-01-03-01</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('student');
                    setUsername('1001-88-03-01');
                    setPassword('student123');
                    setValidationWarning(null);
                  }}
                  className="p-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-xl text-[#00236f] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-blue-300"
                >
                  <span className="font-bold text-[10px]">[STUDENT]</span>
                  <span className="text-slate-500 text-[10px]">1001-88-03-01</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('staff');
                    setUsername('2001-14-03-01');
                    setPassword('staff123');
                    setValidationWarning(null);
                  }}
                  className="p-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-xl text-[#00236f] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-blue-300"
                >
                  <span className="font-bold text-[10px]">[FACULTY]</span>
                  <span className="text-slate-500 text-[10px]">2001-14-03-01</span>
                </button>
              </div>
            </div>

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
                  Canonical Enterprise UID / Registered Handle
                </label>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="e.g. 4001-01-03-01, 10001-01-03-01, or 1001-88-03-01"
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
                  {/* Flip to Forgot Password (Karanvir Sir Lecture 4) */}
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
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

              {/* Keep Active Checkbox (Karanvir Sir Lecture 4) */}
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

                {/* Contact Admin Link (Karanvir Sir Lecture 4) */}
                <button
                  type="button"
                  onClick={() => setIsContactAdminOpen(true)}
                  className="text-[11px] font-bold text-slate-600 hover:text-[#00236f] underline cursor-pointer"
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

          {/* BACK FACE: IN-PLACE FLIP FORGOT PASSWORD (Karanvir Sir Lecture 4) */}
          <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/60 backface-hidden rotate-y-180 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setIsFlipped(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#00236f] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] font-black text-[10px] uppercase">
                  Fast OTP Dispatch
                </span>
              </div>

              <h2 className="text-base font-extrabold text-[#00236f] tracking-tight mb-1">
                Password Recovery & OTP Dispatch
              </h2>
              <p className="text-[11px] text-slate-500 mb-4">
                Select your preferred OTP delivery channel linked to your canonical profile:
              </p>

              {otpSentMessage ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>OTP Dispatched Successfully</span>
                  </div>
                  <p className="text-xs leading-relaxed">{otpSentMessage}</p>
                  <p className="text-[10px] text-emerald-700 italic">
                    Returning to login view automatically...
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
                              ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
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
                      Enter 13-Digit Student UID / Registered Email / Phone:
                    </label>
                    <input
                      type="text"
                      required
                      value={otpDestination}
                      onChange={(e) => setOtpDestination(e.target.value)}
                      placeholder={
                        otpChannel === 'email'
                          ? 'scholar@bfgi.edu.in or 1001-88-03-01'
                          : '+91 98XXX XXXXX'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-[#00236f]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm transition-all cursor-pointer"
                  >
                    Send One-Time Password (OTP) →
                  </button>
                </form>
              )}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-100">
              Need immediate clearance? Use "Contact Admin" on login screen.
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT ADMIN SUPPORT MODAL (Karanvir Sir Lecture 4) */}
      {isContactAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#00236f] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ea580c]" />
                <span>Contact Authority & Support Ticket</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsContactAdminOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {contactSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ticket Logged in Admin Console</span>
                </div>
                <p className="text-xs">{contactSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleContactAdminSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Select Concern Category:
                  </label>
                  {/* Karanvir Sir Lecture 4 exact dropdown */}
                  <select
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#00236f]"
                  >
                    <option value="regarding_username">regarding username</option>
                    <option value="regarding_password">regarding password</option>
                    <option value="regarding_others">regarding others</option>
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
                    placeholder="e.g. 1001-88-03-01 or 4001010301"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-[#00236f]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Describe your issue / concern:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={contactConcern}
                    onChange={(e) => setContactConcern(e.target.value)}
                    placeholder="Explain the credential or access difficulty you are experiencing..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00236f]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsContactAdminOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00236f] hover:bg-[#001744] text-white shadow-sm cursor-pointer"
                  >
                    Submit Ticket to Admin Panel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
