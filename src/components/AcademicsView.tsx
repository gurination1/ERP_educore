import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { safeGoBack } from '../utils/navigation';
import { api } from '../api/client';
import { User } from '../types';
import { ShieldCheck, X, Check, ArrowLeft, ArrowRight, Plus } from 'lucide-react';

interface AcademicsViewProps {
  currentUser: User | null;
  onOpenMasterTables?: (tab?: 'states' | 'departments' | 'institutions' | 'userTypes' | 'degrees' | 'documents' | 'hostel' | 'fees' | 'employee') => void;
  selectedCampus?: 'campus_01' | 'campus_02' | 'all';
  onCampusChange?: (c: 'campus_01' | 'campus_02' | 'all') => void;
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

export const AcademicsView: React.FC<AcademicsViewProps> = ({
  currentUser,
  onOpenMasterTables,
  selectedCampus = 'campus_01',
  onCampusChange,
}) => {
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

  // Batches state (Karanvir Sir Lecture 4 Full-Page Step-by-Step Architecture)
  const [isPromotingBatch, setIsPromotingBatch] = useState(false);
  const [promoteSourceBatchId, setPromoteSourceBatchId] = useState('');
  const [promoteTargetSemester, setPromoteTargetSemester] = useState(2);
  const [promoteSession, setPromoteSession] = useState('2025-26');
  const [promoteAttendanceCutoff, setPromoteAttendanceCutoff] = useState(75);
  const [promoteApprovalDean, setPromoteApprovalDean] = useState('Dr. Balwinder Singh (Dean Academics)');
  const [batches, setBatches] = useState<any[]>([]);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const currentMonthNum = new Date().getMonth() + 1;
  const initialTermType: 'odd' | 'even' = (currentMonthNum >= 8 && currentMonthNum <= 11) ? 'odd' : 'even';
  const [batchTermType, setBatchTermType] = useState<'odd' | 'even'>(initialTermType);
  const [newBatch, setNewBatch] = useState({
    course_id: 'cse',
    batch_name: `B.Tech CSE - Semester ${initialTermType === 'odd' ? '1' : '2'} - 2025-26`,
    batch_code: `BATCH-CSE-2025-${initialTermType.toUpperCase()}-01`,
    start_year: 2025,
    end_year: 2029,
    academic_system: 'semester' as 'semester' | 'annual',
    active_terms: initialTermType === 'odd' ? [1, 3, 5, 7] : [2, 4, 6, 8],
    section_count: 2,
    intake_capacity: 120,
    start_date: initialTermType === 'odd' ? '2025-08-01' : '2025-12-15',
    end_date: initialTermType === 'odd' ? '2025-12-10' : '2026-04-30',
    fee_due_date: initialTermType === 'odd' ? '2025-08-31' : '2025-12-31',
    attendance_lock_date: initialTermType === 'odd' ? '2025-11-20' : '2026-04-10',
    requires_approval: true,
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

  const dynamicSyllabusCourses = React.useMemo(() => {
    const existingCodes = new Set(COURSES.map(c => c.code.toLowerCase()));
    const extraCourses: CourseItem[] = subjects
      .filter(s => !existingCodes.has(s.subject_code.toLowerCase()))
      .map(s => ({
        id: s.id,
        code: s.subject_code,
        title: s.subject_name,
        department: 'Computer Science & Engineering',
        semester: s.term_number || 4,
        credits: Number(s.credits) || 4,
        ltp: '3-1-0',
        instructor: 'Assigned Departmental Faculty',
        description: `Official curriculum syllabus matrix specification for ${s.subject_name} (${s.subject_code}). Maximum marks: ${s.max_marks || 100}, Pass marks: ${s.pass_marks || 40}.`,
        units: [
          { unitNo: 'Unit I', title: 'Foundational Theoretical Principles', hours: 10, topics: ['Core nomenclature and architectural primitives', 'Theoretical formulations and design principles'] },
          { unitNo: 'Unit II', title: 'Advanced Analysis & Formulations', hours: 12, topics: ['Quantitative assessment models', 'Computational paradigms and implementations'] },
          { unitNo: 'Unit III', title: 'Applied Systems & Case Studies', hours: 11, topics: ['Real-world industrial case studies', 'Emerging industry benchmarks and practices'] },
          { unitNo: 'Unit IV', title: 'Capstones & Future Directives', hours: 12, topics: ['Security, reliability, and lifecycle synthesis', 'Evaluation rubric and laboratory guidelines'] },
        ],
        textbooks: ['Prescribed University Standard Textbooks & Reference Editions'],
      }));
    return [...COURSES, ...extraCourses];
  }, [subjects]);

  useEffect(() => {
    loadAcademicData();
  }, [activeTab]);

  const loadAcademicData = async () => {
    try {
      if (activeTab === 'syllabus') {
        const res = await api.getSubjects();
        if (res.success) setSubjects(res.subjects || []);
      } else if (activeTab === 'batches') {
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

  const handleExecuteBatchPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    const source = batches.find(b => b.id === promoteSourceBatchId) || batches[0] || { batch_name: 'B.Tech CSE - Sem 1', course_id: 'cse' };
    const coursePrefix = source.batch_name ? source.batch_name.split(' - ')[0] : 'Course';
    const newBatchName = `${coursePrefix} - Semester ${promoteTargetSemester} - ${promoteSession}`;
    const newBatchObj = {
      id: `batch-${Date.now().toString().slice(-6)}`,
      batch_code: `BATCH-${(source.course_id || 'CSE').toUpperCase()}-${promoteSession.split('-')[0]}-SEM${promoteTargetSemester}`,
      batch_name: newBatchName,
      course_id: source.course_id || 'cse',
      start_year: 2025,
      end_year: 2029,
      academic_system: source.academic_system || 'semester',
      total_terms: 8,
      active_terms_json: `Semester ${promoteTargetSemester}`,
      status: 'active',
    };
    setBatches([newBatchObj, ...batches]);
    setIsPromotingBatch(false);
    alert(`Batch ${newBatchObj.batch_name} successfully promoted & launched under Dean Academic Approval!`);
  };

  const canApproveBatch = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'hod';

  const handleApproveBatch = async (batchId: string) => {
    try {
      const res = await api.approveBatch(batchId);
      if (res.success) {
        setBatches(prev => prev.map(b => b.id === batchId ? { ...b, approval_status: 'approved', is_active: true } : b));
        setFeedback({ type: 'success', message: 'Batch formally approved by Dean Academic Council! Unlocked for student admission enrollment.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to approve batch' });
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
        approval_status: 'pending_approval',
        total_terms: newBatch.academic_system === 'annual' ? 4 : 8,
        active_terms_json: JSON.stringify(newBatch.active_terms),
      });
      if (res.success) {
        setBatches(prev => [res.batch, ...prev]);
        setIsCreatingBatch(false);
        setFeedback({ type: 'success', message: `Batch ${res.batch.batch_name} created and submitted for Dean Academic Approval per Lecture 4 Mandate.` });
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
${(course.units || []).map(u => `
${u.unitNo || 'Unit'}: ${u.title || 'Curriculum Module'} (${u.hours || 10} Lecture Hours)
--------------------------------------------------------------------------------
${(u.topics || []).map((t: string, idx: number) => `  ${idx + 1}. ${t}`).join('\n')}
`).join('\n')}

PRESCRIBED TEXTBOOKS & STATUTORY REFERENCES:
${(course.textbooks || []).map((b: string, idx: number) => `  [${idx + 1}] ${b}`).join('\n')}

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
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>
              {selectedCampus === 'campus_02'
                ? 'Faridkot Campus 02 (Regional)'
                : selectedCampus === 'all'
                ? 'All Campuses'
                : 'Bathinda Campus 01 (Main)'}
            </span>
          </div>
          {onOpenMasterTables && (
            <button
              type="button"
              onClick={() => onOpenMasterTables('degrees')}
              className="px-3 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Master Degrees & Ordinances</span>
            </button>
          )}
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
                4-Year Full-Time Degree Program • Autonomous Curriculum
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
            {dynamicSyllabusCourses.map(course => (
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
      {/* TAB 2: BATCHES (Level 4: Semester vs Annual) - Karanvir Sir Full-Page Step-by-Step Architecture */}
      {/* ======================================================== */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          {!isCreatingBatch ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Academic Batches (Level 4 Topology)</h3>
                  <p className="text-slate-500 text-xs">Configure Semester vs Annual systems and toggle active terms.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                    Auto-Term Mode: {batchTermType === 'odd' ? 'Odd (Aug-Nov)' : 'Even (Dec-Feb)'}
                  </span>
                  
                  {/* Karanvir Sir Dynamic Seasonal Batch Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextType = batchTermType === 'odd' ? 'even' : 'odd';
                      setBatchTermType(nextType);
                      setNewBatch(prev => ({
                        ...prev,
                        batch_name: `B.Tech CSE - Semester ${nextType === 'odd' ? '1' : '2'} - 2025-26`,
                        batch_code: `BATCH-CSE-2025-${nextType.toUpperCase()}-01`,
                        active_terms: nextType === 'odd' ? [1, 3, 5, 7] : [2, 4, 6, 8],
                      }));
                      setIsCreatingBatch(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    {batchTermType === 'odd' ? '+ Create Even Semesters (Upcoming)' : '+ Create New Session Odd Semesters'}
                  </button>

                  {/* Karanvir Sir Promote Batch & Roster Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (batches.length > 0 && !promoteSourceBatchId) {
                        setPromoteSourceBatchId(batches[0].id);
                      }
                      setIsPromotingBatch(true);
                    }}
                    className="px-3 py-1.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Promote Batch & Roster
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreatingBatch(true)}
                    className="px-3.5 py-1.5 bg-[#00236f] text-white rounded-lg font-semibold hover:bg-[#001950] transition-colors shadow-xs text-xs cursor-pointer"
                  >
                    + Deploy New Batch
                  </button>
                </div>
              </div>

              {batches.filter(b => b.approval_status === 'pending_approval').length > 0 && (
                <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <div>
                      <strong className="text-amber-950 font-bold block">
                        {batches.filter(b => b.approval_status === 'pending_approval').length} Academic Batch Awaiting Council & Dean Approval
                      </strong>
                      <span className="text-[11px] text-amber-700">
                        Karanvir Sir Lecture 4 Mandate: Batch cannot begin student admissions intake until formally approved.
                      </span>
                    </div>
                  </div>
                  {canApproveBatch && (
                    <button
                      type="button"
                      onClick={() => batches.filter(b => b.approval_status === 'pending_approval').forEach(b => handleApproveBatch(b.id))}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Approve All Pending ({batches.filter(b => b.approval_status === 'pending_approval').length})
                    </button>
                  )}
                </div>
              )}

              {/* INLINE WORKSPACE: BATCH PROMOTION WORKFLOW (Zero Popups) */}
              {isPromotingBatch && (
                <div className="bg-white rounded-2xl p-5 border-2 border-[#ea580c]/30 shadow-md space-y-4 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-sm font-black text-[#00236f] flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-[#ea580c] text-[10px] uppercase font-bold">Promotion Canvas</span>
                      <span>Promote Academic Batch & Enrolled Scholars (Inline Workflow)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsPromotingBatch(false)}
                      className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close Form</span>
                    </button>
                  </div>

                  <form onSubmit={handleExecuteBatchPromotion} className="space-y-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Source Current Batch:</label>
                      <select
                        value={promoteSourceBatchId}
                        onChange={e => setPromoteSourceBatchId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                      >
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.batch_name} ({b.course_id?.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Target Promoted Semester:</label>
                        <select
                          value={promoteTargetSemester}
                          onChange={e => setPromoteTargetSemester(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        >
                          {[2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Target Academic Session:</label>
                        <input
                          type="text"
                          value={promoteSession}
                          onChange={e => setPromoteSession(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed font-semibold">
                      Ordinance Gate: Only scholars satisfying the {promoteAttendanceCutoff}% biometric attendance threshold and passing minimum core credits will transition to the promoted roster. Dues clearance verified.
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Dean / HOD Statutory Authorization:</label>
                      <input
                        type="text"
                        value={promoteApprovalDean}
                        onChange={e => setPromoteApprovalDean(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsPromotingBatch(false)}
                        className="px-3.5 py-1.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl font-bold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm"
                      >
                        Execute Batch Promotion & Advance Roster
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Batch Code & Name</th>
                      <th className="px-4 py-2.5">Course</th>
                      <th className="px-4 py-2.5">Start / End Year</th>
                      <th className="px-4 py-2.5">Academic System</th>
                      <th className="px-4 py-2.5">Active Terms</th>
                      <th className="px-4 py-2.5">Statutory Cutoffs</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <strong className="font-bold text-slate-900 block">{b.batch_name}</strong>
                          <span className="font-mono text-[10px] text-slate-400">{b.id || b.batch_code || 'BATCH-2025-01'}</span>
                        </td>
                        <td className="px-4 py-3 uppercase text-slate-600 font-mono font-semibold">{b.course_id}</td>
                        <td className="px-4 py-3 font-mono">{b.start_year} – {b.end_year}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.academic_system === 'annual' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {b.academic_system} ({b.total_terms} terms)
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {b.active_terms_json || 'Terms 1, 2'}
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          <div className="font-mono text-slate-600">
                            <span className="font-bold text-slate-700">Fee Due:</span> {b.fee_due_date || '2025-08-31'}
                          </div>
                          <div className="font-mono text-[#ea580c] font-bold">
                            <span>Lock:</span> {b.attendance_lock_date || '2025-11-20'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {b.approval_status === 'pending_approval' ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                ⏳ Pending Approval
                              </span>
                              {canApproveBatch && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveBatch(b.id)}
                                  className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 inline-flex">
                              <Check className="w-3 h-3" />
                              <span>Active & Approved</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Karanvir Sir Full-Page Step-by-Step Batch Creation Screen */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00236f]" />
                    <h3 className="font-bold text-slate-900 text-base">
                      Deploy New Academic Batch (Full-Page Workflow)
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#00236f] rounded text-[10px] font-bold border border-blue-200">
                      NO POPUPS • LECTURE 4
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Auto-configured batch hierarchy, auto-generated batch ID, and odd/even semester ordinance detection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingBatch(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Batches</span>
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-5 text-xs">
                {/* Step 1: Semester Ordinance Auto-Detection */}
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                      Step 1: Academic Term Type Auto-Detection (Aug-Nov = Odd, Dec-Feb = Even)
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                      Calendar Month: {currentMonthNum} ({batchTermType.toUpperCase()} SEMESTER CYCLE)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBatchTermType('odd');
                        setNewBatch(prev => ({
                          ...prev,
                          batch_name: `B.Tech CSE - Semester 1 - 2025-26`,
                          batch_code: `BATCH-CSE-2025-ODD-01`,
                          active_terms: [1, 3, 5, 7],
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        batchTermType === 'odd'
                          ? 'border-[#00236f] bg-blue-50/80 ring-1 ring-[#00236f]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <strong className="block text-slate-900 text-xs">Odd Semesters (Term 1 / 3 / 5 / 7)</strong>
                      <span className="text-[10px] text-slate-500">Scheduled August to November Academic Window</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBatchTermType('even');
                        setNewBatch(prev => ({
                          ...prev,
                          batch_name: `B.Tech CSE - Semester 2 - 2025-26`,
                          batch_code: `BATCH-CSE-2025-EVEN-01`,
                          active_terms: [2, 4, 6, 8],
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        batchTermType === 'even'
                          ? 'border-[#00236f] bg-blue-50/80 ring-1 ring-[#00236f]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <strong className="block text-slate-900 text-xs">Even Semesters (Term 2 / 4 / 6 / 8)</strong>
                      <span className="text-[10px] text-slate-500">Scheduled December to April Academic Window</span>
                    </button>
                  </div>
                </div>

                {/* Step 2: Course & Identification */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
                    Step 2: Course Selection & Auto-Suggested Nomenclature
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Academic Degree / Course *</label>
                      <select
                        value={newBatch.course_id}
                        onChange={e => {
                          const cid = e.target.value;
                          const code = cid.toUpperCase();
                          setNewBatch(prev => ({
                            ...prev,
                            course_id: cid,
                            batch_name: `${code} - Semester ${batchTermType === 'odd' ? '1' : '2'} - 2025-26`,
                            batch_code: `BATCH-${code}-2025-${batchTermType.toUpperCase()}-01`,
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="cse">CSE (B.Tech Computer Science & Engineering)</option>
                        <option value="ece">ECE (B.Tech Electronics & Communication)</option>
                        <option value="me">ME (B.Tech Mechanical Engineering)</option>
                        <option value="ce">CE (B.Tech Civil Engineering)</option>
                        <option value="mba">MBA (Master of Business Administration)</option>
                        <option value="bpharm">B.Pharm (Bachelor of Pharmacy)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Auto-Suggested Batch Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newBatch.batch_name}
                        onChange={e => setNewBatch(prev => ({ ...prev, batch_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Auto Batch ID (Read-Only System Handle)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={newBatch.batch_code}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Academic System & Duration */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
                    Step 3: Academic System, Years & Capacity
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Academic System</label>
                      <select
                        value={newBatch.academic_system}
                        onChange={e => setNewBatch(prev => ({ ...prev, academic_system: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="semester">Semester System (8 Terms)</option>
                        <option value="annual">Annual System (4 Terms)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Year</label>
                      <input
                        type="number"
                        value={newBatch.start_year}
                        onChange={e => setNewBatch(prev => ({ ...prev, start_year: parseInt(e.target.value, 10) || 2025 }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">End Year</label>
                      <input
                        type="number"
                        value={newBatch.end_year}
                        onChange={e => setNewBatch(prev => ({ ...prev, end_year: parseInt(e.target.value, 10) || 2029 }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Sanctioned Intake</label>
                      <input
                        type="number"
                        value={newBatch.intake_capacity}
                        onChange={e => setNewBatch(prev => ({ ...prev, intake_capacity: parseInt(e.target.value, 10) || 120 }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 4: Key Statutory Dates (Karanvir Sir Lecture 4: Start Date, End Date, Fee Due Date, Attendance Lock Date) */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
                      Step 4: Statutory Timelines, Fee Due Date & Attendance Lock Date
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                      ORDINANCE MANDATE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Semester Start Date *</label>
                      <input
                        type="date"
                        required
                        value={newBatch.start_date}
                        onChange={e => setNewBatch(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Semester End Date *</label>
                      <input
                        type="date"
                        required
                        value={newBatch.end_date}
                        onChange={e => setNewBatch(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tuition Fee Due Date *</label>
                      <input
                        type="date"
                        required
                        value={newBatch.fee_due_date}
                        onChange={e => setNewBatch(prev => ({ ...prev, fee_due_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#ea580c] mb-1">Attendance Lock Date *</label>
                      <input
                        type="date"
                        required
                        value={newBatch.attendance_lock_date}
                        onChange={e => setNewBatch(prev => ({ ...prev, attendance_lock_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-orange-50/60 border border-orange-200 rounded-xl font-mono text-xs font-bold text-[#ea580c]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * Attendance Lock Date freezes faculty roster modifications for University Examination Eligibility (75% Gate).
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Batch will be provisioned in Master Architecture and linked with Fee Policies.</span>
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingBatch(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#00236f] hover:bg-[#001950] text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <span>Deploy Academic Batch</span>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
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

          {/* INLINE WORKSPACE: NON-DESTRUCTIVE SECTION TRANSFER (Zero Popups) */}
          {isTransferModalOpen && (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-5 space-y-3 animate-fade-in">
              <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Non-Destructive Section Transfer (Inline Action)</h4>
                  <p className="text-[11px] text-slate-500">Transfers student while retaining all cumulative attendance logs and ledger records</p>
                </div>
                <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
              <form onSubmit={handleSectionTransfer} className="space-y-3">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All historical attendance percentages and fee accounts remain intact without destructive wipes.</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-[#00236f] rounded-lg">Execute Transfer</button>
                </div>
              </form>
            </div>
          )}

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
                        <Check className="w-3.5 h-3.5" />
                        <span>Preserves Cumulative Attendance & Fee Heads</span>
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

          {/* INLINE WORKSPACE: ADD SUBJECT (Zero Popups) */}
          {isAddSubjectOpen && (
            <div className="bg-white rounded-2xl border-2 border-[#00236f]/30 shadow-md p-5 space-y-3.5 animate-fade-in">
              <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Add Curriculum Subject (Inline Workspace)</h4>
                  <p className="text-[11px] text-slate-500 font-mono">Formula: [NAME]_[COURSE]_[TERM]</p>
                </div>
                <button onClick={() => setIsAddSubjectOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
              <form onSubmit={handleCreateSubject} className="space-y-3.5">
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

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddSubjectOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-[#00236f] rounded-lg">Register Subject</button>
                </div>
              </form>
            </div>
          )}

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

          {/* INLINE WORKSPACE: FACULTY HANDOVER (Zero Popups) */}
          {isHandoverModalOpen && selectedAllocation && (
            <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-5 space-y-3 animate-fade-in">
              <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Faculty Subject Handover (Inline Action)</h4>
                  <p className="text-[11px] text-slate-500">Relieving <strong>{selectedAllocation.faculty_id}</strong> for <strong>{selectedAllocation.subject_id}</strong></p>
                </div>
                <button onClick={() => setIsHandoverModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
              <form onSubmit={handleHandoverAllocation} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Successor takes charge automatically from the next calendar day. Historical attendance marks remain immutably attributed to each instructor.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsHandoverModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 rounded-lg">Confirm Handover</button>
                </div>
              </form>
            </div>
          )}

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

          {/* INLINE WORKSPACE: ADD TIMETABLE SLOT (Zero Popups) */}
          {isAddSlotOpen && (
            <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-md p-5 space-y-3 animate-fade-in">
              <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Add Timetable Lecture Slot (Inline Action)</h4>
                  <p className="text-[11px] text-slate-500 font-mono">Conflict detection & Combined Classes (CC)</p>
                </div>
                <button onClick={() => setIsAddSlotOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
              <form onSubmit={handleCreateTimetableSlot} className="space-y-3">
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

                <div className="grid grid-cols-2 gap-3">
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

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddSlotOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-[#00236f] rounded-lg">Schedule Slot</button>
                </div>
              </form>
            </div>
          )}

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

      {/* Attendance Lock Ordinance inline modal is retained above */}
    </div>
  );
};
