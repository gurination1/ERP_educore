import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Student } from '../../src/types';

export const examRouter = Router();

// In-memory persistent examination registry state (preserves form submissions and clearance across sessions)
interface ExamSubmissionRecord {
  id: string;
  studentId: string;
  semester: number;
  academicYear: string;
  submissionType: 'REGULAR' | 'REAPPEAR';
  subjectCodes: string[];
  totalFeePaid: number;
  paymentRef?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'DISPATCHED_TO_UNIVERSITY';
  verificationHash: string;
  centerAllotted: string;
}

const examSubmissions: Map<string, ExamSubmissionRecord[]> = new Map();

// Helper to match student by id, roll_number, or enterprise_uid
function findStudent(allStudents: Student[], identifier: string): Student | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  return allStudents.find(s =>
    s.id?.toLowerCase() === clean ||
    s.student_id?.toLowerCase() === clean ||
    (s as any).enterprise_uid?.toLowerCase() === clean ||
    `${s.first_name} ${s.last_name}`.toLowerCase() === clean
  );
}

// 1. Examination Metadata & Statutory Ordinances
examRouter.get('/meta', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    meta: {
      activeSession: 'May-June 2026 Regular & Reappear Semester Examination',
      academicCycle: 'Even Semester (2025-2026)',
      universities: [
        { code: 'MRSPTU', name: 'Maharaja Ranjit Singh Punjab Technical University, Bathinda', type: 'State Technical University' },
        { code: 'PUP', name: 'Punjabi University Patiala', type: 'State Affiliating University' },
        { code: 'PU', name: 'Panjab University Chandigarh', type: 'Apex Regional University' },
      ],
      examCenters: [
        { code: 'BFGI-104', name: 'Center 104 - Main Science & Engineering Block, BFGI Campus', capacity: 350 },
        { code: 'BFGI-108', name: 'Center 108 - Academic Block B (Management & IT Wing), BFGI Campus', capacity: 250 },
      ],
      feeSchedule: {
        regularFormFee: 1200,
        reappearFeePerPaper: 700,
        lateFeeSlabs: [
          { days: 'Till 15th April 2026', fee: 0, label: 'Normal Window' },
          { days: '16th - 25th April 2026', fee: 500, label: 'Late Fee Slab 1' },
          { days: '26th April - 5th May 2026', fee: 1000, label: 'Late Fee Slab 2' },
        ],
      },
      attendanceRules: {
        mandatoryThreshold: 75,
        condonableThreshold: 65,
        condonationAuthority: 'Dean (Academic Affairs) / Principal under University Ordinance 7.4',
      },
    },
  });
});

// 2. Eligible Students Directory for Examination
examRouter.get('/students', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const allStudents = await db.getStudents();
  const summaryList = await Promise.all(
    allStudents.map(async s => {
      const fees = await db.getStudentFees(s.id);
      const activeFees = fees.filter(f => f.status !== 'cancelled');
      const totalDue = Math.round(activeFees.reduce((acc, f) => acc + (f.status !== 'paid' ? f.due_amount : 0), 0) * 100) / 100;
      const attendance = s.total_classes === 0 ? (s.attendance_percentage ?? 100) : Math.round((s.attended_classes / s.total_classes) * 100);

      return {
        id: s.id,
        student_id: s.student_id,
        enterprise_uid: (s as any).enterprise_uid || s.student_id,
        first_name: s.first_name,
        last_name: s.last_name,
        full_name: `${s.first_name} ${s.last_name}`,
        course_id: s.course_id,
        current_semester: s.current_semester || 1,
        attendance_percentage: attendance,
        condonation_granted: Boolean(s.condonation_granted),
        total_outstanding_due: totalDue,
        is_attendance_eligible: attendance >= 75 || (Boolean(s.condonation_granted) && attendance >= 65),
        is_fee_cleared: totalDue <= 0.01,
      };
    })
  );

  res.json({ success: true, students: summaryList });
});

