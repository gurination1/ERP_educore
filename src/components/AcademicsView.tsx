import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { safeGoBack } from '../utils/navigation';
import { api } from '../api/client';
import { User } from '../types';

interface AcademicsViewProps {
  currentUser: User | null;
}

interface SyllabusUnit {
  unitNo: string;
  title: string;
  hours: number;
  topics: string[];
}

interface CourseItem {
  id: string;
  code: string;
  title: string;
  department: string;
  semester: number;
  credits: number;
  ltp: string;
  instructor: string;
  description: string;
  units: SyllabusUnit[];
  textbooks: string[];
}

const COURSES: CourseItem[] = [
  {
    id: 'crs-cs401',
    code: 'CS-401',
    title: 'Distributed Cloud Architecture & Microservices',
    department: 'Computer Science & Engineering',
    semester: 4,
    credits: 4,
    ltp: '3-1-0',
    instructor: 'Prof. Sunita Rao (Assistant Professor)',
    description: 'Covers principles of cloud architecture, distributed consensus, container orchestration, microservice communication patterns, and resilient distributed data systems.',
    units: [
      {
        unitNo: 'Unit I',
        title: 'Cloud Foundations & Virtualization',
        hours: 10,
        topics: [
          'Cloud computing deployment models: Public, Private, Hybrid & Multi-Cloud',
          'Virtualization technologies: Type-1 vs Type-2 Hypervisors, Containerization (Docker, cgroups, namespaces)',
          'Cloud service models: IaaS, PaaS, SaaS, and Serverless event-driven execution',
        ],
      },
      {
        unitNo: 'Unit II',
        title: 'Distributed Systems & Consensus Protocols',
        hours: 12,
        topics: [
          'CAP theorem, PACELC theorem, and eventual consistency models',
          'Consensus algorithms: Raft, Paxos, and distributed leader election',
          'Vector clocks, Lamport timestamps, and distributed state coordination',
        ],
      },
      {
        unitNo: 'Unit III',
        title: 'Microservices & Inter-Service Communication',
        hours: 11,
        topics: [
          'Decomposing monoliths: Domain-Driven Design (DDD) bounded contexts',
          'RESTful APIs, gRPC protocol buffers, and GraphQL query federation',
          'API Gateways, circuit breakers, rate limiters, and distributed tracing (OpenTelemetry)',
        ],
      },
      {
        unitNo: 'Unit IV',
        title: 'Resilient Cloud Storage & Orchestration',
        hours: 12,
        topics: [
          'Kubernetes architecture: Control plane, Pods, Deployments, Services, and Ingress controllers',
          'Distributed storage systems: Ceph, AWS S3 object storage, and sharded relational clusters',
          'Continuous deployment pipelines and infrastructure as code (IaC with Terraform)',
        ],
      },
    ],
    textbooks: [
      'Distributed Systems: Principles and Paradigms (3rd Edition) - Andrew S. Tanenbaum & Maarten Van Steen',
      'Designing Data-Intensive Applications - Martin Kleppmann',
      'Cloud Computing: Principles and Paradigms - Rajkumar Buyya, Christian Vecchiola',
    ],
  },
  {
    id: 'crs-cs402',
    code: 'CS-402',
    title: 'Advanced Relational DBMS & PostgreSQL Internals',
    department: 'Computer Science & Engineering',
    semester: 4,
    credits: 4,
    ltp: '3-0-2',
    instructor: 'Dr. Ramesh Chandra (Academic Provost)',
    description: 'In-depth study of storage engine architectures, B-tree indexes, ACID transaction isolation levels, write-ahead logging (WAL), query execution planners, and PostgreSQL multi-tenancy.',
    units: [
      {
        unitNo: 'Unit I',
        title: 'Database Storage Engines & Buffer Management',
        hours: 11,
        topics: [
          'Relational database physical layout: Slotted pages, row records, and variable-length attributes',
          'Buffer pool replacement strategies: Clock sweep, LRU-K, and dirty page flushing mechanisms',
          'File organizations: Heap files, sorted sequential files, and hash partitioning',
        ],
      },
      {
        unitNo: 'Unit II',
        title: 'Indexing & Physical Query Optimization',
        hours: 12,
        topics: [
          'B+ Tree index search, insertion, node splitting, and concurrency latching protocols',
          'Cost-based query optimizer architecture: Dynamic programming plan space enumeration',
          'Hash join vs Sort-Merge join vs Indexed Nested Loop join algorithms',
        ],
      },
      {
        unitNo: 'Unit III',
        title: 'ACID Concurrency & Write-Ahead Logging',
        hours: 12,
        topics: [
          'Multi-Version Concurrency Control (MVCC), snapshot isolation, and repeatable read anomalies',
          'ARIES recovery protocol: Analysis pass, Redo phase, and Undo pass algorithms',
          'Two-Phase Locking (2PL), deadlock detection graphs, and optimistic concurrency control',
        ],
      },
      {
        unitNo: 'Unit IV',
        title: 'Distributed Databases & PostgreSQL Sharding',
        hours: 10,
        topics: [
          'Horizontal table partitioning, sharding architectures, and distributed connection pooling',
          'PostgreSQL schema-per-tenant isolation models and read replicas',
          'Point-in-time recovery (PITR) and enterprise backup verification pipelines',
        ],
      },
    ],
    textbooks: [
      'Database System Concepts (7th Edition) - Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
      'PostgreSQL: Up and Running - Regina Obe & Leo Hsu',
      'Database Management Systems - Raghu Ramakrishnan & Johannes Gehrke',
    ],
  },
];

