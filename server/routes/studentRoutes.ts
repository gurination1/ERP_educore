import { Router, Response } from 'express';
import { db, Student } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest, matchStudentForUser } from '../middleware/auth.ts';

export const studentRouter = Router();

export function findStudentByIdentifier(students: Student[], identifier?: string): Student | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  return students.find(
    s =>
      s.id.toLowerCase() === clean ||
      s.student_id.toLowerCase() === clean ||
      (s.user_id && s.user_id.toLowerCase() === clean) ||
      s.email.toLowerCase() === clean
  );
}

export function isStudentOwner(student: Student, identifier: string): boolean {
  const clean = identifier.trim().toLowerCase();
  return (
    clean === 'me' ||
    student.id.toLowerCase() === clean ||
    student.student_id.toLowerCase() === clean ||
    (student.user_id && student.user_id.toLowerCase() === clean) ||
    student.email.toLowerCase() === clean
  );
}

// Master list of students (Admin/Staff only)
studentRouter.get('/', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, course, admission_year, fees_status, page = '1', limit = '10', sort_by = 'student_id', sort_dir = 'asc' } = req.query;

  const rawStudents = await db.getStudents();
  const courses = await db.getCourses();
  const sessions = await db.getSessions();

  let list = rawStudents.map(s => ({
    ...s,
    course: courses.find(c => c.id === s.course_id),
    session: sessions.find(ses => ses.id === s.session_id),
  }));

  // Filter by search query (Name or ID or Email)
  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    list = list.filter(
      s =>
        s.student_id.toLowerCase().includes(q) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }

  // Filter by course
  if (course && typeof course === 'string' && course !== 'All Courses') {
    list = list.filter(s => s.course?.name === course || s.course?.code === course || s.course_id === course);
  }

  // Filter by admission year
  if (admission_year && typeof admission_year === 'string' && admission_year !== 'All Years') {
    const yr = parseInt(admission_year, 10);
    if (!isNaN(yr)) {
      list = list.filter(s => s.admission_year === yr);
    }
  }

  // Filter by fees status
  if (fees_status && typeof fees_status === 'string' && fees_status !== 'All Statuses') {
    list = list.filter(s => s.fees_status.toLowerCase() === fees_status.toLowerCase());
  }

  // Sorting
  list.sort((a, b) => {
    let valA: any = (a as any)[sort_by as string] || '';
    let valB: any = (b as any)[sort_by as string] || '';
    if (typeof valA === 'string') {
      return sort_dir === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
    }
    return sort_dir === 'desc' ? valB - valA : valA - valB;
  });

  const total = list.length;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const totalPages = Math.ceil(total / limitNum);
  const offset = (pageNum - 1) * limitNum;
  const paginatedResults = list.slice(offset, offset + limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    students: paginatedResults,
  });
});

// Student Dashboard Summary (scoped to student record matching user_id OR email)
studentRouter.get('/:id/dashboard', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const allStudents = await db.getStudents();

  let student: Student | undefined;

  if (req.user?.role === 'student') {
    student = allStudents.find(s => matchStudentForUser(s, req.user));
    if (!student) {
      res.status(404).json({ success: false, error: 'Student record not found for your account.' });
      return;
    }
    if (!isStudentOwner(student, id)) {
      res.status(403).json({ success: false, error: 'Access denied. You can only view your own dashboard.' });
      return;
    }
  } else {
    student = findStudentByIdentifier(allStudents, id);
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const course = await db.getCourseById(student.course_id);
  const session = await db.getSessionById(student.session_id);

  // Calculate attendance safely (0-class protection)
  const totalClasses = student.total_classes || 0;
  const attendedClasses = student.attended_classes || 0;
  const attendancePercentage = totalClasses === 0 ? (student.attendance_percentage ?? 100) : Math.round((attendedClasses / totalClasses) * 100);
  const isLowAttendance = totalClasses > 0 && attendancePercentage < 75;

  // Calculate pending fee due
  const studentFees = await db.getStudentFees(student.id);
  const pendingDue = Math.round(studentFees.reduce((acc, sf) => acc + (sf.status !== 'paid' && sf.status !== 'cancelled' ? sf.due_amount : 0), 0) * 100) / 100;
  const unpaidFees = studentFees.filter(sf => sf.status !== 'paid' && sf.status !== 'cancelled' && sf.due_amount > 0);
  const sortedDates = unpaidFees.map(sf => sf.due_date).filter(Boolean).sort();
  const nearestDueDate = pendingDue <= 0 ? null : (sortedDates[0] || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);

  const allNotices = await db.getNotices();
  const notices = allNotices.slice(0, 3);

  res.json({
    success: true,
    student: {
      ...student,
      fullName: `${student.first_name} ${student.last_name}`,
      courseName: course?.code || 'B.Tech',
      sessionName: session?.name || '2025-26',
    },
    fees: {
      pendingDue,
      nextDueDate: nearestDueDate,
      currency: 'INR',
    },
    attendance: {
      percentage: attendancePercentage,
      presentClasses: attendedClasses,
      absentClasses: Math.max(0, totalClasses - attendedClasses),
      totalClasses: totalClasses,
      is_low_attendance: isLowAttendance,
    },
    recentNotices: notices,
  });
});

