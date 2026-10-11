import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const paymentGatewayRouter = Router();

// ====================================================
// 1. GET ALL PAYMENT GATEWAYS FOR TENANT
// ====================================================
paymentGatewayRouter.get('/payment-gateways', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : (req.user?.tenant_id || 'ten-bfgi-01');
    const gateways = await db.getPaymentGateways(tenantId);
    res.json({ success: true, count: gateways.length, gateways });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 2. GET ACTIVE GATEWAY (With Student Test Mode Check)
// ====================================================
paymentGatewayRouter.get('/payment-gateways/active', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : (req.user?.tenant_id || 'ten-bfgi-01');
    const gateway = await db.getActivePaymentGateway(tenantId);

    if (!gateway) {
      res.json({ success: true, active_gateway: null, can_pay: false, reason: 'No payment gateway configured' });
      return;
    }

    // Karanvir Sir Rule: In Test Mode, payment button is hidden from normal students unless in test allowed UIDs!
    let can_pay = true;
    let restriction_reason = '';

    if (gateway.mode === 'test') {
      const allowedUids: string[] = JSON.parse(gateway.test_allowed_uids_json || '[]');
      const userUid = req.user?.enterprise_uid || req.user?.username || req.user?.id || '';
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

      if (!isAdmin && !allowedUids.includes(userUid) && !allowedUids.includes(req.user?.username || '')) {
        can_pay = false;
        restriction_reason = 'Payment gateway is running in Sandbox / Maintenance Mode. Online fee collection is temporarily disabled for standard student profiles.';
      }
    }

    res.json({
      success: true,
      active_gateway: {
        id: gateway.id,
        gateway_name: gateway.gateway_name,
        account_title: gateway.account_title,
        mode: gateway.mode,
        is_active: gateway.is_active,
      },
      can_pay,
      restriction_reason,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 3. CREATE PAYMENT GATEWAY
// ====================================================
const createGatewaySchema = z.object({
  tenant_id: z.string().default('ten-bfgi-01'),
  gateway_name: z.string().min(1),
  account_title: z.string().min(1),
  credentials_json: z.string().optional(),
  mode: z.enum(['live', 'test']).default('test'),
  is_active: z.boolean().default(false),
  test_allowed_uids_json: z.string().optional(),
});

paymentGatewayRouter.post('/payment-gateways', authenticateToken, requireRole('super_admin', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parse = createGatewaySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.errors.map(e => e.message).join(', ') });
      return;
    }
    const gateway = await db.createPaymentGateway(parse.data);
    res.status(201).json({ success: true, gateway });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 4. TOGGLE MODE (Live vs Test)
// ====================================================
paymentGatewayRouter.post('/payment-gateways/:id/toggle-mode', authenticateToken, requireRole('super_admin', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gateway = await db.togglePaymentGatewayMode(req.params.id);
    res.json({ success: true, message: `Payment gateway switched to ${gateway.mode.toUpperCase()} mode`, gateway });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================
// 5. ACTIVATE GATEWAY
// ====================================================
paymentGatewayRouter.post('/payment-gateways/:id/activate', authenticateToken, requireRole('super_admin', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gateway = await db.activatePaymentGateway(req.params.id, req.body.tenant_id);
    res.json({ success: true, message: `${gateway.account_title} (${gateway.gateway_name}) is now the ACTIVE payment gateway`, gateway });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
