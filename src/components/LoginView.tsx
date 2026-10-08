import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface LoginViewProps {
  presetRole?: UserRole;
  onLogin: (credentials: { username: string; password: string; role: UserRole }) => Promise<void>;
  onOpenForgotPassword: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  presetRole = 'student',
  onLogin,
  onOpenForgotPassword,
  isLoading,
  errorMessage,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(presetRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setSelectedRole(presetRole);
  }, [presetRole]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username, password, role: selectedRole });
  };

  return (
    <div
      id="educore-login-screen"
      className="min-h-screen relative flex items-center justify-center p-4 bg-[#020b22] text-slate-900 font-sans text-xs antialiased overflow-hidden"
    >
      {/* Ambient Radial Lighting Accents */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/25 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 right-10 w-[500px] h-[400px] bg-gradient-to-t from-orange-600/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-lg my-8">
        
        {/* Institutional Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-orange-400 text-[10px] font-bold tracking-widest uppercase mb-3 shadow-sm">
            <span>EduCore Enterprise</span>
            <span className="w-1 h-1 rounded-full bg-orange-400"></span>
            <span className="font-mono text-white/80">MRSPTU Affiliated</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">
            Baba Farid Group of Institutions
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Canonical UID Architecture • State GST 03 (Punjab)
          </p>
        </div>

        {/* Apple-Grade Frosted Glass Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/60">
          
          <div className="mb-5 text-center">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#ea580c] block">
              Secure Gateway
            </span>
            <h2 className="text-base font-extrabold text-[#00236f] uppercase tracking-tight mt-0.5">
              {selectedRole === 'super_admin'
                ? 'Super Admin Apex Console'
                : selectedRole === 'admin'
                ? 'Institutional Administration Portal'
                : selectedRole === 'staff'
                ? 'Faculty & Academics Portal'
                : selectedRole === 'partner'
                ? 'Corporate Hiring Partner Gateway'
                : 'Student Campus & Academics Portal'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Sign in via 16-Digit Canonical UID, institutional handle, or email.
            </p>
          </div>

          {/* Apple Segmented Role Control */}
          <div className="grid grid-cols-5 gap-1 mb-5 bg-slate-100/90 p-1 rounded-full border border-slate-200/70 text-[10px] font-bold">
            <button
              type="button"
              id="role-toggle-student"
              onClick={() => handleRoleChange('student')}
              className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-white text-[#00236f] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              id="role-toggle-staff"
              onClick={() => handleRoleChange('staff')}
              className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${
                selectedRole === 'staff'
                  ? 'bg-white text-[#00236f] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              id="role-toggle-admin"
              onClick={() => handleRoleChange('admin')}
              className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-white text-[#00236f] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              id="role-toggle-superadmin"
              onClick={() => handleRoleChange('super_admin')}
              className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${
                selectedRole === 'super_admin'
                  ? 'bg-white text-[#00236f] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Super
            </button>
            <button
              type="button"
              id="role-toggle-partner"
              onClick={() => handleRoleChange('partner')}
              className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${
                selectedRole === 'partner'
                  ? 'bg-white text-[#ea580c] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Partner
            </button>
          </div>

          {/* Quick Demo Credentials Matrix */}
          <div className="mb-5 p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl text-[10px]">
            <div className="flex items-center justify-between font-bold text-slate-700 mb-2">
              <span className="text-[10px] tracking-tight uppercase text-slate-500 font-extrabold">Instant Demo Accounts</span>
              <span className="font-mono text-[9px] text-[#ea580c] font-bold">Punjab GST · 03</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setUsername('4001-01-03-BFGI');
                  setPassword('admin123');
                }}
                className="p-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-xl text-[#00236f] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-blue-300"
              >
                <span className="font-bold text-[10px]">[ADMIN]</span>
                <span className="text-slate-500 text-[10px]">4001-01-03-BFGI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('super_admin');
                  setUsername('9001-01-03-BFGI');
                  setPassword('super123');
                }}
                className="p-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-xl text-[#00236f] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-blue-300"
              >
                <span className="font-bold text-[10px]">[SUPER]</span>
                <span className="text-slate-500 text-[10px]">9001-01-03-BFGI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('staff');
                  setUsername('2001-14-03-BFGI');
                  setPassword('staff123');
                }}
                className="p-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-xl text-[#00236f] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-blue-300"
              >
                <span className="font-bold text-[10px]">[STAFF]</span>
                <span className="text-slate-500 text-[10px]">2001-14-03-BFGI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student');
                  setUsername('1001-88-03-BFGI');
                  setPassword('student123');
                }}
                className="p-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200/90 rounded-xl text-[#00236f] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-blue-300"
              >
                <span className="font-bold text-[10px]">[STUDENT]</span>
                <span className="text-slate-500 text-[10px]">1001-88-03-BFGI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('partner');
                  setUsername('7001-01-03-BFGI');
                  setPassword('partner123');
                }}
                className="col-span-2 p-2 text-left bg-white hover:bg-orange-50/60 border border-slate-200/90 rounded-xl text-[#ea580c] flex items-center justify-between cursor-pointer transition shadow-2xs hover:border-orange-300"
              >
                <span className="font-bold text-[10px]">[PARTNER - INFOSYS]</span>
                <span className="text-slate-500 text-[10px]">7001-01-03-BFGI / partner123</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="font-bold">[Alert]</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username-input"
                className="block text-[11px] font-bold text-slate-700 tracking-tight mb-1"
              >
                Enterprise UID / Username / Registered Email
              </label>
              <input
                id="login-username-input"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. 4001-01-03-BFGI or admin"
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
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={onOpenForgotPassword}
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
                  onChange={e => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#00236f] focus:ring-[#00236f]"
                />
                <span className="text-[11px] text-slate-600">Keep session active</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">TLS 1.3 · 256-Bit Encrypted</span>
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

          {/* Footer Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Zero-Trust Session • Punjab Audit Log</span>
            <span className="font-semibold text-slate-500">MRSPTU Regulatory Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
