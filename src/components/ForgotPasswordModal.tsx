import React, { useState } from 'react';
import { api } from '../api/client';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setMessage(res.message);
        setStep('reset');
      } else {
        setError(res.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.resetPassword({ email, newPassword });
      if (res.success) {
        setMessage('Password updated successfully! You can now login with your new credentials.');
        setTimeout(() => onClose(), 2500);
      } else {
        setError(res.error || 'Password reset failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[20px]">
              lock_reset
            </span>
            <h3 className="text-base font-bold text-[#191c1d]">Recover Portal Password</h3>
          </div>
          <button onClick={onClose} className="text-[#757682] hover:text-[#191c1d]">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {message && (
          <div className="p-3 bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61] rounded-lg text-xs font-semibold">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4 text-xs">
            <p className="text-[#444651]">
              Enter your institutional email address to verify your student/admin identity and obtain password reset authorization.
            </p>

            <div>
              <label className="block font-bold text-[#191c1d] uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. aryan@educore.edu"
                className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-lg"
              >
                {isLoading ? 'Verifying...' : 'Request Password Reset'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#191c1d] uppercase tracking-wider mb-1">
                New Security Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-lg"
              >
                {isLoading ? 'Updating...' : 'Set New Password & Return to Login'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
