import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import initSqlJs from 'sql.js';

async function seedFleet() {
  console.log('[FleetSeeder] Initializing sql.js...');
  const SQL = await initSqlJs();
  const dbPath = path.join(process.cwd(), 'database', 'educore.sqlite');
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  const adminHash = bcrypt.hashSync('admin123', 10);
  const studentHash = bcrypt.hashSync('student123', 10);
  const now = new Date().toISOString();

  // 1. Ensure 2 Admins exist
  const admins = [
    {
      id: 'usr-admin-01',
      username: 'admin',
      email: 'admin@educore.edu',
      password_hash: adminHash,
      role: 'admin',
      full_name: 'Dr. Ramesh Chandra (Registrar & Academic Provost)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      is_active: 1,
      created_at: now,
    },
    {
      id: 'usr-admin-02',
      username: 'bursar',
      email: 'bursar@educore.edu',
      password_hash: adminHash,
      role: 'admin',
      full_name: 'Dr. Priya Nair (Chief Financial Officer & Bursar)',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      is_active: 1,
      created_at: now,
    },
  ];

  for (const adm of admins) {
    db.run(
      `INSERT OR REPLACE INTO users (id, username, email, password_hash, role, full_name, avatar_url, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [adm.id, adm.username, adm.email, adm.password_hash, adm.role, adm.full_name, adm.avatar_url, adm.is_active, adm.created_at]
    );
  }

  // 2. Courses pool
  const courses = [
    { id: 'crs-btech-cs', code: 'B.Tech CS', name: 'B.Tech Computer Science & Engineering', dept: 'Computer Science', fee: 90000 },
    { id: 'crs-btech-ai', code: 'B.Tech AI', name: 'B.Tech Artificial Intelligence & Data Science', dept: 'Computer Science', fee: 95000 },
    { id: 'crs-btech-ece', code: 'B.Tech ECE', name: 'B.Tech Electronics & Communication Engineering', dept: 'Electronics', fee: 85000 },
    { id: 'crs-btech-me', code: 'B.Tech ME', name: 'B.Tech Mechanical Engineering', dept: 'Mechanical', fee: 80000 },
    { id: 'crs-btech-civil', code: 'B.Tech Civil', name: 'B.Tech Civil & Environmental Engineering', dept: 'Civil', fee: 75000 },
    { id: 'crs-mba-fin', code: 'MBA Finance', name: 'MBA Financial Technology & Management', dept: 'Business', fee: 110000 },
    { id: 'crs-mca', code: 'MCA Cloud', name: 'Master of Computer Applications (Cloud Architecture)', dept: 'Computer Science', fee: 80000 },
    { id: 'crs-btech-biotech', code: 'B.Tech Biotech', name: 'B.Tech Biotechnology & Genetic Engineering', dept: 'BioSciences', fee: 85000 },
    { id: 'crs-barch', code: 'B.Arch', name: 'Bachelor of Architecture & Sustainable Urban Planning', dept: 'Architecture', fee: 95000 },
  ];

  for (const c of courses) {
    db.run(
      `INSERT OR REPLACE INTO courses (id, code, name, department, duration_years, total_semesters, base_tuition_fee)
       VALUES (?, ?, ?, ?, 4, 8, ?)`,
      [c.id, c.code, c.name, c.dept, c.fee]
    );
  }

  // 3. 30 Students Data Definition
  const studentProfiles = [
    { num: '001', first: 'Aaditya', last: 'Verma', gender: 'male', courseId: 'crs-btech-cs', sem: 4, att: 92, feeStat: 'paid' },
    { num: '002', first: 'Bhavna', last: 'Sen', gender: 'female', courseId: 'crs-btech-cs', sem: 4, att: 88, feeStat: 'due' },
    { num: '003', first: 'Chirag', last: 'Joshi', gender: 'male', courseId: 'crs-btech-ai', sem: 2, att: 94, feeStat: 'overdue' },
    { num: '004', first: 'Divya', last: 'Patel', gender: 'female', courseId: 'crs-btech-ai', sem: 2, att: 96, feeStat: 'paid' },
    { num: '005', first: 'Eshan', last: 'Nair', gender: 'male', courseId: 'crs-btech-ece', sem: 6, att: 81, feeStat: 'due' },
    { num: '006', first: 'Fatima', last: 'Sheikh', gender: 'female', courseId: 'crs-btech-ece', sem: 6, att: 90, feeStat: 'paid' },
    { num: '007', first: 'Gautam', last: 'Reddy', gender: 'male', courseId: 'crs-btech-me', sem: 4, att: 76, feeStat: 'overdue' },
    { num: '008', first: 'Hina', last: 'Das', gender: 'female', courseId: 'crs-btech-me', sem: 4, att: 89, feeStat: 'paid' },
    { num: '009', first: 'Ishaan', last: 'Roy', gender: 'male', courseId: 'crs-btech-civil', sem: 2, att: 84, feeStat: 'due' },
    { num: '010', first: 'Janvi', last: 'Mishra', gender: 'female', courseId: 'crs-btech-civil', sem: 2, att: 93, feeStat: 'paid' },
    { num: '011', first: 'Karan', last: 'Kapoor', gender: 'male', courseId: 'crs-mba-fin', sem: 2, att: 85, feeStat: 'overdue' },
    { num: '012', first: 'Lavanya', last: 'Iyer', gender: 'female', courseId: 'crs-mba-fin', sem: 2, att: 95, feeStat: 'paid' },
    { num: '013', first: 'Manish', last: 'Gupta', gender: 'male', courseId: 'crs-mca', sem: 4, att: 82, feeStat: 'due' },
    { num: '014', first: 'Neha', last: 'Mehra', gender: 'female', courseId: 'crs-mca', sem: 4, att: 91, feeStat: 'paid' },
    { num: '015', first: 'Omkar', last: 'Kulkarni', gender: 'male', courseId: 'crs-btech-biotech', sem: 6, att: 79, feeStat: 'overdue' },
    { num: '016', first: 'Pooja', last: 'Bhat', gender: 'female', courseId: 'crs-btech-biotech', sem: 6, att: 97, feeStat: 'paid' },
    { num: '017', first: 'Qadir', last: 'Ali', gender: 'male', courseId: 'crs-btech-ece', sem: 4, att: 83, feeStat: 'due' },
    { num: '018', first: 'Riya', last: 'Saxena', gender: 'female', courseId: 'crs-btech-ece', sem: 4, att: 92, feeStat: 'paid' },
    { num: '019', first: 'Sahil', last: 'Chawla', gender: 'male', courseId: 'crs-btech-cs', sem: 2, att: 87, feeStat: 'overdue' },
    { num: '020', first: 'Tanvi', last: 'Bansal', gender: 'female', courseId: 'crs-btech-cs', sem: 2, att: 95, feeStat: 'paid' },
    { num: '021', first: 'Utkarsh', last: 'Dubey', gender: 'male', courseId: 'crs-btech-me', sem: 6, att: 74, feeStat: 'due' },
    { num: '022', first: 'Varsha', last: 'Pillai', gender: 'female', courseId: 'crs-btech-me', sem: 6, att: 89, feeStat: 'paid' },
    { num: '023', first: 'Wasim', last: 'Akram', gender: 'male', courseId: 'crs-btech-ai', sem: 4, att: 86, feeStat: 'overdue' },
    { num: '024', first: 'Xena', last: "D'Souza", gender: 'female', courseId: 'crs-btech-ai', sem: 4, att: 94, feeStat: 'paid' },
    { num: '025', first: 'Yash', last: 'Singhal', gender: 'male', courseId: 'crs-barch', sem: 6, att: 78, feeStat: 'due' },
    { num: '026', first: 'Zara', last: 'Khan', gender: 'female', courseId: 'crs-barch', sem: 6, att: 93, feeStat: 'paid' },
    { num: '027', first: 'Aman', last: 'Sethi', gender: 'male', courseId: 'crs-btech-civil', sem: 4, att: 80, feeStat: 'overdue' },
    { num: '028', first: 'Barkha', last: 'Roy', gender: 'female', courseId: 'crs-btech-civil', sem: 4, att: 91, feeStat: 'paid' },
    { num: '029', first: 'Chetan', last: 'Joshi', gender: 'male', courseId: 'crs-mca', sem: 2, att: 83, feeStat: 'due' },
    { num: '030', first: 'Deepa', last: 'Nambiar', gender: 'female', courseId: 'crs-mca', sem: 2, att: 96, feeStat: 'paid' },
  ];

  for (const s of studentProfiles) {
    const userId = `usr-stu-${s.num}`;
    const studentDbId = `stu-rec-${s.num}`;
    const rollNo = `STU-2025-${s.num}`;
    const username = `stu${s.num}`;
    const email = `stu${s.num}@educore.edu`;
    const fullName = `${s.first} ${s.last}`;
    const course = courses.find(c => c.id === s.courseId);
    const tuitionAmount = course?.fee || 90000;

    // 3a. Insert User
    db.run(
      `INSERT OR REPLACE INTO users (id, username, email, password_hash, role, full_name, avatar_url, is_active, created_at)
       VALUES (?, ?, ?, ?, 'student', ?, ?, 1, ?)`,
      [
        userId,
        username,
        email,
        studentHash,
        fullName,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        now,
      ]
    );

    // 3b. Insert Student
    db.run(
      `INSERT OR REPLACE INTO students (
        id, user_id, student_id, first_name, last_name, gender, dob, email, phone,
        guardian_name, guardian_relation, guardian_phone, course_id, session_id,
        current_semester, admission_year, admission_status, fees_status,
        attendance_percentage, total_classes, attended_classes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentDbId,
        userId,
        rollNo,
        s.first,
        s.last,
        s.gender,
        '2004-05-15',
        email,
        `+91 98000 00${s.num}`,
        `Guardian ${s.last.replace(/'/g, '')}`,
        'parent',
        `+91 98000 99${s.num}`,
        s.courseId,
        'sess-2025-26',
        s.sem,
        2024,
        'approved',
        s.feeStat,
        s.att,
        100,
        s.att,
        now,
      ]
    );

    // 3c. Insert Student Fee
    const feeId = `sf-fee-${s.num}`;
    const isPaid = s.feeStat === 'paid';
    const isOverdue = s.feeStat === 'overdue';
    const paidAmount = isPaid ? tuitionAmount : 0;
    const dueAmount = isPaid ? 0 : tuitionAmount;
    const dueDate = isOverdue ? '2025-08-31' : '2025-11-30';

    db.run(
      `INSERT OR REPLACE INTO student_fees (
        id, student_id, fee_head_id, session_id, semester, amount, discount_amount, paid_amount, due_amount, due_date, status
      ) VALUES (?, ?, 'fh-tuition', 'sess-2025-26', ?, ?, 0, ?, ?, ?, ?)`,
      [
        feeId,
        studentDbId,
        s.sem,
        tuitionAmount,
        paidAmount,
        dueAmount,
        dueDate,
        s.feeStat,
      ]
    );

    // 3d. If paid, create payment record and receipt
    if (isPaid) {
      const receiptNo = `REC-2025-0${s.num}`;
      db.run(
        `INSERT OR REPLACE INTO payments (
          id, receipt_no, student_id, student_fee_id, amount_paid, payment_mode,
          transaction_reference, payment_date, status, notes, collected_by
        ) VALUES (?, ?, ?, ?, ?, 'online_upi', ?, ?, 'success', 'Semester Tuition Payment', 'usr-admin-01')`,
        [
          `pay-${s.num}`,
          receiptNo,
          studentDbId,
          feeId,
          tuitionAmount,
          `TXN-UPI-${Date.now()}-${s.num}`,
          now,
        ]
      );
    }
  }

  // 4. Save back to SQLite file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log(`[FleetSeeder] Successfully seeded 2 Admins, 30 Students, Fees, and Payments into ${dbPath}!`);
}

seedFleet().catch(err => {
  console.error('[FleetSeeder] Error:', err);
  process.exit(1);
});
