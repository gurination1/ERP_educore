import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const masterRouter = Router();

// 1. Get all enterprise master configurations
masterRouter.get('/enterprise', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await db.getMasterDepartments();
    const institutionTypes = await db.getMasterInstitutionTypes();
    const employeeStatuses = await db.getMasterEmployeeStatuses();
    const designationChanges = await db.getMasterDesignationChanges();
    const erpStatuses = await db.getMasterERPStatuses();

    res.json({
      success: true,
      master: {
        departments,
        institutionTypes,
        employeeStatuses,
        designationChanges,
        erpStatuses,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Add or update department in Department Master
masterRouter.post('/departments', authenticateToken, requireRole('admin', 'super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dept_code, dept_name, tags, head_of_dept, established_year } = req.body;
    if (!dept_code || !dept_name) {
      res.status(400).json({ success: false, error: 'dept_code and dept_name are required.' });
      return;
    }

    const created = await db.addMasterDepartment({
      dept_code,
      dept_name,
      tags_json: JSON.stringify(tags || ['Engineering']),
      head_of_dept: head_of_dept || '',
      established_year: established_year || 2020,
      is_active: true,
    });

    res.status(201).json({ success: true, message: 'Department master record created.', department: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

masterRouter.put('/departments/:id', authenticateToken, requireRole('admin', 'super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await db.updateMasterDepartment(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Department master entry not found.' });
      return;
    }
    res.json({ success: true, message: 'Department updated.', department: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get all canonical master data
masterRouter.get('/all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await db.getMasterData();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Add State to GST State Master
masterRouter.post('/states', authenticateToken, requireRole('admin', 'super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gst_code, state_name, state_short_code, is_union_territory } = req.body;
    if (!gst_code || !state_name) {
      res.status(400).json({ success: false, error: 'gst_code and state_name are required.' });
      return;
    }
    const state = await db.addMasterState({
      gst_code,
      state_name,
      state_short_code: (state_short_code || gst_code).toUpperCase(),
      is_union_territory: Boolean(is_union_territory),
    });
    res.status(201).json({ success: true, message: 'GST state master created.', state });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Add Degree to Master Degrees
masterRouter.post('/degrees', authenticateToken, requireRole('admin', 'super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { degree_code, degree_name, level, duration_years, total_semesters, statutory_body } = req.body;
    if (!degree_code || !degree_name) {
      res.status(400).json({ success: false, error: 'degree_code and degree_name are required.' });
      return;
    }
    const degree = await db.addMasterDegree({
      degree_code,
      degree_name,
      level: level || 'undergraduate',
      duration_years: Number(duration_years) || 4,
      total_semesters: Number(total_semesters) || 8,
      statutory_body: statutory_body || 'AICTE',
    });
    res.status(201).json({ success: true, message: 'Degree master created.', degree });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Add Institution Type
masterRouter.post('/institution-types', authenticateToken, requireRole('admin', 'super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, name, regulatory_authority, description } = req.body;
    if (!code || !name) {
      res.status(400).json({ success: false, error: 'code and name are required.' });
      return;
    }
    const inst = await db.addMasterInstitutionType({
      code,
      name,
      regulatory_authority: regulatory_authority || 'AICTE / UGC',
      description: description || '',
    });
    res.status(201).json({ success: true, message: 'Institution type master created.', institutionType: inst });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Add Employee Status
masterRouter.post('/employee-statuses', authenticateToken, requireRole('admin', 'super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status_code, status_name, description, requires_dates } = req.body;
    if (!status_code || !status_name) {
      res.status(400).json({ success: false, error: 'status_code and status_name are required.' });
      return;
    }
    const empStatus = await db.addMasterEmployeeStatus({
      status_code: status_code.toUpperCase(),
      status_name,
      description: description || '',
      requires_dates: Boolean(requires_dates),
    });
    res.status(201).json({ success: true, message: 'Employee status master created.', employeeStatus: empStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
