import React, { useState } from 'react';
import { api } from '../api/client';
import { StudentProfile } from '../types';

interface PayNowModalProps {
  student: StudentProfile | null;
  feeId?: string;
  onClose: () => void;
  onPaymentSuccess: (receiptNo: string) => void;
}

export const PayNowModal: React.FC<PayNowModalProps> = ({
  student,
  feeId,
  onClose,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState('45000');
  const [paymentMode, setPaymentMode] = useState<'online_upi' | 'net_banking' | 'credit_card' | 'cash'>('online_upi');
  const [upiId, setUpiId] = useState('aryan@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await api.payFee({
        studentId: student?.id || 'stu-rec-aryan',
        amount: parseFloat(amount),
        paymentMode,
        studentFeeId: feeId,
        notes: `Online semester fee payment via ${paymentMode.toUpperCase()}`,
      });

      if (res.success && res.receiptNo) {
        onPaymentSuccess(res.receiptNo);
      } else {
        setErrorMsg(res.error || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00236f] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191c1d]">Online Fee Payment</h3>
              <p className="text-[11px] text-[#757682]">
                Student: {student ? `${student.first_name} ${student.last_name}` : 'Aryan Sharma'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#757682] hover:text-[#191c1d]">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-lg text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePay} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#191c1d] uppercase tracking-wider mb-1">
              Payment Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#757682] text-sm">
                ₹
              </span>
              <input
                type="number"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-base font-bold text-[#191c1d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#191c1d] uppercase tracking-wider mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('online_upi')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  paymentMode === 'online_upi'
                    ? 'border-[#00236f] bg-[#dce1ff]/40 text-[#00236f] font-bold'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>UPI / QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('net_banking')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  paymentMode === 'net_banking'
                    ? 'border-[#00236f] bg-[#dce1ff]/40 text-[#00236f] font-bold'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                <span>Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('credit_card')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  paymentMode === 'credit_card'
                    ? 'border-[#00236f] bg-[#dce1ff]/40 text-[#00236f] font-bold'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                <span>Debit / Credit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  paymentMode === 'cash'
                    ? 'border-[#00236f] bg-[#dce1ff]/40 text-[#00236f] font-bold'
                    : 'border-[#e1e3e4] bg-[#f8f9fa] text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Cash at Counter</span>
              </button>
            </div>
          </div>

          {paymentMode === 'online_upi' && (
            <div>
              <label className="block font-bold text-[#191c1d] mb-1">UPI Virtual Payment ID</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
              />
            </div>
          )}

          <div className="p-3 bg-[#f8f9fa] rounded-lg text-[11px] text-[#757682] flex items-center gap-2 border border-[#edeeef]">
            <span className="material-symbols-outlined text-[16px] text-[#006a61]">lock</span>
            <span>256-bit encrypted gateway. Receipt is generated instantly upon payment.</span>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              {isProcessing ? 'Confirming Transaction...' : `Pay ₹ ${parseFloat(amount || '0').toLocaleString('en-IN')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
