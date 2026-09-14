import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const reportRouter = Router();

// Export Students Master Table as CSV (Admin/Staff only)
reportRouter.get('/export-students-csv', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const escapeCsv = (val: any): string => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Course', 'Session', 'Semester', 'Admission Year', 'Fees Status', 'Attendance %'];
  
  const students = await db.getStudents();
  const courses = await db.getCourses();
  const sessions = await db.getSessions();

  const rows = students.map(s => {
    const course = courses.find(c => c.id === s.course_id);
    const session = sessions.find(ses => ses.id === s.session_id);
    return [
      escapeCsv(s.student_id),
      escapeCsv(s.first_name),
      escapeCsv(s.last_name),
      escapeCsv(s.email),
      escapeCsv(s.phone),
      escapeCsv(course?.code || s.course_id),
      escapeCsv(session?.name || s.session_id),
      s.current_semester,
      s.admission_year,
      escapeCsv(s.fees_status.toUpperCase()),
      `${s.attendance_percentage}%`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="EduCore_Students_Export_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.status(200).send(csvContent);
});

// Admissions and Enrollment distribution by course (Admin/Staff only)
reportRouter.get('/admissions-by-course', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const courses = await db.getCourses();
  const students = await db.getStudents();
  const allFees = await db.getStudentFees();

  const distribution = courses.map(c => {
    const studentsInCourse = students.filter(s => s.course_id === c.id);
    const courseFeeRecords = allFees.filter(f => studentsInCourse.some(s => s.id === f.student_id));
    const totalCollected = courseFeeRecords.reduce((acc, f) => acc + f.paid_amount, 0);
    const totalDue = courseFeeRecords.reduce((acc, f) => acc + (f.status !== 'paid' && f.status !== 'cancelled' ? f.due_amount : 0), 0);

    return {
      courseId: c.id,
      courseCode: c.code,
      courseName: c.name,
      department: c.department,
      studentCount: studentsInCourse.length,
      paidCount: studentsInCourse.filter(s => s.fees_status === 'paid').length,
      dueCount: studentsInCourse.filter(s => s.fees_status !== 'paid').length,
      totalCollected,
      totalDue,
    };
  });

  res.json({ success: true, distribution });
});
