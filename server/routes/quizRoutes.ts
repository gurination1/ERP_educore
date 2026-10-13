import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const quizRouter = Router();

// 1. GET /api/quizzes - List quizzes
quizRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quizzes = await db.getQuizzes();
    res.json({ success: true, count: quizzes.length, quizzes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/quizzes/resources - List LMS resources
quizRouter.get('/resources', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resources = await db.getLmsResources();
    res.json({ success: true, count: resources.length, resources });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/quizzes/resources - Create LMS resource (Faculty / Admin)
const createResourceSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  format: z.string().min(1),
  lecturer: z.string().min(1),
  downloadUrl: z.string().optional(),
});

quizRouter.post('/resources', authenticateToken, requireRole('admin', 'super_admin', 'staff', 'hod'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createResourceSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    const resource = await db.createLmsResource(parseResult.data);
    res.status(201).json({ success: true, resource });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/quizzes/submissions - List submissions
quizRouter.get('/submissions', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quizId = typeof req.query.quizId === 'string' ? req.query.quizId : undefined;
    let studentId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;

    if (req.user?.role === 'student') {
      studentId = req.user.id;
    }

    const submissions = await db.getQuizSubmissions(quizId, studentId);
    res.json({ success: true, count: submissions.length, submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/quizzes/:id - Get quiz details
quizRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const quiz = await db.getQuizById(id);
    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }
    res.json({ success: true, quiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/quizzes/:id/submit - Submit quiz answers
const submitQuizSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  selectedAnswers: z.record(z.number()),
  timeTakenSeconds: z.number().optional(),
});

quizRouter.post('/:id/submit', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = submitQuizSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    const { selectedAnswers, timeTakenSeconds } = parseResult.data;
    const studentId = parseResult.data.studentId || req.user?.id || 'usr-stu-aryan';
    const studentName = parseResult.data.studentName || req.user?.full_name || 'Aryan Sharma';

    const result = await db.submitQuiz(id, studentId, studentName, selectedAnswers, timeTakenSeconds);

    res.json({
      success: true,
      message: `Quiz submitted successfully! Score: ${result.score}/${result.totalMarks} (${result.percentage}% - ${result.passed ? 'PASSED' : 'FAILED'}).`,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
