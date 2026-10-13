import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const documentRouter = Router();

// 1. GET /api/documents - List documents with optional filters
documentRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = typeof req.query.owner_id === 'string' ? req.query.owner_id : undefined;
    const ownerRole = typeof req.query.owner_role === 'string' ? req.query.owner_role : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    // Student role can only access their own documents
    let effectiveOwnerId = ownerId;
    if (req.user?.role === 'student') {
      effectiveOwnerId = req.user.id;
    }

    const documents = await db.getDocuments({
      owner_id: effectiveOwnerId,
      owner_role: ownerRole,
      status,
    });

    res.json({ success: true, count: documents.length, documents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/documents/upload - Upload a new document record
const uploadDocumentSchema = z.object({
  doc_type_code: z.string().min(1),
  title: z.string().min(1),
  owner_id: z.string().optional(),
  owner_name: z.string().optional(),
  owner_role: z.string().optional(),
  file_name: z.string().min(1),
  file_size_kb: z.number().optional(),
  mime_type: z.string().optional(),
  remarks: z.string().optional(),
  sha256_hash: z.string().optional(),
});

documentRouter.post('/upload', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = uploadDocumentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    const data = parseResult.data;
    const owner_id = data.owner_id || req.user?.id || 'usr-stu-aryan';
    const owner_name = data.owner_name || req.user?.full_name || 'Scholar / Employee';
    const owner_role = data.owner_role || req.user?.role || 'student';

    const document = await db.createDocument({
      ...data,
      owner_id,
      owner_name,
      owner_role,
    });

    res.status(201).json({ success: true, document });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. PATCH /api/documents/:id/verify - Verify or reject document (Staff / Admin / Registrar)
const verifyDocumentSchema = z.object({
  status: z.enum(['verified', 'rejected', 'pending', 'reupload_required']),
  remarks: z.string().optional(),
  verified_by: z.string().optional(),
});

documentRouter.patch(
  '/:id/verify',
  authenticateToken,
  requireRole('admin', 'super_admin', 'staff', 'hod', 'counselor', 'accounts', 'hr'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parseResult = verifyDocumentSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
        res.status(400).json({ success: false, error: errorMsg });
        return;
      }

      const { status, remarks } = parseResult.data;
      const verified_by = parseResult.data.verified_by || req.user?.full_name || 'Authorized Officer';

      const document = await db.verifyDocument(id, {
        status: status as any,
        remarks,
        verified_by,
      });

      res.json({
        success: true,
        message: `Document ${document.title} status updated to ${status}.`,
        document,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);
