import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DynamicFormItem, DynamicFormFieldDef, User } from '../types';

interface DynamicFormBuilderViewProps {
  currentUser: User | null;
}

export const DynamicFormBuilderView: React.FC<DynamicFormBuilderViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';
  const [forms, setForms] = useState<DynamicFormItem[]>([]);
  const [selectedForm, setSelectedForm] = useState<DynamicFormItem | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(!isAdmin);

  // Admin New Form State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFields, setNewFields] = useState<DynamicFormFieldDef[]>([
    { name: 'student_club', label: 'College Club / Society Preference', type: 'select', required: true, options: ['Robotics & AI', 'Coding Club', 'Drama & Arts', 'Sports Club'] },
    { name: 'prior_experience', label: 'Prior Leadership / Project Experience', type: 'textarea', required: false, placeholder: 'Briefly describe any past experience...' },
  ]);

  const loadForms = async () => {
    const res = await api.getForms();
    if (res.success && res.forms) {
      setForms(res.forms);
      if (res.forms.length > 0 && !selectedForm) {
        setSelectedForm(res.forms[0]);
      }
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (selectedForm && isAdmin) {
      api.getFormSubmissions(selectedForm.id).then(res => {
        if (res.success && res.submissions) {
          setSubmissions(res.submissions);
        } else {
          setSubmissions([]);
        }
      });
    }
  }, [selectedForm, isAdmin]);

  const handleAddField = () => {
    setNewFields(prev => [
      ...prev,
      {
        name: `field_${Date.now()}`,
        label: 'New Form Field Question',
        type: 'text',
        required: true,
        placeholder: 'Enter response...',
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setNewFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDynamicForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || newFields.length === 0) return;

    try {
      const res = await api.createForm({
        title: newTitle,
        form_code: newCode || `FORM-${Date.now().toString().slice(-4)}`,
        description: newDescription,
        schema_json: newFields,
      });

      if (res.success) {
        setIsCreatingNew(false);
        setNewTitle('');
        setNewDescription('');
        loadForms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitStudentResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    setValidationErrors([]);
    setSubmissionSuccess(null);

    try {
      const res = await api.submitFormResponse(selectedForm.id, formResponses, currentUser?.id);
      if (res.success) {
        setSubmissionSuccess(`Your response for "${selectedForm.title}" has been recorded.`);
        setFormResponses({});
      } else {
        setValidationErrors(res.details || [res.error || 'Validation failed']);
      }
    } catch (err: any) {
      setValidationErrors([err.message || 'Submission error']);
    }
  };

  return (
    <div id="dynamic-forms-screen" className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1d] tracking-tight">
            {isAdmin ? 'Dynamic Form Builder & Schema Engine' : 'Institutional Dynamic Forms'}
          </h2>
          <p className="text-sm text-[#444651] mt-1">
            {isAdmin
              ? 'Create, configure, and publish custom schema forms for student registrations and approvals.'
              : 'Fill and submit department clearance, hostel allotment, and internship verification forms.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCreatingNew ? 'close' : 'add'}
            </span>
            <span>{isCreatingNew ? 'Cancel Builder' : 'Create New Form Schema'}</span>
          </button>
        )}
      </div>

      {/* Admin Creator Interface */}
      {isAdmin && isCreatingNew && (
        <div className="bg-white rounded-xl p-6 border-2 border-[#00236f] shadow-lg space-y-5 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-3">
            <h3 className="text-base font-bold text-[#191c1d]">Custom Form Definition Builder</h3>
            <span className="text-xs font-bold text-[#00236f] bg-[#dce1ff] px-2.5 py-1 rounded">
              Schema Mode
            </span>
          </div>

          <form onSubmit={handleSaveDynamicForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">Form Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual Sports Meet Registration"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">Form Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  placeholder="e.g. FORM-SPORTS-2025"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Instructions for students filling this form..."
                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs"
              />
            </div>

            {/* Dynamic Fields List */}
            <div className="space-y-3 pt-3 border-t border-[#f3f4f5]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#191c1d] uppercase tracking-wider">
                  Configured Form Fields ({newFields.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-3 py-1 bg-[#86f2e4]/30 text-[#006a61] hover:bg-[#86f2e4]/50 rounded text-xs font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add Field</span>
                </button>
              </div>

              {newFields.map((field, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#f8f9fa] rounded-lg border border-[#e1e3e4] flex items-center gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>

                  <input
                    type="text"
                    value={field.label}
                    onChange={e => {
                      const updated = [...newFields];
                      updated[idx].label = e.target.value;
                      updated[idx].name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                      setNewFields(updated);
                    }}
                    placeholder="Field Label / Question"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-[#e1e3e4] rounded text-xs"
                  />

                  <select
                    value={field.type}
                    onChange={e => {
                      const updated = [...newFields];
                      updated[idx].type = e.target.value as any;
                      setNewFields(updated);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-[#e1e3e4] rounded text-xs"
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Dropdown Select</option>
                  </select>

                  <label className="flex items-center gap-1 text-xs text-[#444651]">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => {
                        const updated = [...newFields];
                        updated[idx].required = e.target.checked;
                        setNewFields(updated);
                      }}
                    />
                    <span>Required</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    className="text-[#ba1a1a] hover:text-[#900000] p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 border border-[#e1e3e4] rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold"
              >
                Publish Dynamic Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Form List + Interactive Responder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Forms Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#757682]">
            Available Dynamic Forms
          </h3>
          <div className="space-y-2.5">
            {forms.map(form => {
              const isSelected = selectedForm?.id === form.id;
              return (
                <div
                  key={form.id}
                  onClick={() => {
                    setSelectedForm(form);
                    setFormResponses({});
                    setSubmissionSuccess(null);
                    setValidationErrors([]);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#00236f] shadow-md ring-2 ring-[#00236f]/10'
                      : 'bg-white border-[#e1e3e4] hover:border-[#00236f]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#dce1ff] text-[#00236f] rounded text-[10px] font-bold">
                      {form.form_code}
                    </span>
                    <span className="text-[10px] text-[#757682]">
                      {form.schema_json?.length || 0} fields
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#191c1d] mt-2">{form.title}</h4>
                  <p className="text-xs text-[#757682] mt-1 line-clamp-2">{form.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Responder / Renderer (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl p-8 border border-[#e1e3e4] shadow-xs space-y-6">
          {selectedForm ? (
            <div>
              <div className="border-b border-[#f3f4f5] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#86f2e4]/30 text-[#006a61] rounded text-xs font-bold">
                      {selectedForm.form_code}
                    </span>
                    <h3 className="text-lg font-bold text-[#191c1d]">{selectedForm.title}</h3>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="px-3 py-1.5 bg-[#f3f4f5] hover:bg-[#e1e3e4] text-[#191c1d] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {previewMode ? 'format_list_bulleted' : 'edit_note'}
                      </span>
                      <span>{previewMode ? 'View Submissions' : 'Preview Student Form'}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#757682] mt-1">{selectedForm.description}</p>
              </div>

              {submissionSuccess && (
                <div className="mt-4 p-3.5 bg-[#86f2e4]/30 border border-[#86f2e4] text-[#006a61] rounded-xl text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{submissionSuccess}</span>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="mt-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-xl text-xs space-y-1">
                  {validationErrors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              {/* If Admin and not in preview mode: show real student submissions */}
              {isAdmin && !previewMode ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#191c1d]">Student Submissions & Responses</h4>
                      <p className="text-xs text-[#757682]">Real-time audit of submitted student survey entries</p>
                    </div>
                    <span className="px-3 py-1 bg-[#dce1ff] text-[#00236f] rounded-full text-xs font-bold">
                      {submissions.length} Total Submissions
                    </span>
                  </div>

                  {submissions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#757682] bg-[#f8f9fa] rounded-xl border border-dashed border-[#e1e3e4]">
                      No student responses recorded yet for this dynamic form.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[#e1e3e4] rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[11px] font-bold text-[#757682] uppercase">
                            <th className="py-2.5 px-3">Student Submitter</th>
                            <th className="py-2.5 px-3">Submitted At</th>
                            <th className="py-2.5 px-3">Form Answers</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f5]">
                          {submissions.map((sub, sIdx) => (
                            <tr key={sub.id || sIdx} className="hover:bg-[#f8f9fa]">
                              <td className="py-3 px-3">
                                <div className="font-bold text-[#191c1d]">{sub.userName}</div>
                                <div className="text-[10px] text-[#757682]">{sub.userEmail}</div>
                              </td>
                              <td className="py-3 px-3 text-[#757682]">
                                {new Date(sub.submitted_at).toLocaleString('en-IN', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </td>
                              <td className="py-3 px-3">
                                <div className="space-y-1">
                                  {Object.entries(sub.response_json || {}).map(([k, v]) => (
                                    <div key={k} className="text-[11px]">
                                      <span className="font-semibold text-[#444651]">{k}:</span>{' '}
                                      <span className="text-[#00236f] font-medium">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Dynamic JSON Schema Render Form */
                <form onSubmit={handleSubmitStudentResponse} className="mt-6 space-y-4 text-xs">
                  {selectedForm.schema_json?.map((field, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <label className="block font-bold text-[#191c1d]">
                        {field.label}{' '}
                        {field.required && <span className="text-[#ba1a1a]">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          required={field.required}
                          value={formResponses[field.name] || ''}
                          onChange={e =>
                            setFormResponses(prev => ({ ...prev, [field.name]: e.target.value }))
                          }
                          placeholder={field.placeholder || ''}
                          className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={formResponses[field.name] || ''}
                          onChange={e =>
                            setFormResponses(prev => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                        >
                          <option value="">Select option...</option>
                          {field.options?.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          required={field.required}
                          value={formResponses[field.name] || ''}
                          onChange={e =>
                            setFormResponses(prev => ({ ...prev, [field.name]: e.target.value }))
                          }
                          placeholder={field.placeholder || ''}
                          className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-4 border-t border-[#f3f4f5] flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Submit Form Response</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <p className="text-center text-[#757682] py-12">
              Select a form from the left list to view or submit responses.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
