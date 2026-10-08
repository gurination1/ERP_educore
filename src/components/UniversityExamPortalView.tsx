import React, { useState, useEffect } from 'react';
import { safeGoBack } from '../utils/navigation';
import { User } from '../types';
import { api } from '../api/client';

interface UniversityExamPortalViewProps {
  currentUser: User | null;
  initialTab?: 'regular' | 'reappear' | 'admit-card' | 'datesheet' | 'results';
}

export const UniversityExamPortalView: React.FC<UniversityExamPortalViewProps> = ({
  currentUser,
  initialTab = 'regular',
}) => {
  const [activeTab, setActiveTab] = useState<'regular' | 'reappear' | 'admit-card' | 'datesheet' | 'results'>(initialTab);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-rec-aryan');
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [examMeta, setExamMeta] = useState<any | null>(null);
  const [datesheets, setDatesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Form states
  const [selectedRegularPapers, setSelectedRegularPapers] = useState<string[]>([]);
  const [selectedReappearPapers, setSelectedReappearPapers] = useState<string[]>([]);
  const [reappearFee, setReappearFee] = useState<number>(0);

  // Datesheet filters
  const [datesheetUniFilter, setDatesheetUniFilter] = useState<string>('ALL');
  const [datesheetCourseFilter, setDatesheetCourseFilter] = useState<string>('ALL');
  const [datesheetSemFilter, setDatesheetSemFilter] = useState<string>('ALL');

  // Submission slips
  const [submittedRegularSlip, setSubmittedRegularSlip] = useState<any | null>(null);
  const [submittedReappearSlip, setSubmittedReappearSlip] = useState<any | null>(null);

  const isStudent = currentUser?.role === 'student';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // Load initial meta & eligible students
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getExamMeta(),
      api.getExamStudents(),
    ])
      .then(([metaRes, studentsRes]) => {
        if (metaRes.success) setExamMeta(metaRes.meta);
        if (studentsRes.success && studentsRes.students) {
          setStudents(studentsRes.students);
          if (isStudent) {
            // Find student matching current user
            const matched = studentsRes.students.find(
              (s: any) => s.id === currentUser?.id || s.student_id === currentUser?.username
            );
            if (matched) {
              setSelectedStudentId(matched.id);
            } else if (studentsRes.students.length > 0) {
              setSelectedStudentId(studentsRes.students[0].id);
            }
          } else if (studentsRes.students.length > 0) {
            setSelectedStudentId(studentsRes.students[0].id);
          }
        }
      })
      .catch(err => {
        setActionErrorMsg(err.message || 'Failed to load examination portal metadata.');
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Load selected student examination profile
  const fetchStudentProfile = (studentId: string) => {
    if (!studentId) return;
    setProfileLoading(true);
    api.getExamStudentProfile(studentId)
      .then(res => {
        if (res.success) {
          setStudentProfile(res);
          // Auto select regular papers by default
          if (res.regularPapers) {
            setSelectedRegularPapers(res.regularPapers.map((p: any) => p.paperCode));
          }
          if (res.regularSubmission) {
            setSubmittedRegularSlip(res.regularSubmission);
          }
          if (res.reappearSubmission) {
            setSubmittedReappearSlip(res.reappearSubmission);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching student exam profile:', err);
      })
      .finally(() => setProfileLoading(false));
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProfile(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Load datesheets
  const fetchDatesheets = () => {
    api.getExamDatesheets({
      university: datesheetUniFilter,
      course: datesheetCourseFilter,
      semester: datesheetSemFilter,
    })
      .then(res => {
        if (res.success && res.datesheets) {
          setDatesheets(res.datesheets);
        }
      })
      .catch(err => console.error('Error loading datesheets:', err));
  };

  useEffect(() => {
    fetchDatesheets();
  }, [datesheetUniFilter, datesheetCourseFilter, datesheetSemFilter]);

  // Reappear paper toggle & fee recalculation
  const handleToggleReappearPaper = (paperCode: string, feePerPaper: number) => {
    let updated = [...selectedReappearPapers];
    if (updated.includes(paperCode)) {
      updated = updated.filter(c => c !== paperCode);
    } else {
      updated.push(paperCode);
    }
    setSelectedReappearPapers(updated);
    setReappearFee(updated.length * (feePerPaper || 700));
  };

  // Submit Regular Exam Form
  const handleSubmitRegularForm = async () => {
    if (!studentProfile?.student?.id) return;
    try {
      const res = await api.submitRegularExamForm({
        studentId: studentProfile.student.id,
        semester: studentProfile.student.current_semester,
        selectedPapers: selectedRegularPapers,
        centerAllotted: 'Center 104 (BFGI Main Campus, Bathinda)',
      });
      if (res.success) {
        setActionSuccessMsg('Regular Examination Form submitted successfully! Verification hash recorded.');
        setSubmittedRegularSlip(res.record);
        fetchStudentProfile(selectedStudentId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to submit examination form.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error communicating with Examination Controller.');
    }
  };

  // Submit Reappear Form
  const handleSubmitReappearForm = async () => {
    if (!studentProfile?.student?.id || selectedReappearPapers.length === 0) {
      setActionErrorMsg('Please select at least one backlog paper to register.');
      return;
    }
    try {
      const res = await api.submitReappearExamForm({
        studentId: studentProfile.student.id,
        semester: studentProfile.student.current_semester,
        selectedPapers: selectedReappearPapers,
        paymentMode: 'online_upi',
      });
      if (res.success) {
        setActionSuccessMsg(`Reappear Form registered. ₹${res.record.totalFeePaid} fee reconciled.`);
        setSubmittedReappearSlip(res.record);
        fetchStudentProfile(selectedStudentId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.error || 'Failed to submit reappear form.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error processing reappear form.');
    }
  };

  // Instant Dean Condonation Action
  const handleGrantCondonation = async () => {
    if (!studentProfile?.student?.id) return;
    try {
      const res = await api.condoneExamAttendance({
        studentId: studentProfile.student.id,
        reason: 'Authorized Dean Attendance Condonation under MRSPTU Ordinance 7.4',
      });
      if (res.success) {
        setActionSuccessMsg(res.message);
        fetchStudentProfile(selectedStudentId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to grant condonation.');
    }
  };

  // Instant Fee Clearance Action
  const handleClearFeeDues = async () => {
    if (!studentProfile?.student?.id) return;
    try {
      const res = await api.clearExamFeeDues({
        studentId: studentProfile.student.id,
      });
      if (res.success) {
        setActionSuccessMsg(res.message);
        fetchStudentProfile(selectedStudentId);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to clear fee dues.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clearance = studentProfile?.clearance;
  const isEligible = clearance?.isEligible;
  const student = studentProfile?.student;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16 font-sans">
      {/* TIER 1: Cupertino Top Banner & Navigation */}
      <div className="bg-[#00236f] text-white px-4 sm:px-8 py-4 border-b border-white/10 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => safeGoBack('/dashboard')}
              title="Return to Previous Screen (Alt + ←)"
              className="h-9 px-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 select-none shadow-xs"
            >
              <span className="text-sm font-black leading-none">‹</span>
              <span>Back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#ea580c] text-white font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                  EXAMINATION BRANCH
                </span>
                <span className="text-amber-300 text-xs font-semibold hidden sm:inline">
                  PUP Patiala • MRSPTU • Panjab University
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase mt-0.5">
                University Examination & Gate Clearance Portal
              </h1>
            </div>
          </div>

          {/* Student Selector (Admin / Faculty mode) */}
          {!isStudent && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20">
              <span className="text-white/80 text-xs font-semibold whitespace-nowrap">Examinee:</span>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="bg-[#001744] text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id}) • Sem {s.current_semester} • {s.is_attendance_eligible ? 'Att: OK' : 'Att: SHORT'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* Feedback Alerts */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn print:hidden">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {actionSuccessMsg}
            </span>
            <button type="button" onClick={() => setActionSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
          </div>
        )}
        {actionErrorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn print:hidden">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {actionErrorMsg}
            </span>
            <button type="button" onClick={() => setActionErrorMsg(null)} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
          </div>
        )}

        {/* Examinee Overview Card (Apple Style Capsule) */}
        {student && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00236f] text-white flex items-center justify-center font-black text-base shadow-sm">
                {student.first_name?.[0]}{student.last_name?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">{student.full_name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-[#00236f] border border-blue-200">
                    UID: {student.enterprise_uid}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                    Roll: {student.university_roll_no}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {student.course_name} • Semester {student.current_semester} • Reg No: {student.registration_no}
                </p>
              </div>
            </div>

            {/* Clearance Badges */}
            <div className="flex items-center gap-2.5">
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                clearance?.attendancePercentage >= 75 || clearance?.condonationGranted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <span>Attendance: {clearance?.attendancePercentage}%</span>
                {clearance?.condonationGranted && <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.2 rounded font-mono">CONDONED</span>}
              </div>

              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                clearance?.isFeeCleared
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {clearance?.isFeeCleared ? 'Fee: No-Dues' : `Dues: ₹${clearance?.totalOutstandingDue?.toLocaleString('en-IN')}`}
              </div>

              <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                isEligible
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-rose-600 text-white shadow-xs'
              }`}>
                {isEligible ? 'Gate Cleared ✓' : 'Admit Hold ✕'}
              </div>
            </div>
          </div>
        )}

        {/* iPhone / Segmented Tab Control Navigation Bar */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 shadow-inner print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('regular')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'regular'
                ? 'bg-white text-[#00236f] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            Regular Exam Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reappear')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'reappear'
                ? 'bg-white text-[#00236f] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            Reappear / Backlog Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admit-card')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'admit-card'
                ? 'bg-[#ea580c] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            ★ Admit Card / Hall Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('datesheet')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'datesheet'
                ? 'bg-white text-[#00236f] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            Official Datesheets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'results'
                ? 'bg-white text-[#00236f] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            CBCS Grade Cards & Results
          </button>
        </div>

        {/* TAB 1: REGULAR EXAMINATION FORM */}
        {activeTab === 'regular' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Regular Semester Examination Application Form
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Session: May-June 2026 • Statutory Form under MRSPTU / PUP Academic Council
                </p>
              </div>

              {submittedRegularSlip ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Form Registered ({submittedRegularSlip.id})
                  </span>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 bg-[#00236f] text-white rounded-xl text-xs font-bold hover:bg-[#001744] cursor-pointer shadow-xs"
                  >
                    Print Submission Slip
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  Submission Open Till 15th April
                </span>
              )}
            </div>

            {/* Hold Alert Banner if any */}
            {!isEligible && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <span>⚠️</span>
                  <span>Examination Form Gate Clearance Notice:</span>
                </div>
                <ul className="text-xs text-rose-700 list-disc list-inside space-y-1 pl-2">
                  {clearance?.holdReasons?.map((reason: string, i: number) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
                {isAdmin && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {!clearance?.isAttendanceEligible && (
                      <button
                        type="button"
                        onClick={handleGrantCondonation}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Grant Dean Condonation (Order 7.4)
                      </button>
                    )}
                    {!clearance?.isFeeCleared && (
                      <button
                        type="button"
                        onClick={handleClearFeeDues}
                        className="px-3 py-1.5 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Reconcile Fees (Mark No-Dues)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Subject Paper Selection Table */}
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                Current Semester Prescribed Theory & Practical Papers:
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">Verify</th>
                      <th className="p-3">Paper Code</th>
                      <th className="p-3">Subject Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Credits</th>
                      <th className="p-3">Scheduled Date</th>
                      <th className="p-3">Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {studentProfile?.regularPapers?.map((paper: any) => {
                      const isSelected = selectedRegularPapers.includes(paper.paperCode);
                      return (
                        <tr key={paper.paperCode} className={isSelected ? 'bg-blue-50/30' : ''}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedRegularPapers(selectedRegularPapers.filter(c => c !== paper.paperCode));
                                } else {
                                  setSelectedRegularPapers([...selectedRegularPapers, paper.paperCode]);
                                }
                              }}
                              className="rounded text-[#00236f] focus:ring-amber-400 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-[#00236f]">{paper.paperCode}</td>
                          <td className="p-3 font-semibold text-slate-800">{paper.subjectTitle}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {paper.type}
                            </span>
                          </td>
                          <td className="p-3">{paper.credits}</td>
                          <td className="p-3 font-mono">{paper.examDate}</td>
                          <td className="p-3 text-slate-500">{paper.session}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Allotted Center Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-bold">Designated Center:</span>{' '}
                <span className="font-extrabold text-slate-900">Center 104 - Main Science & Engineering Block (BFGI Campus)</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Statutory Fee:</span>{' '}
                <span className="font-extrabold text-slate-900">₹1,200 (Inclusive of University Examination Form & Marksheet Fee)</span>
              </div>
            </div>

            {/* Submission Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmitRegularForm}
                disabled={selectedRegularPapers.length === 0}
                className="px-6 py-2.5 bg-[#00236f] hover:bg-[#001744] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {submittedRegularSlip ? 'Re-Submit / Update Examination Form' : 'Submit Regular Examination Form'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REAPPEAR / BACKLOG EXAMINATION FORM */}
        {activeTab === 'reappear' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Supplementary / Reappear Examination Form
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory Fee: ₹700 per Paper under MRSPTU / PUP Examination Ordinance
                </p>
              </div>

              {submittedReappearSlip && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Reappear Registered ({submittedReappearSlip.id})
                  </span>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 bg-[#00236f] text-white rounded-xl text-xs font-bold hover:bg-[#001744] cursor-pointer"
                  >
                    Print Reappear Slip
                  </button>
                </div>
              )}
            </div>

            {/* Reappear Papers Checklist */}
            {studentProfile?.reappearPapers && studentProfile.reappearPapers.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3 w-10 text-center">Select</th>
                        <th className="p-3">Paper Code</th>
                        <th className="p-3">Subject Name</th>
                        <th className="p-3">Semester</th>
                        <th className="p-3">Internal</th>
                        <th className="p-3">External</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {studentProfile.reappearPapers.map((paper: any) => {
                        const isChecked = selectedReappearPapers.includes(paper.paperCode);
                        return (
                          <tr key={paper.paperCode} className={isChecked ? 'bg-amber-50/40' : ''}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleReappearPaper(paper.paperCode, paper.fee)}
                                className="rounded text-[#ea580c] focus:ring-amber-400 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-rose-700">{paper.paperCode}</td>
                            <td className="p-3 font-semibold text-slate-800">{paper.subjectTitle}</td>
                            <td className="p-3">Sem {paper.semester}</td>
                            <td className="p-3">{paper.internalMarks} / 40</td>
                            <td className="p-3 text-rose-600 font-bold">{paper.externalMarks} / 60</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                {paper.status}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-900">₹{paper.fee}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Fee Calculation Card */}
                <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Reappear Summary & Assessment
                    </h5>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Selected Papers: <span className="font-bold">{selectedReappearPapers.length}</span> • Statutory Fee per paper: ₹700
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-amber-800 uppercase font-bold block">Total Payable:</span>
                      <span className="text-lg font-black text-amber-950">₹ {reappearFee.toLocaleString('en-IN')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitReappearForm}
                      disabled={selectedReappearPapers.length === 0}
                      className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      Pay & Submit Reappear Form
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                <span className="text-2xl block mb-2">🎉</span>
                <p className="text-xs font-bold text-slate-700">No Backlogs or Reappear Papers Detected!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Candidate has maintained 100% pass record across all preceding academic semesters.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADMIT CARD / HALL TICKET & GATE CLEARANCE */}
        {activeTab === 'admit-card' && (
          <div className="space-y-6">
            {/* If Not Eligible: Red Banner with Instant Action Unlocks */}
            {!isEligible && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-4 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold">
                    ✕
                  </div>
                  <div>
                    <h3 className="text-base font-black text-rose-900 uppercase">
                      Admit Card Withheld • Gate Clearance Not Met
                    </h3>
                    <p className="text-xs text-rose-600 mt-0.5">
                      Statutory Roll Number Slip withheld under University Ordinances. Resolve discrepancies below:
                    </p>
                  </div>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-2">
                  {clearance?.holdReasons?.map((reason: string, i: number) => (
                    <div key={i} className="text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!clearance?.isFeeCleared && (
                    <button
                      type="button"
                      onClick={handleClearFeeDues}
                      className="px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      Instant Reconcile Tuition Dues (Clear Hold)
                    </button>
                  )}
                  {!clearance?.isAttendanceEligible && (
                    <button
                      type="button"
                      onClick={handleGrantCondonation}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      Authorize Dean Attendance Condonation (Order 7.4)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Official Tripartite Roll Number Slip (Printable Document) */}
            {isEligible ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-300 shadow-lg space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
                {/* Print Control Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                      Admit Card Released • All Gate Clearances Verified
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>🖨️</span>
                    <span>Print Official Roll Number Slip</span>
                  </button>
                </div>

                {/* THE ADMIT CARD DOCUMENT */}
                <div className="border-2 border-[#00236f] rounded-2xl p-6 sm:p-8 space-y-6 bg-white relative overflow-hidden print:border-2 print:p-6">
                  {/* Watermark in background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <span className="text-8xl font-black text-[#00236f] uppercase rotate-[-25deg]">BFGI EXAM CELL</span>
                  </div>

                  {/* Header */}
                  <div className="text-center border-b-2 border-[#00236f] pb-4 space-y-1">
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-widest">
                      Autonomous Campus • Affiliated to Punjabi University Patiala / MRSPTU / Panjab University
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-[#00236f] uppercase tracking-tight">
                      BABA FARID GROUP OF INSTITUTIONS (BATHINDA)
                    </h2>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-900 uppercase">
                      OFFICIAL EXAMINATION ROLL NUMBER SLIP & ADMIT CARD
                    </h3>
                    <div className="text-xs font-mono font-semibold text-slate-700">
                      Even Semester Examination • Academic Session: May-June 2026
                    </div>
                  </div>

                  {/* Candidate Identification Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    {/* Left 3 cols: Info */}
                    <div className="md:col-span-3 grid grid-cols-2 gap-y-3 gap-x-4 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Candidate Full Name:</span>
                        <span className="font-extrabold text-slate-900 text-sm uppercase">{student.full_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Father's Name:</span>
                        <span className="font-extrabold text-slate-900 text-sm uppercase">{student.father_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">University Roll Number:</span>
                        <span className="font-mono font-black text-[#00236f] text-base">{student.university_roll_no}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Canonical UID:</span>
                        <span className="font-mono font-bold text-slate-800">{student.enterprise_uid}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Course & Branch:</span>
                        <span className="font-bold text-slate-900">{student.course_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Current Semester:</span>
                        <span className="font-bold text-slate-900">Semester {student.current_semester} (Even)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Registration Number:</span>
                        <span className="font-mono font-bold text-slate-700">{student.registration_no}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Allotted Center:</span>
                        <span className="font-bold text-slate-900">Center 104 (BFGI Main Campus)</span>
                      </div>
                    </div>

                    {/* Right col: Photo & Barcode */}
                    <div className="flex flex-col items-center justify-between border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                      <div className="w-24 h-28 bg-slate-200 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400 text-xs font-bold overflow-hidden shadow-inner">
                        PHOTO
                      </div>
                      <div className="text-center mt-2">
                        <div className="font-mono text-[10px] font-black tracking-widest text-slate-800">
                          *{student.university_roll_no}*
                        </div>
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">VERIFIED COE</span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Examination Subjects Table */}
                  <div>
                    <h4 className="text-xs font-black text-[#00236f] uppercase tracking-wider mb-2">
                      Authorized Examination Schedule:
                    </h4>
                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs divide-y divide-slate-200">
                        <thead className="bg-[#00236f] text-white font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Timing</th>
                            <th className="p-2.5">Paper Code</th>
                            <th className="p-2.5">Subject Title</th>
                            <th className="p-2.5 text-center">Answer Book Serial</th>
                            <th className="p-2.5 text-center">Invigilator Sign</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                          {studentProfile?.regularPapers?.map((p: any) => (
                            <tr key={p.paperCode} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono font-bold">{p.examDate}</td>
                              <td className="p-2.5 text-slate-600">{p.session}</td>
                              <td className="p-2.5 font-mono font-bold text-[#00236f]">{p.paperCode}</td>
                              <td className="p-2.5 font-semibold">{p.subjectTitle}</td>
                              <td className="p-2.5 text-center font-mono text-slate-400">ANS-_______</td>
                              <td className="p-2.5 text-center text-slate-300">____________</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Instructions & Signatures */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200 text-xs">
                    <div className="md:col-span-2 text-[11px] text-slate-600 space-y-1">
                      <span className="font-bold text-slate-800 block">Candidate Instructions:</span>
                      <p>1. Must carry RFID Campus Identity Card along with this Roll Number Slip into exam hall.</p>
                      <p>2. Possession of mobile phones, smart wearables, or notes attracts immediate UMC cancellation.</p>
                      <p>3. Candidates must report 30 minutes prior to paper commencement.</p>
                    </div>

                    <div className="flex flex-col justify-end items-center text-center space-y-1">
                      <div className="w-36 h-10 border-b border-slate-400 flex items-center justify-center text-[10px] text-slate-400 italic">
                        [COE Digital Seal]
                      </div>
                      <span className="font-extrabold text-[#00236f] text-xs">Controller of Examinations</span>
                      <span className="text-[10px] text-slate-500">Baba Farid Group of Institutions</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 4: OFFICIAL DATESHEETS ARCHIVE */}
        {activeTab === 'datesheet' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Master Examination Timetable & Datesheet Archive
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Sessional & University Schedules for May-June 2026 Examination
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-[#00236f] text-white rounded-xl text-xs font-bold hover:bg-[#001744] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print Official Datesheet</span>
              </button>
            </div>

            {/* Filter Ribbons */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Affiliation:</span>
                <select
                  value={datesheetUniFilter}
                  onChange={e => setDatesheetUniFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="ALL">All Affiliations</option>
                  <option value="MRSPTU">MRSPTU (Autonomous)</option>
                  <option value="PUP">Punjabi University Patiala (PUP)</option>
                  <option value="PU">Panjab University (PU)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Course:</span>
                <select
                  value={datesheetCourseFilter}
                  onChange={e => setDatesheetCourseFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="ALL">All Courses</option>
                  <option value="B.Tech CS">B.Tech Computer Science & Engg</option>
                  <option value="MBA Finance">MBA Financial Management</option>
                  <option value="B.Sc Physics">B.Sc Applied Physics</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Semester:</span>
                <select
                  value={datesheetSemFilter}
                  onChange={e => setDatesheetSemFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="ALL">All Semesters</option>
                  <option value="2">Semester 2</option>
                  <option value="4">Semester 4</option>
                  <option value="6">Semester 6</option>
                </select>
              </div>
            </div>

            {/* Datesheet Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-[#00236f] text-white font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Day</th>
                    <th className="p-3">Session & Timing</th>
                    <th className="p-3">Paper Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Affiliation</th>
                    <th className="p-3">Course & Sem</th>
                    <th className="p-3">Permitted Material</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {datesheets.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{d.examDate}</td>
                      <td className="p-3 text-slate-600">{d.day}</td>
                      <td className="p-3 text-slate-700">{d.session}</td>
                      <td className="p-3 font-mono font-bold text-[#00236f]">{d.paperCode}</td>
                      <td className="p-3 font-bold text-slate-800">{d.subjectTitle}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#00236f] border border-blue-200">
                          {d.university}
                        </span>
                      </td>
                      <td className="p-3">{d.courseCode} (Sem {d.semester})</td>
                      <td className="p-3 text-slate-500 text-[11px]">{d.allowedMaterials}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CBCS GRADE CARDS & RESULTS GAZETTE */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  UGC 10-Point Choice Based Credit System (CBCS) Grade Card
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Semester Result Gazette & Transcripts Engine
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-[#00236f] text-white rounded-xl text-xs font-bold hover:bg-[#001744] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print Official Grade Card</span>
              </button>
            </div>

            {/* GPA Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-[#00236f] uppercase">Semester SGPA</span>
                <div className="text-2xl font-black text-[#00236f] mt-1">8.82 / 10.0</div>
                <span className="text-[10px] text-slate-500">Current Term Performance</span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Cumulative CGPA</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">8.65 / 10.0</div>
                <span className="text-[10px] text-slate-500">Overall Degree Standing</span>
              </div>
              <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-purple-800 uppercase">Earned Credits</span>
                <div className="text-2xl font-black text-purple-800 mt-1">68 / 68</div>
                <span className="text-[10px] text-slate-500">100% Credit Completion</span>
              </div>
              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-900 uppercase">Class Award</span>
                <div className="text-base font-black text-amber-950 mt-2">First Division ★</div>
                <span className="text-[10px] text-slate-500">With Academic Distinction</span>
              </div>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-[#00236f] text-white font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Paper Code</th>
                    <th className="p-3">Subject Title</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Internal (40)</th>
                    <th className="p-3">External (60)</th>
                    <th className="p-3">Total (100)</th>
                    <th className="p-3">Letter Grade</th>
                    <th className="p-3">Grade Point</th>
                    <th className="p-3">Credit Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#00236f]">CS-301</td>
                    <td className="p-3 font-semibold text-slate-900">Data Structures & Algorithmic Foundations</td>
                    <td className="p-3">4</td>
                    <td className="p-3">38</td>
                    <td className="p-3">54</td>
                    <td className="p-3 font-bold text-slate-900">92</td>
                    <td className="p-3 font-black text-emerald-700">A+</td>
                    <td className="p-3 font-bold">9</td>
                    <td className="p-3 font-bold">36</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#00236f]">CS-302</td>
                    <td className="p-3 font-semibold text-slate-900">Computer Architecture & Assembly Language</td>
                    <td className="p-3">4</td>
                    <td className="p-3">35</td>
                    <td className="p-3">49</td>
                    <td className="p-3 font-bold text-slate-900">84</td>
                    <td className="p-3 font-black text-blue-700">A</td>
                    <td className="p-3 font-bold">8</td>
                    <td className="p-3 font-bold">32</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#00236f]">CS-303</td>
                    <td className="p-3 font-semibold text-slate-900">Operating Systems & System Programming</td>
                    <td className="p-3">4</td>
                    <td className="p-3">39</td>
                    <td className="p-3">56</td>
                    <td className="p-3 font-bold text-slate-900">95</td>
                    <td className="p-3 font-black text-purple-700">O (Outstanding)</td>
                    <td className="p-3 font-bold">10</td>
                    <td className="p-3 font-bold">40</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#00236f]">CS-304</td>
                    <td className="p-3 font-semibold text-slate-900">Object Oriented Software Engineering</td>
                    <td className="p-3">4</td>
                    <td className="p-3">32</td>
                    <td className="p-3">44</td>
                    <td className="p-3 font-bold text-slate-900">76</td>
                    <td className="p-3 font-black text-slate-700">B+</td>
                    <td className="p-3 font-bold">7</td>
                    <td className="p-3 font-bold">28</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#00236f]">CS-305</td>
                    <td className="p-3 font-semibold text-slate-900">Discrete Mathematical Structures</td>
                    <td className="p-3">4</td>
                    <td className="p-3">34</td>
                    <td className="p-3">50</td>
                    <td className="p-3 font-bold text-slate-900">84</td>
                    <td className="p-3 font-black text-blue-700">A</td>
                    <td className="p-3 font-bold">8</td>
                    <td className="p-3 font-bold">32</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#00236f]">CS-306</td>
                    <td className="p-3 font-semibold text-slate-900">Data Structures Practicum Laboratory</td>
                    <td className="p-3">2</td>
                    <td className="p-3">48</td>
                    <td className="p-3">46</td>
                    <td className="p-3 font-bold text-slate-900">94</td>
                    <td className="p-3 font-black text-purple-700">O (Outstanding)</td>
                    <td className="p-3 font-bold">10</td>
                    <td className="p-3 font-bold">20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
