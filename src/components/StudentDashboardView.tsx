import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StudentProfile, ActiveScreen, NoticeItem } from '../types';

interface StudentDashboardViewProps {
  student: StudentProfile | null;
  notices: NoticeItem[];
  onNavigate: (screen: ActiveScreen) => void;
  onOpenPayModal: () => void;
  onOpenReceiptModal: (receiptNo?: string) => void;
  onOpenAdmitCardModal?: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  notices,
  onNavigate,
  onOpenPayModal,
  onOpenReceiptModal,
  onOpenAdmitCardModal,
}) => {
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(true);
  const [showAllNotices, setShowAllNotices] = useState(false);

  useEffect(() => {
    if (student?.id || student?.student_id) {
      setIsLedgerLoading(true);
      api.getFeeLedger(student.id || student.student_id)
        .then(res => {
          if (res.success) {
            setLedgerData(res);
          }
        })
        .finally(() => {
          setIsLedgerLoading(false);
        });
    }
  }, [student]);

  if (!student) {
    return (
      <div className="p-12 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[40vh] space-y-3 text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-[#00236f] border-t-transparent animate-spin" />
        <div className="font-semibold text-[#00236f] tracking-tight">Loading Student Profile & Ledger...</div>
      </div>
    );
  }

  const studentName = `${student.first_name} ${student.last_name}`;
  const courseCode = student.course?.code || 'B.Tech CSE';
  const semesterOrdinal = `${student.current_semester || 1}th Sem`;
  const sessionName = student.session?.name || '2025-26';

  const attendancePct = student.attendance_percentage ?? 88;
  const attendedClasses = student.attended_classes ?? 142;
  const totalClasses = student.total_classes ?? 160;
  const absentClasses = Math.max(0, totalClasses - attendedClasses);

  const isDetained = attendancePct < 65;
  const isCondonationNeeded = attendancePct >= 65 && attendancePct < 75;

  const totalDue = ledgerData?.summary ? Math.round(ledgerData.summary.totalDue * 100) / 100 : (student.fees_status === 'paid' ? 0 : 0);
  const totalDiscount = ledgerData ? (ledgerData.ledger || []).reduce((acc: number, f: any) => acc + (f.discount_amount || 0), 0) : 0;
  const isFullyPaid = ledgerData?.summary ? (totalDue <= 0.01) : (student.fees_status === 'paid');
  const unpaidItems = ledgerData?.ledger?.filter((f: any) => f.due_amount > 0 && f.status !== 'cancelled') || [];
  const nextDueDate = unpaidItems.sort((a: any, b: any) => a.due_date?.localeCompare(b.due_date))[0]?.due_date || (isFullyPaid ? 'All term dues cleared' : 'Assessment pending');
  const latestReceipt = ledgerData?.payments?.[0]?.receipt_no || 'REC-2026-001';

  return (
    <div id="student-dashboard-screen" className="space-y-3 animate-fadeIn text-xs">
      {/* Sleek Student Identity Toolbar (Saves 140px vertical space) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <h2 className="font-extrabold text-sm text-[#00236f] tracking-tight">
            {studentName}
          </h2>
          <span className="text-[10px] text-slate-300 font-semibold">•</span>
          <span className="text-[11px] font-semibold text-slate-700">
            {courseCode} ({semesterOrdinal})
          </span>
          <span className="bg-orange-50 text-[#ea580c] border border-orange-200 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
            UID: {(student.enterprise_uid || '1001-88-03-01').replace(/BFGI/g, '01')}
          </span>
          <span className="text-[10px] text-slate-500 hidden md:inline-flex">
            MRSPTU • Session {sessionName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Active Enrolled
          </span>
          <span className="bg-blue-50 text-[#00236f] border border-blue-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full hidden sm:inline-flex">
            Punjab 85% Domicile Verified
          </span>
        </div>
      </div>

      {/* Top Grid: Profile & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Profile Card (4 cols) */}
        <div className="lg:col-span-4 bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-[#00236f] tracking-tight text-xs">Academic Profile</span>
            <span className="bg-[#00236f]/10 text-[#00236f] px-2 py-0.2 rounded-full font-mono text-[9px] font-semibold">
              {student.roll_number ? `Roll: ${student.roll_number}` : 'Regular'}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between border-b border-slate-50 pb-1">
              <span className="text-slate-500">Candidate Name:</span>
              <strong className="text-slate-900 font-semibold">{studentName}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1">
              <span className="text-slate-500">Degree & Branch:</span>
              <strong className="text-slate-900 font-semibold">{courseCode}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1">
              <span className="text-slate-500">Current Semester:</span>
              <strong className="text-slate-900 font-semibold">{semesterOrdinal}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1">
              <span className="text-slate-500">Institutional Email:</span>
              <strong className="font-mono text-slate-800 text-[10px]">{student.email || 'student@bfgi.edu.in'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Number:</span>
              <strong className="font-mono text-slate-800 text-[10px]">{student.mobile || '+91 98765 43210'}</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => onNavigate('student-documents')}
              className="flex-1 py-1.5 bg-slate-100/90 hover:bg-slate-200 text-[#00236f] rounded-lg font-semibold text-[11px] text-center transition cursor-pointer"
            >
              Docs Vault
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="flex-1 py-1.5 bg-slate-100/90 hover:bg-slate-200 text-[#00236f] rounded-lg font-semibold text-[11px] text-center transition cursor-pointer"
            >
              Syllabus & Marks
            </button>
          </div>
        </div>

        {/* Financial & Fee Due Summary Card (8 cols) */}
        <div className="lg:col-span-8 bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-bold text-[#00236f] tracking-tight text-xs">Fee Assessment & Dues Ledger</span>
                <p className="text-[10px] text-slate-500">Semester tuition, laboratory, and statutory university assessment</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                isFullyPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isFullyPaid ? 'Zero Dues • Fully Settled' : 'Payment Pending'}
              </span>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-semibold tracking-wider">Outstanding Semester Due:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <strong className={`text-2xl font-extrabold tracking-tight ${isFullyPaid ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {isLedgerLoading ? '₹ ...' : `₹ ${totalDue.toLocaleString('en-IN')}`}
                  </strong>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Due Date: {nextDueDate})
                  </span>
                </div>
              </div>

              {totalDiscount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                  Scholarship Applied: -₹ {totalDiscount.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Hall Ticket Release Banner */}
            <div className="mt-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong className="text-[#00236f] font-semibold block text-[11px]">
                  {isFullyPaid && !isDetained
                    ? 'MRSPTU Exam Hall Ticket Released'
                    : isDetained
                    ? 'Hall Ticket Withheld • Attendance Below 75%'
                    : 'Hall Ticket On Accounts Hold'}
                </strong>
                <span className="text-slate-600 text-[10px] block">
                  {isFullyPaid && !isDetained
                    ? 'No-dues clearance and minimum attendance verified for semester finals.'
                    : isDetained
                    ? `Attendance ${attendancePct}% is below 75% threshold. Contact HOD.`
                    : `Clear outstanding balance of ₹${totalDue.toLocaleString('en-IN')} to unlock hall ticket.`}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAdmitCardModal}
                className="px-2.5 py-1 bg-[#00236f] hover:bg-[#00236f]/90 text-white rounded-lg font-semibold text-[10px] shrink-0 transition cursor-pointer shadow-2xs"
              >
                View Hall Ticket &rarr;
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
            {totalDue > 0 ? (
              <button
                id="student-pay-now-btn"
                onClick={onOpenPayModal}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-[#ea580c] to-[#c2410c] hover:opacity-95 text-white rounded-lg font-bold text-xs tracking-wide text-center transition cursor-pointer shadow-2xs"
              >
                Pay Outstanding Due: ₹{totalDue.toLocaleString('en-IN')}
              </button>
            ) : (
              <button
                onClick={() => onOpenReceiptModal(latestReceipt)}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs tracking-wide text-center transition cursor-pointer shadow-2xs"
              >
                Download Term Clearance Receipt
              </button>
            )}
            <button
              id="student-view-ledger-btn"
              onClick={() => onNavigate('fee-ledger')}
              className="py-2 px-3 bg-white border border-slate-200 text-[#00236f] hover:bg-slate-50 rounded-lg font-semibold text-xs transition cursor-pointer"
            >
              Full Fee Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Modules + Notices + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Quick Modules */}
        <div className="bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
          <span className="font-bold text-[#00236f] tracking-tight text-xs block border-b border-slate-100 pb-1.5">
            Quick Academic Modules
          </span>
          <div className="space-y-1 font-medium text-xs">
            <button
              onClick={() => onNavigate('student-quiz-lms')}
              className="w-full p-2 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-lg text-left flex justify-between items-center text-[#00236f] transition cursor-pointer"
            >
              <span className="font-semibold text-[11px]">CBT Quiz LMS Engine</span>
              <span className="text-slate-400 font-normal text-[10px]">Active &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('student-documents')}
              className="w-full p-2 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-lg text-left flex justify-between items-center text-[#00236f] transition cursor-pointer"
            >
              <span className="font-semibold text-[11px]">Student Documents Vault</span>
              <span className="text-slate-400 font-normal text-[10px]">85% Domicile &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('scholarships')}
              className="w-full p-2 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-lg text-left flex justify-between items-center text-[#00236f] transition cursor-pointer"
            >
              <span className="font-semibold text-[11px]">Apply For Scholarship</span>
              <span className="text-slate-400 font-normal text-[10px]">Merit & Post-Matric &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="w-full p-2 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-lg text-left flex justify-between items-center text-[#00236f] transition cursor-pointer"
            >
              <span className="font-semibold text-[11px]">Timetable & Syllabus</span>
              <span className="text-slate-400 font-normal text-[10px]">CBCS Scheme &rarr;</span>
            </button>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
            <span className="font-bold text-[#00236f] tracking-tight text-xs">Campus Notices</span>
            {((notices && notices.length > 0) ? notices : [1, 2, 3]).length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllNotices(!showAllNotices)}
                className="text-[10px] text-[#ea580c] font-semibold hover:underline cursor-pointer"
              >
                {showAllNotices ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {((notices && notices.length > 0) ? notices : [
              {
                title: 'MRSPTU Final Semester Theory Examinations May-2026',
                notice_date: 'May 12, 2026',
                summary: 'Official datesheet released by COE. CBCS external evaluation verified.',
              },
              {
                title: 'Punjab Post-Matric & State Merit Scholarship Clearance',
                notice_date: 'May 08, 2026',
                summary: 'Disbursement authorization finalized for 85% domicile candidates.',
              },
              {
                title: 'Campus Placement Special Drive: Infosys & TCS Recruitment',
                notice_date: 'May 04, 2026',
                summary: 'Eligible final-year engineering scholars register via Placements desk.',
              },
            ]).slice(0, showAllNotices ? 15 : 3).map((n, i) => (
              <div key={i} className="p-2 bg-slate-50/80 border-l-2 border-[#ea580c] rounded-lg text-xs space-y-0.5">
                <strong className="text-slate-900 block truncate font-semibold text-[11px]">{n.title}</strong>
                <span className="text-slate-400 text-[9px] block">{n.notice_date}</span>
                <p className="text-slate-600 line-clamp-1 text-[10px]">{n.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
            <span className="font-bold text-[#00236f] tracking-tight text-xs">Attendance Monitor</span>
            <span className={`px-2 py-0.2 rounded-full text-[9px] font-semibold ${
              isDetained ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isDetained ? 'Detention Risk' : 'Eligible'}
            </span>
          </div>

          <div className="space-y-1.5 text-center py-1">
            <span className="text-2xl font-black text-[#00236f] tracking-tight block">{attendancePct}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${attendancePct}%` }}
                className={`h-full rounded-full transition-all duration-500 ${attendancePct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
            </div>
            <span className="text-[9px] text-slate-500 font-medium block">MRSPTU 75% Mandate Threshold</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center border-t border-slate-100 pt-2 text-xs">
            <div className="bg-slate-50/80 py-1 rounded-lg">
              <span className="text-slate-400 text-[9px] block font-medium">Present</span>
              <strong className="text-emerald-700 font-semibold">{attendedClasses}</strong>
            </div>
            <div className="bg-slate-50/80 py-1 rounded-lg">
              <span className="text-slate-400 text-[9px] block font-medium">Absent</span>
              <strong className="text-rose-700 font-semibold">{absentClasses}</strong>
            </div>
            <div className="bg-slate-50/80 py-1 rounded-lg">
              <span className="text-slate-400 text-[9px] block font-medium">Total</span>
              <strong className="text-slate-900 font-semibold">{totalClasses}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