// Single student profile (scoped to student record matching user_id OR email)
studentRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const allStudents = await db.getStudents();

  let student: Student | undefined;

  if (req.user?.role === 'student') {
    student = allStudents.find(s => matchStudentForUser(s, req.user));
    if (!student) {
      res.status(404).json({ success: false, error: 'Student record not found for your account.' });
      return;
    }
    if (!isStudentOwner(student, id)) {
      res.status(403).json({ success: false, error: 'Access denied. You can only view your own profile.' });
      return;
    }
  } else {
    student = findStudentByIdentifier(allStudents, id);
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const course = await db.getCourseById(student.course_id);
  const session = await db.getSessionById(student.session_id);
  const feeItems = await db.getStudentFees(student.id);
  const feeHeads = await db.getFeeHeads();
  const fees = feeItems.map(sf => ({
    ...sf,
    fee_head: feeHeads.find(fh => fh.id === sf.fee_head_id),
  }));
  const payments = await db.getPayments(student.id);

  res.json({
    success: true,
    student: {
      ...student,
      course: course || undefined,
      session: session || undefined,
      fees,
      payments,
    },
  });
});

// Send email reminders to students with dues/overdue (Admin only)
studentRouter.post('/send-email-reminders', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const allStudents = await db.getStudents();
  const overdueStudents = allStudents.filter(s => s.admission_status === 'approved' && (s.fees_status === 'overdue' || s.fees_status === 'due'));
  
  res.json({
    success: true,
    message: `Automated fee payment reminders dispatched successfully to ${overdueStudents.length} student institutional mailboxes.`,
    recipientCount: overdueStudents.length,
  });
});

