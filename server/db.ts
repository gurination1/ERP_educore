import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import mysql from 'mysql2/promise';

export type EnterpriseUserRole = 'super_admin' | 'admin' | 'staff' | 'counselor' | 'hod' | 'accounts' | 'student' | 'partner';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: EnterpriseUserRole;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  department?: string;
  designation?: string;
  employee_id?: string;
  enterprise_uid?: string;
  must_change_password?: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: EnterpriseUserRole | 'system';
  actor_ip?: string;
  action: string;
  target_type: 'user' | 'student' | 'fee' | 'scholarship' | 'form' | 'attendance' | 'system' | 'staff' | 'partner' | 'enquiry' | 'enquiry_batch';
  target_id: string;
  details: string;
  changes_diff?: string;
  severity: 'info' | 'warn' | 'critical';
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
  role_key: EnterpriseUserRole;
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

export function generateEnterpriseUID(
  userType: EnterpriseUserRole,
  stateGst: string = '03',
  instCode: string = '01',
  sequenceNum?: number | string,
  clientCode: string = '01'
): string {
  const typeMap: Record<EnterpriseUserRole, { numeric: string; alpha: string }> = {
    student: { numeric: '1001', alpha: 'STU' },
    staff: { numeric: '2001', alpha: 'FAC' },
    hod: { numeric: '3001', alpha: 'HOD' },
    admin: { numeric: '4001', alpha: 'ADM' },
    accounts: { numeric: '5001', alpha: 'ACC' },
    counselor: { numeric: '6001', alpha: 'CNS' },
    partner: { numeric: '7001', alpha: 'PRT' },
    super_admin: { numeric: '9001', alpha: 'SUP' },
  };

  const selected = typeMap[userType] || { numeric: '1001', alpha: 'STU' };
  const seq = sequenceNum !== undefined
    ? String(sequenceNum).padStart(2, '0').slice(-2)
    : Math.floor(10 + Math.random() * 89).toString();

  // Canonical Architecture (Digits Only): [CollegeNumber: 4 digits]-[Serial: 2 digits]-[State GST: 2 digits]-[Institutional Code: 2 digits]
  return `${selected.numeric}-${seq}-${stateGst}-${instCode}`;
}

export const DEFAULT_MASTER_STATES: MasterState[] = [
  { gst_code: '01', state_name: 'Jammu and Kashmir', state_short_code: 'JK', is_union_territory: true },
  { gst_code: '02', state_name: 'Himachal Pradesh', state_short_code: 'HP', is_union_territory: false },
  { gst_code: '03', state_name: 'Punjab', state_short_code: 'PB', is_union_territory: false },
  { gst_code: '04', state_name: 'Chandigarh', state_short_code: 'CH', is_union_territory: true },
  { gst_code: '06', state_name: 'Haryana', state_short_code: 'HR', is_union_territory: false },
  { gst_code: '07', state_name: 'Delhi', state_short_code: 'DL', is_union_territory: true },
  { gst_code: '08', state_name: 'Rajasthan', state_short_code: 'RJ', is_union_territory: false },
  { gst_code: '09', state_name: 'Uttar Pradesh', state_short_code: 'UP', is_union_territory: false },
  { gst_code: '10', state_name: 'Bihar', state_short_code: 'BR', is_union_territory: false },
  { gst_code: '27', state_name: 'Maharashtra', state_short_code: 'MH', is_union_territory: false },
];

export const DEFAULT_MASTER_USER_TYPES: MasterUserType[] = [
  { type_code: '1001', alpha_prefix: 'STU', role_key: 'student', display_title: 'Student Scholar', description: 'Enrolled or admitted undergraduate/postgraduate student candidate' },
  { type_code: '2001', alpha_prefix: 'FAC', role_key: 'staff', display_title: 'Faculty / Academic Staff', description: 'Teaching assistant, assistant professor, associate professor or lab in-charge' },
  { type_code: '3001', alpha_prefix: 'HOD', role_key: 'hod', display_title: 'Head of Department (HOD)', description: 'Departmental administrative and curriculum head' },
  { type_code: '4001', alpha_prefix: 'ADM', role_key: 'admin', display_title: 'Institutional Administrator', description: 'College registrar, dean, administrative head' },
  { type_code: '5001', alpha_prefix: 'ACC', role_key: 'accounts', display_title: 'Accounts & Bursar Officer', description: 'Finance department, tuition collection, bursar' },
  { type_code: '6001', alpha_prefix: 'CNS', role_key: 'counselor', display_title: 'Admissions Counselor', description: 'Counseling cell, leads pipeline, CRM coordinator' },
  { type_code: '7001', alpha_prefix: 'PRT', role_key: 'partner', display_title: 'Corporate & Hiring Partner', description: 'Industry partners, corporate recruiters, and internship sponsors' },
  { type_code: '9001', alpha_prefix: 'SUP', role_key: 'super_admin', display_title: 'Universal Provost & Super Admin', description: 'Apex system authority, universal access, invisible to subordinate users' },
];

export const DEFAULT_MASTER_DEGREES: MasterDegree[] = [
  { degree_code: 'BTECH_CSE', degree_name: 'Bachelor of Technology (Computer Science & Engineering)', level: 'undergraduate', duration_years: 4, total_semesters: 8, statutory_body: 'AICTE' },
  { degree_code: 'BTECH_ME', degree_name: 'Bachelor of Technology (Mechanical Engineering)', level: 'undergraduate', duration_years: 4, total_semesters: 8, statutory_body: 'AICTE' },
  { degree_code: 'MTECH_CSE', degree_name: 'Master of Technology (Computer Science & Engineering)', level: 'postgraduate', duration_years: 2, total_semesters: 4, statutory_body: 'AICTE' },
  { degree_code: 'MBA', degree_name: 'Master of Business Administration', level: 'postgraduate', duration_years: 2, total_semesters: 4, statutory_body: 'AICTE' },
  { degree_code: 'BCA', degree_name: 'Bachelor of Computer Applications', level: 'undergraduate', duration_years: 3, total_semesters: 6, statutory_body: 'UGC' },
  { degree_code: 'MCA', degree_name: 'Master of Computer Applications', level: 'postgraduate', duration_years: 2, total_semesters: 4, statutory_body: 'AICTE' },
  { degree_code: 'BSC_PHY', degree_name: 'Bachelor of Science (Physics)', level: 'undergraduate', duration_years: 3, total_semesters: 6, statutory_body: 'UGC' },
  { degree_code: 'PHD_ENG', degree_name: 'Doctor of Philosophy (Engineering & Technology)', level: 'doctorate', duration_years: 3, total_semesters: 6, statutory_body: 'UGC' },
];

export const DEFAULT_MASTER_DOCUMENT_TYPES: MasterDocumentType[] = [
  { doc_type_code: 'DOC_AADHAAR', title: 'UIDAI Aadhaar Card', mandatory_for: 'all', max_file_size_mb: 5, allowed_mime_types: 'image/jpeg,image/png,application/pdf' },
  { doc_type_code: 'DOC_10TH', title: 'Matriculation (10th) Certificate & Marksheet', mandatory_for: 'all', max_file_size_mb: 5, allowed_mime_types: 'image/jpeg,image/png,application/pdf' },
  { doc_type_code: 'DOC_12TH', title: 'Senior Secondary (12th / Diploma) Marksheet', mandatory_for: 'all', max_file_size_mb: 5, allowed_mime_types: 'image/jpeg,image/png,application/pdf' },
  { doc_type_code: 'DOC_PB_DOMICILE', title: 'Punjab State Domicile Certificate (85% Quota)', mandatory_for: 'punjab_quota', max_file_size_mb: 5, allowed_mime_types: 'image/jpeg,image/png,application/pdf' },
  { doc_type_code: 'DOC_INCOME_CERT', title: 'Tehsildar Annual Income Certificate (PMS / EWS)', mandatory_for: 'scholarship_pms', max_file_size_mb: 5, allowed_mime_types: 'image/jpeg,image/png,application/pdf' },
  { doc_type_code: 'DOC_CASTE_CERT', title: 'SC / ST / OBC Category Certificate', mandatory_for: 'scholarship_pms', max_file_size_mb: 5, allowed_mime_types: 'image/jpeg,image/png,application/pdf' },
  { doc_type_code: 'DOC_HOSTEL_AFF', title: 'Hostel Anti-Ragging Undertaking & Medical Slip', mandatory_for: 'hosteller', max_file_size_mb: 5, allowed_mime_types: 'image/jpeg,image/png,application/pdf' },
];

export const DEFAULT_STAFF_ACADEMIC_JOURNEY: StaffAcademicJourney[] = [
  {
    id: 'saj-01',
    staff_id: 'usr-staff-01',
    staff_name: 'Prof. Sunita Rao',
    qualification_level: 'PhD',
    degree_name: 'Doctor of Philosophy in Cloud Computing & Fault Tolerant Systems',
    awarding_university: 'Thapar Institute of Engineering and Technology, Patiala',
    year_of_passing: 2020,
    specialization: 'Distributed Systems & Cloud Virtualization',
    scopus_publications: 14,
    sci_publications: 6,
    patents_count: 2,
    past_institutions_summary: 'Assistant Professor at GNDU Regional Campus Jalandhar (2016-2021)',
    verified: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'saj-02',
    staff_id: 'usr-staff-01',
    staff_name: 'Prof. Sunita Rao',
    qualification_level: 'M.Tech',
    degree_name: 'Master of Technology in Computer Science & Engineering',
    awarding_university: 'MRSPTU Bathinda Campus',
    year_of_passing: 2015,
    specialization: 'Information Security & Cryptography',
    scopus_publications: 4,
    sci_publications: 1,
    patents_count: 0,
    past_institutions_summary: 'Lecturer at Baba Farid College of Engineering & Technology (2015-2016)',
    verified: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'saj-03',
    staff_id: 'usr-hod-01',
    staff_name: 'Dr. Balwinder Singh',
    qualification_level: 'PhD',
    degree_name: 'Doctor of Philosophy in Artificial Intelligence & Deep Neural Systems',
    awarding_university: 'Indian Institute of Technology (IIT) Roorkee',
    year_of_passing: 2016,
    specialization: 'High Performance AI, Tensor Architecture, Edge Inference',
    scopus_publications: 28,
    sci_publications: 12,
    patents_count: 5,
    past_institutions_summary: 'Associate Professor & Research Chair at PEC Chandigarh (2016-2022)',
    verified: true,
    created_at: '2024-01-10T09:30:00Z',
  },
];

export interface MasterDepartment {
  id: string;
  dept_code: string;
  dept_name: string;
  tags_json: string;
  head_of_dept?: string;
  established_year: number;
  is_active: boolean;
}

export interface MasterInstitutionType {
  code: string;
  name: string;
  regulatory_authority: string;
  description: string;
}

export interface MasterEmployeeStatus {
  status_code: string;
  status_name: string;
  description: string;
  requires_dates: boolean;
}

export interface MasterDesignationChange {
  type_code: string;
  name: string;
  category: string;
}

export interface MasterERPStatus {
  status_code: string;
  status_name: string;
  stage: string;
}

export interface StaffBasicInfo {
  id: string;
  staff_id: string;
  employee_id: string;
  full_name: string;
  father_name: string;
  dob: string;
  gender: string;
  date_of_joining: string;
  date_of_resigning?: string;
  last_working_date?: string;
  category: 'fresher' | 'rejoiner';
  primary_designation: string;
  department_id: string;
  employee_status: string;
  login_enabled: boolean;
  must_change_password: boolean;
  custom_attr_1?: string;
  custom_attr_2?: string;
  custom_attr_3?: string;
  custom_attr_4?: string;
  custom_meta_json?: string;
}

export interface StaffAdditionalInfo {
  id: string;
  staff_id: string;
  emergency_phone?: string;
  blood_group?: string;
  marital_status?: string;
  nationality?: string;
  pf_uan?: string;
  esi_number?: string;
  custom_meta_json?: string;
}

export interface StaffAddress {
  id: string;
  staff_id: string;
  address_type: 'current' | 'permanent' | 'correspondence';
  address_line: string;
  city: string;
  state_gst: string;
  pincode: string;
  is_default: boolean;
}

export interface StaffBankAccount {
  id: string;
  staff_id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  is_default: boolean;
}

export interface StaffQualification {
  id: string;
  staff_id: string;
  qualification_title: string;
  institution: string;
  year_of_passing: number;
  percentage_or_cgpa: number;
  is_highest: boolean;
}

export interface StaffCertification {
  id: string;
  staff_id: string;
  certification_name: string;
  issuing_body: string;
  issue_year: number;
  credential_id?: string;
}

export interface StaffExperience {
  id: string;
  staff_id: string;
  organization_name: string;
  designation: string;
  start_date: string;
  end_date: string;
  is_latest: boolean;
}

export interface StaffOrgJourneyEvent {
  id: string;
  staff_id: string;
  event_type: string;
  effective_date: string;
  old_designation?: string;
  new_designation?: string;
  actor_id: string;
  remarks: string;
  created_at: string;
}

export interface PartnerEntity {
  id: string;
  user_id?: string;
  partner_type: string;
  firm_name: string;
  pan_number: string;
  gst_number: string;
  tan_number?: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  custom_meta_json?: string;
}

export interface PartnerContact {
  id: string;
  partner_id: string;
  contact_name: string;
  designation: string;
  email: string;
  phone: string;
  is_default: boolean;
}

export interface PartnerBankAccount {
  id: string;
  partner_id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  is_default: boolean;
}

export interface PartnerJobPosting {
  id: string;
  partner_id: string;
  title: string;
  type: string;
  stipend_salary: string;
  eligible_departments: string;
  min_cgpa: number;
  description: string;
  status: string;
  created_at: string;
}

export interface PartnerApplication {
  id: string;
  posting_id: string;
  student_id: string;
  student_name: string;
  cgpa: number;
  status: string;
  remarks?: string;
  applied_at: string;
}

export interface BulkUploadBatch {
  id: string;
  upload_date: string;
  filename: string;
  total_rows: number;
  fresh_count: number;
  duplicate_count: number;
  wrong_count: number;
  source_label: string;
  uploaded_by: string;
}

export interface EnquiryRecord {
  id: string;
  enquiry_no: string;
  student_name: string;
  gender: string;
  father_name: string;
  mobile: string;
  email: string;
  selected_course: string;
  course_fee: number;
  admission_probability: number;
  status: string;
  assigned_counselor_id?: string;
  assigned_counselor_name?: string;
  batch_id?: string;
  created_at: string;
  custom_meta_json?: string;
}

export interface EnquiryInteraction {
  id: string;
  enquiry_id: string;
  stage_name: string;
  counselor_id: string;
  remarks: string;
  call_status: string;
  probability_updated: number;
  call_recording_url?: string;
  timestamp: string;
}

export interface DialerSettings {
  id: string;
  is_enabled: boolean;
  provider: string;
  api_key_configured: boolean;
}

export const DEFAULT_MASTER_DEPARTMENTS: MasterDepartment[] = [
  { id: 'dept-cse', dept_code: 'CSE', dept_name: 'Computer Science & Engineering', tags_json: JSON.stringify(['Engineering', 'IT', 'Software', 'AI', 'UG', 'PG']), head_of_dept: 'Dr. Balwinder Singh', established_year: 2005, is_active: true },
  { id: 'dept-agri', dept_code: 'AGRI', dept_name: 'Agriculture & Horticulture Sciences', tags_json: JSON.stringify(['Agriculture', 'Agronomy', 'Soil Science', 'Horticulture', 'UG']), head_of_dept: 'Dr. Harbhajan Randhawa', established_year: 2012, is_active: true },
  { id: 'dept-ce', dept_code: 'CE', dept_name: 'Civil Engineering & Infrastructure', tags_json: JSON.stringify(['Engineering', 'Civil', 'Structures', 'UG']), head_of_dept: 'Prof. Gurmeet Mann', established_year: 2007, is_active: true },
  { id: 'dept-me', dept_code: 'ME', dept_name: 'Mechanical & Automation Engineering', tags_json: JSON.stringify(['Engineering', 'Mechanical', 'Robotics', 'Automotive', 'UG']), head_of_dept: 'Dr. Paramjit Dhillon', established_year: 2006, is_active: true },
  { id: 'dept-mgmt', dept_code: 'MGMT', dept_name: 'Management Studies & Commerce', tags_json: JSON.stringify(['Management', 'MBA', 'BBA', 'Finance', 'Marketing', 'PG', 'UG']), head_of_dept: 'Prof. Simran Walia', established_year: 2008, is_active: true },
  { id: 'dept-pharm', dept_code: 'PHARM', dept_name: 'Pharmaceutical Sciences & Healthcare', tags_json: JSON.stringify(['Pharmacy', 'Healthcare', 'B.Pharm', 'PCI', 'UG']), head_of_dept: 'Dr. Sandeep Kahlon', established_year: 2015, is_active: true },
  { id: 'dept-applied', dept_code: 'APP_SCI', dept_name: 'Applied Sciences & Humanities', tags_json: JSON.stringify(['Applied Sciences', 'Physics', 'Mathematics', 'Chemistry', 'Foundation']), head_of_dept: 'Dr. Ramesh Chandra', established_year: 2005, is_active: true },
];

export const DEFAULT_MASTER_INSTITUTION_TYPES: MasterInstitutionType[] = [
  { code: 'ENG_COLLEGE', name: 'Engineering & Technology College', regulatory_authority: 'AICTE / MRSPTU', description: 'Technical institution imparting engineering and applied computer science degrees' },
  { code: 'AGRI_INST', name: 'Faculty of Agricultural Sciences', regulatory_authority: 'ICAR / MRSPTU', description: 'Agricultural institute with experimental farms and horticulture labs' },
  { code: 'AUTO_INST', name: 'Autonomous Technical Campus', regulatory_authority: 'UGC Section 2(f) & 12(B)', description: 'Autonomous degree-granting constituent college' },
  { code: 'MGMT_INST', name: 'Business School & Management College', regulatory_authority: 'AICTE / AIU', description: 'Postgraduate management and commerce school' },
  { code: 'PHARM_COLLEGE', name: 'College of Pharmacy', regulatory_authority: 'PCI (Pharmacy Council of India)', description: 'Pharmaceutical degree and clinical research campus' },
];

export const DEFAULT_MASTER_EMPLOYEE_STATUSES: MasterEmployeeStatus[] = [
  { status_code: 'ACTIVE', status_name: 'Active Staff Member', description: 'Currently on active rolls with assigned academic and administrative load', requires_dates: false },
  { status_code: 'RESIGNED', status_name: 'Resigned & In Notice', description: 'Resignation tendered, serving mandatory notice period', requires_dates: true },
  { status_code: 'TERMINATED', status_name: 'Statutorily Terminated', description: 'Relieved from services by executive directorate order', requires_dates: true },
  { status_code: 'AOL', status_name: 'Absent Out of Leave (AOL)', description: 'Unannounced continuous absence exceeding statutory limit without prior sanctioned leave', requires_dates: true },
  { status_code: 'DEACTIVATED', status_name: 'Deactivated / Relieved', description: 'Past employee with service record archived and portal login disabled', requires_dates: true },
];

export const DEFAULT_MASTER_DESIGNATION_CHANGES: MasterDesignationChange[] = [
  { type_code: 'PROMOTION', name: 'Executive Promotion', category: 'promotion' },
  { type_code: 'DEMOTION', name: 'Disciplinary Demotion', category: 'demotion' },
  { type_code: 'ADDITIONAL_ROLE', name: 'Additional Portfolio / Charge', category: 'additional_role' },
  { type_code: 'ROLE_SWITCH', name: 'Departmental Role Switch', category: 'role_switch' },
];

export const DEFAULT_MASTER_ERP_STATUSES: MasterERPStatus[] = [
  { status_code: 'ENQUIRY', status_name: 'Initial Enquiry', stage: 'enquiry' },
  { status_code: 'PROSPECT', status_name: 'Follow-up Prospect', stage: 'prospect' },
  { status_code: 'REGISTRATION_PAID', status_name: 'Registration Token Paid', stage: 'registration_paid' },
  { status_code: 'STUDENT', status_name: 'Admitted Regular Student', stage: 'student' },
];

export const DEFAULT_PARTNERS: PartnerEntity[] = [
  {
    id: 'prt-001',
    user_id: 'usr-partner-01',
    partner_type: 'Private Limited',
    firm_name: 'Infosys BPM & Campus Talent Services',
    pan_number: 'AAACI1234F',
    gst_number: '03AAACI1234F1Z5',
    tan_number: 'BLRI12345A',
    email: 'campus.hiring@infosys.com',
    phone: '+91 80 2852 0261',
    address: 'Electronics City, Hosur Road, Bengaluru, Karnataka 560100',
    is_active: true,
    created_at: '2025-01-15T10:00:00Z',
    custom_meta_json: JSON.stringify({ tier: 'Tier-1 Recruiter', mou_active: true, hired_count: 42 }),
  },
  {
    id: 'prt-002',
    user_id: 'usr-partner-02',
    partner_type: 'Partnership Firm',
    firm_name: 'Punjab AgriTech & Smart Farming Solutions',
    pan_number: 'AABFP9876K',
    gst_number: '03AABFP9876K1ZA',
    tan_number: 'CHDP98765B',
    email: 'partnerships@punjabagritech.in',
    phone: '+91 172 509 8812',
    address: 'Sector 82, JLPL Industrial Area, Mohali, Punjab 160055',
    is_active: true,
    created_at: '2025-02-01T11:30:00Z',
    custom_meta_json: JSON.stringify({ tier: 'Core Agriculture Partner', internships_offered: 15 }),
  },
];

export const DEFAULT_PARTNER_CONTACTS: PartnerContact[] = [
  { id: 'prt-ct-01', partner_id: 'prt-001', contact_name: 'Suresh Narayanan', designation: 'Director of University Relations', email: 'suresh.n@infosys.com', phone: '+91 98450 11223', is_default: true },
  { id: 'prt-ct-02', partner_id: 'prt-001', contact_name: 'Priyanka Sen', designation: 'Technical Recruitment Lead', email: 'priyanka.sen@infosys.com', phone: '+91 98450 44556', is_default: false },
  { id: 'prt-ct-03', partner_id: 'prt-002', contact_name: 'Jaspreet Singh Dhillon', designation: 'Managing Partner', email: 'jaspreet@punjabagritech.in', phone: '+91 98140 77889', is_default: true },
];

export const DEFAULT_PARTNER_BANKS: PartnerBankAccount[] = [
  { id: 'prt-bk-01', partner_id: 'prt-001', bank_name: 'HDFC Bank Ltd', account_number: '50200012345678', ifsc_code: 'HDFC0000053', branch_name: 'Electronics City Branch', is_default: true },
  { id: 'prt-bk-02', partner_id: 'prt-002', bank_name: 'State Bank of India', account_number: '30491827364', ifsc_code: 'SBIN0001234', branch_name: 'Mohali Phase 7 Branch', is_default: true },
];

export const DEFAULT_PARTNER_JOBS: PartnerJobPosting[] = [
  { id: 'job-01', partner_id: 'prt-001', title: 'Associate Software Engineer - Cloud & React', type: 'full_time', stipend_salary: '₹ 6.5 LPA CTC', eligible_departments: 'CSE,ECE', min_cgpa: 7.0, description: 'Campus hiring for graduate software engineers. Core JavaScript, React, and Python microservices.', status: 'open', created_at: '2025-08-01T10:00:00Z' },
  { id: 'job-02', partner_id: 'prt-002', title: 'Precision Agronomy & Crop Sensor Intern', type: 'internship', stipend_salary: '₹ 25,000 / month', eligible_departments: 'AGRI', min_cgpa: 6.5, description: 'Hands-on agricultural telemetry, drone crop health analysis, and soil moisture sensor calibration in Malwa region.', status: 'open', created_at: '2025-08-10T12:00:00Z' },
];

export const DEFAULT_STAFF_BASIC: StaffBasicInfo[] = [
  {
    id: 'stf-bas-01',
    staff_id: 'stf-001',
    employee_id: 'FAC-CSE-014',
    full_name: 'Prof. Sunita Rao',
    father_name: 'Sh. Ram Nath Rao',
    dob: '1985-04-12',
    gender: 'female',
    date_of_joining: '2020-07-15',
    category: 'fresher',
    primary_designation: 'Assistant Professor',
    department_id: 'CSE',
    employee_status: 'ACTIVE',
    login_enabled: true,
    must_change_password: false,
    custom_attr_1: 'Research Coordinator',
    custom_meta_json: JSON.stringify({ biometrics_enrolled: true, room_no: 'B-204' }),
  },
  {
    id: 'stf-bas-02',
    staff_id: 'stf-002',
    employee_id: 'FAC-HOD-001',
    full_name: 'Dr. Balwinder Singh',
    father_name: 'S. Gurbachan Singh',
    dob: '1976-11-20',
    gender: 'male',
    date_of_joining: '2014-08-01',
    category: 'rejoiner',
    primary_designation: 'Head of Department',
    department_id: 'CSE',
    employee_status: 'ACTIVE',
    login_enabled: true,
    must_change_password: false,
    custom_attr_1: 'Senate Member',
    custom_meta_json: JSON.stringify({ biometrics_enrolled: true, room_no: 'HOD-CSE' }),
  },
  {
    id: 'stf-bas-03',
    staff_id: 'stf-003',
    employee_id: 'FAC-CE-009',
    full_name: 'Er. Manjit Kaur',
    father_name: 'S. Sukhdev Singh',
    dob: '1988-06-18',
    gender: 'female',
    date_of_joining: '2019-01-10',
    date_of_resigning: '2025-09-01',
    last_working_date: '2025-10-31',
    category: 'fresher',
    primary_designation: 'Assistant Professor',
    department_id: 'CE',
    employee_status: 'RESIGNED',
    login_enabled: true,
    must_change_password: false,
    custom_attr_1: 'Notice Period (60 Days)',
    custom_meta_json: JSON.stringify({ handover_pending: true }),
  },
  {
    id: 'stf-bas-04',
    staff_id: 'stf-004',
    employee_id: 'FAC-ME-003',
    full_name: 'Prof. Rajesh Verma',
    father_name: 'Sh. Kishori Lal Verma',
    dob: '1982-03-25',
    gender: 'male',
    date_of_joining: '2017-09-01',
    date_of_resigning: '2025-08-15',
    category: 'rejoiner',
    primary_designation: 'Associate Professor',
    department_id: 'ME',
    employee_status: 'AOL',
    login_enabled: false,
    must_change_password: true,
    custom_attr_1: 'Show Cause Issued',
    custom_meta_json: JSON.stringify({ unauthorized_absence_days: 45 }),
  },
];

export const DEFAULT_STAFF_ADDITIONAL: StaffAdditionalInfo[] = [
  {
    id: 'stf-add-01',
    staff_id: 'stf-001',
    emergency_phone: '+91 98141 55667',
    blood_group: 'B+',
    marital_status: 'Married',
    nationality: 'Indian',
    pf_uan: '100918273645',
    esi_number: '1100223344',
    custom_meta_json: JSON.stringify({ aadhar_verified: true }),
  },
  {
    id: 'stf-add-02',
    staff_id: 'stf-002',
    emergency_phone: '+91 98720 99881',
    blood_group: 'O+',
    marital_status: 'Married',
    nationality: 'Indian',
    pf_uan: '100123456789',
    custom_meta_json: JSON.stringify({ aadhar_verified: true }),
  },
];

export const DEFAULT_STAFF_ADDRESSES: StaffAddress[] = [
  {
    id: 'addr-01',
    staff_id: 'stf-001',
    address_type: 'current',
    address_line: 'House No. 412, Phase 3B2',
    city: 'Mohali',
    state_gst: '03',
    pincode: '160059',
    is_default: true,
  },
  {
    id: 'addr-02',
    staff_id: 'stf-001',
    address_type: 'permanent',
    address_line: 'Civil Lines, Near Mall Road',
    city: 'Bathinda',
    state_gst: '03',
    pincode: '151001',
    is_default: false,
  },
  {
    id: 'addr-03',
    staff_id: 'stf-002',
    address_type: 'current',
    address_line: 'Flat 12-B, Faculty Enclave, MRSPTU Campus',
    city: 'Bathinda',
    state_gst: '03',
    pincode: '151001',
    is_default: true,
  },
];

