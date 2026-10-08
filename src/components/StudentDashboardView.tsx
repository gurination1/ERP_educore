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
    <div id="student-dashboard-screen" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn text-xs">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00236f] via-[#001f60] to-[#00133b] p-6 text-white shadow-xl border border-white/15">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#ea580c]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ea580c] text-white shadow-xs">
                Student Campus Portal
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 backdrop-blur-md border border-white/15 text-orange-200">
                UID: {student.student_id || '1001-88-03-BFGI'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {studentName}
            </h2>
            <p className="text-xs text-blue-100/90 mt-1 font-medium">
              {courseCode} • {semesterOrdinal} • MRSPTU Affiliated • Session {sessionName} • Punjab 85% Domicile Verified
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 text-right">
              <span className="text-[9px] tracking-wider text-slate-300 uppercase block font-semibold">Status</span>
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Active Enrolled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Grid: Profile & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Profile Card (4 cols) */}
        <div className="lg:col-span-4 apple-glass-card rounded-2xl p-5 border border-black/[0.06] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
            <span className="font-semibold text-[#00236f] tracking-tight">Academic Profile</span>
            <span className="bg-[#00236f]/10 text-[#00236f] px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold">
              {student.roll_number ? `Roll: ${student.roll_number}` : 'Regular'}
            </span>
          </div>

          <div className="space-y-2.5 text-[11px]">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-medium">Candidate Name:</span>
              <strong className="text-slate-900 font-semibold">{studentName}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-medium">Degree & Branch:</span>
              <strong className="text-slate-900 font-semibold">{courseCode}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-medium">Current Semester:</span>
              <strong className="text-slate-900 font-semibold">{semesterOrdinal}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-medium">Institutional Email:</span>
              <strong className="font-mono text-slate-800 text-[10px]">{student.email || 'student@bfgi.edu.in'}</strong>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-500 font-medium">Contact Number:</span>
              <strong className="font-mono text-slate-800 text-[10px]">{student.mobile || '+91 98765 43210'}</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-black/[0.06] flex gap-2">
            <button
              onClick={() => onNavigate('student-documents')}
              className="flex-1 py-2 bg-slate-100/80 hover:bg-slate-200/80 text-[#00236f] rounded-xl font-semibold text-[11px] text-center transition-all cursor-pointer"
            >
              Docs Vault
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="flex-1 py-2 bg-slate-100/80 hover:bg-slate-200/80 text-[#00236f] rounded-xl font-semibold text-[11px] text-center transition-all cursor-pointer"
            >
              Syllabus & Marks
            </button>
          </div>
        </div>

        {/* Financial & Fee Due Summary Card (8 cols) */}
        <div className="lg:col-span-8 apple-glass-card rounded-2xl p-5 border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <span className="font-semibold text-[#00236f] tracking-tight">Fee Assessment & Dues Ledger</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Semester tuition, laboratory, and statutory university assessment</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                isFullyPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isFullyPaid ? 'Zero Dues • Fully Settled' : 'Payment Pending'}
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-semibold tracking-wider">Outstanding Semester Due:</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className={`text-3xl font-extrabold tracking-tight ${isFullyPaid ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {isLedgerLoading ? '₹ ...' : `₹ ${totalDue.toLocaleString('en-IN')}`}
                  </strong>
                  <span className="text-xs text-slate-500 font-medium">
                    (Due Date: {nextDueDate})
                  </span>
                </div>
              </div>

              {totalDiscount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
                  Scholarship Applied: -₹ {totalDiscount.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Hall Ticket Release Banner */}
            <div className="mt-4 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-[#00236f] font-semibold block">
                  {isFullyPaid && !isDetained
                    ? 'MRSPTU Exam Hall Ticket Released'
                    : isDetained
                    ? 'Hall Ticket Withheld • Attendance Below 75%'
                    : 'Hall Ticket On Accounts Hold'}
                </strong>
                <span className="text-slate-600 text-[11px] mt-0.5 block">
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
                className="px-3.5 py-1.5 bg-[#00236f] hover:bg-[#00236f]/90 text-white rounded-xl font-semibold text-[11px] shrink-0 transition-all cursor-pointer shadow-xs"
              >
                View Hall Ticket &rarr;
              </button>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-black/[0.06] flex flex-wrap gap-3">
            {totalDue > 0 ? (
              <button
                id="student-pay-now-btn"
                onClick={onOpenPayModal}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#ea580c] to-[#c2410c] hover:opacity-95 text-white rounded-xl font-semibold text-xs tracking-wide text-center transition-all cursor-pointer shadow-sm"
              >
                Pay Outstanding Due: ₹{totalDue.toLocaleString('en-IN')}
              </button>
            ) : (
              <button
                onClick={() => onOpenReceiptModal(latestReceipt)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs tracking-wide text-center transition-all cursor-pointer shadow-sm"
              >
                Download Term Clearance Receipt
              </button>
            )}
            <button
              id="student-view-ledger-btn"
              onClick={() => onNavigate('fee-ledger')}
              className="py-2.5 px-4 bg-white border border-slate-200 text-[#00236f] hover:bg-slate-50 rounded-xl font-semibold text-xs transition-all cursor-pointer"
            >
              Full Fee Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Modules + Notices + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quick Modules */}
        <div className="apple-glass-card rounded-2xl p-5 border border-black/[0.06] shadow-sm space-y-3">
          <span className="font-semibold text-[#00236f] tracking-tight block border-b border-black/[0.06] pb-2">
            Quick Academic Modules
          </span>
          <div className="space-y-1.5 font-medium text-xs">
            <button
              onClick={() => onNavigate('student-quiz-lms')}
              className="w-full p-2.5 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-xl text-left flex justify-between items-center text-[#00236f] transition-all cursor-pointer"
            >
              <span className="font-semibold">CBT Quiz LMS Engine</span>
              <span className="text-slate-400 font-normal text-[11px]">Active &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('student-documents')}
              className="w-full p-2.5 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-xl text-left flex justify-between items-center text-[#00236f] transition-all cursor-pointer"
            >
              <span className="font-semibold">Student Documents Vault</span>
              <span className="text-slate-400 font-normal text-[11px]">85% Domicile &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('scholarships')}
              className="w-full p-2.5 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-xl text-left flex justify-between items-center text-[#00236f] transition-all cursor-pointer"
            >
              <span className="font-semibold">Apply For Scholarship</span>
              <span className="text-slate-400 font-normal text-[11px]">Merit & Post-Matric &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="w-full p-2.5 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-xl text-left flex justify-between items-center text-[#00236f] transition-all cursor-pointer"
            >
              <span className="font-semibold">Timetable & Syllabus</span>
              <span className="text-slate-400 font-normal text-[11px]">CBCS Scheme &rarr;</span>
            </button>
          </div>
        </div>

        {/* Notices */}
        <div className="apple-glass-card rounded-2xl p-5 border border-black/[0.06] shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-black/[0.06] pb-2">
            <span className="font-semibold text-[#00236f] tracking-tight">Campus Notices</span>
            {notices.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllNotices(!showAllNotices)}
                className="text-[11px] text-[#ea580c] font-semibold hover:underline cursor-pointer"
              >
                {showAllNotices ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {notices.slice(0, showAllNotices ? 15 : 3).map((n, i) => (
              <div key={i} className="p-2.5 bg-slate-50/80 border-l-3 border-[#ea580c] rounded-xl text-xs space-y-0.5">
                <strong className="text-slate-900 block truncate font-semibold">{n.title}</strong>
                <span className="text-slate-400 text-[10px] block">{n.notice_date}</span>
                <p className="text-slate-600 line-clamp-1 text-[11px]">{n.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="apple-glass-card rounded-2xl p-5 border border-black/[0.06] shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-black/[0.06] pb-2">
            <span className="font-semibold text-[#00236f] tracking-tight">Attendance Monitor</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
              isDetained ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isDetained ? 'Detention Risk' : 'Eligible'}
            </span>
          </div>

          <div className="space-y-2 text-center py-2">
            <span className="text-3xl font-extrabold text-[#00236f] tracking-tight block">{attendancePct}%</span>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${attendancePct}%` }}
                className={`h-full rounded-full transition-all duration-500 ${attendancePct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">MRSPTU 75% Mandate Threshold</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center border-t border-black/[0.06] pt-3 text-xs">
            <div className="bg-slate-50/80 py-1.5 rounded-xl">
              <span className="text-slate-400 text-[10px] block font-medium">Present</span>
              <strong className="text-emerald-700 font-semibold">{attendedClasses}</strong>
            </div>
            <div className="bg-slate-50/80 py-1.5 rounded-xl">
              <span className="text-slate-400 text-[10px] block font-medium">Absent</span>
              <strong className="text-rose-700 font-semibold">{absentClasses}</strong>
            </div>
            <div className="bg-slate-50/80 py-1.5 rounded-xl">
              <span className="text-slate-400 text-[10px] block font-medium">Total</span>
              <strong className="text-slate-900 font-semibold">{totalClasses}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
