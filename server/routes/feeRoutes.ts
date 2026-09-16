import { Router, Response } from 'express';
import { z } from 'zod';
import { db, Payment } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest, matchStudentForUser } from '../middleware/auth.ts';

export const feeRouter = Router();

// Zod schema for fee collection validation
const collectFeeSchema = z.object({
  studentId: z.string({ required_error: 'studentId is required' }).min(1, 'studentId is required'),
  amount: z.union([z.number(), z.string()]).transform(val => Number(val)).refine(val => !isNaN(val) && val > 0, 'Amount must be a positive number greater than 0'),
  paymentMode: z.enum(['online_upi', 'net_banking', 'credit_card', 'debit_card', 'cash', 'cheque']).optional().default('online_upi'),
  studentFeeId: z.string().optional(),
  selectedFeeHeadIds: z.array(z.string()).optional(),
  feeAllocations: z.array(z.object({
    studentFeeId: z.string(),
    amount: z.number().min(0)
  })).optional(),
  notes: z.string().optional(),
});

// Get all Fee Heads
feeRouter.get('/heads', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const heads = await db.getFeeHeads();
  res.json({ success: true, feeHeads: heads });
});

// Admin: Assign Fee Head record to student (Multi-head fee management)
feeRouter.post('/assign', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, feeHeadId, amount, dueDate, semester } = req.body;
  const allStudents = await db.getStudents();
  const student = allStudents.find(s => s.id === studentId || s.student_id === studentId);
  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }
  const feeHead = (await db.getFeeHeads()).find(fh => fh.id === feeHeadId || fh.code === feeHeadId);
  if (!feeHead) {
    res.status(404).json({ success: false, error: 'Fee head not found.' });
    return;
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
    return;
  }

  // Strict Indian College ERP Rule: Mutual Exclusivity between Hostel and Transport
  const isHostelHead = feeHead.id.startsWith('fh-hostel') || feeHead.code.startsWith('HOSTEL');
  const isTransportHead = feeHead.id.startsWith('fh-transport') || feeHead.code.startsWith('TRANSPORT');

  const targetSemester = semester || student.current_semester || 1;
  const existingFees = await db.getStudentFees(student.id);
  const activeHostelFee = existingFees.find(f => f.semester === targetSemester && (f.fee_head_id.startsWith('fh-hostel') || f.fee_head_id.startsWith('HOSTEL')) && f.status !== 'cancelled');
  const activeTransportFee = existingFees.find(f => f.semester === targetSemester && (f.fee_head_id.startsWith('fh-transport') || f.fee_head_id.startsWith('TRANSPORT')) && f.status !== 'cancelled');

  if (isHostelHead && (student.is_transport_user || activeTransportFee)) {
    res.status(400).json({
      success: false,
      error: 'Mutual Exclusivity Violation: Student is registered as a Day-Scholar / Bus Fleet Commuter for this semester. A day scholar cannot be assigned Hostel Room Rent, Mess Boarding, or Residential Utility Fees.',
    });
    return;
  }

  if (isTransportHead && (student.is_hosteller || activeHostelFee)) {
    res.status(400).json({
      success: false,
      error: 'Mutual Exclusivity Violation: Student is registered as a Campus Hosteller living in college dorms for this semester. Campus residents cannot be assigned College Bus / Transit Fleet commuter fees.',
    });
    return;
  }

  // Update residential status flag if assigning hostel or transport
  if (isHostelHead && !student.is_hosteller) {
    await db.updateStudent(student.id, { is_hosteller: true, is_transport_user: false });
  } else if (isTransportHead && !student.is_transport_user) {
    await db.updateStudent(student.id, { is_transport_user: true, is_hosteller: false });
  }

  const newFeeRecord = {
    id: `sf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    student_id: student.id,
    fee_head_id: feeHead.id,
    session_id: student.session_id,
    semester: semester || student.current_semester || 1,
    amount: numAmount,
    discount_amount: 0,
    paid_amount: 0,
    due_amount: numAmount,
    due_date: dueDate || '2025-11-30',
    status: 'due' as const,
  };
  await db.createStudentFee(newFeeRecord);
  await db.updateStudent(student.id, { fees_status: 'due' });
  res.status(201).json({ success: true, message: 'Fee record assigned successfully.', studentFee: newFeeRecord });
});

function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹ ${(amount / 100000).toFixed(2)} L`;
  }
  return `₹ ${Math.round(amount).toLocaleString('en-IN')}`;
}

