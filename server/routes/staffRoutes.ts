import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const staffRouter = Router();

// 1. List all staff members with multi-table summaries
staffRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { department, status, search } = req.query;
    const filters: { department?: string; status?: string; search?: string } = {};
    if (department && typeof department === 'string' && department !== 'all' && department !== 'undefined' && department.trim() !== '') {
      filters.department = department.trim();
    }
    if (status && typeof status === 'string' && status !== 'all' && status !== 'undefined' && status.trim() !== '') {
      filters.status = status.trim();
    }
    if (search && typeof search === 'string' && search !== 'undefined' && search.trim() !== '') {
      filters.search = search.trim();
    }

    const list = await db.getStaffList(filters);
    res.json({ success: true, count: list.length, staff: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const academicJourneySchema = z.object({
  qualification_level: z.enum(['PhD', 'PostDoc', 'M.Tech', 'M.Sc', 'MBA', 'B.Tech', 'B.Sc']),
  degree_name: z.string().min(2),
  awarding_university: z.string().min(2),
  year_of_passing: z.number().int().min(1960).max(2035),
  specialization: z.string().min(2),
  scopus_publications: z.number().int().min(0).default(0),
  sci_publications: z.number().int().min(0).default(0),
  patents_count: z.number().int().min(0).default(0),
  past_institutions_summary: z.string().optional(),
  verified: z.boolean().default(false),
});

// Staff Academic Journey Records (Scopus / SCI / Patents)
staffRouter.get('/academic-journey', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const list = await db.getStaffAcademicJourney();
  res.json({
    success: true,
    count: list.length,
    academicJourneys: list,
  });
});

staffRouter.get('/:id/academic-journey', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const list = await db.getStaffAcademicJourney(id);
  res.json({
    success: true,
    staffId: id,
    count: list.length,
    academicJourneys: list,
  });
});

staffRouter.post('/:id/academic-journey', authenticateToken, requireRole('admin', 'super_admin', 'staff', 'hod', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const parseResult = academicJourneySchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const staffUser = await db.findUserById(id);
  const staffName = staffUser ? staffUser.full_name : 'Faculty Member';

  const created = await db.addStaffAcademicJourney({
    staff_id: id,
    staff_name: staffName,
    qualification_level: parseResult.data.qualification_level,
    degree_name: parseResult.data.degree_name,
    awarding_university: parseResult.data.awarding_university,
    year_of_passing: parseResult.data.year_of_passing,
    specialization: parseResult.data.specialization,
    scopus_publications: parseResult.data.scopus_publications,
    sci_publications: parseResult.data.sci_publications,
    patents_count: parseResult.data.patents_count,
    past_institutions_summary: parseResult.data.past_institutions_summary || '',
    verified: parseResult.data.verified || false,
  });

  await db.createAuditLog({
    actor_id: req.user!.id,
    actor_name: req.user!.full_name,
    actor_role: req.user!.role,
    action: 'STAFF_DEGREE_RECORDED',
    target_type: 'user',
    target_id: id,
    details: `Added ${created.qualification_level} record for ${staffName} (${created.specialization}).`,
    severity: 'info',
  });

  res.status(201).json({
    success: true,
    message: 'Staff academic journey qualification recorded successfully.',
    academicJourney: created,
  });
});

