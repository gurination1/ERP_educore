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
    if (department && typeof department === 'string' && department !== 'all') filters.department = department;
    if (status && typeof status === 'string' && status !== 'all') filters.status = status;
    if (search && typeof search === 'string') filters.search = search;

    const list = await db.getStaffList(filters);
    res.json({ success: true, count: list.length, staff: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
staffRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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
staffRouter.put('/:id/basic', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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
staffRouter.patch('/:id/login-status', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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
staffRouter.post('/:id/admin-reset-password', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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
staffRouter.post('/:id/addresses', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const addr = await db.addStaffAddress({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, address: addr });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Add bank account
staffRouter.post('/:id/bank-accounts', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const bank = await db.addStaffBankAccount({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, bankAccount: bank });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Add qualification
staffRouter.post('/:id/qualifications', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const qual = await db.addStaffQualification({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, qualification: qual });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Add certification
staffRouter.post('/:id/certifications', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const cert = await db.addStaffCertification({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, certification: cert });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Add experience
staffRouter.post('/:id/experience', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.params.id;
    const exp = await db.addStaffExperience({ ...req.body, staff_id: staffId });
    res.status(201).json({ success: true, experience: exp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Add organizational journey event (promotion, demotion, additional role, role switch)
staffRouter.post('/:id/org-journey', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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
