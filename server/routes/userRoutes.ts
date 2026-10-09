import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, User, generateEnterpriseUID } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const userRouter = Router();

// Zod schemas for user management
const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters').default('Educore@2025'),
  role: z.enum(['admin', 'staff', 'counselor', 'hod', 'accounts', 'student', 'super_admin']),
  fullName: z.string().min(2, 'Full name is required'),
  department: z.string().optional(),
  designation: z.string().optional(),
  employeeId: z.string().optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['admin', 'staff', 'counselor', 'hod', 'accounts', 'student', 'super_admin']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  employeeId: z.string().optional(),
  email: z.string().email().optional(),
});

// 1. List all users (Admin & Super Admin only)
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
  let safeUsers = users.map(u => ({
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
    enterprise_uid: u.enterprise_uid,
    created_at: u.created_at,
  }));

  // SUPER ADMIN INVISIBILITY RULE: Invisible to subordinate administrators, faculty, and students
  if (req.user?.role !== 'super_admin') {
    safeUsers = safeUsers.filter(u => u.role !== 'super_admin');
  }

  res.json({
    success: true,
    count: safeUsers.length,
    users: safeUsers,
  });
});

// 2. Hire / Provision new Staff or User (Admin & Super Admin power)
userRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = createUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const { username, email, password, role, fullName, department, designation, employeeId } = parseResult.data;

  // Only super_admin can create another super_admin
  if (role === 'super_admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Only Universal Super Admin can provision Super Admin accounts.' });
    return;
  }

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
  const enterpriseUid = generateEnterpriseUID(role, '03', '01');

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
    enterprise_uid: enterpriseUid,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const created = await db.createUser(newUser);

  // Write immutable audit log
  await db.createAuditLog({
    actor_id: req.user!.id,
    actor_name: req.user!.full_name,
    actor_role: req.user!.role,
    action: 'USER_PROVISIONED',
    target_type: 'user',
    target_id: created.id,
    details: `User account created: ${created.full_name} (${created.role}) with Enterprise UID ${created.enterprise_uid}.`,
    severity: 'info',
  });

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
      enterprise_uid: created.enterprise_uid,
      is_active: created.is_active,
      created_at: created.created_at,
    },
    credentialsSlip: {
      fullName,
      username: created.username,
      tempPassword: password,
      role: created.role,
      enterpriseUid: created.enterprise_uid,
      employeeId: created.employee_id,
      department: created.department || 'General Academic',
      issuedAt: new Date().toISOString(),
    },
  });
});

// 3. Edit User Profile & Roles (Admin & Super Admin)
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

  // Prevent subordinate admins from modifying Super Admin
  if (existing.role === 'super_admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Super Admin credentials can only be modified by Super Admin.' });
    return;
  }

  if (parseResult.data.role === 'super_admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Cannot elevate role to Super Admin.' });
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

  await db.createAuditLog({
    actor_id: req.user!.id,
    actor_name: req.user!.full_name,
    actor_role: req.user!.role,
    action: 'USER_UPDATED',
    target_type: 'user',
    target_id: existing.id,
    details: `Updated profile fields for ${existing.username} (${existing.full_name}).`,
    changes_diff: JSON.stringify(updates),
    severity: 'info',
  });

  res.json({
    success: true,
    message: `User ${existing.username} profile updated successfully.`,
    user: updated,
  });
});

const handleUserStatusUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const rawActive = req.body.isActive !== undefined ? req.body.isActive : req.body.is_active;
  const { status, reason, effectiveDate, lastWorkingDate } = req.body;
  const isActive = typeof rawActive === 'boolean' ? rawActive : undefined;

  if (typeof isActive !== 'boolean' && typeof status !== 'string') {
    res.status(400).json({ success: false, error: 'Either isActive (boolean) or status (string) is required.' });
    return;
  }

  const computedIsActive = typeof isActive === 'boolean'
    ? isActive
    : status === 'ACTIVE' || status === 'active';

  // Prevent self-deactivation of currently logged in operator
  if (req.user?.id === id && !computedIsActive) {
    res.status(400).json({ success: false, error: 'Cannot deactivate your own active session.' });
    return;
  }

  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  // Super Admin security fence: Only Super Admin can mutate Super Admin accounts
  if (existing.role === 'super_admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Super Admin status cannot be altered by subordinate administrator.' });
    return;
  }

  // Subordinate administrator fence: Cannot deactivate another administrator unless caller is Super Admin
  if (existing.role === 'admin' && req.user?.role !== 'super_admin' && req.user?.id !== id) {
    res.status(403).json({ success: false, error: 'Subordinate administrator cannot deactivate another Administrator. Super Admin authority required.' });
    return;
  }

  const statusLabel = status || (computedIsActive ? 'ACTIVE' : 'SUSPENDED');

  await db.updateUser(id, { is_active: computedIsActive });

  // Synchronize with linked staff record if user has employee_id
  if (existing.employee_id) {
    try {
      const staffMember = await db.findStaffByEmployeeId(existing.employee_id);
      if (staffMember) {
        await db.updateStaffBasic(staffMember.staff_id, {
          employee_status: statusLabel.toUpperCase(),
          login_enabled: computedIsActive,
          last_working_date: lastWorkingDate || undefined,
          date_of_resigning: effectiveDate || undefined,
        }, req.user?.id || 'admin');
      }
    } catch (e) {
      // non-fatal
    }
  }

  // Synchronize with linked student record if user is a student
  try {
    const student = await db.getStudentByUserIdOrEmail(existing.id) || await db.getStudentByUserIdOrEmail(existing.email);
    if (student) {
      await db.updateStudent(student.id, {
        status: computedIsActive ? 'active' : 'suspended',
      });
    }
  } catch (e) {
    // non-fatal
  }

  await db.createAuditLog({
    actor_id: req.user!.id,
    actor_name: req.user!.full_name,
    actor_role: req.user!.role,
    action: computedIsActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    target_type: 'user',
    target_id: existing.id,
    details: `User status changed to ${statusLabel} (${computedIsActive ? 'active' : 'inactive'}). Reason: ${reason || 'Administrative governance decision'}. Effective: ${effectiveDate || 'immediate'}. Last Working Day: ${lastWorkingDate || 'N/A'}.`,
    severity: computedIsActive ? 'info' : 'warn',
  });

  res.json({
    success: true,
    message: `User ${existing.full_name} (@${existing.username}) is now ${statusLabel} (${computedIsActive ? 'Active' : 'Inactive'}).`,
    is_active: computedIsActive,
    status: statusLabel,
  });
};

userRouter.patch('/:id/status', authenticateToken, requireRole('admin'), handleUserStatusUpdate);
userRouter.put('/:id/status', authenticateToken, requireRole('admin'), handleUserStatusUpdate);

// 5. Reset Password (Admin extreme power override)
userRouter.post('/:id/reset-password', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  if (existing.role === 'super_admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Super Admin credentials can only be reset by Super Admin.' });
    return;
  }

  const targetPassword = newPassword && newPassword.length >= 6
    ? newPassword
    : `Reset@${Date.now().toString().slice(-4)}`;

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(targetPassword, salt);

  await db.updateUserPasswordHash(existing.id, passwordHash);

  await db.createAuditLog({
    actor_id: req.user!.id,
    actor_name: req.user!.full_name,
    actor_role: req.user!.role,
    action: 'ADMIN_PASSWORD_RESET',
    target_type: 'user',
    target_id: existing.id,
    details: `Password reset override performed for user ${existing.username}.`,
    severity: 'warn',
  });

  res.json({
    success: true,
    message: `Password for ${existing.full_name} (${existing.username}) was reset successfully.`,
    credentialsSlip: {
      username: existing.username,
      email: existing.email,
      newPassword: targetPassword,
      fullName: existing.full_name,
      role: existing.role,
      enterpriseUid: existing.enterprise_uid,
    },
  });
});

// 6. Delete user (Admin only)
userRouter.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ success: false, error: 'Cannot delete current logged-in user account.' });
    return;
  }

  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  if (existing.role === 'super_admin') {
    res.status(403).json({ success: false, error: 'Super Admin account cannot be deleted.' });
    return;
  }

  if (existing.role === 'admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Only Universal Super Admin can delete an institutional Administrator.' });
    return;
  }

  await db.deleteUser(id);

  await db.createAuditLog({
    actor_id: req.user!.id,
    actor_name: req.user!.full_name,
    actor_role: req.user!.role,
    action: 'USER_DELETED',
    target_type: 'user',
    target_id: existing.id,
    details: `User account ${existing.username} (${existing.full_name}) permanently deleted.`,
    severity: 'critical',
  });

  res.json({
    success: true,
    message: `User account ${existing.username} deleted permanently.`,
  });
});

// 7. Apex Super Admin / Authority Override (Extreme universal power - Super Admin ONLY)
userRouter.patch('/:id/override', authenticateToken, requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await db.findUserById(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  if (existing.role === 'super_admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Super Admin account can only be overridden by Chief Super Admin.' });
    return;
  }

  const { fullName, username, email, role, department, designation, employeeId, isActive, newPassword } = req.body;

  if (role === 'super_admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'Only Super Admin can promote accounts to Super Admin.' });
    return;
  }

  const updated = await db.overrideUser(
    id,
    {
      full_name: fullName,
      username,
      email,
      role,
      department,
      designation,
      employee_id: employeeId,
      is_active: isActive,
      new_password: newPassword,
    },
    req.user as any
  );

  res.json({
    success: true,
    message: `Account credentials and profile for ${updated.full_name} (${updated.username}) overridden successfully.`,
    user: updated,
  });
});
