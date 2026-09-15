import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import mysql from 'mysql2/promise';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'student' | 'admin' | 'staff';
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

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
  course_id: string;
  session_id: string;
  current_semester: number;
  admission_year: number;
  admission_status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';
  fees_status: 'paid' | 'due' | 'overdue' | 'cancelled';
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
  board_name?: string;
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

    // Ensure newly added student columns exist in live MariaDB
    const safeAddColumn = async (table: string, colDef: string) => {
      try {
        await this.mariaPool!.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colDef}`);
      } catch (e: any) {
        // Ignore duplicate column errors
      }
    };
    await safeAddColumn('students', 'is_hosteller TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'is_transport_user TINYINT(1) DEFAULT 0');
    await safeAddColumn('students', 'transport_route VARCHAR(128)');
    await safeAddColumn('students', 'hostel_room_no VARCHAR(64)');
    await safeAddColumn('students', 'category VARCHAR(32)');
    await safeAddColumn('students', 'quota VARCHAR(32)');
    await safeAddColumn('students', 'tenth_percentage DOUBLE');
    await safeAddColumn('students', 'twelfth_percentage DOUBLE');
    await safeAddColumn('students', 'board_name VARCHAR(64)');
  }

  private async seedMariaDBDefaults(): Promise<void> {
    if (!this.mariaPool) return;
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
    const canonicalFeeHeads: FeeHead[] = [
      { id: 'fh-tuition', code: 'TUITION', title: 'Academic Tuition Fee', description: 'Semester academic tuition, classroom access, and lab instructions', is_recurring: true },
      { id: 'fh-univ-reg', code: 'UNIV_REG', title: 'University Direct Charges & Exam Fee', description: 'Affiliating University (PTU/GNDU/PUP) registration, examination and sports development fee', is_recurring: true },
      { id: 'fh-hostel', code: 'HOSTEL_MESS', title: 'Hostel & Mess Boarding Fee', description: 'Campus residential accommodation, housekeeping, and 3-meal mess board (Campus residents only)', is_recurring: true },
      { id: 'fh-transport', code: 'TRANSPORT', title: 'Bus Commuter / Transport Fee', description: 'Dedicated college fleet transit service across designated city routes (Day scholars only)', is_recurring: true },
      { id: 'fh-security', code: 'INST_SECURITY', title: 'Refundable Caution Security Deposit', description: 'One-time refundable institution and library security deposit', is_recurring: false },
      { id: 'fh-exam', code: 'EXAM', title: 'Examination & Assessment Fee', description: 'Semester terminal exams, grade transcript processing', is_recurring: true },
      { id: 'fh-lib', code: 'LIBRARY', title: 'Library & Resource Access Fee', description: 'Digital library, textbook reserve access, research journal database', is_recurring: true },
      { id: 'fh-sports', code: 'DEVELOPMENT', title: 'Campus Sports & Development Fee', description: 'Gymnasium, athletic sports ground, and club activities', is_recurring: false },
    ];
    for (const fh of canonicalFeeHeads) {
      await this.mariaPool.query(
        'INSERT INTO fee_heads (id, code, title, description, is_recurring) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code), title = VALUES(title), description = VALUES(description), is_recurring = VALUES(is_recurring)',
        [fh.id, fh.code, fh.title, fh.description || null, fh.is_recurring ? 1 : 0]
      );
    }
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
    for (const g of (this.grievances.length > 0 ? this.grievances : defaultGrievances)) {
      await this.mariaPool.query(
        'INSERT IGNORE INTO grievances (id, tracking_code, student_id, student_name, category, subject, description, priority, status, admin_remarks, resolved_by, resolved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [g.id, g.tracking_code, g.student_id, g.student_name, g.category, g.subject, g.description, g.priority, g.status, g.admin_remarks || null, g.resolved_by || null, g.resolved_at || null, formatSqlDateTime(g.created_at)]
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
        role TEXT, full_name TEXT, avatar_url TEXT, is_active INTEGER, created_at TEXT
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
        guardian_phone TEXT, course_id TEXT, session_id TEXT, current_semester INTEGER, admission_year INTEGER,
        admission_status TEXT, fees_status TEXT, attendance_percentage REAL, total_classes INTEGER,
        attended_classes INTEGER, is_hosteller INTEGER, is_transport_user INTEGER, transport_route TEXT,
        hostel_room_no TEXT, category TEXT, quota TEXT, tenth_percentage REAL, twelfth_percentage REAL,
        board_name TEXT, created_at TEXT
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
    `);
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

      clearAndInsert('users', this.users, ['id', 'username', 'email', 'password_hash', 'role', 'full_name', 'avatar_url', 'is_active', 'created_at']);
      clearAndInsert('sessions', this.sessions, ['id', 'name', 'start_date', 'end_date', 'is_current']);
      clearAndInsert('courses', this.courses, ['id', 'code', 'name', 'department', 'duration_years', 'total_semesters', 'base_tuition_fee']);
      clearAndInsert('students', this.students, [
        'id', 'user_id', 'student_id', 'first_name', 'last_name', 'gender', 'dob', 'email', 'phone',
        'guardian_name', 'guardian_relation', 'guardian_phone', 'course_id', 'session_id', 'current_semester',
        'admission_year', 'admission_status', 'fees_status', 'attendance_percentage', 'total_classes', 'attended_classes',
        'is_hosteller', 'is_transport_user', 'transport_route', 'hostel_room_no', 'category', 'quota', 'tenth_percentage', 'twelfth_percentage', 'board_name', 'created_at',
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

      this.sqlDb.run('COMMIT;');

      const binaryArray = this.sqlDb.export();
      const buffer = Buffer.from(binaryArray);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err: any) {
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
    if (this.mode === 'mariadb' && this.mariaPool) {
      const [rows]: any = await this.mariaPool.query(
        'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
        [val, val]
      );
      if (rows && rows.length > 0) {
        const u = rows[0];
        return { ...u, is_active: Boolean(u.is_active) };
      }
      return null;
    }
    const user = this.users.find(u => u.username.toLowerCase() === val || u.email.toLowerCase() === val);
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

  public async updateUserPasswordHash(email: string, passwordHash: string): Promise<boolean> {
    const val = email.trim().toLowerCase();
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?', [passwordHash, val]);
      return true;
    }
    const user = this.users.find(u => u.email.toLowerCase() === val);
    if (user) {
      user.password_hash = passwordHash;
      this.save();
      return true;
    }
    return false;
  }

  public async createUser(user: User): Promise<User> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      await this.mariaPool.query(
        'INSERT INTO users (id, username, email, password_hash, role, full_name, avatar_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.username, user.email, user.password_hash, user.role, user.full_name, user.avatar_url || null, user.is_active ? 1 : 0, formatSqlDateTime(user.created_at)]
      );
      return user;
    }
    this.users.push(user);
    this.save();
    return user;
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
        `INSERT INTO students (id, user_id, student_id, first_name, last_name, gender, dob, email, phone, guardian_name, guardian_relation, guardian_phone, course_id, session_id, current_semester, admission_year, admission_status, fees_status, attendance_percentage, total_classes, attended_classes, is_hosteller, is_transport_user, transport_route, hostel_room_no, category, quota, tenth_percentage, twelfth_percentage, board_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          student.board_name || null,
          formatSqlDateTime(student.created_at),
        ]
      );
      return student;
    }
    this.students.push(student);
    this.save();
    return student;
  }

  public async updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
    if (this.mode === 'mariadb' && this.mariaPool) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getStudentById(id);

      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => (updates as any)[k]);
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
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getStudentFeeById(id);

      const setClause = keys.map(k => `${k} = ?`).join(', ');
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
      const keys = Object.keys(updates);
      if (keys.length === 0) return (await this.getScholarshipApplications()).find(a => a.id === id) || null;

      const setClause = keys.map(k => `${k} = ?`).join(', ');
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
      const keys = Object.keys(updates);
      if (keys.length === 0) return this.getGrievanceById(id);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
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

  // --- IN-MEMORY DEFAULT SEEDING ---
  private seedDefaultsInMemory(): void {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const studentHash = bcrypt.hashSync('student123', 10);

    this.users = [
      {
        id: 'usr-admin-01',
        username: 'admin',
        email: 'admin@educore.edu',
        password_hash: adminHash,
        role: 'admin',
        full_name: 'Dr. Ramesh Chandra (Registrar)',
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
        id: 'usr-staff-01',
        username: 'staff01',
        email: 'staff@educore.edu',
        password_hash: bcrypt.hashSync('staff123', 10),
        role: 'staff',
        full_name: 'Prof. Sunita Rao (Staff / Faculty)',
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
    ];

    this.fee_heads = [
      { id: 'fh-tuition', code: 'TUITION', title: 'Academic Tuition Fee', description: 'Semester academic tuition, classroom access, and lab instructions', is_recurring: true },
      { id: 'fh-univ-reg', code: 'UNIV_REG', title: 'University Direct Charges & Exam Fee', description: 'Affiliating University (PTU/GNDU/PUP) registration, examination and sports development fee', is_recurring: true },
      { id: 'fh-hostel', code: 'HOSTEL_MESS', title: 'Hostel & Mess Boarding Fee', description: 'Campus residential accommodation, housekeeping, and 3-meal mess board (Campus residents only)', is_recurring: true },
      { id: 'fh-transport', code: 'TRANSPORT', title: 'Bus Commuter / Transport Fee', description: 'Dedicated college fleet transit service across designated city routes (Day scholars only)', is_recurring: true },
      { id: 'fh-security', code: 'INST_SECURITY', title: 'Refundable Caution Security Deposit', description: 'One-time refundable institution and library security deposit', is_recurring: false },
      { id: 'fh-exam', code: 'EXAM', title: 'Examination & Assessment Fee', description: 'Semester terminal exams, grade transcript processing', is_recurring: true },
      { id: 'fh-lib', code: 'LIBRARY', title: 'Library & Resource Access Fee', description: 'Digital library, textbook reserve access, research journal database', is_recurring: true },
      { id: 'fh-sports', code: 'DEVELOPMENT', title: 'Campus Sports & Development Fee', description: 'Gymnasium, athletic sports ground, and club activities', is_recurring: false },
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
  }
}

export const db = new DatabaseStore();
