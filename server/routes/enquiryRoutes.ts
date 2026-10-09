import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const enquiryRouter = Router();

// Fenced to Admissions Personnel, Academic Staff, HOD and Institutional Admins only
enquiryRouter.use(authenticateToken, requireRole('admin', 'staff', 'counselor', 'hod'));

// 1. List all pre-admission enquiries
enquiryRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, counselor_id, search } = req.query;
    const filters: { status?: string; counselor_id?: string; search?: string } = {};
    if (status && typeof status === 'string' && status !== 'all') filters.status = status;
    if (counselor_id && typeof counselor_id === 'string' && counselor_id !== 'all') filters.counselor_id = counselor_id;
    if (search && typeof search === 'string') filters.search = search;

    const list = await db.getEnquiries(filters);
    res.json({ success: true, count: list.length, enquiries: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Auto-dialer configuration settings
enquiryRouter.get('/dialer/settings', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await db.getDialerSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

enquiryRouter.post('/dialer/settings', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await db.updateDialerSettings(req.body);
    res.json({ success: true, message: 'Dialer integration settings updated.', settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Past bulk upload batches
enquiryRouter.get('/bulk/batches', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batches = await db.getBulkBatches();
    res.json({ success: true, count: batches.length, batches });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Pre-import 3-Tier Dynamic Column Validator
// Categorizes into: 'Fresh' (Ready to import), 'Probable Duplicate' (mobile/email matches), 'Wrong Data' (missing critical info)
enquiryRouter.post('/bulk/validate', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rawRows, columnMapping } = req.body;
    if (!Array.isArray(rawRows) || !columnMapping) {
      res.status(400).json({ success: false, error: 'rawRows array and columnMapping object are required.' });
      return;
    }

    const existingEnquiries = await db.getEnquiries();
    const existingMobiles = new Set(existingEnquiries.map(e => e.mobile.replace(/[^0-9]/g, '').slice(-10)));
    const existingEmails = new Set(existingEnquiries.map(e => e.email.toLowerCase().trim()));

    const freshRows: any[] = [];
    const duplicateRows: any[] = [];
    const wrongRows: any[] = [];

    const fieldMap: Record<string, string> = columnMapping; // e.g. { student_name: "Candidate Name", mobile: "Phone Number", ... }

    rawRows.forEach((row: any, idx: number) => {
      const studentName = (row[fieldMap.student_name] || '').trim();
      const rawMobile = String(row[fieldMap.mobile] || '').trim();
      const cleanMobile = rawMobile.replace(/[^0-9]/g, '');
      const rawEmail = String(row[fieldMap.email] || '').trim().toLowerCase();
      const selectedCourse = (row[fieldMap.selected_course] || 'B.Tech CSE').trim();
      const fatherName = (row[fieldMap.father_name] || 'Not Provided').trim();
      const gender = (row[fieldMap.gender] || 'prefer_not_to_say').trim();
      const courseFee = parseFloat(row[fieldMap.course_fee]) || 85000;
      const initialProb = parseFloat(row[fieldMap.admission_probability]) || 50;

      // 1. Check for Wrong Data (Missing name, invalid mobile digits < 10)
      if (!studentName || cleanMobile.length < 10) {
        wrongRows.push({
          row_index: idx + 1,
          original_data: row,
          error_reason: !studentName ? 'Missing Student / Candidate Name' : 'Invalid Mobile Number (must be at least 10 digits)',
          corrected_preview: { student_name: studentName, mobile: rawMobile, email: rawEmail, selected_course: selectedCourse },
        });
        return;
      }

      // 2. Check for Probable Duplicate in existing DB or already processed in this batch
      const isMobileDuplicate = existingMobiles.has(cleanMobile.slice(-10));
      const isEmailDuplicate = rawEmail && existingEmails.has(rawEmail);

      if (isMobileDuplicate || isEmailDuplicate) {
        duplicateRows.push({
          row_index: idx + 1,
          original_data: row,
          duplicate_field: isMobileDuplicate ? 'Mobile Number Collision' : 'Email Address Collision',
          normalized_record: {
            student_name: studentName,
            mobile: rawMobile,
            email: rawEmail,
            father_name: fatherName,
            gender,
            selected_course: selectedCourse,
            course_fee: courseFee,
            admission_probability: initialProb,
          },
        });
        return;
      }

      // 3. Fresh record
      freshRows.push({
        row_index: idx + 1,
        student_name: studentName,
        mobile: rawMobile.startsWith('+91') ? rawMobile : `+91 ${cleanMobile.slice(-10)}`,
        email: rawEmail || `enq.${cleanMobile.slice(-6)}@prospect.in`,
        father_name: fatherName,
        gender,
        selected_course: selectedCourse,
        course_fee: courseFee,
        admission_probability: initialProb,
        status: 'enquiry',
        custom_meta_json: JSON.stringify({ imported_row_index: idx + 1, raw_fields: row }),
      });
      // Register into set to prevent intra-batch duplicates
      existingMobiles.add(cleanMobile.slice(-10));
      if (rawEmail) existingEmails.add(rawEmail);
    });

    res.json({
      success: true,
      total_rows: rawRows.length,
      fresh_count: freshRows.length,
      duplicate_count: duplicateRows.length,
      wrong_count: wrongRows.length,
      freshRows,
      duplicateRows,
      wrongRows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Commit validated 'Fresh' records into the database
enquiryRouter.post('/bulk/commit', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { freshRows, source_label, filename, wrongRows, duplicateRows } = req.body;
    if (!Array.isArray(freshRows) || freshRows.length === 0) {
      res.status(400).json({ success: false, error: 'freshRows must contain at least one valid record to commit.' });
      return;
    }

    const batch = await db.createBulkBatch({
      filename: filename || 'enquiries_import.csv',
      total_rows: freshRows.length + (wrongRows?.length || 0) + (duplicateRows?.length || 0),
      fresh_count: freshRows.length,
      duplicate_count: duplicateRows?.length || 0,
      wrong_count: wrongRows?.length || 0,
      source_label: source_label || 'Campaign Bulk Import',
      uploaded_by: req.user?.username || 'counselor01',
    });

    const inserted: any[] = [];
    for (const r of freshRows) {
      const enq = await db.createEnquiry({
        student_name: r.student_name,
        gender: r.gender || 'prefer_not_to_say',
        father_name: r.father_name || 'Guardian',
        mobile: r.mobile,
        email: r.email,
        selected_course: r.selected_course || 'B.Tech CSE',
        course_fee: r.course_fee || 85000,
        admission_probability: r.admission_probability || 50,
        status: 'enquiry',
        assigned_counselor_id: req.user?.id || 'usr-counselor-01',
        assigned_counselor_name: req.user?.username || 'Counselor',
        batch_id: batch.id,
        custom_meta_json: r.custom_meta_json,
      });
      inserted.push(enq);
    }

    await db.createAuditLog({
      actor_id: req.user?.id || 'usr-counselor-01',
      actor_name: req.user?.username || 'Counselor',
      actor_role: req.user?.role || 'counselor',
      actor_ip: req.ip,
      action: 'BULK_ENQUIRIES_IMPORTED',
      target_type: 'enquiry_batch',
      target_id: batch.id,
      details: `Imported ${inserted.length} fresh leads from "${batch.filename}" (${batch.source_label}). Filtered ${batch.duplicate_count} duplicates and ${batch.wrong_count} errors.`,
      severity: 'info',
    });

    res.json({
      success: true,
      message: `Successfully imported ${inserted.length} fresh enquiries into CRM database.`,
      batch,
      insertedCount: inserted.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5.5 CRM Followup Radar KPI Statistics
enquiryRouter.get('/radar-stats', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await db.getFollowupRadarStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Get single enquiry details with stage-wise remarks tree
enquiryRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enq = await db.getEnquiryById(req.params.id);
    if (!enq) {
      res.status(404).json({ success: false, error: 'Enquiry record not found.' });
      return;
    }
    res.json({ success: true, enquiry: enq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Create single enquiry
enquiryRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_name, mobile, email, selected_course, father_name, gender, course_fee, admission_probability } = req.body;
    if (!student_name || !mobile) {
      res.status(400).json({ success: false, error: 'Candidate Name and Mobile are mandatory.' });
      return;
    }

    const created = await db.createEnquiry({
      student_name,
      mobile,
      email: email || `enq.${Date.now()}@prospect.in`,
      selected_course: selected_course || 'B.Tech CSE',
      father_name: father_name || 'Guardian',
      gender: gender || 'prefer_not_to_say',
      course_fee: course_fee || 85000,
      admission_probability: admission_probability || 60,
      status: 'enquiry',
      assigned_counselor_id: req.user?.id || 'usr-counselor-01',
      assigned_counselor_name: req.user?.username || 'Counselor',
      custom_meta_json: req.body.custom_meta_json,
    });

    res.status(201).json({ success: true, message: 'Enquiry registered successfully.', enquiry: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Update enquiry
enquiryRouter.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await db.updateEnquiry(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Enquiry not found.' });
      return;
    }
    res.json({ success: true, message: 'Enquiry updated.', enquiry: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Add stage-wise remark / call interaction
enquiryRouter.post('/:id/interactions', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enquiryId = req.params.id;
    const { stage_name, remarks, call_status, probability_updated, call_recording_url } = req.body;

    const interaction = await db.addEnquiryInteraction({
      enquiry_id: enquiryId,
      stage_name: stage_name || 'Counselor Follow-up Call',
      counselor_id: req.user?.id || 'usr-counselor-01',
      remarks: remarks || 'Detailed academic discussion completed with student.',
      call_status: call_status || 'Call Connected',
      probability_updated: probability_updated !== undefined ? Number(probability_updated) : 75,
      call_recording_url: call_recording_url || `/recordings/counselor_call_${enquiryId}_${Date.now()}.mp3`,
    });

    res.status(201).json({ success: true, message: 'Interaction recorded.', interaction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Auto-Dialer Click-to-Call Simulation
enquiryRouter.post('/:id/dial', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enq = await db.getEnquiryById(req.params.id);
    if (!enq) {
      res.status(404).json({ success: false, error: 'Enquiry record not found.' });
      return;
    }

    const dialerSettings = await db.getDialerSettings();
    if (!dialerSettings.is_enabled) {
      res.status(400).json({ success: false, error: 'Telephony Auto-Dialer is currently toggled OFF by System Administrator.' });
      return;
    }

    const mockRecordingUrl = `/recordings/simulated_telephony_${enq.enquiry_no.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.mp3`;

    res.json({
      success: true,
      message: `Telephony call connected via ${dialerSettings.provider.toUpperCase()} internet gateway to ${enq.mobile}.`,
      call_id: `call-sess-${Date.now()}`,
      provider: dialerSettings.provider,
      dialed_number: enq.mobile,
      candidate_name: enq.student_name,
      recording_enabled: true,
      simulated_recording_url: mockRecordingUrl,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Registration Fee Token Payment -> Convert Enquiry to Student in Student Master
enquiryRouter.post('/:id/convert-to-student', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enquiryId = req.params.id;
    const { amount, payment_mode, transaction_ref, course_id } = req.body;

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: 'Valid token payment amount is required to convert enquiry to regular student.' });
      return;
    }

    const result = await db.convertEnquiryToStudent(enquiryId, {
      amount: Number(amount),
      payment_mode: payment_mode || 'online_upi',
      transaction_ref: transaction_ref || `TXN-TOK-${Date.now()}`,
      course_id,
      actor_id: req.user?.id || 'usr-admin-01',
    });

    res.json({
      success: true,
      message: `Enquiry successfully converted to regular Student with canonical Course UID ${result.student.student_id}!`,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