// 3. Detailed Student Examination Profile & Eligibility Matrix
examRouter.get('/student-profile/:identifier', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { identifier } = req.params;
  const allStudents = await db.getStudents();

  let student: Student | undefined;
  if (req.user?.role === 'student') {
    student = allStudents.find(s => s.user_id === req.user?.id || s.email === req.user?.email || s.student_id === req.user?.username);
  } else {
    student = identifier === 'me'
      ? allStudents[0] // Fallback to first student if admin checks 'me'
      : findStudent(allStudents, identifier);
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student record not found.' });
    return;
  }

  const course = await db.getCourseById(student.course_id);
  const studentFees = await db.getStudentFees(student.id);

  // Clearance checks
  const activeFees = studentFees.filter(f => f.status !== 'cancelled');
  const totalOutstandingDue = Math.round(activeFees.reduce((acc, f) => acc + (f.status !== 'paid' ? f.due_amount : 0), 0) * 100) / 100;
  const isFeeCleared = totalOutstandingDue <= 0.01;

  const attendance = student.total_classes === 0 ? (student.attendance_percentage ?? 100) : Math.round((student.attended_classes / student.total_classes) * 100);
  const isCondoned = Boolean(student.condonation_granted);
  const isAttendanceEligible = attendance >= 75 || (isCondoned && attendance >= 65);

  const holdReasons: string[] = [];
  if (!isFeeCleared) {
    holdReasons.push(`Accounts Branch Hold: Outstanding fee balance of ₹${totalOutstandingDue.toLocaleString('en-IN')} pending clearance.`);
  }
  if (!isAttendanceEligible) {
    if (attendance < 65) {
      holdReasons.push(`Attendance Strict Detention: Attendance is ${attendance}%, below minimum condonable threshold (<65%).`);
    } else {
      holdReasons.push(`Attendance Detention: Attendance is ${attendance}%, below mandatory 75% cutoff. Dean/HOD condonation order required.`);
    }
  }

  const isEligible = isFeeCleared && isAttendanceEligible;
  const semester = student.current_semester || 1;
  const courseCode = course?.code || 'CS';

  // Regular Course Papers
  const regularPapers = [
    { paperCode: `${courseCode}-${semester}01`, subjectTitle: 'Distributed Cloud Architecture & Microservices', credits: 4, type: 'Core Theory', maxMarks: 100, examDate: '2026-05-18', session: 'Morning (09:30 AM - 12:30 PM)' },
    { paperCode: `${courseCode}-${semester}02`, subjectTitle: 'Advanced Database Engines & Distributed Querying', credits: 4, type: 'Core Theory', maxMarks: 100, examDate: '2026-05-21', session: 'Morning (09:30 AM - 12:30 PM)' },
    { paperCode: `${courseCode}-${semester}03`, subjectTitle: 'Computer Networks & Zero-Trust Security Protocols', credits: 4, type: 'Core Theory', maxMarks: 100, examDate: '2026-05-25', session: 'Morning (09:30 AM - 12:30 PM)' },
    { paperCode: `${courseCode}-${semester}04`, subjectTitle: 'Design and Analysis of Scalable Algorithms', credits: 4, type: 'Core Theory', maxMarks: 100, examDate: '2026-05-28', session: 'Morning (09:30 AM - 12:30 PM)' },
    { paperCode: `${courseCode}-${semester}05`, subjectTitle: 'Universal Human Values & Professional Ethics', credits: 3, type: 'Mandatory Audit', maxMarks: 100, examDate: '2026-06-01', session: 'Morning (09:30 AM - 12:30 PM)' },
    { paperCode: `${courseCode}-${semester}06`, subjectTitle: 'Practical Lab 1 - Cloud Computing & DevOps Practicum', credits: 2, type: 'Practical Lab', maxMarks: 50, examDate: '2026-06-04', session: 'Evening (01:30 PM - 04:30 PM)' },
    { paperCode: `${courseCode}-${semester}07`, subjectTitle: 'Practical Lab 2 - Network Architecture & Penetration Testing', credits: 2, type: 'Practical Lab', maxMarks: 50, examDate: '2026-06-06', session: 'Evening (01:30 PM - 04:30 PM)' },
  ];

  // Historical Backlog / Reappear Papers (from Semesters < current_semester)
  const reappearPapers = semester > 1 ? [
    { paperCode: `${courseCode}-102`, subjectTitle: 'Discrete Mathematical Structures & Graph Theory', semester: 1, credits: 4, internalMarks: 24, externalMarks: 16, totalMarks: 40, status: 'REAPPEAR_EXTERNAL', fee: 700 },
    { paperCode: `${courseCode}-203`, subjectTitle: 'Digital Systems & Microprocessor Architectures', semester: 2, credits: 4, internalMarks: 28, externalMarks: 14, totalMarks: 42, status: 'REAPPEAR_EXTERNAL', fee: 700 },
  ] : [];

  // Check submissions in memory registry
  const studentSubs = examSubmissions.get(student.id) || [];
  const regularSub = studentSubs.find(s => s.submissionType === 'REGULAR' && s.semester === semester);
  const reappearSub = studentSubs.find(s => s.submissionType === 'REAPPEAR' && s.semester === semester);

  res.json({
    success: true,
    student: {
      id: student.id,
      student_id: student.student_id,
      enterprise_uid: (student as any).enterprise_uid || student.student_id,
      full_name: `${student.first_name} ${student.last_name}`,
      first_name: student.first_name,
      last_name: student.last_name,
      father_name: student.guardian_name || 'N/A',
      mother_name: (student as any).mother_name || 'N/A',
      course_id: student.course_id,
      course_name: course?.name || 'B.Tech Computer Science & Engineering',
      current_semester: semester,
      university_roll_no: `230${student.student_id?.replace(/\D/g, '').slice(-5) || '10482'}`,
      registration_no: `MRSPTU-BFGI-${student.admission_year || '2023'}-${student.student_id?.slice(-3) || '088'}`,
      affiliation: 'Autonomous Campus • Multi-Affiliated (PUP Patiala • MRSPTU • PU)',
    },
    clearance: {
      isEligible,
      status: isEligible ? 'RELEASED' : 'WITHHELD',
      holdReasons,
      attendancePercentage: attendance,
      totalClasses: student.total_classes || 120,
      attendedClasses: student.attended_classes || 96,
      condonationGranted: isCondoned,
      condonationOrderNo: student.condonation_order_no || null,
      totalOutstandingDue,
      isFeeCleared,
    },
    regularPapers,
    reappearPapers,
    regularSubmission: regularSub || null,
    reappearSubmission: reappearSub || null,
  });
});

