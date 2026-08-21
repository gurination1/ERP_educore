import { Router, Response } from 'express';
import { db, Notice } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const noticeRouter = Router();

noticeRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const notices = await db.getNotices();
  res.json({ success: true, count: notices.length, notices });
});

noticeRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, summary, content, category, is_pinned } = req.body;

  if (!title || !summary) {
    res.status(400).json({ success: false, error: 'Notice title and summary are mandatory.' });
    return;
  }

  const newNotice: Notice = {
    id: `not-${Date.now()}`,
    title,
    summary,
    content: content || summary,
    notice_date: new Date().toISOString().slice(0, 10),
    category: category || 'Academic',
    is_pinned: !!is_pinned,
  };

  await db.createNotice(newNotice);

  res.status(201).json({ success: true, message: 'Notice published successfully.', notice: newNotice });
});
