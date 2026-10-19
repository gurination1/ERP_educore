import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const academicTopologyRouter = Router();

// ====================================================
// 1. BATCHES (Level 4 of 5-Level Academic Topology)
// ====================================================
academicTopologyRouter.get('/batches', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const batches = await db.getBatches(courseId);
    res.json({ success: true, count: batches.length, batches });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const createBatchSchema = z.object({
  course_id: z.string().min(1),
  batch_name: z.string().min(1),
  start_year: z.number().int().min(2000).max(2050),
  end_year: z.number().int().min(2000).max(2050),
  academic_system: z.enum(['semester', 'annual']).default('semester'),
  total_terms: z.number().int().min(1).max(12).optional(),
  active_terms_json: z.string().optional(),
  current_term: z.number().int().min(1).max(12).default(1),
  is_active: z.boolean().default(true),
});

academicTopologyRouter.post('/batches', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createBatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }
    const batch = await db.createBatch(parseResult.data);
    res.status(201).json({ success: true, batch });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

academicTopologyRouter.post('/batches/:id/approve', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batchId = req.params.id;
    const actorName = req.user?.full_name || 'Academic Dean / Admin';
    const batch = await db.approveBatch(batchId, actorName);
    if (!batch) {
      res.status(404).json({ success: false, error: 'Batch not found' });
      return;
    }
    res.json({ success: true, batch });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 2. SECTIONS (Level 5 of 5-Level Academic Topology)
// ====================================================
academicTopologyRouter.get('/sections', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batchId = typeof req.query.batchId === 'string' ? req.query.batchId : undefined;
    const sections = await db.getSections(batchId);
    res.json({ success: true, count: sections.length, sections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const createSectionSchema = z.object({
  batch_id: z.string().min(1),
  section_name: z.string().min(1).max(10),
  capacity: z.number().int().min(1).max(200).default(60),
});

academicTopologyRouter.post('/sections', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createSectionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }
    const section = await db.createSection(parseResult.data);
    res.status(201).json({ success: true, section });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Non-destructive student section transfer preserving cumulative attendance & fee ledgers
academicTopologyRouter.post('/sections/transfer', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id, target_section_id, reason } = req.body;
    if (!student_id || !target_section_id) {
      res.status(400).json({ success: false, error: 'student_id and target_section_id are required' });
      return;
    }
    const actorId = req.user?.id || 'usr-admin-01';
    const result = await db.transferStudentSection(student_id, target_section_id, reason || 'Section rebalancing', actorId);
    res.json({ success: true, message: 'Student successfully transferred to new section', data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 3. CURRICULUM & SUBJECT MATRIX (Formula: [NAME]_[COURSE]_[TERM])
// ====================================================
academicTopologyRouter.get('/subjects', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const termNumber = req.query.termNumber ? parseInt(req.query.termNumber as string, 10) : undefined;
    const subjects = await db.getSubjects(courseId, termNumber);
    res.json({ success: true, count: subjects.length, subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const createSubjectSchema = z.object({
  course_id: z.string().min(1),
  subject_name: z.string().min(1),
  subject_code: z.string().optional(),
  term_number: z.number().int().min(1).max(12),
  subject_type: z.enum(['compulsory', 'elective', 'lab', 'project', 'audit']).default('compulsory'),
  take_exam: z.boolean().default(true),
  show_in_report_card: z.boolean().default(true),
  take_attendance: z.boolean().default(true),
  credits: z.number().min(0).max(10).default(4.0),
  max_marks: z.number().int().min(10).max(200).default(100),
  pass_marks: z.number().int().min(5).max(100).default(40),
});

academicTopologyRouter.post('/subjects', authenticateToken, requireRole('admin', 'hod', 'super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createSubjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }
    const subject = await db.createSubject(parseResult.data);
    res.status(201).json({ success: true, subject });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 4. FACULTY ALLOCATIONS & HANDOVER DATES
// ====================================================
academicTopologyRouter.get('/allocations', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { facultyId, subjectId, batchId } = req.query;
    const filters: any = {};
    if (typeof facultyId === 'string') filters.facultyId = facultyId;
    if (typeof subjectId === 'string') filters.subjectId = subjectId;
    if (typeof batchId === 'string') filters.batchId = batchId;
    const allocations = await db.getFacultyAllocations(filters);
    res.json({ success: true, count: allocations.length, allocations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const allocateFacultySchema = z.object({
  faculty_id: z.string().min(1),
  subject_id: z.string().min(1),
  batch_id: z.string().min(1),
  section_id: z.string().optional(),
  valid_from: z.string().min(8),
  valid_until: z.string().optional(),
  is_active: z.boolean().default(true),
});

academicTopologyRouter.post('/allocations', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = allocateFacultySchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }
    const allocation = await db.allocateFaculty(parseResult.data);
    res.status(201).json({ success: true, allocation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

academicTopologyRouter.post('/allocations/handover', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { allocation_id, new_faculty_id, handover_date, reason } = req.body;
    if (!allocation_id || !new_faculty_id || !handover_date) {
      res.status(400).json({ success: false, error: 'allocation_id, new_faculty_id, and handover_date are required' });
      return;
    }
    const actorId = req.user?.id || 'usr-admin-01';
    const result = await db.handoverFaculty(allocation_id, new_faculty_id, handover_date, reason || 'Mid-term department transition');
    res.json({ success: true, message: 'Faculty subject handover recorded successfully', data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 5. TIMETABLE & COMBINED CLASSES (CC)
// ====================================================
academicTopologyRouter.get('/timetable', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId, facultyId, dayOfWeek } = req.query;
    const filters: any = {};
    if (typeof batchId === 'string') filters.batchId = batchId;
    if (typeof facultyId === 'string') filters.facultyId = facultyId;
    if (typeof dayOfWeek === 'string') filters.dayOfWeek = dayOfWeek;
    const slots = await db.getTimetableSlots(filters);
    res.json({ success: true, count: slots.length, slots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const createTimetableSlotSchema = z.object({
  batch_id: z.string().min(1),
  section_id: z.string().min(1),
  subject_id: z.string().min(1),
  faculty_id: z.string().min(1),
  day_of_week: z.string().min(3),
  start_time: z.string().min(3),
  end_time: z.string().min(3),
  room_number: z.string().min(1),
  is_combined_class: z.boolean().default(false),
  linked_batch_ids_json: z.string().optional(),
});

academicTopologyRouter.post('/timetable', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createTimetableSlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }
    const slot = await db.createTimetableSlot(parseResult.data);
    res.status(201).json({ success: true, slot });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ====================================================
// 6. ATTENDANCE & ANTI-FRAUD BACKDATED LOCKOUT
// ====================================================
academicTopologyRouter.get('/attendance-settings', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await db.getAttendanceSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

academicTopologyRouter.put('/attendance-settings', authenticateToken, requireRole('admin', 'super_admin', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { backdated_lock_days } = req.body;
    if (typeof backdated_lock_days !== 'number' || backdated_lock_days < 1) {
      res.status(400).json({ success: false, error: 'backdated_lock_days must be a positive integer (e.g. 10, 20, 30)' });
      return;
    }
    const updated = await db.updateAttendanceSettings(backdated_lock_days);
    res.json({ success: true, message: `Attendance backdated lock threshold updated to ${backdated_lock_days} days`, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

academicTopologyRouter.post('/attendance/record', authenticateToken, requireRole('admin', 'super_admin', 'staff', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_id, section_id, subject_id, faculty_id, attendance_date, slot_time, is_combined_class, student_attendance } = req.body;
    if (!batch_id || !subject_id || !faculty_id || !attendance_date || !student_attendance) {
      res.status(400).json({ success: false, error: 'batch_id, subject_id, faculty_id, attendance_date, and student_attendance are required' });
      return;
    }
    const parsedAttendance = typeof student_attendance === 'string'
      ? JSON.parse(student_attendance)
      : student_attendance;
    const record = await db.recordAttendance({
      batch_id,
      section_id,
      subject_id,
      faculty_id,
      attendance_date,
      slot_time,
      is_combined_class: !!is_combined_class,
      student_attendance: parsedAttendance,
    });

    res.status(201).json({ success: true, message: 'Attendance recorded successfully', record });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ====================================================
// 8. SESSIONAL MARKS & INTERNAL ASSESSMENT
// ====================================================
academicTopologyRouter.get('/sessional-marks', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseCode = typeof req.query.courseCode === 'string' ? req.query.courseCode : undefined;
    const semester = typeof req.query.semester === 'string' ? Number(req.query.semester) : undefined;
    const marks = await db.getSessionalMarks(courseCode, semester);
    res.json({ success: true, count: marks.length, marks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const saveSessionalMarksSchema = z.object({
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      studentName: z.string().optional(),
      courseCode: z.string().optional(),
      semester: z.number().optional(),
      mst1: z.number().min(0).max(24),
      mst2: z.number().min(0).max(24),
      assignment: z.number().min(0).max(12),
    })
  ).min(1),
});

academicTopologyRouter.post('/sessional-marks', authenticateToken, requireRole('admin', 'super_admin', 'staff', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = saveSessionalMarksSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    const actorId = req.user?.full_name || req.user?.username || 'faculty';
    const result = await db.saveSessionalMarks(parseResult.data.marks as any, actorId);
    res.json({
      success: true,
      message: `Internal sessional marks for ${result.count} students saved and locked for University evaluation audit!`,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
