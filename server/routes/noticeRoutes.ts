import { Router, Response } from 'express';
import { db, Notice } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const noticeRouter = Router();

noticeRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const rawNotices = await db.getNotices();
  const notices = [...rawNotices].sort((a, b) => {
    const pinA = a.is_pinned ? 1 : 0;
    const pinB = b.is_pinned ? 1 : 0;
    if (pinB !== pinA) return pinB - pinA;
    return (b.notice_date || '').localeCompare(a.notice_date || '');
  });
  res.json({ success: true, count: notices.length, notices });
});
noticeRouter.post('/', authenticateToken, requireRole('admin', 'staff'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, summary, content, category, is_pinned } = req.body;
  const noticeSummary = summary || (content ? content.slice(0, 100) : null);

  if (!title || !noticeSummary) {
    res.status(400).json({ success: false, error: 'Notice title and summary are mandatory.' });
    return;
  }

  const newNotice: Notice = {
    id: `not-${Date.now()}`,
    title,
    summary: noticeSummary,
    content: content || noticeSummary,
    notice_date: new Date().toISOString().slice(0, 10),
    category: category || 'Academic',
    is_pinned: !!is_pinned,
  };

  await db.createNotice(newNotice);

  res.status(201).json({ success: true, message: 'Notice published successfully.', notice: newNotice });
});
