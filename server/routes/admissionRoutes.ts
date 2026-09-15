import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, Student, User } from '../db.ts';
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
  // Indian context
  category: z.enum(['General', 'SC/ST', 'OBC', 'EWS', 'Sports']).optional().default('General'),
  quota: z.enum(['punjab_85', 'other_state_15', 'management', 'sports']).optional().default('punjab_85'),
  tenthPercentage: z.union([z.number(), z.string()]).optional(),
  twelfthPercentage: z.union([z.number(), z.string()]).optional(),
  boardName: z.string().optional(),
  isHosteller: z.boolean().optional().default(false),
  isTransportUser: z.boolean().optional().default(false),
  hostelRoomNo: z.string().optional(),
  transportRoute: z.string().optional(),
});

// Admin direct admission schema
const adminAdmitSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid 10-digit mobile number is required'),
  gender: z.enum(['male', 'female', 'nonbinary', 'prefer_not_to_say']).default('male'),
  dob: z.string().optional(),
  guardianName: z.string().min(1, 'Father / Guardian name is required'),
  guardianRelation: z.enum(['parent', 'sibling', 'spouse', 'other']).default('parent'),
  guardianPhone: z.string().optional(),
  courseId: z.string().min(1, 'Course selection is mandatory'),
  sessionId: z.string().optional(),
  currentSemester: z.union([z.number(), z.string()]).default(1),
  admissionYear: z.union([z.number(), z.string()]).default(2025),
  category: z.enum(['General', 'SC/ST', 'OBC', 'EWS', 'Sports']).default('General'),
  quota: z.enum(['punjab_85', 'other_state_15', 'management', 'sports']).default('punjab_85'),
  tenthPercentage: z.union([z.number(), z.string()]).optional(),
  twelfthPercentage: z.union([z.number(), z.string()]).optional(),
  boardName: z.string().optional(),
  isHosteller: z.boolean().default(false),
  isTransportUser: z.boolean().default(false),
  hostelRoomNo: z.string().optional(),
  transportRoute: z.string().optional(),
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
      category,
      quota,
      tenthPercentage,
      twelfthPercentage,
      boardName,
      isHosteller,
      isTransportUser,
      hostelRoomNo,
      transportRoute,
    } = parseResult.data;

    // Strict Mutual Exclusivity: Hostel vs Transport
    if (isHosteller && isTransportUser) {
      res.status(400).json({
        success: false,
        error: 'Mutual Exclusivity Violation: A candidate cannot simultaneously select Campus Hostel and Bus Transport. Indian college rules mandate hostel residents live on campus.',
      });
      return;
    }

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
      is_hosteller: Boolean(isHosteller),
      is_transport_user: Boolean(isTransportUser),
      hostel_room_no: hostelRoomNo || undefined,
      transport_route: transportRoute || undefined,
      category: category as any,
      quota: quota as any,
      tenth_percentage: tenthPercentage ? Number(tenthPercentage) : undefined,
      twelfth_percentage: twelfthPercentage ? Number(twelfthPercentage) : undefined,
      board_name: boardName || 'PSEB / CBSE',
      created_at: new Date().toISOString(),
    };

    await db.createStudent(newStudent);

    // Initial itemized fee records under Punjab & Indian college architecture:
    // 1. Base Tuition Fee
    await db.createStudentFee({
      id: `sf-${Date.now()}-1`,
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

    // 2. Direct University Registration & Exam Charges (Affiliating university mandatory fee)
    await db.createStudentFee({
      id: `sf-${Date.now()}-2`,
      student_id: newStudent.id,
      fee_head_id: 'fh-univ-reg',
      session_id: session.id,
      semester: 1,
      amount: 5500,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 5500,
      due_date: '2025-10-31',
      status: 'due',
    });

    // 3. One-Time Institutional Refundable Security Deposit
    await db.createStudentFee({
      id: `sf-${Date.now()}-3`,
      student_id: newStudent.id,
      fee_head_id: 'fh-security',
      session_id: session.id,
      semester: 1,
      amount: 5000,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 5000,
      due_date: '2025-10-31',
      status: 'due',
    });

    // 4. Residential Fee Head: Mutual Exclusivity Applied
    if (isHosteller) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-4`,
        student_id: newStudent.id,
        fee_head_id: 'fh-hostel',
        session_id: session.id,
        semester: 1,
        amount: 38000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 38000,
        due_date: '2025-10-31',
        status: 'due',
      });
    } else if (isTransportUser) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-5`,
        student_id: newStudent.id,
        fee_head_id: 'fh-transport',
        session_id: session.id,
        semester: 1,
        amount: 14000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 14000,
        due_date: '2025-10-31',
        status: 'due',
      });
    }

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

