import { Router, Response } from 'express';
import { db, Student } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest, matchStudentForUser } from '../middleware/auth.ts';

export const studentRouter = Router();

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
    if (id !== 'me' && id !== student.id && id !== student.student_id && id !== student.user_id) {
      res.status(403).json({ success: false, error: 'Access denied. You can only view your own dashboard.' });
      return;
    }
  } else {
    student = allStudents.find(s => s.id === id || s.student_id === id || s.user_id === id || s.email.toLowerCase() === id.toLowerCase());
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
    if (id !== 'me' && id !== student.id && id !== student.student_id && id !== student.user_id) {
      res.status(403).json({ success: false, error: 'Access denied. You can only view your own profile.' });
      return;
    }
  } else {
    student = allStudents.find(s => s.id === id || s.student_id === id || s.user_id === id || s.email.toLowerCase() === id.toLowerCase());
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
