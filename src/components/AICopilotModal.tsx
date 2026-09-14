import React, { useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copilotResponse, setCopilotResponse] = useState<any | null>(null);

  const isStudent = currentUser?.role === 'student';

  const studentPresets = [
    'What is my current fee balance and next payment due date?',
    'How is my attendance tracking across my enrolled courses?',
    'What scholarships am I eligible to apply for?',
    'How do I access and download my official fee receipts?',
  ];

  const adminPresets = [
    'How much fee is currently overdue across the college?',
    'Summarize our active degree courses and tuition rates',
    'Which students require immediate fee payment follow-ups?',
    'What is the total fee collection vs pending dues breakdown?',
  ];

  const presets = isStudent ? studentPresets : adminPresets;

  if (!isOpen) return null;

  const handleAsk = async (userPrompt?: string) => {
    const q = userPrompt || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.askCopilotAI(q);
      if (res.success && res.result) {
        setCopilotResponse(res.result);
      } else {
        setError(res.error || 'AI Assistant was unable to process the query.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between text-white ${
          isStudent
            ? 'bg-linear-to-r from-[#006a61] via-[#004d40] to-[#006a61]'
            : 'bg-linear-to-r from-[#00236f] via-[#1a4bb0] to-[#00236f]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-amber-300">
                {isStudent ? 'school' : 'smart_toy'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isStudent ? 'EduCore AI Student Advisor' : 'EduCore AI Campus Copilot'}
              </h2>
              <p className="text-xs text-blue-100">
                {isStudent
                  ? `Personal Academic, Fee & Scholarship Guidance for ${currentUser?.full_name || 'Student'}`
                  : 'Natural Language Administrative & Financial Intelligence'}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block mb-2">
              {isStudent ? 'Quick Student Assistance:' : 'Suggested Campus Inquiries:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setQuery(p);
                    handleAsk(p);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors text-left font-medium ${
                    isStudent
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/60'
                      : 'bg-[#f3f4f5] hover:bg-[#e1e3e4] text-[#191c1d]'
                  }`}
                >
                  {isStudent ? '🎓' : '⚡'} {p}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder={
                isStudent
                  ? 'Ask about your courses, fees, attendance, or scholarships...'
                  : 'Ask anything about admissions, students, fees, or defaulters...'
              }
              className="w-full pl-4 pr-24 py-3 border border-[#c5c5d3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 transition-all"
            />
            <button
              type="button"
              disabled={loading || !query.trim()}
              onClick={() => handleAsk()}
              className={`absolute right-2 top-2 px-3 py-1.5 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer ${
                isStudent
                  ? 'bg-[#006a61] hover:bg-[#004d40]'
                  : 'bg-[#00236f] hover:bg-[#1a4bb0]'
              }`}
            >
              {loading ? (
                <span className="inline-block animate-spin">⟳</span>
              ) : (
                <>
                  Ask AI
                  <span className="material-symbols-outlined text-[14px]">send</span>
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Copilot Result */}
          {copilotResponse && (
            <div className="space-y-4 pt-2">
              {/* Highlight Metric if any */}
              {copilotResponse.relevantMetric && (
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  isStudent
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border border-amber-200 text-amber-900'
                }`}>
                  {isStudent ? '📌' : '📊'} {copilotResponse.relevantMetric}
                </div>
              )}

              {/* Main Answer */}
              <div className="p-4 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-xs text-[#191c1d] leading-relaxed whitespace-pre-wrap">
                {copilotResponse.answer}
              </div>

              {/* Insights */}
              {copilotResponse.insights && copilotResponse.insights.length > 0 && (
                <div className={`p-3.5 rounded-xl border ${
                  isStudent
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50/60 border-blue-100 text-blue-900'
                }`}>
                  <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      {isStudent ? 'verified' : 'lightbulb'}
                    </span>
                    {isStudent ? 'Key Academic Insights' : 'Strategic Insights'}
                  </h4>
                  <ul className={`list-disc list-inside space-y-1 text-xs ${
                    isStudent ? 'text-emerald-800' : 'text-blue-800'
                  }`}>
                    {copilotResponse.insights.map((ins: string, i: number) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {copilotResponse.recommendedActions && copilotResponse.recommendedActions.length > 0 && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                  <h4 className="text-xs font-bold text-amber-950 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    Recommended Next Actions
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                    {copilotResponse.recommendedActions.map((act: string, i: number) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between text-[11px] text-[#757682]">
          <span>
            {isStudent
              ? `Logged in as ${currentUser?.full_name || 'Student'} • Personal Data Protected`
              : 'Context: Live college database synced with SQLite'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#444651] hover:bg-[#e1e3e4] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