// 4. Submit Regular Examination Form
examRouter.post('/regular-form', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, semester, selectedPapers, centerAllotted = 'Center 104 (BFGI Main Campus)' } = req.body;
  const allStudents = await db.getStudents();
  const student = findStudent(allStudents, studentId);

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const existing = examSubmissions.get(student.id) || [];
  const submissionId = `EXAM-REG-${Date.now().toString().slice(-6)}`;
  const record: ExamSubmissionRecord = {
    id: submissionId,
    studentId: student.id,
    semester: Number(semester) || student.current_semester || 1,
    academicYear: '2025-2026',
    submissionType: 'REGULAR',
    subjectCodes: selectedPapers || [],
    totalFeePaid: 1200,
    paymentRef: `FEE-EXAM-${Date.now().toString().slice(-6)}`,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    verificationHash: `SHA256:COE:${student.student_id}:${Date.now()}`,
    centerAllotted,
  };

  examSubmissions.set(student.id, [...existing.filter(e => !(e.submissionType === 'REGULAR' && e.semester === record.semester)), record]);

  await db.createAuditLog({
    user_id: req.user?.id || 'admin',
    action: 'EXAM_REGULAR_FORM_SUBMITTED',
    details: `Regular Examination Form submitted for ${student.first_name} ${student.last_name} (${student.student_id}) Sem ${record.semester}. Ref: ${submissionId}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'Regular Examination Form registered successfully with COE Office.',
    record,
  });
});

// 5. Submit Reappear / Backlog Examination Form with Dynamic Fee
examRouter.post('/reappear-form', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, semester, selectedPapers, paymentMode = 'online_upi' } = req.body;
  const allStudents = await db.getStudents();
  const student = findStudent(allStudents, studentId);

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const paperCount = (selectedPapers && selectedPapers.length) || 1;
  const feeAmount = paperCount * 700;
  const submissionId = `EXAM-REAP-${Date.now().toString().slice(-6)}`;
  const paymentRef = `REAP-PAY-${Date.now().toString().slice(-6)}`;

  const existing = examSubmissions.get(student.id) || [];
  const record: ExamSubmissionRecord = {
    id: submissionId,
    studentId: student.id,
    semester: Number(semester) || student.current_semester || 1,
    academicYear: '2025-2026',
    submissionType: 'REAPPEAR',
    subjectCodes: selectedPapers || [],
    totalFeePaid: feeAmount,
    paymentRef,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    verificationHash: `SHA256:REAP:${student.student_id}:${Date.now()}`,
    centerAllotted: 'Center 108 (BFGI Main Campus)',
  };

  examSubmissions.set(student.id, [...existing.filter(e => !(e.submissionType === 'REAPPEAR' && e.semester === record.semester)), record]);

  await db.createAuditLog({
    user_id: req.user?.id || 'admin',
    action: 'EXAM_REAPPEAR_FORM_SUBMITTED',
    details: `Reappear Examination Form submitted for ${student.first_name} ${student.last_name} (${student.student_id}) with ${paperCount} papers. Total fee ₹${feeAmount} (${paymentMode}). Ref: ${submissionId}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Reappear Examination Form for ${paperCount} paper(s) submitted. Statutory fee ₹${feeAmount} collected.`,
    record,
  });
});

// 6. Dean / HOD Attendance Condonation Action (Instant Gate Unblock)
examRouter.post('/condone-attendance', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, orderNo = `ORD-COE-COND-${Date.now().toString().slice(-5)}`, reason = 'Authorized under University Ordinance 7.4 on Sports / Medical Representation' } = req.body;
  const allStudents = await db.getStudents();
  const student = findStudent(allStudents, studentId);

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  student.condonation_granted = 1;
  student.condonation_order_no = orderNo;
  student.condonation_remarks = reason;
  await db.updateStudent(student.id, {
    condonation_granted: 1,
    condonation_order_no: orderNo,
    condonation_remarks: reason,
  });

  await db.createAuditLog({
    user_id: req.user?.id || 'admin',
    action: 'EXAM_ATTENDANCE_CONDONED',
    details: `Dean/COE attendance condonation granted for ${student.first_name} ${student.last_name} (${student.student_id}). Order: ${orderNo}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Attendance condoned for ${student.first_name} ${student.last_name}. Admit Card gate restriction lifted.`,
    orderNo,
  });
});

// 7. Instant Fee Clearance Simulation for Testing
examRouter.post('/clear-fee-dues', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.body;
  const allStudents = await db.getStudents();
  const student = findStudent(allStudents, studentId);

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const fees = await db.getStudentFees(student.id);
  for (const f of fees) {
    if (f.status !== 'paid') {
      f.paid_amount = f.total_amount;
      f.due_amount = 0;
      f.status = 'paid';
    }
  }

  await db.createAuditLog({
    user_id: req.user?.id || 'admin',
    action: 'EXAM_FEES_RECONCILED',
    details: `Accounts branch clearance recorded for ${student.first_name} ${student.last_name} (${student.student_id}) to clear examination hold.`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Financial ledger for ${student.first_name} ${student.last_name} marked as No-Dues. Examination gate clearance granted.`,
  });
});

