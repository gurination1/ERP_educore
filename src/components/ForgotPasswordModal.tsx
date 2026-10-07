import React, { useState } from 'react';
import { api } from '../api/client';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [activeChannel, setActiveChannel] = useState<'email' | 'sms' | 'whatsapp' | 'admin'>('email');

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

  // WhatsApp OTP State
  const [whatsappIdentifier, setWhatsappIdentifier] = useState('');
  const [whatsappStep, setWhatsappStep] = useState<'request' | 'verify'>('request');
  const [whatsappMaskedPhone, setWhatsappMaskedPhone] = useState('');
  const [whatsappOtpToken, setWhatsappOtpToken] = useState('');
  const [whatsappOtpCode, setWhatsappOtpCode] = useState('');
  const [whatsappDemoHint, setWhatsappDemoHint] = useState('');

  // Admin Ticket State
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [adminTicketResult, setAdminTicketResult] = useState<any | null>(null);

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

  // WhatsApp OTP Flow
  const handleWhatsappRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.requestWhatsAppOtp(whatsappIdentifier);
      if (res.success) {
        setWhatsappMaskedPhone(res.maskedPhone);
        setWhatsappOtpToken(res.otpSessionToken);
        setWhatsappDemoHint(res.demoOtpHint);
        setMessage(res.message);
        setWhatsappStep('verify');
      } else {
        setError(res.error || 'Failed to dispatch WhatsApp OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsappVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.verifySmsOtp({
        otpSessionToken: whatsappOtpToken,
        otp: whatsappOtpCode,
        newPassword,
      });
      if (res.success) {
        setMessage('WhatsApp verified identity successfully! Password updated.');
        setTimeout(() => onClose(), 2200);
      } else {
        setError(res.error || 'WhatsApp code verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Ticket Request Flow
  const handleAdminTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.requestAdminPasswordTicket(adminIdentifier, adminRemarks);
      if (res.success) {
        setAdminTicketResult(res);
        setMessage(res.message);
      } else {
        setError(res.error || 'Failed to submit recovery ticket.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded border border-[#00236f] max-w-lg w-full p-5 shadow-2xl space-y-3 font-sans text-[11px] text-[#00236f]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div>
            <h3 className="text-[13px] font-bold text-[#00236f]">MULTI-CHANNEL PASSWORD RECOVERY</h3>
            <p className="text-[10px] text-gray-500">Self-Service Verification & Admin Assisted Reset Matrix</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black font-bold">
            [CLOSE]
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded text-center text-[10px] font-bold">
          <button
            type="button"
            onClick={() => { setActiveChannel('email'); setError(null); setMessage(null); }}
            className={`py-1 rounded transition ${
              activeChannel === 'email' ? 'bg-[#00236f] text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            EMAIL TOKEN
          </button>
          <button
            type="button"
            onClick={() => { setActiveChannel('sms'); setError(null); setMessage(null); }}
            className={`py-1 rounded transition ${
              activeChannel === 'sms' ? 'bg-[#00236f] text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            TRAI SMS OTP
          </button>
          <button
            type="button"
            onClick={() => { setActiveChannel('whatsapp'); setError(null); setMessage(null); }}
            className={`py-1 rounded transition ${
              activeChannel === 'whatsapp' ? 'bg-[#00236f] text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            WHATSAPP OTP
          </button>
          <button
            type="button"
            onClick={() => { setActiveChannel('admin'); setError(null); setMessage(null); }}
            className={`py-1 rounded transition ${
              activeChannel === 'admin' ? 'bg-[#ea580c] text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            CONTACT ADMIN
          </button>
        </div>

        {message && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[10px] font-semibold">
            [SUCCESS] {message}
          </div>
        )}
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded text-[10px] font-semibold">
            [ERROR] {error}
          </div>
        )}

        {/* 1. Email Recovery Channel */}
        {activeChannel === 'email' && (
          emailStep === 'request' ? (
            <form onSubmit={handleEmailRequest} className="space-y-3">
              <p className="text-gray-600 text-[10px]">
                Dispatches a signed 15-minute password reset token to your registered institutional mailbox.
              </p>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  REGISTERED INSTITUTIONAL EMAIL:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. aryan@educore.edu"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-[11px] focus:outline-none focus:border-[#00236f]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1 bg-[#00236f] text-white font-bold rounded hover:bg-[#00236f]/90"
                >
                  {isLoading ? 'DISPATCHING...' : 'DISPATCH RESET TOKEN'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleEmailReset} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  NEW PASSWORD (MIN 6 CHARACTERS):
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-[11px]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-1.5 bg-[#00236f] text-white font-bold rounded hover:bg-[#00236f]/90"
              >
                {isLoading ? 'UPDATING...' : 'CONFIRM PASSWORD UPDATE'}
              </button>
            </form>
          )
        )}

        {/* 2. SMS OTP Channel */}
        {activeChannel === 'sms' && (
          smsStep === 'request' ? (
            <form onSubmit={handleSmsRequest} className="space-y-3">
              <p className="text-gray-600 text-[10px]">
                Dispatches a 6-digit TRAI DLT-compliant one-time security code to your registered mobile (+91).
              </p>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  ENTERPRISE UID, USERNAME, OR EMAIL:
                </label>
                <input
                  type="text"
                  required
                  value={smsIdentifier}
                  onChange={e => setSmsIdentifier(e.target.value)}
                  placeholder="e.g. aryan, 1001-03-BFGI-260088, or admin@educore.edu"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-[11px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 border rounded text-gray-600"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1 bg-[#00236f] text-white font-bold rounded"
                >
                  {isLoading ? 'DISPATCHING...' : 'DISPATCH SMS OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSmsVerify} className="space-y-3">
              <div className="p-2 bg-gray-50 border rounded text-[10px]">
                <p>Code dispatched to: <strong>{maskedPhone}</strong></p>
                {demoHint && <p className="text-emerald-700 font-mono mt-0.5">Demo OTP: <strong>{demoHint}</strong></p>}
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">6-DIGIT SMS CODE:</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="849201"
                  className="w-full px-2.5 py-1.5 border rounded text-center font-mono font-bold text-[13px]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">NEW PASSWORD:</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-1.5 bg-[#00236f] text-white font-bold rounded"
              >
                {isLoading ? 'VERIFYING...' : 'VERIFY OTP & UPDATE PASSWORD'}
              </button>
            </form>
          )
        )}

        {/* 3. WhatsApp OTP Channel */}
        {activeChannel === 'whatsapp' && (
          whatsappStep === 'request' ? (
            <form onSubmit={handleWhatsappRequest} className="space-y-3">
              <p className="text-gray-600 text-[10px]">
                Dispatches a verified one-time password via official Meta WhatsApp Business API to your registered phone number.
              </p>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  ENTERPRISE UID, USERNAME, OR EMAIL:
                </label>
                <input
                  type="text"
                  required
                  value={whatsappIdentifier}
                  onChange={e => setWhatsappIdentifier(e.target.value)}
                  placeholder="e.g. aryan, staff01, or partner01"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-[11px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 border rounded text-gray-600"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1 bg-[#00236f] text-white font-bold rounded"
                >
                  {isLoading ? 'DELIVERING...' : 'DELIVER WHATSAPP OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleWhatsappVerify} className="space-y-3">
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-[10px] text-emerald-900">
                <p>Delivered to WhatsApp on: <strong>{whatsappMaskedPhone}</strong></p>
                {whatsappDemoHint && <p className="font-mono mt-0.5">Demo WhatsApp OTP: <strong>{whatsappDemoHint}</strong></p>}
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">6-DIGIT WHATSAPP CODE:</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={whatsappOtpCode}
                  onChange={e => setWhatsappOtpCode(e.target.value)}
                  placeholder="739412"
                  className="w-full px-2.5 py-1.5 border rounded text-center font-mono font-bold text-[13px]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">NEW PERMANENT PASSWORD:</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-1.5 bg-[#00236f] text-white font-bold rounded"
              >
                {isLoading ? 'VERIFYING...' : 'VERIFY & SECURE ACCOUNT'}
              </button>
            </form>
          )
        )}

        {/* 4. Contact Administrator Desk Ticket Flow */}
        {activeChannel === 'admin' && (
          <div className="space-y-3">
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-[10px] text-amber-900 space-y-1">
              <span className="font-bold block">[ADMINISTRATOR ASSISTED RECOVERY]:</span>
              <p>
                Only authorized administrators (Registrar / Executive Directorate) can directly issue temporary credentials or reset staff/student accounts.
                Resetting enforces a <strong>mandatory password change</strong> on the recipient's next login.
              </p>
            </div>

            {adminTicketResult ? (
              <div className="p-3 bg-gray-50 border rounded space-y-2 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00236f]">TICKET LODGED SUCCESSFULLY</span>
                  <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded font-mono font-bold">
                    #{adminTicketResult.ticketNo}
                  </span>
                </div>
                <p className="text-gray-700">{adminTicketResult.message}</p>
                <p className="text-gray-500 italic">
                  Cryptographic security log registered with institutional audit engine.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAdminTicketSubmit} className="space-y-2.5 text-[10px]">
                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">
                    YOUR ACCOUNT IDENTIFIER (ROLL NO, EMP ID, USERNAME, EMAIL) *:
                  </label>
                  <input
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={e => setAdminIdentifier(e.target.value)}
                    placeholder="e.g. FAC-CSE-014 or STU-2025-001"
                    className="w-full px-2.5 py-1.5 border rounded"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">
                    BRIEF REASON / IDENTITY VERIFICATION NOTES:
                  </label>
                  <textarea
                    rows={2}
                    value={adminRemarks}
                    onChange={e => setAdminRemarks(e.target.value)}
                    placeholder="e.g. Lost SIM card, need administrator credential dispatch..."
                    className="w-full px-2.5 py-1.5 border rounded"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1 border rounded text-gray-600"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-1 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-bold rounded"
                  >
                    {isLoading ? 'SUBMITTING...' : 'LODGE ESCALATION TICKET'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
