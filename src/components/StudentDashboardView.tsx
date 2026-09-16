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
      <div className="p-12 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-fadeIn">
        <div className="w-10 h-10 border-4 border-[#00236f] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[#757682]">Loading student profile...</p>
      </div>
    );
  }

  const studentName = `${student.first_name} ${student.last_name}`;
  const courseCode = student.course?.code || 'B.Tech';
  const semesterOrdinal = `${student.current_semester || 1}th`;
  const sessionName = student.session?.name || '2025-26';
  const avatarUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiC80XBMv76j7_mmqCTcV9ZoMVZPfV_CdXd_33ne25_LIcAK_aNzQB6o4mvRXLqi6oREzmz295hMjEcQKFSotWGv1NikCOM_tIPmBQDzFiaMO8yJKSdfRUTIfZSoUkGyEjTIjKF5D8DMp3A9swq7gKNz8yzp0zkvchBkPPxFbIrY_ZA6tW5oSONcFtKCHTd3RgKK6vRjOMjtXmy5qOVJVowbvGGivEwYdD84ExfwTGl3sAzLegZ9N';

  const attendancePct = student.attendance_percentage ?? 100;
  const attendedClasses = student.attended_classes ?? 0;
  const totalClasses = student.total_classes ?? 0;
  const absentClasses = Math.max(0, totalClasses - attendedClasses);

  const isDetained = attendancePct < 65;
  const isCondonationNeeded = attendancePct >= 65 && attendancePct < 75;

  const totalDue = ledgerData?.summary ? Math.round(ledgerData.summary.totalDue * 100) / 100 : (student.fees_status === 'paid' ? 0 : 0);
  const totalDiscount = ledgerData ? (ledgerData.ledger || []).reduce((acc: number, f: any) => acc + (f.discount_amount || 0), 0) : 0;
  const isFullyPaid = ledgerData?.summary ? (totalDue <= 0.01) : (student.fees_status === 'paid');
  const unpaidItems = ledgerData?.ledger?.filter((f: any) => f.due_amount > 0 && f.status !== 'cancelled') || [];
  const nextDueDate = unpaidItems.sort((a: any, b: any) => a.due_date?.localeCompare(b.due_date))[0]?.due_date || (isFullyPaid ? 'All dues cleared in full' : 'Assessment pending');
  const latestReceipt = ledgerData?.payments?.[0]?.receipt_no || 'latest';
  const [showAllNotices, setShowAllNotices] = useState(false);

  return (
    <div id="student-dashboard-screen" className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
          Welcome back, {studentName}
        </h2>
        <p className="text-sm text-[#444651] mt-1">
          Here is your academic and financial overview for today.
        </p>
      </div>

      {/* Top Grid: Profile Summary + Pending Fee Due */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Summary Card (5 cols) */}
        <div
          id="student-profile-summary-card"
          className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl}
              alt={studentName}
              referrerPolicy="no-referrer"
              className="w-18 h-18 rounded-full object-cover border-2 border-[#00236f]/20 shadow-xs"
            />
            <div>
              <h3 className="text-xl font-bold text-[#191c1d]">{studentName}</h3>
              <p className="text-xs text-[#00236f] font-semibold tracking-wide uppercase mt-0.5">
                ID: {student?.student_id || 'STU-2023-088'}
              </p>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 bg-[#86f2e4]/30 text-[#006a61] rounded text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
                Enrolled Active
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f3f4f5] grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#edeeef]">
              <span className="text-[10px] text-[#757682] uppercase font-bold tracking-wider block">
                Course
              </span>
              <span className="text-sm font-bold text-[#191c1d] mt-0.5 block">
                {courseCode}
              </span>
            </div>
            <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#edeeef]">
              <span className="text-[10px] text-[#757682] uppercase font-bold tracking-wider block">
                Semester
              </span>
              <span className="text-sm font-bold text-[#191c1d] mt-0.5 block">
                {semesterOrdinal}
              </span>
            </div>
            <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#edeeef]">
              <span className="text-[10px] text-[#757682] uppercase font-bold tracking-wider block">
                Session
              </span>
              <span className="text-sm font-bold text-[#191c1d] mt-0.5 block">
                {sessionName}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Fee Due Card (7 cols) */}
        <div
          id="student-pending-fee-card"
          className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#757682]">
                Pending Fee Due
              </span>
              {isLedgerLoading ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f3f4f5] text-[#757682] animate-pulse">
                  Verifying Ledger...
                </span>
              ) : (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                    isFullyPaid
                      ? 'bg-[#86f2e4]/30 text-[#006a61]'
                      : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFullyPaid ? 'bg-[#006a61]' : 'bg-[#ba1a1a]'
                    }`}
                  ></span>
                  {isFullyPaid ? 'Zero Dues • Fully Paid' : 'Payment Pending'}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span
                className={`text-4xl font-extrabold tracking-tight ${
                  isFullyPaid ? 'text-[#006a61]' : 'text-[#191c1d]'
                }`}
              >
                {isLedgerLoading ? '₹ ...' : `₹ ${totalDue.toLocaleString('en-IN')}`}
              </span>
              <span className="text-xs text-[#757682]">
                / Semester {student?.current_semester || 4}{' '}
                {isFullyPaid ? 'All Heads Settled' : 'Tuition & Statutory Assessment'}
              </span>
            </div>

            {totalDiscount > 0 && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#86f2e4]/20 border border-[#86f2e4]/60 rounded-md text-xs text-[#006a61] font-bold">
                <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
                <span>Scholarship Aid Applied: -₹ {totalDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="mt-2.5 flex items-center gap-2 text-xs text-[#444651]">
              <span className="material-symbols-outlined text-[16px] text-[#757682]">
                calendar_today
              </span>
              <span>Due Schedule: </span>
              <strong className="text-[#191c1d]">
                {isLedgerLoading ? 'Verifying status...' : isFullyPaid ? 'Current semester dues cleared in full' : nextDueDate}
              </strong>
            </div>

            {/* MRSPTU Examination Admit Card Gate Banner */}
            {isLedgerLoading ? (
              <div className="mt-3.5 p-3 bg-[#f8f9fa] border border-[#edeeef] rounded-xl flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded-full bg-[#e1e3e4]"></div>
                <div className="space-y-1 flex-1">
                  <div className="w-48 h-3 bg-[#e1e3e4] rounded"></div>
                  <div className="w-32 h-2 bg-[#f3f4f5] rounded"></div>
                </div>
              </div>
            ) : isFullyPaid && !isDetained ? (
              <div className="mt-3.5 p-3 bg-[#86f2e4]/20 border border-[#86f2e4] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#006a61] text-[20px]">assignment_turned_in</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#006a61]">MRSPTU Exam Hall Ticket Released</h4>
                    <p className="text-[10px] text-[#444651]">Dec / Jan Session • No-Dues & Attendance Cleared</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAdmitCardModal}
                  className="px-3 py-1.5 bg-[#006a61] hover:bg-[#005a52] text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px]">badge</span>
                  <span>View Roll Slip</span>
                </button>
              </div>
            ) : totalDue > 0 ? (
              <div className="mt-3.5 p-3 bg-[#ffdad6]/40 border border-[#ffdad6] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">block</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#ba1a1a]">MRSPTU Exam Admit Card Withheld</h4>
                    <p className="text-[10px] text-[#444651]">Accounts hold: ₹{totalDue.toLocaleString('en-IN')} pending balance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAdmitCardModal}
                  className="px-2.5 py-1 bg-white hover:bg-[#fff8f7] text-[#ba1a1a] border border-[#ba1a1a] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Hold Reason</span>
                </button>
              </div>
            ) : isDetained ? (
              <div className="mt-3.5 p-3 bg-[#ffdad6]/40 border border-[#ffdad6] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">warning</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#ba1a1a]">Admit Card Withheld (Attendance &lt; 75%)</h4>
                    <p className="text-[10px] text-[#444651]">MRSPTU Ordinance 7.4 Detention ({attendancePct}%). Submit HOD condonation.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAdmitCardModal}
                  className="px-2.5 py-1 bg-white hover:bg-[#fff8f7] text-[#ba1a1a] border border-[#ba1a1a] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Detention Details</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 pt-4 border-t border-[#f3f4f5] flex items-center gap-3">
            {totalDue > 0 ? (
              <button
                id="student-pay-now-btn"
                onClick={onOpenPayModal}
                className="flex-1 px-5 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                <span>Pay Outstanding Due (₹{totalDue.toLocaleString('en-IN')})</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenReceiptModal(latestReceipt)}
                className="flex-1 px-5 py-2.5 bg-[#006a61] hover:bg-[#005a52] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">receipt</span>
                <span>Download Clearance Receipt</span>
              </button>
            )}
            <button
              id="student-view-ledger-btn"
              onClick={() => onNavigate('fee-ledger')}
              className="px-5 py-2.5 border border-[#e1e3e4] bg-[#ffffff] hover:bg-[#f8f9fa] text-[#191c1d] rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#757682]">
                receipt_long
              </span>
              <span>View Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Links + Recent Notices + Attendance Mini Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Links Card */}
        <div
          id="student-quick-links-card"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-[#191c1d] mb-4">Quick Links</h3>
            <div className="space-y-2.5">
              <button
                id="quick-link-admit-card"
                onClick={onOpenAdmitCardModal}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#f8f9fa] hover:bg-[#dce1ff]/40 text-left transition-colors border border-[#edeeef]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    isFullyPaid && !isDetained ? 'bg-[#86f2e4]/30 text-[#006a61]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#191c1d]">MRSPTU Exam Admit Card</p>
                    <p className="text-[10px] text-[#757682]">
                      {isFullyPaid && !isDetained
                        ? 'Cleared & Released'
                        : totalDue > 0
                        ? `Accounts Hold (₹${totalDue.toLocaleString('en-IN')} Due)`
                        : isDetained
                        ? 'Detained (Attendance < 75%)'
                        : 'Clearance Required'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#757682]">
                  arrow_forward
                </span>
              </button>

              <button
                id="quick-link-scholarship"
                onClick={() => onNavigate('scholarships')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#f8f9fa] hover:bg-[#dce1ff]/40 text-left transition-colors border border-[#edeeef]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#dce1ff] text-[#00236f] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#191c1d]">Apply for Scholarship</p>
                    <p className="text-[10px] text-[#757682]">Merit & Need grants</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#757682]">
                  arrow_forward
                </span>
              </button>

              <button
                id="quick-link-receipt"
                onClick={() => onOpenReceiptModal(latestReceipt)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#f8f9fa] hover:bg-[#dce1ff]/40 text-left transition-colors border border-[#edeeef]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#86f2e4]/30 text-[#006a61] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#191c1d]">Download Receipt</p>
                    <p className="text-[10px] text-[#757682]">Latest term invoice</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#757682]">
                  arrow_forward
                </span>
              </button>

              <button
                id="quick-link-academics"
                onClick={() => onNavigate('academics')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#f8f9fa] hover:bg-[#dce1ff]/40 text-left transition-colors border border-[#edeeef]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#f3f4f5] text-[#444651] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#191c1d]">Course Materials</p>
                    <p className="text-[10px] text-[#757682]">Syllabus & Lecture notes</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#757682]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Notices Card */}
        <div
          id="student-recent-notices-card"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#191c1d]">Recent Notices</h3>
              {notices.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllNotices(!showAllNotices)}
                  className="text-xs font-semibold text-[#00236f] cursor-pointer hover:underline"
                >
                  {showAllNotices ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notices.length === 0 ? (
                <p className="text-xs text-[#757682] py-4 text-center">No active campus notices posted.</p>
              ) : (
                notices.slice(0, showAllNotices ? 20 : 3).map((notice, idx) => (
                  <div
                    key={notice.id || idx}
                    className="p-2.5 rounded-lg border-l-3 border-[#00236f] bg-[#f8f9fa] hover:bg-[#f3f4f5] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#191c1d] line-clamp-1">{notice.title}</h4>
                      <span className="text-[10px] text-[#757682]">{notice.notice_date}</span>
                    </div>
                    <p className="text-[11px] text-[#444651] mt-1 line-clamp-2">{notice.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Attendance Mini Chart Card */}
        <div
          id="student-attendance-card"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#191c1d]">Attendance</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDetained
                    ? 'bg-[#ffdad6] text-[#ba1a1a]'
                    : isCondonationNeeded
                    ? 'bg-[#fef3c7] text-[#b45309]'
                    : 'bg-[#86f2e4]/30 text-[#006a61]'
                }`}
              >
                {isDetained
                  ? '⚠️ PTU Detained'
                  : isCondonationNeeded
                  ? '⚠️ Condonation Req.'
                  : 'Exam Eligible'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center my-2">
              {/* Circular SVG Donut Gauge */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background ring */}
                  <path
                    className="text-[#f3f4f5]"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress ring */}
                  <path
                    className={
                      isDetained
                        ? 'text-[#ba1a1a]'
                        : isCondonationNeeded
                        ? 'text-[#b45309]'
                        : 'text-[#006a61]'
                    }
                    strokeDasharray={`${attendancePct}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${
                    isDetained ? 'text-[#ba1a1a]' : isCondonationNeeded ? 'text-[#b45309]' : 'text-[#191c1d]'
                  }`}>{attendancePct}%</span>
                  <span className="text-[9px] uppercase font-bold text-[#757682]">University</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#f3f4f5] flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] text-[#757682] uppercase font-bold">Present</span>
              <span className="text-sm font-bold text-[#006a61] block">{attendedClasses}</span>
            </div>
            <div className="h-6 w-[1px] bg-[#e1e3e4]"></div>
            <div>
              <span className="text-[10px] text-[#757682] uppercase font-bold">Absent</span>
              <span className="text-sm font-bold text-[#ba1a1a] block">{absentClasses}</span>
            </div>
            <div className="h-6 w-[1px] bg-[#e1e3e4]"></div>
            <div>
              <span className="text-[10px] text-[#757682] uppercase font-bold">Total</span>
              <span className="text-sm font-bold text-[#191c1d] block">{totalClasses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
