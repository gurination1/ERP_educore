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

// 3-Step Progressive Student Intake Pipeline
// Step 1: Campus Visit & Inquiry (Basic contact details, interested course) -> status: 'inquiry'
// Step 2: Parental & Domicile / Quota Profile (Father/Mother, Category, Quota, Residence) -> status: 'registered'
// Step 3: Document Verification, 12-Digit Aadhaar, Marksheets & Token Admission Fee -> status: 'approved'
admissionRouter.post('/progressive-intake', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      id,
      step = 1,
      // Step 1: Basic Contact & Campus Visit Inquiry
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      district,
      state,
      pincode,
      courseId,
      sessionId,
      counselingNotes,

      // Step 2: Parental & Domicile / Quota Profile
      guardianName,
      guardianPhone,
      motherName,
      relationship = 'parent',
      gender = 'male',
      dob,
      category = 'General',
      quota = 'punjab_85',
      annualFamilyIncome,
      residentialMode = 'self_commute',
      hostelRoomNo,
      transportRoute,

      // Step 3: Crucial Documents, 12-Digit Aadhaar & Token Admission Fee
      aadhaarNo,
      tenthPercentage,
      twelfthPercentage,
      tenthRollNo,
      twelfthRollNo,
      boardName = 'PSEB (Punjab School Education Board)',
      tenthDocVerified = false,
      twelfthDocVerified = false,
      aadhaarDocVerified = false,
      tokenFeeReceipt,
      tokenFeeAmount = 0,
      tokenFeeMode = 'cash',
      tokenFeeDate,
      remarks,
    } = req.body;

    const intakeStep = Number(step) || 1;

    // Validate required fields per step
    if (intakeStep === 1) {
      if (!firstName || !lastName) {
        res.status(400).json({ success: false, error: 'Student First Name and Last Name are required for campus visit intake.' });
        return;
      }
      if (!phone || String(phone).replace(/\D/g, '').length < 10) {
        res.status(400).json({ success: false, error: 'Valid 10-digit mobile contact number is required for follow-up.' });
        return;
      }
      if (!email || !String(email).includes('@')) {
        res.status(400).json({ success: false, error: 'Valid email address is mandatory.' });
        return;
      }
    }

    const allStudents = await db.getStudents();
    const courses = await db.getCourses();
    const sessions = await db.getSessions();
    const course = courses.find(c => c.id === courseId || c.code === courseId) || courses[0];
    const session = sessions.find(s => s.id === sessionId || s.is_current) || sessions[0];

    // Find existing student if id provided, or by email / phone
    let targetStudent: Student | null = null;
    if (id) {
      targetStudent = await db.getStudentById(id);
    }
    if (!targetStudent && email) {
      targetStudent = allStudents.find(s => s.email.toLowerCase() === String(email).trim().toLowerCase()) || null;
    }
    if (!targetStudent && phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      targetStudent = allStudents.find(s => s.phone && s.phone.replace(/\D/g, '') === cleanPhone) || null;
    }

    const currentYear = new Date().getFullYear();
    const isHosteller = residentialMode === 'hosteller';
    const isTransportUser = residentialMode === 'bus_commuter';

    if (intakeStep === 1) {
      if (targetStudent) {
        // Update existing record
        const updated = await db.updateStudent(targetStudent.id, {
          first_name: firstName || targetStudent.first_name,
          last_name: lastName || targetStudent.last_name,
          email: email || targetStudent.email,
          phone: phone || targetStudent.phone,
          address: address !== undefined ? address : targetStudent.address,
          city: city !== undefined ? city : targetStudent.city,
          district: district !== undefined ? district : targetStudent.district,
          state: state !== undefined ? state : targetStudent.state,
          pincode: pincode !== undefined ? pincode : targetStudent.pincode,
          course_id: course.id,
          session_id: session.id,
          counseling_notes: counselingNotes !== undefined ? counselingNotes : targetStudent.counseling_notes,
          intake_step: Math.max(targetStudent.intake_step || 1, 1),
        });
        res.json({
          success: true,
          message: `Walk-in inquiry updated for ${updated?.first_name} ${updated?.last_name} (Step 1 Complete).`,
          student: updated,
          step: 1,
        });
        return;
      } else {
        // Create new inquiry record
        let idCounter = allStudents.length + 1;
        let generatedId = `INQ-${currentYear}-${idCounter.toString().padStart(3, '0')}`;
        while (allStudents.some(s => s.student_id === generatedId)) {
          idCounter++;
          generatedId = `INQ-${currentYear}-${idCounter.toString().padStart(3, '0')}`;
        }

        const newInquiry: Student = {
          id: `stu-${Date.now()}`,
          student_id: generatedId,
          first_name: String(firstName).trim(),
          last_name: String(lastName).trim(),
          gender: gender as any,
          dob: dob || '2005-01-01',
          email: String(email).trim().toLowerCase(),
          phone: String(phone).trim(),
          guardian_name: guardianName || 'Guardian Pending',
          guardian_relation: relationship as any,
          guardian_phone: guardianPhone || String(phone).trim(),
          mother_name: motherName || undefined,
          address: address || undefined,
          city: city || undefined,
          district: district || 'Punjab',
          state: state || 'Punjab',
          pincode: pincode || undefined,
          course_id: course.id,
          session_id: session.id,
          current_semester: 1,
          admission_year: currentYear,
          admission_status: 'inquiry',
          fees_status: 'due',
          attendance_percentage: 100,
          total_classes: 0,
          attended_classes: 0,
          is_hosteller: false,
          is_transport_user: false,
          category: category as any,
          quota: quota as any,
          intake_step: 1,
          counseling_notes: counselingNotes || 'Walk-in campus visit recorded at Admissions & Counseling Cell.',
          created_at: new Date().toISOString(),
        };

        const created = await db.createStudent(newInquiry);
        res.status(201).json({
          success: true,
          message: `Campus visit inquiry recorded for ${created.first_name} ${created.last_name} with Prospect ID ${created.student_id} (Step 1 Complete).`,
          student: created,
          step: 1,
        });
        return;
      }
    } else if (intakeStep === 2) {
      if (!targetStudent) {
        res.status(404).json({ success: false, error: 'Student record not found. Please complete Step 1 (Campus Visit Inquiry) first.' });
        return;
      }

      const updated = await db.updateStudent(targetStudent.id, {
        guardian_name: guardianName || targetStudent.guardian_name,
        guardian_phone: guardianPhone || targetStudent.guardian_phone,
        mother_name: motherName !== undefined ? motherName : targetStudent.mother_name,
        guardian_relation: (relationship as any) || targetStudent.guardian_relation,
        gender: (gender as any) || targetStudent.gender,
        dob: dob || targetStudent.dob,
        category: (category as any) || targetStudent.category,
        quota: (quota as any) || targetStudent.quota,
        annual_family_income: annualFamilyIncome ? Number(annualFamilyIncome) : targetStudent.annual_family_income,
        is_hosteller: isHosteller,
        is_transport_user: isTransportUser,
        hostel_room_no: hostelRoomNo || targetStudent.hostel_room_no,
        transport_route: transportRoute || targetStudent.transport_route,
        admission_status: targetStudent.admission_status === 'approved' ? 'approved' : 'registered',
        intake_step: Math.max(targetStudent.intake_step || 1, 2),
      });

      res.json({
        success: true,
        message: `Parental profile, quota allocation & domicile details saved for ${updated?.first_name} (Step 2 Complete).`,
        student: updated,
        step: 2,
      });
      return;
    } else if (intakeStep === 3) {
      if (!targetStudent) {
        res.status(404).json({ success: false, error: 'Student record not found. Please complete Step 1 and Step 2 first.' });
        return;
      }

      // Validate 12-digit Aadhaar Card number
      const cleanAadhaar = aadhaarNo ? String(aadhaarNo).replace(/\D/g, '') : (targetStudent.aadhaar_no ? targetStudent.aadhaar_no.replace(/\D/g, '') : '');
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        res.status(400).json({
          success: false,
          error: 'Aadhaar Card number must be exactly 12 digits (mandated by Punjab State Scholarship & University registration portal).',
        });
        return;
      }

      // Ensure proper Roll ID format STU-YYYY-XXX
      let officialRollId = targetStudent.student_id;
      if (officialRollId.startsWith('INQ-')) {
        let counter = allStudents.filter(s => s.student_id.startsWith(`STU-${currentYear}`)).length + 1;
        officialRollId = `STU-${currentYear}-${counter.toString().padStart(3, '0')}`;
        while (allStudents.some(s => s.student_id === officialRollId)) {
          counter++;
          officialRollId = `STU-${currentYear}-${counter.toString().padStart(3, '0')}`;
        }
      }

      // Provision user account if not exists
      let targetUserId = targetStudent.user_id;
      const username = officialRollId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const tempPassword = `Student@${currentYear}`;

      if (!targetUserId) {
        const existingUser = await db.findUserByUsernameOrEmail(targetStudent.email);
        if (existingUser) {
          targetUserId = existingUser.id;
        } else {
          const passwordHash = bcrypt.hashSync(tempPassword, 10);
          targetUserId = `usr-stu-${Date.now()}`;
          await db.createUser({
            id: targetUserId,
            username,
            email: targetStudent.email,
            password_hash: passwordHash,
            role: 'student',
            full_name: `${targetStudent.first_name} ${targetStudent.last_name}`,
            is_active: true,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Setup Itemized Fees in Ledger
      const activeFees = await db.getStudentFees(targetStudent.id);
      let tuitionFeeRecord = activeFees.find(sf => sf.fee_head_id === 'fh-tuition');

      const parsedTokenAmount = Math.max(0, Number(tokenFeeAmount) || 0);

      if (!tuitionFeeRecord) {
        const tuitionPaid = Math.min(course.base_tuition_fee, parsedTokenAmount);
        const tuitionDue = Math.max(0, course.base_tuition_fee - tuitionPaid);
        tuitionFeeRecord = await db.createStudentFee({
          id: `sf-${Date.now()}-1`,
          student_id: targetStudent.id,
          fee_head_id: 'fh-tuition',
          session_id: session.id,
          semester: 1,
          amount: course.base_tuition_fee,
          discount_amount: 0,
          paid_amount: tuitionPaid,
          due_amount: tuitionDue,
          due_date: '2025-10-31',
          status: tuitionPaid >= course.base_tuition_fee ? 'paid' : (tuitionPaid > 0 ? 'partial' : 'due'),
        });
      } else if (parsedTokenAmount > 0 && tuitionFeeRecord.paid_amount === 0) {
        const tuitionPaid = Math.min(tuitionFeeRecord.amount, parsedTokenAmount);
        const tuitionDue = Math.max(0, tuitionFeeRecord.amount - tuitionPaid);
        await db.updateStudentFee(tuitionFeeRecord.id, {
          paid_amount: tuitionPaid,
          due_amount: tuitionDue,
          status: tuitionPaid >= tuitionFeeRecord.amount ? 'paid' : 'partial',
        });
      }

      if (!activeFees.some(sf => sf.fee_head_id === 'fh-univ-reg')) {
        await db.createStudentFee({
          id: `sf-${Date.now()}-2`,
          student_id: targetStudent.id,
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
      }

      if (!activeFees.some(sf => sf.fee_head_id === 'fh-security')) {
        await db.createStudentFee({
          id: `sf-${Date.now()}-3`,
          student_id: targetStudent.id,
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
      }

      // Record Token Payment receipt if provided
      const receiptNo = tokenFeeReceipt || `REC-ADM-${Date.now().toString().slice(-6)}`;
      if (parsedTokenAmount > 0) {
        await db.createPayment({
          id: `pay-${Date.now()}`,
          receipt_no: receiptNo,
          student_id: targetStudent.id,
          student_fee_id: tuitionFeeRecord?.id,
          amount_paid: parsedTokenAmount,
          payment_mode: (tokenFeeMode as any) || 'cash',
          transaction_reference: `TXN-ADM-${Date.now().toString().slice(-6)}`,
          payment_date: tokenFeeDate || new Date().toISOString(),
          status: 'success',
          notes: 'Token Admission Confirmation Fee (Progressive Intake Step 3)',
          collected_by: (req as any).user ? (req as any).user.id : 'usr-staff-01',
        });
      }

      // Update Student Profile with documents and approve admission
      const admittedByStr = (req as any).user
        ? `${(req as any).user.full_name} (${(req as any).user.role})`
        : 'Admissions & Counseling Cell';

      const updated = await db.updateStudent(targetStudent.id, {
        student_id: officialRollId,
        user_id: targetUserId,
        admission_status: 'approved',
        fees_status: parsedTokenAmount > 0 ? 'paid' : 'due',
        aadhaar_no: cleanAadhaar,
        tenth_percentage: tenthPercentage ? Number(tenthPercentage) : targetStudent.tenth_percentage,
        twelfth_percentage: twelfthPercentage ? Number(twelfthPercentage) : targetStudent.twelfth_percentage,
        tenth_roll_no: tenthRollNo || targetStudent.tenth_roll_no,
        twelfth_roll_no: twelfthRollNo || targetStudent.twelfth_roll_no,
        board_name: boardName || targetStudent.board_name,
        tenth_doc_verified: Boolean(tenthDocVerified),
        twelfth_doc_verified: Boolean(twelfthDocVerified),
        aadhaar_doc_verified: Boolean(aadhaarDocVerified),
        token_fee_receipt: receiptNo,
        token_fee_amount: parsedTokenAmount,
        token_fee_mode: tokenFeeMode,
        token_fee_date: tokenFeeDate || new Date().toISOString().split('T')[0],
        intake_step: 3,
        admitted_by: admittedByStr,
        admission_remarks: remarks || `Admitted formally under Step 3 with ₹${parsedTokenAmount} Token Fee by ${admittedByStr}`,
      });

      res.status(200).json({
        success: true,
        message: `Student ${officialRollId} officially admitted and provisioned (Step 3 Complete)!`,
        student: updated,
        step: 3,
        credentialsSlip: {
          studentId: officialRollId,
          fullName: `${updated?.first_name} ${updated?.last_name}`,
          username,
          tempPassword,
          temporaryPassword: tempPassword,
          email: updated?.email,
          course: course.name,
          category: updated?.category,
          quota: updated?.quota === 'punjab_85' ? 'Punjab Domicile Quota (85%)' : 'All India / Management Quota',
          aadhaarNo: cleanAadhaar,
          tokenFeeReceipt: receiptNo,
          tokenFeeAmount: parsedTokenAmount,
          admittedBy: admittedByStr,
        },
      });
      return;
    }
  } catch (err: any) {
    console.error('Progressive intake error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal error in progressive intake pipeline.' });
  }
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
    const photoUrl = files?.photo?.[0] ? `/uploads/documents/${files.photo[0].filename}` : undefined;
    const transcriptUrl = files?.transcript?.[0] ? `/uploads/documents/${files.transcript[0].filename}` : undefined;
    const idProofUrl = files?.idProof?.[0] ? `/uploads/documents/${files.idProof[0].filename}` : undefined;

    const currentYear = new Date().getFullYear();
    let idCounter = allStudents.length + 1;
    let generatedId = `STU-${currentYear}-${idCounter.toString().padStart(3, '0')}`;
    while (allStudents.some(s => s.student_id === generatedId)) {
      idCounter++;
      generatedId = `STU-${currentYear}-${idCounter.toString().padStart(3, '0')}`;
    }
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

  const currentYear = new Date().getFullYear();
  let idCounter = allStudents.length + 1;
  let generatedId = `STU-${currentYear}-${idCounter.toString().padStart(3, '0')}`;
  while (allStudents.some(s => s.student_id === generatedId)) {
    idCounter++;
    generatedId = `STU-${currentYear}-${idCounter.toString().padStart(3, '0')}`;
  }
  const username = generatedId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tempPassword = `Punjab@${currentYear}`;
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

  // Miscellaneous Campus & Student Welfare Fund
  await db.createStudentFee({
    id: `sf-${Date.now()}-4`,
    student_id: newStudent.id,
    fee_head_id: 'fh-misc',
    session_id: session.id,
    semester: newStudent.current_semester,
    amount: 2500,
    discount_amount: 0,
    paid_amount: 0,
    due_amount: 2500,
    due_date: '2025-10-31',
    status: 'due',
  });
  feeItems.push({ title: 'Miscellaneous Campus & Student Welfare Fund', amount: 2500 });

  // Residential Fee: Hosteller vs Transport (Mutually Exclusive)
  if (data.isHosteller) {
    // 1. Hostel Room Rent & Maintenance
    await db.createStudentFee({
      id: `sf-${Date.now()}-5`,
      student_id: newStudent.id,
      fee_head_id: 'fh-hostel-room',
      session_id: session.id,
      semester: newStudent.current_semester,
      amount: 20000,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 20000,
      due_date: '2025-10-31',
      status: 'due',
    });
    feeItems.push({ title: `Hostel Room Rent & Maintenance (${data.hostelRoomNo || 'Campus Resident'})`, amount: 20000 });

    // 2. Hostel Mess Advance & Meal Boarding
    await db.createStudentFee({
      id: `sf-${Date.now()}-6`,
      student_id: newStudent.id,
      fee_head_id: 'fh-hostel-mess',
      session_id: session.id,
      semester: newStudent.current_semester,
      amount: 18000,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 18000,
      due_date: '2025-10-31',
      status: 'due',
    });
    feeItems.push({ title: 'Hostel Mess Advance & 3-Meal Daily Boarding', amount: 18000 });

    // 3. Hostel Power Backup & Utilities
    await db.createStudentFee({
      id: `sf-${Date.now()}-7`,
      student_id: newStudent.id,
      fee_head_id: 'fh-hostel-util',
      session_id: session.id,
      semester: newStudent.current_semester,
      amount: 4500,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 4500,
      due_date: '2025-10-31',
      status: 'due',
    });
    feeItems.push({ title: 'Hostel 24/7 Power Backup & Utilities', amount: 4500 });

    // 4. Refundable Hostel Caution Deposit
    await db.createStudentFee({
      id: `sf-${Date.now()}-8`,
      student_id: newStudent.id,
      fee_head_id: 'fh-hostel-security',
      session_id: session.id,
      semester: newStudent.current_semester,
      amount: 3000,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 3000,
      due_date: '2025-10-31',
      status: 'due',
    });
    feeItems.push({ title: 'Refundable Hostel Room & Furniture Security Deposit', amount: 3000 });
  } else if (data.isTransportUser) {
    // 1. College Bus / Fleet Transit Fee
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
    feeItems.push({ title: `College Bus / Fleet Transit Fee (${data.transportRoute || 'Day Scholar'})`, amount: 14000 });

    // 2. Transport Smart Card & Bus Pass
    await db.createStudentFee({
      id: `sf-${Date.now()}-6`,
      student_id: newStudent.id,
      fee_head_id: 'fh-transport-pass',
      session_id: session.id,
      semester: newStudent.current_semester,
      amount: 800,
      discount_amount: 0,
      paid_amount: 0,
      due_amount: 800,
      due_date: '2025-10-31',
      status: 'due',
    });
    feeItems.push({ title: 'Transport Smart Card & Bus Pass Issuance', amount: 800 });
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

// Admin, Faculty, Counselor & HOD: List admissions
admissionRouter.get('/', authenticateToken, requireRole('admin', 'staff', 'counselor', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
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

// Power Delegation Status
admissionRouter.get('/delegation', authenticateToken, requireRole('admin', 'staff', 'counselor', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    delegation: {
      superAdminRole: 'admin',
      academicProvost: 'Dr. Ramesh Chandra',
      canStaffVerifyDocs: true,
      canStaffAdmitDirectly: true,
      canCounselorAdmitDirectly: true,
      canHODAdmitDirectly: true,
      lifecycle: ['inquiry', 'registered', 'submitted', 'verified', 'fee_pending', 'provisionally_admitted', 'approved', 'enrolled', 'rejected'],
    },
  });
});

// Update application status (Approve / Reject / Verify) - Direct approval by Faculty, Counselor, HOD, and Admin
admissionRouter.patch('/:id/status', authenticateToken, requireRole('admin', 'staff', 'counselor', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const student = await db.getStudentById(id);
  if (!student) {
    res.status(404).json({ success: false, error: 'Admission record not found.' });
    return;
  }

  const validStatuses = ['inquiry', 'registered', 'draft', 'submitted', 'pending', 'verified', 'fee_pending', 'provisionally_admitted', 'approved', 'enrolled', 'rejected'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid admission status value. Must be one of: ${validStatuses.join(', ')}` });
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
    await db.updateStudent(student.id, {
      admission_status: 'rejected',
      fees_status: 'cancelled' as any,
      admission_remarks: remarks || 'Application rejected by admissions committee',
    });
  } else if (status === 'approved' || status === 'enrolled') {
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

    if (!activeFees.some(sf => sf.fee_head_id === 'fh-misc')) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-4`,
        student_id: student.id,
        fee_head_id: 'fh-misc',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 2500,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 2500,
        due_date: '2025-10-31',
        status: 'due',
      });
    }

    if (student.is_hosteller && !activeFees.some(sf => sf.fee_head_id.startsWith('fh-hostel'))) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-5`,
        student_id: student.id,
        fee_head_id: 'fh-hostel-room',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 20000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 20000,
        due_date: '2025-10-31',
        status: 'due',
      });
      await db.createStudentFee({
        id: `sf-${Date.now()}-6`,
        student_id: student.id,
        fee_head_id: 'fh-hostel-mess',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 18000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 18000,
        due_date: '2025-10-31',
        status: 'due',
      });
      await db.createStudentFee({
        id: `sf-${Date.now()}-7`,
        student_id: student.id,
        fee_head_id: 'fh-hostel-util',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 4500,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 4500,
        due_date: '2025-10-31',
        status: 'due',
      });
      await db.createStudentFee({
        id: `sf-${Date.now()}-8`,
        student_id: student.id,
        fee_head_id: 'fh-hostel-security',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 3000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 3000,
        due_date: '2025-10-31',
        status: 'due',
      });
    } else if (student.is_transport_user && !activeFees.some(sf => sf.fee_head_id.startsWith('fh-transport'))) {
      await db.createStudentFee({
        id: `sf-${Date.now()}-5`,
        student_id: student.id,
        fee_head_id: 'fh-transport',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 14000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 14000,
        due_date: '2025-10-31',
        status: 'due',
      });
      await db.createStudentFee({
        id: `sf-${Date.now()}-6`,
        student_id: student.id,
        fee_head_id: 'fh-transport-pass',
        session_id: student.session_id,
        semester: student.current_semester || 1,
        amount: 800,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 800,
        due_date: '2025-10-31',
        status: 'due',
      });
    }

    await db.updateStudent(student.id, {
      user_id: targetUserId,
      admission_status: 'approved',
      fees_status: 'due',
      admission_remarks: remarks || 'Formally admitted and portal credentials generated',
    });

    credentialsSlip = {
      studentId: student.student_id,
      fullName: `${student.first_name} ${student.last_name}`,
      username,
      tempPassword,
      email: student.email,
      course: course?.name,
    };
  } else if (status === 'verified') {
    await db.updateStudent(student.id, {
      admission_status: 'verified',
      admission_remarks: remarks || 'Academic credentials & domicile eligibility verified by Faculty Scrutiny Committee',
    });
  } else {
    await db.updateStudent(student.id, {
      admission_status: status as any,
      ...(remarks ? { admission_remarks: remarks } : {}),
    });
  }

  const updated = await db.getStudentById(student.id);

  res.json({
    success: true,
    message: `Application ${student.student_id} status updated to ${status}.`,
    student: updated,
    credentialsSlip,
  });
});
