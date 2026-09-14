import React, { useState } from 'react';
import { api } from '../api/client';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (extractedData: any) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const sampleApplicant = `ADMISSION INQUIRY & APPLICATION FORM
Candidate Name: Ananya Sharma
Email: ananya.sharma2025@gmail.com
Mobile: +91 9876543210
Date of Birth: 2005-08-14
Gender: Female
Guardian: Dr. Rajesh Sharma (Father)
Guardian Phone: +91 9876543299
Target Program: B.Tech in Computer Science and Engineering
Academic Background: Delhi Public School, R.K. Puram
12th Board Score: 94.8% (Physics: 96, Chemistry: 93, Maths: 97)
Category: Merit / General
Extracurriculars: National Science Olympiad Finalist, School Coding Club President`;

  const handleParse = async () => {
    if (!inputText.trim() || inputText.length < 10) {
      setError('Please enter or paste at least 10 characters of application text.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.parseAdmissionAI(inputText);
      if (res.success && res.data) {
        setExtractedResult(res.data);
      } else {
        setError(res.error || 'Failed to extract information using AI.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI service.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (extractedResult) {
      onApplyData(extractedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e1e3e4] flex items-center justify-between bg-linear-to-r from-[#00236f] to-[#1a4bb0] text-white">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-amber-300">auto_awesome</span>
            <div>
              <h2 className="text-base font-bold leading-tight">AI Admission Document Auto-Parser</h2>
              <p className="text-xs text-blue-100">Powered by Google Gemini • Zero manual typing</p>
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
          {!extractedResult ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#444651] mb-1.5">
                  Paste Raw Application / Email / Transcript / Resume Notes
                </label>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Paste student details, transcript marks, or incoming application email here..."
                  className="w-full p-3.5 border border-[#c5c5d3] rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#00236f]/30 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setInputText(sampleApplicant)}
                  className="text-xs font-semibold text-[#00236f] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">content_paste</span>
                  Load Sample Engineering Application
                </button>
                <span className="text-[11px] text-[#757682]">
                  {inputText.length} characters
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Extracted Preview */
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">verified</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Successfully Extracted by Gemini AI</p>
                    <p className="text-[11px] text-emerald-700">
                      Merit Score: <span className="font-bold">{extractedResult.meritScore || 90}%</span> • Quota: <span className="uppercase font-semibold">{extractedResult.recommendedQuota || 'Merit'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExtractedResult(null)}
                  className="text-xs text-emerald-800 hover:underline"
                >
                  Re-parse
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-[#f3f4f5] rounded-lg">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Student Name</span>
                  <span className="font-semibold text-[#191c1d]">{extractedResult.firstName} {extractedResult.lastName}</span>
                </div>
                <div className="p-2.5 bg-[#f3f4f5] rounded-lg">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-semibold text-[#191c1d] truncate block">{extractedResult.email}</span>
                </div>
                <div className="p-2.5 bg-[#f3f4f5] rounded-lg">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Contact Phone</span>
                  <span className="font-semibold text-[#191c1d]">{extractedResult.phone}</span>
                </div>
                <div className="p-2.5 bg-[#f3f4f5] rounded-lg">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Date of Birth & Gender</span>
                  <span className="font-semibold text-[#191c1d]">{extractedResult.dob} ({extractedResult.gender})</span>
                </div>
                <div className="p-2.5 bg-[#f3f4f5] rounded-lg">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Guardian</span>
                  <span className="font-semibold text-[#191c1d]">{extractedResult.guardianName} ({extractedResult.relationship})</span>
                </div>
                <div className="p-2.5 bg-[#f3f4f5] rounded-lg">
                  <span className="text-[#757682] block text-[10px] uppercase font-bold">Target Course</span>
                  <span className="font-semibold text-[#191c1d] truncate block">{extractedResult.courseName || extractedResult.courseId}</span>
                </div>
              </div>

              {extractedResult.aiSummary && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <span className="font-bold block mb-0.5">AI Admission Assessment:</span>
                  {extractedResult.aiSummary}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#444651] hover:bg-[#e1e3e4] rounded-lg transition-colors"
          >
            Cancel
          </button>
          {!extractedResult ? (
            <button
              type="button"
              disabled={loading || !inputText.trim()}
              onClick={handleParse}
              className="px-5 py-2 text-xs font-bold text-white bg-linear-to-r from-[#00236f] to-[#1a4bb0] hover:brightness-110 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Analyzing with Gemini...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Extract with Gemini AI
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmApply}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Auto-Fill Admission Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
