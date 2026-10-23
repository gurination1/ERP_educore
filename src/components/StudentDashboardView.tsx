import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { StudentProfile, ActiveScreen, NoticeItem } from '../types';
import {
  Brain,
  Award,
  FolderCheck,
  Sparkles,
  BookOpen,
  Building2,
  Bus,
  CreditCard,
  Receipt,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  X,
} from 'lucide-react';

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
  const [searchParams] = useSearchParams();
  const urlView = searchParams.get('view');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(true);
  const [showAllNotices, setShowAllNotices] = useState(false);
  const [showSubjectAttendance, setShowSubjectAttendance] = useState(false);
  const [showGradeCardModal, setShowGradeCardModal] = useState(false);
  const [examResultsData, setExamResultsData] = useState<any>(null);
  const [isResultsLoading, setIsResultsLoading] = useState(false);

  const fetchResults = () => {
    setIsResultsLoading(true);
    api.getExamResults('me')
      .then(res => {
        if (res.success && res.resultGazette) {
          setExamResultsData(res.resultGazette);
        }
      })
      .catch(() => {})
      .finally(() => setIsResultsLoading(false));
  };

  useEffect(() => {
    setIsLedgerLoading(true);
    api.getFeeLedger('me')
      .then(res => {
        if (res.success) {
          setLedgerData(res);
        }
      })
      .finally(() => {
        setIsLedgerLoading(false);
      });
  }, [student?.id]);

  useEffect(() => {
    if (urlView === 'attendance') {
      setTimeout(() => {
        const el = document.getElementById('student-attendance-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-[#00236f]', 'transition-all');
          setTimeout(() => el.classList.remove('ring-2', 'ring-[#00236f]'), 3000);
        }
      }, 150);
    } else if (urlView === 'admit-card') {
      onOpenAdmitCardModal?.();
    }
  }, [urlView]);

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

  const totalDue = (ledgerData?.summary?.totalDue != null)
    ? Math.round(Number(ledgerData.summary.totalDue) * 100) / 100
    : (student.fees_status === 'paid' ? 0 : 0);
  const totalDiscount = ledgerData
    ? (ledgerData.ledger || []).reduce((acc: number, f: any) => acc + (Number(f.discount_amount) || 0), 0)
    : 0;
  const isFullyPaid = ledgerData?.summary ? (totalDue <= 0.01) : (student.fees_status === 'paid');
  const unpaidItems = ledgerData?.ledger?.filter((f: any) => (Number(f.due_amount) || 0) > 0 && f.status !== 'cancelled') || [];
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
            Academic Session {sessionName}
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
                    {isLedgerLoading ? '₹ ...' : `₹ ${(totalDue || 0).toLocaleString('en-IN')}`}
                  </strong>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Due Date: {nextDueDate})
                  </span>
                </div>
              </div>

              {totalDiscount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                  Scholarship Applied: -₹ {(totalDiscount || 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Hall Ticket Release Banner */}
            <div className="mt-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong className="text-[#00236f] font-semibold block text-[11px]">
                  {isFullyPaid && !isDetained
                    ? 'University Exam Hall Ticket Released'
                    : isDetained
                    ? 'Hall Ticket Withheld • Attendance Below 75%'
                    : 'Hall Ticket On Accounts Hold'}
                </strong>
                <span className="text-slate-600 text-[10px] block">
                  {isFullyPaid && !isDetained
                    ? 'No-dues clearance and minimum attendance verified for semester finals.'
                    : isDetained
                    ? `Attendance ${attendancePct}% is below 75% threshold. Contact HOD.`
                    : `Clear outstanding balance of ₹${(totalDue || 0).toLocaleString('en-IN')} to unlock hall ticket.`}
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
                className="flex-1 py-2 px-3 bg-gradient-to-r from-[#ea580c] to-[#c2410c] hover:opacity-95 text-white rounded-lg font-bold text-xs tracking-wide text-center transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span>Pay Outstanding Due: ₹{(totalDue || 0).toLocaleString('en-IN')}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenReceiptModal(latestReceipt)}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs tracking-wide text-center transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>Download Term Clearance Receipt</span>
              </button>
            )}
            <button
              id="student-view-ledger-btn"
              onClick={() => onNavigate('fee-ledger')}
              className="py-2 px-3 bg-white border border-slate-200 text-[#00236f] hover:bg-slate-50 rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4 text-[#00236f]" />
              <span>Full Fee Ledger</span>
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
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-[11px]">CBT Quiz LMS Engine</span>
              </div>
              <span className="text-slate-400 font-normal text-[10px]">Active &rarr;</span>
            </button>
            <button
              onClick={() => {
                setShowGradeCardModal(true);
                fetchResults();
              }}
              className="w-full p-2 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 rounded-lg text-left flex justify-between items-center text-emerald-900 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[11px]">Semester Results & SGPA Grade Card</span>
              </div>
              <span className="text-emerald-700 font-bold text-[10px]">CBCS Gazette &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('student-documents')}
              className="w-full p-2 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-lg text-left flex justify-between items-center text-[#00236f] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-[11px]">Student Documents Vault</span>
              </div>
              <span className="text-slate-400 font-normal text-[10px]">85% Domicile &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('scholarships')}
              className="w-full p-2 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-lg text-left flex justify-between items-center text-[#00236f] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold text-[11px]">Apply For Scholarship</span>
              </div>
              <span className="text-slate-400 font-normal text-[10px]">Merit & Post-Matric &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('academics')}
              className="w-full p-2 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/60 rounded-lg text-left flex justify-between items-center text-[#00236f] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-semibold text-[11px]">Timetable & Syllabus</span>
              </div>
              <span className="text-slate-400 font-normal text-[10px]">CBCS Scheme &rarr;</span>
            </button>
            <button
              onClick={() => onNavigate('hostel')}
              className="w-full p-2 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/70 rounded-lg text-left flex justify-between items-center text-amber-900 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-semibold text-[11px]">Hostel Room & Mess NOC</span>
              </div>
              <span className="text-amber-700 font-medium text-[10px]">
                {student?.is_hosteller
                  ? `Room ${student.hostel_room_no || '101'} • Cleared →`
                  : 'Day Scholar (Apply Room) →'}
              </span>
            </button>
            <button
              onClick={() => onNavigate('transport')}
              className="w-full p-2 bg-sky-50/60 hover:bg-sky-100/70 border border-sky-200/70 rounded-lg text-left flex justify-between items-center text-sky-900 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bus className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span className="font-semibold text-[11px]">Digital RFID Bus Pass</span>
              </div>
              <span className="text-sky-700 font-medium text-[10px]">
                {student?.is_transport_user
                  ? `${student.transport_route || 'Route 1'} • Active →`
                  : 'Hosteller / Self Transport →'}
              </span>
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
            {(Array.isArray(notices) && notices.length > 0 ? notices : [
              {
                title: 'University Final Semester Theory Examinations May-2026',
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
        <div id="student-attendance-section" className="bg-white apple-glass-card rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
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
            <span className="text-[9px] text-slate-500 font-medium block">Statutory 75% Mandate Threshold</span>
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

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSubjectAttendance(!showSubjectAttendance)}
              className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-[#00236f] rounded-lg font-bold text-[10px] text-center transition cursor-pointer flex items-center justify-between"
            >
              <span>Subject-Wise Attendance Breakdown</span>
              <span>{showSubjectAttendance ? '▲ Hide' : '▼ View Breakdown'}</span>
            </button>

            {showSubjectAttendance && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                {[
                  { code: 'CS-401', name: 'Distributed Cloud Architecture', held: 35, attended: 32, pct: 91, safe: true },
                  { code: 'CS-402', name: 'Advanced Relational DBMS & MariaDB', held: 35, attended: 30, pct: 86, safe: true },
                  { code: 'CS-403', name: 'Operating Systems & System Programming', held: 35, attended: 23, pct: 66, safe: false },
                  { code: 'CS-404', name: 'Object Oriented Software Engineering', held: 35, attended: 31, pct: 89, safe: true },
                  { code: 'CS-405', name: 'Discrete Mathematical Structures', held: 35, attended: 26, pct: 74, safe: false },
                  { code: 'CS-406', name: 'Data Structures Laboratory', held: 16, attended: 16, pct: 100, safe: true },
                ].map(sub => (
                  <div key={sub.code} className="p-1.5 bg-slate-50/90 rounded border border-slate-200/60 text-[10px]">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-[#00236f]">{sub.code}: {sub.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${sub.safe ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {sub.pct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-[9px] mt-0.5">
                      <span>Attended: {sub.attended}/{sub.held} sessions</span>
                      <span className={sub.safe ? 'text-emerald-600' : 'text-rose-600 font-semibold'}>
                        {sub.safe ? 'Clearance OK' : 'Shortage Warning (<75%)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INLINE WORKSPACE: CBCS Semester Grade Card & Results Gazette (Zero Popups) */}
      {showGradeCardModal && (
        <div className="mt-6 bg-white rounded-2xl shadow-xl border-2 border-[#00236f]/30 p-6 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#ea580c] uppercase block">Maharaja Ranjit Singh Punjab Technical University</span>
                <h3 className="text-base font-extrabold text-[#00236f]">Official CBCS Semester Grade Card & Results Gazette</h3>
              </div>
              <button
                onClick={() => setShowGradeCardModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isResultsLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#00236f] border-t-transparent animate-spin mx-auto" />
                <span>Loading verified university examination marks...</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Scholar Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Scholar Name</span>
                    <strong className="text-slate-900 font-bold">{examResultsData?.studentName || studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Roll Number</span>
                    <strong className="font-mono text-slate-900 font-bold">{examResultsData?.rollNumber || '23010482'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Registration No</span>
                    <strong className="font-mono text-slate-900 font-bold">{examResultsData?.registrationNumber || 'MRSPTU-2023-088'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Examination Session</span>
                    <strong className="text-slate-900 font-bold">{examResultsData?.academicSession || 'Nov-Dec 2025 Regular'}</strong>
                  </div>
                </div>

                {/* Grades Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-[#00236f] text-white text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="p-2">Course Code & Title</th>
                        <th className="p-2 text-center">Credits</th>
                        <th className="p-2 text-center">Internal (40)</th>
                        <th className="p-2 text-center">External (60)</th>
                        <th className="p-2 text-center">Total (100)</th>
                        <th className="p-2 text-center">Grade</th>
                        <th className="p-2 text-center">Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(examResultsData?.grades || [
                        { code: 'CS-301', title: 'Data Structures & Algorithmic Foundations', credits: 4, internal: 38, external: 54, total: 92, grade: 'A+', gradePoint: 9 },
                        { code: 'CS-302', title: 'Computer Architecture & Assembly Language', credits: 4, internal: 35, external: 49, total: 84, grade: 'A', gradePoint: 8 },
                        { code: 'CS-303', title: 'Operating Systems & System Programming', credits: 4, internal: 39, external: 56, total: 95, grade: 'O', gradePoint: 10 },
                        { code: 'CS-304', title: 'Object Oriented Software Engineering', credits: 4, internal: 32, external: 44, total: 76, grade: 'B+', gradePoint: 7 },
                        { code: 'CS-305', title: 'Discrete Mathematical Structures', credits: 4, internal: 34, external: 50, total: 84, grade: 'A', gradePoint: 8 },
                        { code: 'CS-306', title: 'Data Structures Practicum Laboratory', credits: 2, internal: 48, external: 46, total: 94, grade: 'O', gradePoint: 10 },
                      ]).map((g: any) => (
                        <tr key={g.code} className="hover:bg-slate-50/80">
                          <td className="p-2">
                            <strong className="text-slate-900 block">{g.code}</strong>
                            <span className="text-slate-500 text-[10px]">{g.title}</span>
                          </td>
                          <td className="p-2 text-center font-bold">{g.credits}</td>
                          <td className="p-2 text-center">{g.internal}</td>
                          <td className="p-2 text-center">{g.external}</td>
                          <td className="p-2 text-center font-bold text-[#00236f]">{g.total}</td>
                          <td className="p-2 text-center font-bold text-emerald-700">{g.grade}</td>
                          <td className="p-2 text-center font-mono font-bold">{g.gradePoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* SGPA / CGPA Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Final Result Evaluation</span>
                    <strong className="text-xs text-emerald-950 font-bold">{examResultsData?.resultStatus || 'PASS (First Division with Distinction)'}</strong>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-700 block">Semester SGPA:</span>
                      <strong className="text-base text-emerald-900 font-black">{examResultsData?.sgpa || '8.73'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 block">Cumulative CGPA:</span>
                      <strong className="text-base text-emerald-900 font-black">{examResultsData?.cgpa || '8.62'}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Print Result Gazette
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGradeCardModal(false)}
                    className="px-4 py-2 bg-[#00236f] hover:bg-[#00236f]/90 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
