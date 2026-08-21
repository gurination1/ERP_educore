import React from 'react';
import { StudentProfile, ActiveScreen, NoticeItem } from '../types';

interface StudentDashboardViewProps {
  student: StudentProfile | null;
  notices: NoticeItem[];
  onNavigate: (screen: ActiveScreen) => void;
  onOpenPayModal: () => void;
  onOpenReceiptModal: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  notices,
  onNavigate,
  onOpenPayModal,
  onOpenReceiptModal,
}) => {
  const studentName = student
    ? `${student.first_name} ${student.last_name}`
    : 'Aryan Sharma';
  const courseCode = student?.course?.code || 'B.Tech';
  const semesterOrdinal = `${student?.current_semester || 4}th`;
  const sessionName = student?.session?.name || '2025-26';
  const avatarUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiC80XBMv76j7_mmqCTcV9ZoMVZPfV_CdXd_33ne25_LIcAK_aNzQB6o4mvRXLqi6oREzmz295hMjEcQKFSotWGv1NikCOM_tIPmBQDzFiaMO8yJKSdfRUTIfZSoUkGyEjTIjKF5D8DMp3A9swq7gKNz8yzp0zkvchBkPPxFbIrY_ZA6tW5oSONcFtKCHTd3RgKK6vRjOMjtXmy5qOVJVowbvGGivEwYdD84ExfwTGl3sAzLegZ9N';

  const attendancePct = student?.attendance_percentage || 85;
  const attendedClasses = student?.attended_classes || 85;
  const totalClasses = student?.total_classes || 100;
  const absentClasses = totalClasses - attendedClasses;

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
              <span className="px-2.5 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                Payment Pending
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#191c1d] tracking-tight">
                ₹ 45,000
              </span>
              <span className="text-xs text-[#757682]">/ Semester 4 Tuition & Assessment</span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-[#444651]">
              <span className="material-symbols-outlined text-[16px] text-[#757682]">
                calendar_today
              </span>
              <span>Next Due Date: </span>
              <strong className="text-[#191c1d]">15 Oct 2025</strong>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f3f4f5] flex items-center gap-3">
            <button
              id="student-pay-now-btn"
              onClick={onOpenPayModal}
              className="flex-1 px-5 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              <span>Pay Now</span>
            </button>
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
                onClick={onOpenReceiptModal}
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
              <span className="text-xs font-semibold text-[#00236f] cursor-pointer hover:underline">
                View All
              </span>
            </div>

            <div className="space-y-3">
              {notices.slice(0, 3).map((notice, idx) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Mini Chart Card */}
        <div
          id="student-attendance-card"
          className="bg-white rounded-xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-[#191c1d] mb-3">Attendance</h3>
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
                    className="text-[#00236f]"
                    strokeDasharray={`${attendancePct}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#191c1d]">{attendancePct}%</span>
                  <span className="text-[9px] uppercase font-bold text-[#757682]">Overall</span>
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