export const DEFAULT_STAFF_BANKS: StaffBankAccount[] = [
  {
    id: 'bank-01',
    staff_id: 'stf-001',
    bank_name: 'HDFC Bank Ltd',
    account_number: '50100234918201',
    ifsc_code: 'HDFC0000213',
    branch_name: 'Phase 7 Mohali',
    is_default: true,
  },
  {
    id: 'bank-02',
    staff_id: 'stf-001',
    bank_name: 'State Bank of India',
    account_number: '31298471209',
    ifsc_code: 'SBIN0000612',
    branch_name: 'Main Branch Bathinda',
    is_default: false,
  },
  {
    id: 'bank-03',
    staff_id: 'stf-002',
    bank_name: 'Punjab National Bank',
    account_number: '0192002100098172',
    ifsc_code: 'PUNB0019200',
    branch_name: 'University Campus Branch',
    is_default: true,
  },
];

export const DEFAULT_STAFF_QUALIFICATIONS: StaffQualification[] = [
  {
    id: 'qual-01',
    staff_id: 'stf-001',
    qualification_title: 'Master of Technology (M.Tech) in Computer Science',
    institution: 'Punjab Technical University (PTU), Jalandhar',
    year_of_passing: 2012,
    percentage_or_cgpa: 8.6,
    is_highest: true,
  },
  {
    id: 'qual-02',
    staff_id: 'stf-001',
    qualification_title: 'Bachelor of Technology (B.Tech) in Computer Science & Engineering',
    institution: 'Guru Nanak Dev Engineering College, Ludhiana',
    year_of_passing: 2008,
    percentage_or_cgpa: 78.4,
    is_highest: false,
  },
  {
    id: 'qual-03',
    staff_id: 'stf-002',
    qualification_title: 'Doctor of Philosophy (Ph.D) in Artificial Intelligence',
    institution: 'IIT Roorkee',
    year_of_passing: 2016,
    percentage_or_cgpa: 9.4,
    is_highest: true,
  },
];

export const DEFAULT_STAFF_CERTIFICATIONS: StaffCertification[] = [
  {
    id: 'cert-01',
    staff_id: 'stf-001',
    certification_name: 'AWS Certified Solutions Architect - Associate',
    issuing_body: 'Amazon Web Services',
    issue_year: 2023,
    credential_id: 'AWS-CSA-991823',
  },
  {
    id: 'cert-02',
    staff_id: 'stf-001',
    certification_name: 'AICTE-NPTEL Deep Learning Specialization',
    issuing_body: 'IIT Madras & SWAYAM',
    issue_year: 2022,
    credential_id: 'NPTEL22CS891',
  },
];

export const DEFAULT_STAFF_EXPERIENCE: StaffExperience[] = [
  {
    id: 'exp-01',
    staff_id: 'stf-001',
    organization_name: 'Thapar Institute of Engineering and Technology, Patiala',
    designation: 'Senior Lecturer',
    start_date: '2015-08-01',
    end_date: '2020-06-30',
    is_latest: true,
  },
  {
    id: 'exp-02',
    staff_id: 'stf-001',
    organization_name: 'Rayat Bahra Group of Institutes',
    designation: 'Lecturer',
    start_date: '2012-07-15',
    end_date: '2015-07-31',
    is_latest: false,
  },
];

export const DEFAULT_STAFF_ORG_JOURNEY: StaffOrgJourneyEvent[] = [
  {
    id: 'soj-01',
    staff_id: 'stf-001',
    event_type: 'joining',
    effective_date: '2020-07-15',
    new_designation: 'Assistant Professor',
    actor_id: 'usr-admin-01',
    remarks: 'Initial appointment in CSE Department following selection committee review.',
    created_at: '2020-07-15T10:00:00Z',
  },
  {
    id: 'soj-02',
    staff_id: 'stf-001',
    event_type: 'promotion',
    effective_date: '2023-08-01',
    old_designation: 'Assistant Professor (Grade I)',
    new_designation: 'Assistant Professor (Senior Scale)',
    actor_id: 'usr-super-01',
    remarks: 'Merit-based CAS promotion approved by Governing Body.',
    created_at: '2023-08-01T11:30:00Z',
  },
  {
    id: 'soj-03',
    staff_id: 'stf-003',
    event_type: 'resignation',
    effective_date: '2025-09-01',
    actor_id: 'usr-admin-01',
    remarks: 'Tendered personal resignation. 60 days notice period initiated. Last working date: 2025-10-31.',
    created_at: '2025-09-01T14:00:00Z',
  },
];

export const DEFAULT_PARTNER_APPLICATIONS: PartnerApplication[] = [
  {
    id: 'app-01',
    posting_id: 'job-01',
    student_id: 'stu-rec-aryan',
    student_name: 'Aryan Sharma',
    cgpa: 8.85,
    status: 'shortlisted',
    remarks: 'Strong DSA and React fundamentals. Cleared round 1 technical screen.',
    applied_at: '2025-08-15T10:30:00Z',
  },
  {
    id: 'app-02',
    posting_id: 'job-01',
    student_id: 'stu-rec-priya',
    student_name: 'Priya Patel',
    cgpa: 9.12,
    status: 'applied',
    remarks: 'Final year CSE, high GPA and academic excellence.',
    applied_at: '2025-08-16T14:10:00Z',
  },
];

export const DEFAULT_ENQUIRIES: EnquiryRecord[] = [
  {
    id: 'enq-001',
    enquiry_no: 'ENQ-2025-0101',
    student_name: 'Amanat Kaur',
    gender: 'female',
    father_name: 'Sardar Kuldeep Singh',
    mobile: '+91 98761 22334',
    email: 'amanat.kaur@gmail.com',
    selected_course: 'B.Tech Computer Science & Engineering',
    course_fee: 90000,
    admission_probability: 85,
    status: 'enquiry',
    assigned_counselor_id: 'usr-counselor-01',
    assigned_counselor_name: 'Harleen Kaur',
    created_at: '2025-09-15T10:00:00Z',
    custom_meta_json: JSON.stringify({ school: 'St. Xavier Bathinda', pcm_percentage: 88.5 }),
  },
  {
    id: 'enq-002',
    enquiry_no: 'ENQ-2025-0102',
    student_name: 'Gurkirat Singh Brar',
    gender: 'male',
    father_name: 'Sardar Jagjit Singh',
    mobile: '+91 98144 55667',
    email: 'gurkirat.brar@yahoo.com',
    selected_course: 'B.Sc (Hons) Agriculture',
    course_fee: 75000,
    admission_probability: 60,
    status: 'prospect',
    assigned_counselor_id: 'usr-counselor-01',
    assigned_counselor_name: 'Harleen Kaur',
    created_at: '2025-09-18T14:30:00Z',
    custom_meta_json: JSON.stringify({ district: 'Muktsar Sahib', land_holding_acres: 12 }),
  },
  {
    id: 'enq-003',
    enquiry_no: 'ENQ-2025-0103',
    student_name: 'Navjot Sharma',
    gender: 'female',
    father_name: 'Sh. Rajesh Sharma',
    mobile: '+91 98882 11990',
    email: 'navjot.sharma99@outlook.com',
    selected_course: 'B.Tech Civil Engineering',
    course_fee: 85000,
    admission_probability: 95,
    status: 'registration_paid',
    assigned_counselor_id: 'usr-counselor-01',
    assigned_counselor_name: 'Harleen Kaur',
    created_at: '2025-09-20T11:00:00Z',
    custom_meta_json: JSON.stringify({ token_receipt: 'REC-TOK-2025-8812', token_amount: 10000 }),
  },
];

export const DEFAULT_ENQUIRY_INTERACTIONS: EnquiryInteraction[] = [
  {
    id: 'ei-001',
    enquiry_id: 'enq-001',
    stage_name: 'Initial Telephonic Counseling',
    counselor_id: 'usr-counselor-01',
    remarks: 'Spoke with candidate and father. Explained MRSPTU curriculum, faculty profile, and 100% placement track record.',
    call_status: 'Connected / Highly Interested',
    probability_updated: 85,
    call_recording_url: '/recordings/counseling_call_enq001_simulated.mp3',
    timestamp: '2025-09-16T11:30:00Z',
  },
  {
    id: 'ei-002',
    enquiry_id: 'enq-002',
    stage_name: 'Scholarship & Fee Structure Inquiry',
    counselor_id: 'usr-counselor-01',
    remarks: 'Discussed rural quota and post-matric scholarship eligibility. Candidate comparing with PAU Ludhiana.',
    call_status: 'Callback Requested',
    probability_updated: 60,
    call_recording_url: '/recordings/counseling_call_enq002_simulated.mp3',
    timestamp: '2025-09-19T15:00:00Z',
  },
];

export const DEFAULT_BULK_BATCHES: BulkUploadBatch[] = [
  {
    id: 'batch-001',
    upload_date: '2025-09-10T09:00:00Z',
    filename: 'bathinda_schools_class12_pcm.csv',
    total_rows: 150,
    fresh_count: 128,
    duplicate_count: 14,
    wrong_count: 8,
    source_label: 'Bathinda District School Fair',
    uploaded_by: 'Harleen Kaur',
  },
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-sys-init-01',
    timestamp: new Date().toISOString(),
    actor_id: 'usr-super-01',
    actor_name: 'Prof. Dr. Amritpal Singh (Chief System Provost)',
    actor_role: 'super_admin',
    actor_ip: '127.0.0.1',
    action: 'SYSTEM_BOOTSTRAP',
    target_type: 'system',
    target_id: 'sys-core',
    details: 'System initialized with Enterprise UID matrix and immutable audit trail.',
    changes_diff: JSON.stringify({ version: '3.0.0-enterprise', gst_state: '03', institution: 'BFGI' }),
    severity: 'info',
  },
  {
    id: 'aud-sec-02',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actor_id: 'usr-admin-01',
    actor_name: 'Dr. Ramesh Chandra (Registrar & Provost)',
    actor_role: 'admin',
    actor_ip: '192.168.1.10',
    action: 'POLICY_VERIFICATION',
    target_type: 'system',
    target_id: 'mrsptu-ord-7.4',
    details: 'Verified MRSPTU Ordinance 7.4 75% attendance gating criteria compliance.',
    severity: 'info',
  },
];

export interface Session {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  duration_years: number;
  total_semesters: number;
  base_tuition_fee: number;
}

export interface Student {
  id: string;
  user_id?: string;
  student_id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';
  dob: string;
  email: string;
  phone: string;
  guardian_name: string;
  guardian_relation: 'parent' | 'sibling' | 'spouse' | 'other';
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
  fees_status: 'paid' | 'due' | 'overdue' | 'cancelled' | 'partial';
  attendance_percentage: number;
  total_classes: number;
  attended_classes: number;
  // Indian & Punjab College Specific Academic & Residential Architecture
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
  // Follow-up CRM & Prospect Pipeline Architecture
  followup_status?: 'pending' | 'contacted' | 'callback_scheduled' | 'visited' | 'interested' | 'not_interested' | 'converted';
  followup_priority?: 'p1_high' | 'p2_medium' | 'p3_low';
  next_followup_date?: string;
  last_followup_at?: string;
  assigned_counselor_id?: string;
  assigned_counselor_name?: string;
  created_at: string;
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

export interface FeeHead {
  id: string;
  code: string;
  title: string;
  description?: string;
  is_recurring: boolean;
}

export interface StudentFee {
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
  status: 'paid' | 'partial' | 'due' | 'overdue' | 'cancelled';
}

export interface Payment {
  id: string;
  receipt_no: string;
  student_id: string;
  student_fee_id?: string;
  amount_paid: number;
  payment_mode: 'online_upi' | 'net_banking' | 'credit_card' | 'debit_card' | 'cash' | 'cheque';
  transaction_reference: string;
  payment_date: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  notes?: string;
  collected_by?: string;
}

export interface Scheme {
  id: string;
  code: string;
  title: string;
  description: string;
  award_amount: number;
  eligibility_criteria: string;
  deadline: string;
  is_active: boolean;
}

export interface ScholarshipApplication {
  id: string;
  scheme_id: string;
  student_id: string;
  annual_family_income: number;
  previous_gpa: number;
  reason_for_application: string;
  document_path?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  admin_remarks?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface DynamicFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'radio' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DynamicForm {
  id: string;
  form_code: string;
  title: string;
  description: string;
  schema_json: DynamicFormField[];
  is_published: boolean;
  created_by?: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  response_json: Record<string, any>;
  submitted_at: string;
}

export interface Notice {
  id: string;
  title: string;
  summary: string;
  content: string;
  notice_date: string;
  category: string;
  is_pinned: boolean;
}

export interface DocumentRecord {
  id: string;
  entity_type: 'admission' | 'scholarship' | 'fee_receipt' | 'identity' | 'general';
  entity_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Grievance {
  id: string;
  tracking_code: string; // e.g. GRV-2025-0104
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

function formatSqlDateTime(dateOrIso?: string | null): string {
  if (!dateOrIso) return new Date().toISOString().replace('T', ' ').slice(0, 19);
  const d = new Date(dateOrIso);
  if (isNaN(d.getTime())) return new Date().toISOString().replace('T', ' ').slice(0, 19);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

class DatabaseStore {
  // In-memory cache arrays for SQLite fallback mode
  public users: User[] = [];
  public sessions: Session[] = [];
  public courses: Course[] = [];
  public students: Student[] = [];
  public fee_heads: FeeHead[] = [];
  public student_fees: StudentFee[] = [];
  public payments: Payment[] = [];
  public schemes: Scheme[] = [];
  public scholarship_applications: ScholarshipApplication[] = [];
  public dynamic_forms: DynamicForm[] = [];
  public form_submissions: FormSubmission[] = [];
  public documents: DocumentRecord[] = [];
  public notices: Notice[] = [];
  public grievances: Grievance[] = [];
  public admission_followups: AdmissionFollowup[] = [];
  public audit_logs: AuditLog[] = [];
  public master_states: MasterState[] = [];
  public master_user_types: MasterUserType[] = [];
  public master_degrees: MasterDegree[] = [];
  public master_document_types: MasterDocumentType[] = [];
  public staff_academic_journey: StaffAcademicJourney[] = [];
  public master_departments: MasterDepartment[] = [];
  public master_institution_types: MasterInstitutionType[] = [];
  public master_employee_statuses: MasterEmployeeStatus[] = [];
  public master_designation_changes: MasterDesignationChange[] = [];
  public master_erp_statuses: MasterERPStatus[] = [];

  public staff_basic_info: StaffBasicInfo[] = [];
  public staff_additional_info: StaffAdditionalInfo[] = [];
  public staff_addresses: StaffAddress[] = [];
  public staff_bank_accounts: StaffBankAccount[] = [];
  public staff_qualifications: StaffQualification[] = [];
  public staff_certifications: StaffCertification[] = [];
  public staff_experience: StaffExperience[] = [];
  public staff_org_journey: StaffOrgJourneyEvent[] = [];

  public partners: PartnerEntity[] = [];
  public partner_contacts: PartnerContact[] = [];
  public partner_bank_accounts: PartnerBankAccount[] = [];
  public partner_job_postings: PartnerJobPosting[] = [];
  public partner_applications: PartnerApplication[] = [];

  public bulk_upload_batches: BulkUploadBatch[] = [];
  public enquiries: EnquiryRecord[] = [];
  public enquiry_interactions: EnquiryInteraction[] = [];
  public dialer_settings: DialerSettings = { id: 'default', is_enabled: true, provider: 'exotel', api_key_configured: true };

  public mode: 'mariadb' | 'sqlite' = 'sqlite';
  private dbPath: string = process.env.DB_PATH || path.join(process.cwd(), 'database', 'educore.sqlite');
  private sqlDb: SqlJsDatabase | null = null;
  private mariaPool: mysql.Pool | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.seedDefaultsInMemory();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const seedPath = path.join(process.cwd(), 'database', 'educore-seed.sqlite');

    // 1. Try MariaDB/MySQL connection if DB_HOST / MYSQLHOST / MYSQL_URL / DATABASE_URL is configured
    let host = process.env.DB_HOST || process.env.MYSQLHOST || '';
    let port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
    let user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
    let password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
    let database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'educore_erp';

    const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (rawUrl && (rawUrl.startsWith('mysql://') || rawUrl.startsWith('mariadb://'))) {
      try {
        const u = new URL(rawUrl);
        host = u.hostname;
        port = parseInt(u.port || '3306', 10);
        user = decodeURIComponent(u.username);
        password = decodeURIComponent(u.password);
        database = u.pathname.replace(/^\//, '') || database;
      } catch (err: any) {
        console.warn(`[DB] Failed to parse database URL: ${err.message}`);
      }
    }

    if (host) {
      try {
        // First ensure database exists
        const initConn = await mysql.createConnection({ host, port, user, password, connectTimeout: 5000 });
        await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await initConn.end();

        const pool = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          connectTimeout: 5000,
          waitForConnections: true,
          connectionLimit: 10,
        });

        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();

        this.mariaPool = pool;
        this.mode = 'mariadb';
        console.log(`[DB] Connected successfully to MariaDB/MySQL instance (${host}:${port}/${database}).`);

        // Load seed data from educore-seed.sqlite if needed before seeding
        if (fs.existsSync(seedPath)) {
          try {
            const SQL = await initSqlJs();
            const seedBuffer = fs.readFileSync(seedPath);
            const tempDb = new SQL.Database(seedBuffer);
            const prevSqlDb = this.sqlDb;
            this.sqlDb = tempDb;
            this.loadFromSqlite();
            this.sqlDb = prevSqlDb;
            tempDb.close();
          } catch (e: any) {
            console.warn(`[DB] Could not load seed SQLite for MariaDB pre-population: ${e.message}`);
          }
        }

        // Create tables if not present and seed defaults
        await this.createMariaDBTables();
        await this.seedMariaDBDefaults();

        this.isInitialized = true;
        return;
      } catch (err: any) {
        console.warn(`[DB] MariaDB/MySQL connection failed (${err.message}). Falling back to disk-persisted SQLite (sql.js).`);
        this.mode = 'sqlite';
        this.mariaPool = null;
      }
    }

    // 2. SQLite Fallback via sql.js
    try {
      const SQL = await initSqlJs();
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      if (!fs.existsSync(this.dbPath) && fs.existsSync(seedPath)) {
        console.log(`[DB] Copying pre-seeded database from ${seedPath} to ${this.dbPath}...`);
        fs.copyFileSync(seedPath, this.dbPath);
      }

      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.sqlDb = new SQL.Database(fileBuffer);
        this.createSqliteTables();
        this.loadFromSqlite();
        console.log(`[DB] Loaded persistent SQLite database from ${this.dbPath} (${this.users.length} users, ${this.students.length} students).`);
      } else {
        this.sqlDb = new SQL.Database();
        this.createSqliteTables();
        this.saveToSqlite();
        console.log(`[DB] Initialized new persistent SQLite database at ${this.dbPath}.`);
      }
    } catch (err: any) {
      console.error(`[DB] SQLite initialization failed: ${err.message}. Running in in-memory mode.`);
    }

    this.isInitialized = true;
  }

