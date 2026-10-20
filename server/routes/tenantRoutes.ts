import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, generateToken, AuthRequest } from '../middleware/auth.ts';

export const tenantRouter = Router();

// 0. List all campuses
tenantRouter.get('/campuses', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await db.getCampuses();
    res.json({ success: true, count: list.length, campuses: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 0b. Create new campus
tenantRouter.post('/campuses', authenticateToken, requireRole('super_admin', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campus = await db.addCampus(req.body);
    res.status(201).json({ success: true, message: 'Campus registered successfully', campus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. List all tenants / campuses (Super Admin & Admin)
tenantRouter.get('/', authenticateToken, requireRole('super_admin', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await db.getTenants();
    res.json({ success: true, count: list.length, tenants: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Provision new Tenant / Client (Super Admin only)
const createTenantSchema = z.object({
  client_id: z.string().min(2),
  short_code: z.string().min(2),
  client_name: z.string().min(3),
  subdomain: z.string().min(2),
  entity_type: z.enum(['school', 'college', 'department', 'university']).default('college'),
  admin_username: z.string().min(3),
  admin_email: z.string().email(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  subscription_tier: z.enum(['standard', 'premium', 'enterprise']).default('enterprise'),
});

tenantRouter.post('/', authenticateToken, requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createTenantSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    const tenant = await db.createTenant(parseResult.data as any);
    res.status(201).json({ success: true, message: 'Tenant provisioned successfully', tenant });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Toggle Tenant functional status (Super Admin only)
tenantRouter.post('/:id/toggle-functional', authenticateToken, requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_functional } = req.body;
    const updated = await db.toggleTenantFunctional(id, typeof is_functional === 'boolean' ? is_functional : true);
    res.json({ success: true, tenant: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. One-Click Direct Impersonation ("Open" button) - bypass login and return active JWT
tenantRouter.post('/:id/impersonate', authenticateToken, requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.impersonateTenant(id);
    const token = generateToken(result.adminUser);

    res.json({
      success: true,
      message: `Apex Super Admin direct impersonation into ${result.tenant.client_name} authorized.`,
      token,
      user: {
        id: result.adminUser.id,
        username: result.adminUser.username,
        email: result.adminUser.email,
        role: result.adminUser.role,
        full_name: result.adminUser.full_name,
        enterprise_uid: result.adminUser.enterprise_uid,
        department: result.adminUser.department,
        designation: result.adminUser.designation,
      },
      tenant: result.tenant,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
