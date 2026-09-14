import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { GeminiService } from '../services/geminiService.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const aiRouter = Router();

// Check AI Service status
aiRouter.get('/status', (req: Request, res: Response) => {
  const status = GeminiService.getApiKeyStatus();
  res.json({
    success: true,
    service: 'EduCore Gemini AI Intelligence Hub',
    status: status.configured ? 'ready' : 'missing_api_key',
    keyPreview: status.keyPreview,
    features: [
      'ai_admission_parser',
      'ai_fee_recommendation',
      'ai_defaulter_notice_generator',
      'ai_erp_copilot',
    ],
  });
});

// 1. AI Admission Application Parser
const parseAdmissionSchema = z.object({
  text: z.string().min(10, 'Application text must contain at least 10 characters'),
});

aiRouter.post('/parse-admission', async (req: Request, res: Response): Promise<void> => {
  const parseResult = parseAdmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: parseResult.error.errors[0]?.message });
    return;
  }

  try {
    const courses = await db.getCourses();
    const parsedData = await GeminiService.parseAdmission(parseResult.data.text, courses);
    res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'AI parsing failed' });
  }
});

// 2. AI Automated Fee Structure & Concession Recommendation
aiRouter.post('/recommend-fee', async (req: Request, res: Response): Promise<void> => {
  const { studentData, courseId } = req.body;
  try {
    const courses = await db.getCourses();
    const course = courses.find(c => c.id === courseId || c.code === courseId) || courses[0];
    const recommendation = await GeminiService.recommendFeeStructure(studentData || {}, course);
    res.json({
      success: true,
      course,
      recommendation,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Fee recommendation failed' });
  }
});

// 3. AI Fee Dues Defaulter Recovery Notice Generator
aiRouter.post('/fee-notice', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, urgency } = req.body;
  try {
    const allStudents = await db.getStudents();
    const student = allStudents.find(s => s.id === studentId || s.student_id === studentId);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    const course = await db.getCourseById(student.course_id);
    const fees = await db.getStudentFees(student.id);
    const dueFees = fees.filter(f => f.status === 'due' || f.status === 'overdue' || f.status === 'partial');
    const totalDue = dueFees.reduce((acc, f) => acc + f.due_amount, 0) || 45000;
    const dueDate = dueFees[0]?.due_date || '2025-10-31';

    const notice = await GeminiService.generateFeeNotice(student, course, totalDue, dueDate, urgency || 'reminder');
    res.json({
      success: true,
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        studentId: student.student_id,
        email: student.email,
        phone: student.phone,
      },
      totalDue,
      dueDate,
      notice,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Notice generation failed' });
  }
});

// 4. AI College ERP Copilot / Natural Language Assistant
aiRouter.post('/copilot', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ success: false, error: 'Query is required.' });
    return;
  }

  try {
    const students = await db.getStudents();
    const allFees = await db.getStudentFees();
    const courses = await db.getCourses();

    const totalCollected = allFees.reduce((acc, f) => acc + f.paid_amount, 0);
    const totalDue = allFees.reduce((acc, f) => acc + f.due_amount, 0);

    const defaulters: any[] = [];
    for (const s of students) {
      const overdueFee = allFees.find(f => f.student_id === s.id && (f.status === 'overdue' || f.status === 'due'));
      if (overdueFee || s.fees_status === 'overdue') {
        const crs = courses.find(c => c.id === s.course_id);
        defaulters.push({
          name: `${s.first_name} ${s.last_name}`,
          roll: s.student_id,
          course: crs?.code || 'B.Tech',
          due: overdueFee?.due_amount || 45000,
        });
      }
    }

    const isStudent = req.user?.role === 'student';
    let erpSnapshot: any;

    if (isStudent) {
      const student = students.find(s => s.email.toLowerCase() === req.user?.email.toLowerCase() || s.user_id === req.user?.id) || students[0];
      const studentFees = student ? await db.getStudentFees(student.id) : [];
      const course = student ? courses.find(c => c.id === student.course_id) : null;
      const schemes = await db.getSchemes();

      erpSnapshot = {
        role: 'student',
        studentName: student ? `${student.first_name} ${student.last_name}` : req.user?.full_name,
        rollNo: student?.student_id,
        courseName: course?.name,
        semester: student?.current_semester,
        attendancePercentage: student?.attendance_percentage || 88,
        totalFeesPayable: studentFees.reduce((acc, f) => acc + f.amount, 0),
        totalFeesPaid: studentFees.reduce((acc, f) => acc + f.paid_amount, 0),
        totalFeesDue: studentFees.reduce((acc, f) => acc + (f.status !== 'paid' ? f.due_amount : 0), 0),
        feeStatus: student?.fees_status,
        availableScholarships: schemes.slice(0, 3).map(sc => `${sc.title} (Award: ₹${sc.award_amount})`),
      };
    } else {
      erpSnapshot = {
        role: 'admin',
        totalStudents: students.length,
        totalCollected,
        totalDue,
        courses: courses.map(c => ({ code: c.code, name: c.name, base_tuition_fee: c.base_tuition_fee })),
        defaulters,
        recentAdmissions: students.slice(-5).map(s => ({
          name: `${s.first_name} ${s.last_name}`,
          id: s.student_id,
          admission_status: s.admission_status,
          fees_status: s.fees_status,
        })),
      };
    }

    const response = await GeminiService.copilotQuery(query, erpSnapshot);
    res.json({
      success: true,
      query,
      result: response,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Copilot failed' });
  }
});