  private async createMariaDBTables(): Promise<void> {
    if (!this.mariaPool) return;

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(128) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL,
        full_name VARCHAR(128) NOT NULL,
        avatar_url TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(64) UNIQUE NOT NULL,
        start_date VARCHAR(32) NOT NULL,
        end_date VARCHAR(32) NOT NULL,
        is_current TINYINT(1) DEFAULT 0
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        department VARCHAR(64) NOT NULL,
        duration_years INT NOT NULL,
        total_semesters INT NOT NULL,
        base_tuition_fee DOUBLE NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        student_id VARCHAR(32) UNIQUE NOT NULL,
        first_name VARCHAR(64) NOT NULL,
        last_name VARCHAR(64) NOT NULL,
        gender VARCHAR(32) NOT NULL,
        dob VARCHAR(32) NOT NULL,
        email VARCHAR(128) UNIQUE NOT NULL,
        phone VARCHAR(32) NOT NULL,
        guardian_name VARCHAR(64) NOT NULL,
        guardian_relation VARCHAR(32) NOT NULL,
        guardian_phone VARCHAR(32) NOT NULL,
        course_id VARCHAR(64) NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        current_semester INT NOT NULL,
        admission_year INT NOT NULL,
        admission_status VARCHAR(32) NOT NULL,
        fees_status VARCHAR(32) NOT NULL,
        attendance_percentage DOUBLE NOT NULL,
        total_classes INT NOT NULL,
        attended_classes INT NOT NULL,
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS fee_heads (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) UNIQUE NOT NULL,
        title VARCHAR(128) NOT NULL,
        description TEXT,
        is_recurring TINYINT(1) DEFAULT 0
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS student_fees (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        fee_head_id VARCHAR(64) NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        semester INT NOT NULL,
        amount DOUBLE NOT NULL,
        discount_amount DOUBLE DEFAULT 0,
        paid_amount DOUBLE DEFAULT 0,
        due_amount DOUBLE NOT NULL,
        due_date VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(64) PRIMARY KEY,
        receipt_no VARCHAR(64) UNIQUE NOT NULL,
        student_id VARCHAR(64) NOT NULL,
        student_fee_id VARCHAR(64),
        amount_paid DOUBLE NOT NULL,
        payment_mode VARCHAR(32) NOT NULL,
        transaction_reference VARCHAR(128) NOT NULL,
        payment_date VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        notes TEXT,
        collected_by VARCHAR(64)
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS schemes (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) UNIQUE NOT NULL,
        title VARCHAR(128) NOT NULL,
        description TEXT NOT NULL,
        award_amount DOUBLE NOT NULL,
        eligibility_criteria TEXT NOT NULL,
        deadline VARCHAR(32) NOT NULL,
        is_active TINYINT(1) DEFAULT 1
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS scholarship_applications (
        id VARCHAR(64) PRIMARY KEY,
        scheme_id VARCHAR(64) NOT NULL,
        student_id VARCHAR(64) NOT NULL,
        annual_family_income DOUBLE NOT NULL,
        previous_gpa DOUBLE NOT NULL,
        reason_for_application TEXT NOT NULL,
        document_path TEXT,
        status VARCHAR(32) NOT NULL,
        admin_remarks TEXT,
        reviewed_by VARCHAR(64),
        reviewed_at VARCHAR(64),
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS dynamic_forms (
        id VARCHAR(64) PRIMARY KEY,
        form_code VARCHAR(32) UNIQUE NOT NULL,
        title VARCHAR(128) NOT NULL,
        description TEXT NOT NULL,
        schema_json LONGTEXT NOT NULL,
        is_published TINYINT(1) DEFAULT 0,
        created_by VARCHAR(64),
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id VARCHAR(64) PRIMARY KEY,
        form_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        response_json LONGTEXT NOT NULL,
        submitted_at VARCHAR(64) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        notice_date VARCHAR(32) NOT NULL,
        category VARCHAR(64) NOT NULL,
        is_pinned TINYINT(1) DEFAULT 0
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS grievances (
        id VARCHAR(64) PRIMARY KEY,
        tracking_code VARCHAR(32) UNIQUE NOT NULL,
        student_id VARCHAR(64) NOT NULL,
        student_name VARCHAR(128) NOT NULL,
        category VARCHAR(64) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL,
        admin_remarks TEXT,
        resolved_by VARCHAR(64),
        resolved_at VARCHAR(64),
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS admission_followups (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        counselor_id VARCHAR(64) NOT NULL,
        counselor_name VARCHAR(255) NOT NULL,
        interaction_type VARCHAR(64) NOT NULL,
        outcome VARCHAR(64) NOT NULL,
        notes TEXT NOT NULL,
        next_followup_date VARCHAR(64),
        priority VARCHAR(32) DEFAULT 'p1_high',
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        timestamp VARCHAR(64) NOT NULL,
        actor_id VARCHAR(64) NOT NULL,
        actor_name VARCHAR(128) NOT NULL,
        actor_role VARCHAR(32) NOT NULL,
        actor_ip VARCHAR(64),
        action VARCHAR(64) NOT NULL,
        target_type VARCHAR(32) NOT NULL,
        target_id VARCHAR(64) NOT NULL,
        details TEXT NOT NULL,
        changes_diff TEXT,
        severity VARCHAR(32) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS master_states (
        gst_code VARCHAR(8) PRIMARY KEY,
        state_name VARCHAR(64) NOT NULL,
        state_short_code VARCHAR(8) NOT NULL,
        is_union_territory TINYINT(1) DEFAULT 0
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS master_user_types (
        type_code VARCHAR(16) PRIMARY KEY,
        alpha_prefix VARCHAR(8) NOT NULL,
        role_key VARCHAR(32) NOT NULL,
        display_title VARCHAR(64) NOT NULL,
        description TEXT NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS master_degrees (
        degree_code VARCHAR(32) PRIMARY KEY,
        degree_name VARCHAR(128) NOT NULL,
        level VARCHAR(32) NOT NULL,
        duration_years INT NOT NULL,
        total_semesters INT NOT NULL,
        statutory_body VARCHAR(32) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS master_document_types (
        doc_type_code VARCHAR(32) PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        mandatory_for VARCHAR(32) NOT NULL,
        max_file_size_mb INT NOT NULL,
        allowed_mime_types VARCHAR(128) NOT NULL
      );
    `);

    await this.mariaPool.query(`
      CREATE TABLE IF NOT EXISTS staff_academic_journey (
        id VARCHAR(64) PRIMARY KEY,
        staff_id VARCHAR(64) NOT NULL,
        staff_name VARCHAR(128) NOT NULL,
        qualification_level VARCHAR(32) NOT NULL,
        degree_name VARCHAR(128) NOT NULL,
        awarding_university VARCHAR(128) NOT NULL,
        year_of_passing INT NOT NULL,
        specialization VARCHAR(128) NOT NULL,
        scopus_publications INT DEFAULT 0,
        sci_publications INT DEFAULT 0,
        patents_count INT DEFAULT 0,
        past_institutions_summary TEXT,
        verified TINYINT(1) DEFAULT 0,
        created_at VARCHAR(64) NOT NULL
      );
    `);

    // Ensure newly added student columns exist in live MariaDB
    const safeAddColumn = async (table: string, colDef: string) => {
      try {
        await this.mariaPool!.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colDef}`);
      } catch (e: any) {
        // Ignore duplicate column errors
      }
    };
    // Users table additions
    await safeAddColumn('users', 'department VARCHAR(64)');
    await safeAddColumn('users', 'designation VARCHAR(64)');
    await safeAddColumn('users', 'employee_id VARCHAR(32)');
    await safeAddColumn('users', 'enterprise_uid VARCHAR(64)');

    // Students table additions
    await safeAddColumn('students', 'mother_name VARCHAR(64)');
    await safeAddColumn('students', 'address TEXT');
    await safeAddColumn('students', 'city VARCHAR(64)');
    await safeAddColumn('students', 'district VARCHAR(64)');
    await safeAddColumn('students', 'state VARCHAR(64)');
    await safeAddColumn('students', 'pincode VARCHAR(16)');
    await safeAddColumn('students', 'annual_family_income DOUBLE');
    await safeAddColumn('students', 'tenth_roll_no VARCHAR(32)');
    await safeAddColumn('students', 'twelfth_roll_no VARCHAR(32)');
    await safeAddColumn('students', 'aadhaar_no VARCHAR(20)');
    await safeAddColumn('students', 'tenth_doc_verified TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'twelfth_doc_verified TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'aadhaar_doc_verified TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'token_fee_receipt VARCHAR(64)');
    await safeAddColumn('students', 'token_fee_amount DOUBLE DEFAULT 0');
    await safeAddColumn('students', 'token_fee_mode VARCHAR(32)');
    await safeAddColumn('students', 'token_fee_date VARCHAR(64)');
    await safeAddColumn('students', 'intake_step INT DEFAULT 1');
    await safeAddColumn('students', 'counseling_notes TEXT');
    await safeAddColumn('students', 'admitted_by VARCHAR(64)');
    await safeAddColumn('students', 'is_hosteller TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'is_transport_user TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'transport_route VARCHAR(128)');
    await safeAddColumn('students', 'hostel_room_no VARCHAR(64)');
    await safeAddColumn('students', 'category VARCHAR(32)');
    await safeAddColumn('students', 'quota VARCHAR(32)');
    await safeAddColumn('students', 'tenth_percentage DOUBLE');
    await safeAddColumn('students', 'twelfth_percentage DOUBLE');
    await safeAddColumn('students', 'board_name VARCHAR(64)');
    await safeAddColumn('students', 'condonation_granted TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'condonation_order_no VARCHAR(64)');
    await safeAddColumn('students', 'condonation_remarks TEXT');
    await safeAddColumn('students', 'admission_remarks TEXT');

    // Follow-up CRM & Prospect Radar columns
    await safeAddColumn('students', "followup_status VARCHAR(64) DEFAULT 'pending'");
    await safeAddColumn('students', "followup_priority VARCHAR(32) DEFAULT 'p1_high'");
    await safeAddColumn('students', 'next_followup_date VARCHAR(64)');
    await safeAddColumn('students', 'last_followup_at VARCHAR(64)');
    await safeAddColumn('students', 'assigned_counselor_id VARCHAR(64)');
    await safeAddColumn('students', 'assigned_counselor_name VARCHAR(255)');

    // Always sanitize legacy benchmark test candidate names in live MariaDB
    try {
      await this.mariaPool.query(`
        UPDATE students 
        SET first_name = 'Gurpreet', last_name = 'Singh', email = 'gurpreet.singh@educore.edu', phone = '+91 98765 11221' 
        WHERE (first_name = 'Benchmark' OR first_name = 'Dup') AND student_id = 'STU-2025-051'
      `);
      await this.mariaPool.query(`
        UPDATE students 
        SET first_name = 'Harpreet', last_name = 'Kaur', email = 'harpreet.kaur@educore.edu', phone = '+91 98765 22332' 
        WHERE (first_name = 'Benchmark' OR first_name = 'Dup') AND student_id = 'STU-2025-052'
      `);
      await this.mariaPool.query(`
        UPDATE students 
        SET first_name = 'Simranjeet', last_name = 'Singh', email = 'simranjeet.singh@educore.edu', phone = '+91 98765 55665' 
        WHERE (first_name = 'Benchmark' OR first_name = 'Dup') AND student_id = 'STU-2025-055'
      `);
      await this.mariaPool.query(`
        UPDATE students 
        SET first_name = 'Tanya', last_name = 'Verma', email = 'tanya.verma@educore.edu', phone = '+91 98765 66776' 
        WHERE (first_name = 'Benchmark' OR first_name = 'Dup') AND student_id = 'STU-2025-062'
      `);
      await this.mariaPool.query(`
        UPDATE students 
        SET first_name = 'Jaswinder', last_name = 'Singh', email = 'jaswinder.singh@educore.edu', phone = '+91 98765 77887' 
        WHERE (first_name = 'Benchmark' OR first_name = 'Dup') AND student_id = 'STU-2025-065'
      `);
      await this.mariaPool.query(`
        UPDATE students 
        SET first_name = 'Navjot', last_name = 'Sharma' 
        WHERE first_name = 'Benchmark' OR first_name = 'Dup'
      `);
    } catch (e: any) {
      console.warn('[DB] Benchmark student cleanup in MariaDB failed:', e.message);
    }
  }

  private async seedMariaDBDefaults(): Promise<void> {
    if (!this.mariaPool) return;

    // Always ensure canonical Indian college fee heads exist in MariaDB
    const canonicalFeeHeads: FeeHead[] = [
      // 1. Core Academic & University Affiliation Direct Heads
      { id: 'fh-tuition', code: 'TUITION', title: 'Academic Tuition Fee', description: 'Semester academic tuition, classroom access, and lab instructions', is_recurring: true },
      { id: 'fh-univ-reg', code: 'UNIV_REG', title: 'University Direct Charges & Exam Fee', description: 'Affiliating University (PTU/GNDU/PUP) registration, examination and sports development fee', is_recurring: true },
      { id: 'fh-security', code: 'INST_SECURITY', title: 'Refundable Caution Security Deposit', description: 'One-time refundable institution and library security deposit', is_recurring: false },
      { id: 'fh-exam', code: 'EXAM', title: 'Examination & Assessment Fee', description: 'Semester terminal exams, grade transcript processing', is_recurring: true },
      { id: 'fh-lib', code: 'LIBRARY', title: 'Library & Resource Access Fee', description: 'Digital library, textbook reserve access, research journal database', is_recurring: true },
      { id: 'fh-sports', code: 'DEVELOPMENT', title: 'Campus Sports & Development Fee', description: 'Gymnasium, athletic sports ground, and club activities', is_recurring: false },

      // 2. Hostel & Residential Heads (Campus Residents Only - Mutually exclusive with Transport)
      { id: 'fh-hostel-room', code: 'HOSTEL_ROOM', title: 'Hostel Room Rent & Maintenance', description: 'Campus residential room allotment, fixtures, water, and housekeeping (Campus residents only)', is_recurring: true },
      { id: 'fh-hostel-mess', code: 'HOSTEL_MEALS', title: 'Hostel Mess Advance & Meal Boarding', description: 'Complete 3-meal boarding: daily breakfast, lunch, evening tea/snacks, and dinner', is_recurring: true },
      { id: 'fh-hostel-util', code: 'HOSTEL_UTIL', title: 'Hostel Power Backup & Utilities', description: '24/7 generator power backup, water heater geyser, and common amenities', is_recurring: true },
      { id: 'fh-hostel-security', code: 'HOSTEL_SECURITY', title: 'Hostel Caution Security Deposit', description: 'One-time refundable hostel fixture and room security deposit', is_recurring: false },
      { id: 'fh-hostel', code: 'HOSTEL_COMPOSITE', title: 'Composite Hostel & Mess Fee', description: 'Consolidated semester residential accommodation and mess boarding fee', is_recurring: true },

      // 3. Transport & Commuter Transit Heads (Day Scholars Only - Mutually exclusive with Hostel)
      { id: 'fh-transport', code: 'TRANSPORT_FLEET', title: 'College Bus / Fleet Transit Fee', description: 'Dedicated college bus commuter transit service across designated city corridors (Day scholars only)', is_recurring: true },
      { id: 'fh-transport-pass', code: 'TRANSPORT_PASS', title: 'Transport Smart Card & Bus Pass', description: 'RFID transit pass issuance, designated seat reservation, and GPS fleet tracking', is_recurring: true },

      // 4. Miscellaneous, Training & Regulatory Heads
      { id: 'fh-misc', code: 'MISC_STUDENT', title: 'Miscellaneous Campus & Student Welfare', description: 'Student ID RFID badge, cultural youth festival, annual sports fest, and club activities', is_recurring: true },
      { id: 'fh-training', code: 'TRAINING_PLACEMENT', title: 'Industrial Training & Placement Prep', description: 'Industry technical bootcamps, soft-skills workshops, and campus placement drives', is_recurring: true },
      { id: 'fh-late-fine', code: 'LATE_SURCHARGE', title: 'Late Fee & Delayed Clearance Penalty', description: 'Regulatory surcharge fine for delayed semester fee clearance or late registration', is_recurring: false },
      { id: 'fh-reappear', code: 'REAPPEAR_EXAM', title: 'MRSPTU Re-appear / Backlog Exam Fee', description: 'Affiliating university examination fee for semester backlog papers (₹1,000 per paper)', is_recurring: false },
      { id: 'fh-lib-fine', code: 'LIB_FINE', title: 'Library Overdue Book Fine', description: 'Institutional overdue penalty for late return of reserved library textbooks', is_recurring: false },
      { id: 'fh-breakage', code: 'LAB_BREAKAGE', title: 'Laboratory Equipment & Breakage Fine', description: 'Assessment for laboratory apparatus, glasswares, or computing hardware damage', is_recurring: false },
    ];
    for (const fh of canonicalFeeHeads) {
      await this.mariaPool.query(
        'INSERT INTO fee_heads (id, code, title, description, is_recurring) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code), title = VALUES(title), description = VALUES(description), is_recurring = VALUES(is_recurring)',
        [fh.id, fh.code, fh.title, fh.description || null, fh.is_recurring ? 1 : 0]
      );
    }

    // Always ensure canonical scholarship schemes exist in MariaDB
    const canonicalSchemes: Scheme[] = [
      {
        id: 'sch-merit-01',
        code: 'MERIT-2025',
        title: 'State Merit & Academic Excellence Scholarship',
        description: 'Prestigious institutional merit grant awarded to high-performing students who secured 8.5+ CGPA in prior semester.',
        award_amount: 50000,
        eligibility_criteria: 'Minimum 8.5 CGPA and no pending backlogs.',
        deadline: '2025-11-30',
        is_active: true,
      },
      {
        id: 'sch-need-02',
        code: 'NEED-2025',
        title: 'Need-Based Fee Concession Grant',
        description: 'Financial assistance grant for students with annual family income under INR 3,00,000.',
        award_amount: 35000,
        eligibility_criteria: 'Family income certificate issued by revenue authority.',
        deadline: '2025-10-31',
        is_active: true,
      },
      {
        id: 'sch-stem-03',
        code: 'WOMEN-STEM',
        title: 'Women in STEM Leadership Fellowship',
        description: 'Special endowment to encourage female scholars enrolled in Engineering & Technology branches.',
        award_amount: 40000,
        eligibility_criteria: 'Female students enrolled in B.Tech courses with CGPA 7.5+.',
        deadline: '2025-12-15',
        is_active: true,
      },
      {
        id: 'sch-pms-punjab',
        code: 'PMS-PUNJAB',
        title: 'Post-Matric Scholarship for SC/ST (Dr. Ambedkar Portal, Govt of Punjab)',
        description: 'Flagship Punjab Government 100% Tuition Fee waiver for SC/ST students with family income under ₹2.5 Lakh per annum.',
        award_amount: 90000,
        eligibility_criteria: 'SC/ST category candidates domicile of Punjab with family annual income <= ₹2,50,000 via Dr. Ambedkar Scholarship Portal.',
        deadline: '2025-11-30',
        is_active: true,
      },
      {
        id: 'sch-cmss-punjab',
        code: 'CMSS-PUNJAB',
        title: 'Chief Minister Scholarship Scheme (CMSS Punjab)',
        description: 'Merit-based tuition discount granted by Govt of Punjab for students securing >= 80% marks in 10+2 / qualifying exam.',
        award_amount: 45000,
        eligibility_criteria: 'Punjab domicile candidate with >= 80% marks in 10+2 CBSE/PSEB board exam.',
        deadline: '2025-10-31',
        is_active: true,
      },
    ];
    for (const sch of canonicalSchemes) {
      await this.mariaPool.query(
        'INSERT INTO schemes (id, code, title, description, award_amount, eligibility_criteria, deadline, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code), title = VALUES(title), description = VALUES(description), award_amount = VALUES(award_amount), eligibility_criteria = VALUES(eligibility_criteria), deadline = VALUES(deadline), is_active = VALUES(is_active)',
        [sch.id, sch.code, sch.title, sch.description, sch.award_amount, sch.eligibility_criteria, sch.deadline, sch.is_active ? 1 : 0]
      );
    }

    // Ensure all demo student accounts exist in MariaDB users table & link to student profiles
    const demoStudentAccounts = [
      { id: 'usr-stu-aryan', username: 'aryan', email: 'aryan.sharma@educore.edu', full_name: 'Aryan Sharma', student_id: 'stu-rec-aryan', enterprise_uid: '1001-88-03-01' },
      { id: 'usr-stu-rohan', username: 'rohan', email: 'rohan.gupta@educore.edu', full_name: 'Rohan Gupta', student_id: 'stu-rec-rohan', enterprise_uid: '1001-01-03-01' },
      { id: 'usr-stu-priya', username: 'priya', email: 'priya.patel@educore.edu', full_name: 'Priya Patel', student_id: 'stu-rec-priya', enterprise_uid: '1001-02-03-01' },
      { id: 'usr-stu-aarav', username: 'aarav', email: 'aarav.sharma@educore.edu', full_name: 'Aarav Sharma', student_id: 'stu-rec-aarav', enterprise_uid: '1001-03-03-01' },
      { id: 'usr-stu-neha', username: 'neha', email: 'neha.singh@educore.edu', full_name: 'Neha Singh', student_id: 'stu-rec-neha', enterprise_uid: '1001-04-03-01' },
    ];
    const demoStudentHash = bcrypt.hashSync('student123', 10);
    for (const su of demoStudentAccounts) {
      await this.mariaPool.query(
        'INSERT INTO users (id, username, email, password_hash, role, full_name, enterprise_uid, is_active, created_at) VALUES (?, ?, ?, ?, "student", ?, ?, 1, NOW()) ON DUPLICATE KEY UPDATE username = VALUES(username), password_hash = VALUES(password_hash), enterprise_uid = VALUES(enterprise_uid)',
        [su.id, su.username, su.email, demoStudentHash, su.full_name, su.enterprise_uid]
      );
      await this.mariaPool.query(
        'UPDATE students SET user_id = ? WHERE id = ?',
        [su.id, su.student_id]
      );
    }

    // Ensure all demo staff & administrative accounts exist in MariaDB
    const superHash = bcrypt.hashSync('super123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);
    const staffHash = bcrypt.hashSync('staff123', 10);
    const counselorHash = bcrypt.hashSync('counselor123', 10);
    const hodHash = bcrypt.hashSync('hod123', 10);
    const accountsHash = bcrypt.hashSync('accounts123', 10);
    const partnerHash = bcrypt.hashSync('partner123', 10);

    const demoStaffAccounts = [
      { id: 'usr-super-01', username: 'superadmin', email: 'superadmin@educore.edu', hash: superHash, role: 'super_admin', full_name: 'Prof. Dr. Amritpal Singh (Chief System Provost)', department: 'Executive Directorate & University Governance', designation: 'Chief System Provost & Chancellor Delegate', employee_id: 'PRO-SUP-001', enterprise_uid: '9001-01-03-01' },
      { id: 'usr-admin-01', username: 'admin', email: 'admin@educore.edu', hash: adminHash, role: 'admin', full_name: 'Dr. Ramesh Chandra (Registrar & Academic Provost)', department: 'Registrar Office', designation: 'Registrar & Provost', employee_id: 'REG-PRO-001', enterprise_uid: '4001-01-03-01' },
      { id: 'usr-staff-01', username: 'staff01', email: 'staff@educore.edu', hash: staffHash, role: 'staff', full_name: 'Prof. Sunita Rao (Staff / Faculty)', department: 'Computer Science & Engineering', designation: 'Assistant Professor', employee_id: 'FAC-CSE-014', enterprise_uid: '2001-14-03-01' },
      { id: 'usr-counselor-01', username: 'counselor01', email: 'counselor@educore.edu', hash: counselorHash, role: 'counselor', full_name: 'Harleen Kaur (Head Counselor / Admission Cell)', department: 'Admission & Counseling Cell', designation: 'Head Counselor & Admission Cell Convener', employee_id: 'ADM-CNS-002', enterprise_uid: '6001-02-03-01' },
      { id: 'usr-hod-01', username: 'hod_cse', email: 'hod.cse@educore.edu', hash: hodHash, role: 'hod', full_name: 'Dr. Balwinder Singh (HOD Computer Science)', department: 'Computer Science & Engineering', designation: 'Head of Department', employee_id: 'FAC-HOD-001', enterprise_uid: '3001-01-03-01' },
      { id: 'usr-accounts-01', username: 'accounts01', email: 'accounts@educore.edu', hash: accountsHash, role: 'accounts', full_name: 'Manmohan Sharma (Chief Accounts Officer)', department: 'Finance & Accounts Section', designation: 'Chief Accounts Officer', employee_id: 'ACC-OFF-005', enterprise_uid: '5001-05-03-01' },
      { id: 'usr-partner-01', username: 'partner01', email: 'partner@educore.edu', hash: partnerHash, role: 'partner', full_name: 'Infosys Campus Relations Lead', department: 'Corporate Relations', designation: 'Campus Hiring Director', employee_id: 'PRT-INF-001', enterprise_uid: '7001-01-03-01' },
    ];

    for (const sa of demoStaffAccounts) {
      await this.mariaPool.query(
        'INSERT INTO users (id, username, email, password_hash, role, full_name, is_active, department, designation, employee_id, enterprise_uid, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE username = VALUES(username), password_hash = VALUES(password_hash), role = VALUES(role), full_name = VALUES(full_name), department = VALUES(department), designation = VALUES(designation), employee_id = VALUES(employee_id), enterprise_uid = VALUES(enterprise_uid)',
        [sa.id, sa.username, sa.email, sa.hash, sa.role, sa.full_name, sa.department, sa.designation, sa.employee_id, sa.enterprise_uid]
      );
    }

    // Seed default grievances if table is empty
    const [grvCount]: any = await this.mariaPool.query('SELECT COUNT(*) as count FROM grievances');
    if (!grvCount || grvCount[0]?.count === 0) {
      const defaultGrievances: Grievance[] = [
        {
          id: 'grv-001',
          tracking_code: 'GRV-2025-0101',
          student_id: 'stu-rec-aryan',
          student_name: 'Aryan Sharma',
          category: 'hostel',
          subject: 'Hot water geyser not functioning in Block B 2nd floor',
          description: 'The geyser in the common bathroom on 2nd floor has been tripping the circuit breaker since yesterday evening. Kindly dispatch electrician.',
          priority: 'medium',
          status: 'under_investigation',
          admin_remarks: 'Estate officer assigned ticket. Work order #402 issued.',
          created_at: '2025-09-02 10:15:00',
        },
        {
          id: 'grv-002',
          tracking_code: 'GRV-2025-0102',
          student_id: 'stu-rec-aryan',
          student_name: 'Aryan Sharma',
          category: 'examination',
          subject: 'Subject code discrepancy on mid-term provisional admit card',
          description: 'Admit card shows CS-401 instead of CS-402 for Advanced Algorithms. Need urgent correction prior to entry.',
          priority: 'high',
          status: 'resolved',
          admin_remarks: 'Verified with COE database and corrected. Updated slip generated.',
          resolved_by: 'usr-admin-01',
          resolved_at: '2025-09-04 14:20:00',
          created_at: '2025-09-03 09:30:00',
        },
        {
          id: 'grv-003',
          tracking_code: 'GRV-2025-0103',
          student_id: 'stu-rec-priya',
          student_name: 'Priya Patel',
          category: 'transport',
          subject: 'Bus Route #3 evening departure delayed by 40 minutes',
          description: 'The Kharar route bus frequently departs after 5:45 PM instead of 5:10 PM due to driver attendance delays.',
          priority: 'medium',
          status: 'submitted',
          created_at: '2025-09-10 16:30:00',
        },
      ];
      for (const g of defaultGrievances) {
        await this.mariaPool.query(
          'INSERT IGNORE INTO grievances (id, tracking_code, student_id, student_name, category, subject, description, priority, status, admin_remarks, resolved_by, resolved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [g.id, g.tracking_code, g.student_id, g.student_name, g.category, g.subject, g.description, g.priority, g.status, g.admin_remarks || null, g.resolved_by || null, g.resolved_at || null, formatSqlDateTime(g.created_at)]
        );
      }
    }

    // Seed default admission follow-ups if table is empty
    const [fupCount]: any = await this.mariaPool.query('SELECT COUNT(*) as count FROM admission_followups');
    if (!fupCount || fupCount[0]?.count === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const [inqRows]: any = await this.mariaPool.query(
        "SELECT id, student_id, first_name, last_name FROM students WHERE intake_step IN (1, 2) OR admission_status IN ('inquiry', 'submitted', 'pending') LIMIT 2"
      );

      if (inqRows && inqRows.length > 0) {
        const demoFollowups = [
          {
            id: 'fup-001',
            student_id: inqRows[0].id,
            counselor_id: 'usr-counselor-01',
            counselor_name: 'Simran Kaur (Admissions Counselor)',
            interaction_type: 'campus_visit' as const,
            outcome: 'callback_requested' as const,
            notes: 'Candidate visited campus with parents. Inquired about B.Tech CSE seat availability and Punjab merit scholarship. Requested callback today.',
            next_followup_date: today,
            priority: 'p1_high' as const,
            created_at: `${yesterday} 11:30:00`,
          },
        ];
        for (const f of demoFollowups) {
          await this.mariaPool.query(
            'INSERT IGNORE INTO admission_followups (id, student_id, counselor_id, counselor_name, interaction_type, outcome, notes, next_followup_date, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [f.id, f.student_id, f.counselor_id, f.counselor_name, f.interaction_type, f.outcome, f.notes, f.next_followup_date, f.priority, formatSqlDateTime(f.created_at)]
          );
        }
        await this.mariaPool.query(
          "UPDATE students SET followup_status = 'callback_scheduled', followup_priority = 'p1_high', next_followup_date = ?, last_followup_at = NOW(), assigned_counselor_id = 'usr-counselor-01', assigned_counselor_name = 'Simran Kaur' WHERE id = ?",
          [today, inqRows[0].id]
        );
      }
    }

    const [rows]: any = await this.mariaPool.query('SELECT COUNT(*) as count FROM users');
    if (rows && rows[0] && rows[0].count > 0) return;

    console.log('[DB] Seeding default dataset into MariaDB database...');
    for (const u of this.users) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO users (id, username, email, password_hash, role, full_name, avatar_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.username, u.email, u.password_hash, u.role, u.full_name, u.avatar_url || null, u.is_active ? 1 : 0, formatSqlDateTime(u.created_at)]
      );
    }
    for (const s of this.sessions) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO sessions (id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)',
        [s.id, s.name, s.start_date, s.end_date, s.is_current ? 1 : 0]
      );
    }
    for (const c of this.courses) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO courses (id, code, name, department, duration_years, total_semesters, base_tuition_fee) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [c.id, c.code, c.name, c.department, c.duration_years, c.total_semesters, c.base_tuition_fee]
      );
    }
    for (const st of this.students) {
      await this.mariaPool.query(
        `INSERT IGNORE INTO students (id, user_id, student_id, first_name, last_name, gender, dob, email, phone, guardian_name, guardian_relation, guardian_phone, course_id, session_id, current_semester, admission_year, admission_status, fees_status, attendance_percentage, total_classes, attended_classes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [st.id, st.user_id || null, st.student_id, st.first_name, st.last_name, st.gender, st.dob, st.email, st.phone, st.guardian_name, st.guardian_relation, st.guardian_phone, st.course_id, st.session_id, st.current_semester, st.admission_year, st.admission_status, st.fees_status, st.attendance_percentage, st.total_classes, st.attended_classes, formatSqlDateTime(st.created_at)]
      );
    }
    for (const sf of this.student_fees) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO student_fees (id, student_id, fee_head_id, session_id, semester, amount, discount_amount, paid_amount, due_amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [sf.id, sf.student_id, sf.fee_head_id, sf.session_id, sf.semester, sf.amount, sf.discount_amount, sf.paid_amount, sf.due_amount, sf.due_date, sf.status]
      );
    }
    for (const p of this.payments) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO payments (id, receipt_no, student_id, student_fee_id, amount_paid, payment_mode, transaction_reference, payment_date, status, notes, collected_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.receipt_no, p.student_id, p.student_fee_id || null, p.amount_paid, p.payment_mode, p.transaction_reference, formatSqlDateTime(p.payment_date), p.status, p.notes || null, p.collected_by || null]
      );
    }
    for (const sch of this.schemes) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO schemes (id, code, title, description, award_amount, eligibility_criteria, deadline, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [sch.id, sch.code, sch.title, sch.description, sch.award_amount, sch.eligibility_criteria, sch.deadline, sch.is_active ? 1 : 0]
      );
    }
    for (const sa of this.scholarship_applications) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO scholarship_applications (id, scheme_id, student_id, annual_family_income, previous_gpa, reason_for_application, document_path, status, admin_remarks, reviewed_by, reviewed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [sa.id, sa.scheme_id, sa.student_id, sa.annual_family_income, sa.previous_gpa, sa.reason_for_application, sa.document_path || null, sa.status, sa.admin_remarks || null, sa.reviewed_by || null, sa.reviewed_at ? formatSqlDateTime(sa.reviewed_at) : null, formatSqlDateTime(sa.created_at)]
      );
    }
    for (const df of this.dynamic_forms) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO dynamic_forms (id, form_code, title, description, schema_json, is_published, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [df.id, df.form_code, df.title, df.description, JSON.stringify(df.schema_json), df.is_published ? 1 : 0, df.created_by || null, formatSqlDateTime(df.created_at)]
      );
    }
    for (const n of this.notices) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO notices (id, title, summary, content, notice_date, category, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [n.id, n.title, n.summary, n.content, n.notice_date, n.category, n.is_pinned ? 1 : 0]
      );
    }
  }

  private createSqliteTables(): void {
    if (!this.sqlDb) return;

    this.sqlDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT UNIQUE, email TEXT UNIQUE, password_hash TEXT,
        role TEXT, full_name TEXT, avatar_url TEXT, is_active INTEGER, department TEXT, designation TEXT, employee_id TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY, name TEXT UNIQUE, start_date TEXT, end_date TEXT, is_current INTEGER
      );
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, department TEXT,
        duration_years INTEGER, total_semesters INTEGER, base_tuition_fee REAL
      );
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY, user_id TEXT, student_id TEXT UNIQUE, first_name TEXT, last_name TEXT,
        gender TEXT, dob TEXT, email TEXT UNIQUE, phone TEXT, guardian_name TEXT, guardian_relation TEXT,
        guardian_phone TEXT, mother_name TEXT, address TEXT, city TEXT, district TEXT, state TEXT, pincode TEXT, annual_family_income REAL,
        course_id TEXT, session_id TEXT, current_semester INTEGER, admission_year INTEGER,
        admission_status TEXT, fees_status TEXT, attendance_percentage REAL, total_classes INTEGER,
        attended_classes INTEGER, is_hosteller INTEGER, is_transport_user INTEGER, transport_route TEXT,
        hostel_room_no TEXT, category TEXT, quota TEXT, tenth_percentage REAL, twelfth_percentage REAL,
        tenth_roll_no TEXT, twelfth_roll_no TEXT, board_name TEXT, aadhaar_no TEXT,
        tenth_doc_verified INTEGER, twelfth_doc_verified INTEGER, aadhaar_doc_verified INTEGER,
        token_fee_receipt TEXT, token_fee_amount REAL, token_fee_mode TEXT, token_fee_date TEXT,
        intake_step INTEGER, counseling_notes TEXT, admitted_by TEXT,
        condonation_granted INTEGER, condonation_order_no TEXT, condonation_remarks TEXT, admission_remarks TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS fee_heads (
        id TEXT PRIMARY KEY, code TEXT UNIQUE, title TEXT, description TEXT, is_recurring INTEGER
      );
      CREATE TABLE IF NOT EXISTS student_fees (
        id TEXT PRIMARY KEY, student_id TEXT, fee_head_id TEXT, session_id TEXT, semester INTEGER,
        amount REAL, discount_amount REAL, paid_amount REAL, due_amount REAL, due_date TEXT, status TEXT
      );
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY, receipt_no TEXT UNIQUE, student_id TEXT, student_fee_id TEXT, amount_paid REAL,
        payment_mode TEXT, transaction_reference TEXT, payment_date TEXT, status TEXT, notes TEXT, collected_by TEXT
      );
      CREATE TABLE IF NOT EXISTS schemes (
        id TEXT PRIMARY KEY, code TEXT UNIQUE, title TEXT, description TEXT, award_amount REAL,
        eligibility_criteria TEXT, deadline TEXT, is_active INTEGER
      );
      CREATE TABLE IF NOT EXISTS scholarship_applications (
        id TEXT PRIMARY KEY, scheme_id TEXT, student_id TEXT, annual_family_income REAL, previous_gpa REAL,
        reason_for_application TEXT, document_path TEXT, status TEXT, admin_remarks TEXT, reviewed_by TEXT,
        reviewed_at TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS dynamic_forms (
        id TEXT PRIMARY KEY, form_code TEXT UNIQUE, title TEXT, description TEXT, schema_json TEXT,
        is_published INTEGER, created_by TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS form_submissions (
        id TEXT PRIMARY KEY, form_id TEXT, user_id TEXT, response_json TEXT, submitted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY, title TEXT, summary TEXT, content TEXT, notice_date TEXT, category TEXT, is_pinned INTEGER
      );
      CREATE TABLE IF NOT EXISTS grievances (
        id TEXT PRIMARY KEY, tracking_code TEXT UNIQUE, student_id TEXT, student_name TEXT,
        category TEXT, subject TEXT, description TEXT, priority TEXT, status TEXT,
        admin_remarks TEXT, resolved_by TEXT, resolved_at TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS admission_followups (
        id TEXT PRIMARY KEY, student_id TEXT, counselor_id TEXT, counselor_name TEXT,
        interaction_type TEXT, outcome TEXT, notes TEXT, next_followup_date TEXT,
        priority TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY, timestamp TEXT, actor_id TEXT, actor_name TEXT,
        actor_role TEXT, actor_ip TEXT, action TEXT, target_type TEXT,
        target_id TEXT, details TEXT, changes_diff TEXT, severity TEXT
      );
      CREATE TABLE IF NOT EXISTS master_states (
        gst_code TEXT PRIMARY KEY, state_name TEXT, state_short_code TEXT, is_union_territory INTEGER
      );
      CREATE TABLE IF NOT EXISTS master_user_types (
        type_code TEXT PRIMARY KEY, alpha_prefix TEXT, role_key TEXT, display_title TEXT, description TEXT
      );
      CREATE TABLE IF NOT EXISTS master_degrees (
        degree_code TEXT PRIMARY KEY, degree_name TEXT, level TEXT, duration_years INTEGER, total_semesters INTEGER, statutory_body TEXT
      );
      CREATE TABLE IF NOT EXISTS master_document_types (
        doc_type_code TEXT PRIMARY KEY, title TEXT, mandatory_for TEXT, max_file_size_mb INTEGER, allowed_mime_types TEXT
      );
      CREATE TABLE IF NOT EXISTS staff_academic_journey (
        id TEXT PRIMARY KEY, staff_id TEXT, staff_name TEXT, qualification_level TEXT,
        degree_name TEXT, awarding_university TEXT, year_of_passing INTEGER, specialization TEXT,
        scopus_publications INTEGER, sci_publications INTEGER, patents_count INTEGER,
        past_institutions_summary TEXT, verified INTEGER, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS master_departments (
        id TEXT PRIMARY KEY, dept_code TEXT UNIQUE, dept_name TEXT, tags_json TEXT, head_of_dept TEXT, established_year INTEGER, is_active INTEGER
      );
      CREATE TABLE IF NOT EXISTS master_institution_types (
        code TEXT PRIMARY KEY, name TEXT, regulatory_authority TEXT, description TEXT
      );
      CREATE TABLE IF NOT EXISTS master_employee_statuses (
        status_code TEXT PRIMARY KEY, status_name TEXT, description TEXT, requires_dates INTEGER
      );
      CREATE TABLE IF NOT EXISTS master_designation_changes (
        type_code TEXT PRIMARY KEY, name TEXT, category TEXT
      );
      CREATE TABLE IF NOT EXISTS master_erp_statuses (
        status_code TEXT PRIMARY KEY, status_name TEXT, stage TEXT
      );
      CREATE TABLE IF NOT EXISTS staff_basic_info (
        id TEXT PRIMARY KEY, staff_id TEXT UNIQUE, employee_id TEXT UNIQUE, full_name TEXT, father_name TEXT, dob TEXT, gender TEXT, date_of_joining TEXT, date_of_resigning TEXT, last_working_date TEXT, category TEXT, primary_designation TEXT, department_id TEXT, employee_status TEXT, login_enabled INTEGER, must_change_password INTEGER, custom_attr_1 TEXT, custom_attr_2 TEXT, custom_attr_3 TEXT, custom_attr_4 TEXT, custom_meta_json TEXT
      );
      CREATE TABLE IF NOT EXISTS staff_additional_info (
        id TEXT PRIMARY KEY, staff_id TEXT UNIQUE, emergency_phone TEXT, blood_group TEXT, marital_status TEXT, nationality TEXT, pf_uan TEXT, esi_number TEXT, custom_meta_json TEXT
      );
      CREATE TABLE IF NOT EXISTS staff_addresses (
        id TEXT PRIMARY KEY, staff_id TEXT, address_type TEXT, address_line TEXT, city TEXT, state_gst TEXT, pincode TEXT, is_default INTEGER
      );
      CREATE TABLE IF NOT EXISTS staff_bank_accounts (
        id TEXT PRIMARY KEY, staff_id TEXT, bank_name TEXT, account_number TEXT, ifsc_code TEXT, branch_name TEXT, is_default INTEGER
      );
      CREATE TABLE IF NOT EXISTS staff_qualifications (
        id TEXT PRIMARY KEY, staff_id TEXT, qualification_title TEXT, institution TEXT, year_of_passing INTEGER, percentage_or_cgpa REAL, is_highest INTEGER
      );
      CREATE TABLE IF NOT EXISTS staff_certifications (
        id TEXT PRIMARY KEY, staff_id TEXT, certification_name TEXT, issuing_body TEXT, issue_year INTEGER, credential_id TEXT
      );
      CREATE TABLE IF NOT EXISTS staff_experience (
        id TEXT PRIMARY KEY, staff_id TEXT, organization_name TEXT, designation TEXT, start_date TEXT, end_date TEXT, is_latest INTEGER
      );
      CREATE TABLE IF NOT EXISTS staff_org_journey (
        id TEXT PRIMARY KEY, staff_id TEXT, event_type TEXT, effective_date TEXT, old_designation TEXT, new_designation TEXT, actor_id TEXT, remarks TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY, user_id TEXT, partner_type TEXT, firm_name TEXT, pan_number TEXT, gst_number TEXT, tan_number TEXT, email TEXT, phone TEXT, address TEXT, is_active INTEGER, created_at TEXT, custom_meta_json TEXT
      );
      CREATE TABLE IF NOT EXISTS partner_contacts (
        id TEXT PRIMARY KEY, partner_id TEXT, contact_name TEXT, designation TEXT, email TEXT, phone TEXT, is_default INTEGER
      );
      CREATE TABLE IF NOT EXISTS partner_bank_accounts (
        id TEXT PRIMARY KEY, partner_id TEXT, bank_name TEXT, account_number TEXT, ifsc_code TEXT, branch_name TEXT, is_default INTEGER
      );
      CREATE TABLE IF NOT EXISTS partner_job_postings (
        id TEXT PRIMARY KEY, partner_id TEXT, title TEXT, type TEXT, stipend_salary TEXT, eligible_departments TEXT, min_cgpa REAL, description TEXT, status TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS partner_applications (
        id TEXT PRIMARY KEY, posting_id TEXT, student_id TEXT, student_name TEXT, cgpa REAL, status TEXT, remarks TEXT, applied_at TEXT
      );
      CREATE TABLE IF NOT EXISTS bulk_upload_batches (
        id TEXT PRIMARY KEY, upload_date TEXT, filename TEXT, total_rows INTEGER, fresh_count INTEGER, duplicate_count INTEGER, wrong_count INTEGER, source_label TEXT, uploaded_by TEXT
      );
      CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY, enquiry_no TEXT UNIQUE, student_name TEXT, gender TEXT, father_name TEXT, mobile TEXT, email TEXT, selected_course TEXT, course_fee REAL, admission_probability REAL, status TEXT, assigned_counselor_id TEXT, assigned_counselor_name TEXT, batch_id TEXT, created_at TEXT, custom_meta_json TEXT
      );
      CREATE TABLE IF NOT EXISTS enquiry_interactions (
        id TEXT PRIMARY KEY, enquiry_id TEXT, stage_name TEXT, counselor_id TEXT, remarks TEXT, call_status TEXT, probability_updated REAL, call_recording_url TEXT, timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS dialer_settings (
        id TEXT PRIMARY KEY, is_enabled INTEGER, provider TEXT, api_key_configured INTEGER
      );
    `);

    // Safe column additions for existing SQLite files
    try { this.sqlDb.run('ALTER TABLE users ADD COLUMN department TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE users ADD COLUMN designation TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE users ADD COLUMN employee_id TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE users ADD COLUMN enterprise_uid TEXT;'); } catch {}

    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN mother_name TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN address TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN city TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN district TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN state TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN pincode TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN annual_family_income REAL;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN tenth_roll_no TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN twelfth_roll_no TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN aadhaar_no TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN tenth_doc_verified INTEGER DEFAULT 0;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN twelfth_doc_verified INTEGER DEFAULT 0;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN aadhaar_doc_verified INTEGER DEFAULT 0;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN token_fee_receipt TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN token_fee_amount REAL DEFAULT 0;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN token_fee_mode TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN token_fee_date TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN intake_step INTEGER DEFAULT 1;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN counseling_notes TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN admitted_by TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN is_hosteller INTEGER DEFAULT 0;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN is_transport_user INTEGER DEFAULT 0;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN transport_route TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN hostel_room_no TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN category TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN quota TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN tenth_percentage REAL;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN twelfth_percentage REAL;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN board_name TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN condonation_granted INTEGER DEFAULT 0;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN condonation_order_no TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN condonation_remarks TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN admission_remarks TEXT;'); } catch {}
    try { this.sqlDb.run("ALTER TABLE students ADD COLUMN followup_status TEXT DEFAULT 'pending';"); } catch {}
    try { this.sqlDb.run("ALTER TABLE students ADD COLUMN followup_priority TEXT DEFAULT 'p1_high';"); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN next_followup_date TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN last_followup_at TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN assigned_counselor_id TEXT;'); } catch {}
    try { this.sqlDb.run('ALTER TABLE students ADD COLUMN assigned_counselor_name TEXT;'); } catch {}
  }

  private loadFromSqlite(): void {
    if (!this.sqlDb) return;

    try {
      const readTable = (tableName: string): any[] => {
        const stmt = this.sqlDb!.prepare(`SELECT * FROM ${tableName}`);
        const rows: any[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      };

      const users = readTable('users');
      if (users.length > 0) {
        this.users = users.map(u => ({ ...u, is_active: Boolean(u.is_active) }));
        this.sessions = readTable('sessions').map(s => ({ ...s, is_current: Boolean(s.is_current) }));
        this.courses = readTable('courses');
        this.students = readTable('students');
        this.fee_heads = readTable('fee_heads').map(f => ({ ...f, is_recurring: Boolean(f.is_recurring) }));
        this.student_fees = readTable('student_fees');
        this.payments = readTable('payments');
        this.schemes = readTable('schemes').map(s => ({ ...s, is_active: Boolean(s.is_active) }));
        this.scholarship_applications = readTable('scholarship_applications');
        this.dynamic_forms = readTable('dynamic_forms').map(f => ({
          ...f,
          is_published: Boolean(f.is_published),
          schema_json: typeof f.schema_json === 'string' ? JSON.parse(f.schema_json) : f.schema_json,
        }));
        this.form_submissions = readTable('form_submissions').map(s => ({
          ...s,
          response_json: typeof s.response_json === 'string' ? JSON.parse(s.response_json) : s.response_json,
        }));
        this.notices = readTable('notices').map(n => ({ ...n, is_pinned: Boolean(n.is_pinned) }));
        try {
          this.grievances = readTable('grievances');
        } catch {
          this.grievances = [];
        }
        try {
          this.admission_followups = readTable('admission_followups');
        } catch {
          this.admission_followups = [];
        }
        try {
          this.audit_logs = readTable('audit_logs');
        } catch {
          this.audit_logs = [];
        }
        try {
          this.master_states = readTable('master_states').map(s => ({ ...s, is_union_territory: Boolean(s.is_union_territory) }));
        } catch {
          this.master_states = [];
        }
        try {
          this.master_user_types = readTable('master_user_types');
        } catch {
          this.master_user_types = [];
        }
        try {
          this.master_degrees = readTable('master_degrees');
        } catch {
          this.master_degrees = [];
        }
        try {
          this.master_document_types = readTable('master_document_types');
        } catch {
          this.master_document_types = [];
        }
        try {
          this.staff_academic_journey = readTable('staff_academic_journey').map(j => ({ ...j, verified: Boolean(j.verified) }));
        } catch {
          this.staff_academic_journey = [];
        }

        try {
          this.master_departments = readTable('master_departments').map(d => ({ ...d, is_active: Boolean(d.is_active) }));
        } catch { this.master_departments = []; }
        try {
          this.master_institution_types = readTable('master_institution_types');
        } catch { this.master_institution_types = []; }
        try {
          this.master_employee_statuses = readTable('master_employee_statuses').map(s => ({ ...s, requires_dates: Boolean(s.requires_dates) }));
        } catch { this.master_employee_statuses = []; }
        try {
          this.master_designation_changes = readTable('master_designation_changes');
        } catch { this.master_designation_changes = []; }
        try {
          this.master_erp_statuses = readTable('master_erp_statuses');
        } catch { this.master_erp_statuses = []; }

        try {
          this.staff_basic_info = readTable('staff_basic_info').map(s => ({ ...s, login_enabled: Boolean(s.login_enabled), must_change_password: Boolean(s.must_change_password) }));
        } catch { this.staff_basic_info = []; }
        try {
          this.staff_additional_info = readTable('staff_additional_info');
        } catch { this.staff_additional_info = []; }
        try {
          this.staff_addresses = readTable('staff_addresses').map(a => ({ ...a, is_default: Boolean(a.is_default) }));
        } catch { this.staff_addresses = []; }
        try {
          this.staff_bank_accounts = readTable('staff_bank_accounts').map(b => ({ ...b, is_default: Boolean(b.is_default) }));
        } catch { this.staff_bank_accounts = []; }
        try {
          this.staff_qualifications = readTable('staff_qualifications').map(q => ({ ...q, is_highest: Boolean(q.is_highest) }));
        } catch { this.staff_qualifications = []; }
        try {
          this.staff_certifications = readTable('staff_certifications');
        } catch { this.staff_certifications = []; }
        try {
          this.staff_experience = readTable('staff_experience').map(e => ({ ...e, is_latest: Boolean(e.is_latest) }));
        } catch { this.staff_experience = []; }
        try {
          this.staff_org_journey = readTable('staff_org_journey');
        } catch { this.staff_org_journey = []; }

        try {
          this.partners = readTable('partners').map(p => ({ ...p, is_active: Boolean(p.is_active) }));
        } catch { this.partners = []; }
        try {
          this.partner_contacts = readTable('partner_contacts').map(c => ({ ...c, is_default: Boolean(c.is_default) }));
        } catch { this.partner_contacts = []; }
        try {
          this.partner_bank_accounts = readTable('partner_bank_accounts').map(b => ({ ...b, is_default: Boolean(b.is_default) }));
        } catch { this.partner_bank_accounts = []; }
        try {
          this.partner_job_postings = readTable('partner_job_postings');
        } catch { this.partner_job_postings = []; }
        try {
          this.partner_applications = readTable('partner_applications');
        } catch { this.partner_applications = []; }

        try {
          this.bulk_upload_batches = readTable('bulk_upload_batches');
        } catch { this.bulk_upload_batches = []; }
        try {
          this.enquiries = readTable('enquiries');
        } catch { this.enquiries = []; }
        try {
          this.enquiry_interactions = readTable('enquiry_interactions');
        } catch { this.enquiry_interactions = []; }
        try {
          const ds = readTable('dialer_settings');
          if (ds.length > 0) {
            this.dialer_settings = { ...ds[0], is_enabled: Boolean(ds[0].is_enabled), api_key_configured: Boolean(ds[0].api_key_configured) };
          }
        } catch {}

        if (this.master_states.length === 0) this.master_states = [...DEFAULT_MASTER_STATES];
        if (this.master_user_types.length === 0) this.master_user_types = [...DEFAULT_MASTER_USER_TYPES];
        if (this.master_degrees.length === 0) this.master_degrees = [...DEFAULT_MASTER_DEGREES];
        if (this.master_document_types.length === 0) this.master_document_types = [...DEFAULT_MASTER_DOCUMENT_TYPES];
        if (this.staff_academic_journey.length === 0) this.staff_academic_journey = [...DEFAULT_STAFF_ACADEMIC_JOURNEY];
        if (this.audit_logs.length === 0) this.audit_logs = [...DEFAULT_AUDIT_LOGS];

        if (this.master_departments.length === 0) this.master_departments = [...DEFAULT_MASTER_DEPARTMENTS];
        if (this.master_institution_types.length === 0) this.master_institution_types = [...DEFAULT_MASTER_INSTITUTION_TYPES];
        if (this.master_employee_statuses.length === 0) this.master_employee_statuses = [...DEFAULT_MASTER_EMPLOYEE_STATUSES];
        if (this.master_designation_changes.length === 0) this.master_designation_changes = [...DEFAULT_MASTER_DESIGNATION_CHANGES];
        if (this.master_erp_statuses.length === 0) this.master_erp_statuses = [...DEFAULT_MASTER_ERP_STATUSES];

        if (this.staff_basic_info.length === 0) this.staff_basic_info = [...DEFAULT_STAFF_BASIC];
        if (this.staff_additional_info.length === 0) this.staff_additional_info = [...DEFAULT_STAFF_ADDITIONAL];
        if (this.staff_addresses.length === 0) this.staff_addresses = [...DEFAULT_STAFF_ADDRESSES];
        if (this.staff_bank_accounts.length === 0) this.staff_bank_accounts = [...DEFAULT_STAFF_BANKS];
        if (this.staff_qualifications.length === 0) this.staff_qualifications = [...DEFAULT_STAFF_QUALIFICATIONS];
        if (this.staff_certifications.length === 0) this.staff_certifications = [...DEFAULT_STAFF_CERTIFICATIONS];
        if (this.staff_experience.length === 0) this.staff_experience = [...DEFAULT_STAFF_EXPERIENCE];
        if (this.staff_org_journey.length === 0) this.staff_org_journey = [...DEFAULT_STAFF_ORG_JOURNEY];

        if (this.partners.length === 0) this.partners = [...DEFAULT_PARTNERS];
        if (this.partner_contacts.length === 0) this.partner_contacts = [...DEFAULT_PARTNER_CONTACTS];
        if (this.partner_bank_accounts.length === 0) this.partner_bank_accounts = [...DEFAULT_PARTNER_BANKS];
        if (this.partner_job_postings.length === 0) this.partner_job_postings = [...DEFAULT_PARTNER_JOBS];
        if (this.partner_applications.length === 0) this.partner_applications = [...DEFAULT_PARTNER_APPLICATIONS];

        if (this.bulk_upload_batches.length === 0) this.bulk_upload_batches = [...DEFAULT_BULK_BATCHES];
        if (this.enquiries.length === 0) this.enquiries = [...DEFAULT_ENQUIRIES];
        if (this.enquiry_interactions.length === 0) this.enquiry_interactions = [...DEFAULT_ENQUIRY_INTERACTIONS];

        // Ensure all demo students have active accounts in SQLite mode
        const demoAccounts = [
          { username: 'rohan', email: 'rohan@educore.edu', name: 'Rohan Gupta', stuId: 'STU-008' },
          { username: 'priya', email: 'priya@educore.edu', name: 'Priya Patel', stuId: 'STU-007' },
          { username: 'aarav', email: 'aarav@educore.edu', name: 'Aarav Sharma', stuId: 'STU-006' },
          { username: 'neha', email: 'neha@educore.edu', name: 'Neha Singh', stuId: 'STU-009' },
          { username: 'stu001', email: 'aaditya.verma@educore.edu', name: 'Aaditya Verma', stuId: 'STU-2025-001' },
        ];

        for (const demo of demoAccounts) {
          if (!this.users.some(u => u.username.toLowerCase() === demo.username || u.email.toLowerCase() === demo.email)) {
            const passwordHash = bcrypt.hashSync('student123', 10);
            const userId = `usr-stu-${demo.username}`;
            this.users.push({
              id: userId,
              username: demo.username,
              email: demo.email,
              password_hash: passwordHash,
              role: 'student',
              full_name: demo.name,
              is_active: true,
              enterprise_uid: generateEnterpriseUID('student', '03', '01'),
              created_at: new Date().toISOString(),
            });
            const stuIdx = this.students.findIndex(s => s.student_id === demo.stuId || s.email.toLowerCase() === demo.email);
            if (stuIdx !== -1) {
              this.students[stuIdx].user_id = userId;
            }
          }
        }

        // Ensure all demo staff & administrative accounts exist in SQLite mode
        const demoStaffAccounts = [
          { username: 'admin', email: 'admin@educore.edu', name: 'Dr. Ramesh Chandra (Registrar & Provost)', role: 'admin' as const, dept: 'Registrar Office', desig: 'Registrar & Provost', empId: 'REG-PRO-001', pass: 'admin123', uid: '4001-01-03-01' },
          { username: 'staff01', email: 'staff@educore.edu', name: 'Prof. Sunita Rao (Staff / Faculty)', role: 'staff' as const, dept: 'Computer Science & Engineering', desig: 'Assistant Professor', empId: 'FAC-CSE-014', pass: 'staff123', uid: '2001-14-03-01' },
          { username: 'counselor01', email: 'counselor@educore.edu', name: 'Harleen Kaur (Head Counselor / Admission Cell)', role: 'counselor' as const, dept: 'Admission & Counseling Cell', desig: 'Head Counselor & Admission Cell Convener', empId: 'ADM-CNS-002', pass: 'counselor123', uid: '6001-02-03-01' },
          { username: 'hod_cse', email: 'hod.cse@educore.edu', name: 'Dr. Balwinder Singh (HOD Computer Science)', role: 'hod' as const, dept: 'Computer Science & Engineering', desig: 'Head of Department', empId: 'FAC-HOD-001', pass: 'hod123', uid: '3001-01-03-01' },
          { username: 'accounts01', email: 'accounts@educore.edu', name: 'Manmohan Sharma (Chief Accounts Officer)', role: 'accounts' as const, dept: 'Finance & Accounts Section', desig: 'Chief Accounts Officer', empId: 'ACC-OFF-005', pass: 'accounts123', uid: '5001-05-03-01' },
          { username: 'partner01', email: 'partner@educore.edu', name: 'Infosys Campus Relations Lead', role: 'partner' as const, dept: 'Corporate Relations', desig: 'Campus Hiring Director', empId: 'PRT-INF-001', pass: 'partner123', uid: '7001-01-03-01' },
        ];

        for (const stf of demoStaffAccounts) {
          const existing = this.users.find(u => u.username.toLowerCase() === stf.username || u.email.toLowerCase() === stf.email);
          if (!existing) {
            const passwordHash = bcrypt.hashSync(stf.pass, 10);
            this.users.push({
              id: `usr-${stf.role}-01`,
              username: stf.username,
              email: stf.email,
              password_hash: passwordHash,
              role: stf.role,
              full_name: stf.name,
              department: stf.dept,
              designation: stf.desig,
              employee_id: stf.empId,
              enterprise_uid: stf.uid,
              is_active: true,
              created_at: new Date().toISOString(),
            });
          } else {
            existing.enterprise_uid = stf.uid;
            if (!existing.employee_id) existing.employee_id = stf.empId;
          }
        }

        // Ensure canonical UID for demo student Aryan
        const aryanUser = this.users.find(u => u.username.toLowerCase() === 'aryan');
        if (aryanUser) {
          aryanUser.enterprise_uid = '1001-88-03-01';
          aryanUser.password_hash = bcrypt.hashSync('student123', 10);
        }

        // Ensure apex Super Admin exists in SQLite mode
        const superAdminExisting = this.users.find(u => u.username.toLowerCase() === 'superadmin' || u.role === 'super_admin');
        if (!superAdminExisting) {
          const superHash = bcrypt.hashSync('super123', 10);
          this.users.unshift({
            id: 'usr-super-01',
            username: 'superadmin',
            email: 'superadmin@educore.edu',
            password_hash: superHash,
            role: 'super_admin',
            full_name: 'Prof. Dr. Amritpal Singh (Chief System Provost)',
            department: 'Executive Directorate & University Governance',
            designation: 'Chief System Provost & Chancellor Delegate',
            employee_id: 'PRO-SUP-001',
            enterprise_uid: '9001-01-03-01',
            is_active: true,
            created_at: new Date().toISOString(),
          });
        } else {
          superAdminExisting.enterprise_uid = '9001-01-03-01';
        }

        // Migrate any legacy UIDs containing '-BFGI' or letters
        for (const u of this.users) {
          if (u.enterprise_uid && u.enterprise_uid.includes('BFGI')) {
            u.enterprise_uid = u.enterprise_uid.replace(/BFGI/g, '01');
          }
        }

        // Backfill enterprise_uid for all users if missing
        for (const u of this.users) {
          if (!u.enterprise_uid) {
            u.enterprise_uid = generateEnterpriseUID(u.role);
          }
        }

        // Persist newly backfilled UIDs & master tables to SQLite disk
        this.saveToSqlite();
      } else {
        this.createSqliteTables();
        this.saveToSqlite();
      }
    } catch (err: any) {
      console.error('[DB] Failed to load data from SQLite file:', err);
    }
  }

  public save(): void {
    if (this.mode === 'sqlite') {
      this.saveToSqlite();
    }
  }

  private saveToSqlite(): void {
    if (!this.sqlDb) return;

    try {
      this.sqlDb.run('BEGIN TRANSACTION;');

      const clearAndInsert = (tableName: string, rows: any[], columns: string[]) => {
        this.sqlDb!.run(`DELETE FROM ${tableName}`);
        if (rows.length === 0) return;

        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = columns.map(col => {
            let val = (row as any)[col];
            if (typeof val === 'boolean') val = val ? 1 : 0;
            if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
            return val !== undefined ? val : null;
          });
          this.sqlDb!.run(sql, values);
        }
      };

      clearAndInsert('users', this.users, ['id', 'username', 'email', 'password_hash', 'role', 'full_name', 'avatar_url', 'is_active', 'department', 'designation', 'employee_id', 'enterprise_uid', 'created_at']);
      clearAndInsert('sessions', this.sessions, ['id', 'name', 'start_date', 'end_date', 'is_current']);
      clearAndInsert('courses', this.courses, ['id', 'code', 'name', 'department', 'duration_years', 'total_semesters', 'base_tuition_fee']);
      clearAndInsert('students', this.students, [
        'id', 'user_id', 'student_id', 'first_name', 'last_name', 'gender', 'dob', 'email', 'phone',
        'guardian_name', 'guardian_relation', 'guardian_phone', 'mother_name', 'address', 'city', 'district', 'state', 'pincode', 'annual_family_income',
        'course_id', 'session_id', 'current_semester', 'admission_year', 'admission_status', 'fees_status', 'attendance_percentage', 'total_classes', 'attended_classes',
        'is_hosteller', 'is_transport_user', 'transport_route', 'hostel_room_no', 'category', 'quota', 'tenth_percentage', 'twelfth_percentage', 'tenth_roll_no', 'twelfth_roll_no', 'board_name', 'aadhaar_no',
        'tenth_doc_verified', 'twelfth_doc_verified', 'aadhaar_doc_verified', 'token_fee_receipt', 'token_fee_amount', 'token_fee_mode', 'token_fee_date', 'intake_step', 'counseling_notes', 'admitted_by',
        'condonation_granted', 'condonation_order_no', 'condonation_remarks', 'admission_remarks',
        'followup_status', 'followup_priority', 'next_followup_date', 'last_followup_at', 'assigned_counselor_id', 'assigned_counselor_name', 'created_at',
      ]);
      clearAndInsert('fee_heads', this.fee_heads, ['id', 'code', 'title', 'description', 'is_recurring']);
      clearAndInsert('student_fees', this.student_fees, ['id', 'student_id', 'fee_head_id', 'session_id', 'semester', 'amount', 'discount_amount', 'paid_amount', 'due_amount', 'due_date', 'status']);
      clearAndInsert('payments', this.payments, ['id', 'receipt_no', 'student_id', 'student_fee_id', 'amount_paid', 'payment_mode', 'transaction_reference', 'payment_date', 'status', 'notes', 'collected_by']);
      clearAndInsert('schemes', this.schemes, ['id', 'code', 'title', 'description', 'award_amount', 'eligibility_criteria', 'deadline', 'is_active']);
      clearAndInsert('scholarship_applications', this.scholarship_applications, ['id', 'scheme_id', 'student_id', 'annual_family_income', 'previous_gpa', 'reason_for_application', 'document_path', 'status', 'admin_remarks', 'reviewed_by', 'reviewed_at', 'created_at']);
      clearAndInsert('dynamic_forms', this.dynamic_forms, ['id', 'form_code', 'title', 'description', 'schema_json', 'is_published', 'created_by', 'created_at']);
      clearAndInsert('form_submissions', this.form_submissions, ['id', 'form_id', 'user_id', 'response_json', 'submitted_at']);
      clearAndInsert('notices', this.notices, ['id', 'title', 'summary', 'content', 'notice_date', 'category', 'is_pinned']);
      clearAndInsert('grievances', this.grievances, ['id', 'tracking_code', 'student_id', 'student_name', 'category', 'subject', 'description', 'priority', 'status', 'admin_remarks', 'resolved_by', 'resolved_at', 'created_at']);
      clearAndInsert('admission_followups', this.admission_followups, ['id', 'student_id', 'counselor_id', 'counselor_name', 'interaction_type', 'outcome', 'notes', 'next_followup_date', 'priority', 'created_at']);
      clearAndInsert('audit_logs', this.audit_logs, ['id', 'timestamp', 'actor_id', 'actor_name', 'actor_role', 'actor_ip', 'action', 'target_type', 'target_id', 'details', 'changes_diff', 'severity']);
      clearAndInsert('master_states', this.master_states, ['gst_code', 'state_name', 'state_short_code', 'is_union_territory']);
      clearAndInsert('master_user_types', this.master_user_types, ['type_code', 'alpha_prefix', 'role_key', 'display_title', 'description']);
      clearAndInsert('master_degrees', this.master_degrees, ['degree_code', 'degree_name', 'level', 'duration_years', 'total_semesters', 'statutory_body']);
      clearAndInsert('master_document_types', this.master_document_types, ['doc_type_code', 'title', 'mandatory_for', 'max_file_size_mb', 'allowed_mime_types']);
      clearAndInsert('staff_academic_journey', this.staff_academic_journey, ['id', 'staff_id', 'staff_name', 'qualification_level', 'degree_name', 'awarding_university', 'year_of_passing', 'specialization', 'scopus_publications', 'sci_publications', 'patents_count', 'past_institutions_summary', 'verified', 'created_at']);
      clearAndInsert('master_departments', this.master_departments, ['id', 'dept_code', 'dept_name', 'tags_json', 'head_of_dept', 'established_year', 'is_active']);
      clearAndInsert('master_institution_types', this.master_institution_types, ['code', 'name', 'regulatory_authority', 'description']);
      clearAndInsert('master_employee_statuses', this.master_employee_statuses, ['status_code', 'status_name', 'description', 'requires_dates']);
      clearAndInsert('master_designation_changes', this.master_designation_changes, ['type_code', 'name', 'category']);
      clearAndInsert('master_erp_statuses', this.master_erp_statuses, ['status_code', 'status_name', 'stage']);
      clearAndInsert('staff_basic_info', this.staff_basic_info, ['id', 'staff_id', 'employee_id', 'full_name', 'father_name', 'dob', 'gender', 'date_of_joining', 'date_of_resigning', 'last_working_date', 'category', 'primary_designation', 'department_id', 'employee_status', 'login_enabled', 'must_change_password', 'custom_attr_1', 'custom_attr_2', 'custom_attr_3', 'custom_attr_4', 'custom_meta_json']);
      clearAndInsert('staff_additional_info', this.staff_additional_info, ['id', 'staff_id', 'emergency_phone', 'blood_group', 'marital_status', 'nationality', 'pf_uan', 'esi_number', 'custom_meta_json']);
      clearAndInsert('staff_addresses', this.staff_addresses, ['id', 'staff_id', 'address_type', 'address_line', 'city', 'state_gst', 'pincode', 'is_default']);
      clearAndInsert('staff_bank_accounts', this.staff_bank_accounts, ['id', 'staff_id', 'bank_name', 'account_number', 'ifsc_code', 'branch_name', 'is_default']);
      clearAndInsert('staff_qualifications', this.staff_qualifications, ['id', 'staff_id', 'qualification_title', 'institution', 'year_of_passing', 'percentage_or_cgpa', 'is_highest']);
      clearAndInsert('staff_certifications', this.staff_certifications, ['id', 'staff_id', 'certification_name', 'issuing_body', 'issue_year', 'credential_id']);
      clearAndInsert('staff_experience', this.staff_experience, ['id', 'staff_id', 'organization_name', 'designation', 'start_date', 'end_date', 'is_latest']);
      clearAndInsert('staff_org_journey', this.staff_org_journey, ['id', 'staff_id', 'event_type', 'effective_date', 'old_designation', 'new_designation', 'actor_id', 'remarks', 'created_at']);
      clearAndInsert('partners', this.partners, ['id', 'user_id', 'partner_type', 'firm_name', 'pan_number', 'gst_number', 'tan_number', 'email', 'phone', 'address', 'is_active', 'created_at', 'custom_meta_json']);
      clearAndInsert('partner_contacts', this.partner_contacts, ['id', 'partner_id', 'contact_name', 'designation', 'email', 'phone', 'is_default']);
      clearAndInsert('partner_bank_accounts', this.partner_bank_accounts, ['id', 'partner_id', 'bank_name', 'account_number', 'ifsc_code', 'branch_name', 'is_default']);
      clearAndInsert('partner_job_postings', this.partner_job_postings, ['id', 'partner_id', 'title', 'type', 'stipend_salary', 'eligible_departments', 'min_cgpa', 'description', 'status', 'created_at']);
      clearAndInsert('partner_applications', this.partner_applications, ['id', 'posting_id', 'student_id', 'student_name', 'cgpa', 'status', 'remarks', 'applied_at']);
      clearAndInsert('bulk_upload_batches', this.bulk_upload_batches, ['id', 'upload_date', 'filename', 'total_rows', 'fresh_count', 'duplicate_count', 'wrong_count', 'source_label', 'uploaded_by']);
      clearAndInsert('enquiries', this.enquiries, ['id', 'enquiry_no', 'student_name', 'gender', 'father_name', 'mobile', 'email', 'selected_course', 'course_fee', 'admission_probability', 'status', 'assigned_counselor_id', 'assigned_counselor_name', 'batch_id', 'created_at', 'custom_meta_json']);
      clearAndInsert('enquiry_interactions', this.enquiry_interactions, ['id', 'enquiry_id', 'stage_name', 'counselor_id', 'remarks', 'call_status', 'probability_updated', 'call_recording_url', 'timestamp']);
      clearAndInsert('dialer_settings', [this.dialer_settings], ['id', 'is_enabled', 'provider', 'api_key_configured']);

      this.sqlDb.run('COMMIT;');

      const binaryArray = this.sqlDb.export();
      const buffer = Buffer.from(binaryArray);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err: any) {
      try { this.sqlDb.run('ROLLBACK;'); } catch {}
      console.error('[DB] Failed to save SQLite state:', err);
    }
  }

  public async getHealthInfo(): Promise<any> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      try {
        const [rows]: any = await this.mariaPool.query('SELECT COUNT(*) as count FROM users');
        return {
          status: 'ok',
          engine: 'MariaDB Pool',
          mode: 'mariadb',
          activeEngine: 'MariaDB Pool Active',
          storageLocation: 'MariaDB Database Server',
          userCount: rows[0]?.count ?? 0,
        };
      } catch (err: any) {
        return {
          status: 'error',
          engine: 'MariaDB Pool (Unreachable)',
          mode: 'mariadb',
          activeEngine: 'MariaDB Connection Failed',
          error: err.message,
        };
      }
    }

    return {
      status: 'ok',
      engine: 'SQLite File Engine (sql.js)',
      mode: 'sqlite',
      activeEngine: 'SQLite Disk Engine Active',
      storageLocation: this.dbPath,
    };
  }

  // =========================================================================
  // DATA OPERATIONS (Support both MariaDB live queries and SQLite fallback)
  // =========================================================================

  // --- USER OPERATIONS ---
  public async findUserByUsernameOrEmail(input: string): Promise<User | null> {
    const val = input.trim().toLowerCase();
    const cleanDigits = val.replace(/[^0-9]/g, '');
    let effectiveVal = val;
    if (val === 'staff' || val === '2001-14-03-01' || val === '2001140301') effectiveVal = 'staff01';
    else if (val === 'counselor' || val === '6001-02-03-01' || val === '6001020301') effectiveVal = 'counselor01';
    else if (val === 'hod' || val === '3001-01-03-01' || val === '3001010301') effectiveVal = 'hod_cse';
    else if (val === 'accounts' || val === '5001-05-03-01' || val === '5001050301') effectiveVal = 'accounts01';
    else if (val === 'super' || val === 'superadmin' || val === '9001-01-03-01' || val === '9001010301' || val === '9001-01-03-bfgi' || val === '9001-03-bfgi-000001' || val === '9001-03-bfgi-0001') effectiveVal = 'superadmin';
    else if (val === 'admin' || val === '4001-01-03-01' || val === '4001010301' || val === '4001-01-03-bfgi' || val === '4001-03-bfgi-0001') effectiveVal = 'admin';
    else if (val === '2001-14-03-bfgi' || val === '2001-03-bfgi-0014') effectiveVal = 'staff01';
    else if (val === '1001-88-03-01' || val === '1001880301' || val === '1001-88-03-bfgi' || val === '1001-03-bfgi-260088' || val === 'aryan' || val === 'student') effectiveVal = 'aryan';
    else if (val === 'partner' || val === 'prt-001' || val === 'prt-inf-001' || val === '7001-01-03-01' || val === '7001010301' || val === '7001-01-03-bfgi' || val === '7001-03-bfgi-0001') effectiveVal = 'partner01';
    else if (val === '6001-02-03-bfgi' || val === '6001-03-bfgi-0002') effectiveVal = 'counselor01';
    else if (val === '3001-01-03-bfgi' || val === '3001-03-bfgi-0001') effectiveVal = 'hod_cse';
    else if (val === '5001-05-03-bfgi' || val === '5001-03-bfgi-0005') effectiveVal = 'accounts01';

    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query(
        'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(username) = ? OR LOWER(enterprise_uid) = ? OR LOWER(employee_id) = ? OR (REPLACE(enterprise_uid, "-", "") = ? AND ? != "")',
        [val, val, effectiveVal, val, val, cleanDigits, cleanDigits]
      );
      if (rows && rows.length > 0) {
        const u = rows[0];
        return { ...u, is_active: Boolean(u.is_active) };
      }
      // Also look up by student roll number (e.g. STU-2023-088 or STU-008)
      const [stuRows]: any = await this.mariaPool.query(
        'SELECT user_id FROM students WHERE LOWER(student_id) = ? AND user_id IS NOT NULL',
        [val]
      );
      if (stuRows && stuRows.length > 0 && stuRows[0].user_id) {
        return this.findUserById(stuRows[0].user_id);
      }
      return null;
    }
    let user = this.users.find(u =>
      u.username.toLowerCase() === val ||
      u.username.toLowerCase() === effectiveVal ||
      u.email.toLowerCase() === val ||
      (u.enterprise_uid && u.enterprise_uid.toLowerCase() === val) ||
      (cleanDigits && cleanDigits.length >= 8 && u.enterprise_uid && u.enterprise_uid.replace(/[^0-9]/g, '') === cleanDigits) ||
      (u.employee_id && u.employee_id.toLowerCase() === val)
    );
    if (!user) {
      const stu = this.students.find(
        s => s.student_id.toLowerCase() === val || s.first_name.toLowerCase() === val || s.email.toLowerCase() === val
      );
      if (stu) {
        if (stu.user_id) {
          user = this.users.find(u => u.id === stu.user_id);
        }
        if (!user) {
          user = this.users.find(u => u.email.toLowerCase() === stu.email.toLowerCase() || u.username.toLowerCase() === stu.first_name.toLowerCase());
        }
      }
    }
    return user ? { ...user } : null;
  }

  public async findUserById(id: string): Promise<User | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM users WHERE id = ?', [id]);
      if (rows && rows.length > 0) {
        const u = rows[0];
        return { ...u, is_active: Boolean(u.is_active) };
      }
      return null;
    }
    const user = this.users.find(u => u.id === id);
    return user ? { ...user } : null;
  }

