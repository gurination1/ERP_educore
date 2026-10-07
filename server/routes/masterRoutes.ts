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
masterRouter.post('/departments', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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

masterRouter.put('/departments/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
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