// 8. Official Master Datesheets Archive with Filters
examRouter.get('/datesheets', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { university, course, semester } = req.query;

  const allDatesheets = [
    {
      id: 'ds-01',
      university: 'MRSPTU',
      course: 'B.Tech Computer Science & Engineering',
      courseCode: 'B.Tech CS',
      semester: 4,
      paperCode: 'CS-401',
      subjectTitle: 'Distributed Cloud Architecture & Microservices',
      examDate: '2026-05-18',
      day: 'Monday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 104',
      allowedMaterials: 'Non-programmable Scientific Calculator',
    },
    {
      id: 'ds-02',
      university: 'MRSPTU',
      course: 'B.Tech Computer Science & Engineering',
      courseCode: 'B.Tech CS',
      semester: 4,
      paperCode: 'CS-402',
      subjectTitle: 'Advanced Database Engines & Distributed Querying',
      examDate: '2026-05-21',
      day: 'Thursday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 104',
      allowedMaterials: 'None',
    },
    {
      id: 'ds-03',
      university: 'MRSPTU',
      course: 'B.Tech Computer Science & Engineering',
      courseCode: 'B.Tech CS',
      semester: 4,
      paperCode: 'CS-403',
      subjectTitle: 'Computer Networks & Zero-Trust Security Protocols',
      examDate: '2026-05-25',
      day: 'Monday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 104',
      allowedMaterials: 'None',
    },
    {
      id: 'ds-04',
      university: 'MRSPTU',
      course: 'B.Tech Computer Science & Engineering',
      courseCode: 'B.Tech CS',
      semester: 4,
      paperCode: 'CS-404',
      subjectTitle: 'Design and Analysis of Scalable Algorithms',
      examDate: '2026-05-28',
      day: 'Thursday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 104',
      allowedMaterials: 'None',
    },
    {
      id: 'ds-05',
      university: 'MRSPTU',
      course: 'B.Tech Computer Science & Engineering',
      courseCode: 'B.Tech CS',
      semester: 4,
      paperCode: 'CS-405',
      subjectTitle: 'Universal Human Values & Professional Ethics',
      examDate: '2026-06-01',
      day: 'Monday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 104',
      allowedMaterials: 'None',
    },
    {
      id: 'ds-06',
      university: 'PUP',
      course: 'MBA Financial Technology & Management',
      courseCode: 'MBA Finance',
      semester: 2,
      paperCode: 'MBA-201',
      subjectTitle: 'Corporate Financial Engineering & Valuation',
      examDate: '2026-05-19',
      day: 'Tuesday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 108',
      allowedMaterials: 'Financial Calculator',
    },
    {
      id: 'ds-07',
      university: 'PUP',
      course: 'MBA Financial Technology & Management',
      courseCode: 'MBA Finance',
      semester: 2,
      paperCode: 'MBA-202',
      subjectTitle: 'Quantitative Risk Management & Hedging Strategies',
      examDate: '2026-05-22',
      day: 'Friday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 108',
      allowedMaterials: 'Statistical Tables',
    },
    {
      id: 'ds-08',
      university: 'PU',
      course: 'Bachelor of Science in Applied Physics',
      courseCode: 'B.Sc Physics',
      semester: 6,
      paperCode: 'PHY-601',
      subjectTitle: 'Quantum Mechanics II & Relativistic Electrodynamics',
      examDate: '2026-05-20',
      day: 'Wednesday',
      session: 'Morning (09:30 AM - 12:30 PM)',
      centerCode: 'Center 104',
      allowedMaterials: 'Log Tables',
    },
  ];

  let filtered = allDatesheets;
  if (university && university !== 'ALL') {
    filtered = filtered.filter(d => d.university === university);
  }
  if (course && course !== 'ALL') {
    filtered = filtered.filter(d => d.courseCode.includes(course as string) || d.course.includes(course as string));
  }
  if (semester && semester !== 'ALL') {
    filtered = filtered.filter(d => d.semester === Number(semester));
  }

  res.json({ success: true, count: filtered.length, datesheets: filtered });
});

