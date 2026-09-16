import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface MRSPTUAdmitCardModalProps {
  studentId?: string;
  onClose: () => void;
  onOpenPayModal?: () => void;
}

export const MRSPTUAdmitCardModal: React.FC<MRSPTUAdmitCardModalProps> = ({
  studentId = 'me',
  onClose,
  onOpenPayModal,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api.getAdmitCard(studentId)
      .then(res => {
        if (res.success) {
          setData(res);
        } else {
          setErrorMsg(res.error || 'Failed to retrieve Admit Card record.');
        }
      })
      .catch(err => {
        setErrorMsg(err.message || 'Network error fetching Admit Card.');
      })
      .finally(() => setIsLoading(false));
  }, [studentId]);

  const handlePrint = () => {
    window.print();
  };

  const card = data?.admitCard;
  const isEligible = data?.isEligible;
  const holdReasons = data?.holdReasons || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#e1e3e4] space-y-6 my-6 animate-scaleUp print:p-0 print:border-none print:shadow-none print:m-0">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#00236f] text-white flex items-center justify-center font-bold text-xs">
              MR
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#191c1d]">MRSPTU Examination Portal</h3>
              <p className="text-[11px] text-[#757682]">Roll Number Slip & Gate Clearance Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEligible && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Slip</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#757682] hover:text-[#191c1d] hover:bg-[#f3f4f5] rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#00236f] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#757682] font-semibold">Verifying MRSPTU No-Dues & Attendance Eligibility...</p>
          </div>
        ) : errorMsg ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">error</span>
            </div>
            <p className="text-sm font-bold text-[#ba1a1a]">{errorMsg}</p>
          </div>
        ) : !isEligible ? (
          /* WITHHELD GATE: Accounts Hold or Attendance Detention */
          <div className="py-6 space-y-6">
            <div className="p-5 rounded-2xl bg-[#ffdad6]/40 border-2 border-[#ba1a1a] space-y-3 text-center">
              <div className="w-12 h-12 bg-[#ba1a1a] text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[26px]">block</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#ba1a1a] tracking-tight">
                EXAMINATION ADMIT CARD WITHHELD
              </h3>
              <p className="text-xs text-[#444651] max-w-lg mx-auto">
                In accordance with Maharaja Ranjit Singh Punjab Technical University statutory ordinances, your examination roll number slip is withheld due to pending institutional clearances:
              </p>
            </div>

            <div className="space-y-2.5">
              {holdReasons.map((reason: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-[#ffdad6] bg-[#fff8f7] flex items-start gap-3 text-left"
                >
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[20px] shrink-0 mt-0.5">
                    warning
                  </span>
                  <div className="text-xs text-[#191c1d]">
                    <p className="font-semibold">{reason}</p>
                  </div>
                </div>
              ))}
            </div>

            {data?.totalOutstandingDue > 0 && onOpenPayModal && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayModal();
                  }}
                  className="px-6 py-3 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  <span>Pay ₹{data.totalOutstandingDue.toLocaleString('en-IN')} to Clear Accounts Hold</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* OFFICIAL MRSPTU PRINTABLE HALL TICKET */
          <div id="mrsptu-admit-card-slip" className="border-2 border-[#191c1d] p-6 rounded-xl space-y-5 bg-white text-[#191c1d]">
            {/* Header */}
            <div className="text-center space-y-1 border-b-2 border-[#191c1d] pb-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#00236f] bg-[#00236f] text-white flex items-center justify-center font-serif font-black text-base shadow-xs">
                  MR
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#00236f]">
                    {card.university}
                  </h2>
                  <p className="text-[10px] text-[#444651] font-semibold">{card.accreditation}</p>
                  <p className="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider mt-0.5">
                    Admit Card / Roll Number Slip • {card.examSession}
                  </p>
                </div>
              </div>
            </div>

            {/* Institution Banner */}
            <div className="bg-[#f8f9fa] border border-[#edeeef] p-2.5 rounded-lg text-center text-xs">
              <span className="font-bold text-[#00236f] block uppercase tracking-wide">
                {card.affiliatedInstitute} ({card.instituteCode})
              </span>
              <span className="text-[11px] text-[#757682]">{card.examCenter}</span>
            </div>

            {/* Student & Exam Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 border border-[#e1e3e4] rounded-lg p-4 bg-white text-xs">
              <div className="sm:col-span-9 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[#757682] uppercase font-bold block">University Roll No:</span>
                    <strong className="text-sm text-[#00236f] font-mono tracking-wider">{card.rollNo}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#757682] uppercase font-bold block">Registration No:</span>
                    <strong className="text-xs font-mono">{card.regNo}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[#757682] uppercase font-bold block">Candidate Name:</span>
                    <strong className="text-xs uppercase">{card.candidateName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#757682] uppercase font-bold block">Father's Name:</span>
                    <strong className="text-xs uppercase">{card.fatherName}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#757682] uppercase font-bold block">Programme & Branch:</span>
                  <strong className="text-xs">{card.courseName} • {card.semester}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-[#757682] uppercase font-bold block">Examination Center:</span>
                  <p className="text-[11px] text-[#444651] font-semibold">{card.examCenter}</p>
                </div>
              </div>

              {/* Candidate Photo & Barcode Block */}
              <div className="sm:col-span-3 flex flex-col items-center justify-between border-t sm:border-t-0 sm:border-l border-[#e1e3e4] sm:pl-4 pt-3 sm:pt-0">
                <div className="w-24 h-28 border-2 border-[#757682] rounded bg-[#f8f9fa] flex flex-col items-center justify-center text-center p-1">
                  <span className="material-symbols-outlined text-[36px] text-[#757682]">person</span>
                  <span className="text-[8px] uppercase font-bold text-[#757682]">Affix Photo</span>
                </div>
                <div className="w-full text-center mt-2">
                  <div className="font-mono text-[9px] font-bold tracking-widest text-[#444651] bg-[#f3f4f5] px-1 py-0.5 rounded border border-[#e1e3e4]">
                    ||||| | ||||| || |||
                  </div>
                  <span className="text-[8px] text-[#757682] block mt-0.5">{card.verificationBarcode}</span>
                </div>
              </div>
            </div>

            {/* Examination Paper Schedule */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#00236f]">
                Notified Subject Papers & Examination Schedule:
              </h4>
              <div className="border border-[#e1e3e4] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[10px] font-bold text-[#757682] uppercase">
                      <th className="py-2 px-3">Paper Code</th>
                      <th className="py-2 px-3">Subject Title</th>
                      <th className="py-2 px-3">Exam Date</th>
                      <th className="py-2 px-3">Session & Time</th>
                      <th className="py-2 px-3 text-center">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f5] text-[11px]">
                    {card.papers.map((paper: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#f8f9fa]">
                        <td className="py-2 px-3 font-mono font-bold text-[#00236f]">{paper.paperCode}</td>
                        <td className="py-2 px-3 font-medium text-[#191c1d]">{paper.subjectTitle}</td>
                        <td className="py-2 px-3 font-semibold text-[#444651]">{paper.examDate}</td>
                        <td className="py-2 px-3 text-[#757682]">{paper.timing}</td>
                        <td className="py-2 px-3 text-center border-l border-[#f3f4f5]">
                          <div className="w-16 h-6 border-b border-dashed border-[#757682] mx-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Instructions */}
            <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#edeeef] space-y-1 text-[10px] text-[#444651]">
              <span className="font-bold text-[#191c1d] uppercase block">Mandatory University Instructions:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {card.instructions.map((inst: string, i: number) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>

            {/* Signatures Footer */}
            <div className="pt-4 border-t border-[#e1e3e4] flex items-end justify-between text-xs">
              <div className="text-center">
                <div className="w-32 border-b border-dashed border-[#191c1d] pb-6 mb-1"></div>
                <span className="text-[10px] font-bold uppercase text-[#757682]">Candidate Signature</span>
              </div>
              <div className="text-center">
                <div className="w-36 border-b border-dashed border-[#191c1d] pb-6 mb-1 text-[10px] font-bold text-[#00236f]">
                  Dr. Gurpreet Singh
                </div>
                <span className="text-[10px] font-bold uppercase text-[#757682]">{card.authorizedSignatory}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
