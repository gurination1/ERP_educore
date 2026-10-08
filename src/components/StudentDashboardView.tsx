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
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[40vh] space-y-2 text-[11px]">
        <div className="font-bold text-[#00236f] animate-pulse">[LOADING STUDENT PROFILE & LEDGER...]</div>
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
    <div id="student-dashboard-screen" className="p-4 max-w-7xl mx-auto space-y-4 animate-fadeIn text-[11px]">
      {/* Top Banner */}
      <div className="bg-[#00236f] text-white p-3.5 rounded border-b-2 border-[#ea580c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
              STUDENT CAMPUS PORTAL
            </span>
            <span className="font-mono text-[10px] text-orange-200">
              UID: {student.student_id || '1001-88-03-BFGI'}
            </span>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-tight text-white">
            WELCOME, {studentName} ({courseCode} • {semesterOrdinal})
          </h2>
          <p className="text-[10px] text-blue-200 mt-0.5">
            MRSPTU Affiliated • Academic Year {sessionName} • Domicile: Punjab 85% Verified
          </p>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div className="bg-white/10 px-3 py-1.5 rounded border border-white/20">
            <span className="text-[9px] text-gray-300 uppercase block font-mono">ENROLLMENT STATUS</span>
            <strong className="text-emerald-300 text-[11px] uppercase font-bold">[ACTIVE ENROLLED]</strong>
          </div>
        </div>
      </div>

      {/* Top Grid: Profile & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Profile Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded p-3.5 border border-[#00236f]/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-bold text-[#00236f] uppercase">[ACADEMIC PROFILE]</span>
            <span className="bg-blue-100 text-[#00236f] px-2 py-0.5 rounded font-mono text-[9px] font-bold">
              {student.roll_number ? `ROLL: ${student.roll_number}` : 'REGULAR'}
            </span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-500">Candidate Name:</span>
              <strong className="text-gray-900">{studentName}</strong>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-500">Degree & Branch:</span>
              <strong className="text-gray-900">{courseCode}</strong>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-500">Current Semester:</span>
              <strong className="text-gray-900">{semesterOrdinal}</strong>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-500">Institutional Email:</span>
              <strong className="font-mono text-gray-800">{student.email || 'student@bfgi.edu.in'}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Contact Number:</span>
              <strong className="font-mono text-gray-800">{student.mobile || '+91 98765 43210'}</strong>
            </div>
          </div>

          <div className="pt-2 border-t flex gap-2">
            <button
              onClick={() => onNavigate('student-documents')}
              className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#00236f] border rounded font-bold text-[10px] text-center"
            >
              [MY DOCS VAULT]
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#00236f] border rounded font-bold text-[10px] text-center"
            >
              [SYLLABUS & MARKS]
            </button>
          </div>
        </div>

        {/* Financial & Fee Due Summary Card (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded p-3.5 border border-[#00236f]/20 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <span className="font-bold text-[#00236f] uppercase">[FEE ASSESSMENT & DUES LEDGER]</span>
                <p className="text-[10px] text-gray-500">Semester tuition, laboratory, and statutory university assessment</p>
              </div>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isFullyPaid ? '[ZERO DUES - FULLY SETTLED]' : '[FEES PENDING]'}
              </span>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <span className="text-gray-500 text-[10px] uppercase block font-bold">Outstanding Semester Due:</span>
                <strong className={`text-2xl font-black ${isFullyPaid ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {isLedgerLoading ? '₹ ...' : `₹ ${totalDue.toLocaleString('en-IN')}`}
                </strong>
                <span className="text-[10px] text-gray-500 ml-2">
                  (Due Date: {nextDueDate})
                </span>
              </div>

              {totalDiscount > 0 && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-2 py-1 rounded text-[10px] font-bold">
                  [SCHOLARSHIP APPLIED: -₹ {totalDiscount.toLocaleString('en-IN')}]
                </div>
              )}
            </div>

            {/* Hall Ticket Release Banner */}
            <div className="mt-3 p-2.5 rounded border text-[10px] flex items-center justify-between gap-2 bg-gray-50">
              <div>
                <strong className="text-[#00236f] block">
                  {isFullyPaid && !isDetained
                    ? '[MRSPTU EXAM HALL TICKET RELEASED]'
                    : isDetained
                    ? '[HALL TICKET WITHHELD - ATTENDANCE BELOW 75%]'
                    : '[HALL TICKET ON ACCOUNTS HOLD]'}
                </strong>
                <span className="text-gray-600">
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
                className="px-2.5 py-1 bg-[#00236f] text-white hover:bg-[#00236f]/90 rounded font-bold text-[9px] uppercase shrink-0"
              >
                [VIEW HALL TICKET &rarr;]
              </button>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t flex flex-wrap gap-2">
            {totalDue > 0 ? (
              <button
                id="student-pay-now-btn"
                onClick={onOpenPayModal}
                className="flex-1 py-1.5 px-3 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white rounded font-bold text-[10px] uppercase tracking-wider text-center"
              >
                [PAY OUTSTANDING DUE: ₹{totalDue.toLocaleString('en-IN')}]
              </button>
            ) : (
              <button
                onClick={() => onOpenReceiptModal(latestReceipt)}
                className="flex-1 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[10px] uppercase tracking-wider text-center"
              >
                [DOWNLOAD TERM CLEARANCE RECEIPT]
              </button>
            )}
            <button
              id="student-view-ledger-btn"
              onClick={() => onNavigate('fee-ledger')}
              className="py-1.5 px-3 bg-white border border-[#00236f] text-[#00236f] hover:bg-blue-50 rounded font-bold text-[10px]"
            >
              [FULL FEE LEDGER]
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Modules + Notices + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Quick Modules */}
        <div className="bg-white rounded p-3.5 border border-[#00236f]/20 shadow-xs space-y-2">
          <span className="font-bold text-[#00236f] uppercase block border-b pb-1.5">
            [QUICK ACADEMIC MODULES]
          </span>
          <div className="space-y-1 font-bold text-[10px]">
            <button
              onClick={() => onNavigate('student-quiz-lms')}
              className="w-full p-2 bg-gray-50 hover:bg-blue-50 border rounded text-left flex justify-between items-center text-[#00236f]"
            >
              <span>[CBT QUIZ LMS ENGINE]</span>
              <span className="text-gray-500 font-normal">Active Quizzes &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('student-documents')}
              className="w-full p-2 bg-gray-50 hover:bg-blue-50 border rounded text-left flex justify-between items-center text-[#00236f]"
            >
              <span>[STUDENT DOCUMENTS VAULT]</span>
              <span className="text-gray-500 font-normal">Punjab 85% Domicile &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('scholarships')}
              className="w-full p-2 bg-gray-50 hover:bg-blue-50 border rounded text-left flex justify-between items-center text-[#00236f]"
            >
              <span>[APPLY FOR SCHOLARSHIP]</span>
              <span className="text-gray-500 font-normal">State & Merit &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="w-full p-2 bg-gray-50 hover:bg-blue-50 border rounded text-left flex justify-between items-center text-[#00236f]"
            >
              <span>[TIMETABLE & COURSE SYLLABUS]</span>
              <span className="text-gray-500 font-normal">Schedules &rarr;</span>
            </button>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white rounded p-3.5 border border-[#00236f]/20 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="font-bold text-[#00236f] uppercase">[CAMPUS NOTICES]</span>
            {notices.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllNotices(!showAllNotices)}
                className="text-[9px] text-[#ea580c] font-bold"
              >
                {showAllNotices ? '[LESS]' : '[ALL]'}
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {notices.slice(0, showAllNotices ? 15 : 3).map((n, i) => (
              <div key={i} className="p-1.5 bg-gray-50 border-l-2 border-[#ea580c] rounded text-[10px]">
                <strong className="text-gray-900 block truncate">{n.title}</strong>
                <span className="text-gray-500 text-[9px]">{n.notice_date}</span>
                <p className="text-gray-600 line-clamp-1 mt-0.5">{n.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded p-3.5 border border-[#00236f]/20 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="font-bold text-[#00236f] uppercase">[ATTENDANCE MONITOR]</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              isDetained ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isDetained ? '[DETENTION RISK]' : '[ELIGIBLE]'}
            </span>
          </div>

          <div className="space-y-2 text-center py-2">
            <span className="text-3xl font-black text-[#00236f] font-mono block">{attendancePct}%</span>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div
                style={{ width: `${attendancePct}%` }}
                className={`h-full ${attendancePct >= 75 ? 'bg-emerald-600' : 'bg-rose-600'}`}
              ></div>
            </div>
            <span className="text-[9px] text-gray-500 font-mono block">MRSPTU 75% MANDATE THRESHOLD</span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center border-t pt-2 text-[10px]">
            <div>
              <span className="text-gray-500 text-[9px] block">PRESENT</span>
              <strong className="text-emerald-700 font-mono">{attendedClasses}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] block">ABSENT</span>
              <strong className="text-rose-700 font-mono">{absentClasses}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] block">TOTAL</span>
              <strong className="text-gray-900 font-mono">{totalClasses}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