// 2. Get full multi-table profile for a single staff member
staffRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const profile = await db.getStaffFullProfile(staffId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Staff member record not found.' });
      return;
    }
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create new staff member
staffRouter.post('/', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { basic, additional, address, bankAccount, qualification } = req.body;
    if (!basic || !basic.full_name || !basic.employee_id || !basic.department_id) {
      res.status(400).json({ success: false, error: 'Mandatory basic info fields (full_name, employee_id, department_id) are required.' });
      return;
    }

    const created = await db.createStaff({
      basic,
      additional,
      address,
      bankAccount,
      qualification,
      actor_id: req.user?.id || 'usr-admin-01',
    });

    await db.createAuditLog({
      actor_id: req.user?.id || 'usr-admin-01',
      actor_name: req.user?.username || 'admin',
      actor_role: req.user?.role || 'admin',
      actor_ip: req.ip,
      action: 'STAFF_MEMBER_CREATED',
      target_type: 'staff',
      target_id: basic.employee_id,
      details: `New staff member ${basic.full_name} (${basic.employee_id}) registered in ${basic.department_id}.`,
      severity: 'info',
    });

    res.status(201).json({ success: true, message: 'Staff member successfully registered.', profile: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update basic info (status lifecycle transitions require dates)
staffRouter.put('/:id/basic', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const updates = req.body;

    // Check status transition requirement: Resigned, Terminated, AOL require effective date
    if (updates.employee_status && ['RESIGNED', 'TERMINATED', 'AOL', 'DEACTIVATED'].includes(updates.employee_status)) {
      if (!updates.date_of_resigning && !updates.last_working_date) {
        res.status(400).json({
          success: false,
          error: `Status transition to '${updates.employee_status}' requires an Effective Date and Last Working Date.`,
        });
        return;
      }
    }

    const updated = await db.updateStaffBasic(staffId, updates, req.user?.id || 'usr-admin-01');
    if (!updated) {
      res.status(404).json({ success: false, error: 'Staff member not found.' });
      return;
    }

    res.json({ success: true, message: 'Staff basic record updated successfully.', basic: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Toggle staff login enable / disable with OTP dispatch notification
staffRouter.patch('/:id/login-status', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ success: false, error: 'Field "enabled" (boolean) is required.' });
      return;
    }

    const result = await db.setStaffLoginStatus(staffId, enabled, req.user?.id || 'usr-admin-01');
    res.json({
      success: true,
      message: `Staff login has been ${enabled ? 'ENABLED' : 'DISABLED'}. Security OTP notification dispatched to registered mobile and email.`,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Admin assisted password reset with mandatory password change flag
staffRouter.post('/:id/admin-reset-password', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const { tempPassword } = req.body;

    const result = await db.resetStaffPasswordByAdmin(staffId, tempPassword, req.user?.id || 'usr-admin-01');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Add address
staffRouter.post('/:id/addresses', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const addr = await db.addStaffAddress({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, address: addr });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Add bank account
staffRouter.post('/:id/bank-accounts', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const bank = await db.addStaffBankAccount({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, bankAccount: bank });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Add qualification
staffRouter.post('/:id/qualifications', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const qual = await db.addStaffQualification({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, qualification: qual });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Add certification
staffRouter.post('/:id/certifications', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const cert = await db.addStaffCertification({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, certification: cert });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Add experience
staffRouter.post('/:id/experience', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const exp = await db.addStaffExperience({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, experience: exp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Add organizational journey event (promotion, demotion, additional role, role switch)
staffRouter.post('/:id/org-journey', authenticateToken, requireRole('admin', 'super_admin', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const event = await db.addStaffOrgJourneyEvent({
      ...req.body,
      staff_id: staffId,
      actor_id: req.user?.id || 'usr-admin-01',
    });
    res.status(201).json({ success: true, event });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 13. HRMS PAYROLL STRUCTURE & ALLOWANCES (Lecture 3)
// ====================================================
staffRouter.get('/:id/payroll', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const payroll = await db.getStaffPayroll(staffId);
    res.json({ success: true, staffId, payroll });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

staffRouter.put('/:id/payroll', authenticateToken, requireRole('admin', 'super_admin', 'accounts', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const updated = await db.updateStaffPayroll(staffId, req.body);
    res.json({ success: true, message: 'Payroll structure updated successfully', payroll: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 14. STAFF SECURITY DEDUCTION SCHEDULE & AUTO-LOCK (Lecture 3)
// ====================================================
staffRouter.get('/:id/security-deduction', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const sec = await db.getStaffSecurityDeduction(staffId);
    res.json({ success: true, staffId, securityDeduction: sec });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

staffRouter.post('/:id/security-deduction/installment', authenticateToken, requireRole('admin', 'super_admin', 'accounts', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const { installmentAmount } = req.body;
    const amount = typeof installmentAmount === 'number' ? installmentAmount : 5000;
    const updated = await db.recordSecurityDeductionInstallment(staffId, amount);
    res.json({ success: true, message: `Security deduction installment of ₹${amount} recorded`, securityDeduction: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ====================================================
// 15. 5-POINT ONLINE EXIT NOC & REFUND UNLOCK (Lecture 3)
// ====================================================
staffRouter.get('/:id/noc', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const noc = await db.getStaffExitNoc(staffId);
    res.json({ success: true, staffId, noc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

staffRouter.put('/:id/noc/checkpoint', authenticateToken, requireRole('admin', 'super_admin', 'hod', 'accounts', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const { checkpoint, cleared, remarks } = req.body;
    if (!['library', 'lab', 'accounts', 'it', 'hr'].includes(checkpoint)) {
      res.status(400).json({ success: false, error: 'Invalid checkpoint. Must be library, lab, accounts, it, or hr.' });
      return;
    }
    const actorId = req.user?.id || 'usr-admin-01';
    const updated = await db.updateStaffNocCheckpoint(staffId, checkpoint, !!cleared, remarks || '', actorId);
    res.json({ success: true, message: `Department clearance for ${checkpoint.toUpperCase()} updated`, noc: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

staffRouter.post('/:id/noc/release-refund', authenticateToken, requireRole('admin', 'super_admin', 'accounts', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const { txRef } = req.body;
    const actorId = req.user?.id || 'usr-admin-01';
    const result = await db.releaseSecurityDepositRefund(staffId, 30000, txRef || `TX-REFUND-${Date.now()}`, actorId);
    res.json({ success: true, message: 'Security deposit refund released successfully', noc: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ====================================================
// 16. STAFF ADDITIONAL ROLES (Multi-Role Support - Lecture 3)
// ====================================================
staffRouter.get('/:id/additional-roles', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = await db.getStaffAdditionalRoles(req.params.id);
    res.json({ success: true, count: roles.length, roles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const createAdditionalRoleSchema = z.object({
  school_dept_name: z.string().min(1),
  role_title: z.string().min(1),
  role_category: z.enum(['teaching', 'non_teaching', 'administrative']).default('teaching'),
  is_active: z.boolean().default(true),
});

staffRouter.post('/:id/additional-roles', authenticateToken, requireRole('super_admin', 'admin', 'hod', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parse = createAdditionalRoleSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.errors.map(e => e.message).join(', ') });
      return;
    }
    const role = await db.createStaffAdditionalRole({
      staff_id: req.params.id,
      ...parse.data,
    });
    res.status(201).json({ success: true, message: 'Additional role allocated', role });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

staffRouter.delete('/:id/additional-roles/:roleId', authenticateToken, requireRole('super_admin', 'admin', 'hod', 'hr'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.deleteStaffAdditionalRole(req.params.roleId);
    res.json({ success: true, message: 'Additional role removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

