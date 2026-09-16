import { Router, Response } from 'express';
import { z } from 'zod';
import { db, Grievance } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest, matchStudentForUser } from '../middleware/auth.ts';

export const grievanceRouter = Router();

const createGrievanceSchema = z.object({
  category: z.enum([
    'academic',
    'examination',
    'hostel',
    'transport',
    'fee_finance',
    'anti_ragging',
    'infrastructure',
    'general',
  ]),
  subject: z.string().min(5, 'Subject must be at least 5 characters long').max(200),
  description: z.string().min(15, 'Please provide a detailed description (min 15 characters)'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  studentId: z.string().optional(),
});

// List grievances (Role-Scoped)
grievanceRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, category } = req.query;

  if (req.user?.role === 'student') {
    const students = await db.getStudents();
    const student = students.find(s => matchStudentForUser(s, req.user));
    if (!student) {
      res.status(404).json({ success: false, error: 'Student profile not found for user account.' });
      return;
    }
    const list = await db.getGrievances({
      student_id: student.id,
      status: typeof status === 'string' ? status : undefined,
      category: typeof category === 'string' ? category : undefined,
    });
    res.json({ success: true, count: list.length, grievances: list });
    return;
  }

  // Admin / Staff: view all grievances
  const list = await db.getGrievances({
    status: typeof status === 'string' ? status : undefined,
    category: typeof category === 'string' ? category : undefined,
  });

  res.json({ success: true, count: list.length, grievances: list });
});

// Get grievance by ID or Tracking Code
grievanceRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const grievance = await db.getGrievanceById(id);

  if (!grievance) {
    res.status(404).json({ success: false, error: 'Grievance ticket not found.' });
    return;
  }

  if (req.user?.role === 'student') {
    const students = await db.getStudents();
    const student = students.find(s => matchStudentForUser(s, req.user));
    if (!student || (grievance.student_id !== student.id && grievance.student_id !== student.student_id)) {
      res.status(403).json({ success: false, error: 'Access denied. You can only inspect your own grievances.' });
      return;
    }
  }

  res.json({ success: true, grievance });
});

// Submit new grievance (Student or Admin intake)
grievanceRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = createGrievanceSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: parseResult.error.errors.map(e => e.message).join(', ') });
    return;
  }

  const { category, subject, description, priority, studentId } = parseResult.data;

  let targetStudentId = studentId;
  let targetStudentName = req.user?.full_name || 'Student';

  if (req.user?.role === 'student') {
    const students = await db.getStudents();
    const student = students.find(s => matchStudentForUser(s, req.user));
    if (!student) {
      res.status(404).json({ success: false, error: 'Student profile not found.' });
      return;
    }
    targetStudentId = student.id;
    targetStudentName = `${student.first_name} ${student.last_name}`;
  } else {
    // Admin submitting on behalf of a student
    if (studentId) {
      const student = await db.getStudentById(studentId);
      if (student) {
        targetStudentId = student.id;
        targetStudentName = `${student.first_name} ${student.last_name}`;
      }
    }
  }

  if (!targetStudentId) {
    res.status(400).json({ success: false, error: 'A valid studentId is required to register a grievance.' });
    return;
  }

  // UGC SGRC Rule: Prevent duplicate active unresolved tickets for identical subject
  const existingGrievances = await db.getGrievances({ student_id: targetStudentId });
  const duplicateActive = existingGrievances.find(
    g => g.subject.trim().toLowerCase() === subject.trim().toLowerCase() && g.status !== 'resolved'
  );
  if (duplicateActive) {
    res.status(409).json({
      success: false,
      error: `An active grievance ticket with subject "${subject}" is already lodged and under committee review (Tracking: ${duplicateActive.tracking_code}). Duplicate submissions are rejected.`,
    });
    return;
  }

  const trackingCode = `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newGrievance: Grievance = {
    id: `grv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tracking_code: trackingCode,
    student_id: targetStudentId,
    student_name: targetStudentName,
    category,
    subject,
    description,
    priority,
    status: 'submitted',
    created_at: new Date().toISOString(),
  };

  await db.createGrievance(newGrievance);

  res.status(201).json({
    success: true,
    message: `Grievance successfully lodged under UGC redressal cell. Tracking token: ${trackingCode}`,
    trackingCode,
    grievance: newGrievance,
  });
});

// Admin/Staff: Adjudicate & Resolve Grievance
grievanceRouter.patch('/:id/resolve', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, adminRemarks } = req.body;

  if (!['submitted', 'under_investigation', 'resolved', 'dismissed'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid grievance status.' });
    return;
  }

  const existing = await db.getGrievanceById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'Grievance ticket not found.' });
    return;
  }

  const updates: Partial<Grievance> = {
    status,
    admin_remarks: adminRemarks || existing.admin_remarks,
    resolved_by: req.user?.username || 'admin',
    resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : undefined,
  };

  const updated = await db.updateGrievance(existing.id, updates);

  res.json({
    success: true,
    message: `Grievance ticket ${existing.tracking_code} updated to '${status}'.`,
    grievance: updated,
  });
});
