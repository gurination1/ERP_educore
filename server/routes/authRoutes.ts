import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db.ts';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.ts';

export const authRouter = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
});

// Zod schemas for auth inputs
const loginSchema = z.object({
  username: z.string({ required_error: 'Username / Email is required' }).min(1, 'Username / Email is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  role: z.enum(['student', 'admin', 'staff']).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email address is required' }).email('Invalid email address format'),
});

// Login (real credentials only)
authRouter.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const { username, password, role } = parseResult.data;

  // Find user by username or email
  const user = await db.findUserByUsernameOrEmail(username);

  if (!user) {
    res.status(401).json({ success: false, error: 'No account found with this ID or Email.' });
    return;
  }

  // If role is specified, verify it matches
  if (role && user.role !== role) {
    res.status(403).json({
      success: false,
      error: `Account found, but role does not match '${role}'. Please select correct role.`,
    });
    return;
  }

  // Verify password strictly with bcrypt
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    return;
  }

  const token = generateToken(user);

  // If student, find student profile
  const student = await db.getStudentByUserIdOrEmail(user.id) || await db.getStudentByUserIdOrEmail(user.email);
  const course = student ? await db.getCourseById(student.course_id) : null;
  const session = student ? await db.getSessionById(student.session_id) : null;

  res.json({
    success: true,
    message: `Welcome back, ${user.full_name}!`,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    },
    student: student
      ? {
          ...student,
          course: course || undefined,
          session: session || undefined,
        }
      : null,
  });
});

// Current User Profile
authRouter.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const user = await db.findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const student = await db.getStudentByUserIdOrEmail(user.id) || await db.getStudentByUserIdOrEmail(user.email);
  const course = student ? await db.getCourseById(student.course_id) : null;
  const session = student ? await db.getSessionById(student.session_id) : null;

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    },
    student: student
      ? {
          ...student,
          course: course || undefined,
          session: session || undefined,
        }
      : null,
  });
});

// Forgot Password Request (Constant 200 response to prevent user enumeration)
authRouter.post('/forgot-password', authLimiter, (req: Request, res: Response): void => {
  const parseResult = forgotPasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  res.json({
    success: true,
    message: 'If an account exists for this email, reset instructions have been sent.',
  });
});

// Reset Password
authRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'Please provide email and a new password of at least 6 characters.' });
    return;
  }

  const user = await db.findUserByUsernameOrEmail(email);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.updateUserPasswordHash(email, newHash);
  res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
});