type AcademicTab =
  | 'syllabus'
  | 'batches'
  | 'sections'
  | 'subjects'
  | 'allocations'
  | 'timetable'
  | 'attendance';

export const AcademicsView: React.FC<AcademicsViewProps> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const urlTab = (rawTab === 'cbcs' ? 'syllabus' : rawTab) as AcademicTab | null;

  const isStudent = currentUser?.role === 'student';
  const isCounselor = currentUser?.role === 'counselor';
  const isStaffOnly = currentUser?.role === 'staff';

  const canViewBatches = !isStudent && !isStaffOnly && !isCounselor;
  const canViewSections = !isStudent && !isCounselor;
  const canViewSubjects = !isStudent && !isStaffOnly && !isCounselor;
  const canViewAllocations = !isStudent && !isCounselor;
  const canViewAttendanceLock = !isStudent && !isStaffOnly && !isCounselor;

  const getInitialTab = (): AcademicTab => {
    if (urlTab) {
      if ((isStudent || isCounselor) && !['syllabus', 'timetable'].includes(urlTab)) return 'syllabus';
      if (isStaffOnly && !['syllabus', 'timetable', 'sections', 'allocations'].includes(urlTab)) return 'syllabus';
      return urlTab;
    }
    return 'syllabus';
  };

  const [activeTab, setActiveTab] = useState<AcademicTab>(getInitialTab);

  useEffect(() => {
    if (urlTab) {
      if ((isStudent || isCounselor) && !['syllabus', 'timetable'].includes(urlTab)) {
        setActiveTab('syllabus');
      } else if (isStaffOnly && !['syllabus', 'timetable', 'sections', 'allocations'].includes(urlTab)) {
        setActiveTab('syllabus');
      } else {
        setActiveTab(urlTab);
      }
    }
  }, [urlTab, isStudent, isCounselor, isStaffOnly]);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Batches state
  const [batches, setBatches] = useState<any[]>([]);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({
    course_id: 'cse',
    batch_name: '2024-2028',
    start_year: 2024,
    end_year: 2028,
    academic_system: 'semester' as 'semester' | 'annual',
    active_terms: [1, 2],
  });

  // Sections state
  const [sections, setSections] = useState<any[]>([]);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    batch_id: 'batch-cse-2024',
    section_name: 'A',
    capacity: 60,
  });

  // Section Transfer state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    student_id: 'stu-rec-aryan',
    target_section_id: 'sec-cse-b',
    reason: 'Elective stream re-balancing',
  });

  // Subjects state
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    course_id: 'cse',
    subject_name: 'Cloud Infrastructure Engineering',
    term_number: 1,
    subject_type: 'compulsory' as any,
    take_exam: true,
    show_in_report_card: true,
    take_attendance: true,
    credits: 4.0,
    max_marks: 100,
    pass_marks: 40,
  });

  // Allocations & Handover state
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);
  const [handoverData, setHandoverData] = useState({
    new_faculty_id: 'usr-staff-02',
    handover_date: new Date().toISOString().split('T')[0],
    reason: 'Senior mentor mid-semester assignment reallocation',
  });

  // Timetable state
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    batch_id: 'batch-cse-2024',
    section_id: 'sec-cse-a',
    subject_id: 'sub-cs-101',
    faculty_id: 'usr-staff-01',
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    room_number: 'Room 101',
    is_combined_class: false,
  });

  // Attendance Settings state
  const [attendanceSettings, setAttendanceSettings] = useState<{ backdated_lock_days: number }>({ backdated_lock_days: 20 });
  const [lockThreshold, setLockThreshold] = useState<number>(20);

  useEffect(() => {
    loadAcademicData();
  }, [activeTab]);

  const loadAcademicData = async () => {
    try {
      if (activeTab === 'batches') {
        const res = await api.getBatches();
        if (res.success) setBatches(res.batches || []);
      } else if (activeTab === 'sections') {
        const [resSec, resBat] = await Promise.all([api.getSections(), api.getBatches()]);
        if (resSec.success) setSections(resSec.sections || []);
        if (resBat.success) setBatches(resBat.batches || []);
      } else if (activeTab === 'subjects') {
        const res = await api.getSubjects();
        if (res.success) setSubjects(res.subjects || []);
      } else if (activeTab === 'allocations') {
        const res = await api.getFacultyAllocations();
        if (res.success) setAllocations(res.allocations || []);
      } else if (activeTab === 'timetable') {
        const res = await api.getTimetableSlots();
        if (res.success) setTimetableSlots(res.slots || []);
      } else if (activeTab === 'attendance') {
        const res = await api.getAttendanceSettings();
        if (res.success && res.settings) {
          setAttendanceSettings(res.settings);
          setLockThreshold(res.settings.backdated_lock_days);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createBatch({
        ...newBatch,
        total_terms: newBatch.academic_system === 'annual' ? 4 : 8,
        active_terms_json: JSON.stringify(newBatch.active_terms),
      });
      if (res.success) {
        setBatches(prev => [res.batch, ...prev]);
        setIsAddBatchOpen(false);
        setFeedback({ type: 'success', message: `Batch ${res.batch.batch_name} created.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create batch' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSection(newSection);
      if (res.success) {
        setSections(prev => [res.section, ...prev]);
        setIsAddSectionOpen(false);
        setFeedback({ type: 'success', message: `Section ${res.section.section_name} created.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create section' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSectionTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.transferStudentSection(transferData);
      if (res.success) {
        setIsTransferModalOpen(false);
        setFeedback({
          type: 'success',
          message: `Non-destructive section transfer complete for student ${transferData.student_id}. Cumulative attendance and fees preserved.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to transfer student' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSubject(newSubject);
      if (res.success) {
        setSubjects(prev => [res.subject, ...prev]);
        setIsAddSubjectOpen(false);
        setFeedback({ type: 'success', message: `Subject ${res.subject.subject_code} (${res.subject.subject_name}) registered in matrix.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create subject' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleHandoverAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation) return;
    try {
      const res = await api.handoverFaculty({
        allocation_id: selectedAllocation.id,
        new_faculty_id: handoverData.new_faculty_id,
        handover_date: handoverData.handover_date,
        reason: handoverData.reason,
      });
      if (res.success) {
        setIsHandoverModalOpen(false);
        setSelectedAllocation(null);
        setFeedback({
          type: 'success',
          message: `Faculty subject handover recorded. Successor ${handoverData.new_faculty_id} assigned from next day.`,
        });
        loadAcademicData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Handover failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createTimetableSlot(newSlot);
      if (res.success) {
        setTimetableSlots(prev => [res.slot, ...prev]);
        setIsAddSlotOpen(false);
        setFeedback({ type: 'success', message: `Timetable slot scheduled for ${res.slot.day_of_week} at ${res.slot.start_time}.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Slot conflict or failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveAttendanceSettings = async () => {
    try {
      const res = await api.updateAttendanceSettings(lockThreshold);
      if (res.success) {
        setAttendanceSettings(res.settings);
        setFeedback({
          type: 'success',
          message: `Anti-Fraud Attendance Lock updated to ${lockThreshold} days backdated maximum.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update attendance lock threshold' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDownloadSyllabus = (course: CourseItem) => {
    const textContent = `
================================================================================
OFFICIAL UNIVERSITY SYLLABUS & CURRICULUM SPECIFICATION
Autonomous Collegiate Board of Studies • Scheme: Choice Based Credit System (CBCS)
================================================================================

Degree Program: Bachelor of Technology (Computer Science & Engineering)
Affiliation: Panjab University (PU) • MRSPTU • PUP Patiala

Subject Code: ${course.code}
Subject Title: ${course.title}
Department: ${course.department}
Semester: Semester ${course.semester}
Credits: ${course.credits} Credits (Lecture-Tutorial-Practical: ${course.ltp})
Course Instructor / Faculty: ${course.instructor}

COURSE SYNOPSIS:
${course.description}

CURRICULUM UNITS & BREAKDOWN:
${course.units.map(u => `
${u.unitNo}: ${u.title} (${u.hours} Lecture Hours)
--------------------------------------------------------------------------------
${u.topics.map((t, idx) => `  ${idx + 1}. ${t}`).join('\n')}
`).join('\n')}

PRESCRIBED TEXTBOOKS & STATUTORY REFERENCES:
${course.textbooks.map((b, idx) => `  [${idx + 1}] ${b}`).join('\n')}

EVALUATION SCHEME:
  - Mid-Semester Tests (MST-1 & MST-2): 48 Marks
  - Continuous Assessments / Assignments / Lab: 12 Marks
  - External End-Semester University Exam: 40 Marks
  - Minimum Mandatory Attendance Cutoff: 75% (Ordinance 7.4)

Record Generated on ${new Date().toISOString().slice(0, 10)}
`.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Syllabus_${course.code}_${new Date().getFullYear()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    setFeedback({ type: 'success', message: `Official syllabus for ${course.code} downloaded successfully.` });
  };

  return (
    <div id="academics-curriculum-screen" className="space-y-4 animate-fadeIn text-xs">
      {/* Page Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => safeGoBack()}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-200/80 shrink-0"
            title="Return to Previous Screen (Alt + ←)"
          >
            ‹
          </button>
          <h2 className="font-extrabold text-sm text-[#00236f] tracking-tight">
            Academic Topology & Curriculum Matrix
          </h2>
          <span className="text-[10px] text-slate-300 font-semibold">•</span>
          <span className="text-[11px] text-slate-600 font-medium">5-Level Hierarchy (Lecture 3 Senior Mentor Architecture)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#ffedd5] text-[#00236f] rounded-full border border-[#ea580c]">
            Session 2025-26
          </span>
          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
            PostgreSQL Active Engine
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="px-2 py-0.5 text-[10px] font-bold hover:bg-black/5 rounded">
            Dismiss
          </button>
        </div>
      )}

      {/* Horizontal Tabs Ribbon (Cupertino Segmented Control) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto text-xs font-semibold border border-slate-200">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'syllabus'
              ? 'bg-white text-[#00236f] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Curriculum & Syllabus
        </button>
        {canViewBatches && (
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'batches'
                ? 'bg-white text-[#00236f] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batches (L4)
          </button>
        )}
        {canViewSections && (
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sections'
                ? 'bg-white text-[#00236f] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sections & Transfers (L5)
          </button>
        )}
        {canViewSubjects && (
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'bg-white text-[#00236f] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subject Matrix
          </button>
        )}
        {canViewAllocations && (
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'allocations'
                ? 'bg-white text-[#00236f] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faculty Handover
          </button>
        )}
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'timetable'
              ? 'bg-white text-[#00236f] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Time Table & CC
        </button>
        {canViewAttendanceLock && (
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-white text-[#00236f] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Lock
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CURRICULUM & SYLLABUS                             */}
      {/* ======================================================== */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Degree Program
              </h4>
              <p className="text-base font-bold text-slate-900 mt-1">
                B.Tech Computer Science & Engg.
              </p>
              <span className="text-xs text-slate-500 mt-0.5 block">
                4-Year Full-Time • AICTE & Tripartite Affiliated
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Evaluation Ratio
              </h4>
              <p className="text-base font-bold text-slate-900 mt-1">
                60% Internal • 40% University
              </p>
              <span className="text-xs text-slate-500 mt-0.5 block">
                MST-1 (24) + MST-2 (24) + Assessment (12)
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Statutory Attendance Rule
              </h4>
              <p className="text-base font-bold text-slate-900 mt-1">
                75% Mandatory Cutoff
              </p>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Statutory Ordinance 7.4 Hall Ticket Requirement
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COURSES.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-3 hover:border-[#00236f]/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#00236f]/10 text-[#00236f]">
                      {course.code}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Credits: {course.credits} ({course.ltp})
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    {course.title}
                  </h4>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Instructor: {course.instructor}
                  </p>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(course)}
                    className="text-xs font-bold text-[#00236f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Units & Modules →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSyllabus(course)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Download (.txt)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BATCHES (Level 4: Semester vs Annual)             */}
      {/* ======================================================== */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Academic Batches (Level 4 Topology)</h3>
              <p className="text-slate-500 text-xs">Configure Semester vs Annual systems and toggle active terms.</p>
            </div>
            <button
              onClick={() => setIsAddBatchOpen(true)}
              className="px-3 py-1.5 bg-[#00236f] text-white rounded-lg font-semibold hover:bg-[#001950] transition-colors"
            >
              + Create Batch
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Batch Name</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Start / End Year</th>
                  <th className="px-4 py-2.5">Academic System</th>
                  <th className="px-4 py-2.5">Active Terms</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">{b.batch_name}</td>
                    <td className="px-4 py-3 uppercase text-slate-600 font-mono">{b.course_id}</td>
                    <td className="px-4 py-3">{b.start_year} – {b.end_year}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.academic_system === 'annual' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {b.academic_system} ({b.total_terms} terms)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {b.active_terms_json || 'Terms 1, 2'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SECTIONS & NON-DESTRUCTIVE TRANSFERS (Level 5)    */}
      {/* ======================================================== */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Sections & Class Rosters (Level 5 Topology)</h3>
              <p className="text-slate-500 text-xs">Section capacity and non-destructive transfers preserving cumulative attendance & fee ledgers.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
              >
                Transfer Student Section ⇄
              </button>
              <button
                onClick={() => setIsAddSectionOpen(true)}
                className="px-3 py-1.5 bg-[#00236f] text-white rounded-lg font-semibold hover:bg-[#001950] transition-colors"
              >
                + Add Section
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Section Name</th>
                  <th className="px-4 py-2.5">Parent Batch</th>
                  <th className="px-4 py-2.5">Capacity</th>
                  <th className="px-4 py-2.5">Data Integrity Protection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900 text-sm">Section {s.section_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{s.batch_id}</td>
                    <td className="px-4 py-3">{s.capacity} Students</td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        ✓ Preserves Cumulative Attendance & Fee Heads
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SUBJECT MATRIX (Formula: [NAME]_[COURSE]_[TERM])   */}
      {/* ======================================================== */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Curriculum & Subject Matrix</h3>
              <p className="text-slate-500 text-xs">Formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">[NAME]_[COURSE]_[TERM]</code> (e.g. HIST_101_01). Evaluation flags take_exam & show_in_report_card.</p>
            </div>
            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="px-3 py-1.5 bg-[#00236f] text-white rounded-lg font-semibold hover:bg-[#001950] transition-colors"
            >
              + Add Subject to Matrix
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Subject Code (Formula)</th>
                  <th className="px-4 py-2.5">Subject Title</th>
                  <th className="px-4 py-2.5">Term</th>
                  <th className="px-4 py-2.5">Credits</th>
                  <th className="px-4 py-2.5">Evaluation Flags</th>
                  <th className="px-4 py-2.5">Marks Scheme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{sub.subject_code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{sub.subject_name}</td>
                    <td className="px-4 py-3 font-medium">Term {sub.term_number}</td>
                    <td className="px-4 py-3 font-bold">{sub.credits}</td>
                    <td className="px-4 py-3 space-x-1.5 flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.take_exam ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {sub.take_exam ? 'Exam: Yes' : 'Exam: No'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.show_in_report_card ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'}`}>
                        {sub.show_in_report_card ? 'Report: Yes' : 'Report: No'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.take_attendance !== false ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {sub.take_attendance !== false ? 'Attendance: Yes' : 'Attendance: No (FC Auto-Present)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Max {sub.max_marks} / Pass {sub.pass_marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: FACULTY ALLOCATIONS & HANDOVER DATES              */}
      {/* ======================================================== */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Faculty Subject Allocations & Handover Dates</h3>
              <p className="text-slate-500 text-xs">Track faculty assignment validity dates (valid_from, valid_until) and trigger mid-term successor handovers.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Faculty In-Charge</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Batch / Section</th>
                  <th className="px-4 py-2.5">Validity Dates</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map(al => (
                  <tr key={al.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{al.faculty_id}</td>
                    <td className="px-4 py-3 font-mono text-blue-700 font-bold">{al.subject_id}</td>
                    <td className="px-4 py-3 text-slate-600">{al.batch_id} {al.section_id ? `(${al.section_id})` : ''}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {al.valid_from} → {al.valid_until || 'Present'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${al.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {al.is_active ? 'Active In-Charge' : 'Relieved'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {al.is_active && (
                        <button
                          onClick={() => {
                            setSelectedAllocation(al);
                            setIsHandoverModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200"
                        >
                          Handover Subject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: TIME TABLE & COMBINED CLASSES (CC)                */}
      {/* ======================================================== */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Time Table & Combined Classes (CC)</h3>
              <p className="text-slate-500 text-xs">Conflict-checked weekly timetable slots. Merged multi-batch lectures tagged with CC for unified attendance.</p>
            </div>
            <button
              onClick={() => setIsAddSlotOpen(true)}
              className="px-3 py-1.5 bg-[#00236f] text-white rounded-lg font-semibold hover:bg-[#001950] transition-colors"
            >
              + Add Slot
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Day</th>
                  <th className="px-4 py-2.5">Time Interval</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Faculty</th>
                  <th className="px-4 py-2.5">Room</th>
                  <th className="px-4 py-2.5">Batch</th>
                  <th className="px-4 py-2.5">Combined Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetableSlots.map(slot => (
                  <tr key={slot.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">{slot.day_of_week}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{slot.start_time} - {slot.end_time}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{slot.subject_id}</td>
                    <td className="px-4 py-3 text-slate-700">{slot.faculty_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{slot.room_number}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{slot.batch_id}</td>
                    <td className="px-4 py-3">
                      {slot.is_combined_class ? (
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-500 text-white shadow-2xs">
                          CC (Combined)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Regular</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: ATTENDANCE GOVERNANCE & ANTI-FRAUD LOCK           */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-50 text-rose-700 border border-rose-200">
              Anti-Fraud Attendance Governance
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Backdated Attendance Submission Lockout Threshold
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              As decreed in Senior Mentor Lecture 3, backdated attendance tampering is strictly blocked by ordinance.
              Attendance dates exceeding the configured threshold cannot be marked or modified by faculty staff.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Backdated Grace Threshold (Days)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[10, 20, 30].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setLockThreshold(days)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      lockThreshold === days
                        ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {days} Days Lock
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Current Active Threshold: <strong className="text-slate-900">{attendanceSettings.backdated_lock_days} Days</strong>
              </span>
              <button
                type="button"
                onClick={handleSaveAttendanceSettings}
                className="px-4 py-2 bg-[#00236f] text-white rounded-xl text-xs font-bold hover:bg-[#001950] transition-colors cursor-pointer"
              >
                Save Lockout Ordinance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals: Create Batch */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Create Academic Batch (Level 4)</h4>
              <button onClick={() => setIsAddBatchOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateBatch} className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={newBatch.batch_name}
                  onChange={e => setNewBatch(prev => ({ ...prev, batch_name: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Start Year</label>
                  <input
                    type="number"
                    value={newBatch.start_year}
                    onChange={e => setNewBatch(prev => ({ ...prev, start_year: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">End Year</label>
                  <input
                    type="number"
                    value={newBatch.end_year}
                    onChange={e => setNewBatch(prev => ({ ...prev, end_year: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Academic System</label>
                <select
                  value={newBatch.academic_system}
                  onChange={e => setNewBatch(prev => ({ ...prev, academic_system: e.target.value as any }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="semester">Semester System (8 Terms)</option>
                  <option value="annual">Annual System (4 Terms)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddBatchOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-[#00236f] rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals: Non-destructive Section Transfer */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Non-Destructive Section Transfer</h4>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSectionTransfer} className="p-5 space-y-3">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px]">
                🛡️ All historical attendance percentages and fee accounts remain intact without destructive wipes.
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Student ID / Roll No *</label>
                <input
                  type="text"
                  required
                  value={transferData.student_id}
                  onChange={e => setTransferData(prev => ({ ...prev, student_id: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Section *</label>
                <select
                  value={transferData.target_section_id}
                  onChange={e => setTransferData(prev => ({ ...prev, target_section_id: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="sec-cse-a">Section A (Room 101)</option>
                  <option value="sec-cse-b">Section B (Room 102)</option>
                  <option value="sec-ece-a">ECE Section A</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Administrative Reason</label>
                <input
                  type="text"
                  value={transferData.reason}
                  onChange={e => setTransferData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-[#00236f] rounded-lg">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals: Handover Faculty */}
      {isHandoverModalOpen && selectedAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Faculty Subject Handover</h4>
              <button onClick={() => setIsHandoverModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleHandoverAllocation} className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Relieving <strong>{selectedAllocation.faculty_id}</strong> for subject <strong>{selectedAllocation.subject_id}</strong>. Successor takes charge automatically from the next calendar day.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Successor Faculty ID *</label>
                <input
                  type="text"
                  required
                  value={handoverData.new_faculty_id}
                  onChange={e => setHandoverData(prev => ({ ...prev, new_faculty_id: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Handover Effective Date *</label>
                <input
                  type="date"
                  required
                  value={handoverData.handover_date}
                  onChange={e => setHandoverData(prev => ({ ...prev, handover_date: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reason for Handover</label>
                <input
                  type="text"
                  value={handoverData.reason}
                  onChange={e => setHandoverData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsHandoverModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 rounded-lg">Confirm Handover</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subject */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Add Curriculum Subject</h4>
                <p className="text-[11px] text-slate-500 font-mono">Formula: [NAME]_[COURSE]_[TERM]</p>
              </div>
              <button onClick={() => setIsAddSubjectOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Course Code *</label>
                  <select
                    value={newSubject.course_id}
                    onChange={e => setNewSubject(prev => ({ ...prev, course_id: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="cse">CSE (B.Tech Computer Science)</option>
                    <option value="ece">ECE (B.Tech Electronics)</option>
                    <option value="mech">MECH (Mechanical)</option>
                    <option value="civil">CIVIL (Civil Engg)</option>
                    <option value="mba">MBA (Management)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Term / Semester *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newSubject.term_number}
                    onChange={e => setNewSubject(prev => ({ ...prev, term_number: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Database Systems"
                  value={newSubject.subject_name}
                  onChange={e => setNewSubject(prev => ({ ...prev, subject_name: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Subject Classification *</label>
                  <select
                    value={newSubject.subject_type}
                    onChange={e => {
                      const val = e.target.value;
                      setNewSubject(prev => ({
                        ...prev,
                        subject_type: val as any,
                        take_attendance: val === 'free_period' ? false : prev.take_attendance,
                        take_exam: val === 'free_period' ? false : prev.take_exam,
                        show_in_report_card: val === 'free_period' ? false : prev.show_in_report_card,
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="compulsory">Compulsory Theory</option>
                    <option value="elective">Elective</option>
                    <option value="practical">Practical / Lab</option>
                    <option value="free_period">Free Period (FC - Auto Present)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Credits *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    required
                    value={newSubject.credits}
                    onChange={e => setNewSubject(prev => ({ ...prev, credits: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* 3 Evaluation Checkboxes (Karanvir Sir Mandatory Rule) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-900 block">Evaluation & Attendance Gates:</span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubject.take_exam}
                      onChange={e => setNewSubject(prev => ({ ...prev, take_exam: e.target.checked }))}
                      className="rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span><strong>take_exam</strong> — Subject requires university/internal examination</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubject.show_in_report_card}
                      onChange={e => setNewSubject(prev => ({ ...prev, show_in_report_card: e.target.checked }))}
                      className="rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span><strong>show_in_report_card</strong> — Display on academic transcript & grade sheet</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubject.take_attendance}
                      onChange={e => setNewSubject(prev => ({ ...prev, take_attendance: e.target.checked }))}
                      className="rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span><strong>take_attendance</strong> — Track daily lecture attendance (Uncheck for FC / Free Period)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={newSubject.max_marks}
                    onChange={e => setNewSubject(prev => ({ ...prev, max_marks: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={newSubject.pass_marks}
                    onChange={e => setNewSubject(prev => ({ ...prev, pass_marks: parseInt(e.target.value) || 40 }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddSubjectOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-[#00236f] rounded-lg">Register Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Timetable Slot */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Add Timetable Lecture Slot</h4>
                <p className="text-[11px] text-slate-500 font-mono">Conflict detection & Combined Classes (CC)</p>
              </div>
              <button onClick={() => setIsAddSlotOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateTimetableSlot} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Batch ID *</label>
                  <input
                    type="text"
                    required
                    value={newSlot.batch_id}
                    onChange={e => setNewSlot(prev => ({ ...prev, batch_id: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Section ID</label>
                  <input
                    type="text"
                    value={newSlot.section_id}
                    onChange={e => setNewSlot(prev => ({ ...prev, section_id: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Subject Code / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS101 or sub-cs-101"
                  value={newSlot.subject_id}
                  onChange={e => setNewSlot(prev => ({ ...prev, subject_id: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Faculty ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. usr-staff-01"
                  value={newSlot.faculty_id}
                  onChange={e => setNewSlot(prev => ({ ...prev, faculty_id: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Day *</label>
                  <select
                    value={newSlot.day_of_week}
                    onChange={e => setNewSlot(prev => ({ ...prev, day_of_week: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Start *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.start_time}
                    onChange={e => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">End *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.end_time}
                    onChange={e => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Room / Lab Number</label>
                <input
                  type="text"
                  value={newSlot.room_number}
                  onChange={e => setNewSlot(prev => ({ ...prev, room_number: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <label className="flex items-center gap-2 text-xs text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSlot.is_combined_class}
                    onChange={e => setNewSlot(prev => ({ ...prev, is_combined_class: e.target.checked }))}
                    className="rounded text-[#00236f] focus:ring-[#00236f]"
                  />
                  <span><strong>Combined Class (CC)</strong> — Merge across multiple batches into single lecture</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddSlotOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-[#00236f] rounded-lg">Schedule Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