// 9. Official Tripartite Admit Card Record
examRouter.get('/admit-card/:identifier', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { identifier } = req.params;
  const allStudents = await db.getStudents();

  let student: Student | undefined;
  if (req.user?.role === 'student') {
    student = allStudents.find(s => s.user_id === req.user?.id || s.student_id === req.user?.username);
  } else {
    student = identifier === 'me' ? allStudents[0] : findStudent(allStudents, identifier);
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const course = await db.getCourseById(student.course_id);
  const studentFees = await db.getStudentFees(student.id);

  const activeFees = studentFees.filter(f => f.status !== 'cancelled');
  const totalOutstandingDue = Math.round(activeFees.reduce((acc, f) => acc + (f.status !== 'paid' ? f.due_amount : 0), 0) * 100) / 100;
  const isFeeCleared = totalOutstandingDue <= 0.01;

  const attendance = student.total_classes === 0 ? (student.attendance_percentage ?? 100) : Math.round((student.attended_classes / student.total_classes) * 100);
  const isCondoned = Boolean(student.condonation_granted);
  const isAttendanceEligible = attendance >= 75 || (isCondoned && attendance >= 65);

  const isEligible = isFeeCleared && isAttendanceEligible;
  const holdReasons: string[] = [];
  if (!isFeeCleared) holdReasons.push(`Accounts Due: ₹${totalOutstandingDue.toLocaleString('en-IN')}`);
  if (!isAttendanceEligible) holdReasons.push(`Attendance Shortage: ${attendance}% (<75%)`);

  const semester = student.current_semester || 1;
  const courseCode = course?.code || 'CS';

  res.json({
    success: true,
    isEligible,
    status: isEligible ? 'RELEASED' : 'WITHHELD',
    holdReasons,
    admitCard: {
      institution: 'BABA FARID GROUP OF INSTITUTIONS (BATHINDA)',
      subHeader: 'Autonomous Campus Examination Branch • Multi-Affiliated (PUP Patiala • MRSPTU • PU)',
      examinationSession: 'May-June 2026 Regular & Reappear Semester Examination',
      rollNumber: `230${student.student_id?.replace(/\D/g, '').slice(-5) || '10482'}`,
      registrationNumber: `MRSPTU-BFGI-${student.admission_year || '2023'}-${student.student_id?.slice(-3) || '088'}`,
      enterpriseUid: (student as any).enterprise_uid || student.student_id,
      candidateName: `${student.first_name} ${student.last_name}`,
      fatherName: student.guardian_name || 'N/A',
      motherName: (student as any).mother_name || 'N/A',
      courseName: course?.name || 'B.Tech Computer Science & Engineering',
      semester,
      centerCode: '104 (BFGI Main Campus, Bathinda)',
      centerSuperintendent: 'Prof. Amritpal Singh (Chief Controller of Examinations)',
      barcode: `*${student.student_id}-${semester}-2026*`,
      qrPayload: `VERIFIED:MRSPTU:BFGI:${student.student_id}:${semester}:RELEASED`,
      schedule: [
        { paperCode: `${courseCode}-${semester}01`, subjectTitle: 'Distributed Cloud Architecture & Microservices', examDate: '2026-05-18', session: 'Morning (09:30 AM - 12:30 PM)', serialBox: 'ANS-____' },
        { paperCode: `${courseCode}-${semester}02`, subjectTitle: 'Advanced Database Engines & Distributed Querying', examDate: '2026-05-21', session: 'Morning (09:30 AM - 12:30 PM)', serialBox: 'ANS-____' },
        { paperCode: `${courseCode}-${semester}03`, subjectTitle: 'Computer Networks & Zero-Trust Security Protocols', examDate: '2026-05-25', session: 'Morning (09:30 AM - 12:30 PM)', serialBox: 'ANS-____' },
        { paperCode: `${courseCode}-${semester}04`, subjectTitle: 'Design and Analysis of Scalable Algorithms', examDate: '2026-05-28', session: 'Morning (09:30 AM - 12:30 PM)', serialBox: 'ANS-____' },
        { paperCode: `${courseCode}-${semester}05`, subjectTitle: 'Universal Human Values & Professional Ethics', examDate: '2026-06-01', session: 'Morning (09:30 AM - 12:30 PM)', serialBox: 'ANS-____' },
        { paperCode: `${courseCode}-${semester}06`, subjectTitle: 'Practical Lab 1 - Cloud Computing & DevOps Practicum', examDate: '2026-06-04', session: 'Evening (01:30 PM - 04:30 PM)', serialBox: 'ANS-____' },
      ],
      instructions: [
        'Candidate must present this original Slip along with Institutional RFID Smart Identity Card.',
        'Strictly prohibited: Programmable calculators, mobile phones, smartwatches, and unauthorized slips in exam hall.',
        'Entry closes 15 minutes after paper commencement. No candidate permitted to leave before 2 hours.',
        'Any violation shall attract disciplinary proceedings under MRSPTU/PUP UMC Ordinances.',
      ],
    },
  });
});

