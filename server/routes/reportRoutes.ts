import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const reportRouter = Router();

// Export Students Master Table as CSV (Admin/Staff only)
reportRouter.get('/export-students-csv', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Course', 'Session', 'Semester', 'Admission Year', 'Fees Status', 'Attendance %'];
  
  const students = await db.getStudents();
  const courses = await db.getCourses();
  const sessions = await db.getSessions();

  const rows = students.map(s => {
    const course = courses.find(c => c.id === s.course_id);
    const session = sessions.find(ses => ses.id === s.session_id);
    return [
      `"${s.student_id}"`,
      `"${s.first_name}"`,
      `"${s.last_name}"`,
      `"${s.email}"`,
      `"${s.phone}"`,
      `"${course?.code || s.course_id}"`,
      `"${session?.name || s.session_id}"`,
      s.current_semester,
      s.admission_year,
      `"${s.fees_status.toUpperCase()}"`,
      `${s.attendance_percentage}%`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="EduCore_Students_Export_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.status(200).send(csvContent);
});

// Admissions and Enrollment distribution by course (Admin/Staff only)
reportRouter.get('/admissions-by-course', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const courses = await db.getCourses();
  const students = await db.getStudents();

  const distribution = courses.map(c => {
    const studentsInCourse = students.filter(s => s.course_id === c.id);
    return {
      courseId: c.id,
      courseCode: c.code,
      courseName: c.name,
      department: c.department,
      studentCount: studentsInCourse.length,
      paidCount: studentsInCourse.filter(s => s.fees_status === 'paid').length,
      dueCount: studentsInCourse.filter(s => s.fees_status !== 'paid').length,
    };
  });

  res.json({ success: true, distribution });
});
