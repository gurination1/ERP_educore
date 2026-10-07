import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const partnerRouter = Router();

// 1. List all corporate hiring partners
partnerRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await db.getPartners();
    res.json({ success: true, count: list.length, partners: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verified Student Talent Pool & Academic Share for Partners
partnerRouter.get('/talent-pool', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { minCgpa, department } = req.query;
    const cgpaThreshold = minCgpa ? parseFloat(String(minCgpa)) : 6.0;
    const dept = typeof department === 'string' && department !== 'all' ? department : undefined;

    const talent = await db.getVerifiedStudentTalentPool(cgpaThreshold, dept);
    res.json({
      success: true,
      count: talent.length,
      talentPool: talent,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. All active campus postings across partners
partnerRouter.get('/jobs/all', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await db.getPartnerJobPostings();
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get partner details by ID
partnerRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partner = await db.getPartnerById(req.params.id);
    if (!partner) {
      res.status(404).json({ success: false, error: 'Partner profile not found.' });
      return;
    }
    res.json({ success: true, partner });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Register new partner entity
partnerRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { partner, contact, bank } = req.body;
    if (!partner || !partner.firm_name || !partner.email || !partner.pan_number || !partner.gst_number) {
      res.status(400).json({
        success: false,
        error: 'Mandatory partner fields (firm_name, email, pan_number, gst_number) are required.',
      });
      return;
    }

    const created = await db.createPartner({ partner, contact, bank });

    await db.createAuditLog({
      actor_id: req.user?.id || 'usr-admin-01',
      actor_name: req.user?.username || 'admin',
      actor_role: req.user?.role || 'admin',
      actor_ip: req.ip,
      action: 'PARTNER_ENTITY_CREATED',
      target_type: 'partner',
      target_id: created.id,
      details: `New corporate hiring partner "${partner.firm_name}" (${partner.partner_type}) registered. PAN: ${partner.pan_number}, GST: ${partner.gst_number}.`,
      severity: 'info',
    });

    res.status(201).json({ success: true, message: 'Partner registered successfully.', partner: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Update partner entity
partnerRouter.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await db.updatePartner(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Partner not found.' });
      return;
    }
    res.json({ success: true, message: 'Partner details updated.', partner: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Post new campus job or internship
partnerRouter.post('/:id/jobs', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.params.id;
    const { title, type, stipend_salary, eligible_departments, min_cgpa, description } = req.body;
    if (!title || !stipend_salary) {
      res.status(400).json({ success: false, error: 'Job title and stipend/salary details are required.' });
      return;
    }

    const job = await db.createPartnerJobPosting({
      partner_id: partnerId,
      title,
      type: type || 'internship',
      stipend_salary,
      eligible_departments: eligible_departments || 'CSE,ECE',
      min_cgpa: min_cgpa ? parseFloat(String(min_cgpa)) : 6.0,
      description: description || 'Internship / Job opening at partner organization.',
      status: 'open',
    });

    res.status(201).json({ success: true, message: 'Job posting published.', job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Get applications for a job posting
partnerRouter.get('/jobs/:jobId/applications', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apps = await db.getPartnerApplications(req.params.jobId);
    res.json({ success: true, count: apps.length, applications: apps });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Apply for a partner job
partnerRouter.post('/jobs/:jobId/apply', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.params.jobId;
    const student = await db.getStudentByUserIdOrEmail(req.user?.id || '') || await db.getStudentByUserIdOrEmail(req.user?.email || '');
    const studentId = student?.id || req.body.student_id || 'stu-rec-aryan';
    const studentName = student ? `${student.first_name} ${student.last_name}` : (req.body.student_name || 'Aryan Sharma');
    const cgpa = student?.attendance_percentage ? (student.attendance_percentage > 85 ? 8.85 : 7.5) : (req.body.cgpa || 8.0);

    const app = await db.applyForPartnerJob({
      posting_id: jobId,
      student_id: studentId,
      student_name: studentName,
      cgpa,
      status: 'applied',
      remarks: req.body.remarks || 'Submitted campus application profile.',
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully.', application: app });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Update application status (Shortlist, Select, Reject)
partnerRouter.patch('/applications/:appId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, remarks } = req.body;
    const updated = await db.updatePartnerApplicationStatus(req.params.appId, status, remarks);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Application record not found.' });
      return;
    }
    res.json({ success: true, message: `Application status updated to ${status}.`, application: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
