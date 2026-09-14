import { Router, Response } from 'express';
import { z } from 'zod';
import { db, DynamicForm, FormSubmission } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.ts';

export const formRouter = Router();

const submitFormSchema = z.object({
  responses: z.record(z.any(), { required_error: 'Form responses object is required' }),
  userId: z.string().optional(),
});

// List all active dynamic forms (Authenticated users)
formRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const forms = await db.getDynamicForms();
  const publishedForms = forms.filter(f => f.is_published);
  res.json({ success: true, count: publishedForms.length, forms: publishedForms });
});

// Get dynamic form by ID with schema (Authenticated users)
formRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const form = await db.getDynamicFormById(id) || (await db.getDynamicForms()).find(f => f.form_code === id);

  if (!form) {
    res.status(404).json({ success: false, error: 'Dynamic form definition not found.' });
    return;
  }

  const subs = await db.getFormSubmissions(form.id);
  const submissionsCount = subs.length;

  res.json({
    success: true,
    form,
    submissionsCount,
  });
});

// Admin: Create new dynamic form schema
formRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, form_code, schema_json, fields } = req.body;
  const rawFields = schema_json || fields;

  if (!title || !rawFields || !Array.isArray(rawFields) || rawFields.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Form title and a non-empty schema array of fields are required.',
    });
    return;
  }

  const normalizedSchema = rawFields.map((f: any) => ({
    name: f.name || f.id,
    label: f.label || f.name || f.id,
    type: f.type || 'text',
    required: Boolean(f.required),
    options: f.options || [],
    placeholder: f.placeholder || '',
  }));

  const newForm: DynamicForm = {
    id: `df-${Date.now()}`,
    form_code: form_code || `FORM-${Date.now().toString().slice(-4)}`,
    title,
    description: description || '',
    schema_json: normalizedSchema,
    is_published: true,
    created_by: req.user?.id,
    created_at: new Date().toISOString(),
  };

  await db.createDynamicForm(newForm);

  res.status(201).json({
    success: true,
    message: 'Dynamic Form published successfully.',
    form: newForm,
  });
});

// Student: Submit dynamic form response (Authenticated, Zod validated)
formRouter.post('/:id/submit', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const parseResult = submitFormSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
    res.status(400).json({ success: false, error: errorMsg });
    return;
  }

  const { responses } = parseResult.data;

  const form = await db.getDynamicFormById(id) || (await db.getDynamicForms()).find(f => f.form_code === id);
  if (!form) {
    res.status(404).json({ success: false, error: 'Form not found.' });
    return;
  }

  // Gate: form must be published
  if (!form.is_published) {
    res.status(403).json({ success: false, error: 'This form is currently closed and not accepting submissions.' });
    return;
  }

  // Duplicate submission guard for student
  const existingSubmissions = await db.getFormSubmissions(form.id);
  const alreadySubmitted = existingSubmissions.find(s => s.user_id === req.user!.id);
  if (alreadySubmitted) {
    res.status(409).json({ success: false, error: 'You have already submitted this form. Duplicate submissions are not permitted.' });
    return;
  }

  // Validate required fields in form schema
  const validationErrors: string[] = [];
  for (const field of form.schema_json) {
    const val = responses[field.name];
    if (field.required && (val === undefined || val === null || val === '')) {
      validationErrors.push(`Field '${field.label || field.name}' is mandatory.`);
    }
  }

  if (validationErrors.length > 0) {
    res.status(422).json({
      success: false,
      error: 'Validation failed on submitted form fields.',
      details: validationErrors,
    });
    return;
  }

  const submission: FormSubmission = {
    id: `fsub-${Date.now()}`,
    form_id: form.id,
    user_id: req.user!.id,
    response_json: responses,
    submitted_at: new Date().toISOString(),
  };

  await db.createFormSubmission(submission);

  res.status(201).json({
    success: true,
    message: `Your submission for '${form.title}' was verified and recorded successfully.`,
    submissionId: submission.id,
    submission,
  });
});

// Admin: Toggle publish status of dynamic form
formRouter.patch('/:id/publish', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_published } = req.body;
  const form = await db.getDynamicFormById(id) || (await db.getDynamicForms()).find(f => f.form_code === id);
  if (!form) {
    res.status(404).json({ success: false, error: 'Form not found.' });
    return;
  }
  const updated = await db.updateDynamicForm(form.id, { is_published: Boolean(is_published) });
  res.json({ success: true, message: `Form publication status updated to ${is_published}.`, form: updated });
});

// Admin: View submissions for a form
formRouter.get('/:id/submissions', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const form = await db.getDynamicFormById(id) || (await db.getDynamicForms()).find(f => f.form_code === id);

  if (!form) {
    res.status(404).json({ success: false, error: 'Form not found.' });
    return;
  }

  const rawSubmissions = await db.getFormSubmissions(form.id);
  const submissions = [];
  for (const s of rawSubmissions) {
    const user = await db.findUserById(s.user_id);
    submissions.push({
      ...s,
      userName: user?.full_name || 'Student Submitter',
      userEmail: user?.email,
    });
  }

  res.json({
    success: true,
    formTitle: form.title,
    count: submissions.length,
    submissions,
  });
});
