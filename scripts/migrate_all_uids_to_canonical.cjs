const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function migrateDatabase(dbFilePath) {
  if (!fs.existsSync(dbFilePath)) {
    console.log(`Database file ${dbFilePath} does not exist, skipping.`);
    return;
  }
  console.log(`\n--- Migrating ${dbFilePath} ---`);
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbFilePath);
  const db = new SQL.Database(fileBuffer);

  // 1. Update master_user_types
  try {
    db.run(`
      DELETE FROM master_user_types;
      INSERT INTO master_user_types (type_code, alpha_prefix, role_key, display_title, description) VALUES
      ('01', 'STU', 'student', 'Student Scholar', 'Enrolled undergraduate or postgraduate student candidate. UID: 1-01-26-01-0001'),
      ('02', 'FAC', 'staff', 'Faculty / Academic Staff', 'Teaching faculty, assistant professor, or lab in-charge. UID: 1-01-26-02-0014'),
      ('03', 'HOD', 'hod', 'Head of Department (HOD)', 'Departmental curriculum and administrative head. UID: 1-01-26-03-0001'),
      ('04', 'ADM', 'admin', 'Institutional Administrator', 'Dean, registrar, or executive campus administrator. UID: 1-01-26-04-0001'),
      ('05', 'ACC', 'accounts', 'Accounts & Bursar Officer', 'Tuition collections, fee ledgers, and bursar desk. UID: 1-01-26-05-0001'),
      ('06', 'CNS', 'counselor', 'Admissions Counselor', 'Admissions CRM, applicant intake, and counseling cell. UID: 1-01-26-06-0001'),
      ('07', 'PRT', 'partner', 'Corporate Placement Partner', 'Corporate hiring partner, recruiter, and placement sponsor. UID: 1-01-26-07-0001'),
      ('08', 'HRM', 'hr', 'HR & Establishment Officer', 'HRMS, faculty establishment, payroll deductions, and exit NOC. UID: 1-01-26-08-0001'),
      ('09', 'SUP', 'super_admin', 'Universal Provost & Super Admin', 'Apex multi-tenant operator and platform software vendor. UID: 1-01-26-09-0001'),
      ('10', 'HST', 'hostel', 'Chief Hostel Warden & Residence Admin', 'Hostel blocks, room inventory, mess dues, and transit pass. UID: 1-01-26-10-0001');
    `);
    console.log('Updated master_user_types table.');
  } catch (e) {
    console.warn('Could not update master_user_types:', e.message);
  }

  // 2. Update users table with canonical UIDs
  const userMappings = [
    { username: 'superadmin', uid: '1-01-26-09-0001' },
    { username: 'admin', uid: '1-01-26-04-0001' },
    { username: 'gurination1', uid: '1-01-26-04-0002' },
    { username: 'staff01', uid: '1-01-26-02-0014' },
    { username: 'counselor01', uid: '1-01-26-06-0001' },
    { username: 'hod_cse', uid: '1-01-26-03-0001' },
    { username: 'accounts01', uid: '1-01-26-05-0001' },
    { username: 'bursar', uid: '1-01-26-05-0002' },
    { username: 'partner01', uid: '1-01-26-07-0001' },
    { username: 'hr01', uid: '1-01-26-08-0001' },
    { username: 'hostel01', uid: '1-01-26-10-0001' },
    { username: 'aryan', uid: '1-01-26-01-0001' },
    { username: 'guri_student', uid: '1-01-26-01-0002' },
    { username: 'rohan', uid: '1-01-26-02-0002' },
    { username: 'priya', uid: '1-01-26-05-0003' },
    { username: 'aarav', uid: '1-01-26-01-0004' },
    { username: 'neha', uid: '1-01-26-07-0005' },
    { username: 'stu001', uid: '1-01-26-01-0006' },
    { username: 'stu002', uid: '1-01-26-05-0007' },
    { username: 'stu003', uid: '1-01-26-01-0008' },
    { username: 'stu004', uid: '1-01-26-02-0009' },
    { username: 'stu005', uid: '1-01-26-07-0010' },
  ];

  for (let i = 6; i <= 30; i++) {
    const un = `stu${String(i).padStart(3, '0')}`;
    const seq = String(i + 5).padStart(4, '0');
    userMappings.push({ username: un, uid: `1-01-26-01-${seq}` });
  }

  for (const m of userMappings) {
    db.run('UPDATE users SET enterprise_uid = ? WHERE username = ?', [m.uid, m.username]);
  }
  console.log(`Updated ${userMappings.length} users with canonical UIDs.`);

  // 3. Update students table
  // Link stu-rec-aryan to 1-01-26-01-0001, stu-rec-rohan to 1-01-26-02-0002, etc.
  const studentMappings = [
    { id: 'stu-rec-aryan', sid: '1-01-26-01-0001' },
    { id: 'stu-rec-rohan', sid: '1-01-26-02-0002' },
    { id: 'stu-rec-priya', sid: '1-01-26-05-0003' },
    { id: 'stu-rec-aarav', sid: '1-01-26-01-0004' },
    { id: 'stu-rec-neha', sid: '1-01-26-07-0005' },
    { id: 'stu-rec-001', sid: '1-01-26-01-0006' },
    { id: 'stu-rec-002', sid: '1-01-26-05-0007' },
    { id: 'stu-rec-003', sid: '1-01-26-01-0008' },
    { id: 'stu-rec-004', sid: '1-01-26-02-0009' },
    { id: 'stu-rec-005', sid: '1-01-26-07-0010' },
  ];

  for (let i = 6; i <= 30; i++) {
    const recId = `stu-rec-${String(i).padStart(3, '0')}`;
    const seq = String(i + 5).padStart(4, '0');
    studentMappings.push({ id: recId, sid: `1-01-26-01-${seq}` });
  }

  for (const sm of studentMappings) {
    try {
      db.run('UPDATE students SET student_id = ? WHERE id = ?', [sm.sid, sm.id]);
    } catch (e) {
      // student might not exist
    }
  }
  console.log(`Updated ${studentMappings.length} students with canonical student_ids.`);

  // Export and write back
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFilePath, buffer);
  console.log(`Successfully saved migrated database to ${dbFilePath}!`);
}

async function run() {
  await migrateDatabase('./database/educore.sqlite');
  if (fs.existsSync('./database/educore-seed.sqlite')) {
    await migrateDatabase('./database/educore-seed.sqlite');
  }
}

run().catch(console.error);