// 10. CBCS Semester Grade Card & Results Gazette
examRouter.get('/results/:identifier', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { identifier } = req.params;
  const allStudents = await db.getStudents();
  const student = identifier === 'me' && req.user?.role !== 'student' ? allStudents[0] : findStudent(allStudents, identifier);

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const course = await db.getCourseById(student.course_id);
  const semester = student.current_semester || 1;
  const courseCode = course?.code || 'CS';

  const grades = [
    { code: `${courseCode}-${semester - 1}01`, title: 'Data Structures & Algorithmic Foundations', credits: 4, grade: 'A+', gradePoint: 9, creditPoints: 36, internal: 38, external: 54, total: 92 },
    { code: `${courseCode}-${semester - 1}02`, title: 'Computer Architecture & Assembly Language', credits: 4, grade: 'A', gradePoint: 8, creditPoints: 32, internal: 35, external: 49, total: 84 },
    { code: `${courseCode}-${semester - 1}03`, title: 'Operating Systems & System Programming', credits: 4, grade: 'O', gradePoint: 10, creditPoints: 40, internal: 39, external: 56, total: 95 },
    { code: `${courseCode}-${semester - 1}04`, title: 'Object Oriented Software Engineering', credits: 4, grade: 'B+', gradePoint: 7, creditPoints: 28, internal: 32, external: 44, total: 76 },
    { code: `${courseCode}-${semester - 1}05`, title: 'Discrete Mathematical Structures', credits: 4, grade: 'A', gradePoint: 8, creditPoints: 32, internal: 34, external: 50, total: 84 },
    { code: `${courseCode}-${semester - 1}06`, title: 'Data Structures Practicum Laboratory', credits: 2, grade: 'O', gradePoint: 10, creditPoints: 20, internal: 48, external: 46, total: 94 },
  ];

  const totalCredits = grades.reduce((acc, g) => acc + g.credits, 0);
  const totalCreditPoints = grades.reduce((acc, g) => acc + g.creditPoints, 0);
  const sgpa = Math.round((totalCreditPoints / totalCredits) * 100) / 100;
  const cgpa = Math.round(((sgpa + 8.42 + 8.70) / 3) * 100) / 100;

  res.json({
    success: true,
    resultGazette: {
      studentName: `${student.first_name} ${student.last_name}`,
      rollNumber: `230${student.student_id?.replace(/\D/g, '').slice(-5) || '10482'}`,
      registrationNumber: `MRSPTU-BFGI-${student.admission_year || '2023'}-${student.student_id?.slice(-3) || '088'}`,
      courseName: course?.name || 'B.Tech Computer Science & Engineering',
      semester: semester - 1 > 0 ? semester - 1 : 1,
      academicSession: 'Nov-Dec 2025 Regular Examination',
      resultStatus: 'PASS (First Division with Distinction)',
      totalCredits,
      earnedCredits: totalCredits,
      sgpa,
      cgpa,
      grades,
    },
  });
});
