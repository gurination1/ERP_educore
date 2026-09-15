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
  resetPassword: (payload: { email: string; newPassword: string }) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Students & Dashboard
  getStudents: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/students?${query}`);
  },
  getStudentDashboard: (studentId: string) => apiRequest(`/api/students/${studentId}/dashboard`),
  getStudentProfile: (studentId: string) => apiRequest(`/api/students/${studentId}`),
  sendEmailReminders: () => apiRequest('/api/students/send-email-reminders', { method: 'POST' }),

  // Admissions
  saveAdmissionDraft: (data: any) =>
    apiRequest('/api/admissions/draft', { method: 'POST', body: JSON.stringify(data) }),
  submitAdmission: (data: any) =>
    apiRequest('/api/admissions/submit', { method: 'POST', body: JSON.stringify(data) }),
  adminAdmitStudent: (data: any) =>
    apiRequest('/api/admissions/admin-admit', { method: 'POST', body: JSON.stringify(data) }),
  getAdmissions: (status?: string) => apiRequest(`/api/admissions?status=${status || 'all'}`),
  updateAdmissionStatus: (id: string, status: string, remarks?: string) =>
    apiRequest(`/api/admissions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, remarks }) }),

  // Fees
  getFeeHeads: () => apiRequest('/api/fees/heads'),
  assignFeeHead: (data: { studentId: string; feeHeadId: string; amount: number; dueDate?: string; semester?: number }) =>
    apiRequest('/api/fees/assign', { method: 'POST', body: JSON.stringify(data) }),
  getFeeKPIs: () => apiRequest('/api/fees/kpi'),
  getFeeTrend: () => apiRequest('/api/fees/trend'),
  getDefaulters: () => apiRequest('/api/fees/defaulters'),
  getFeeLedger: (studentId: string) => apiRequest(`/api/fees/ledger/${studentId}`),
  payFee: (paymentData: { studentId: string; amount: number; paymentMode?: string; studentFeeId?: string; notes?: string }) =>
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
};
