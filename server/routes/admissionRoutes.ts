import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, Student } from '../db.ts';
import { upload } from '../middleware/upload.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const admissionRouter = Router();

const submitAdmissionSchema = z.object({
  firstName: z.string({ required_error: 'First name is mandatory' }).min(1, 'First name is mandatory'),
  lastName: z.string({ required_error: 'Last name is mandatory' }).min(1, 'Last name is mandatory'),
  email: z.string({ required_error: 'Email address is mandatory' }).email('Invalid email address format'),
  phone: z.string({ required_error: 'Phone number is mandatory' }).min(1, 'Phone number is mandatory'),
  gender: z.enum(['male', 'female', 'nonbinary', 'prefer_not_to_say']).optional().default('male'),
  dob: z.string().optional(),
  guardianName: z.string().optional(),
  relationship: z.enum(['parent', 'sibling', 'spouse', 'other']).optional().default('parent'),
  guardianPhone: z.string().optional(),
  courseId: z.string().optional(),
  admissionYear: z.union([z.number(), z.string()]).optional(),
});

// Save Draft Admission Application
admissionRouter.post('/draft', (req: Request, res: Response): void => {
  const { firstName, lastName, dob, gender, email, phone, guardianName, relationship, guardianPhone, step } = req.body;

  res.json({
    success: true,
    message: 'Admission draft saved successfully.',
    draftId: `DFT-${Date.now().toString().slice(-6)}`,
    data: { firstName, lastName, dob, gender, email, phone, guardianName, relationship, guardianPhone, step: step || 1 },
  });
});

// Submit Full Admission Application (with optional files) - Zod validated
admissionRouter.post(
  '/submit',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const parseResult = submitAdmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    const {
      firstName,
      lastName,
      dob,
      gender,
      email,
      phone,
      guardianName,
      relationship,
      guardianPhone,
      courseId,
      admissionYear,
    } = parseResult.data;

    // Check if student already exists (email or phone)
    const allStudents = await db.getStudents();
    const existing = allStudents.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      res.status(400).json({ success: false, error: 'An application with this email address already exists.' });
      return;
    }

    const cleanPhone = phone.replace(/[\s+-]/g, '');
    const existingPhone = allStudents.find(s => s.phone && s.phone.replace(/[\s+-]/g, '') === cleanPhone);
    if (existingPhone) {
      res.status(400).json({ success: false, error: 'An application with this phone number already exists.' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const photoUrl = files?.photo?.[0] ? `/uploads/${files.photo[0].filename}` : undefined;
    const transcriptUrl = files?.transcript?.[0] ? `/uploads/${files.transcript[0].filename}` : undefined;
    const idProofUrl = files?.idProof?.[0] ? `/uploads/${files.idProof[0].filename}` : undefined;

    const generatedId = `STU-2025-${(allStudents.length + 1).toString().padStart(3, '0')}`;
    const courses = await db.getCourses();
    const sessions = await db.getSessions();
    const course = courses.find(c => c.id === courseId || c.code === courseId) || courses[0];
    const session = sessions.find(s => s.is_current) || sessions[0];

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      student_id: generatedId,
      first_name: firstName,
      last_name: lastName,
      gender: gender as any,
      dob: dob || '2005-01-01',
      email,
      phone,
      guardian_name: guardianName || 'Guardian',
      guardian_relation: relationship as any,
      guardian_phone: guardianPhone || phone,
      course_id: course.id,
      session_id: session.id,
      current_semester: 1,
      admission_year: admissionYear ? parseInt(String(admissionYear), 10) : 2025,
      admission_status: 'submitted',
      fees_status: 'due',
      attendance_percentage: 100,
      total_classes: 0,
      attended_classes: 0,
      created_at: new Date().toISOString(),
    };

    await db.createStudent(newStudent);

    // Generate initial tuition fee record for 1st semester
    await db.createStudentFee({
      id: `sf-${Date.now()}`,
      student_id: newStudent.id,
      fee_head_id: 'fh-tuition',
      session_id: session.id,
      semester: 1,
      amount: course.base_tuition_fee,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: course.base_tuition_fee,
      due_date: '2025-10-31',
      status: 'due',
    });

    res.status(201).json({
      success: true,
      message: 'Student Admission application submitted successfully!',
      applicationNumber: generatedId,
      student: newStudent,
      documents: {
        photo: photoUrl || null,
        transcript: transcriptUrl || null,
        idProof: idProofUrl || null,
      },
    });
  }
);

// Admin: List admissions
admissionRouter.get('/', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  const rawStudents = await db.getStudents();
  const courses = await db.getCourses();
  const sessions = await db.getSessions();

  let list = rawStudents.map(s => ({
    ...s,
    course: courses.find(c => c.id === s.course_id),
    session: sessions.find(ses => ses.id === s.session_id),
  }));

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(s => s.admission_status === status);
  }

  res.json({ success: true, count: list.length, admissions: list });
});

// Admin: Update application status (Approve / Reject)
admissionRouter.patch('/:id/status', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const student = await db.getStudentById(id);
  if (!student) {
    res.status(404).json({ success: false, error: 'Admission record not found.' });
    return;
  }

  if (!['submitted', 'pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid admission status value.' });
    return;
  }

  if (status === 'rejected') {
    // Void/cancel any pending student fees so rejected applicant is never an active defaulter
    const studentFees = await db.getStudentFees(student.id);
    for (const sf of studentFees) {
      if (sf.status !== 'paid') {
        await db.updateStudentFee(sf.id, { due_amount: 0, status: 'cancelled' as any });
      }
    }
    await db.updateStudent(student.id, { admission_status: 'rejected', fees_status: 'cancelled' as any });
  } else if (status === 'approved') {
    const studentFees = await db.getStudentFees(student.id);
    if (studentFees.length === 0 || studentFees.every(sf => sf.status === 'cancelled')) {
      const course = await db.getCourseById(student.course_id);
      await db.createStudentFee({
        id: `sf-${Date.now()}`,
        student_id: student.id,
        fee_head_id: 'fh-tuition',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: course?.base_tuition_fee || 90000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: course?.base_tuition_fee || 90000,
        due_date: '2025-10-31',
        status: 'due',
      });
    }
    await db.updateStudent(student.id, { admission_status: 'approved', fees_status: 'due' });
  } else {
    await db.updateStudent(student.id, { admission_status: status as any });
  }

  const updated = await db.getStudentById(student.id);

  res.json({
    success: true,
    message: `Application ${student.student_id} status updated to ${status}.`,
    student: updated,
  });
});
