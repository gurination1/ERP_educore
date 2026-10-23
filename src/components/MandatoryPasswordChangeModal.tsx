import React, { useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';
import { Lock, ShieldAlert, KeyRound, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

interface MandatoryPasswordChangeModalProps {
  currentUser: User;
  onSuccess: () => void;
  onLogout: () => void;
}

export const MandatoryPasswordChangeModal: React.FC<MandatoryPasswordChangeModalProps> = ({
  currentUser,
  onSuccess,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.forceChangePassword(newPassword);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Failed to update permanent password.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="w-full overflow-hidden font-sans">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#00236f] to-[#001744] text-white p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>Mandatory Security Protocol</span>
            </span>
            <span className="font-mono text-[10px] text-white/60">
              {currentUser.enterprise_uid || currentUser.employee_id || 'ID-AUTH'}
            </span>
          </div>

          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-300 shrink-0" />
            <span>Set Your Permanent Password</span>
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            Welcome, <strong>{currentUser.full_name || currentUser.username}</strong>. An administrator has issued a temporary credential. You must establish a permanent password before continuing.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
              New Permanent Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Choose new secure password..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
              />
            </div>

            {/* Strength Meter */}
            {newPassword && (
              <div className="pt-1.5 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-semibold">Password Strength:</span>
                  <span className={`font-bold ${
                    strength <= 25 ? 'text-rose-600' : strength <= 50 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {strength <= 25 ? 'Weak' : strength <= 50 ? 'Moderate' : strength <= 75 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength <= 25 ? 'bg-rose-500 w-1/4' : strength <= 50 ? 'bg-amber-500 w-2/4' : strength <= 75 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
              Confirm Permanent Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
              />
            </div>
            {confirmPassword && newPassword === confirmPassword && (
              <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Passwords match
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !newPassword || newPassword !== confirmPassword}
              className="w-full py-3 rounded-2xl bg-[#00236f] hover:bg-[#001744] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Updating Credentials...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Set Permanent Password & Enter Portal</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cancel & Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