// Admin: Direct Admission Intake with Instant User Credentials Generation
admissionRouter.post('/admin-admit', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = adminAdmitSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const data = parseResult.data;

  // Strict Mutual Exclusivity Check
  if (data.isHosteller && data.isTransportUser) {
    res.status(400).json({
      success: false,
      error: 'Mutual Exclusivity Violation: A student cannot be admitted as both a Campus Hosteller and a Bus Transport commuter. Hostellers reside on campus; transport fleet is for day scholars.',
    });
    return;
  }

  const allStudents = await db.getStudents();
  const existingEmail = allStudents.find(s => s.email.toLowerCase() === data.email.trim().toLowerCase());
  if (existingEmail) {
    res.status(400).json({ success: false, error: 'A student record with this email already exists.' });
    return;
  }

  const cleanPhone = data.phone.replace(/[\s+-]/g, '');
  const existingPhone = allStudents.find(s => s.phone && s.phone.replace(/[\s+-]/g, '') === cleanPhone);
  if (existingPhone) {
    res.status(400).json({ success: false, error: 'A student record with this phone number already exists.' });
    return;
  }

  const courses = await db.getCourses();
  const sessions = await db.getSessions();
  const course = courses.find(c => c.id === data.courseId || c.code === data.courseId) || courses[0];
  const session = sessions.find(s => s.id === data.sessionId || s.is_current) || sessions[0];

  const generatedId = `STU-2025-${(allStudents.length + 1).toString().padStart(3, '0')}`;
  const username = generatedId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tempPassword = `Punjab@${new Date().getFullYear()}`;
  const passwordHash = bcrypt.hashSync(tempPassword, 10);

  // 1. Create Portal User Account
  const userId = `usr-stu-${Date.now()}`;
  const newUser: User = {
    id: userId,
    username,
    email: data.email,
    password_hash: passwordHash,
    role: 'student',
    full_name: `${data.firstName} ${data.lastName}`,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  await db.createUser(newUser);

  // 2. Create Student Record
  const newStudent: Student = {
    id: `stu-${Date.now()}`,
    user_id: userId,
    student_id: generatedId,
    first_name: data.firstName,
    last_name: data.lastName,
    gender: data.gender as any,
    dob: data.dob || '2005-01-01',
    email: data.email,
    phone: data.phone,
    guardian_name: data.guardianName,
    guardian_relation: data.guardianRelation as any,
    guardian_phone: data.guardianPhone || data.phone,
    course_id: course.id,
    session_id: session.id,
    current_semester: Number(data.currentSemester) || 1,
    admission_year: Number(data.admissionYear) || 2025,
    admission_status: 'approved',
    fees_status: 'due',
    attendance_percentage: 100,
    total_classes: 0,
    attended_classes: 0,
    is_hosteller: Boolean(data.isHosteller),
    is_transport_user: Boolean(data.isTransportUser),
    hostel_room_no: data.hostelRoomNo || undefined,
    transport_route: data.transportRoute || undefined,
    category: data.category as any,
    quota: data.quota as any,
    tenth_percentage: data.tenthPercentage ? Number(data.tenthPercentage) : undefined,
    twelfth_percentage: data.twelfthPercentage ? Number(data.twelfthPercentage) : undefined,
    board_name: data.boardName || 'PSEB / CBSE',
    created_at: new Date().toISOString(),
  };
  await db.createStudent(newStudent);

  // 3. Generate Itemized Fees
  const feeItems: any[] = [];

  // Tuition Fee
  await db.createStudentFee({
    id: `sf-${Date.now()}-1`,
    student_id: newStudent.id,
    fee_head_id: 'fh-tuition',
    session_id: session.id,
    semester: newStudent.current_semester,
    amount: course.base_tuition_fee,
    discount_amount: 0,
    paid_amount: 0,
    due_amount: course.base_tuition_fee,
    due_date: '2025-10-31',
    status: 'due',
  });
  feeItems.push({ title: 'Academic Tuition Fee', amount: course.base_tuition_fee });

  // University Direct Charges & Exam Fee
  await db.createStudentFee({
    id: `sf-${Date.now()}-2`,
    student_id: newStudent.id,
    fee_head_id: 'fh-univ-reg',
    session_id: session.id,
    semester: newStudent.current_semester,
    amount: 5500,
    discount_amount: 0,
    paid_amount: 0,
    due_amount: 5500,
    due_date: '2025-10-31',
    status: 'due',
  });
  feeItems.push({ title: 'University Registration & Exam Fee (PTU/GNDU)', amount: 5500 });

  // Caution Security Deposit
  await db.createStudentFee({
    id: `sf-${Date.now()}-3`,
    student_id: newStudent.id,
    fee_head_id: 'fh-security',
    session_id: session.id,
    semester: newStudent.current_semester,
    amount: 5000,
    discount_amount: 0,
    paid_amount: 0,
    due_amount: 5000,
    due_date: '2025-10-31',
    status: 'due',
  });
  feeItems.push({ title: 'Refundable Caution Security Deposit', amount: 5000 });

  // Residential Fee: Hosteller vs Transport (Mutually Exclusive)
  if (data.isHosteller) {
    await db.createStudentFee({
      id: `sf-${Date.now()}-4`,
      student_id: newStudent.id,
      fee_head_id: 'fh-hostel',
      session_id: session.id,
      semester: newStudent.current_semester,
      amount: 38000,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 38000,
      due_date: '2025-10-31',
      status: 'due',
    });
    feeItems.push({ title: `Hostel & Mess Boarding Fee (${data.hostelRoomNo || 'Campus Resident'})`, amount: 38000 });
  } else if (data.isTransportUser) {
    await db.createStudentFee({
      id: `sf-${Date.now()}-5`,
      student_id: newStudent.id,
      fee_head_id: 'fh-transport',
      session_id: session.id,
      semester: newStudent.current_semester,
      amount: 14000,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 14000,
      due_date: '2025-10-31',
      status: 'due',
    });
    feeItems.push({ title: `Bus Commuter Transit Fee (${data.transportRoute || 'Day Scholar'})`, amount: 14000 });
  }

  const totalInitialDue = feeItems.reduce((acc, f) => acc + f.amount, 0);

  res.status(201).json({
    success: true,
    message: `Student ${generatedId} officially admitted. Student portal account and fee ledger generated.`,
    student: newStudent,
    credentialsSlip: {
      studentId: generatedId,
      fullName: `${data.firstName} ${data.lastName}`,
      username,
      tempPassword,
      email: data.email,
      course: course.name,
      category: data.category,
      quota: data.quota === 'punjab_85' ? 'Punjab State Quota (85%)' : (data.quota === 'other_state_15' ? 'All India Quota (15%)' : 'Management Quota'),
      residentialStatus: data.isHosteller
        ? `Campus Hosteller (Room ${data.hostelRoomNo || 'Allotment Pending'})`
        : (data.isTransportUser ? `Day Scholar (Bus: ${data.transportRoute || 'Route 1'})` : 'Day Scholar (Self-Commute)'),
      totalInitialDue,
      feeBreakdown: feeItems,
    },
  });
});

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