// Admin Dashboard KPI Summary
feeRouter.get('/kpi', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const apps = await db.getScholarshipApplications();
  const pendingApprovalsCount = apps.filter(a => a.status === 'under_review' || a.status === 'submitted').length;
  const students = await db.getStudents();
  const activeStudents = students.filter(s => s.admission_status === 'approved' || s.admission_status === 'enrolled');

  const allFees = await db.getStudentFees();
  const activeFees = allFees.filter(f => f.status !== 'cancelled');
  const totalCollected = activeFees.reduce((acc, f) => acc + f.paid_amount, 0);
  const totalDue = activeFees.reduce((acc, f) => acc + (f.status !== 'paid' ? f.due_amount : 0), 0);

  res.json({
    success: true,
    kpi: {
      totalCollectedFormatted: formatIndianCurrency(totalCollected),
      totalCollectedRaw: totalCollected,
      totalCollectedGrowth: '+12% vs last month',
      pendingDuesFormatted: formatIndianCurrency(totalDue),
      pendingDuesRaw: totalDue,
      pendingDuesAlert: totalDue > 0 ? 'Requires collection action' : 'Zero outstanding dues',
      pendingApprovals: pendingApprovalsCount,
      pendingApprovalsLabel: 'Pending scholarship & concession applications',
      totalStudents: activeStudents.length || students.length,
      totalStudentsLabel: 'Enrolled students in campus',
    },
  });
});

