// EduCore College Management ERP API Client

const TOKEN_KEY = 'educore_jwt_token';
const USER_KEY = 'educore_user_data';

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): any => {
  const data = localStorage.getItem(USER_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user: any): void => localStorage.setItem(USER_KEY, JSON.stringify(user));

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP Error ${res.status}: ${res.statusText}`,
        ...data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed. Ensure server is running.',
    };
  }
}

export const api = {
  // Auth (Real credentials only, no demo bypasses)
  login: (credentials: { username: string; password: string; role?: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/api/auth/me'),
  forgotPassword: (email: string) =>
    apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: { email: string; newPassword: string; resetToken?: string }) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Students & Dashboard
  getStudents: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/students?${query}`);
  },
  getStudentDashboard: (studentId: string) => apiRequest(`/api/students/${studentId}/dashboard`),
  getStudentProfile: (studentId: string) => apiRequest(`/api/students/${studentId}`),
  updateStudentAttendance: (studentId: string, data: { attendedClasses?: number; totalClasses?: number; attendancePercentage?: number }) =>
    apiRequest(`/api/students/${studentId}/attendance`, { method: 'PATCH', body: JSON.stringify(data) }),
  bulkUpdateAttendance: (data: {
    courseCode?: string;
    lectureDate?: string;
    lectureSlot?: string;
    topic?: string;
    updates: Array<{
      studentId: string;
      status?: 'P' | 'A' | 'M';
      attendedClasses?: number;
      totalClasses?: number;
      attendancePercentage?: number;
    }>;
  }) => apiRequest('/api/students/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  condoneAttendance: (studentId: string, data: { orderNo?: string; reason?: string }) =>
    apiRequest(`/api/students/${studentId}/condone-attendance`, { method: 'POST', body: JSON.stringify(data) }),
  promoteStudent: (studentId: string) =>
    apiRequest(`/api/students/${studentId}/promote`, { method: 'POST' }),
  sendEmailReminders: () => apiRequest('/api/students/send-email-reminders', { method: 'POST' }),

  // Admissions
  saveAdmissionDraft: (data: any) =>
    apiRequest('/api/admissions/draft', { method: 'POST', body: JSON.stringify(data) }),
  saveProgressiveIntake: (data: any) =>
    apiRequest('/api/admissions/progressive-intake', { method: 'POST', body: JSON.stringify(data) }),
  submitAdmission: (data: any) =>
    apiRequest('/api/admissions/submit', { method: 'POST', body: JSON.stringify(data) }),
  adminAdmitStudent: (data: any) =>
    apiRequest('/api/admissions/admin-admit', { method: 'POST', body: JSON.stringify(data) }),
  getAdmissions: (status?: string) => apiRequest(`/api/admissions?status=${status || 'all'}`),
  updateAdmissionStatus: (id: string, status: string, remarks?: string) =>
    apiRequest(`/api/admissions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, remarks }) }),
  getFollowupRadar: (params?: { counselor_id?: string; priority?: string; timeframe?: string; search?: string }) => {
    const query = new URLSearchParams((params as any) || {}).toString();
    return apiRequest(`/api/admissions/followups${query ? `?${query}` : ''}`);
  },
  logFollowup: (studentId: string, data: {
    interaction_type: string;
    outcome: string;
    notes: string;
    next_followup_date?: string;
    priority?: string;
  }) => apiRequest(`/api/admissions/${studentId}/followups`, { method: 'POST', body: JSON.stringify(data) }),
  getStudentFollowups: (studentId: string) => apiRequest(`/api/admissions/${studentId}/followups`),
  sendRecallNotice: (studentId: string) =>
    apiRequest(`/api/admissions/${studentId}/quick-ping`, { method: 'POST' }),

  // Fees
  getFeeHeads: () => apiRequest('/api/fees/heads'),
  assignFeeHead: (data: { studentId: string; feeHeadId: string; amount: number; dueDate?: string; semester?: number }) =>
    apiRequest('/api/fees/assign', { method: 'POST', body: JSON.stringify(data) }),
  getFeeKPIs: () => apiRequest('/api/fees/kpi'),
  getFeeTrend: () => apiRequest('/api/fees/trend'),
  getDefaulters: () => apiRequest('/api/fees/defaulters'),
  getFeeLedger: (studentId: string) => apiRequest(`/api/fees/ledger/${studentId}`),
  payFee: (paymentData: {
    studentId: string;
    amount: number;
    paymentMode?: string;
    studentFeeId?: string;
    selectedFeeHeadIds?: string[];
    feeAllocations?: { studentFeeId: string; amount: number }[];
    notes?: string;
  }) =>
    apiRequest('/api/fees/collect', { method: 'POST', body: JSON.stringify(paymentData) }),
  getReceipt: (receiptIdOrNo: string) => apiRequest(`/api/fees/receipt/${receiptIdOrNo}`),

  // Scholarships
  getScholarshipSchemes: () => apiRequest('/api/scholarships/schemes'),
  createScholarshipScheme: (schemeData: any) =>
    apiRequest('/api/scholarships/schemes', { method: 'POST', body: JSON.stringify(schemeData) }),
  applyScholarship: (data: any) =>
    apiRequest('/api/scholarships/apply', { method: 'POST', body: JSON.stringify(data) }),
  getScholarshipApplications: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/scholarships/applications?${query}`);
  },
  reviewScholarship: (id: string, status: string, remarks?: string) =>
    apiRequest(`/api/scholarships/applications/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status, remarks }) }),
  awardScholarship: (data: { studentId: string; schemeId: string; amount?: number; remarks?: string }) =>
    apiRequest('/api/scholarships/award', { method: 'POST', body: JSON.stringify(data) }),

  // Dynamic Forms
  getForms: () => apiRequest('/api/forms'),
  getForm: (id: string) => apiRequest(`/api/forms/${id}`),
  createForm: (formData: any) =>
    apiRequest('/api/forms', { method: 'POST', body: JSON.stringify(formData) }),
  submitFormResponse: (id: string, responses: any, userId?: string) =>
    apiRequest(`/api/forms/${id}/submit`, { method: 'POST', body: JSON.stringify({ responses, userId }) }),
  getFormSubmissions: (id: string) => apiRequest(`/api/forms/${id}/submissions`),

  // Notices
  getNotices: () => apiRequest('/api/notices'),

  // AI Suite (Gemini Infused)
  getAIStatus: () => apiRequest('/api/ai/status'),
  parseAdmissionAI: (text: string) =>
    apiRequest('/api/ai/parse-admission', { method: 'POST', body: JSON.stringify({ text }) }),
  recommendFeeAI: (studentData: any, courseId?: string) =>
    apiRequest('/api/ai/recommend-fee', { method: 'POST', body: JSON.stringify({ studentData, courseId }) }),
  generateFeeNoticeAI: (studentId: string, urgency?: string) =>
    apiRequest('/api/ai/fee-notice', { method: 'POST', body: JSON.stringify({ studentId, urgency }) }),
  askCopilotAI: (query: string) =>
    apiRequest('/api/ai/copilot', { method: 'POST', body: JSON.stringify({ query }) }),

  // UGC Grievance Redressal Cell
  getGrievances: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/grievances?${query}`);
  },
  getGrievanceById: (id: string) => apiRequest(`/api/grievances/${id}`),
  submitGrievance: (data: { category: string; subject: string; description: string; priority?: string; studentId?: string }) =>
    apiRequest('/api/grievances', { method: 'POST', body: JSON.stringify(data) }),
  resolveGrievance: (id: string, status: string, adminRemarks: string) =>
    apiRequest(`/api/grievances/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ status, adminRemarks }) }),

  // Health
  getHealth: () => apiRequest('/api/health'),

  // MRSPTU Examination Admit Card
  getAdmitCard: (id: string = 'me') => apiRequest(`/api/students/${id}/admit-card`),

  // Analytical Reports
  getAdmissionsByCourseReport: () => apiRequest('/api/reports/admissions-by-course'),

  // Admin Extreme Powers: User & Staff Role Management
  getUsers: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/users?${query}`);
  },
  createUser: (userData: any) =>
    apiRequest('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id: string, updates: any) =>
    apiRequest(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  updateUserStatus: (id: string, isActive: boolean) =>
    apiRequest(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  resetUserPassword: (id: string, newPassword?: string) =>
    apiRequest(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  deleteUser: (id: string) =>
    apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
  overrideUser: (id: string, updates: any) =>
    apiRequest(`/api/users/${id}/override`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Immutable Audit Logs & Master Tables
  getAuditLogs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/audit-logs?${query}`);
  },
  getMasterData: () => apiRequest('/api/master-data'),
  getStaffAcademicJourney: (staffId?: string) =>
    apiRequest(staffId ? `/api/staff/${staffId}/academic-journey` : '/api/staff/academic-journey'),
  addStaffAcademicJourney: (staffId: string, data: any) =>
    apiRequest(`/api/staff/${staffId}/academic-journey`, { method: 'POST', body: JSON.stringify(data) }),

  // Password Recovery Matrix (Email, SMS OTP TRAI DLT, WhatsApp Verified OTP, Admin ticket)
  getForgotPasswordPolicy: () => apiRequest('/api/auth/forgot-password/policy'),
  requestSmsOtp: (identifier: string) =>
    apiRequest('/api/auth/forgot-password/sms-otp', { method: 'POST', body: JSON.stringify({ identifier }) }),
  verifySmsOtp: (data: { otpSessionToken: string; otp: string; newPassword: string }) =>
    apiRequest('/api/auth/verify-sms-otp', { method: 'POST', body: JSON.stringify(data) }),
  requestWhatsAppOtp: (identifier: string) =>
    apiRequest('/api/auth/forgot-password/whatsapp-otp', { method: 'POST', body: JSON.stringify({ identifier }) }),
  requestAdminPasswordTicket: (identifier: string, remarks?: string) =>
    apiRequest('/api/auth/forgot-password/admin-request', { method: 'POST', body: JSON.stringify({ identifier, remarks }) }),
  forceChangePassword: (newPassword: string) =>
    apiRequest('/api/auth/force-change-password', { method: 'POST', body: JSON.stringify({ newPassword }) }),

  // Enterprise Multi-Table Staff Management & Org Journey
  getStaff: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/staff?${query}`);
  },
  getStaffProfile: (staffId: string) => apiRequest(`/api/staff/${staffId}`),
  createStaff: (payload: any) =>
    apiRequest('/api/staff', { method: 'POST', body: JSON.stringify(payload) }),
  updateStaffBasic: (staffId: string, updates: any) =>
    apiRequest(`/api/staff/${staffId}/basic`, { method: 'PUT', body: JSON.stringify(updates) }),
  toggleStaffLogin: (staffId: string, enabled: boolean) =>
    apiRequest(`/api/staff/${staffId}/login-status`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  adminResetStaffPassword: (staffId: string, tempPassword?: string) =>
    apiRequest(`/api/staff/${staffId}/admin-reset-password`, { method: 'POST', body: JSON.stringify({ tempPassword }) }),
  addStaffAddress: (staffId: string, data: any) =>
    apiRequest(`/api/staff/${staffId}/addresses`, { method: 'POST', body: JSON.stringify(data) }),
  addStaffBank: (staffId: string, data: any) =>
    apiRequest(`/api/staff/${staffId}/bank-accounts`, { method: 'POST', body: JSON.stringify(data) }),
  addStaffQualification: (staffId: string, data: any) =>
    apiRequest(`/api/staff/${staffId}/qualifications`, { method: 'POST', body: JSON.stringify(data) }),
  addStaffCertification: (staffId: string, data: any) =>
    apiRequest(`/api/staff/${staffId}/certifications`, { method: 'POST', body: JSON.stringify(data) }),
  addStaffExperience: (staffId: string, data: any) =>
    apiRequest(`/api/staff/${staffId}/experience`, { method: 'POST', body: JSON.stringify(data) }),
  addStaffOrgJourney: (staffId: string, data: any) =>
    apiRequest(`/api/staff/${staffId}/org-journey`, { method: 'POST', body: JSON.stringify(data) }),

  // Corporate Partner Portal & Student Talent Pool
  getPartners: () => apiRequest('/api/partners'),
  getPartner: (id: string) => apiRequest(`/api/partners/${id}`),
  createPartner: (payload: any) =>
    apiRequest('/api/partners', { method: 'POST', body: JSON.stringify(payload) }),
  updatePartner: (id: string, updates: any) =>
    apiRequest(`/api/partners/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  getPartnerJobs: () => apiRequest('/api/partners/jobs/all'),
  createPartnerJob: (partnerId: string, jobData: any) =>
    apiRequest(`/api/partners/${partnerId}/jobs`, { method: 'POST', body: JSON.stringify(jobData) }),
  getPartnerApplications: (jobId: string) =>
    apiRequest(`/api/partners/jobs/${jobId}/applications`),
  applyPartnerJob: (jobId: string, data: any) =>
    apiRequest(`/api/partners/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify(data) }),
  updatePartnerApplication: (appId: string, status: string, remarks?: string) =>
    apiRequest(`/api/partners/applications/${appId}`, { method: 'PATCH', body: JSON.stringify({ status, remarks }) }),
  getTalentPool: (minCgpa?: number, department?: string) => {
    const params = new URLSearchParams();
    if (minCgpa) params.append('minCgpa', String(minCgpa));
    if (department) params.append('department', department);
    return apiRequest(`/api/partners/talent-pool?${params.toString()}`);
  },

  // Pre-Admission CRM, Auto-Dialer & Bulk Column Importer
  getEnquiries: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/enquiries?${query}`);
  },
  getEnquiry: (id: string) => apiRequest(`/api/enquiries/${id}`),
  createEnquiry: (data: any) =>
    apiRequest('/api/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateEnquiry: (id: string, data: any) =>
    apiRequest(`/api/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addEnquiryInteraction: (id: string, data: any) =>
    apiRequest(`/api/enquiries/${id}/interactions`, { method: 'POST', body: JSON.stringify(data) }),
  dialEnquiry: (id: string) =>
    apiRequest(`/api/enquiries/${id}/dial`, { method: 'POST' }),
  convertEnquiryToStudent: (id: string, paymentData: any) =>
    apiRequest(`/api/enquiries/${id}/convert-to-student`, { method: 'POST', body: JSON.stringify(paymentData) }),
  validateBulkEnquiries: (rawRows: any[], columnMapping: Record<string, string>) =>
    apiRequest('/api/enquiries/bulk/validate', { method: 'POST', body: JSON.stringify({ rawRows, columnMapping }) }),
  commitBulkEnquiries: (payload: any) =>
    apiRequest('/api/enquiries/bulk/commit', { method: 'POST', body: JSON.stringify(payload) }),
  getBulkBatches: () => apiRequest('/api/enquiries/bulk/batches'),
  getDialerSettings: () => apiRequest('/api/enquiries/dialer/settings'),
  updateDialerSettings: (settings: any) =>
    apiRequest('/api/enquiries/dialer/settings', { method: 'POST', body: JSON.stringify(settings) }),

  // Enterprise Master Tables
  getEnterpriseMaster: () => apiRequest('/api/master/enterprise'),
  addMasterDepartment: (dept: any) =>
    apiRequest('/api/master/departments', { method: 'POST', body: JSON.stringify(dept) }),
  updateMasterDepartment: (id: string, updates: any) =>
    apiRequest(`/api/master/departments/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
};
