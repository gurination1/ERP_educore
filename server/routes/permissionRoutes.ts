import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const permissionRouter = Router();

// ====================================================
// 1. GET FIELD PERMISSIONS MATRIX
// ====================================================
permissionRouter.get('/fields', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entityType = req.query.entityType as ('student' | 'staff' | undefined);
    const permissions = await db.getFieldPermissions(entityType);
    res.json({ success: true, count: permissions.length, permissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 2. UPDATE FIELD PERMISSION RULE
// ====================================================
const updateFieldPermissionSchema = z.object({
  admin_edit: z.boolean().optional(),
  staff_view: z.boolean().optional(),
  staff_edit: z.boolean().optional(),
  student_view: z.boolean().optional(),
  student_edit: z.boolean().optional(),
});

permissionRouter.put('/fields/:id', authenticateToken, requireRole('super_admin', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parse = updateFieldPermissionSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.errors.map(e => e.message).join(', ') });
      return;
    }
    const updated = await db.updateFieldPermission(req.params.id, parse.data);
    res.json({ success: true, message: 'Field permission rule updated successfully', permission: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
