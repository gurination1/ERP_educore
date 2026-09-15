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
scholarshipRouter.post('/schemes', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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

  await db.createScheme(newScheme);

  res.status(201).json({ success: true, message: 'Scholarship scheme added successfully.', scheme: newScheme });
});

// Student: Apply for scholarship (Authenticated, scoped)
scholarshipRouter.post('/apply', authenticateToken, upload.single('document'), async (req: AuthRequest, res: Response): Promise<void> => {
  const schemeId = req.body.schemeId || req.body.scheme_id;
  const studentId = req.body.studentId || req.body.student_id;
  const annualFamilyIncome = req.body.annualFamilyIncome || req.body.annual_family_income || 0;
  const previousGpa = req.body.previousGpa || req.body.previous_gpa || 8.0;
  const reasonForApplication = req.body.reasonForApplication || req.body.reason_for_application || req.body.statementOfPurpose || req.body.statement_of_purpose;

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
    admin_remarks: remarks !== undefined ? remarks : app.admin_remarks,
    reviewed_by: req.user?.id,
    reviewed_at: new Date().toISOString(),
  });

  if (status === 'approved') {
    const schemes = await db.getSchemes();
    const scheme = schemes.find(s => s.id === app.scheme_id);
    const awardAmount = scheme?.award_amount || 0;
    if (awardAmount > 0) {
      const studentFees = await db.getStudentFees(app.student_id);
      const feeRecord = [...studentFees].reverse().find(sf => sf.fee_head_id === 'fh-tuition' && sf.status !== 'cancelled' && sf.due_amount > 0)
        || [...studentFees].reverse().find(sf => sf.status !== 'cancelled' && sf.due_amount > 0)
        || [...studentFees].reverse().find(sf => sf.fee_head_id === 'fh-tuition' && sf.status !== 'cancelled');
      if (feeRecord) {
        const newDiscount = (feeRecord.discount_amount || 0) + awardAmount;
        const netPayable = Math.max(0, feeRecord.amount - newDiscount);
        if (feeRecord.paid_amount > netPayable) {
          // Post-Payment Concession: Issue institutional credit note / refund memo
          const refundCredit = feeRecord.paid_amount - netPayable;
          await db.createPayment({
            id: `pay-cred-${Date.now()}`,
            receipt_no: `CN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
            student_id: app.student_id,
            student_fee_id: feeRecord.id,
            amount_paid: -refundCredit,
            payment_mode: 'net_banking',
            transaction_reference: `CREDIT-MEMO-${Date.now()}`,
            payment_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
            status: 'success',
          });
          await db.updateStudentFee(feeRecord.id, {
            paid_amount: netPayable,
            discount_amount: newDiscount,
            due_amount: 0,
            status: 'paid',
          });
        } else {
          const newDue = Math.max(0, netPayable - feeRecord.paid_amount);
          const newStatus = newDue === 0 ? 'paid' : (feeRecord.paid_amount > 0 ? 'partial' : 'due');
          await db.updateStudentFee(feeRecord.id, {
            discount_amount: newDiscount,
            due_amount: newDue,
            status: newStatus as any,
          });
        }
      }
      const updatedFees = await db.getStudentFees(app.student_id);
      const totalRemainingDue = updatedFees.reduce((acc, sf) => acc + (sf.status !== 'paid' && sf.status !== 'cancelled' ? sf.due_amount : 0), 0);
      if (totalRemainingDue <= 0) {
        await db.updateStudent(app.student_id, { fees_status: 'paid' });
      }
    }
  }

  res.json({
    success: true,
    message: `Application has been marked as '${status}'.`,
    application: updated || app,
  });
});

// Admin: Directly Award Scholarship to Student & Disburse to Fee Ledger
scholarshipRouter.post('/award', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, schemeId, amount, remarks } = req.body;

  if (!studentId || !schemeId) {
    res.status(400).json({ success: false, error: 'Student ID and Scholarship Scheme ID are required.' });
    return;
  }

  const allStudents = await db.getStudents();
  const student = allStudents.find(s => s.id === studentId || s.student_id === studentId);
  if (!student) {
    res.status(404).json({ success: false, error: 'Student record not found.' });
    return;
  }

  const schemes = await db.getSchemes();
  const scheme = schemes.find(s => s.id === schemeId || s.code === schemeId);
  if (!scheme) {
    res.status(404).json({ success: false, error: 'Scholarship scheme not found.' });
    return;
  }

  const awardAmount = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : scheme.award_amount;
  if (awardAmount <= 0) {
    res.status(400).json({ success: false, error: 'Award amount must be greater than zero.' });
    return;
  }

  // 1. Create approved application record
  const application: ScholarshipApplication = {
    id: `appl-${Date.now()}`,
    scheme_id: scheme.id,
    student_id: student.id,
    annual_family_income: 250000,
    previous_gpa: 9.0,
    reason_for_application: remarks || `Direct institutional award under ${scheme.title}`,
    document_path: '/uploads/documents/scholarship_direct_award.pdf',
    status: 'approved',
    admin_remarks: remarks || `Directly awarded by Academic & Finance Committee under ${scheme.title}`,
    reviewed_by: req.user?.id,
    reviewed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  await db.createScholarshipApplication(application);

  // 2. Immediately disburse discount to student fee ledger
  const studentFees = await db.getStudentFees(student.id);
  const feeRecord = [...studentFees].reverse().find(sf => sf.fee_head_id === 'fh-tuition' && sf.status !== 'cancelled' && sf.due_amount > 0)
    || [...studentFees].reverse().find(sf => sf.status !== 'cancelled' && sf.due_amount > 0)
    || [...studentFees].reverse().find(sf => sf.fee_head_id === 'fh-tuition' && sf.status !== 'cancelled');

  if (feeRecord) {
    const newDiscount = (feeRecord.discount_amount || 0) + awardAmount;
    const netPayable = Math.max(0, feeRecord.amount - newDiscount);
    if (feeRecord.paid_amount > netPayable) {
      const refundCredit = feeRecord.paid_amount - netPayable;
      await db.createPayment({
        id: `pay-cred-${Date.now()}`,
        receipt_no: `CN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        student_id: student.id,
        student_fee_id: feeRecord.id,
        amount_paid: -refundCredit,
        payment_mode: 'net_banking',
        transaction_reference: `CREDIT-MEMO-${Date.now()}`,
        payment_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'success',
      });
      await db.updateStudentFee(feeRecord.id, {
        paid_amount: netPayable,
        discount_amount: newDiscount,
        due_amount: 0,
        status: 'paid',
      });
    } else {
      const newDue = Math.max(0, netPayable - feeRecord.paid_amount);
      const newStatus = newDue === 0 ? 'paid' : (feeRecord.paid_amount > 0 ? 'partial' : 'due');
      await db.updateStudentFee(feeRecord.id, {
        discount_amount: newDiscount,
        due_amount: newDue,
        status: newStatus as any,
      });
    }
  }

  // 3. Re-evaluate overall student fee status
  const updatedFees = await db.getStudentFees(student.id);
  const totalRemainingDue = updatedFees.reduce((acc, sf) => acc + (sf.status !== 'paid' && sf.status !== 'cancelled' ? sf.due_amount : 0), 0);
  if (totalRemainingDue <= 0) {
    await db.updateStudent(student.id, { fees_status: 'paid' });
  }

  res.status(201).json({
    success: true,
    message: `Scholarship of ₹${awardAmount.toLocaleString('en-IN')} successfully awarded to ${student.first_name} ${student.last_name} and disbursed to Fee Ledger.`,
    application,
    student,
    awardedAmount: awardAmount,
    remainingDue: totalRemainingDue,
  });
});
