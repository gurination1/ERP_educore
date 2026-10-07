export type UserRole = 'student' | 'admin' | 'staff' | 'counselor' | 'hod' | 'accounts' | 'super_admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  is_active?: boolean;
  department?: string;
  designation?: string;
  employee_id?: string;
  enterprise_uid?: string;
  created_at?: string;
}

export interface MasterState {
  gst_code: string;
  state_name: string;
  state_short_code: string;
  is_union_territory: boolean;
}

export interface MasterUserType {
  type_code: string;
  alpha_prefix: string;
  role_key: UserRole;
  display_title: string;
  description: string;
}

export interface MasterDegree {
  degree_code: string;
  degree_name: string;
  level: 'undergraduate' | 'postgraduate' | 'diploma' | 'doctorate';
  duration_years: number;
  total_semesters: number;
  statutory_body: 'AICTE' | 'UGC' | 'PCI' | 'BCI';
}

export interface MasterDocumentType {
  doc_type_code: string;
  title: string;
  mandatory_for: 'all' | 'punjab_quota' | 'scholarship_pms' | 'hosteller';
  max_file_size_mb: number;
  allowed_mime_types: string;
}

export interface StaffAcademicJourney {
  id: string;
  staff_id: string;
  staff_name: string;
  qualification_level: 'PhD' | 'PostDoc' | 'M.Tech' | 'M.Sc' | 'MBA' | 'B.Tech' | 'B.Sc';
  degree_name: string;
  awarding_university: string;
  year_of_passing: number;
  specialization: string;
  scopus_publications: number;
  sci_publications: number;
  patents_count: number;
  past_institutions_summary: string;
  verified: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole | 'system';
  actor_ip?: string;
  action: string;
  target_type: 'user' | 'student' | 'fee' | 'scholarship' | 'form' | 'attendance' | 'system';
  target_id: string;
  details: string;
  changes_diff?: string;
  severity: 'info' | 'warn' | 'critical';
}

export interface StudentProfile {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';
  dob: string;
  email: string;
  phone: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_phone: string;
  mother_name?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  annual_family_income?: number;
  course_id: string;
  session_id: string;
  current_semester: number;
  admission_year: number;
  admission_status: 'inquiry' | 'registered' | 'draft' | 'submitted' | 'pending' | 'verified' | 'fee_pending' | 'provisionally_admitted' | 'approved' | 'enrolled' | 'rejected';
  admission_remarks?: string;
  fees_status: 'paid' | 'due' | 'overdue' | 'cancelled';
  attendance_percentage: number;
  total_classes: number;
  attended_classes: number;
  is_hosteller?: boolean;
  is_transport_user?: boolean;
  transport_route?: string;
  hostel_room_no?: string;
  category?: 'General' | 'SC/ST' | 'OBC' | 'EWS' | 'Sports';
  quota?: 'punjab_85' | 'other_state_15' | 'management' | 'sports';
  tenth_percentage?: number;
  twelfth_percentage?: number;
  tenth_roll_no?: string;
  twelfth_roll_no?: string;
  board_name?: string;
  aadhaar_no?: string;
  tenth_doc_verified?: boolean;
  twelfth_doc_verified?: boolean;
  aadhaar_doc_verified?: boolean;
  token_fee_receipt?: string;
  token_fee_amount?: number;
  token_fee_mode?: string;
  token_fee_date?: string;
  intake_step?: number;
  counseling_notes?: string;
  admitted_by?: string;
  condonation_granted?: boolean;
  condonation_order_no?: string;
  condonation_remarks?: string;
  followup_status?: 'pending' | 'contacted' | 'callback_scheduled' | 'visited' | 'interested' | 'not_interested' | 'converted';
  followup_priority?: 'p1_high' | 'p2_medium' | 'p3_low';
  next_followup_date?: string;
  last_followup_at?: string;
  assigned_counselor_id?: string;
  assigned_counselor_name?: string;
  course?: {
    id: string;
    code: string;
    name: string;
    department: string;
    base_tuition_fee: number;
  };
  session?: {
    id: string;
    name: string;
  };
}