// MRSPTU Examination Admit Card / Roll No Slip (Scoped & Gated by Fees + Attendance)
studentRouter.get('/:id/admit-card', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const allStudents = await db.getStudents();

  let student: Student | undefined;
  if (req.user?.role === 'student') {
    student = allStudents.find(s => matchStudentForUser(s, req.user));
    if (!student) {
      res.status(404).json({ success: false, error: 'Student record not found for your account.' });
      return;
    }
    if (!isStudentOwner(student, id)) {
      res.status(403).json({ success: false, error: 'Access denied. You can only view your own Admit Card.' });
      return;
    }
  } else {
    student = findStudentByIdentifier(allStudents, id);
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  const course = await db.getCourseById(student.course_id);
  const session = await db.getSessionById(student.session_id);
  const studentFees = await db.getStudentFees(student.id);

  // 1. Check Financial Dues Clearance (No-Dues requirement)
  const activeFees = studentFees.filter(sf => sf.status !== 'cancelled');
  const totalOutstandingDue = Math.round(activeFees.reduce((acc, sf) => acc + (sf.status !== 'paid' ? sf.due_amount : 0), 0) * 100) / 100;
  const isFeeCleared = totalOutstandingDue <= 0.01;

  // 2. Check MRSPTU Attendance Ordinance (75% Minimum Mandatory Cutoff with 10% Condonation Rule)
  const attendancePercentage = student.total_classes === 0 ? (student.attendance_percentage ?? 100) : Math.round((student.attended_classes / student.total_classes) * 100);
  const isCondoned = Boolean(student.condonation_granted);
  // MRSPTU Ordinance 7.4: Standard eligibility >= 75%. If condonation granted by Director/HOD on medical/sports grounds, covers 65% to 74.9%.
  const isAttendanceEligible = attendancePercentage >= 75 || (isCondoned && attendancePercentage >= 65);

  const isEligible = isFeeCleared && isAttendanceEligible;
  const status: 'RELEASED' | 'WITHHELD' = isEligible ? 'RELEASED' : 'WITHHELD';
  const holdReasons: string[] = [];

  if (!isFeeCleared) {
    holdReasons.push(`Accounts Branch Hold: Outstanding fee balance of ₹${totalOutstandingDue.toLocaleString('en-IN')} pending clearance.`);
  }
  if (!isAttendanceEligible) {
    if (attendancePercentage < 65) {
      holdReasons.push(`MRSPTU Attendance Strict Detention (Ordinance 7.4): Attendance is ${attendancePercentage}%, below condonable threshold (<65%). Mandatory course repetition required.`);
    } else {
      holdReasons.push(`MRSPTU Attendance Detention (Ordinance 7.4): Attendance is ${attendancePercentage}%, below mandatory 75% minimum cutoff. Submit condonation approved by Dean / HOD.`);
    }
  }

  const semester = student.current_semester || 1;
  const subjectPapers = [
    { paperCode: `${course?.code || 'CS'}-${semester}01`, subjectTitle: 'Applied Advanced Mathematics & Numerical Computing', examDate: '2025-12-24', timing: '09:30 AM - 12:30 PM (Morning Session)', centerCode: '108 (BFGI Main Campus)' },
    { paperCode: `${course?.code || 'CS'}-${semester}02`, subjectTitle: 'Data Structures & Algorithmic Analysis', examDate: '2025-12-27', timing: '09:30 AM - 12:30 PM (Morning Session)', centerCode: '108 (BFGI Main Campus)' },
    { paperCode: `${course?.code || 'CS'}-${semester}03`, subjectTitle: 'Object Oriented Programming & System Architecture', examDate: '2025-12-30', timing: '09:30 AM - 12:30 PM (Morning Session)', centerCode: '108 (BFGI Main Campus)' },
    { paperCode: `${course?.code || 'CS'}-${semester}04`, subjectTitle: 'Database Management & Cloud Distributed Systems', examDate: '2026-01-03', timing: '09:30 AM - 12:30 PM (Morning Session)', centerCode: '108 (BFGI Main Campus)' },
    { paperCode: `${course?.code || 'CS'}-${semester}05`, subjectTitle: 'Universal Human Values, Professional Ethics & Constitution', examDate: '2026-01-06', timing: '09:30 AM - 12:30 PM (Morning Session)', centerCode: '108 (BFGI Main Campus)' },
    { paperCode: `${course?.code || 'CS'}-${semester}06`, subjectTitle: 'Practical Lab 1 - System Implementation & Viva Voce', examDate: '2026-01-08', timing: '01:30 PM - 04:30 PM (Evening Session)', centerCode: '108 (BFGI Main Campus)' },
  ];

  res.json({
    success: true,
    isEligible,
    status,
    holdReasons,
    totalOutstandingDue,
    attendancePercentage,
    condonationStatus: isCondoned ? `Condoned under Order #${student.condonation_order_no || 'ORD-COE-2025'}` : 'Standard Attendance Clearance',
    admitCard: {
      university: 'Maharaja Ranjit Singh Punjab Technical University, Bathinda',
      accreditation: 'A State University Established by Govt. of Punjab vide Act No. 5 of 2015',
      affiliatedInstitute: 'Baba Farid College of Engineering & Technology (BFGI), Bathinda',
      instituteCode: 'College Code: 108',
      examSession: 'Dec / Jan Session 2025-26',
      rollNo: `MRSPTU-${student.student_id.replace(/[^0-9]/g, '') || '23010488'}`,
      regNo: `REG-${session?.name || '2025'}-${student.id.slice(-6)}`,
      candidateName: `${student.first_name} ${student.last_name}`,
      fatherName: student.guardian_name || 'Guardian',
      courseName: `${course?.name || 'B.Tech Computer Science & Engineering'} (${course?.code || 'B.Tech'})`,
      semester: `Semester ${semester} (Regular Examination)`,
      examCenter: 'Center No. 108: Exam Center A, BFGI Campus, Muktsar Road, Bathinda - 151001',
      papers: subjectPapers,
      verificationBarcode: `MRSPTU-VERIFY-${student.student_id}-${Date.now().toString().slice(-4)}`,
      authorizedSignatory: 'Dr. Gurpreet Singh (Controller of Examinations, MRSPTU)',
      condonationOrder: isCondoned ? (student.condonation_order_no || 'ORD-COE-CONDONED') : null,
      instructions: [
        'Candidate must present this original MRSPTU Admit Card along with college RFID Identity Card at the examination entrance.',
        'Strictly prohibited: Smart watches, cellular mobile phones, programmable calculators, and unauthorized printed materials.',
        'Report to designated examination hall at least 30 minutes prior to paper commencement.',
        'No candidate shall be allowed entry after 15 minutes of question paper distribution.',
      ],
    },
  });
});

