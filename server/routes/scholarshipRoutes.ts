import { Router, Response } from 'express';
import { db, ScholarshipApplication, Scheme } from '../db.ts';
import { upload } from '../middleware/upload.ts';
import { authenticateToken, requireRole, AuthRequest, matchStudentForUser } from '../middleware/auth.ts';

export const scholarshipRouter = Router();

// List all active scholarship schemes (Authenticated)
scholarshipRouter.get('/schemes', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const schemes = await db.getSchemes();
  res.json({ success: true, count: schemes.length, schemes });
});

// Admin: Create scholarship scheme
scholarshipRouter.post('/schemes', authenticateToken, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const { code, title, description, award_amount, eligibility_criteria, deadline } = req.body;

  if (!title || !award_amount || !deadline) {
    res.status(400).json({ success: false, error: 'Scheme title, award amount, and deadline are required.' });
    return;
  }

  const newScheme: Scheme = {
    id: `sch-${Date.now()}`,
    code: code || `SCH-${Date.now().toString().slice(-4)}`,
    title,
    description: description || '',
    award_amount: parseFloat(award_amount),
    eligibility_criteria: eligibility_criteria || 'Merit and need based eligibility criteria.',
    deadline,
    is_active: true,
  };

  db.schemes.push(newScheme);
  db.save();

  res.status(201).json({ success: true, message: 'Scholarship scheme added successfully.', scheme: newScheme });
});

// Student: Apply for scholarship (Authenticated, scoped)
scholarshipRouter.post('/apply', authenticateToken, upload.single('document'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { schemeId, studentId, annualFamilyIncome, previousGpa, reasonForApplication } = req.body;

  if (!schemeId || !reasonForApplication) {
    res.status(400).json({ success: false, error: 'Scheme ID and statement of purpose/reason are mandatory.' });
    return;
  }

  const schemes = await db.getSchemes();
  const scheme = schemes.find(s => s.id === schemeId || s.code === schemeId);
  if (!scheme) {
    res.status(404).json({ success: false, error: 'Scholarship scheme not found.' });
    return;
  }

  const allStudents = await db.getStudents();
  let student = allStudents.find(s => matchStudentForUser(s, req.user));
  if (!student && req.user?.role !== 'student') {
    student = allStudents.find(s => s.id === studentId || s.student_id === studentId) || allStudents[0];
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student record not found for your account.' });
    return;
  }

  const docPath = req.file ? `/uploads/documents/${req.file.filename}` : '/uploads/documents/sample_income_cert.pdf';

  const application: ScholarshipApplication = {
    id: `appl-${Date.now()}`,
    scheme_id: scheme.id,
    student_id: student.id,
    annual_family_income: annualFamilyIncome ? parseFloat(annualFamilyIncome) : 350000,
    previous_gpa: previousGpa ? parseFloat(previousGpa) : 8.5,
    reason_for_application: reasonForApplication,
    document_path: docPath,
    status: 'submitted',
    created_at: new Date().toISOString(),
  };

  await db.createScholarshipApplication(application);

  res.status(201).json({
    success: true,
    message: `Scholarship application for ${scheme.title} submitted successfully. Track your review status in portal.`,
    application,
  });
});

// List applications (Authenticated, scoped for students)
scholarshipRouter.get('/applications', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, status } = req.query;

  const rawApps = await db.getScholarshipApplications();
  const schemes = await db.getSchemes();
  const students = await db.getStudents();
  const courses = await db.getCourses();

  let list = rawApps.map(app => {
    const scheme = schemes.find(s => s.id === app.scheme_id);
    const student = students.find(s => s.id === app.student_id);
    const course = courses.find(c => c.id === student?.course_id);
    return {
      ...app,
      schemeTitle: scheme?.title,
      awardAmount: scheme?.award_amount,
      studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
      studentId: student?.student_id,
      course: course?.code,
    };
  });

  if (req.user?.role === 'student') {
    const student = students.find(s => matchStudentForUser(s, req.user));
    if (student) {
      list = list.filter(a => a.student_id === student.id);
    } else {
      list = [];
    }
  } else if (studentId && typeof studentId === 'string') {
    list = list.filter(a => a.student_id === studentId);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(a => a.status === status);
  }

  res.json({ success: true, count: list.length, applications: list });
});

// Admin Review (Approve / Reject + remarks)
scholarshipRouter.patch('/applications/:id/review', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const allApps = await db.getScholarshipApplications();
  const app = allApps.find(a => a.id === id);
  if (!app) {
    res.status(404).json({ success: false, error: 'Scholarship application not found.' });
    return;
  }

  if (!['submitted', 'under_review', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid application status value.' });
    return;
  }

  const updated = await db.updateScholarshipApplication(app.id, {
    status: status as any,
    admin_remarks: remarks || app.admin_remarks,
    reviewed_by: req.user?.id,
    reviewed_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Application has been marked as '${status}'.`,
    application: updated || app,
  });
});
