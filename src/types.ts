export type UserRole = 'student' | 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
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
  course_id: string;
  session_id: string;
  current_semester: number;
  admission_year: number;
  admission_status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';
  fees_status: 'paid' | 'due' | 'overdue';
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
  board_name?: string;
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
  | 'fee-ledger'
  | 'scholarships'
  | 'form-builder'
  | 'academics'
  | 'reports'
  | 'settings'
  | 'grievances';
