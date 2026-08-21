import React, { useState } from 'react';
import { api } from '../api/client';

interface EmailRemindersModalProps {
  onClose: () => void;
}

export const EmailRemindersModal: React.FC<EmailRemindersModalProps> = ({ onClose }) => {
  const [subject, setSubject] = useState('URGENT: Outstanding Semester Fee Due Reminder - EduCore');
  const [messageBody, setMessageBody] = useState(
    'Dear Student,\n\nOur accounts records show an overdue fee balance on your student account for the current semester. Please clear the pending dues immediately through the EduCore online fee portal to avoid examination hall ticket withholding.\n\nAccounts Office\nEduCore Institute of Higher Learning'
  );
  const [isSending, setIsSending] = useState(false);
  const [sentResult, setSentResult] = useState<string | null>(null);

  const handleSendBroadcast = async () => {
    setIsSending(true);
    try {
      const res = await api.sendEmailReminders();
      if (res.success) {
        setSentResult(res.message);
        setTimeout(() => onClose(), 2500);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#dce1ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191c1d]">Broadcast Fee Reminders</h3>
              <p className="text-[11px] text-[#757682]">Targeting 4 Defaulters with overdue balances</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#757682] hover:text-[#191c1d]">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {sentResult && (
          <div className="p-3 bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61] rounded-lg text-xs font-semibold">
            {sentResult}
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#191c1d] mb-1">Email Subject Header</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-[#191c1d] mb-1">Message Template Body</label>
            <textarea
              rows={6}
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-mono"
            />
          </div>

          <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#edeeef] text-[11px] text-[#444651]">
            <span>Recipients: Aarav Sharma, Priya Patel, Rohan Gupta, Neha Singh</span>
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
              type="button"
              disabled={isSending}
              onClick={handleSendBroadcast}
              className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{isSending ? 'Dispatching Mails...' : 'Send Email Blast'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
