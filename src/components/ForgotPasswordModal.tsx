import React, { useState } from 'react';
import { api } from '../api/client';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [activeChannel, setActiveChannel] = useState<'email' | 'sms' | 'admin' | 'platform'>('email');

  // Email State
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [emailStep, setEmailStep] = useState<'request' | 'reset'>('request');
  const [newPassword, setNewPassword] = useState('');

  // SMS OTP State
  const [smsIdentifier, setSmsIdentifier] = useState('');
  const [smsStep, setSmsStep] = useState<'request' | 'verify'>('request');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpSessionToken, setOtpSessionToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoHint, setDemoHint] = useState('');

  // General Status
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email Flow
  const handleEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setMessage(res.message);
        if (res.resetToken) setResetToken(res.resetToken);
        setEmailStep('reset');
      } else {
        setError(res.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.resetPassword({ email, newPassword, resetToken: resetToken || undefined });
      if (res.success) {
        setMessage('Password updated successfully! You can now log in.');
        setTimeout(() => onClose(), 2200);
      } else {
        setError(res.error || 'Password reset failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // SMS OTP Flow
  const handleSmsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.requestSmsOtp(smsIdentifier);
      if (res.success) {
        setMaskedPhone(res.maskedPhone);
        setOtpSessionToken(res.otpSessionToken);
        setDemoHint(res.demoOtpHint);
        setMessage(res.message);
        setSmsStep('verify');
      } else {
        setError(res.error || 'Failed to dispatch SMS OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.verifySmsOtp({
        otpSessionToken,
        otp: otpCode,
        newPassword,
      });
      if (res.success) {
        setMessage(res.message);
        setTimeout(() => onClose(), 2200);
      } else {
        setError(res.error || 'OTP verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-4 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00236f] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191c1d]">Enterprise Password Recovery Matrix</h3>
              <p className="text-[11px] text-[#757682]">Select an authorized credential reset channel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#757682] hover:text-[#191c1d] cursor-pointer">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#f3f4f5] rounded-xl text-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveChannel('email'); setError(null); setMessage(null); }}
            className={`py-1.5 px-1 rounded-lg cursor-pointer transition-all ${
              activeChannel === 'email' ? 'bg-white text-[#00236f] shadow-xs font-bold' : 'text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => { setActiveChannel('sms'); setError(null); setMessage(null); }}
            className={`py-1.5 px-1 rounded-lg cursor-pointer transition-all ${
              activeChannel === 'sms' ? 'bg-white text-[#00236f] shadow-xs font-bold' : 'text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            SMS OTP
          </button>
          <button
            type="button"
            onClick={() => { setActiveChannel('admin'); setError(null); setMessage(null); }}
            className={`py-1.5 px-1 rounded-lg cursor-pointer transition-all ${
              activeChannel === 'admin' ? 'bg-white text-[#00236f] shadow-xs font-bold' : 'text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            Admin Desk
          </button>
          <button
            type="button"
            onClick={() => { setActiveChannel('platform'); setError(null); setMessage(null); }}
            className={`py-1.5 px-1 rounded-lg cursor-pointer transition-all ${
              activeChannel === 'platform' ? 'bg-white text-[#00236f] shadow-xs font-bold' : 'text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            Platform Help
          </button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1. Email Recovery Channel */}
        {activeChannel === 'email' && (
          emailStep === 'request' ? (
            <form onSubmit={handleEmailRequest} className="space-y-3.5 text-xs">
              <p className="text-[#444651]">
                Enter your institutional mailbox to receive a cryptographically signed 15-minute reset token.
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
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#1a4bb0] text-white font-bold rounded-lg cursor-pointer"
                >
                  {isLoading ? 'Verifying...' : 'Request Reset Token'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleEmailReset} className="space-y-3.5 text-xs">
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
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#00236f] hover:bg-[#1a4bb0] text-white font-bold rounded-lg cursor-pointer"
              >
                {isLoading ? 'Updating...' : 'Set Password & Return to Login'}
              </button>
            </form>
          )
        )}

        {/* 2. SMS OTP Channel */}
        {activeChannel === 'sms' && (
          smsStep === 'request' ? (
            <form onSubmit={handleSmsRequest} className="space-y-3.5 text-xs">
              <p className="text-[#444651]">
                Dispatches a 6-digit TRAI DLT-compliant one-time security code to your registered mobile (+91).
              </p>
              <div>
                <label className="block font-bold text-[#191c1d] uppercase tracking-wider mb-1">
                  Username, Email, or Student Roll No
                </label>
                <input
                  type="text"
                  required
                  value={smsIdentifier}
                  onChange={e => setSmsIdentifier(e.target.value)}
                  placeholder="e.g. aryan or STU-2023-088"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#1a4bb0] text-white font-bold rounded-lg cursor-pointer"
                >
                  {isLoading ? 'Dispatching...' : 'Dispatch 6-Digit SMS OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSmsVerify} className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <p>Code dispatched to: <span className="font-bold text-[#00236f]">{maskedPhone}</span></p>
                {demoHint && (
                  <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                    Demo Test Code: <strong>{demoHint}</strong>
                  </p>
                )}
              </div>
              <div>
                <label className="block font-bold text-[#191c1d] uppercase tracking-wider mb-1">
                  6-Digit SMS OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="849201"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-center font-mono font-bold text-sm tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
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
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#00236f] hover:bg-[#1a4bb0] text-white font-bold rounded-lg cursor-pointer"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP & Reset Password'}
              </button>
            </form>
          )
        )}

        {/* 3. Admin / Registrar Desk Override */}
        {activeChannel === 'admin' && (
          <div className="space-y-3 text-xs text-[#444651]">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                Institutional In-Person Verification Desk
              </div>
              <p className="text-[11px]">
                Under Punjab Higher Education & MRSPTU regulations, students and faculty can obtain immediate manual credential reset directly from the Administrative Registrar Office.
              </p>
            </div>
            <div className="space-y-1.5 border border-[#e1e3e4] rounded-xl p-3 bg-[#fbfbfc]">
              <p><span className="font-bold text-[#191c1d]">Designated Authority:</span> Dr. Ramesh Chandra (Registrar & Academic Provost)</p>
              <p><span className="font-bold text-[#191c1d]">Administrative Office:</span> Room 104, Administrative Block, Main Campus</p>
              <p><span className="font-bold text-[#191c1d]">Working Hours:</span> Mon – Fri, 09:00 AM – 04:30 PM IST</p>
              <p><span className="font-bold text-[#191c1d]">Mandatory Documents:</span> Institutional ID Card + Original Aadhaar Card</p>
            </div>
            <p className="text-[11px] text-[#757682] italic">
              All manual overrides by administrators trigger cryptographic audit log entries tagged with the approving officer's UID.
            </p>
          </div>
        )}

        {/* 4. Platform Engineering Escalation */}
        {activeChannel === 'platform' && (
          <div className="space-y-3 text-xs text-[#444651]">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-[#00236f]">
              <div className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                Developed by EduCore Systems Platform Support
              </div>
              <p className="text-[11px]">
                L3 Cloud Governance & Core Database Operations escalation path for mission-critical institutional lockouts and API credential recovery.
              </p>
            </div>
            <div className="space-y-1.5 border border-[#e1e3e4] rounded-xl p-3 bg-[#fbfbfc]">
              <p><span className="font-bold text-[#191c1d]">Platform NOC Helpline:</span> +91 1800 200 4567 (Toll Free 24/7)</p>
              <p><span className="font-bold text-[#191c1d]">Engineering Support:</span> engineering@educore.edu</p>
              <p><span className="font-bold text-[#191c1d]">Tenant Authority Code:</span> GSTIN 03-BFGI-UNIVERSAL</p>
              <p><span className="font-bold text-[#191c1d]">SLA Response Time:</span> Under 15 minutes for apex administrative accounts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
