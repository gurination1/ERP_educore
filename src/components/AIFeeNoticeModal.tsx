import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface AIFeeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  dueAmount: number;
}

export const AIFeeNoticeModal: React.FC<AIFeeNoticeModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  dueAmount,
}) => {
  const [urgency, setUrgency] = useState<'gentle' | 'reminder' | 'urgent'>('reminder');
  const [loading, setLoading] = useState(false);
  const [noticeData, setNoticeData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'sms'>('email');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      loadNotice(urgency);
    } else {
      setNoticeData(null);
      setError(null);
    }
  }, [isOpen, studentId]);

  const loadNotice = async (selectedUrgency: 'gentle' | 'reminder' | 'urgent') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateFeeNoticeAI(studentId, selectedUrgency);
      if (res.success && res.notice) {
        setNoticeData(res.notice);
      } else {
        setError(res.error || 'Failed to generate fee notice.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI service.');
    } finally {
      setLoading(false);
    }
  };

  const handleUrgencyChange = (newUrgency: 'gentle' | 'reminder' | 'urgent') => {
    setUrgency(newUrgency);
    loadNotice(newUrgency);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-linear-to-r from-[#00236f] to-[#1a4bb0] text-white">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-amber-300">notifications_active</span>
            <div>
              <h2 className="text-base font-bold leading-tight">AI Fee Recovery Notice Generator</h2>
              <p className="text-xs text-blue-100">
                Drafting for: <span className="font-semibold text-white">{studentName}</span> (₹{dueAmount.toLocaleString('en-IN')})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Urgency Controls */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-b border-[#e1e3e4] flex items-center justify-between">
          <span className="text-xs font-bold text-[#444651] uppercase tracking-wider">Notice Urgency Tone:</span>
          <div className="flex items-center gap-1.5">
            {(['gentle', 'reminder', 'urgent'] as const).map(u => (
              <button
                key={u}
                type="button"
                onClick={() => handleUrgencyChange(u)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  urgency === u
                    ? u === 'urgent'
                      ? 'bg-[#ba1a1a] text-white'
                      : 'bg-[#00236f] text-white'
                    : 'bg-white text-[#444651] border border-[#c5c5d3] hover:bg-gray-50'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <span className="inline-block animate-spin text-3xl text-[#00236f]">⟳</span>
              <p className="text-xs font-semibold text-[#444651]">
                Gemini AI is crafting context-aware fee notice...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{error}</span>
            </div>
          ) : noticeData ? (
            <div className="space-y-4">
              {/* Tabs: Email, WhatsApp, SMS */}
              <div className="flex border-b border-[#e1e3e4] gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'email'
                      ? 'border-[#00236f] text-[#00236f]'
                      : 'border-transparent text-[#757682] hover:text-[#191c1d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Email Notice
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('whatsapp')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'whatsapp'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-[#757682] hover:text-[#191c1d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  WhatsApp Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sms')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'sms'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-[#757682] hover:text-[#191c1d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">sms</span>
                  SMS Alert
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'email' && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-[#f3f4f5] rounded-lg">
                    <span className="text-[10px] text-[#757682] uppercase font-bold block">Subject:</span>
                    <p className="text-xs font-semibold text-[#191c1d]">{noticeData.subject}</p>
                  </div>
                  <div className="p-3.5 bg-[#ffffff] border border-[#e1e3e4] rounded-xl font-mono text-xs whitespace-pre-wrap text-[#191c1d] leading-relaxed max-h-60 overflow-y-auto">
                    {noticeData.emailBody}
                  </div>
                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div className="p-4 bg-[#e7f8ef] border border-emerald-200 rounded-xl font-sans text-xs whitespace-pre-wrap text-emerald-950 leading-relaxed max-h-64 overflow-y-auto">
                  {noticeData.whatsappText}
                </div>
              )}

              {activeTab === 'sms' && (
                <div className="p-4 bg-[#f0f4ff] border border-blue-200 rounded-xl font-mono text-xs whitespace-pre-wrap text-blue-950 leading-relaxed">
                  {noticeData.smsText}
                  <div className="mt-2 text-[10px] text-blue-600 font-sans">
                    Length: {noticeData.smsText?.length || 0} characters (Standard 160 SMS GSM limit)
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between">
          <span className="text-[11px] text-[#757682]">
            AI-assisted recovery notice • Tone: {urgency}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#444651] hover:bg-[#e1e3e4] rounded-lg transition-colors"
            >
              Close
            </button>
            {noticeData && (
              <button
                type="button"
                onClick={() => {
                  const content =
                    activeTab === 'email'
                      ? `Subject: ${noticeData.subject}\n\n${noticeData.emailBody}`
                      : activeTab === 'whatsapp'
                      ? noticeData.whatsappText
                      : noticeData.smsText;
                  handleCopy(content);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#00236f] hover:bg-[#1a4bb0] rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copied to Clipboard!' : `Copy ${activeTab.toUpperCase()}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