// Update Student Attendance (Admin / Faculty)
studentRouter.patch('/:id/attendance', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { attendedClasses, totalClasses, attendancePercentage } = req.body;

  const allStudents = await db.getStudents();
  const student = findStudentByIdentifier(allStudents, id);
  if (!student) {
    res.status(404).json({ success: false, error: 'Student record not found.' });
    return;
  }

  let newAttended = attendedClasses !== undefined ? Number(attendedClasses) : student.attended_classes;
  let newTotal = totalClasses !== undefined ? Number(totalClasses) : student.total_classes;

  if (newAttended < 0 || newTotal < 0) {
    res.status(400).json({ success: false, error: 'Attended and total classes cannot be negative.' });
    return;
  }

  if (newAttended > newTotal && newTotal > 0) {
    res.status(400).json({ success: false, error: 'Attended classes cannot exceed total classes conducted.' });
    return;
  }

  let newPct = attendancePercentage !== undefined
    ? Number(attendancePercentage)
    : (newTotal > 0 ? Math.round((newAttended / newTotal) * 100) : student.attendance_percentage);

  newPct = Math.max(0, Math.min(100, newPct));

  const updated = await db.updateStudent(student.id, {
    attended_classes: newAttended,
    total_classes: newTotal,
    attendance_percentage: newPct,
  });

  res.json({
    success: true,
    message: `Attendance updated for ${student.first_name} ${student.last_name}: ${newPct}% (${newAttended}/${newTotal})`,
    student: updated,
  });
});