// Admin: Update application status (Approve / Reject) with user credentials generation
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

  let credentialsSlip: any = null;

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
    // Provision User account if not exists
    let targetUserId = student.user_id;
    let tempPassword = `Student@${new Date().getFullYear()}`;
    const username = student.student_id.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!targetUserId) {
      const existingUser = await db.findUserByUsernameOrEmail(student.email);
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const passwordHash = bcrypt.hashSync(tempPassword, 10);
        targetUserId = `usr-stu-${Date.now()}`;
        await db.createUser({
          id: targetUserId,
          username,
          email: student.email,
          password_hash: passwordHash,
          role: 'student',
          full_name: `${student.first_name} ${student.last_name}`,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Ensure initial tuition and statutory university fees exist
    const studentFees = await db.getStudentFees(student.id);
    const activeFees = studentFees.filter(sf => sf.status !== 'cancelled');
    const course = await db.getCourseById(student.course_id);

    if (!activeFees.some(sf => sf.fee_head_id === 'fh-tuition')) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-1`,
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

    if (!activeFees.some(sf => sf.fee_head_id === 'fh-univ-reg')) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-2`,
        student_id: student.id,
        fee_head_id: 'fh-univ-reg',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 5500,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 5500,
        due_date: '2025-10-31',
        status: 'due',
      });
    }

    if (!activeFees.some(sf => sf.fee_head_id === 'fh-security')) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-3`,
        student_id: student.id,
        fee_head_id: 'fh-security',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 5000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 5000,
        due_date: '2025-10-31',
        status: 'due',
      });
    }

    await db.updateStudent(student.id, {
      user_id: targetUserId,
      admission_status: 'approved',
      fees_status: 'due',
    });

    credentialsSlip = {
      studentId: student.student_id,
      fullName: `${student.first_name} ${student.last_name}`,
      username,
      tempPassword,
      email: student.email,
      course: course?.name,
    };
  } else {
    await db.updateStudent(student.id, { admission_status: status as any });
  }

  const updated = await db.getStudentById(student.id);

  res.json({
    success: true,
    message: `Application ${student.student_id} status updated to ${status}.`,
    student: updated,
    credentialsSlip,
  });
});
