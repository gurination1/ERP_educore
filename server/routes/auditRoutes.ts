import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const auditRouter = Router();

// 1. Immutable Audit Logs View (Admin & Super Admin)
auditRouter.get('/audit-logs', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit, actor_role, target_type, action, search } = req.query;

  const logs = await db.getAuditLogs({
    limit: limit ? parseInt(String(limit), 10) : 100,
    actor_role: typeof actor_role === 'string' ? actor_role : undefined,
    target_type: typeof target_type === 'string' ? target_type : undefined,
    action: typeof action === 'string' ? action : undefined,
    search: typeof search === 'string' ? search : undefined,
  });

  res.json({
    success: true,
    count: logs.length,
    logs,
  });
});

// 2. Canonical Master Data (Tenant-Agnostic standard tables)
auditRouter.get('/master-data', async (req: Request, res: Response): Promise<void> => {
  const masterData = await db.getMasterData();

  res.json({
    success: true,
    universityStandard: 'PUP Patiala / MRSPTU / PU / UGC CBCS Standard',
    institutionGstCode: '03 (Punjab State Excise & GSTIN Compliant)',
    ...masterData,
  });
});

// 3. Staff Academic Journey Records
auditRouter.get('/staff/academic-journey', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const list = await db.getStaffAcademicJourney();
  res.json({
    success: true,
    count: list.length,
    academicJourneys: list,
  });
});

auditRouter.get('/staff/:id/academic-journey', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const list = await db.getStaffAcademicJourney(id);
  res.json({
    success: true,
    staffId: id,
    count: list.length,
    academicJourneys: list,
  });
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

auditRouter.post('/staff/:id/academic-journey', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
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
