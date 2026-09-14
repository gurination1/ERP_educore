import React, { useState } from 'react';
import { api } from '../api/client';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copilotResponse, setCopilotResponse] = useState<any | null>(null);

  const presets = [
    'How much fee is currently overdue across the college?',
    'Summarize our active degree courses and tuition rates',
    'Which students require immediate fee payment follow-ups?',
    'What is the total fee collection vs pending dues breakdown?',
  ];

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
        setError(res.error || 'Copilot was unable to answer.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI Copilot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-linear-to-r from-[#00236f] via-[#1a4bb0] to-[#00236f] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-amber-300">smart_toy</span>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">EduCore AI Campus Copilot</h2>
              <p className="text-xs text-blue-100">Natural Language Administrative & Financial Intelligence</p>
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
              Suggested Campus Inquiries:
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
                  className="px-2.5 py-1 bg-[#f3f4f5] hover:bg-[#e1e3e4] text-[#191c1d] rounded-lg text-xs transition-colors text-left"
                >
                  ⚡ {p}
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
              placeholder="Ask anything about admissions, students, fees, or defaulters..."
              className="w-full pl-4 pr-24 py-3 border border-[#c5c5d3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 transition-all"
            />
            <button
              type="button"
              disabled={loading || !query.trim()}
              onClick={() => handleAsk()}
              className="absolute right-2 top-2 px-3 py-1.5 bg-[#00236f] text-white text-xs font-bold rounded-lg hover:bg-[#1a4bb0] disabled:opacity-50 transition-all flex items-center gap-1"
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
                <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-bold">
                  📊 {copilotResponse.relevantMetric}
                </div>
              )}

              {/* Main Answer */}
              <div className="p-4 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-xs text-[#191c1d] leading-relaxed whitespace-pre-wrap">
                {copilotResponse.answer}
              </div>

              {/* Insights */}
              {copilotResponse.insights && copilotResponse.insights.length > 0 && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                  <h4 className="text-xs font-bold text-blue-900 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                    Strategic Insights
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
                    {copilotResponse.insights.map((ins: string, i: number) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {copilotResponse.recommendedActions && copilotResponse.recommendedActions.length > 0 && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <h4 className="text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    Recommended Next Actions
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-emerald-800">
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
          <span>Context: Live college database synced with SQLite</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#444651] hover:bg-[#e1e3e4] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