export interface AdmissionFollowup {
  id: string;
  student_id: string;
  counselor_id: string;
  counselor_name: string;
  interaction_type: 'call' | 'campus_visit' | 'sms' | 'email' | 'in_person';
  outcome: 'interested' | 'callback_requested' | 'parent_discussion' | 'fee_query' | 'visit_scheduled' | 'not_interested' | 'converted';
  notes: string;
  next_followup_date?: string;
  priority?: 'p1_high' | 'p2_medium' | 'p3_low';
  created_at: string;
}

export interface FollowupRadarStats {
  total_prospects: number;
  overdue: number;
  due_today: number;
  upcoming: number;
  p1_high_priority: number;
  converted: number;
}

export interface ProspectLeadItem {
  student: StudentProfile;
  latest_followup?: AdmissionFollowup;
  followup_count: number;
  is_overdue: boolean;
  is_due_today: boolean;
  days_since_contact: number | null;
}

export interface FeeHead {
  id: string;
  code: string;
  title: string;
  description?: string;
  is_recurring: boolean;
}

export interface StudentFeeItem {
  id: string;
  student_id: string;
  fee_head_id: string;
  session_id: string;
  semester: number;
  amount: number;
  discount_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: 'paid' | 'partial' | 'due' | 'overdue';
  fee_head?: FeeHead;
  session?: { name: string };
}

export interface PaymentRecord {
  id: string;
  receipt_no: string;
  student_id: string;
  student_fee_id?: string;
  amount_paid: number;
  payment_mode: string;
  transaction_reference: string;
  payment_date: string;
  status: string;
  notes?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  notice_date: string;
  category: string;
  is_pinned: boolean;
}

export interface ScholarshipScheme {
  id: string;
  code: string;
  title: string;
  description: string;
  award_amount: number;
  eligibility_criteria: string;
  deadline: string;
  is_active: boolean;
}

export interface ScholarshipApp {
  id: string;
  scheme_id: string;
  student_id: string;
  schemeTitle?: string;
  awardAmount?: number;
  studentName?: string;
  studentId?: string;
  course?: string;
  annual_family_income: number;
  previous_gpa: number;
  reason_for_application: string;
  document_path?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  admin_remarks?: string;
  created_at: string;
}

export interface DynamicFormFieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'radio' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DynamicFormItem {
  id: string;
  form_code: string;
  title: string;
  description: string;
  schema_json: DynamicFormFieldDef[];
  is_published: boolean;
  created_at: string;
}

export interface GrievanceItem {
  id: string;
  tracking_code: string;
  student_id: string;
  student_name: string;
  category: 'academic' | 'examination' | 'hostel' | 'transport' | 'fee_finance' | 'anti_ragging' | 'infrastructure' | 'general';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'under_investigation' | 'resolved' | 'dismissed';
  admin_remarks?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export type ActiveScreen =
  | 'student-dashboard' // Screen 1 & 2
  | 'login'             // Screen 3 & 4
  | 'admissions'        // Screen 5 & 6
  | 'admin-dashboard'   // Screen 7 & 8
  | 'staff-dashboard'   // Dedicated Faculty / Academic Staff Portal
  | 'manage-students'   // Screen 9 & 10
  | 'user-management'   // Admin Extreme Powers: Staff Role Hiring & Provisioning
  | 'progressive-intake' // 3-Step Student Intake Wizard
  | 'fee-ledger'
  | 'scholarships'
  | 'form-builder'
  | 'academics'
  | 'reports'
  | 'settings'
  | 'grievances'
  | 'student-documents' // Student Regulatory Documents Vault
  | 'teacher-documents' // Faculty / Teachers Credentials Vault
  | 'student-quiz-lms'  // Student Quiz & LMS Assessment Engine
  | 'audit-trail'
  | 'academic-journey'
  | 'master-tables';

export interface DocumentRecord {
  id: string;
  doc_type_code: string;
  title: string;
  owner_id: string;
  owner_name: string;
  owner_role: UserRole;
  file_name: string;
  file_size_kb: number;
  mime_type: string;
  status: 'verified' | 'pending' | 'rejected' | 'reupload_required';
  verified_by?: string;
  verified_at?: string;
  remarks?: string;
  sha256_hash: string;
  uploaded_at: string;
}

export interface LMSQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
}

export interface LMSQuiz {
  id: string;
  title: string;
  courseCode: string;
  semester: number;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questions: LMSQuizQuestion[];
  instructions: string[];
}