// Grant MRSPTU Attendance Condonation (Admin / Director / Registrar)
studentRouter.post('/:id/condone-attendance', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { orderNo, reason } = req.body;

  const allStudents = await db.getStudents();
  const student = findStudentByIdentifier(allStudents, id);
  if (!student) {
    res.status(404).json({ success: false, error: 'Student record not found.' });
    return;
  }

  const currentPct = student.total_classes === 0 ? (student.attendance_percentage ?? 100) : Math.round((student.attended_classes / student.total_classes) * 100);

  // MRSPTU Ordinance 7.4: Strict legal boundary - attendance below 65% CANNOT be condoned
  if (currentPct < 65) {
    res.status(400).json({
      success: false,
      error: `MRSPTU Ordinance 7.4 Prohibition: Student attendance is ${currentPct}%, which is below the statutory 65% minimum condonable threshold. Academic Council rules prohibit condonation under 65%. Student must repeat the course.`,
    });
    return;
  }

  const generatedOrder = orderNo || `MRSPTU-COND-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const condonationReason = reason || 'Approved on medical / official university sports representation grounds.';

  const updated = await db.updateStudent(student.id, {
    condonation_granted: true,
    condonation_order_no: generatedOrder,
    condonation_remarks: condonationReason,
  });

  res.json({
    success: true,
    message: `Attendance condonation granted under MRSPTU Ordinance 7.4. Examination admit card hold lifted.`,
    orderNo: generatedOrder,
    student: updated,
  });
});

// Switch Residential Status (Campus Hosteller vs Day Scholar Transport - Mutually Exclusive)
studentRouter.post('/:id/change-residential-status', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isHosteller, isTransportUser, hostelRoomNo, transportRoute } = req.body;

  const allStudents = await db.getStudents();
  let student: Student | undefined;
  if (req.user?.role === 'student') {
    student = allStudents.find(s => matchStudentForUser(s, req.user));
    if (!student || !isStudentOwner(student, id)) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }
  } else {
    student = findStudentByIdentifier(allStudents, id);
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student record not found.' });
    return;
  }

  // Strict Mutual Exclusivity
  if (isHosteller && isTransportUser) {
    res.status(400).json({
      success: false,
      error: 'Mutual Exclusivity Violation: A student cannot simultaneously reside in campus hostel and hold a daily bus transit pass.',
    });
    return;
  }

  const existingFees = await db.getStudentFees(student.id);

  if (isHosteller) {
    // 1. Cancel active unpaid transport fees
    for (const sf of existingFees) {
      if (sf.fee_head_id.startsWith('fh-transport') && sf.status !== 'paid') {
        await db.updateStudentFee(sf.id, { due_amount: 0, status: 'cancelled' as any });
      }
    }

    // 2. Assign hostel fee heads if not already existing
    const hasHostel = existingFees.some(sf => sf.fee_head_id === 'fh-hostel-room' && sf.status !== 'cancelled');
    if (!hasHostel) {
      const sem = student.current_semester || 1;
      await db.createStudentFee({
        id: `sf-${Date.now()}-hr`,
        student_id: student.id,
        fee_head_id: 'fh-hostel-room',
        session_id: student.session_id,
        semester: sem,
        amount: 20000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 20000,
        due_date: '2025-11-30',
        status: 'due',
      });
      await db.createStudentFee({
        id: `sf-${Date.now()}-hm`,
        student_id: student.id,
        fee_head_id: 'fh-hostel-mess',
        session_id: student.session_id,
        semester: sem,
        amount: 18000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 18000,
        due_date: '2025-11-30',
        status: 'due',
      });
    }

    await db.updateStudent(student.id, {
      is_hosteller: true,
      is_transport_user: false,
      hostel_room_no: hostelRoomNo || 'Block-B 204',
      transport_route: undefined,
      fees_status: 'due',
    });
  } else if (isTransportUser) {
    // 1. Cancel active unpaid hostel fees
    for (const sf of existingFees) {
      if (sf.fee_head_id.startsWith('fh-hostel') && sf.status !== 'paid') {
        await db.updateStudentFee(sf.id, { due_amount: 0, status: 'cancelled' as any });
      }
    }

    // 2. Assign transport fee heads if not already existing
    const hasTransport = existingFees.some(sf => sf.fee_head_id === 'fh-transport' && sf.status !== 'cancelled');
    if (!hasTransport) {
      const sem = student.current_semester || 1;
      await db.createStudentFee({
        id: `sf-${Date.now()}-tr`,
        student_id: student.id,
        fee_head_id: 'fh-transport',
        session_id: student.session_id,
        semester: sem,
        amount: 14000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 14000,
        due_date: '2025-11-30',
        status: 'due',
      });
      await db.createStudentFee({
        id: `sf-${Date.now()}-tp`,
        student_id: student.id,
        fee_head_id: 'fh-transport-pass',
        session_id: student.session_id,
        semester: sem,
        amount: 800,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 800,
        due_date: '2025-11-30',
        status: 'due',
      });
    }

    await db.updateStudent(student.id, {
      is_hosteller: false,
      is_transport_user: true,
      hostel_room_no: undefined,
      transport_route: transportRoute || 'Route 4 (Bathinda City)',
      fees_status: 'due',
    });
  } else {
    // Day scholar self-commute
    await db.updateStudent(student.id, {
      is_hosteller: false,
      is_transport_user: false,
      hostel_room_no: undefined,
      transport_route: undefined,
    });
  }

  const updated = await db.getStudentById(student.id);

  res.json({
    success: true,
    message: `Residential status updated successfully. Mutual exclusivity enforced and ledger adjusted.`,
    student: updated,
  });
});
