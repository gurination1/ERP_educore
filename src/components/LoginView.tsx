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
      className="min-h-screen relative flex items-center justify-center p-3 bg-[#001744] text-[11px]"
    >
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      {/* Main Login Box */}
      <div className="relative z-10 w-full max-w-md my-6">
        {/* Top Institutional Header */}
        <div className="text-center mb-4">
          <div className="inline-block bg-[#ea580c] text-white px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase mb-1.5 shadow-sm">
            EDUCORE ENTERPRISE ERP
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            BABA FARID GROUP OF INSTITUTIONS
          </h1>
          <p className="text-[10px] font-mono text-orange-200 mt-0.5">
            CANONICAL UID ARCHITECTURE • GST CODE: 03 (PUNJAB) • MRSPTU AFFILIATED
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-lg p-5 shadow-xl border-t-4 border-[#ea580c]">
          <div className="mb-4 text-center border-b pb-3">
            <span className="text-[10px] font-bold text-[#ea580c] uppercase tracking-wider block">
              PORTAL ACCESS GATEWAY
            </span>
            <h2 className="text-sm font-bold text-[#00236f] uppercase mt-0.5">
              {selectedRole === 'super_admin'
                ? 'Super Admin Omnipotent Gateway'
                : selectedRole === 'admin'
                ? 'Institutional Administration Portal'
                : selectedRole === 'staff'
                ? 'Faculty & Academic R&D Portal'
                : selectedRole === 'partner'
                ? 'Corporate Hiring & Internship Partner Gateway'
                : 'Student Campus & Academics Portal'}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Authenticate via 16-Digit Canonical UID, institutional username, or registered email.
            </p>
          </div>

          {/* Role Selector Toggle (Pure Text Tabs) */}
          <div className="grid grid-cols-5 gap-1 mb-3 bg-gray-100 p-1 rounded text-[9px] font-bold">
            <button
              type="button"
              id="role-toggle-student"
              onClick={() => handleRoleChange('student')}
              className={`py-1.5 rounded text-center transition-all ${
                selectedRole === 'student'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black bg-white/70'
              }`}
            >
              STUDENT
            </button>
            <button
              type="button"
              id="role-toggle-staff"
              onClick={() => handleRoleChange('staff')}
              className={`py-1.5 rounded text-center transition-all ${
                selectedRole === 'staff'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black bg-white/70'
              }`}
            >
              FACULTY
            </button>
            <button
              type="button"
              id="role-toggle-admin"
              onClick={() => handleRoleChange('admin')}
              className={`py-1.5 rounded text-center transition-all ${
                selectedRole === 'admin'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black bg-white/70'
              }`}
            >
              ADMIN
            </button>
            <button
              type="button"
              id="role-toggle-superadmin"
              onClick={() => handleRoleChange('super_admin')}
              className={`py-1.5 rounded text-center transition-all ${
                selectedRole === 'super_admin'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black bg-white/70'
              }`}
            >
              SUPER
            </button>
            <button
              type="button"
              id="role-toggle-partner"
              onClick={() => handleRoleChange('partner')}
              className={`py-1.5 rounded text-center transition-all ${
                selectedRole === 'partner'
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black bg-white/70'
              }`}
            >
              PARTNER
            </button>
          </div>

          {/* Quick Demo Credentials / Enterprise UID chips */}
          <div className="mb-3.5 p-2 bg-blue-50/60 border border-blue-200/80 rounded text-[9px]">
            <div className="flex items-center justify-between font-bold text-[#00236f] mb-1">
              <span>ONE-CLICK DEMO AUTHENTICATION:</span>
              <span className="font-mono text-[9px] text-[#ea580c]">STATE 03 (PB)</span>
            </div>
            <div className="grid grid-cols-2 gap-1 font-mono">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setUsername('4001-03-BFGI-0001');
                  setPassword('admin123');
                }}
                className="p-1 text-left bg-white hover:bg-blue-100 border border-blue-300 rounded text-[#00236f] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold">[ADMIN]</span>
                <span className="text-gray-500">4001-03-BFGI-0001</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('super_admin');
                  setUsername('9001-03-BFGI-000001');
                  setPassword('super123');
                }}
                className="p-1 text-left bg-white hover:bg-blue-100 border border-blue-300 rounded text-[#00236f] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold">[SUPER]</span>
                <span className="text-gray-500">9001-03-BFGI-0001</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('staff');
                  setUsername('2001-03-BFGI-0014');
                  setPassword('staff123');
                }}
                className="p-1 text-left bg-white hover:bg-blue-100 border border-blue-300 rounded text-[#00236f] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold">[STAFF]</span>
                <span className="text-gray-500">2001-03-BFGI-0014</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student');
                  setUsername('1001-03-BFGI-260088');
                  setPassword('student123');
                }}
                className="p-1 text-left bg-white hover:bg-blue-100 border border-blue-300 rounded text-[#00236f] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold">[STUDENT]</span>
                <span className="text-gray-500">1001-03-BFGI-260088</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('partner');
                  setUsername('PRT-001');
                  setPassword('partner123');
                }}
                className="col-span-2 p-1 text-left bg-white hover:bg-orange-50 border border-orange-300 rounded text-[#ea580c] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold">[PARTNER - INFOSYS]</span>
                <span className="text-gray-500">PRT-001 / partner123</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-3 p-2 bg-rose-50 border border-rose-300 text-rose-800 rounded text-[10px] font-bold">
              [ERROR]: {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="login-username-input"
                className="block text-[10px] font-bold text-[#00236f] uppercase tracking-wider mb-1"
              >
                Enterprise UID / Username / Registered Email
              </label>
              <input
                id="login-username-input"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. 4001-03-BFGI-0001 or admin"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded font-mono text-[11px] text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00236f] focus:border-[#00236f]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password-input"
                  className="block text-[10px] font-bold text-[#00236f] uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={onOpenForgotPassword}
                  className="text-[10px] font-bold text-[#ea580c] hover:underline"
                >
                  [FORGOT PASSWORD?]
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-1.5 pr-14 bg-gray-50 border border-gray-300 rounded font-mono text-[11px] text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00236f] focus:border-[#00236f]"
                />
                <button
                  type="button"
                  id="toggle-password-visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 text-[9px] font-bold text-gray-600 hover:text-black uppercase px-1 py-0.5 border rounded bg-white cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'VIEW'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-0.5">
              <label className="flex items-center gap-1.5 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#00236f]"
                />
                <span>Persist session on this hardware</span>
              </label>
              <span className="text-[9px] font-mono text-gray-500">TLS 1.3 / 256-BIT</span>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-2 px-3 bg-[#00236f] hover:bg-[#00236f]/90 text-white rounded font-bold text-[11px] uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-70"
            >
              {isLoading ? 'AUTHENTICATING ENCRYPTED SESSION...' : '[ENTER SECURE ERP PORTAL →]'}
            </button>
          </form>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-4 text-center text-[9px] text-gray-300 space-y-1">
          <p className="font-mono">
            SECURITY GATES: ZERO-TRUST SESSION • OTP RESETS • AUDIT-LOG TRACKED
          </p>
          <p className="text-gray-400">
            Designed for Baba Farid Group of Institutions & Affiliated Campuses
          </p>
        </div>
      </div>
    </div>
  );
};
