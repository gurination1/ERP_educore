import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, User } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const userRouter = Router();

// Zod schemas for user management
const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters').default('Educore@2025'),
  role: z.enum(['admin', 'staff', 'counselor', 'hod', 'accounts', 'student']),
  fullName: z.string().min(2, 'Full name is required'),
  department: z.string().optional(),
  designation: z.string().optional(),
  employeeId: z.string().optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['admin', 'staff', 'counselor', 'hod', 'accounts', 'student']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  employeeId: z.string().optional(),
  email: z.string().email().optional(),
});

// 1. List all users (Admin only)
userRouter.get('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, search, status } = req.query;

  const filters: { role?: string; search?: string; is_active?: boolean } = {};
  if (role && typeof role === 'string' && role !== 'all') {
    filters.role = role;
  }
  if (search && typeof search === 'string') {
    filters.search = search;
  }
  if (status === 'active') filters.is_active = true;
  else if (status === 'inactive') filters.is_active = false;

  const users = await db.getUsers(filters);
  const safeUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
    is_active: u.is_active,
    department: u.department,
    designation: u.designation,
    employee_id: u.employee_id,
    created_at: u.created_at,
  }));

  res.json({
    success: true,
    count: safeUsers.length,
    users: safeUsers,
  });
});

// 2. Hire / Provision new Staff or User (Admin extreme power)
userRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = createUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const { username, email, password, role, fullName, department, designation, employeeId } = parseResult.data;

  // Check if username or email already exists
  const existingUser = await db.findUserByUsernameOrEmail(username) || await db.findUserByUsernameOrEmail(email);
  if (existingUser) {
    res.status(400).json({
      success: false,
      error: `A user with username '${username}' or email '${email}' already exists.`,
    });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `usr-${role}-${Date.now().toString().slice(-6)}`,
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    role,
    full_name: fullName.trim(),
    department: department?.trim() || undefined,
    designation: designation?.trim() || undefined,
    employee_id: employeeId?.trim() || `EMP-${Date.now().toString().slice(-4)}`,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const created = await db.createUser(newUser);

  res.status(201).json({
    success: true,
    message: `Account for ${fullName} (${role.toUpperCase()}) successfully provisioned.`,
    user: {
      id: created.id,
      username: created.username,
      email: created.email,
      role: created.role,
      full_name: created.full_name,
      department: created.department,
      designation: created.designation,
      employee_id: created.employee_id,
      is_active: created.is_active,
      created_at: created.created_at,
    },
    credentialsSlip: {
      fullName,
      username: created.username,
      tempPassword: password,
      role: created.role,
      employeeId: created.employee_id,
      department: created.department || 'General Academic',
      issuedAt: new Date().toISOString(),
    },
  });
});

// 3. Edit User Profile & Roles (Admin only)
userRouter.patch('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const parseResult = updateUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  const updates: Partial<User> = {};
  if (parseResult.data.fullName) updates.full_name = parseResult.data.fullName;
  if (parseResult.data.role) updates.role = parseResult.data.role;
  if (parseResult.data.department !== undefined) updates.department = parseResult.data.department;
  if (parseResult.data.designation !== undefined) updates.designation = parseResult.data.designation;
  if (parseResult.data.employeeId !== undefined) updates.employee_id = parseResult.data.employeeId;
  if (parseResult.data.email) updates.email = parseResult.data.email.toLowerCase().trim();

  const updated = await db.updateUser(id, updates);

  res.json({
    success: true,
    message: `User ${existing.username} profile updated successfully.`,
    user: updated,
  });
});

// 4. Toggle Active / Suspended Status (Admin only)
userRouter.patch('/:id/status', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    res.status(400).json({ success: false, error: 'isActive must be a boolean.' });
    return;
  }

  if (req.user?.id === id && !isActive) {
    res.status(400).json({ success: false, error: 'Super Admin cannot deactivate their own active session.' });
    return;
  }

  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  await db.updateUser(id, { is_active: isActive });

  res.json({
    success: true,
    message: `User ${existing.username} has been ${isActive ? 'activated' : 'suspended'}.`,
    is_active: isActive,
  });
});

// 5. Reset Password (Admin extreme power override)
userRouter.post('/:id/reset-password', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  const targetPassword = newPassword && newPassword.length >= 6
    ? newPassword
    : `Reset@${Date.now().toString().slice(-4)}`;

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(targetPassword, salt);

  await db.updateUserPasswordHash(existing.id, passwordHash);

  res.json({
    success: true,
    message: `Password for ${existing.full_name} (${existing.username}) was reset successfully.`,
    credentialsSlip: {
      username: existing.username,
      email: existing.email,
      newPassword: targetPassword,
      fullName: existing.full_name,
      role: existing.role,
    },
  });
});

// 6. Delete user (Admin only)
userRouter.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ success: false, error: 'Cannot delete current logged-in Super Admin.' });
    return;
  }

  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  await db.deleteUser(id);

  res.json({
    success: true,
    message: `User account ${existing.username} deleted permanently.`,
  });
});
