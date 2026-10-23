import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { User, StudentProfile, ActiveScreen } from '../types';
import { Lock, Unlock, AlertOctagon, CheckCircle2, Phone } from 'lucide-react';

interface StaffDashboardViewProps {
  currentUser: User | null;
  onNavigate: (screen: ActiveScreen) => void;
  selectedCampus?: 'campus_01' | 'campus_02' | 'all';
  onCampusChange?: (c: 'campus_01' | 'campus_02' | 'all') => void;
}

interface StudentAttendanceEntry {
  id: string;
  studentId: string;
  name: string;
  course: string;
  semester: number;
  attended: number;
  total: number;
  currentPct: number;
  status: 'P' | 'A' | 'M'; // Present, Absent, Medical/On-Duty
  mst1: number; // max 24
  mst2: number; // max 24
  assignment: number; // max 12
  isMentee?: boolean;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({
  currentUser,
  onNavigate,
  selectedCampus = 'campus_01',
  onCampusChange,
}) => {
  const isCounselor = currentUser?.role === 'counselor';
  const isHOD = currentUser?.role === 'hod';

  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const urlTab = (rawTab === 'marks' ? 'sessional' : rawTab) as
    | 'attendance'
    | 'sessional'
    | 'mentees'
    | 'schedule'
    | 'queue'
    | 'leads'
    | 'scholars'
    | 'feematrix'
    | null;

  const [activeTab, setActiveTab] = useState<
    'attendance' | 'sessional' | 'mentees' | 'schedule' | 'queue' | 'leads' | 'scholars' | 'feematrix'
  >(() => {
    if (urlTab) return urlTab;
    return isCounselor ? 'queue' : 'attendance';
  });

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else if (isCounselor && ['attendance', 'sessional', 'mentees', 'schedule'].includes(activeTab)) {
      setActiveTab('queue');
    }
  }, [urlTab, isCounselor]);
  const [selectedCourse, setSelectedCourse] = useState('CS-401');
  const [lectureDate, setLectureDate] = useState(new Date().toISOString().slice(0, 10));
  const [lectureSlot, setLectureSlot] = useState('Period 2 • 10:00 AM - 11:00 AM (LT-204)');
  const [lectureTopic, setLectureTopic] = useState('BGP Autonomous Systems & Inter-Domain Routing');
  const [students, setStudents] = useState<StudentAttendanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingLocked, setIsEditingLocked] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [followupStats, setFollowupStats] = useState<{ overdue: number; due_today: number; total_prospects: number } | null>(null);

  // Counselor Dedicated Workspace State
  const [counselorProspects, setCounselorProspects] = useState<any[]>([]);
  const [counselorEnquiries, setCounselorEnquiries] = useState<any[]>([]);
  const [counselorScholars, setCounselorScholars] = useState<any[]>([]);
  const [counselorFeeHeads, setCounselorFeeHeads] = useState<any[]>([]);
  const [counselorLoading, setCounselorLoading] = useState(false);
  const [counselorQueueFilter, setCounselorQueueFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [counselorSearch, setCounselorSearch] = useState('');

  // Counselor Log Call Modal
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);
  const [callTargetProspect, setCallTargetProspect] = useState<any | null>(null);
  const [callForm, setCallForm] = useState({
    interaction_type: 'phone',
    outcome: 'interested',
    notes: '',
    next_followup_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    priority: 'p1_high',
  });
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  // Counselor Walk-in Lead Creation Modal
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    student_name: '',
    mobile: '',
    email: '',
    selected_course: 'B.Tech Computer Science & Engineering',
    father_name: '',
    tenth_percentage: '82.5',
    twelfth_percentage: '85.0',
    notes: 'Walk-in campus counseling inquiry',
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Counselor Fee Calculator State
  const [calcCourse, setCalcCourse] = useState('cse');
  const [calcPct, setCalcPct] = useState(85);
  const [calcIsPms, setCalcIsPms] = useState(false);

  const loadCounselorData = async () => {
    if (!isCounselor) return;
    setCounselorLoading(true);
    try {
      const [radarRes, enqRes, stuRes, feeRes] = await Promise.all([
        api.getFollowupRadar().catch(() => ({ success: false } as any)),
        api.getEnquiries().catch(() => ({ success: false } as any)),
        api.getStudents({ limit: 50 }).catch(() => ({ success: false } as any)),
        api.getFeeHeads().catch(() => ({ success: false } as any)),
      ]);
      if (radarRes.success && radarRes.prospects) {
        setCounselorProspects(radarRes.prospects);
      }
      if (radarRes.stats) {
        setFollowupStats(radarRes.stats);
      }
      if (enqRes.success && enqRes.enquiries) {
        setCounselorEnquiries(enqRes.enquiries);
      }
      if (stuRes.success && stuRes.students) {
        setCounselorScholars(stuRes.students);
      }
      if (feeRes.success && feeRes.feeHeads) {
        setCounselorFeeHeads(feeRes.feeHeads);
      }
    } catch (err: any) {
      console.error('Error loading counselor data:', err);
    } finally {
      setCounselorLoading(false);
    }
  };

  useEffect(() => {
    if (isCounselor) {
      loadCounselorData();
    }
  }, [isCounselor]);

  const handleOpenLogCall = (prospect: any) => {
    setCallTargetProspect(prospect);
    setCallForm({
      interaction_type: 'phone',
      outcome: 'interested',
      notes: '',
      next_followup_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      priority: 'p1_high',
    });
    setIsLogCallOpen(true);
  };

  const handleLogCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTargetProspect) return;
    setIsSubmittingCall(true);
    try {
      const res = await api.logFollowup(callTargetProspect.id, callForm);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Telephony call interaction recorded for candidate ${callTargetProspect.first_name || callTargetProspect.student_name}. Callback updated.`,
        });
        setIsLogCallOpen(false);
        loadCounselorData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to record call interaction.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error recording call.' });
    } finally {
      setIsSubmittingCall(false);
    }
  };

  const handleQuickPing = async (prospect: any) => {
    try {
      const res = await api.sendRecallNotice(prospect.id);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Priority admissions reminder notice dispatched to ${prospect.first_name || prospect.student_name} (${prospect.phone || prospect.mobile}).`,
        });
        loadCounselorData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to dispatch notice.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error dispatching recall notice.' });
    }
  };

  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.student_name.trim() || !newLeadForm.mobile.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Candidate Name and Mobile are mandatory.' });
      return;
    }
    setIsSubmittingLead(true);
    try {
      const res = await api.createEnquiry({
        student_name: newLeadForm.student_name.trim(),
        mobile: newLeadForm.mobile.trim(),
        email: newLeadForm.email.trim() || undefined,
        selected_course: newLeadForm.selected_course,
        father_name: newLeadForm.father_name.trim() || undefined,
        remarks: `[Walk-in Inquiry] 10th: ${newLeadForm.tenth_percentage}%, 12th: ${newLeadForm.twelfth_percentage}%. ${newLeadForm.notes}`,
      });
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Walk-in prospect ${newLeadForm.student_name} successfully registered with Lead Token ${res.enquiry?.token_number || 'ENQ-NEW'}.`,
        });
        setIsNewLeadModalOpen(false);
        setNewLeadForm({
          student_name: '',
          mobile: '',
          email: '',
          selected_course: 'B.Tech Computer Science & Engineering',
          father_name: '',
          tenth_percentage: '82.5',
          twelfth_percentage: '85.0',
          notes: 'Walk-in campus counseling inquiry',
        });
        loadCounselorData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to register prospect.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error creating lead.' });
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Persistent register locks tracking (Course + Date + Slot)
  const [lockedRegisters, setLockedRegisters] = useState<Record<string, {
    lockedAt: string;
    topic: string;
    summary: { present: number; absent: number; medical: number };
    entries?: Record<string, 'P' | 'A' | 'M'>;
  }>>({});

  const currentSlotKey = `${selectedCourse}_${lectureDate}_${lectureSlot}`;
  const lockedRecord = lockedRegisters[currentSlotKey];
  const isLocked = Boolean(lockedRecord) && !isEditingLocked;

  // Load live students & locked registers from DB
  useEffect(() => {
    loadStudents();
    api.getFollowupRadar().then(res => {
      if (res.success && res.stats) {
        setFollowupStats(res.stats);
      }
    }).catch(() => {});

    api.getLockedAttendanceRegisters(selectedCourse).then(res => {
      if (res.success && Array.isArray(res.registers)) {
        const regMap: Record<string, any> = {};
        for (const r of res.registers) {
          let summary = { present: 0, absent: 0, medical: 0 };
          let entries = {};
          try { summary = JSON.parse(r.summaryJson || '{}'); } catch {}
          try { entries = JSON.parse(r.entriesJson || '{}'); } catch {}
          regMap[r.registerKey] = {
            lockedAt: r.lockedAt,
            topic: r.topic,
            summary,
            entries,
          };
        }
        setLockedRegisters(prev => ({ ...prev, ...regMap }));
      }
    }).catch(() => {});
  }, [selectedCourse]);

  // When slot or date or course changes, restore registered entries or reset to P
  useEffect(() => {
    setIsEditingLocked(false);
    if (lockedRecord?.entries) {
      setStudents(prev =>
        prev.map(s => ({
          ...s,
          status: lockedRecord.entries?.[s.id] || lockedRecord.entries?.[s.studentId] || 'P',
        }))
      );
    } else {
      setStudents(prev => prev.map(s => ({ ...s, status: 'P' })));
    }
  }, [currentSlotKey]);

  const AVAILABLE_FACULTY_SUBJECTS = [
    { code: 'CS-301', name: 'Data Structures & Algorithmic Foundations (Sem 3 • Sec A)', semester: 3, course: 'B.Tech CS' },
    { code: 'CS-401', name: 'Distributed Cloud Architecture (Sem 4 • Sec A)', semester: 4, course: 'B.Tech CS' },
    { code: 'CS-402', name: 'Advanced Relational DBMS & MariaDB (Sem 4 • Sec B)', semester: 4, course: 'B.Tech CS' },
    { code: 'CS-501', name: 'Operating Systems & System Programming (Sem 5 • Sec A)', semester: 5, course: 'B.Tech CS' },
    { code: 'CS-601', name: 'Software Engineering & Agile Methodologies (Sem 6 • Sec A)', semester: 6, course: 'B.Tech CS' },
    { code: 'EC-401', name: 'Digital Signal Processing & Microcontrollers (Sem 4 • Sec A)', semester: 4, course: 'B.Tech ECE' },
    { code: 'ME-401', name: 'Fluid Mechanics & Thermal Engineering (Sem 4 • Sec A)', semester: 4, course: 'B.Tech ME' },
  ];

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const activeSub = AVAILABLE_FACULTY_SUBJECTS.find(s => s.code === selectedCourse);
      const courseFilter = activeSub ? activeSub.course : (selectedCourse.startsWith('CS') ? 'B.Tech CS' : selectedCourse);
      const semesterFilter = activeSub ? activeSub.semester : 4;
      const [stuRes, markRes] = await Promise.all([
        api.getStudents({ course: courseFilter, semester: semesterFilter, limit: 100 }),
        api.getSessionalMarks({ courseCode: selectedCourse, semester: semesterFilter }).catch(() => ({ success: false, marks: [] })),
      ]);
      let res = stuRes;
      if (!res.success || !res.students || res.students.length === 0) {
        res = await api.getStudents({ course: courseFilter, limit: 100 });
      }
      if (!res.success || !res.students || res.students.length === 0) {
        res = await api.getStudents({ limit: 100 });
      }
      const existingMarksMap = new Map();
      if (markRes.success && markRes.marks) {
        markRes.marks.forEach((m: any) => existingMarksMap.set(m.studentId, m));
      }
      if (res.success && res.students) {
        const mapped: StudentAttendanceEntry[] = res.students.map((s: any, idx: number) => {
          const attended = s.attended_classes ?? 0;
          const total = s.total_classes ?? 0;
          const pct = total === 0 ? (s.attendance_percentage ?? 100) : Math.round((attended / total) * 100);
          const savedMark = existingMarksMap.get(s.id) || existingMarksMap.get(s.student_id);
          return {
            id: s.id,
            studentId: s.student_id,
            name: `${s.first_name} ${s.last_name}`,
            course: s.course?.code || 'B.Tech CS',
            semester: s.current_semester || 4,
            attended,
            total,
            currentPct: pct,
            status: 'P',
            mst1: savedMark ? savedMark.mst1 : Math.min(24, Math.max(12, Math.round(18 + (idx % 6)))),
            mst2: savedMark ? savedMark.mst2 : Math.min(24, Math.max(10, Math.round(17 + (idx % 7)))),
            assignment: savedMark ? savedMark.assignment : Math.min(12, Math.max(8, Math.round(9 + (idx % 4)))),
            isMentee: idx < 6 || s.first_name.toLowerCase() === 'aryan',
          };
        });
        setStudents(mapped);
      }
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle single student status
  const handleStatusChange = (id: string, newStatus: 'P' | 'A' | 'M') => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  // Batch attendance helpers
  const handleMarkAll = (status: 'P' | 'A') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  // Calculate projected attendance
  const getProjectedAttendance = (student: StudentAttendanceEntry) => {
    const isAttendedToday = student.status === 'P' || student.status === 'M';
    const isSlotAlreadySubmitted = Boolean(lockedRecord);
    const newTotal = isSlotAlreadySubmitted ? student.total : student.total + 1;
    const newAttended = isSlotAlreadySubmitted ? student.attended : student.attended + (isAttendedToday ? 1 : 0);
    return newTotal > 0 ? Math.round((newAttended / newTotal) * 100) : 100;
  };

  // Submit Daily Lecture Attendance in ONE atomic batch call
  const handleSubmitAttendance = async () => {
    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const isSlotAlreadySubmitted = Boolean(lockedRecord);
      const prevEntries = lockedRecord?.entries || {};

      const updates = students.map(student => {
        const isAttendedToday = student.status === 'P' || student.status === 'M';
        let newTotal = student.total;
        let newAttended = student.attended;

        if (isSlotAlreadySubmitted) {
          const prevStatus = prevEntries[student.id] || prevEntries[student.studentId] || 'P';
          const wasAttended = prevStatus === 'P' || prevStatus === 'M';
          if (wasAttended && !isAttendedToday) {
            newAttended = Math.max(0, student.attended - 1);
          } else if (!wasAttended && isAttendedToday) {
            newAttended = Math.min(student.total, student.attended + 1);
          }
        } else {
          newTotal = student.total + 1;
          newAttended = student.attended + (isAttendedToday ? 1 : 0);
        }

        const newPct = newTotal > 0 ? Math.round((newAttended / newTotal) * 100) : student.currentPct;

        return {
          studentId: student.id,
          status: student.status,
          attendedClasses: newAttended,
          totalClasses: newTotal,
          attendancePercentage: newPct,
        };
      });

      const res = await api.bulkUpdateAttendance({
        courseCode: selectedCourse,
        lectureDate,
        lectureSlot,
        topic: lectureTopic,
        updates,
      });

      if (res.success) {
        // 1. Update students in-place: update counts, PRESERVE selected statuses without unmounting!
        if (res.updatedStudents && res.updatedStudents.length > 0) {
          setStudents(prev =>
            prev.map(s => {
              const match = res.updatedStudents.find((u: any) => u.id === s.id || u.studentId === s.studentId);
              if (match) {
                return {
                  ...s,
                  attended: match.attendedClasses,
                  total: match.totalClasses,
                  currentPct: match.attendancePercentage,
                };
              }
              return s;
            })
          );
        }

        // 2. Lock this slot persistently with student entries map
        const entriesMap = students.reduce((acc, s) => {
          acc[s.id] = s.status;
          acc[s.studentId] = s.status;
          return acc;
        }, {} as Record<string, 'P' | 'A' | 'M'>);

        const lockInfo = {
          lockedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          topic: lectureTopic,
          summary: {
            present: presentCount,
            absent: absentCount,
            medical: medicalCount,
          },
          entries: entriesMap,
        };

        setLockedRegisters(prev => ({ ...prev, [currentSlotKey]: lockInfo }));

        setIsEditingLocked(false);
        setFeedbackMessage({
          type: 'success',
          text: `Official Attendance Register locked & permanently recorded in institutional database! ${presentCount} Present, ${absentCount} Absent, ${medicalCount} On-Duty for ${selectedCourse} (${lectureSlot}).`,
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to submit lecture attendance.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to submit lecture attendance.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sessional Marks update
  const handleMarksChange = (id: string, field: 'mst1' | 'mst2' | 'assignment', val: number) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const max = field === 'assignment' ? 12 : 24;
        const clamped = Math.max(0, Math.min(max, isNaN(val) ? 0 : val));
        return { ...s, [field]: clamped };
      })
    );
  };

  const handleSaveSessionalMarks = async () => {
    try {
      const payload = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        courseCode: selectedCourse,
        semester: s.semester,
        mst1: s.mst1 || 0,
        mst2: s.mst2 || 0,
        assignment: s.assignment || 0,
      }));
      const res = await api.saveSessionalMarks(payload);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Internal sessional marks for ${selectedCourse} saved and locked in database for University audit! (${payload.length} scholars recorded)`,
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to save sessional marks to database.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Network error saving sessional marks.',
      });
    }
  };

  // Sessional grade calculator (out of 60)
  const getGradeInfo = (totalMarks: number) => {
    const pct = (totalMarks / 60) * 100;
    if (pct >= 90) return { grade: 'O', text: 'Outstanding', color: 'text-[#00236f] bg-[#ffedd5]' };
    if (pct >= 80) return { grade: 'A+', text: 'Excellent', color: 'text-[#00236f] bg-[#dce1ff]' };
    if (pct >= 70) return { grade: 'A', text: 'Very Good', color: 'text-[#00236f] bg-[#dce1ff]' };
    if (pct >= 60) return { grade: 'B+', text: 'Good', color: 'text-[#535f70] bg-[#e1e3e4]' };
    if (pct >= 50) return { grade: 'B', text: 'Above Average', color: 'text-[#535f70] bg-[#e1e3e4]' };
    if (pct >= 40) return { grade: 'P', text: 'Pass', color: 'text-[#755b00] bg-[#fae29f]' };
    return { grade: 'F', text: 'Backlog Risk', color: 'text-[#ba1a1a] bg-[#ffdad6]' };
  };

  const presentCount = students.filter(s => s.status === 'P').length;
  const absentCount = students.filter(s => s.status === 'A').length;
  const medicalCount = students.filter(s => s.status === 'M').length;

  const userInitials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .filter(Boolean)
        .map(n => n[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : isCounselor
    ? 'AC'
    : isHOD
    ? 'HD'
    : 'SR';

  const roleTitleBadge = isCounselor
    ? 'Senior Admissions Counselor'
    : isHOD
    ? 'Head of Department (HOD)'
    : 'Faculty & Academic Staff';

  const departmentDesignation = isCounselor
    ? 'Senior Outreach & Counseling Officer • Admissions Directorate'
    : isHOD
    ? 'Head of Department & Professor • Dept. of Computer Science & Engineering'
    : 'Assistant Professor • Dept. of Computer Science & Engineering';

  const officeLocation = isCounselor
    ? 'Admissions Reception Desk 101'
    : isHOD
    ? 'HOD Chamber, Block B-301'
    : 'Block B, Faculty Room 204';

  return (
    <div id="staff-dashboard-screen" className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Faculty / Counselor Persona Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#e1e3e4] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#00236f] to-[#1a4bb0] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            <span>{userInitials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-[#191c1d] tracking-tight">
                {currentUser?.full_name || (isCounselor ? 'Admissions Counselor' : isHOD ? 'Dr. HOD Computer Science' : 'Prof. Sunita Rao')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffedd5] text-[#00236f]">
                {roleTitleBadge}
              </span>
            </div>
            <p className="text-sm text-[#444651] font-medium mt-1">
              {departmentDesignation}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#757682]">
              <span className="flex items-center gap-1">
                <span>UID: {currentUser?.enterprise_uid || '2001-14-03-01'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span>📍 {selectedCampus === 'campus_02' ? 'Faridkot Campus 02 (Regional)' : selectedCampus === 'all' ? 'All Campuses (Consolidated)' : 'Bathinda Campus 01 (Main)'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span>{officeLocation}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span>Fall Session 2025-26</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI stats (Dynamic for Counselor vs Faculty) */}
        {isCounselor ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
            <div
              onClick={() => onNavigate('enquiries')}
              className="bg-[#f8f9fa] border border-[#edeeef] hover:border-[#00236f] p-3 rounded-xl text-center min-w-[95px] cursor-pointer transition-all shadow-2xs hover:bg-white"
            >
              <span className="text-xl font-extrabold text-[#00236f] block leading-none">
                {followupStats?.total_prospects || 128}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                Total Leads
              </span>
            </div>
            <div
              onClick={() => onNavigate('enquiries')}
              className="bg-[#f8f9fa] border border-[#edeeef] hover:border-[#ba1a1a] p-3 rounded-xl text-center min-w-[95px] cursor-pointer transition-all shadow-2xs hover:bg-white"
            >
              <span className="text-xl font-extrabold text-[#ba1a1a] block leading-none">
                {followupStats?.overdue || 0}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                Overdue
              </span>
            </div>
            <div
              onClick={() => onNavigate('enquiries')}
              className="bg-[#f8f9fa] border border-[#edeeef] hover:border-[#755b00] p-3 rounded-xl text-center min-w-[95px] cursor-pointer transition-all shadow-2xs hover:bg-white"
            >
              <span className="text-xl font-extrabold text-[#755b00] block leading-none">
                {followupStats?.due_today || 0}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                Due Today
              </span>
            </div>
            <div
              onClick={() => onNavigate('manage-students')}
              className="bg-[#f8f9fa] border border-[#edeeef] hover:border-emerald-600 p-3 rounded-xl text-center min-w-[95px] cursor-pointer transition-all shadow-2xs hover:bg-white"
            >
              <span className="text-xl font-extrabold text-emerald-700 block leading-none">
                48
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                Enrolled
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-[#f8f9fa] border border-[#edeeef] p-3 rounded-xl text-center min-w-[95px]">
              <span className="text-xl font-extrabold text-[#00236f] block leading-none">2</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                Teaching Courses
              </span>
            </div>
            <div className="bg-[#f8f9fa] border border-[#edeeef] p-3 rounded-xl text-center min-w-[95px]">
              <span className="text-xl font-extrabold text-[#00236f] block leading-none">120</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                Students Taught
              </span>
            </div>
            <div className="bg-[#f8f9fa] border border-[#edeeef] p-3 rounded-xl text-center min-w-[95px]">
              <span className="text-xl font-extrabold text-[#755b00] block leading-none">18</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                Proctor Mentees
              </span>
            </div>
            <div
              onClick={() => onNavigate('enquiries')}
              className="bg-[#f8f9fa] border border-[#edeeef] hover:border-[#00236f] p-3 rounded-xl text-center min-w-[95px] cursor-pointer transition-all shadow-2xs hover:bg-white"
              title="Click to open Admissions Prospect CRM & Follow-Up Radar"
            >
              <span
                className={`text-xl font-extrabold block leading-none ${
                  (followupStats?.overdue || 0) > 0 ? 'text-[#ba1a1a] animate-pulse' : 'text-[#00236f]'
                }`}
              >
                {(followupStats?.overdue || 0) + (followupStats?.due_today || 0)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#757682] mt-1 block">
                {(followupStats?.overdue || 0) > 0 ? 'Urgent Recalls' : 'Admissions CRM'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Bar (Dynamic for Counselor vs Faculty) */}
      {isCounselor ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('enquiries')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Prospect CRM & Telephony Desk
              </h4>
              <p className="text-[10px] text-[#757682]">Lead Lifecycle, Call Logs & Recall Radar</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('bulk-import')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Bulk Lead Ingestion & Allocation
              </h4>
              <p className="text-[10px] text-[#757682]">CSV Upload, Dedup Engine & Ownership</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('admissions')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Admissions Intake & Verifications
              </h4>
              <p className="text-[10px] text-[#757682]">Form Attestation, Quotas & Seat Approval</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('manage-students')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Enrolled Scholars Directory
              </h4>
              <p className="text-[10px] text-[#757682]">Scholar Profiles, Batch & Roll Search</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('fee-ledger')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Tuition & Fee Head Register
              </h4>
              <p className="text-[10px] text-[#757682]">Fee Demands, Scholarships & Dues</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('grievances')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Grievance & Student Support
              </h4>
              <p className="text-[10px] text-[#757682]">Escalations, AICTE Ombudsperson Desk</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('teacher-documents')}
            className="p-3 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Faculty Credentials Vault
              </h4>
              <p className="text-[10px] text-[#757682]">AICTE ID, Ph.D. Awards, Scopus Papers</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('student-quiz-lms')}
            className="p-3 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                LMS & CBT Assessment
              </h4>
              <p className="text-[10px] text-[#757682]">Mid-Term CBT Quizzes & Question Banks</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('student-documents')}
            className="p-3 bg-white hover:bg-slate-50 border border-[#e1e3e4] hover:border-[#00236f]/40 rounded-xl text-left flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
          >
            <div>
              <h4 className="text-xs font-bold text-[#191c1d] group-hover:text-[#00236f] transition-colors">
                Student Document Vault
              </h4>
              <p className="text-[10px] text-[#757682]">Statutory & 85% Domicile Verification</p>
            </div>
            <span className="font-bold text-[11px] text-[#757682] group-hover:text-[#00236f] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </button>
        </div>
      )}

      {/* Admissions Recall Radar Alert Banner for Faculty & Counselors */}
      {((followupStats?.overdue || 0) > 0 || (followupStats?.due_today || 0) > 0) && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            
            <div>
              <strong className="text-amber-900 font-bold">Admissions Recall Radar Alert:</strong>{' '}
              <span className="text-amber-900/90">{followupStats?.overdue || 0} candidate callbacks overdue and {followupStats?.due_today || 0} scheduled today. Re-engage walk-in prospects within 24–48 hours to preserve intake conversion.</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('admissions')}
            className="px-3.5 py-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Open Follow-Up CRM</span>
            <span className="font-bold text-[10px]">→</span>
          </button>
        </div>
      )}

      {/* Status Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-semibold transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-[#ffedd5] border-[#ea580c] text-[#00236f]'
              : 'bg-[#ffdad6] border-[#ffdad6] text-[#ba1a1a]'
          }`}
        >
          <div className="flex items-center gap-2">
            
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Console Tab Bar: Dynamic for Counselor vs Faculty */}
      {isCounselor ? (
        <div className="flex border-b border-[#e1e3e4] gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'queue'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Recall Radar & Callback Queue</span>
            <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
              (followupStats?.overdue || 0) > 0 ? 'bg-rose-100 text-rose-800' : 'bg-[#00236f]/10 text-[#00236f]'
            }`}>
              {(followupStats?.overdue || 0) + (followupStats?.due_today || 0)} Urgent
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leads'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Walk-in Prospects Radar</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-bold">
              {counselorEnquiries.length || followupStats?.total_prospects || 128} Leads
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scholars')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'scholars'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Counseling Scholars Roster</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
              {counselorScholars.length} Enrolled
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feematrix')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'feematrix'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Course Fee & Scholarship Guidance</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 bg-blue-100 text-[#00236f] rounded-full font-bold">
              PMS / Merit Slabs
            </span>
          </button>
        </div>
      ) : (
        <div className="flex border-b border-[#e1e3e4] gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Daily Lecture Attendance</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-[#00236f]/10 rounded-full font-bold">
              Live Register
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sessional')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'sessional'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Mid-Semester Test & Sessional</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-[#ea580c]/10 text-[#00236f] rounded-full font-bold">
              60 Marks
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mentees')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'mentees'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Mentee / Proctor Group</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            <span>Teaching Timetable</span>
          </button>
        </div>
      )}

      {/* COUNSELOR TAB 1: RECALL RADAR & CALLBACK QUEUE */}
      {isCounselor && activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#757682] mr-1">Filter Queue:</span>
              {(['all', 'overdue', 'today', 'upcoming'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCounselorQueueFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                    counselorQueueFilter === f
                      ? 'bg-[#00236f] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {f === 'all' ? 'All Callbacks' : f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search candidate name, mobile, course..."
                value={counselorSearch}
                onChange={e => setCounselorSearch(e.target.value)}
                className="w-full sm:w-64 px-3 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-medium text-[#191c1d] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00236f]"
              />
              <button
                type="button"
                onClick={loadCounselorData}
                disabled={counselorLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer shrink-0"
              >
                {counselorLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Prospects Queue Cards */}
          <div className="space-y-2.5">
            {counselorProspects
              .filter(p => {
                const nameMatch = !counselorSearch || (
                  (p.first_name || p.student_name || '').toLowerCase().includes(counselorSearch.toLowerCase()) ||
                  (p.phone || p.mobile || '').includes(counselorSearch) ||
                  (p.course?.name || p.course_name || '').toLowerCase().includes(counselorSearch.toLowerCase())
                );
                if (!nameMatch) return false;
                const today = new Date().toISOString().slice(0, 10);
                if (counselorQueueFilter === 'overdue') {
                  return p.next_followup_date && p.next_followup_date < today;
                }
                if (counselorQueueFilter === 'today') {
                  return p.next_followup_date === today;
                }
                if (counselorQueueFilter === 'upcoming') {
                  return p.next_followup_date && p.next_followup_date > today;
                }
                return true;
              })
              .map((p: any) => {
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = p.next_followup_date && p.next_followup_date < today;
                const isDueToday = p.next_followup_date === today;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white ${
                      isOverdue
                        ? 'border-rose-300 bg-rose-50/20 shadow-2xs'
                        : isDueToday
                        ? 'border-amber-300 bg-amber-50/20 shadow-2xs'
                        : 'border-[#e1e3e4] hover:border-[#00236f]/40 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-[#191c1d] text-sm">
                          {p.first_name || p.student_name} {p.last_name || ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : isDueToday
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-[#00236f]'
                          }`}
                        >
                          {isOverdue ? 'Overdue Callback' : isDueToday ? 'Callback Due Today' : 'Scheduled'}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.phone || p.mobile}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-[#00236f] font-bold">
                          Course: {p.course?.name || p.course_name || 'B.Tech CSE'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">
                          Scheduled: <strong className="font-semibold text-slate-800">{p.next_followup_date || today}</strong>
                        </span>
                        {p.last_followup_outcome && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">
                              Last Call: <strong className="text-slate-700 capitalize">{p.last_followup_outcome.replace(/_/g, ' ')}</strong>
                            </span>
                          </>
                        )}
                      </div>
                      {p.last_followup_notes && (
                        <p className="text-[11px] text-[#757682] italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                          "{p.last_followup_notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenLogCall(p)}
                        className="px-3 py-1.5 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs"
                      >
                        [LOG CALL / RECALL]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPing(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                      >
                        [QUICK SMS PING]
                      </button>
                      <a
                        href={`https://wa.me/91${(p.phone || p.mobile || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition"
                      >
                        [WHATSAPP]
                      </a>
                      <button
                        type="button"
                        onClick={() => onNavigate('admissions')}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold cursor-pointer transition"
                      >
                        [ENROLL SCHOLAR &rarr;]
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* COUNSELOR TAB 2: WALK-IN PROSPECTS RADAR */}
      {isCounselor && activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#191c1d]">Walk-in Admissions Prospects & Enquiries</h3>
              <p className="text-xs text-[#757682]">Direct walk-in candidate registrations and qualification records</p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="px-4 py-2 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs flex items-center gap-1.5"
            >
              <span className="text-sm font-black">+</span>
              <span>Register Walk-in Lead</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#e1e3e4]">
              <thead className="bg-[#f8f9fa] text-[#757682] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Lead Token</th>
                  <th className="p-3.5">Candidate Name</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Interested Course</th>
                  <th className="p-3.5">Qualification Scores</th>
                  <th className="p-3.5">Lead Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {counselorEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#757682]">
                      No walk-in leads found. Click "+ Register Walk-in Lead" to add a new prospect.
                    </td>
                  </tr>
                ) : (
                  counselorEnquiries.map((enq: any) => (
                    <tr key={enq.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#00236f]">{enq.token_number || String(enq.id || 'ENQ').slice(0, 8)}</td>
                      <td className="p-3.5">
                        <strong className="text-[#191c1d] block">{enq.student_name}</strong>
                        {enq.father_name && <span className="text-[10px] text-slate-500">S/D of {enq.father_name}</span>}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{enq.mobile}</span>
                        </span>
                        {enq.email && <span className="text-[10px] text-slate-500">{enq.email}</span>}
                      </td>
                      <td className="p-3.5 font-semibold text-[#00236f]">{enq.selected_course || 'B.Tech CSE'}</td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-semibold">
                          {enq.remarks?.match(/10th:\s*[\d.]+%/) ? String(enq.remarks || '').slice(0, 24) : 'Class 12: 85%'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-[#00236f] border border-blue-200 rounded-full font-bold text-[10px] uppercase">
                          {enq.status || 'Walk-in'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenLogCall(enq)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          [LOG CALL]
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('admissions')}
                          className="px-2.5 py-1 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          [INTAKE DESK]
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COUNSELOR TAB 3: COUNSELING SCHOLARS ROSTER */}
      {isCounselor && activeTab === 'scholars' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#191c1d]">Counseling Scholars Roster & Intake Conversion</h3>
              <p className="text-xs text-[#757682]">Direct list of admitted scholars enrolled via admissions counseling cell</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('manage-students')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Open Full Master Directory &rarr;
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#e1e3e4]">
              <thead className="bg-[#f8f9fa] text-[#757682] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Canonical UID</th>
                  <th className="p-3.5">Scholar Name</th>
                  <th className="p-3.5">Course & Semester</th>
                  <th className="p-3.5">Intake Status</th>
                  <th className="p-3.5">Fee Clearance</th>
                  <th className="p-3.5">Document Vault</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {counselorScholars.map((stu: any) => (
                  <tr key={stu.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#00236f]">{stu.enterprise_uid || stu.student_id}</td>
                    <td className="p-3.5">
                      <strong className="text-[#191c1d] block">{stu.first_name} {stu.last_name}</strong>
                      <span className="text-[10px] text-slate-500">{stu.email}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{stu.course?.code || 'B.Tech CSE'}</span>
                      <span className="text-slate-500 block text-[10px]">Semester {stu.current_semester || 1}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px] uppercase">
                        {stu.admission_status || 'Enrolled'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        stu.fees_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {stu.fees_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#00236f] rounded-full font-bold text-[10px]">
                        {stu.documents_verified ? 'Verified' : 'Pending Scrutiny'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigate(`manage-students?search=${encodeURIComponent(stu.student_id || stu.first_name)}` as any)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        [DOSSIER]
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate(`fee-ledger?studentId=${encodeURIComponent(stu.id)}` as any)}
                        className="px-2.5 py-1 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        [FEES]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COUNSELOR TAB 4: COURSE FEE GUIDANCE & SCHOLARSHIP MATRIX */}
      {isCounselor && activeTab === 'feematrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Fee Assessment Calculator */}
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#191c1d]">Walk-in Fee & Scholarship Calculator</h4>
                <p className="text-xs text-[#757682] mt-0.5">Instant tuition calculation for visiting parents</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#757682] block mb-1">Select Academic Course</label>
                  <select
                    value={calcCourse}
                    onChange={e => setCalcCourse(e.target.value)}
                    className="w-full p-2 border border-[#e1e3e4] rounded-lg text-xs font-semibold text-[#191c1d]"
                  >
                    <option value="cse">B.Tech Computer Science & Engg (₹45,000 / sem)</option>
                    <option value="ece">B.Tech Electronics & Comm (₹42,000 / sem)</option>
                    <option value="mba">Master of Business Administration (₹40,000 / sem)</option>
                    <option value="bca">Bachelor of Computer Applications (₹25,000 / sem)</option>
                    <option value="mca">Master of Computer Applications (₹35,000 / sem)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#757682] block mb-1">
                    Class 12th Board Marks %: <strong className="text-[#00236f]">{calcPct}%</strong>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={calcPct}
                    onChange={e => setCalcPct(Number(e.target.value))}
                    className="w-full accent-[#00236f]"
                  />
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id="pms-checkbox"
                    checked={calcIsPms}
                    onChange={e => setCalcIsPms(e.target.checked)}
                    className="accent-[#00236f]"
                  />
                  <label htmlFor="pms-checkbox" className="text-xs font-semibold text-[#191c1d] cursor-pointer">
                    Eligible for Punjab PMS (SC/ST &lt; ₹2.5L)?
                  </label>
                </div>

                {/* Calculation breakdown */}
                {(() => {
                  const baseTuition = calcCourse === 'cse' ? 45000 : calcCourse === 'ece' ? 42000 : calcCourse === 'mba' ? 40000 : calcCourse === 'bca' ? 25000 : 35000;
                  let waiverPct = 0;
                  if (calcIsPms) {
                    waiverPct = 100;
                  } else if (calcPct >= 90) {
                    waiverPct = 50;
                  } else if (calcPct >= 80) {
                    waiverPct = 25;
                  } else if (calcPct >= 70) {
                    waiverPct = 15;
                  }
                  const waiverAmount = Math.round((baseTuition * waiverPct) / 100);
                  const netPayable = Math.max(0, baseTuition - waiverAmount);

                  return (
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs text-emerald-950">
                        <span>Standard Base Tuition:</span>
                        <strong className="font-mono">₹{(baseTuition || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-700">
                        <span>Scholarship Concession ({waiverPct}%):</span>
                        <strong className="font-mono">- ₹{(waiverAmount || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="border-t border-emerald-200 pt-2 flex justify-between text-sm font-extrabold text-[#00236f]">
                        <span>Net Tuition per Semester:</span>
                        <strong className="font-mono text-emerald-800">₹{(netPayable || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => onNavigate('fee-ledger')}
                  className="w-full py-2 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg text-xs font-bold transition shadow-2xs"
                >
                  Open Institutional Fee Ledger &rarr;
                </button>
              </div>
            </div>

            {/* Official Slabs Reference & Rules */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#191c1d]">Statutory Scholarships & Government Mandates</h4>
                <p className="text-xs text-[#757682] mt-0.5">Authoritative criteria for institutional counseling directorate</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                  <span className="font-bold text-xs text-[#00236f]">Punjab Post-Matric Scholarship (PMS)</span>
                  <p className="text-[11px] text-slate-700">
                    100% Tuition & University fee exemption for SC/ST students with family income under ₹2,50,000 p.a.
                  </p>
                  <span className="text-[10px] text-slate-500 font-semibold block pt-1">Requires: Freepship Card & Caste Certificate</span>
                </div>

                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                  <span className="font-bold text-xs text-amber-900">Merit Scholarship (Board &gt;= 90%)</span>
                  <p className="text-[11px] text-slate-700">
                    50% tuition waiver for top academic performers across CBSE / ICSE / PSEB secondary examinations.
                  </p>
                  <span className="text-[10px] text-slate-500 font-semibold block pt-1">Requires: Verified Original Marksheet</span>
                </div>

                <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
                  <span className="font-bold text-xs text-purple-900">Single Girl Child Concession</span>
                  <p className="text-[11px] text-slate-700">
                    Special institutional grant of ₹10,000 annual scholarship across all 4-year engineering programmes.
                  </p>
                  <span className="text-[10px] text-slate-500 font-semibold block pt-1">Requires: Notarized Tehsildar Affidavit</span>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-xs text-emerald-900">State / National Sports Quota</span>
                  <p className="text-[11px] text-slate-700">
                    25% to 50% tuition discount based on SGFI / AIU medal certification and trials committee sign-off.
                  </p>
                  <span className="text-[10px] text-slate-500 font-semibold block pt-1">Requires: Sports Directorate Attestation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY TAB 1: DAILY LECTURE ATTENDANCE REGISTER */}
      {!isCounselor && activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Select Subject */}
              <div>
                <label className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block mb-1">
                  Subject & Section
                </label>
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="bg-[#f3f4f5] border-none text-xs font-bold text-[#191c1d] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00236f] outline-none cursor-pointer"
                >
                  {AVAILABLE_FACULTY_SUBJECTS.map(sub => (
                    <option key={sub.code} value={sub.code}>
                      {sub.code}: {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lecture Date */}
              <div>
                <label className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block mb-1">
                  Lecture Date
                </label>
                <input
                  type="date"
                  value={lectureDate}
                  onChange={e => setLectureDate(e.target.value)}
                  className="bg-[#f3f4f5] border-none text-xs font-bold text-[#191c1d] rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#00236f] outline-none"
                />
              </div>

              {/* Slot */}
              <div>
                <label className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block mb-1">
                  Period / Slot
                </label>
                <select
                  value={lectureSlot}
                  onChange={e => setLectureSlot(e.target.value)}
                  className="bg-[#f3f4f5] border-none text-xs font-bold text-[#191c1d] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00236f] outline-none cursor-pointer"
                >
                  <option value="Period 2 • 10:00 AM - 11:00 AM (LT-204)">Period 2 • 10:00 AM - 11:00 AM (LT-204)</option>
                  <option value="Period 4 • 12:00 PM - 01:00 PM (Lab 3)">Period 4 • 12:00 PM - 01:00 PM (Lab 3)</option>
                  <option value="Period 6 • 02:30 PM - 03:30 PM (LT-204)">Period 6 • 02:30 PM - 03:30 PM (LT-204)</option>
                </select>
              </div>

              {/* Lecture Topic */}
              <div className="min-w-[240px]">
                <label className="text-[11px] font-bold text-[#757682] uppercase tracking-wider block mb-1">
                  Syllabus Topic Covered
                </label>
                <input
                  type="text"
                  value={lectureTopic}
                  onChange={e => setLectureTopic(e.target.value)}
                  placeholder="e.g. Unit 3: BGP Routing & Autonomous Systems"
                  className="w-full bg-[#f3f4f5] border-none text-xs font-medium text-[#191c1d] rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#00236f] outline-none"
                />
              </div>
            </div>

            {/* Quick Batch Marking Buttons & Lock status */}
            <div className="flex items-center gap-2">
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00236f] bg-[#ffedd5] px-3 py-1.5 rounded-lg border border-[#ea580c]">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Register Locked ({lockedRecord?.lockedAt})</span>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('P')}
                    className="px-3 py-1.5 bg-[#ffedd5] hover:bg-[#ffedd5] text-[#00236f] rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('A')}
                    className="px-3 py-1.5 bg-[#ffdad6] hover:bg-[#ffdad6]/80 text-[#ba1a1a] rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Locked Register Persistent Notification */}
          {lockedRecord && (
            <div className="p-4 bg-[#ffedd5] border border-[#ea580c] text-[#00236f] rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                
                <div>
                  <strong className="block font-bold text-[#00236f] text-xs">
                    Institutional Register Locked for {selectedCourse} ({lectureSlot})
                  </strong>
                  <span className="text-[#444651] text-[11px] block mt-0.5">
                    Date: {lectureDate} • Recorded: {lockedRecord.lockedAt} • Topic: "{lockedRecord.topic || lectureTopic}" •{' '}
                    <b className="text-[#00236f]">{lockedRecord.summary.present} Present</b>,{' '}
                    <b className="text-[#ba1a1a]">{lockedRecord.summary.absent} Absent</b>,{' '}
                    <b className="text-[#755b00]">{lockedRecord.summary.medical} On-Duty</b>.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingLocked(true)}
                    className="px-3 py-1.5 bg-white border border-[#ea580c] hover:bg-[#ffedd5] text-[#00236f] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Unlock Register to Edit</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 bg-[#fae29f] text-[#755b00] rounded text-[11px] font-bold">
                    Edit Mode Active
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Real-Time Lecture Register Table */}
          <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f8f9fa] border-b border-[#edeeef] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#191c1d] flex items-center gap-2">
                  <span>Student Attendance Roster</span>
                  <span className="text-xs px-2 py-0.5 bg-[#00236f]/10 text-[#00236f] rounded-full">
                    {students.length} Students
                  </span>
                </h3>
                <p className="text-[11px] text-[#757682] mt-0.5">
                  Statutory Ordinance 7.4 Rule: Students with projected attendance &lt; 75% are flagged for examination admit card detention.
                </p>
              </div>

              {/* Attendance Tally */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-[#00236f]">P: {presentCount}</span>
                <span className="text-[#ba1a1a]">A: {absentCount}</span>
                <span className="text-[#755b00]">M: {medicalCount}</span>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-[#757682] text-sm">
                Loading student register...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8f9fa] text-[#757682] uppercase tracking-wider text-[10px] font-bold border-b border-[#e1e3e4]">
                    <tr>
                      <th className="p-3.5">Roll No & Name</th>
                      <th className="p-3.5">Course / Sem</th>
                      <th className="p-3.5 text-center">Attended / Total</th>
                      <th className="p-3.5 text-center">Current %</th>
                      <th className="p-3.5 text-center">Today's Lecture</th>
                      <th className="p-3.5 text-center">Projected %</th>
                      <th className="p-3.5">Statutory Ordinance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f5]">
                    {students.map(student => {
                      const projected = getProjectedAttendance(student);
                      const isDetained = projected < 75;
                      const isStrictlyDetained = projected < 65;

                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-[#f8f9fa] transition-colors ${
                            student.status === 'A' ? 'bg-[#ffdad6]/10' : ''
                          }`}
                        >
                          <td className="p-3.5">
                            <strong className="text-[#191c1d] block font-bold text-xs">
                              {student.name}
                            </strong>
                            <span className="text-[11px] font-mono text-[#00236f] font-semibold">
                              {student.studentId}
                            </span>
                            {student.isMentee && (
                              <span className="ml-2 text-[10px] bg-[#dce1ff] text-[#00236f] px-1.5 py-0.2 rounded font-bold">
                                Mentee
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-[#444651]">
                            <span>{student.course}</span>
                            <span className="text-[10px] text-[#757682] block">Sem {student.semester}</span>
                          </td>
                          <td className="p-3.5 text-center font-semibold text-[#191c1d]">
                            {student.attended} / {student.total}
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                student.currentPct >= 75
                                  ? 'text-[#00236f] bg-[#ffedd5]'
                                  : student.currentPct >= 65
                                  ? 'text-[#755b00] bg-[#fae29f]'
                                  : 'text-[#ba1a1a] bg-[#ffdad6]'
                              }`}
                            >
                              {student.currentPct}%
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1 bg-[#f3f4f5] p-1 rounded-lg border border-[#e1e3e4]">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleStatusChange(student.id, 'P')}
                                title={isLocked ? "Register is locked. Click 'Unlock to Amend Register' to modify." : "Mark Present"}
                                className={`w-7 h-7 rounded-md font-bold text-xs transition-all ${
                                  isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                                } ${
                                  student.status === 'P'
                                    ? 'bg-[#ea580c] text-white shadow-xs'
                                    : 'text-[#757682] hover:bg-white'
                                }`}
                              >
                                P
                              </button>
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleStatusChange(student.id, 'A')}
                                title={isLocked ? "Register is locked. Click 'Unlock to Amend Register' to modify." : "Mark Absent"}
                                className={`w-7 h-7 rounded-md font-bold text-xs transition-all ${
                                  isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                                } ${
                                  student.status === 'A'
                                    ? 'bg-[#ba1a1a] text-white shadow-xs'
                                    : 'text-[#757682] hover:bg-white'
                                }`}
                              >
                                A
                              </button>
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleStatusChange(student.id, 'M')}
                                title={isLocked ? "Register is locked. Click 'Unlock to Amend Register' to modify." : "Medical / On Duty Leave"}
                                className={`w-7 h-7 rounded-md font-bold text-xs transition-all ${
                                  isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                                } ${
                                  student.status === 'M'
                                    ? 'bg-[#755b00] text-white shadow-xs'
                                    : 'text-[#757682] hover:bg-white'
                                }`}
                              >
                                M
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="font-extrabold text-[#191c1d] text-xs">
                              {projected}%
                            </span>
                          </td>
                          <td className="p-3.5">
                            {isStrictlyDetained ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded">
                                <AlertOctagon className="w-3.5 h-3.5" />
                                <span>Detained (&lt;65%)</span>
                              </span>
                            ) : isDetained ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#755b00] bg-[#fae29f] px-2 py-0.5 rounded">
                                <AlertOctagon className="w-3.5 h-3.5" />
                                <span>Condonation Needed (65-74%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00236f] bg-[#ffedd5] px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Exam Admit Cleared</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Submission Action Bar */}
            <div className="p-5 bg-[#f8f9fa] border-t border-[#e1e3e4] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#444651]">
                <span>Tally for this lecture slot: </span>
                <strong className="text-[#00236f]">{presentCount} Present</strong>,{' '}
                <strong className="text-[#ba1a1a]">{absentCount} Absent</strong>,{' '}
                <strong className="text-[#755b00]">{medicalCount} Medical/Duty</strong>
                {lockedRecord && (
                  <span className="ml-2 text-[#00236f] font-semibold">
                    • Status: Locked at {lockedRecord.lockedAt}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isLocked ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingLocked(true)}
                    className="px-5 py-2.5 bg-white border border-[#ea580c] text-[#00236f] hover:bg-[#ffedd5] rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Unlock to Amend Register</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    
                    <span>
                      {isSubmitting
                        ? 'Recording in MariaDB...'
                        : lockedRecord
                        ? 'Save & Re-lock Amended Register'
                        : 'Submit Official Attendance Register'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MID-SEMESTER TEST & SESSIONAL MARKS (UNIVERSITY CBCS 60 MARKS) */}
      {!isCounselor && activeTab === 'sessional' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#191c1d]">
                University CBCS Continuous Assessment & Internal Sessional Grading (60 Marks)
              </h3>
              <p className="text-xs text-[#757682] mt-0.5">
                Evaluation Scheme: MST-1 (24 Marks) + MST-2 (24 Marks) + Continuous Assignment & Attendance (12 Marks). Minimum passing internal cutoff: 24/60.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="bg-[#f3f4f5] border-none text-xs font-bold text-[#191c1d] rounded-lg px-3 py-2 outline-none cursor-pointer"
              >
                {AVAILABLE_FACULTY_SUBJECTS.map(sub => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code}: {sub.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveSessionalMarks}
                className="px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                
                <span>Save Sessional Marks</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8f9fa] text-[#757682] uppercase tracking-wider text-[10px] font-bold border-b border-[#e1e3e4]">
                  <tr>
                    <th className="p-3.5">Student Roll No & Name</th>
                    <th className="p-3.5 text-center">MST-1 (Max 24)</th>
                    <th className="p-3.5 text-center">MST-2 (Max 24)</th>
                    <th className="p-3.5 text-center">Assignment / Quiz (Max 12)</th>
                    <th className="p-3.5 text-center">Total Sessional (60)</th>
                    <th className="p-3.5 text-center">Percentage</th>
                    <th className="p-3.5 text-center">Letter Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f5]">
                  {students.map(student => {
                    const totalSessional = student.mst1 + student.mst2 + student.assignment;
                    const pct = Math.round((totalSessional / 60) * 100);
                    const gradeInfo = getGradeInfo(totalSessional);

                    return (
                      <tr key={student.id} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="p-3.5">
                          <strong className="text-[#191c1d] block font-bold text-xs">
                            {student.name}
                          </strong>
                          <span className="text-[11px] font-mono text-[#00236f]">
                            {student.studentId}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={student.mst1}
                            onChange={e => handleMarksChange(student.id, 'mst1', parseInt(e.target.value, 10))}
                            className="w-16 text-center font-bold bg-[#f3f4f5] border border-[#e1e3e4] rounded px-2 py-1 focus:ring-2 focus:ring-[#00236f] outline-none"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={student.mst2}
                            onChange={e => handleMarksChange(student.id, 'mst2', parseInt(e.target.value, 10))}
                            className="w-16 text-center font-bold bg-[#f3f4f5] border border-[#e1e3e4] rounded px-2 py-1 focus:ring-2 focus:ring-[#00236f] outline-none"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={student.assignment}
                            onChange={e => handleMarksChange(student.id, 'assignment', parseInt(e.target.value, 10))}
                            className="w-16 text-center font-bold bg-[#f3f4f5] border border-[#e1e3e4] rounded px-2 py-1 focus:ring-2 focus:ring-[#00236f] outline-none"
                          />
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-sm text-[#191c1d]">
                          {totalSessional} / 60
                        </td>
                        <td className="p-3.5 text-center font-bold text-xs text-[#444651]">
                          {pct}%
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${gradeInfo.color}`}>
                            {gradeInfo.grade} ({gradeInfo.text})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MENTORSHIP / PROCTOR BATCH */}
      {!isCounselor && activeTab === 'mentees' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#191c1d]">
                Faculty Proctor Group (Assigned CSE Mentees)
              </h3>
              <p className="text-xs text-[#757682] mt-0.5">
                Monitoring academic attendance health, fee dues clearances, and personal mentoring counseling notes.
              </p>
            </div>
            <button
              onClick={() => onNavigate('manage-students')}
              className="px-3 py-1.5 bg-[#00236f] text-white text-xs font-bold rounded-lg hover:bg-[#1e3a8a] transition-colors cursor-pointer"
            >
              Open Student Master List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {students.filter(s => s.isMentee).map(mentee => (
              <div key={mentee.id} className="bg-white rounded-xl border border-[#e1e3e4] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#191c1d]">{mentee.name}</h4>
                    <p className="text-[11px] font-mono text-[#00236f] font-semibold">{mentee.studentId}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      mentee.currentPct >= 75
                        ? 'text-[#00236f] bg-[#ffedd5]'
                        : 'text-[#ba1a1a] bg-[#ffdad6]'
                    }`}
                  >
                    {mentee.currentPct}% Attendance
                  </span>
                </div>

                <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#edeeef] text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#757682]">Course:</span>
                    <strong className="text-[#191c1d]">{mentee.course} Sem {mentee.semester}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757682]">Lectures Conducted:</span>
                    <span className="font-semibold text-[#191c1d]">{mentee.attended} / {mentee.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757682]">MST-1 Score:</span>
                    <span className="font-bold text-[#00236f]">{mentee.mst1} / 24</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f3f4f5] flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFeedbackMessage({
                        type: 'success',
                        text: `Parent intimation advisory SMS triggered for ${mentee.name} (${mentee.studentId}) via college gateway.`,
                      });
                    }}
                    className="flex-1 py-1.5 bg-[#f3f4f5] hover:bg-[#e1e3e4] text-[#191c1d] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Parent Advisory
                  </button>
                  <button
                    onClick={() => onNavigate('grievances')}
                    className="flex-1 py-1.5 bg-[#00236f]/10 hover:bg-[#00236f]/20 text-[#00236f] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Grievance / Notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TEACHING TIMETABLE */}
      {!isCounselor && activeTab === 'schedule' && (
        <div className="bg-white rounded-xl border border-[#e1e3e4] p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#191c1d]">
              Weekly Faculty Teaching Schedule (Fall Session 2025-26)
            </h3>
            <p className="text-xs text-[#757682] mt-0.5">
              Approved by Academic Council & Head of Department (CSE)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-[#f8f9fa] border border-[#edeeef] rounded-xl space-y-3">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#00236f] text-white">
                Mon / Wed / Fri
              </span>
              <h4 className="text-base font-bold text-[#191c1d]">
                CS-401: Distributed Cloud Architecture
              </h4>
              <p className="text-xs text-[#444651]">
                10:00 AM - 11:00 AM • Lecture Theater 204 • B.Tech CSE Sem 4 (Sec A)
              </p>
              <div className="pt-2 text-xs flex items-center justify-between text-[#757682]">
                <span>Credits: 4 (L-T-P: 3-1-0)</span>
                <span className="font-bold text-[#00236f]">Active Roster: 62 Students</span>
              </div>
            </div>

            <div className="p-5 bg-[#f8f9fa] border border-[#edeeef] rounded-xl space-y-3">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#ea580c] text-white">
                Tue / Thu
              </span>
              <h4 className="text-base font-bold text-[#191c1d]">
                CS-402: Advanced Relational DBMS & MariaDB
              </h4>
              <p className="text-xs text-[#444651]">
                11:30 AM - 01:00 PM • CS Computer Lab 3 • B.Tech CSE Sem 4 (Sec B)
              </p>
              <div className="pt-2 text-xs flex items-center justify-between text-[#757682]">
                <span>Credits: 4 (L-T-P: 3-0-2)</span>
                <span className="font-bold text-[#00236f]">Active Roster: 58 Students</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INLINE WORKSPACE: COUNSELOR LOG CANDIDATE CALL / RECALL (Zero Popups) */}
      {isLogCallOpen && callTargetProspect && (
        <div className="mb-6 bg-white rounded-2xl border-2 border-[#00236f]/30 w-full p-6 space-y-4 shadow-lg animate-fadeIn">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#00236f]">Log Candidate Interaction & Telephony Call (Inline Workspace)</h3>
              <p className="text-xs text-slate-500">
                {callTargetProspect.first_name || callTargetProspect.student_name} ({callTargetProspect.phone || callTargetProspect.mobile})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLogCallOpen(false)}
              className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded hover:bg-slate-100"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleLogCallSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Interaction Medium</label>
              <select
                value={callForm.interaction_type}
                onChange={e => setCallForm({ ...callForm, interaction_type: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="phone">Telephony Voice Call</option>
                <option value="whatsapp">WhatsApp Official Chat</option>
                <option value="in_person">In-Person Campus Counseling Desk</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Discussion Outcome</label>
              <select
                value={callForm.outcome}
                onChange={e => setCallForm({ ...callForm, outcome: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="interested">Candidate Highly Interested (Scheduled Callback)</option>
                <option value="callback_requested">Parent Requested Callback in Evening</option>
                <option value="campus_visit">Visiting Campus with Family This Weekend</option>
                <option value="admitted">Converted! Ready to Fill Admission Form</option>
                <option value="not_interested">Not Interested (Opted Other College / Location)</option>
                <option value="no_response">Call Not Answered (Ringing / Switched Off)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Next Scheduled Date</label>
                <input
                  type="date"
                  value={callForm.next_followup_date}
                  onChange={e => setCallForm({ ...callForm, next_followup_date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                <select
                  value={callForm.priority}
                  onChange={e => setCallForm({ ...callForm, priority: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="p1_high">P1 High Priority</option>
                  <option value="p2_normal">P2 Normal</option>
                  <option value="p3_low">P3 Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Counseling Discussion Notes</label>
              <textarea
                rows={3}
                value={callForm.notes}
                onChange={e => setCallForm({ ...callForm, notes: e.target.value })}
                placeholder="e.g. Discussed CSE specialization, parent inquired about college bus routes from Mansa..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsLogCallOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCall}
                className="px-4 py-1.5 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg text-xs font-bold"
              >
                {isSubmittingCall ? 'Recording...' : 'Save Interaction Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INLINE WORKSPACE: COUNSELOR REGISTER WALK-IN PROSPECT (Zero Popups) */}
      {isNewLeadModalOpen && (
        <div className="mb-6 bg-white rounded-2xl border-2 border-[#00236f]/30 w-full p-6 space-y-4 shadow-lg animate-fadeIn">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#00236f]">Register Walk-in Admissions Prospect (Inline Workspace)</h3>
              <p className="text-xs text-slate-500">Record a candidate visiting the campus counseling reception</p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewLeadModalOpen(false)}
              className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded hover:bg-slate-100"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreateLeadSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Candidate Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jaspreet Singh"
                value={newLeadForm.student_name}
                onChange={e => setNewLeadForm({ ...newLeadForm, student_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newLeadForm.mobile}
                  onChange={e => setNewLeadForm({ ...newLeadForm, mobile: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. candidate@gmail.com"
                  value={newLeadForm.email}
                  onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Father's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sardar Balwinder Singh"
                  value={newLeadForm.father_name}
                  onChange={e => setNewLeadForm({ ...newLeadForm, father_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Selected Degree / Course</label>
                <select
                  value={newLeadForm.selected_course}
                  onChange={e => setNewLeadForm({ ...newLeadForm, selected_course: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="B.Tech Computer Science & Engineering">B.Tech CSE</option>
                  <option value="B.Tech Electronics & Comm">B.Tech ECE</option>
                  <option value="Bachelor of Computer Applications">BCA</option>
                  <option value="Master of Business Administration">MBA</option>
                  <option value="Master of Computer Applications">MCA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Class 10th Marks %</label>
                <input
                  type="text"
                  placeholder="e.g. 82.5"
                  value={newLeadForm.tenth_percentage}
                  onChange={e => setNewLeadForm({ ...newLeadForm, tenth_percentage: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Class 12th Marks %</label>
                <input
                  type="text"
                  placeholder="e.g. 85.0"
                  value={newLeadForm.twelfth_percentage}
                  onChange={e => setNewLeadForm({ ...newLeadForm, twelfth_percentage: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Counseling Walk-in Notes</label>
              <textarea
                rows={2}
                value={newLeadForm.notes}
                onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                placeholder="e.g. Inquired about hostel & tuition fee installments..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsNewLeadModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingLead}
                className="px-4 py-1.5 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg text-xs font-bold"
              >
                {isSubmittingLead ? 'Registering...' : 'Register Walk-in Lead'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
