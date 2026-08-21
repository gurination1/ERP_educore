import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User, Student, db } from '../db.ts';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'student' | 'admin' | 'staff';
    full_name: string;
  };
}

export function matchStudentForUser(student: { user_id?: string; email: string }, user?: AuthRequest['user']): boolean {
  if (!user) return false;
  if (student.user_id && student.user_id === user.id) return true;
  if (student.email && student.email.toLowerCase() === user.email.toLowerCase()) return true;
  return false;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. Please provide a valid Bearer token.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    // Verify user still exists and is active in DB
    const userInDb = db.users.find(u => u.id === decoded?.id && u.is_active);
    if (!userInDb) {
      res.status(401).json({ success: false, error: 'User account not found or deactivated.' });
      return;
    }
    req.user = {
      id: userInDb.id,
      username: userInDb.username,
      email: userInDb.email,
      role: userInDb.role,
      full_name: userInDb.full_name,
    };
    next();
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid or expired token.' });
  }
}

export function requireRole(...allowedRoles: Array<'student' | 'admin' | 'staff'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
      });
      return;
    }
    next();
  };
}
