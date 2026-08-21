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
      className="min-h-screen relative flex items-center justify-center p-4 bg-[#0a1428]"
    >
      {/* Background Campus Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')`,
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1428] via-[#0a1428]/80 to-[#00236f]/60"></div>

      {/* Main Login Container */}
      <div className="relative z-10 w-full max-w-md my-8">
        {/* Top Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00236f] text-white shadow-xl mb-3 border border-[#b6c4ff]/30">
            <span className="material-symbols-outlined text-[32px]">school</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">EduCore</h1>
          <p className="text-xs font-semibold text-[#86f2e4] uppercase tracking-widest mt-1">
            College Management Portal
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-[#ffffff] rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-[#191c1d]">
              {selectedRole === 'admin' ? 'Admin Portal Login' : 'Student Portal Login'}
            </h2>
            <p className="text-xs text-[#757682] mt-1">
              Please enter your institutional credentials to authenticate.
            </p>
          </div>

          {/* Role Selector Toggle */}
          <div className="p-1 bg-[#f3f4f5] rounded-xl flex items-center mb-6 border border-[#e1e3e4]">
            <button
              type="button"
              id="role-toggle-student"
              onClick={() => handleRoleChange('student')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'student'
                  ? 'bg-white text-[#00236f] shadow-xs border border-[#e1e3e4]'
                  : 'text-[#757682] hover:text-[#191c1d]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>STUDENT</span>
            </button>
            <button
              type="button"
              id="role-toggle-admin"
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'admin'
                  ? 'bg-white text-[#00236f] shadow-xs border border-[#e1e3e4]'
                  : 'text-[#757682] hover:text-[#191c1d]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>ADMIN</span>
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-lg text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username-input"
                className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider mb-1.5"
              >
                Institution ID / Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757682] text-[18px]">
                  person
                </span>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter Institution ID or Email"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password-input"
                  className="block text-xs font-bold text-[#191c1d] uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={onOpenForgotPassword}
                  className="text-xs font-semibold text-[#00236f] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757682] text-[18px]">
                  lock
                </span>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-sm text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f]"
                />
                <button
                  type="button"
                  id="toggle-password-visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757682] hover:text-[#191c1d] p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#444651] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-[#e1e3e4] text-[#00236f] focus:ring-[#00236f]"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Login to Portal</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#90a8ff]/80 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-[#86f2e4]">lock</span>
            <span>256-bit Institutional SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