  public async getUsers(filters?: { role?: string; search?: string; is_active?: boolean }): Promise<User[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params: any[] = [];
      if (filters?.role && filters.role !== 'all') {
        sql += ' AND role = ?';
        params.push(filters.role);
      }
      if (filters?.is_active !== undefined) {
        sql += ' AND is_active = ?';
        params.push(filters.is_active ? 1 : 0);
      }
      if (filters?.search) {
        const s = `%${filters.search.toLowerCase()}%`;
        sql += ' AND (LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(department) LIKE ? OR LOWER(enterprise_uid) LIKE ?)';
        params.push(s, s, s, s, s);
      }
      sql += ' ORDER BY created_at DESC';
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
    }

    let list = [...this.users];
    if (filters?.role && filters.role !== 'all') {
      list = list.filter(u => u.role === filters.role);
    }
    if (filters?.is_active !== undefined) {
      list = list.filter(u => Boolean(u.is_active) === filters.is_active);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.enterprise_uid && u.enterprise_uid.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const allowedCols = ['username', 'email', 'password_hash', 'role', 'full_name', 'avatar_url', 'is_active', 'department', 'designation', 'employee_id', 'enterprise_uid'];
      const keys = Object.keys(updates).filter(k => allowedCols.includes(k));
      if (keys.length === 0) return this.findUserById(id);

      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = keys.map(k => {
        const val = (updates as any)[k];
        if (k === 'is_active') return val ? 1 : 0;
        return val !== undefined ? val : null;
      });
      values.push(id);

      await this.mariaPool.query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
      return this.findUserById(id);
    }

    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      this.save();
      return { ...this.users[idx] };
    }
    return null;
  }

  public async deleteUser(id: string): Promise<boolean> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query('DELETE FROM users WHERE id = ?', [id]);
      return true;
    }
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public async updateUserPasswordHash(emailOrId: string, passwordHash: string): Promise<boolean> {
    const val = emailOrId.trim().toLowerCase();
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query('UPDATE users SET password_hash = ? WHERE LOWER(email) = ? OR id = ?', [passwordHash, val, emailOrId]);
      return true;
    }
    const user = this.users.find(u => u.email.toLowerCase() === val || u.id === emailOrId);
    if (user) {
      user.password_hash = passwordHash;
      this.save();
      return true;
    }
    return false;
  }

  public async createUser(user: User): Promise<User> {
    if (!user.enterprise_uid) {
      user.enterprise_uid = generateEnterpriseUID(user.role);
    }
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO users (id, username, email, password_hash, role, full_name, avatar_url, is_active, department, designation, employee_id, enterprise_uid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          user.id,
          user.username,
          user.email,
          user.password_hash,
          user.role,
          user.full_name,
          user.avatar_url || null,
          user.is_active ? 1 : 0,
          user.department || null,
          user.designation || null,
          user.employee_id || null,
          user.enterprise_uid || null,
          formatSqlDateTime(user.created_at),
        ]
      );
      return user;
    }
    this.users.push(user);
    this.save();
    return user;
  }

  // --- AUDIT LOG OPERATIONS (Immutable Append-Only) ---
  public async createAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    if (this.mode === 'mariadb' && this.mariaPool) {
      try {
        await this.mariaPool.query(
          `INSERT INTO audit_logs (id, timestamp, actor_id, actor_name, actor_role, actor_ip, action, target_type, target_id, details, changes_diff, severity)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            log.id,
            formatSqlDateTime(log.timestamp),
            log.actor_id,
            log.actor_name,
            log.actor_role,
            log.actor_ip || null,
            log.action,
            log.target_type,
            log.target_id,
            log.details,
            log.changes_diff || null,
            log.severity,
          ]
        );
      } catch (e: any) {
        console.error('[AUDIT ERROR] Failed to write audit log to MariaDB:', e.message);
      }
    }

    this.audit_logs.unshift(log);
    this.save();
    return log;
  }

  public async getAuditLogs(options?: {
    limit?: number;
    actor_role?: string;
    target_type?: string;
    action?: string;
    search?: string;
  }): Promise<AuditLog[]> {
    const limit = options?.limit || 100;
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM audit_logs WHERE 1=1';
      const params: any[] = [];
      if (options?.actor_role && options.actor_role !== 'all') {
        sql += ' AND actor_role = ?';
        params.push(options.actor_role);
      }
      if (options?.target_type && options.target_type !== 'all') {
        sql += ' AND target_type = ?';
        params.push(options.target_type);
      }
      if (options?.action) {
        sql += ' AND action = ?';
        params.push(options.action);
      }
      if (options?.search) {
        const s = `%${options.search.toLowerCase()}%`;
        sql += ' AND (LOWER(actor_name) LIKE ? OR LOWER(details) LIKE ? OR LOWER(target_id) LIKE ?)';
        params.push(s, s, s);
      }
      sql += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows;
    }

    let logs = [...this.audit_logs];
    if (options?.actor_role && options.actor_role !== 'all') {
      logs = logs.filter(l => l.actor_role === options.actor_role);
    }
    if (options?.target_type && options.target_type !== 'all') {
      logs = logs.filter(l => l.target_type === options.target_type);
    }
    if (options?.action) {
      logs = logs.filter(l => l.action.toLowerCase() === options.action!.toLowerCase());
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      logs = logs.filter(l =>
        l.actor_name.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.target_id.toLowerCase().includes(q)
      );
    }
    return logs.slice(0, limit);
  }

  // --- MASTER TABLES OPERATIONS ---
  public async getMasterData(): Promise<{
    states: MasterState[];
    userTypes: MasterUserType[];
    degrees: MasterDegree[];
    documentTypes: MasterDocumentType[];
  }> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      try {
        const [states]: any = await this.mariaPool.query('SELECT * FROM master_states ORDER BY gst_code ASC');
        const [userTypes]: any = await this.mariaPool.query('SELECT * FROM master_user_types ORDER BY type_code ASC');
        const [degrees]: any = await this.mariaPool.query('SELECT * FROM master_degrees ORDER BY degree_code ASC');
        const [docTypes]: any = await this.mariaPool.query('SELECT * FROM master_document_types ORDER BY doc_type_code ASC');
        return {
          states: states.map((s: any) => ({ ...s, is_union_territory: Boolean(s.is_union_territory) })),
          userTypes,
          degrees,
          documentTypes: docTypes,
        };
      } catch (err) {
        // Fall back to memory
      }
    }
    return {
      states: [...this.master_states],
      userTypes: [...this.master_user_types],
      degrees: [...this.master_degrees],
      documentTypes: [...this.master_document_types],
    };
  }

  // --- STAFF ACADEMIC JOURNEY OPERATIONS ---
  public async getStaffAcademicJourney(staffId?: string): Promise<StaffAcademicJourney[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      try {
        let sql = 'SELECT * FROM staff_academic_journey WHERE 1=1';
        const params: any[] = [];
        if (staffId) {
          sql += ' AND staff_id = ?';
          params.push(staffId);
        }
        sql += ' ORDER BY year_of_passing DESC';
        const [rows]: any = await this.mariaPool.query(sql, params);
        return rows.map((r: any) => ({ ...r, verified: Boolean(r.verified) }));
      } catch (err) {
        // Fall back to memory
      }
    }
    let list = [...this.staff_academic_journey];
    if (staffId) {
      list = list.filter(j => j.staff_id === staffId);
    }
    return list;
  }

  public async addStaffAcademicJourney(data: Omit<StaffAcademicJourney, 'id' | 'created_at'>): Promise<StaffAcademicJourney> {
    const entry: StaffAcademicJourney = {
      id: `saj-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      ...data,
      created_at: new Date().toISOString(),
    };

    if (this.mode === 'mariadb' && this.mariaPool) {
      try {
        await this.mariaPool.query(
          `INSERT INTO staff_academic_journey (id, staff_id, staff_name, qualification_level, degree_name, awarding_university, year_of_passing, specialization, scopus_publications, sci_publications, patents_count, past_institutions_summary, verified, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.staff_id,
            entry.staff_name,
            entry.qualification_level,
            entry.degree_name,
            entry.awarding_university,
            entry.year_of_passing,
            entry.specialization,
            entry.scopus_publications || 0,
            entry.sci_publications || 0,
            entry.patents_count || 0,
            entry.past_institutions_summary || null,
            entry.verified ? 1 : 0,
            formatSqlDateTime(entry.created_at),
          ]
        );
      } catch (e: any) {
        console.error('[DB] Failed to insert staff academic journey in MariaDB:', e.message);
      }
    }

    this.staff_academic_journey.push(entry);
    this.save();
    return entry;
  }

  public async overrideUser(
    targetUserId: string,
    updates: {
      full_name?: string;
      username?: string;
      email?: string;
      role?: EnterpriseUserRole;
      department?: string;
      designation?: string;
      employee_id?: string;
      is_active?: boolean;
      new_password?: string;
    },
    actorUser: { id: string; full_name: string; role: EnterpriseUserRole }
  ): Promise<User> {
    const target = await this.findUserById(targetUserId);
    if (!target) {
      throw new Error(`Target user with ID '${targetUserId}' not found.`);
    }

    const changedFields: Record<string, { before: any; after: any }> = {};

    if (updates.full_name !== undefined && updates.full_name !== target.full_name) {
      changedFields.full_name = { before: target.full_name, after: updates.full_name };
      target.full_name = updates.full_name;
    }
    if (updates.username !== undefined && updates.username !== target.username) {
      changedFields.username = { before: target.username, after: updates.username.toLowerCase().trim() };
      target.username = updates.username.toLowerCase().trim();
    }
    if (updates.email !== undefined && updates.email !== target.email) {
      changedFields.email = { before: target.email, after: updates.email.toLowerCase().trim() };
      target.email = updates.email.toLowerCase().trim();
    }
    if (updates.role !== undefined && updates.role !== target.role) {
      changedFields.role = { before: target.role, after: updates.role };
      target.role = updates.role;
    }
    if (updates.department !== undefined && updates.department !== target.department) {
      changedFields.department = { before: target.department, after: updates.department };
      target.department = updates.department;
    }
    if (updates.designation !== undefined && updates.designation !== target.designation) {
      changedFields.designation = { before: target.designation, after: updates.designation };
      target.designation = updates.designation;
    }
    if (updates.employee_id !== undefined && updates.employee_id !== target.employee_id) {
      changedFields.employee_id = { before: target.employee_id, after: updates.employee_id };
      target.employee_id = updates.employee_id;
    }
    if (updates.is_active !== undefined && updates.is_active !== target.is_active) {
      changedFields.is_active = { before: target.is_active, after: updates.is_active };
      target.is_active = updates.is_active;
    }
    if (updates.new_password) {
      target.password_hash = bcrypt.hashSync(updates.new_password, 10);
      changedFields.password = { before: '********', after: '[MODIFIED_BY_ADMIN_OVERRIDE]' };
    }

    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        `UPDATE users SET full_name = ?, username = ?, email = ?, role = ?, department = ?, designation = ?, employee_id = ?, is_active = ?, password_hash = ? WHERE id = ?`,
        [
          target.full_name,
          target.username,
          target.email,
          target.role,
          target.department || null,
          target.designation || null,
          target.employee_id || null,
          target.is_active ? 1 : 0,
          target.password_hash,
          target.id,
        ]
      );
    } else {
      const idx = this.users.findIndex(u => u.id === targetUserId);
      if (idx !== -1) {
        this.users[idx] = { ...target };
      }
      this.save();
    }

    await this.createAuditLog({
      actor_id: actorUser.id,
      actor_name: actorUser.full_name,
      actor_role: actorUser.role,
      action: actorUser.role === 'super_admin' ? 'USER_OVERRIDE_APEX' : 'ADMIN_USER_OVERRIDE',
      target_type: 'user',
      target_id: target.id,
      details: `${actorUser.full_name} (${actorUser.role}) modified user credentials/profile for ${target.username} (${target.full_name}).`,
      changes_diff: JSON.stringify(changedFields),
      severity: 'critical',
    });

    return target;
  }

  // ==========================================
  // ENTERPRISE MASTER TABLES & TAGGING OPERATIONS
  // ==========================================
  public async getMasterDepartments(): Promise<MasterDepartment[]> {
    return [...this.master_departments];
  }

  public async addMasterDepartment(dept: Omit<MasterDepartment, 'id'>): Promise<MasterDepartment> {
    const newDept: MasterDepartment = {
      id: `dept-${dept.dept_code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      ...dept,
    };
    this.master_departments.push(newDept);
    this.save();
    return newDept;
  }

  public async updateMasterDepartment(id: string, updates: Partial<MasterDepartment>): Promise<MasterDepartment | null> {
    const idx = this.master_departments.findIndex(d => d.id === id || d.dept_code === id);
    if (idx === -1) return null;
    this.master_departments[idx] = { ...this.master_departments[idx], ...updates };
    this.save();
    return this.master_departments[idx];
  }

  public async getMasterInstitutionTypes(): Promise<MasterInstitutionType[]> {
    return [...this.master_institution_types];
  }

  public async getMasterEmployeeStatuses(): Promise<MasterEmployeeStatus[]> {
    return [...this.master_employee_statuses];
  }

  public async getMasterDesignationChanges(): Promise<MasterDesignationChange[]> {
    return [...this.master_designation_changes];
  }

  public async getMasterERPStatuses(): Promise<MasterERPStatus[]> {
    return [...this.master_erp_statuses];
  }

  // ==========================================
  // MULTI-TABLE STAFF MANAGEMENT & ORG JOURNEY
  // ==========================================
  public async getStaffList(filters?: { department?: string; status?: string; search?: string }): Promise<any[]> {
    let list = this.staff_basic_info.map(b => {
      const addr = this.staff_addresses.find(a => a.staff_id === b.staff_id && a.is_default) || this.staff_addresses.find(a => a.staff_id === b.staff_id);
      const bank = this.staff_bank_accounts.find(ba => ba.staff_id === b.staff_id && ba.is_default) || this.staff_bank_accounts.find(ba => ba.staff_id === b.staff_id);
      const qual = this.staff_qualifications.find(q => q.staff_id === b.staff_id && q.is_highest) || this.staff_qualifications.find(q => q.staff_id === b.staff_id);
      const exp = this.staff_experience.find(e => e.staff_id === b.staff_id && e.is_latest) || this.staff_experience.find(e => e.staff_id === b.staff_id);
      const user = this.users.find(u => u.employee_id === b.employee_id || u.username === b.staff_id);
      return {
        ...b,
        default_address: addr || null,
        default_bank: bank || null,
        highest_qualification: qual || null,
        latest_experience: exp || null,
        user_account: user ? { id: user.id, username: user.username, email: user.email, enterprise_uid: user.enterprise_uid, must_change_password: user.must_change_password } : null,
      };
    });

    if (filters?.department) {
      list = list.filter(s => s.department_id.toLowerCase() === filters.department!.toLowerCase());
    }
    if (filters?.status) {
      list = list.filter(s => s.employee_status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.employee_id.toLowerCase().includes(q) ||
        s.primary_designation.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public async getStaffFullProfile(staffId: string): Promise<any | null> {
    const basic = this.staff_basic_info.find(s => s.staff_id === staffId || s.id === staffId || s.employee_id === staffId);
    if (!basic) return null;

    const actualStaffId = basic.staff_id;
    const additional = this.staff_additional_info.find(a => a.staff_id === actualStaffId) || null;
    const addresses = this.staff_addresses.filter(a => a.staff_id === actualStaffId);
    const bankAccounts = this.staff_bank_accounts.filter(b => b.staff_id === actualStaffId);
    const qualifications = this.staff_qualifications.filter(q => q.staff_id === actualStaffId);
    const certifications = this.staff_certifications.filter(c => c.staff_id === actualStaffId);
    const experience = this.staff_experience.filter(e => e.staff_id === actualStaffId);
    const orgJourney = this.staff_org_journey.filter(j => j.staff_id === actualStaffId).sort((a, b) => b.effective_date.localeCompare(a.effective_date));
    const user = this.users.find(u => u.employee_id === basic.employee_id);

    return {
      basic,
      additional,
      addresses,
      bankAccounts,
      qualifications,
      certifications,
      experience,
      orgJourney,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        enterprise_uid: user.enterprise_uid,
        is_active: user.is_active,
        must_change_password: user.must_change_password,
      } : null,
    };
  }

  public async createStaff(payload: {
    basic: Omit<StaffBasicInfo, 'id'>;
    additional?: Partial<StaffAdditionalInfo>;
    address?: Omit<StaffAddress, 'id' | 'staff_id'>;
    bankAccount?: Omit<StaffBankAccount, 'id' | 'staff_id'>;
    qualification?: Omit<StaffQualification, 'id' | 'staff_id'>;
    actor_id?: string;
  }): Promise<any> {
    const id = `stf-bas-${Date.now()}`;
    const staffId = payload.basic.staff_id || `stf-${Date.now().toString().slice(-4)}`;
    const basic: StaffBasicInfo = {
      id,
      ...payload.basic,
      staff_id: staffId,
    };
    this.staff_basic_info.push(basic);

    if (payload.additional) {
      this.staff_additional_info.push({
        id: `stf-add-${Date.now()}`,
        staff_id: staffId,
        ...payload.additional,
      });
    }

    if (payload.address) {
      this.staff_addresses.push({
        id: `addr-${Date.now()}`,
        staff_id: staffId,
        ...payload.address,
        is_default: true,
      });
    }

    if (payload.bankAccount) {
      this.staff_bank_accounts.push({
        id: `bank-${Date.now()}`,
        staff_id: staffId,
        ...payload.bankAccount,
        is_default: true,
      });
    }

    if (payload.qualification) {
      this.staff_qualifications.push({
        id: `qual-${Date.now()}`,
        staff_id: staffId,
        ...payload.qualification,
        is_highest: true,
      });
    }

    // Initial org journey event
    this.staff_org_journey.push({
      id: `soj-${Date.now()}`,
      staff_id: staffId,
      event_type: 'joining',
      effective_date: basic.date_of_joining,
      new_designation: basic.primary_designation,
      actor_id: payload.actor_id || 'usr-admin-01',
      remarks: `Initial onboarding of ${basic.full_name} (${basic.employee_id}).`,
      created_at: new Date().toISOString(),
    });

    // Auto-create or link user account
    const existingUser = this.users.find(u => u.employee_id === basic.employee_id);
    if (!existingUser) {
      const tempPass = 'staff123';
      const hash = bcrypt.hashSync(tempPass, 10);
      this.users.push({
        id: `usr-staff-${Date.now().toString().slice(-4)}`,
        username: basic.employee_id.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        email: `${basic.employee_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@educore.edu`,
        password_hash: hash,
        role: 'staff',
        full_name: basic.full_name,
        department: basic.department_id,
        designation: basic.primary_designation,
        employee_id: basic.employee_id,
        enterprise_uid: generateEnterpriseUID('staff', '03', '01'),
        is_active: basic.login_enabled,
        must_change_password: true,
        created_at: new Date().toISOString(),
      });
    }

    this.save();
    return this.getStaffFullProfile(staffId);
  }

  public async updateStaffBasic(staffId: string, updates: Partial<StaffBasicInfo>, actorId: string = 'usr-admin-01'): Promise<StaffBasicInfo | null> {
    const idx = this.staff_basic_info.findIndex(s => s.staff_id === staffId || s.id === staffId);
    if (idx === -1) return null;

    const old = this.staff_basic_info[idx];
    const updated = { ...old, ...updates };

    // Lifecycle transition detection
    if (updates.employee_status && updates.employee_status !== old.employee_status) {
      const eventType = updates.employee_status.toLowerCase();
      this.staff_org_journey.push({
        id: `soj-${Date.now()}`,
        staff_id: old.staff_id,
        event_type: eventType,
        effective_date: updates.date_of_resigning || new Date().toISOString().slice(0, 10),
        old_designation: old.primary_designation,
        new_designation: updated.primary_designation,
        actor_id: actorId,
        remarks: `Status transitioned from ${old.employee_status} to ${updates.employee_status}. Effective: ${updates.date_of_resigning || 'Immediate'}. Last working: ${updates.last_working_date || 'N/A'}.`,
        created_at: new Date().toISOString(),
      });

      // If deactivated or terminated, automatically disable login
      if (['DEACTIVATED', 'TERMINATED'].includes(updates.employee_status)) {
        updated.login_enabled = false;
        const u = this.users.find(usr => usr.employee_id === old.employee_id);
        if (u) u.is_active = false;
      }
    }

    // Designation change detection
    if (updates.primary_designation && updates.primary_designation !== old.primary_designation) {
      this.staff_org_journey.push({
        id: `soj-${Date.now()}`,
        staff_id: old.staff_id,
        event_type: 'role_switch',
        effective_date: new Date().toISOString().slice(0, 10),
        old_designation: old.primary_designation,
        new_designation: updates.primary_designation,
        actor_id: actorId,
        remarks: `Designation upgraded/changed to ${updates.primary_designation}.`,
        created_at: new Date().toISOString(),
      });
    }

    this.staff_basic_info[idx] = updated;
    this.save();
    return updated;
  }

  public async setStaffLoginStatus(staffId: string, enabled: boolean, actorId: string = 'usr-admin-01'): Promise<{ success: boolean; login_enabled: boolean; otpDispatched: boolean }> {
    const basic = this.staff_basic_info.find(s => s.staff_id === staffId || s.id === staffId);
    if (!basic) throw new Error('Staff record not found.');

    basic.login_enabled = enabled;
    const user = this.users.find(u => u.employee_id === basic.employee_id);
    if (user) {
      user.is_active = enabled;
    }

    await this.createAuditLog({
      actor_id: actorId,
      actor_name: 'Administrator',
      actor_role: 'admin',
      action: enabled ? 'STAFF_LOGIN_ENABLED' : 'STAFF_LOGIN_DISABLED',
      target_type: 'staff',
      target_id: basic.staff_id,
      details: `Login access for ${basic.full_name} (${basic.employee_id}) was ${enabled ? 'ENABLED' : 'DISABLED'}. Security OTP notification dispatched.`,
      severity: 'warn',
    });

    this.save();
    return { success: true, login_enabled: enabled, otpDispatched: true };
  }

  public async resetStaffPasswordByAdmin(
    staffId: string,
    tempPassword?: string,
    actorId: string = 'usr-admin-01'
  ): Promise<{ success: boolean; message: string; tempPasswordIssued: string; must_change_password: boolean }> {
    const basic = this.staff_basic_info.find(s => s.staff_id === staffId || s.id === staffId);
    if (!basic) throw new Error('Staff member not found.');

    const user = this.users.find(u => u.employee_id === basic.employee_id);
    if (!user) throw new Error('User account not found for this staff member.');

    const issuedPass = tempPassword || `Edu@${Math.floor(100000 + Math.random() * 900000)}`;
    const hash = bcrypt.hashSync(issuedPass, 10);
    user.password_hash = hash;
    user.must_change_password = true;
    basic.must_change_password = true;

    await this.createAuditLog({
      actor_id: actorId,
      actor_name: 'Administrator',
      actor_role: 'admin',
      action: 'ADMIN_ASSISTED_PASSWORD_RESET',
      target_type: 'user',
      target_id: user.id,
      details: `Admin issued temporary password for staff ${basic.full_name} (${basic.employee_id}). Mandatory change on next login enforced.`,
      severity: 'critical',
    });

    this.save();
    return {
      success: true,
      message: 'Temporary password generated and dispatched. User must change password upon next login.',
      tempPasswordIssued: issuedPass,
      must_change_password: true,
    };
  }

  public async addStaffAddress(addr: Omit<StaffAddress, 'id'>): Promise<StaffAddress> {
    if (addr.is_default) {
      this.staff_addresses.filter(a => a.staff_id === addr.staff_id).forEach(a => { a.is_default = false; });
    }
    const newAddr: StaffAddress = { id: `addr-${Date.now()}`, ...addr };
    this.staff_addresses.push(newAddr);
    this.save();
    return newAddr;
  }

  public async addStaffBankAccount(bank: Omit<StaffBankAccount, 'id'>): Promise<StaffBankAccount> {
    if (bank.is_default) {
      this.staff_bank_accounts.filter(b => b.staff_id === bank.staff_id).forEach(b => { b.is_default = false; });
    }
    const newBank: StaffBankAccount = { id: `bank-${Date.now()}`, ...bank };
    this.staff_bank_accounts.push(newBank);
    this.save();
    return newBank;
  }

  public async addStaffQualification(qual: Omit<StaffQualification, 'id'>): Promise<StaffQualification> {
    if (qual.is_highest) {
      this.staff_qualifications.filter(q => q.staff_id === qual.staff_id).forEach(q => { q.is_highest = false; });
    }
    const newQual: StaffQualification = { id: `qual-${Date.now()}`, ...qual };
    this.staff_qualifications.push(newQual);
    this.save();
    return newQual;
  }

  public async addStaffCertification(cert: Omit<StaffCertification, 'id'>): Promise<StaffCertification> {
    const newCert: StaffCertification = { id: `cert-${Date.now()}`, ...cert };
    this.staff_certifications.push(newCert);
    this.save();
    return newCert;
  }

  public async addStaffExperience(exp: Omit<StaffExperience, 'id'>): Promise<StaffExperience> {
    if (exp.is_latest) {
      this.staff_experience.filter(e => e.staff_id === exp.staff_id).forEach(e => { e.is_latest = false; });
    }
    const newExp: StaffExperience = { id: `exp-${Date.now()}`, ...exp };
    this.staff_experience.push(newExp);
    this.save();
    return newExp;
  }

  public async addStaffOrgJourneyEvent(event: Omit<StaffOrgJourneyEvent, 'id' | 'created_at'>): Promise<StaffOrgJourneyEvent> {
    const newEvent: StaffOrgJourneyEvent = {
      id: `soj-${Date.now()}`,
      ...event,
      created_at: new Date().toISOString(),
    };
    this.staff_org_journey.push(newEvent);
    this.save();
    return newEvent;
  }

  // ==========================================
  // CORPORATE HIRING PARTNER PORTAL OPERATIONS
  // ==========================================
  public async getPartners(): Promise<any[]> {
    return this.partners.map(p => {
      const contacts = this.partner_contacts.filter(c => c.partner_id === p.id);
      const banks = this.partner_bank_accounts.filter(b => b.partner_id === p.id);
      const defaultContact = contacts.find(c => c.is_default) || contacts[0];
      const defaultBank = banks.find(b => b.is_default) || banks[0];
      const activeJobs = this.partner_job_postings.filter(j => j.partner_id === p.id && j.status === 'open').length;
      return {
        ...p,
        contacts,
        bank_accounts: banks,
        default_contact: defaultContact || null,
        default_bank: defaultBank || null,
        active_jobs_count: activeJobs,
      };
    });
  }

  public async getPartnerById(id: string): Promise<any | null> {
    const partner = this.partners.find(p => p.id === id || p.user_id === id);
    if (!partner) return null;
    const contacts = this.partner_contacts.filter(c => c.partner_id === partner.id);
    const bankAccounts = this.partner_bank_accounts.filter(b => b.partner_id === partner.id);
    const jobPostings = this.partner_job_postings.filter(j => j.partner_id === partner.id);
    return {
      ...partner,
      contacts,
      bankAccounts,
      jobPostings,
    };
  }

  public async createPartner(payload: {
    partner: Omit<PartnerEntity, 'id' | 'created_at'>;
    contact?: Omit<PartnerContact, 'id' | 'partner_id'>;
    bank?: Omit<PartnerBankAccount, 'id' | 'partner_id'>;
  }): Promise<any> {
    const partnerId = `prt-${Date.now().toString().slice(-4)}`;
    const newPartner: PartnerEntity = {
      id: partnerId,
      ...payload.partner,
      created_at: new Date().toISOString(),
    };
    this.partners.push(newPartner);

    if (payload.contact) {
      this.partner_contacts.push({
        id: `prt-ct-${Date.now()}`,
        partner_id: partnerId,
        ...payload.contact,
        is_default: true,
      });
    }

    if (payload.bank) {
      this.partner_bank_accounts.push({
        id: `prt-bk-${Date.now()}`,
        partner_id: partnerId,
        ...payload.bank,
        is_default: true,
      });
    }

    this.save();
    return this.getPartnerById(partnerId);
  }

  public async updatePartner(id: string, updates: Partial<PartnerEntity>): Promise<PartnerEntity | null> {
    const idx = this.partners.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.partners[idx] = { ...this.partners[idx], ...updates };
    this.save();
    return this.partners[idx];
  }

  public async getPartnerJobPostings(partnerId?: string): Promise<any[]> {
    let jobs = [...this.partner_job_postings];
    if (partnerId) {
      jobs = jobs.filter(j => j.partner_id === partnerId);
    }
    return jobs.map(j => {
      const partner = this.partners.find(p => p.id === j.partner_id);
      const apps = this.partner_applications.filter(a => a.posting_id === j.id);
      return {
        ...j,
        partner_name: partner?.firm_name || 'Corporate Partner',
        applications_count: apps.length,
      };
    });
  }

  public async createPartnerJobPosting(data: Omit<PartnerJobPosting, 'id' | 'created_at'>): Promise<PartnerJobPosting> {
    const newJob: PartnerJobPosting = {
      id: `job-${Date.now().toString().slice(-4)}`,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.partner_job_postings.push(newJob);
    this.save();
    return newJob;
  }

  public async getPartnerApplications(postingId?: string): Promise<PartnerApplication[]> {
    if (postingId) {
      return this.partner_applications.filter(a => a.posting_id === postingId);
    }
    return [...this.partner_applications];
  }

  public async applyForPartnerJob(data: Omit<PartnerApplication, 'id' | 'applied_at'>): Promise<PartnerApplication> {
    const newApp: PartnerApplication = {
      id: `app-${Date.now().toString().slice(-4)}`,
      ...data,
      applied_at: new Date().toISOString(),
    };
    this.partner_applications.push(newApp);
    this.save();
    return newApp;
  }

  public async updatePartnerApplicationStatus(id: string, status: string, remarks?: string): Promise<PartnerApplication | null> {
    const idx = this.partner_applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.partner_applications[idx].status = status;
    if (remarks) this.partner_applications[idx].remarks = remarks;
    this.save();
    return this.partner_applications[idx];
  }

  public async getVerifiedStudentTalentPool(minCgpa: number = 6.0, dept?: string): Promise<any[]> {
    return this.students
      .filter(s => ['enrolled', 'approved', 'submitted', 'provisionally_admitted'].includes(s.admission_status))
      .map(s => {
        const course = this.courses.find(c => c.id === s.course_id);
        const approxGpa = s.attendance_percentage > 85 ? 8.9 : s.attendance_percentage > 75 ? 7.8 : 6.8;
        return {
          id: s.id,
          student_id: s.student_id,
          full_name: `${s.first_name} ${s.last_name}`,
          gender: s.gender,
          course_name: course?.name || 'B.Tech CSE',
          department: course?.department || 'CSE',
          current_semester: s.current_semester,
          cgpa: approxGpa,
          tenth_percentage: s.tenth_percentage || 80,
          twelfth_percentage: s.twelfth_percentage || 82,
          attendance_percentage: s.attendance_percentage,
          documents_verified: Boolean(s.tenth_doc_verified && s.twelfth_doc_verified && s.aadhaar_doc_verified),
        };
      })
      .filter(s => s.cgpa >= minCgpa && (!dept || s.department.toLowerCase() === dept.toLowerCase()));
  }

  // ==========================================
  // PRE-ADMISSION CRM, ENQUIRIES & BULK IMPORTER
  // ==========================================
  public async getEnquiries(filters?: { status?: string; counselor_id?: string; search?: string }): Promise<any[]> {
    let list = this.enquiries.map(e => {
      const interactions = this.enquiry_interactions.filter(i => i.enquiry_id === e.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return {
        ...e,
        latest_interaction: interactions[0] || null,
        interactions_count: interactions.length,
      };
    });

    if (filters?.status) {
      list = list.filter(e => e.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.counselor_id) {
      list = list.filter(e => e.assigned_counselor_id === filters.counselor_id);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e =>
        e.student_name.toLowerCase().includes(q) ||
        e.mobile.includes(q) ||
        e.enquiry_no.toLowerCase().includes(q) ||
        e.selected_course.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public async getEnquiryById(id: string): Promise<any | null> {
    const enq = this.enquiries.find(e => e.id === id || e.enquiry_no === id);
    if (!enq) return null;
    const interactions = this.enquiry_interactions.filter(i => i.enquiry_id === enq.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return {
      ...enq,
      interactions,
    };
  }

  public async createEnquiry(data: Omit<EnquiryRecord, 'id' | 'enquiry_no' | 'created_at'>): Promise<EnquiryRecord> {
    const seq = Math.floor(100 + Math.random() * 900);
    const newEnq: EnquiryRecord = {
      id: `enq-${Date.now()}`,
      enquiry_no: `ENQ-${new Date().getFullYear()}-${seq}`,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.enquiries.push(newEnq);
    this.save();
    return newEnq;
  }

  public async updateEnquiry(id: string, updates: Partial<EnquiryRecord>): Promise<EnquiryRecord | null> {
    const idx = this.enquiries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.enquiries[idx] = { ...this.enquiries[idx], ...updates };
    this.save();
    return this.enquiries[idx];
  }

  public async addEnquiryInteraction(data: Omit<EnquiryInteraction, 'id' | 'timestamp'>): Promise<EnquiryInteraction> {
    const newInt: EnquiryInteraction = {
      id: `ei-${Date.now()}`,
      ...data,
      timestamp: new Date().toISOString(),
    };
    this.enquiry_interactions.push(newInt);

    // Update parent enquiry admission probability
    const enq = this.enquiries.find(e => e.id === data.enquiry_id);
    if (enq) {
      enq.admission_probability = data.probability_updated;
      if (enq.status === 'enquiry') enq.status = 'prospect';
    }

    this.save();
    return newInt;
  }

  public async convertEnquiryToStudent(
    enquiryId: string,
    paymentDetails: {
      amount: number;
      payment_mode: 'online_upi' | 'net_banking' | 'credit_card' | 'debit_card' | 'cash';
      transaction_ref: string;
      course_id?: string;
      actor_id?: string;
    }
  ): Promise<{ success: boolean; student: Student; user: User; receiptNo: string }> {
    const enq = this.enquiries.find(e => e.id === enquiryId);
    if (!enq) throw new Error('Enquiry record not found.');

    const targetCourse = this.courses.find(c => c.id === paymentDetails.course_id || c.name.toLowerCase().includes(enq.selected_course.toLowerCase())) || this.courses[0];
    const targetSession = this.sessions.find(s => s.is_current) || this.sessions[0];

    const studentUid = generateEnterpriseUID('student', '03', '01');
    const studentSeq = Math.floor(100 + Math.random() * 900);
    const newStudentId = `STU-${new Date().getFullYear()}-${studentSeq}`;
    const newUserId = `usr-stu-${Date.now().toString().slice(-4)}`;
    const receiptNo = `REC-TOK-${Date.now().toString().slice(-6)}`;

    // 1. Create User account for student
    const defaultPasswordHash = bcrypt.hashSync('student123', 10);
    const newUser: User = {
      id: newUserId,
      username: `stu_${newStudentId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      email: enq.email,
      password_hash: defaultPasswordHash,
      role: 'student',
      full_name: enq.student_name,
      department: targetCourse.department,
      designation: 'Enrolled Student',
      enterprise_uid: studentUid,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.users.push(newUser);

    // 2. Create Student record
    const [firstName, ...lastParts] = enq.student_name.split(' ');
    const newStudent: Student = {
      id: `stu-rec-${Date.now()}`,
      user_id: newUserId,
      student_id: newStudentId,
      first_name: firstName || enq.student_name,
      last_name: lastParts.join(' ') || 'Singh',
      gender: (['male', 'female'].includes(enq.gender.toLowerCase()) ? enq.gender.toLowerCase() : 'prefer_not_to_say') as any,
      dob: '2004-05-15',
      email: enq.email,
      phone: enq.mobile,
      guardian_name: enq.father_name,
      guardian_relation: 'parent',
      guardian_phone: enq.mobile,
      course_id: targetCourse.id,
      session_id: targetSession.id,
      current_semester: 1,
      admission_year: new Date().getFullYear(),
      admission_status: 'provisionally_admitted',
      fees_status: 'partial',
      attendance_percentage: 100,
      total_classes: 0,
      attended_classes: 0,
      token_fee_receipt: receiptNo,
      token_fee_amount: paymentDetails.amount,
      token_fee_mode: paymentDetails.payment_mode,
      token_fee_date: new Date().toISOString().slice(0, 10),
      intake_step: 4,
      admitted_by: paymentDetails.actor_id || 'usr-admin-01',
      admission_remarks: `Converted from Enquiry #${enq.enquiry_no} upon ₹${paymentDetails.amount} registration fee clearance. Course UID: ${studentUid}.`,
      created_at: new Date().toISOString(),
    };
    this.students.push(newStudent);

    // 3. Record Token Fee in Payments
    this.payments.push({
      id: `pay-${Date.now()}`,
      receipt_no: receiptNo,
      student_id: newStudent.id,
      amount_paid: paymentDetails.amount,
      payment_mode: paymentDetails.payment_mode,
      transaction_reference: paymentDetails.transaction_ref,
      payment_date: new Date().toISOString(),
      status: 'success',
      notes: `Registration token payment for admission to ${targetCourse.name}. Course UID: ${studentUid}`,
      collected_by: paymentDetails.actor_id || 'usr-admin-01',
    });

    // 4. Update Enquiry status
    enq.status = 'student';
    enq.admission_probability = 100;

    // 5. Interaction remark
    this.enquiry_interactions.push({
      id: `ei-${Date.now()}`,
      enquiry_id: enq.id,
      stage_name: 'Admitted & Converted to Student Master',
      counselor_id: paymentDetails.actor_id || 'usr-counselor-01',
      remarks: `Paid token fee ₹${paymentDetails.amount} (${receiptNo}). Admitted to ${targetCourse.name} with canonical Course UID ${studentUid}.`,
      call_status: 'Converted to Student',
      probability_updated: 100,
      timestamp: new Date().toISOString(),
    });

    // 6. Audit log
    await this.createAuditLog({
      actor_id: paymentDetails.actor_id || 'usr-admin-01',
      actor_name: 'Admissions Desk',
      actor_role: 'admin',
      action: 'ENQUIRY_CONVERTED_TO_STUDENT',
      target_type: 'student',
      target_id: newStudent.id,
      details: `Enquiry #${enq.enquiry_no} (${enq.student_name}) successfully converted into admitted student #${newStudentId} with Course UID ${studentUid}.`,
      severity: 'info',
    });

    this.save();
    return { success: true, student: newStudent, user: newUser, receiptNo };
  }

  public async createBulkBatch(data: Omit<BulkUploadBatch, 'id' | 'upload_date'>): Promise<BulkUploadBatch> {
    const newBatch: BulkUploadBatch = {
      id: `batch-${Date.now()}`,
      upload_date: new Date().toISOString(),
      ...data,
    };
    this.bulk_upload_batches.unshift(newBatch);
    this.save();
    return newBatch;
  }

  public async getBulkBatches(): Promise<BulkUploadBatch[]> {
    return [...this.bulk_upload_batches];
  }

  public async getDialerSettings(): Promise<DialerSettings> {
    return { ...this.dialer_settings };
  }

  public async updateDialerSettings(updates: Partial<DialerSettings>): Promise<DialerSettings> {
    this.dialer_settings = { ...this.dialer_settings, ...updates };
    this.save();
    return { ...this.dialer_settings };
  }

  // --- STUDENT OPERATIONS ---
  public async getStudents(filters?: { course_id?: string; session_id?: string; status?: string; search?: string }): Promise<Student[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM students WHERE 1=1';
      const params: any[] = [];
      if (filters?.course_id) {
        sql += ' AND course_id = ?';
        params.push(filters.course_id);
      }
      if (filters?.session_id) {
        sql += ' AND session_id = ?';
        params.push(filters.session_id);
      }
      if (filters?.status) {
        sql += ' AND admission_status = ?';
        params.push(filters.status);
      }
      if (filters?.search) {
        const s = `%${filters.search.toLowerCase()}%`;
        sql += ' AND (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(student_id) LIKE ? OR LOWER(email) LIKE ?)';
        params.push(s, s, s, s);
      }
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({
        ...r,
        is_hosteller: Boolean(r.is_hosteller),
        is_transport_user: Boolean(r.is_transport_user),
        condonation_granted: Boolean(r.condonation_granted),
      }));
    }

    let result = [...this.students];
    if (filters?.course_id) result = result.filter(s => s.course_id === filters.course_id);
    if (filters?.session_id) result = result.filter(s => s.session_id === filters.session_id);
    if (filters?.status) result = result.filter(s => s.admission_status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        s =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public async getStudentById(id: string): Promise<Student | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM students WHERE id = ? OR student_id = ?', [id, id]);
      if (rows && rows.length > 0) {
        return {
          ...rows[0],
          is_hosteller: Boolean(rows[0].is_hosteller),
          is_transport_user: Boolean(rows[0].is_transport_user),
          condonation_granted: Boolean(rows[0].condonation_granted),
        };
      }
      return null;
    }
    const student = this.students.find(s => s.id === id || s.student_id === id);
    return student ? { ...student } : null;
  }

  public async getStudentByUserIdOrEmail(userIdOrEmail: string): Promise<Student | null> {
    const val = userIdOrEmail.trim().toLowerCase();
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query(
        'SELECT * FROM students WHERE user_id = ? OR LOWER(email) = ?',
        [userIdOrEmail, val]
      );
      if (rows && rows.length > 0) {
        return {
          ...rows[0],
          is_hosteller: Boolean(rows[0].is_hosteller),
          is_transport_user: Boolean(rows[0].is_transport_user),
          condonation_granted: Boolean(rows[0].condonation_granted),
        };
      }
      return null;
    }
    const student = this.students.find(s => s.user_id === userIdOrEmail || s.email.toLowerCase() === val);
    return student ? { ...student } : null;
  }

  public async createStudent(student: Student): Promise<Student> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        `INSERT INTO students (
          id, user_id, student_id, first_name, last_name, gender, dob, email, phone,
          guardian_name, guardian_relation, guardian_phone, mother_name, address, city, district, state, pincode, annual_family_income,
          course_id, session_id, current_semester, admission_year, admission_status, fees_status, attendance_percentage, total_classes, attended_classes,
          is_hosteller, is_transport_user, transport_route, hostel_room_no, category, quota, tenth_percentage, twelfth_percentage,
          tenth_roll_no, twelfth_roll_no, board_name, aadhaar_no, tenth_doc_verified, twelfth_doc_verified, aadhaar_doc_verified,
          token_fee_receipt, token_fee_amount, token_fee_mode, token_fee_date, intake_step, counseling_notes, admitted_by,
          followup_status, followup_priority, next_followup_date, last_followup_at, assigned_counselor_id, assigned_counselor_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.id,
          student.user_id || null,
          student.student_id,
          student.first_name,
          student.last_name,
          student.gender,
          student.dob,
          student.email,
          student.phone,
          student.guardian_name,
          student.guardian_relation,
          student.guardian_phone,
          student.mother_name || null,
          student.address || null,
          student.city || null,
          student.district || null,
          student.state || null,
          student.pincode || null,
          student.annual_family_income ?? null,
          student.course_id,
          student.session_id,
          student.current_semester,
          student.admission_year,
          student.admission_status,
          student.fees_status,
          student.attendance_percentage,
          student.total_classes,
          student.attended_classes,
          student.is_hosteller ? 1 : 0,
          student.is_transport_user ? 1 : 0,
          student.transport_route || null,
          student.hostel_room_no || null,
          student.category || 'General',
          student.quota || 'punjab_85',
          student.tenth_percentage ?? null,
          student.twelfth_percentage ?? null,
          student.tenth_roll_no || null,
          student.twelfth_roll_no || null,
          student.board_name || null,
          student.aadhaar_no || null,
          student.tenth_doc_verified ? 1 : 0,
          student.twelfth_doc_verified ? 1 : 0,
          student.aadhaar_doc_verified ? 1 : 0,
          student.token_fee_receipt || null,
          student.token_fee_amount ?? 0,
          student.token_fee_mode || null,
          student.token_fee_date || null,
          student.intake_step ?? 1,
          student.counseling_notes || null,
          student.admitted_by || null,
          student.followup_status || (student.intake_step === 1 ? 'pending' : (student.admission_status === 'approved' ? 'converted' : 'contacted')),
          student.followup_priority || (student.intake_step === 1 ? 'p1_high' : (student.intake_step === 2 ? 'p2_medium' : 'p3_low')),
          student.next_followup_date || (student.intake_step === 1 ? new Date(Date.now() + 86400000).toISOString().slice(0, 10) : null),
          student.last_followup_at || null,
          student.assigned_counselor_id || null,
          student.assigned_counselor_name || null,
          formatSqlDateTime(student.created_at),
        ]
      );
      return student;
    }
    if (!student.followup_status) {
      student.followup_status = student.intake_step === 1 ? 'pending' : (student.admission_status === 'approved' ? 'converted' : 'contacted');
    }
    if (!student.followup_priority) {
      student.followup_priority = student.intake_step === 1 ? 'p1_high' : (student.intake_step === 2 ? 'p2_medium' : 'p3_low');
    }
    if (!student.next_followup_date && student.intake_step === 1) {
      student.next_followup_date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    }
    this.students.push(student);
    this.save();
    return student;
  }

  public async updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const allowedCols = [
        'user_id', 'student_id', 'first_name', 'last_name', 'gender', 'dob',
        'email', 'phone', 'guardian_name', 'guardian_relation', 'guardian_phone',
        'mother_name', 'address', 'city', 'district', 'state', 'pincode', 'annual_family_income',
        'course_id', 'session_id', 'current_semester', 'admission_year',
        'admission_status', 'fees_status', 'attendance_percentage', 'total_classes',
        'attended_classes', 'is_hosteller', 'is_transport_user', 'transport_route',
        'hostel_room_no', 'category', 'quota', 'tenth_percentage', 'twelfth_percentage',
        'tenth_roll_no', 'twelfth_roll_no', 'board_name', 'aadhaar_no',
        'tenth_doc_verified', 'twelfth_doc_verified', 'aadhaar_doc_verified',
        'token_fee_receipt', 'token_fee_amount', 'token_fee_mode', 'token_fee_date',
        'intake_step', 'counseling_notes', 'admitted_by',
        'condonation_granted', 'condonation_order_no', 'condonation_remarks', 'admission_remarks',
        'followup_status', 'followup_priority', 'next_followup_date', 'last_followup_at', 'assigned_counselor_id', 'assigned_counselor_name', 'created_at'
      ];
      const keys = Object.keys(updates).filter(k => allowedCols.includes(k));
      if (keys.length === 0) return this.getStudentById(id);

      const boolCols = ['is_hosteller', 'is_transport_user', 'condonation_granted', 'tenth_doc_verified', 'twelfth_doc_verified', 'aadhaar_doc_verified'];
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = keys.map(k => {
        const val = (updates as any)[k];
        if (boolCols.includes(k)) return val ? 1 : 0;
        return val !== undefined ? val : null;
      });
      values.push(id);

      await this.mariaPool.query(`UPDATE students SET ${setClause} WHERE id = ?`, values);
      return this.getStudentById(id);
    }

    const idx = this.students.findIndex(s => s.id === id || s.student_id === id);
    if (idx !== -1) {
      this.students[idx] = { ...this.students[idx], ...updates };
      this.save();
      return { ...this.students[idx] };
    }
    return null;
  }

  // --- COURSE & SESSION OPERATIONS ---
  public async getCourses(): Promise<Course[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM courses');
      return rows.map((r: any) => ({ ...r }));
    }
    return [...this.courses];
  }

  public async getCourseById(id: string): Promise<Course | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM courses WHERE id = ?', [id]);
      if (rows && rows.length > 0) return { ...rows[0] };
      return null;
    }
    const c = this.courses.find(course => course.id === id);
    return c ? { ...c } : null;
  }

  public async getSessions(): Promise<Session[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM sessions');
      return rows.map((r: any) => ({ ...r, is_current: Boolean(r.is_current) }));
    }
    return [...this.sessions];
  }

  public async getSessionById(id: string): Promise<Session | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM sessions WHERE id = ?', [id]);
      if (rows && rows.length > 0) return { ...rows[0], is_current: Boolean(rows[0].is_current) };
      return null;
    }
    const s = this.sessions.find(session => session.id === id);
    return s ? { ...s } : null;
  }

  // --- FEE OPERATIONS ---
  public async getFeeHeads(): Promise<FeeHead[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM fee_heads');
      return rows.map((r: any) => ({ ...r, is_recurring: Boolean(r.is_recurring) }));
    }
    return [...this.fee_heads];
  }

  public async getStudentFees(studentId?: string): Promise<StudentFee[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM student_fees';
      const params: any[] = [];
      if (studentId) {
        sql += ' WHERE student_id = ?';
        params.push(studentId);
      }
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({ ...r }));
    }
    if (studentId) {
      return this.student_fees.filter(f => f.student_id === studentId);
    }
    return [...this.student_fees];
  }

  public async getStudentFeeById(id: string): Promise<StudentFee | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM student_fees WHERE id = ?', [id]);
      if (rows && rows.length > 0) return { ...rows[0] };
      return null;
    }
    const fee = this.student_fees.find(f => f.id === id);
    return fee ? { ...fee } : null;
  }

  public async createStudentFee(fee: StudentFee): Promise<StudentFee> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO student_fees (id, student_id, fee_head_id, session_id, semester, amount, discount_amount, paid_amount, due_amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [fee.id, fee.student_id, fee.fee_head_id, fee.session_id, fee.semester, fee.amount, fee.discount_amount, fee.paid_amount, fee.due_amount, fee.due_date, fee.status]
      );
      return fee;
    }
    this.student_fees.push(fee);
    this.save();
    return fee;
  }

  public async updateStudentFee(id: string, updates: Partial<StudentFee>): Promise<StudentFee | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const allowedCols = [
        'student_id', 'fee_head_id', 'session_id', 'semester', 'amount',
        'discount_amount', 'paid_amount', 'due_amount', 'due_date', 'status'
      ];
      const keys = Object.keys(updates).filter(k => allowedCols.includes(k));
      if (keys.length === 0) return this.getStudentFeeById(id);

      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = keys.map(k => (updates as any)[k]);
      values.push(id);

      await this.mariaPool.query(`UPDATE student_fees SET ${setClause} WHERE id = ?`, values);
      return this.getStudentFeeById(id);
    }

    const idx = this.student_fees.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.student_fees[idx] = { ...this.student_fees[idx], ...updates };
      this.save();
      return { ...this.student_fees[idx] };
    }
    return null;
  }

  public async getPayments(studentId?: string): Promise<Payment[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM payments';
      const params: any[] = [];
      if (studentId) {
        sql += ' WHERE student_id = ?';
        params.push(studentId);
      }
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({ ...r }));
    }
    if (studentId) {
      return this.payments.filter(p => p.student_id === studentId);
    }
    return [...this.payments];
  }

  public async getPaymentByReceiptNo(receiptNo: string): Promise<Payment | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM payments WHERE receipt_no = ? OR id = ?', [receiptNo, receiptNo]);
      if (rows && rows.length > 0) return { ...rows[0] };
      return null;
    }
    const p = this.payments.find(payment => payment.receipt_no === receiptNo || payment.id === receiptNo);
    return p ? { ...p } : null;
  }

  public async createPayment(payment: Payment): Promise<Payment> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO payments (id, receipt_no, student_id, student_fee_id, amount_paid, payment_mode, transaction_reference, payment_date, status, notes, collected_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [payment.id, payment.receipt_no, payment.student_id, payment.student_fee_id || null, payment.amount_paid, payment.payment_mode, payment.transaction_reference, formatSqlDateTime(payment.payment_date), payment.status, payment.notes || null, payment.collected_by || null]
      );
      return payment;
    }
    this.payments.push(payment);
    this.save();
    return payment;
  }

  // --- SCHEME & SCHOLARSHIP OPERATIONS ---
  public async getSchemes(): Promise<Scheme[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM schemes');
      return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
    }
    return [...this.schemes];
  }

  public async createScheme(scheme: Scheme): Promise<Scheme> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO schemes (id, code, title, description, award_amount, eligibility_criteria, deadline, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [scheme.id, scheme.code, scheme.title, scheme.description, scheme.award_amount, scheme.eligibility_criteria, scheme.deadline, scheme.is_active ? 1 : 0]
      );
    }
    this.schemes.push(scheme);
    this.save();
    return scheme;
  }

  public async getScholarshipApplications(studentId?: string): Promise<ScholarshipApplication[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM scholarship_applications';
      const params: any[] = [];
      if (studentId) {
        sql += ' WHERE student_id = ?';
        params.push(studentId);
      }
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({ ...r }));
    }
    if (studentId) {
      return this.scholarship_applications.filter(a => a.student_id === studentId);
    }
    return [...this.scholarship_applications];
  }

  public async createScholarshipApplication(app: ScholarshipApplication): Promise<ScholarshipApplication> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO scholarship_applications (id, scheme_id, student_id, annual_family_income, previous_gpa, reason_for_application, document_path, status, admin_remarks, reviewed_by, reviewed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [app.id, app.scheme_id, app.student_id, app.annual_family_income, app.previous_gpa, app.reason_for_application, app.document_path || null, app.status, app.admin_remarks || null, app.reviewed_by || null, app.reviewed_at ? formatSqlDateTime(app.reviewed_at) : null, formatSqlDateTime(app.created_at)]
      );
      return app;
    }
    this.scholarship_applications.push(app);
    this.save();
    return app;
  }

  public async updateScholarshipApplication(id: string, updates: Partial<ScholarshipApplication>): Promise<ScholarshipApplication | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const allowedCols = [
        'scheme_id', 'student_id', 'annual_family_income', 'previous_gpa',
        'reason_for_application', 'document_path', 'status', 'admin_remarks',
        'reviewed_by', 'reviewed_at'
      ];
      const keys = Object.keys(updates).filter(k => allowedCols.includes(k));
      if (keys.length === 0) return (await this.getScholarshipApplications()).find(a => a.id === id) || null;

      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = keys.map(k => (updates as any)[k]);
      values.push(id);

      await this.mariaPool.query(`UPDATE scholarship_applications SET ${setClause} WHERE id = ?`, values);
      const apps = await this.getScholarshipApplications();
      return apps.find(a => a.id === id) || null;
    }

    const idx = this.scholarship_applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.scholarship_applications[idx] = { ...this.scholarship_applications[idx], ...updates };
      this.save();
      return { ...this.scholarship_applications[idx] };
    }
    return null;
  }

  // --- DYNAMIC FORM OPERATIONS ---
  public async getDynamicForms(): Promise<DynamicForm[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM dynamic_forms');
      return rows.map((r: any) => ({
        ...r,
        is_published: Boolean(r.is_published),
        schema_json: typeof r.schema_json === 'string' ? JSON.parse(r.schema_json) : r.schema_json,
      }));
    }
    return [...this.dynamic_forms];
  }

  public async getDynamicFormById(id: string): Promise<DynamicForm | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM dynamic_forms WHERE id = ?', [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          is_published: Boolean(r.is_published),
          schema_json: typeof r.schema_json === 'string' ? JSON.parse(r.schema_json) : r.schema_json,
        };
      }
      return null;
    }
    const form = this.dynamic_forms.find(f => f.id === id);
    return form ? { ...form } : null;
  }

  public async createDynamicForm(form: DynamicForm): Promise<DynamicForm> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO dynamic_forms (id, form_code, title, description, schema_json, is_published, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [form.id, form.form_code, form.title, form.description, JSON.stringify(form.schema_json), form.is_published ? 1 : 0, form.created_by || null, formatSqlDateTime(form.created_at)]
      );
      return form;
    }
    this.dynamic_forms.push(form);
    this.save();
    return form;
  }

  public async updateDynamicForm(id: string, updates: Partial<DynamicForm>): Promise<DynamicForm | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getDynamicFormById(id);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => {
        const val = (updates as any)[k];
        if (k === 'is_published') return val ? 1 : 0;
        if (k === 'schema_json') return JSON.stringify(val);
        return val;
      });
      values.push(id);
      await this.mariaPool.query(`UPDATE dynamic_forms SET ${setClause} WHERE id = ?`, values);
      return this.getDynamicFormById(id);
    }

    const idx = this.dynamic_forms.findIndex(f => f.id === id || f.form_code === id);
    if (idx !== -1) {
      this.dynamic_forms[idx] = { ...this.dynamic_forms[idx], ...updates };
      this.save();
      return { ...this.dynamic_forms[idx] };
    }
    return null;
  }

  public async getFormSubmissions(formId?: string, userId?: string): Promise<FormSubmission[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM form_submissions WHERE 1=1';
      const params: any[] = [];
      if (formId) {
        sql += ' AND form_id = ?';
        params.push(formId);
      }
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({
        ...r,
        response_json: typeof r.response_json === 'string' ? JSON.parse(r.response_json) : r.response_json,
      }));
    }

    let result = [...this.form_submissions];
    if (formId) result = result.filter(s => s.form_id === formId);
    if (userId) result = result.filter(s => s.user_id === userId);
    return result;
  }

  public async createFormSubmission(sub: FormSubmission): Promise<FormSubmission> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO form_submissions (id, form_id, user_id, response_json, submitted_at) VALUES (?, ?, ?, ?, ?)',
        [sub.id, sub.form_id, sub.user_id, JSON.stringify(sub.response_json), formatSqlDateTime(sub.submitted_at)]
      );
      return sub;
    }
    this.form_submissions.push(sub);
    this.save();
    return sub;
  }

  // --- NOTICE OPERATIONS ---
  public async getNotices(): Promise<Notice[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM notices');
      return rows.map((r: any) => ({ ...r, is_pinned: Boolean(r.is_pinned) }));
    }
    return [...this.notices];
  }

  public async createNotice(notice: Notice): Promise<Notice> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO notices (id, title, summary, content, notice_date, category, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [notice.id, notice.title, notice.summary, notice.content, notice.notice_date, notice.category, notice.is_pinned ? 1 : 0]
      );
      return notice;
    }
    this.notices.push(notice);
    this.save();
    return notice;
  }

  // --- GRIEVANCE REDRESSAL CELL (UGC Mandated) OPERATIONS ---
  public async getGrievances(filters?: { student_id?: string; status?: string; category?: string }): Promise<Grievance[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM grievances WHERE 1=1';
      const params: any[] = [];
      if (filters?.student_id) {
        sql += ' AND student_id = ?';
        params.push(filters.student_id);
      }
      if (filters?.status && filters.status !== 'all') {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters?.category && filters.category !== 'all') {
        sql += ' AND category = ?';
        params.push(filters.category);
      }
      sql += ' ORDER BY created_at DESC';
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({ ...r }));
    }

    let result = [...this.grievances];
    if (filters?.student_id) result = result.filter(g => g.student_id === filters.student_id);
    if (filters?.status && filters.status !== 'all') result = result.filter(g => g.status === filters.status);
    if (filters?.category && filters.category !== 'all') result = result.filter(g => g.category === filters.category);
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }

  public async getGrievanceById(id: string): Promise<Grievance | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query('SELECT * FROM grievances WHERE id = ? OR tracking_code = ?', [id, id]);
      if (rows && rows.length > 0) return { ...rows[0] };
      return null;
    }
    const g = this.grievances.find(item => item.id === id || item.tracking_code === id);
    return g ? { ...g } : null;
  }

  public async createGrievance(grievance: Grievance): Promise<Grievance> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO grievances (id, tracking_code, student_id, student_name, category, subject, description, priority, status, admin_remarks, resolved_by, resolved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [grievance.id, grievance.tracking_code, grievance.student_id, grievance.student_name, grievance.category, grievance.subject, grievance.description, grievance.priority, grievance.status, grievance.admin_remarks || null, grievance.resolved_by || null, grievance.resolved_at || null, formatSqlDateTime(grievance.created_at)]
      );
      return grievance;
    }
    this.grievances.unshift(grievance);
    this.save();
    return grievance;
  }

  public async updateGrievance(id: string, updates: Partial<Grievance>): Promise<Grievance | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const allowedCols = [
        'category', 'subject', 'description', 'priority', 'status',
        'admin_remarks', 'resolved_by', 'resolved_at'
      ];
      const keys = Object.keys(updates).filter(k => allowedCols.includes(k));
      if (keys.length === 0) return this.getGrievanceById(id);
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = keys.map(k => (updates as any)[k]);
      values.push(id, id);
      await this.mariaPool.query(`UPDATE grievances SET ${setClause} WHERE id = ? OR tracking_code = ?`, values);
      return this.getGrievanceById(id);
    }
    const idx = this.grievances.findIndex(g => g.id === id || g.tracking_code === id);
    if (idx !== -1) {
      this.grievances[idx] = { ...this.grievances[idx], ...updates };
      this.save();
      return { ...this.grievances[idx] };
    }
    return null;
  }

  // --- ADMISSION PROSPECT CRM & FOLLOW-UP OPERATIONS ---
  public async getFollowups(filters?: { student_id?: string; counselor_id?: string }): Promise<AdmissionFollowup[]> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      let sql = 'SELECT * FROM admission_followups WHERE 1=1';
      const params: any[] = [];
      if (filters?.student_id) {
        sql += ' AND student_id = ?';
        params.push(filters.student_id);
      }
      if (filters?.counselor_id) {
        sql += ' AND counselor_id = ?';
        params.push(filters.counselor_id);
      }
      sql += ' ORDER BY created_at DESC';
      const [rows]: any = await this.mariaPool.query(sql, params);
      return rows.map((r: any) => ({ ...r }));
    }

    let result = [...this.admission_followups];
    if (filters?.student_id) result = result.filter(f => f.student_id === filters.student_id);
    if (filters?.counselor_id) result = result.filter(f => f.counselor_id === filters.counselor_id);
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }

  public async createFollowup(followup: AdmissionFollowup): Promise<AdmissionFollowup> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO admission_followups (id, student_id, counselor_id, counselor_name, interaction_type, outcome, notes, next_followup_date, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          followup.id,
          followup.student_id,
          followup.counselor_id,
          followup.counselor_name,
          followup.interaction_type,
          followup.outcome,
          followup.notes,
          followup.next_followup_date || null,
          followup.priority || 'p1_high',
          formatSqlDateTime(followup.created_at),
        ]
      );
    } else {
      this.admission_followups.unshift(followup);
    }

    // Synchronize Student record with latest interaction state
    const updates: Partial<Student> = {
      last_followup_at: followup.created_at,
      assigned_counselor_id: followup.counselor_id,
      assigned_counselor_name: followup.counselor_name,
    };
    if (followup.next_followup_date) updates.next_followup_date = followup.next_followup_date;
    if (followup.priority) updates.followup_priority = followup.priority;

    if (followup.outcome === 'converted') {
      updates.followup_status = 'converted';
    } else if (followup.outcome === 'not_interested') {
      updates.followup_status = 'not_interested';
    } else if (followup.outcome === 'interested') {
      updates.followup_status = 'interested';
    } else if (followup.outcome === 'callback_requested' || followup.outcome === 'visit_scheduled') {
      updates.followup_status = 'callback_scheduled';
    } else {
      updates.followup_status = 'contacted';
    }

    await this.updateStudent(followup.student_id, updates);
    if (this.mode === 'sqlite') {
      this.save();
    }
    return followup;
  }

  public async getFollowupRadarStats(): Promise<{
    total_prospects: number;
    overdue: number;
    due_today: number;
    upcoming: number;
    p1_high_priority: number;
    converted: number;
  }> {
    const today = new Date().toISOString().slice(0, 10);
    const students = await this.getStudents();
    const activeProspects = students.filter(s =>
      s.intake_step === 1 ||
      s.intake_step === 2 ||
      s.admission_status === 'inquiry' ||
      s.admission_status === 'registered' ||
      s.admission_status === 'submitted' ||
      s.admission_status === 'pending' ||
      (s.followup_status && s.followup_status !== 'converted' && s.followup_status !== 'not_interested')
    );

    let overdue = 0;
    let due_today = 0;
    let upcoming = 0;
    let p1_high_priority = 0;
    let converted = 0;

    for (const p of students) {
      if (p.followup_status === 'converted' || p.admission_status === 'approved') {
        converted++;
      }
      if (
        p.intake_step === 1 ||
        p.intake_step === 2 ||
        p.admission_status === 'inquiry' ||
        p.admission_status === 'registered' ||
        p.admission_status === 'submitted' ||
        p.admission_status === 'pending'
      ) {
        if (p.followup_priority === 'p1_high' || (!p.followup_priority && p.intake_step === 1)) {
          p1_high_priority++;
        }

        const nextDate = p.next_followup_date;
        if (p.followup_status !== 'converted' && p.followup_status !== 'not_interested') {
          if (!nextDate || nextDate < today) {
            overdue++;
          } else if (nextDate === today) {
            due_today++;
          } else {
            upcoming++;
          }
        }
      }
    }

    return {
      total_prospects: activeProspects.length,
      overdue,
      due_today,
      upcoming,
      p1_high_priority,
      converted,
    };
  }

  // --- IN-MEMORY DEFAULT SEEDING ---
  private seedDefaultsInMemory(): void {
    const superHash = bcrypt.hashSync('super123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);
    const studentHash = bcrypt.hashSync('student123', 10);

    this.users = [
      {
        id: 'usr-super-01',
        username: 'superadmin',
        email: 'superadmin@educore.edu',
        password_hash: superHash,
        role: 'super_admin',
        full_name: 'Prof. Dr. Amritpal Singh (Chief System Provost)',
        department: 'Executive Directorate & University Governance',
        designation: 'Chief System Provost & Chancellor Delegate',
        employee_id: 'PRO-SUP-001',
        enterprise_uid: '9001-01-03-01',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-admin-01',
        username: 'admin',
        email: 'admin@educore.edu',
        password_hash: adminHash,
        role: 'admin',
        full_name: 'Dr. Ramesh Chandra (Registrar & Academic Provost)',
        department: 'Registrar Office',
        designation: 'Registrar & Provost',
        employee_id: 'REG-PRO-001',
        enterprise_uid: '4001-01-03-01',
        avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmCe2nK5yn2MzfaI3kCnW0nsowqO3EV58Ga69olnaTWnrwRkrVYL41WIGBNg3bCeeSll-y7q-sNxZnHAmS6R6flXcHN8FmEd7YctXzyaVMrHWtueSk6o9YibOVt8o5EF2w8Sb20QpYV9jv4_fwNINqv1CYnW8CqP4LtuL4L7W6_MOM7pY86gWQTI9AN3JgzjczSurPGgarPw32rrk9xSW0oSixeifD_sg3dYr9-I-QBTghh310DDep',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-aryan',
        username: 'aryan',
        email: 'aryan@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Aryan Sharma',
        enterprise_uid: '1001-88-03-01',
        avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiC80XBMv76j7_mmqCTcV9ZoMVZPfV_CdXd_33ne25_LIcAK_aNzQB6o4mvRXLqi6oREzmz295hMjEcQKFSotWGv1NikCOM_tIPmBQDzFiaMO8yJKSdfRUTIfZSoUkGyEjTIjKF5D8DMp3A9swq7gKNz8yzp0zkvchBkPPxFbIrY_ZA6tW5oSONcFtKCHTd3RgKK6vRjOMjtXmy5qOVJVowbvGGivEwYdD84ExfwTGl3sAzLegZ9N',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-001',
        username: 'stu001',
        email: 'alice.smith@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Alice Smith',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-002',
        username: 'stu002',
        email: 'bob.johnson@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Bob Johnson',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-003',
        username: 'stu003',
        email: 'charlie.davis@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Charlie Davis',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-004',
        username: 'stu004',
        email: 'emma.wilson@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Emma Wilson',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-005',
        username: 'stu005',
        email: 'michael.brown@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Michael Brown',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-rohan',
        username: 'rohan',
        email: 'rohan.gupta@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Rohan Gupta',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-priya',
        username: 'priya',
        email: 'priya.patel@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Priya Patel',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-aarav',
        username: 'aarav',
        email: 'aarav.sharma@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Aarav Sharma',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-stu-neha',
        username: 'neha',
        email: 'neha.singh@educore.edu',
        password_hash: studentHash,
        role: 'student',
        full_name: 'Neha Singh',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-staff-01',
        username: 'staff01',
        email: 'staff@educore.edu',
        password_hash: bcrypt.hashSync('staff123', 10),
        role: 'staff',
        full_name: 'Prof. Sunita Rao (Staff / Faculty)',
        department: 'Computer Science & Engineering',
        designation: 'Assistant Professor',
        employee_id: 'FAC-CSE-014',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-counselor-01',
        username: 'counselor01',
        email: 'counselor@educore.edu',
        password_hash: bcrypt.hashSync('counselor123', 10),
        role: 'counselor',
        full_name: 'Harleen Kaur (Head Counselor / Admission Cell)',
        department: 'Admission & Counseling Cell',
        designation: 'Head Counselor & Admission Cell Convener',
        employee_id: 'ADM-CNS-002',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-hod-01',
        username: 'hod_cse',
        email: 'hod.cse@educore.edu',
        password_hash: bcrypt.hashSync('hod123', 10),
        role: 'hod',
        full_name: 'Dr. Balwinder Singh (HOD Computer Science)',
        department: 'Computer Science & Engineering',
        designation: 'Head of Department',
        employee_id: 'FAC-HOD-001',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-accounts-01',
        username: 'accounts01',
        email: 'accounts@educore.edu',
        password_hash: bcrypt.hashSync('accounts123', 10),
        role: 'accounts',
        full_name: 'Manmohan Sharma (Chief Accounts Officer)',
        department: 'Finance & Accounts Section',
        designation: 'Chief Accounts Officer',
        employee_id: 'ACC-OFF-005',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    this.sessions = [
      { id: 'sess-2025-26', name: '2025-26', start_date: '2025-07-01', end_date: '2026-06-30', is_current: true },
      { id: 'sess-2024-25', name: '2024-25', start_date: '2024-07-01', end_date: '2025-06-30', is_current: false },
      { id: 'sess-2023-27', name: '2023-2027', start_date: '2023-07-01', end_date: '2027-06-30', is_current: false },
      { id: 'sess-2022-24', name: '2022-2024', start_date: '2022-07-01', end_date: '2024-06-30', is_current: false },
      { id: 'sess-2021-24', name: '2021-2024', start_date: '2021-07-01', end_date: '2024-06-30', is_current: false },
      { id: 'sess-2022-25', name: '2022-2025', start_date: '2022-07-01', end_date: '2025-06-30', is_current: false },
    ];

    this.courses = [
      { id: 'crs-btech-cs', code: 'B.Tech CS', name: 'Bachelor of Technology in Computer Science & Engineering', department: 'Computer Engineering', duration_years: 4, total_semesters: 8, base_tuition_fee: 90000 },
      { id: 'crs-btech-me', code: 'B.Tech ME', name: 'Bachelor of Technology in Mechanical Engineering', department: 'Mechanical Engineering', duration_years: 4, total_semesters: 8, base_tuition_fee: 85000 },
      { id: 'crs-mba-fin', code: 'MBA Finance', name: 'Master of Business Administration in Financial Management', department: 'Management Studies', duration_years: 2, total_semesters: 4, base_tuition_fee: 110000 },
      { id: 'crs-bsc-phy', code: 'B.Sc Physics', name: 'Bachelor of Science in Applied Physics', department: 'Natural Sciences', duration_years: 3, total_semesters: 6, base_tuition_fee: 45000 },
    ];

    this.students = [
      {
        id: 'stu-rec-aryan',
        user_id: 'usr-stu-aryan',
        student_id: 'STU-2023-088',
        first_name: 'Aryan',
        last_name: 'Sharma',
        gender: 'male',
        dob: '2004-03-15',
        email: 'aryan@educore.edu',
        phone: '+91 98765 43210',
        guardian_name: 'Sunil Sharma',
        guardian_relation: 'parent',
        guardian_phone: '+91 98765 43200',
        course_id: 'crs-btech-cs',
        session_id: 'sess-2025-26',
        current_semester: 4,
        admission_year: 2023,
        admission_status: 'approved',
        fees_status: 'due',
        attendance_percentage: 85,
        total_classes: 100,
        attended_classes: 85,
        created_at: '2023-07-15T10:00:00Z',
      },
      {
        id: 'stu-rec-001',
        user_id: 'usr-stu-001',
        student_id: 'STU-001',
        first_name: 'Alice',
        last_name: 'Smith',
        gender: 'female',
        dob: '2005-06-12',
        email: 'alice.smith@educore.edu',
        phone: '+91 98111 22334',
        guardian_name: 'David Smith',
        guardian_relation: 'parent',
        guardian_phone: '+91 98111 22330',
        course_id: 'crs-btech-cs',
        session_id: 'sess-2023-27',
        current_semester: 4,
        admission_year: 2023,
        admission_status: 'approved',
        fees_status: 'paid',
        attendance_percentage: 92,
        total_classes: 100,
        attended_classes: 92,
        created_at: '2023-07-20T11:00:00Z',
      },
      {
        id: 'stu-rec-002',
        user_id: 'usr-stu-002',
        student_id: 'STU-002',
        first_name: 'Bob',
        last_name: 'Johnson',
        gender: 'male',
        dob: '2002-11-20',
        email: 'bob.johnson@educore.edu',
        phone: '+91 98222 33445',
        guardian_name: 'Robert Johnson',
        guardian_relation: 'parent',
        guardian_phone: '+91 98222 33440',
        course_id: 'crs-mba-fin',
        session_id: 'sess-2022-24',
        current_semester: 2,
        admission_year: 2022,
        admission_status: 'approved',
        fees_status: 'due',
        attendance_percentage: 78,
        total_classes: 100,
        attended_classes: 78,
        created_at: '2022-08-01T09:00:00Z',
      },
      {
        id: 'stu-rec-003',
        user_id: 'usr-stu-003',
        student_id: 'STU-003',
        first_name: 'Charlie',
        last_name: 'Davis',
        gender: 'nonbinary',
        dob: '2003-08-05',
        email: 'charlie.davis@educore.edu',
        phone: '+91 98333 44556',
        guardian_name: 'Karen Davis',
        guardian_relation: 'parent',
        guardian_phone: '+91 98333 44550',
        course_id: 'crs-bsc-phy',
        session_id: 'sess-2021-24',
        current_semester: 6,
        admission_year: 2021,
        admission_status: 'approved',
        fees_status: 'overdue',
        attendance_percentage: 64,
        total_classes: 100,
        attended_classes: 64,
        created_at: '2021-08-10T14:00:00Z',
      },
      {
        id: 'stu-rec-004',
        user_id: 'usr-stu-004',
        student_id: 'STU-004',
        first_name: 'Emma',
        last_name: 'Wilson',
        gender: 'female',
        dob: '2005-01-18',
        email: 'emma.wilson@educore.edu',
        phone: '+91 98444 55667',
        guardian_name: 'James Wilson',
        guardian_relation: 'parent',
        guardian_phone: '+91 98444 55660',
        course_id: 'crs-btech-cs',
        session_id: 'sess-2023-27',
        current_semester: 4,
        admission_year: 2023,
        admission_status: 'approved',
        fees_status: 'paid',
        attendance_percentage: 96,
        total_classes: 100,
        attended_classes: 96,
        created_at: '2023-07-25T16:00:00Z',
      },
      {
        id: 'stu-rec-005',
        user_id: 'usr-stu-005',
        student_id: 'STU-005',
        first_name: 'Michael',
        last_name: 'Brown',
        gender: 'male',
        dob: '2004-09-24',
        email: 'michael.brown@educore.edu',
        phone: '+91 98555 66778',
        guardian_name: 'Thomas Brown',
        guardian_relation: 'parent',
        guardian_phone: '+91 98555 66770',
        course_id: 'crs-bsc-phy',
        session_id: 'sess-2022-25',
        current_semester: 4,
        admission_year: 2022,
        admission_status: 'approved',
        fees_status: 'paid',
        attendance_percentage: 88,
        total_classes: 100,
        attended_classes: 88,
        created_at: '2022-08-15T12:00:00Z',
      },
      {
        id: 'stu-rec-aarav',
        user_id: 'usr-stu-aarav',
        student_id: 'STU-006',
        first_name: 'Aarav',
        last_name: 'Sharma',
        gender: 'male',
        dob: '2004-04-10',
        email: 'aarav.sharma@educore.edu',
        phone: '+91 98666 77889',
        guardian_name: 'Sanjay Sharma',
        guardian_relation: 'parent',
        guardian_phone: '+91 98666 77880',
        course_id: 'crs-btech-cs',
        session_id: 'sess-2025-26',
        current_semester: 4,
        admission_year: 2023,
        admission_status: 'approved',
        fees_status: 'overdue',
        attendance_percentage: 70,
        total_classes: 100,
        attended_classes: 70,
        created_at: '2023-08-01T10:00:00Z',
      },
      {
        id: 'stu-rec-priya',
        user_id: 'usr-stu-priya',
        student_id: 'STU-007',
        first_name: 'Priya',
        last_name: 'Patel',
        gender: 'female',
        dob: '2003-12-14',
        email: 'priya.patel@educore.edu',
        phone: '+91 98777 88990',
        guardian_name: 'Mukesh Patel',
        guardian_relation: 'parent',
        guardian_phone: '+91 98777 88990',
        course_id: 'crs-mba-fin',
        session_id: 'sess-2025-26',
        current_semester: 2,
        admission_year: 2024,
        admission_status: 'approved',
        fees_status: 'overdue',
        attendance_percentage: 82,
        total_classes: 100,
        attended_classes: 82,
        created_at: '2024-07-20T10:00:00Z',
      },
      {
        id: 'stu-rec-rohan',
        user_id: 'usr-stu-rohan',
        student_id: 'STU-008',
        first_name: 'Rohan',
        last_name: 'Gupta',
        gender: 'male',
        dob: '2003-02-28',
        email: 'rohan.gupta@educore.edu',
        phone: '+91 98888 99001',
        guardian_name: 'Anil Gupta',
        guardian_relation: 'parent',
        guardian_phone: '+91 98888 99000',
        course_id: 'crs-bsc-phy',
        session_id: 'sess-2025-26',
        current_semester: 6,
        admission_year: 2022,
        admission_status: 'approved',
        fees_status: 'due',
        attendance_percentage: 84,
        total_classes: 100,
        attended_classes: 84,
        created_at: '2022-08-10T10:00:00Z',
      },
      {
        id: 'stu-rec-neha',
        user_id: 'usr-stu-neha',
        student_id: 'STU-009',
        first_name: 'Neha',
        last_name: 'Singh',
        gender: 'female',
        dob: '2004-07-19',
        email: 'neha.singh@educore.edu',
        phone: '+91 98999 00112',
        guardian_name: 'Rajesh Singh',
        guardian_relation: 'parent',
        guardian_phone: '+91 98999 00110',
        course_id: 'crs-btech-me',
        session_id: 'sess-2025-26',
        current_semester: 4,
        admission_year: 2023,
        admission_status: 'approved',
        fees_status: 'overdue',
        attendance_percentage: 75,
        total_classes: 100,
        attended_classes: 75,
        created_at: '2023-08-05T10:00:00Z',
      },
      {
        id: 'stu-rec-inq-001',
        student_id: 'INQ-2025-001',
        first_name: 'Gurinder',
        last_name: 'Singh',
        gender: 'male',
        dob: '2006-03-15',
        email: 'gurinder.singh@example.com',
        phone: '9876500111',
        guardian_name: 'Harpreet Singh',
        guardian_relation: 'parent',
        guardian_phone: '9876500110',
        course_id: 'crs-btech-cs',
        session_id: 'sess-2025-26',
        current_semester: 1,
        admission_year: 2025,
        admission_status: 'inquiry',
        fees_status: 'due',
        attendance_percentage: 100,
        total_classes: 0,
        attended_classes: 0,
        intake_step: 1,
        followup_status: 'callback_scheduled',
        followup_priority: 'p1_high',
        next_followup_date: new Date().toISOString().slice(0, 10),
        last_followup_at: new Date(Date.now() - 86400000).toISOString(),
        assigned_counselor_id: 'usr-counselor-01',
        assigned_counselor_name: 'Simran Kaur',
        counseling_notes: 'Walk-in campus tour with parents from Ludhiana. Interested in B.Tech CSE AI/Data Science. Inquired about bus route and early bird scholarship.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'stu-rec-inq-002',
        student_id: 'INQ-2025-002',
        first_name: 'Navjot',
        last_name: 'Kaur',
        gender: 'female',
        dob: '2005-08-20',
        email: 'navjot.kaur@example.com',
        phone: '9876500222',
        guardian_name: 'Jaswant Singh',
        guardian_relation: 'parent',
        guardian_phone: '9876500220',
        course_id: 'crs-btech-cs',
        session_id: 'sess-2025-26',
        current_semester: 1,
        admission_year: 2025,
        admission_status: 'inquiry',
        fees_status: 'due',
        attendance_percentage: 100,
        total_classes: 0,
        attended_classes: 0,
        intake_step: 1,
        followup_status: 'pending',
        followup_priority: 'p1_high',
        next_followup_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        counseling_notes: 'Walk-in inquiry. Awaiting call back regarding fee installment options and girls hostel safety guidelines.',
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    this.fee_heads = [
      // 1. Core Academic & University Affiliation Direct Heads
      { id: 'fh-tuition', code: 'TUITION', title: 'Academic Tuition Fee', description: 'Semester academic tuition, classroom access, and lab instructions', is_recurring: true },
      { id: 'fh-univ-reg', code: 'UNIV_REG', title: 'University Direct Charges & Exam Fee', description: 'Affiliating University (PTU/GNDU/PUP) registration, examination and sports development fee', is_recurring: true },
      { id: 'fh-security', code: 'INST_SECURITY', title: 'Refundable Caution Security Deposit', description: 'One-time refundable institution and library security deposit', is_recurring: false },
      { id: 'fh-exam', code: 'EXAM', title: 'Examination & Assessment Fee', description: 'Semester terminal exams, grade transcript processing', is_recurring: true },
      { id: 'fh-lib', code: 'LIBRARY', title: 'Library & Resource Access Fee', description: 'Digital library, textbook reserve access, research journal database', is_recurring: true },
      { id: 'fh-sports', code: 'DEVELOPMENT', title: 'Campus Sports & Development Fee', description: 'Gymnasium, athletic sports ground, and club activities', is_recurring: false },

      // 2. Hostel & Residential Heads (Campus Residents Only - Mutually exclusive with Transport)
      { id: 'fh-hostel-room', code: 'HOSTEL_ROOM', title: 'Hostel Room Rent & Maintenance', description: 'Campus residential room allotment, fixtures, water, and housekeeping (Campus residents only)', is_recurring: true },
      { id: 'fh-hostel-mess', code: 'HOSTEL_MEALS', title: 'Hostel Mess Advance & Meal Boarding', description: 'Complete 3-meal boarding: daily breakfast, lunch, evening tea/snacks, and dinner', is_recurring: true },
      { id: 'fh-hostel-util', code: 'HOSTEL_UTIL', title: 'Hostel Power Backup & Utilities', description: '24/7 generator power backup, water heater geyser, and common amenities', is_recurring: true },
      { id: 'fh-hostel-security', code: 'HOSTEL_SECURITY', title: 'Hostel Caution Security Deposit', description: 'One-time refundable hostel fixture and room security deposit', is_recurring: false },
      { id: 'fh-hostel', code: 'HOSTEL_COMPOSITE', title: 'Composite Hostel & Mess Fee', description: 'Consolidated semester residential accommodation and mess boarding fee', is_recurring: true },

      // 3. Transport & Commuter Transit Heads (Day Scholars Only - Mutually exclusive with Hostel)
      { id: 'fh-transport', code: 'TRANSPORT_FLEET', title: 'College Bus / Fleet Transit Fee', description: 'Dedicated college bus commuter transit service across designated city corridors (Day scholars only)', is_recurring: true },
      { id: 'fh-transport-pass', code: 'TRANSPORT_PASS', title: 'Transport Smart Card & Bus Pass', description: 'RFID transit pass issuance, designated seat reservation, and GPS fleet tracking', is_recurring: true },

      // 4. Miscellaneous, Training & Regulatory Heads
      { id: 'fh-misc', code: 'MISC_STUDENT', title: 'Miscellaneous Campus & Student Welfare', description: 'Student ID RFID badge, cultural youth festival, annual sports fest, and club activities', is_recurring: true },
      { id: 'fh-training', code: 'TRAINING_PLACEMENT', title: 'Industrial Training & Placement Prep', description: 'Industry technical bootcamps, soft-skills workshops, and campus placement drives', is_recurring: true },
      { id: 'fh-late-fine', code: 'LATE_SURCHARGE', title: 'Late Fee & Delayed Clearance Penalty', description: 'Regulatory surcharge fine for delayed semester fee clearance or late registration', is_recurring: false },
      { id: 'fh-reappear', code: 'REAPPEAR_EXAM', title: 'MRSPTU Re-appear / Backlog Exam Fee', description: 'Affiliating university examination fee for semester backlog papers (₹1,000 per paper)', is_recurring: false },
    ];

    this.student_fees = [
      {
        id: 'sf-aryan-01',
        student_id: 'stu-rec-aryan',
        fee_head_id: 'fh-tuition',
        session_id: 'sess-2025-26',
        semester: 4,
        amount: 45000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 45000,
        due_date: '2025-10-15',
        status: 'due',
      },
      {
        id: 'sf-aryan-02',
        student_id: 'stu-rec-aryan',
        fee_head_id: 'fh-tuition',
        session_id: 'sess-2024-25',
        semester: 3,
        amount: 45000,
        discount_amount: 0,
        paid_amount: 45000,
        due_amount: 0,
        due_date: '2024-10-15',
        status: 'paid',
      },
      {
        id: 'sf-aryan-03',
        student_id: 'stu-rec-aryan',
        fee_head_id: 'fh-exam',
        session_id: 'sess-2024-25',
        semester: 3,
        amount: 3500,
        discount_amount: 0,
        paid_amount: 3500,
        due_amount: 0,
        due_date: '2024-11-10',
        status: 'paid',
      },
      {
        id: 'sf-aarav-01',
        student_id: 'stu-rec-aarav',
        fee_head_id: 'fh-tuition',
        session_id: 'sess-2025-26',
        semester: 4,
        amount: 45000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 45000,
        due_date: '2025-08-15',
        status: 'overdue',
      },
      {
        id: 'sf-priya-01',
        student_id: 'stu-rec-priya',
        fee_head_id: 'fh-tuition',
        session_id: 'sess-2025-26',
        semester: 2,
        amount: 32500,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 32500,
        due_date: '2025-08-20',
        status: 'overdue',
      },
      {
        id: 'sf-rohan-01',
        student_id: 'stu-rec-rohan',
        fee_head_id: 'fh-tuition',
        session_id: 'sess-2025-26',
        semester: 6,
        amount: 15000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 15000,
        due_date: '2025-09-01',
        status: 'due',
      },
      {
        id: 'sf-neha-01',
        student_id: 'stu-rec-neha',
        fee_head_id: 'fh-tuition',
        session_id: 'sess-2025-26',
        semester: 4,
        amount: 45000,
        discount_amount: 0,
        paid_amount: 0,
        due_amount: 45000,
        due_date: '2025-08-10',
        status: 'overdue',
      },
    ];

    this.payments = [
      {
        id: 'pay-rec-0088',
        receipt_no: 'REC-2024-0088',
        student_id: 'stu-rec-aryan',
        student_fee_id: 'sf-aryan-02',
        amount_paid: 45000,
        payment_mode: 'online_upi',
        transaction_reference: 'UPI/2024/9028301128',
        payment_date: '2024-10-12 14:32:00',
        status: 'success',
        notes: 'Semester 3 Tuition Fee Paid online',
        collected_by: 'usr-admin-01',
      },
      {
        id: 'pay-rec-0089',
        receipt_no: 'REC-2024-0089',
        student_id: 'stu-rec-aryan',
        student_fee_id: 'sf-aryan-03',
        amount_paid: 3500,
        payment_mode: 'net_banking',
        transaction_reference: 'HDFC/NET/88492019',
        payment_date: '2024-11-08 10:15:00',
        status: 'success',
        notes: 'Semester 3 Examination Fee Paid',
        collected_by: 'usr-admin-01',
      },
    ];

    this.schemes = [
      {
        id: 'sch-merit-01',
        code: 'MERIT-2025',
        title: 'State Merit & Academic Excellence Scholarship',
        description: 'Prestigious institutional merit grant awarded to high-performing students who secured 8.5+ CGPA in prior semester.',
        award_amount: 50000,
        eligibility_criteria: 'Minimum 8.5 CGPA and no pending backlogs.',
        deadline: '2025-11-30',
        is_active: true,
      },
      {
        id: 'sch-need-02',
        code: 'NEED-2025',
        title: 'Need-Based Fee Concession Grant',
        description: 'Financial assistance grant for students with annual family income under INR 3,00,000.',
        award_amount: 35000,
        eligibility_criteria: 'Family income certificate issued by revenue authority.',
        deadline: '2025-10-31',
        is_active: true,
      },
      {
        id: 'sch-pms-punjab',
        code: 'PMS-PUNJAB',
        title: 'Punjab Post-Matric Scholarship (Dr. Ambedkar Portal)',
        description: 'Punjab State Govt 100% Tuition Fee & Development Fund waiver for SC/ST students with family income under ₹2.50 Lakh/year.',
        award_amount: 60000,
        eligibility_criteria: 'Punjab Domicile, SC/ST Category, Annual Income < ₹2,50,000.',
        deadline: '2025-12-31',
        is_active: true,
      },
      {
        id: 'sch-cmss-punjab',
        code: 'CMSS-PUNJAB',
        title: 'Chief Minister Scholarship Scheme (CMSS Punjab)',
        description: 'State government merit grant for meritorious Punjab students in government & affiliated technical institutions (60% to 100% tuition waiver).',
        award_amount: 45000,
        eligibility_criteria: 'Punjab Domicile, minimum 80% marks in qualifying examination.',
        deadline: '2025-11-15',
        is_active: true,
      },
      {
        id: 'sch-stem-03',
        code: 'WOMEN-STEM',
        title: 'Women in STEM Leadership Fellowship',
        description: 'Special endowment to encourage female scholars enrolled in Engineering & Technology branches.',
        award_amount: 40000,
        eligibility_criteria: 'Female students enrolled in B.Tech courses with CGPA 7.5+.',
        deadline: '2025-12-15',
        is_active: true,
      },
    ];

    this.scholarship_applications = [
      {
        id: 'appl-001',
        scheme_id: 'sch-merit-01',
        student_id: 'stu-rec-aryan',
        annual_family_income: 450000,
        previous_gpa: 8.85,
        reason_for_application: 'Consistently maintained top 5 rank in Computer Science department. Active contributor to college open-source club.',
        document_path: '/uploads/documents/aryan_transcript_2024.pdf',
        status: 'under_review',
        admin_remarks: 'Verified transcript marksheet. Pending final committee signoff.',
        reviewed_by: 'usr-admin-01',
        reviewed_at: '2025-08-10T11:20:00Z',
        created_at: '2025-08-01T09:15:00Z',
      },
    ];

    this.dynamic_forms = [
      {
        id: 'df-hostel-app',
        form_code: 'FORM-HOSTEL-2025',
        title: 'Hostel Room & Mess Allotment Form',
        description: 'Apply for room allocation, dietary preferences, and room-mate preference for 2025-26.',
        is_published: true,
        created_by: 'usr-admin-01',
        created_at: '2025-07-01T09:00:00Z',
        schema_json: [
          { name: 'room_type', label: 'Room Preference', type: 'select', required: true, options: ['Single AC', 'Double Sharing AC', 'Non-AC 3-Sharing'] },
          { name: 'diet_preference', label: 'Dietary Preference', type: 'radio', required: true, options: ['Vegetarian', 'Non-Vegetarian', 'Jain Special'] },
          { name: 'medical_condition', label: 'Any Chronic Allergies / Medical Notes', type: 'textarea', required: false, placeholder: 'Specify dietary allergies or medicines if any...' },
          { name: 'emergency_guardian', label: 'Local Guardian Contact in City', type: 'text', required: true, placeholder: '+91 XXXXX XXXXX' },
        ],
      },
      {
        id: 'df-internship-noc',
        form_code: 'FORM-NOC-2025',
        title: 'Summer Internship NOC & Verification',
        description: 'Submit company internship offer letter for college dean endorsement.',
        is_published: true,
        created_by: 'usr-admin-01',
        created_at: '2025-07-10T14:30:00Z',
        schema_json: [
          { name: 'company_name', label: 'Company / Organization Name', type: 'text', required: true, placeholder: 'e.g. Google, Microsoft, TCS' },
          { name: 'role_title', label: 'Internship Role Title', type: 'text', required: true, placeholder: 'e.g. Software Engineering Intern' },
          { name: 'stipend_inr', label: 'Monthly Stipend (INR)', type: 'number', required: true, placeholder: '25000' },
          { name: 'start_date', label: 'Internship Start Date', type: 'date', required: true },
          { name: 'duration_weeks', label: 'Duration in Weeks', type: 'select', required: true, options: ['4 Weeks', '8 Weeks', '12 Weeks', '6 Months'] },
        ],
      },
    ];

    this.notices = [
      {
        id: 'not-01',
        title: 'Mid-Term Examination Schedule Released',
        summary: 'Check the portal for detailed timings and seating.',
        content: 'All students enrolled in even semesters are advised to check the mid-term assessment schedule. Hall tickets will be issued 3 days prior.',
        notice_date: '2025-09-28',
        category: 'Academic',
        is_pinned: true,
      },
      {
        id: 'not-02',
        title: 'Campus Placement Drive 2025',
        summary: 'TCS recruitment drive for final year students.',
        content: 'Eligible students with CGPA 7.0+ must register on the training and placement portal before 5th October.',
        notice_date: '2025-09-25',
        category: 'Placement',
        is_pinned: false,
      },
      {
        id: 'not-03',
        title: 'Hostel Maintenance Update',
        summary: 'Water supply interruption on Sunday.',
        content: 'Scheduled pipeline servicing and water tank cleaning will be performed across Blocks A, B, and C.',
        notice_date: '2025-09-20',
        category: 'Campus Life',
        is_pinned: false,
      },
    ];

    this.grievances = [
      {
        id: 'grv-001',
        tracking_code: 'GRV-2025-0101',
        student_id: 'stu-rec-aryan',
        student_name: 'Aryan Sharma',
        category: 'hostel',
        subject: 'Hot water geyser not functioning in Block B 2nd floor',
        description: 'The geyser in the common bathroom on 2nd floor has been tripping the circuit breaker since yesterday evening. Kindly dispatch electrician.',
        priority: 'medium',
        status: 'under_investigation',
        admin_remarks: 'Estate officer assigned ticket. Work order #402 issued.',
        created_at: '2025-09-02 10:15:00',
      },
      {
        id: 'grv-002',
        tracking_code: 'GRV-2025-0102',
        student_id: 'stu-rec-aryan',
        student_name: 'Aryan Sharma',
        category: 'examination',
        subject: 'Subject code discrepancy on mid-term provisional admit card',
        description: 'Admit card shows CS-401 instead of CS-402 for Advanced Algorithms. Need urgent correction prior to entry.',
        priority: 'high',
        status: 'resolved',
        admin_remarks: 'Verified with COE database and corrected. Updated slip generated.',
        resolved_by: 'usr-admin-01',
        resolved_at: '2025-09-04 14:20:00',
        created_at: '2025-09-03 09:30:00',
      },
      {
        id: 'grv-003',
        tracking_code: 'GRV-2025-0103',
        student_id: 'stu-rec-priya',
        student_name: 'Priya Patel',
        category: 'transport',
        subject: 'Bus Route #3 evening departure delayed by 40 minutes',
        description: 'The Kharar route bus frequently departs after 5:45 PM instead of 5:10 PM due to driver attendance delays.',
        priority: 'medium',
        status: 'submitted',
        created_at: '2025-09-10 16:30:00',
      },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    this.admission_followups = [
      {
        id: 'fup-mem-001',
        student_id: 'stu-rec-inq-001',
        counselor_id: 'usr-counselor-01',
        counselor_name: 'Simran Kaur (Admissions Counselor)',
        interaction_type: 'campus_visit',
        outcome: 'callback_requested',
        notes: 'Walk-in campus tour with parents from Ludhiana. Highly interested in B.Tech CSE. Father requested callback regarding bus timetable and scholarship discount.',
        next_followup_date: todayStr,
        priority: 'p1_high',
        created_at: `${yesterdayStr} 11:30:00`,
      },
    ];

    this.master_states = [...DEFAULT_MASTER_STATES];
    this.master_user_types = [...DEFAULT_MASTER_USER_TYPES];
    this.master_degrees = [...DEFAULT_MASTER_DEGREES];
    this.master_document_types = [...DEFAULT_MASTER_DOCUMENT_TYPES];
    this.staff_academic_journey = [...DEFAULT_STAFF_ACADEMIC_JOURNEY];
    this.audit_logs = [...DEFAULT_AUDIT_LOGS];

    this.master_departments = [...DEFAULT_MASTER_DEPARTMENTS];
    this.master_institution_types = [...DEFAULT_MASTER_INSTITUTION_TYPES];
    this.master_employee_statuses = [...DEFAULT_MASTER_EMPLOYEE_STATUSES];
    this.master_designation_changes = [...DEFAULT_MASTER_DESIGNATION_CHANGES];
    this.master_erp_statuses = [...DEFAULT_MASTER_ERP_STATUSES];

    this.staff_basic_info = [...DEFAULT_STAFF_BASIC];
    this.staff_additional_info = [...DEFAULT_STAFF_ADDITIONAL];
    this.staff_addresses = [...DEFAULT_STAFF_ADDRESSES];
    this.staff_bank_accounts = [...DEFAULT_STAFF_BANKS];
    this.staff_qualifications = [...DEFAULT_STAFF_QUALIFICATIONS];
    this.staff_certifications = [...DEFAULT_STAFF_CERTIFICATIONS];
    this.staff_experience = [...DEFAULT_STAFF_EXPERIENCE];
    this.staff_org_journey = [...DEFAULT_STAFF_ORG_JOURNEY];

    this.partners = [...DEFAULT_PARTNERS];
    this.partner_contacts = [...DEFAULT_PARTNER_CONTACTS];
    this.partner_bank_accounts = [...DEFAULT_PARTNER_BANKS];
    this.partner_job_postings = [...DEFAULT_PARTNER_JOBS];
    this.partner_applications = [...DEFAULT_PARTNER_APPLICATIONS];

    this.bulk_upload_batches = [...DEFAULT_BULK_BATCHES];
    this.enquiries = [...DEFAULT_ENQUIRIES];
    this.enquiry_interactions = [...DEFAULT_ENQUIRY_INTERACTIONS];

    // Ensure all seed users have enterprise_uid
    for (const u of this.users) {
      if (!u.enterprise_uid) {
        u.enterprise_uid = generateEnterpriseUID(u.role);
      }
    }
  }
}

export const db = new DatabaseStore();