// Monthly Fees Collected Trend for Chart
feeRouter.get('/trend', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const allPayments = await db.getPayments();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Build rolling 6-month aggregate from real payments
  const monthlyTotals: { [key: string]: number } = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]}`;
    monthlyTotals[key] = 0;
  }

  for (const pay of allPayments) {
    if (pay.status === 'success' && pay.amount_paid > 0) {
      const payDate = new Date(pay.payment_date);
      const mName = monthNames[payDate.getMonth()];
      if (monthlyTotals[mName] !== undefined) {
        monthlyTotals[mName] += pay.amount_paid;
      }
    }
  }

  const entries = Object.entries(monthlyTotals);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  const trendData = entries.map(([month, amount]) => {
    const amountLakhs = Math.round((amount / 100000) * 100) / 100;
    const percentage = Math.min(100, Math.round((amount / maxVal) * 100));
    return {
      month,
      label: month,
      amountLakhs,
      percentage: Math.max(10, percentage),
      value: amount >= 100000 ? `₹ ${amountLakhs} L` : `₹ ${amount.toLocaleString('en-IN')}`,
      isHighest: amount === maxVal && maxVal > 0,
    };
  });

  res.json({
    success: true,
    currency: 'INR',
    unit: 'Lakhs',
    trend: trendData,
  });
});

// Defaulters List for Admin Screen
feeRouter.get('/defaulters', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const students = await db.getStudents();
  const allFees = await db.getStudentFees();
  const courses = await db.getCourses();

  const defaulters: any[] = [];
  for (const s of students) {
    if (s.admission_status !== 'approved') continue;
    const fees = allFees.filter(f => f.student_id === s.id && f.status !== 'cancelled');
    const totalDue = fees.reduce((acc, f) => acc + (f.status !== 'paid' ? f.due_amount : 0), 0);
    const hasPendingDue = fees.some(f => (f.status === 'overdue' || f.status === 'due' || f.status === 'partial') && f.due_amount > 0);
    if ((hasPendingDue || s.fees_status === 'overdue' || s.fees_status === 'due') && totalDue > 0) {
      const crs = courses.find(c => c.id === s.course_id);
      const isOverdue = fees.some(f => f.status === 'overdue') || s.fees_status === 'overdue';
      const isPartial = fees.some(f => f.status === 'partial');
      defaulters.push({
        id: s.id,
        studentName: `${s.first_name} ${s.last_name}`,
        courseInfo: `${crs?.code || 'B.Tech'} • Sem ${s.current_semester}`,
        dueAmount: totalDue,
        dueAmountFormatted: `₹ ${totalDue.toLocaleString('en-IN')}`,
        status: isOverdue ? 'OVERDUE' : (isPartial ? 'PARTIAL' : 'DUE'),
        badgeType: isOverdue ? 'error' : 'warning',
      });
    }
  }

  res.json({ success: true, count: defaulters.length, defaulters });
});

// Student Ledger Details (Scoped: students can only fetch their own ledger)
feeRouter.get('/ledger/:studentId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.params;
  const allStudents = await db.getStudents();
  let student: Student | undefined;
  if (studentId === 'me') {
    student = allStudents.find(s => matchStudentForUser(s, req.user));
  } else {
    student = allStudents.find(s => s.id === studentId || s.student_id === studentId || s.user_id === studentId || s.email.toLowerCase() === studentId.toLowerCase());
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found.' });
    return;
  }

  // Fee ownership scoping for student role
  if (req.user?.role === 'student') {
    if (!matchStudentForUser(student, req.user)) {
      res.status(403).json({ success: false, error: 'Access denied. Students can only view their own fee ledger.' });
      return;
    }
  }

  const course = await db.getCourseById(student.course_id);
  const session = await db.getSessionById(student.session_id);
  const feeHeads = await db.getFeeHeads();
  const sessions = await db.getSessions();

  const rawFees = await db.getStudentFees(student.id);
  const studentFees = rawFees.map(sf => ({
    ...sf,
    fee_head: feeHeads.find(fh => fh.id === sf.fee_head_id),
    session: sessions.find(ses => ses.id === sf.session_id),
  }));

  const payments = await db.getPayments(student.id);

  const totalGross = studentFees.reduce((acc, sf) => acc + sf.amount, 0);
  const totalDiscount = studentFees.reduce((acc, sf) => acc + (sf.discount_amount || 0), 0);
  const totalPayable = studentFees.reduce((acc, sf) => acc + Math.max(0, sf.amount - (sf.discount_amount || 0)), 0);
  const totalPaid = studentFees.reduce((acc, sf) => acc + sf.paid_amount, 0);
  const totalDue = studentFees.reduce((acc, sf) => acc + (sf.status !== 'paid' && sf.status !== 'cancelled' ? sf.due_amount : 0), 0);

  res.json({
    success: true,
    student: {
      id: student.id,
      studentId: student.student_id,
      name: `${student.first_name} ${student.last_name}`,
      course: course?.name,
      courseCode: course?.code,
      semester: student.current_semester,
      session: session?.name,
    },
    summary: {
      totalGross,
      totalDiscount,
      totalPayable,
      totalPaid,
      totalDue,
      currency: 'INR',
    },
    ledger: studentFees,
    payments,
  });
});

// Pay / Collect Fee (Scoped & Zod Validated)
feeRouter.post('/collect', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = collectFeeSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const { studentId, amount, paymentMode, studentFeeId, selectedFeeHeadIds, feeAllocations, notes } = parseResult.data;
  const allStudents = await db.getStudents();
  let student: Student | undefined;
  if (studentId === 'me') {
    student = allStudents.find(s => matchStudentForUser(s, req.user));
  } else {
    student = allStudents.find(s => s.id === studentId || s.student_id === studentId || s.user_id === studentId || s.email.toLowerCase() === studentId.toLowerCase());
  }

  if (!student) {
    res.status(404).json({ success: false, error: 'Student record not found.' });
    return;
  }

  // Scoping check for student role
  if (req.user?.role === 'student') {
    if (!matchStudentForUser(student, req.user)) {
      res.status(403).json({ success: false, error: 'Access denied. You can only submit payments for your own account.' });
      return;
    }
  }

  const studentFees = await db.getStudentFees(student.id);
  const activeFees = studentFees.filter(sf => sf.status !== 'cancelled');
  const unpaidFees = activeFees.filter(sf => sf.status !== 'paid' && sf.due_amount > 0);
  const totalOutstandingDue = Math.round(unpaidFees.reduce((acc, sf) => acc + sf.due_amount, 0) * 100) / 100;

  if (totalOutstandingDue <= 0) {
    res.status(400).json({ success: false, error: 'Student has zero outstanding dues. All fee heads are already settled in full.' });
    return;
  }

  if (amount > totalOutstandingDue + 0.05) {
    res.status(400).json({
      success: false,
      error: `Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds total outstanding dues (₹${totalOutstandingDue.toLocaleString('en-IN')}). Overpayment is rejected by college auditing rules.`,
    });
    return;
  }

  if (feeAllocations && feeAllocations.length > 0) {
    const sumAlloc = Math.round(feeAllocations.reduce((acc, a) => acc + (a.amount || 0), 0) * 100) / 100;
    if (Math.abs(sumAlloc - amount) > 0.05) {
      res.status(400).json({
        success: false,
        error: `Total payment amount (₹${amount}) does not match the sum of itemized allocations (₹${sumAlloc}).`,
      });
      return;
    }

    for (const alloc of feeAllocations) {
      const targetFee = activeFees.find(sf => sf.id === alloc.studentFeeId || sf.fee_head_id === alloc.studentFeeId);
      if (!targetFee) {
        res.status(400).json({
          success: false,
          error: `Designated fee head [${alloc.studentFeeId}] does not exist on this student's assessment.`,
        });
        return;
      }
      if (alloc.amount > targetFee.due_amount + 0.05) {
        res.status(400).json({
          success: false,
          error: `Allocated amount ₹${alloc.amount} exceeds outstanding due ₹${targetFee.due_amount} for fee head [${targetFee.fee_head?.title || targetFee.fee_head_id}].`,
        });
        return;
      }
    }

    // 1. Direct itemized targeted allocation: Each fee record receives its exact designated amount
    for (const alloc of feeAllocations) {
      if (alloc.amount <= 0) continue;
      const targetFee = activeFees.find(sf => sf.id === alloc.studentFeeId || sf.fee_head_id === alloc.studentFeeId)!;
      const netPayable = Math.max(0, targetFee.amount - (targetFee.discount_amount || 0));
      const newPaid = Math.round((targetFee.paid_amount + alloc.amount) * 100) / 100;
      const newDue = Math.max(0, Math.round((netPayable - newPaid) * 100) / 100);
      const newStatus = newDue <= 0.01 ? 'paid' : (newPaid > 0 ? 'partial' : 'due');
      await db.updateStudentFee(targetFee.id, {
        paid_amount: newPaid,
        due_amount: newDue <= 0.01 ? 0 : newDue,
        status: newStatus,
      });
    }
  } else if (studentFeeId) {
    // 2. Single fee record targeted allocation (e.g. user clicked pay on specific row)
    const feeRecord = activeFees.find(sf => sf.id === studentFeeId || sf.fee_head_id === studentFeeId);
    if (!feeRecord) {
      res.status(400).json({ success: false, error: `Fee head [${studentFeeId}] not found.` });
      return;
    }
    if (amount > feeRecord.due_amount + 0.05) {
      res.status(400).json({
        success: false,
        error: `Payment amount ₹${amount} exceeds outstanding due ₹${feeRecord.due_amount} for this fee head.`,
      });
      return;
    }
    const netPayable = Math.max(0, feeRecord.amount - (feeRecord.discount_amount || 0));
    const newPaid = Math.round((feeRecord.paid_amount + amount) * 100) / 100;
    const newDue = Math.max(0, Math.round((netPayable - newPaid) * 100) / 100);
    const newStatus = newDue <= 0.01 ? 'paid' : (newPaid > 0 ? 'partial' : 'due');
    await db.updateStudentFee(feeRecord.id, {
      paid_amount: newPaid,
      due_amount: newDue <= 0.01 ? 0 : newDue,
      status: newStatus,
    });
  } else if (selectedFeeHeadIds && selectedFeeHeadIds.length > 0) {
    // 3. Filtered waterfall allocation: Distribute ONLY among chosen fee heads
    let remainingPayment = amount;
    const targetFees = activeFees.filter(sf => 
      sf.status !== 'paid' && 
      sf.due_amount > 0 &&
      (selectedFeeHeadIds.includes(sf.id) || selectedFeeHeadIds.includes(sf.fee_head_id))
    );
    for (const sf of targetFees) {
      if (remainingPayment <= 0) break;
      const allocate = Math.min(remainingPayment, sf.due_amount);
      const newPaid = Math.round((sf.paid_amount + allocate) * 100) / 100;
      const netPayable = Math.max(0, sf.amount - (sf.discount_amount || 0));
      const newDue = Math.max(0, Math.round((netPayable - newPaid) * 100) / 100);
      const newStatus = newDue <= 0.01 ? 'paid' : (newPaid > 0 ? 'partial' : 'due');
      await db.updateStudentFee(sf.id, {
        paid_amount: newPaid,
        due_amount: newDue <= 0.01 ? 0 : newDue,
        status: newStatus,
      });
      remainingPayment = Math.round((remainingPayment - allocate) * 100) / 100;
    }
  } else {
    // 4. Bulk waterfall allocation: cascade payments across all unpaid fee records
    let remainingPayment = amount;
    for (const sf of unpaidFees) {
      if (remainingPayment <= 0) break;
      const allocate = Math.min(remainingPayment, sf.due_amount);
      const newPaid = Math.round((sf.paid_amount + allocate) * 100) / 100;
      const netPayable = Math.max(0, sf.amount - (sf.discount_amount || 0));
      const newDue = Math.max(0, Math.round((netPayable - newPaid) * 100) / 100);
      const newStatus = newDue <= 0.01 ? 'paid' : (newPaid > 0 ? 'partial' : 'due');
      await db.updateStudentFee(sf.id, {
        paid_amount: newPaid,
        due_amount: newDue <= 0.01 ? 0 : newDue,
        status: newStatus,
      });
      remainingPayment = Math.round((remainingPayment - allocate) * 100) / 100;
    }
  }

  // Update student overall fee status
  const updatedFees = await db.getStudentFees(student.id);
  const remainingDue = Math.round(updatedFees.reduce((acc, sf) => acc + (sf.status !== 'paid' && sf.status !== 'cancelled' ? sf.due_amount : 0), 0) * 100) / 100;
  const newStudentFeesStatus = remainingDue <= 0.01 ? 'paid' : (updatedFees.some(sf => sf.paid_amount > 0) ? 'partial' : 'due');
  await db.updateStudent(student.id, { fees_status: newStudentFeesStatus });

  const primaryFeeId = studentFeeId || (feeAllocations && feeAllocations.length === 1 ? feeAllocations[0].studentFeeId : undefined) || (selectedFeeHeadIds && selectedFeeHeadIds.length === 1 ? selectedFeeHeadIds[0] : undefined);

  const receiptNo = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newPayment: Payment = {
    id: `pay-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    receipt_no: receiptNo,
    student_id: student.id,
    student_fee_id: primaryFeeId,
    amount_paid: amount,
    payment_mode: paymentMode || 'net_banking',
    transaction_reference: `TXN-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`,
    payment_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'success',
  };

  await db.createPayment(newPayment);

  res.json({
    success: true,
    message: 'Fee payment collected successfully.',
    receiptNo,
    payment: newPayment,
    remainingDue,
  });
});

// Printable Receipt details (Scoped: students can only view their own receipts)
feeRouter.get('/receipt/:receiptIdOrNo(*)', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const receiptIdOrNo = req.params.receiptIdOrNo || req.params[0] || (req.query.ref as string);
  let payment = await db.getPaymentByReceiptNo(receiptIdOrNo);
  if (!payment) {
    const allPayments = await db.getPayments();
    payment = allPayments.find(p => p.id === receiptIdOrNo || p.receipt_no === receiptIdOrNo || p.transaction_reference === receiptIdOrNo) || null;
  }

  // Allow 'latest' fallback for student, but return 404 for nonexistent explicit receipt tokens
  if (!payment && req.user?.role === 'student' && (receiptIdOrNo === 'latest' || !receiptIdOrNo)) {
    const allStudents = await db.getStudents();
    const student = allStudents.find(s => matchStudentForUser(s, req.user));
    if (student) {
      const studentPayments = await db.getPayments(student.id);
      payment = studentPayments[0] || null;
    }
  }

  if (!payment) {
    res.status(404).json({ success: false, error: 'Receipt not found.' });
    return;
  }

  const student = await db.getStudentById(payment.student_id);
  if (!student) {
    res.status(404).json({ success: false, error: 'Student record for receipt not found.' });
    return;
  }

  // Scoping check for student role
  if (req.user?.role === 'student') {
    if (!matchStudentForUser(student, req.user)) {
      res.status(403).json({ success: false, error: 'Access denied. You can only view your own receipts.' });
      return;
    }
  }

  const course = await db.getCourseById(student.course_id);
  const feeRecord = payment.student_fee_id ? await db.getStudentFeeById(payment.student_fee_id) : null;
  const feeHeads = await db.getFeeHeads();
  const feeHead = feeRecord ? feeHeads.find(fh => fh.id === feeRecord.fee_head_id) : null;

  res.json({
    success: true,
    payment,
    receipt: {
      receiptNo: payment.receipt_no,
      transactionRef: payment.transaction_reference,
      date: payment.payment_date,
      paymentMode: payment.payment_mode,
      amount: payment.amount_paid,
      amountInWords: `${payment.amount_paid.toLocaleString('en-IN')} Indian Rupees Only`,
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      email: student.email,
      course: course?.name,
      courseCode: course?.code,
      semester: student.current_semester,
      feeCategory: feeHead?.title || 'Academic Tuition & Semester Assessment',
      institutionName: 'Baba Farid College of Engineering & Technology (BFGI)',
      campusAddress: 'Muktsar Road, Deon, Bathinda, Punjab 151001 (Affiliated to MRSPTU Bathinda)',
      authorizedSignatory: 'Finance & Accounts Division, BFGI Bathinda',
      status: payment.status,
    },
  });
});
