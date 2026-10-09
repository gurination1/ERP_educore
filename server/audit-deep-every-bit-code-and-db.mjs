// Exhaustive Deep Code & Database Audit Suite for EduCore ERP
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

const PORT = process.env.TEST_PORT || 3334;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

console.log('='.repeat(78));
console.log('  EDUCORE ERP DEEP CRITIC & FULL CODE + DB STRESS AUDIT SUITE');
console.log(`  Target URL: ${BASE_URL}`);
console.log(`  Local DB: database/educore.sqlite`);
console.log('='.repeat(78) + '\n');

let serverProcess = null;
let totalPassed = 0;
let totalFailed = 0;
const findings = [];

function recordTest(category, name, passed, details = '') {
  if (passed) {
    totalPassed++;
    console.log(`  ✅ [${category}] ${name}`);
  } else {
    totalFailed++;
    console.error(`  ❌ [${category}] ${name} -> ${details}`);
    findings.push({ category, name, details });
  }
}

// -------------------------------------------------------------
// PART 1: DIRECT SQLITE DATABASE STRUCTURAL & DATA INTEGRITY
// -------------------------------------------------------------
async function auditDatabaseDirectly() {
  console.log('--- [STAGE 1]: 42 DATABASE TABLES & REFERENTIAL INTEGRITY AUDIT ---');
  const SQL = await initSqlJs();
  const dbBuffer = fs.readFileSync('database/educore.sqlite');
  const db = new SQL.Database(dbBuffer);

  // 1.1 List all tables
  const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  const tableNames = tablesRes[0]?.values?.map(r => r[0]) || [];
  recordTest('DB_SCHEMA', 'Database contains at least 35 core tables', tableNames.length >= 35, `Found ${tableNames.length} tables`);

  // Verify critical tables exist
  const expectedTables = [
    'users', 'students', 'courses', 'sessions', 'fee_heads', 'student_fees',
    'payments', 'schemes', 'scholarship_applications', 'dynamic_forms',
    'form_submissions', 'grievances', 'notices', 'partners',
    'staff_basic_info', 'staff_addresses', 'staff_bank_accounts',
    'staff_qualifications', 'staff_experience', 'staff_org_journey',
    'audit_logs', 'enquiries', 'admission_followups'
  ];

  for (const t of expectedTables) {
    const exists = tableNames.includes(t);
    recordTest('DB_TABLE_EXISTS', `Table "${t}" exists and accessible`, exists, `Missing table: ${t}`);
  }

  // 1.2 Table Row Counts & Non-Empty Check
  const keyTablesToCheck = ['users', 'students', 'courses', 'fee_heads', 'student_fees', 'payments', 'staff_basic_info'];
  for (const t of keyTablesToCheck) {
    const countRes = db.exec(`SELECT COUNT(*) FROM \`${t}\`;`);
    const count = countRes[0]?.values[0][0] || 0;
    recordTest('DB_DATA_PRESENCE', `Table "${t}" populated with data (count > 0)`, count > 0, `Count was ${count}`);
  }

  // 1.3 Referential Integrity: Student Fees -> Students
  const orphanedFeesRes = db.exec(`
    SELECT COUNT(*) FROM student_fees sf 
    LEFT JOIN students s ON sf.student_id = s.id OR sf.student_id = s.student_id
    WHERE s.id IS NULL;
  `);
  const orphanedFeesCount = orphanedFeesRes[0]?.values[0][0] || 0;
  recordTest('DB_INTEGRITY', 'No orphaned student fees (student_id links valid student)', orphanedFeesCount === 0, `Found ${orphanedFeesCount} orphaned fee records`);

  // 1.4 Referential Integrity: Payments -> Students
  const orphanedPaymentsRes = db.exec(`
    SELECT COUNT(*) FROM payments p 
    LEFT JOIN students s ON p.student_id = s.id OR p.student_id = s.student_id
    WHERE s.id IS NULL;
  `);
  const orphanedPaymentsCount = orphanedPaymentsRes[0]?.values[0][0] || 0;
  recordTest('DB_INTEGRITY', 'No orphaned payments (student_id links valid student)', orphanedPaymentsCount === 0, `Found ${orphanedPaymentsCount} orphaned payment records`);

  // 1.5 Referential Integrity: Staff Sub-tables -> staff_basic_info
  const orphanedStaffAddrRes = db.exec(`
    SELECT COUNT(*) FROM staff_addresses sa
    LEFT JOIN staff_basic_info sb ON sa.staff_id = sb.staff_id OR sa.staff_id = sb.id
    WHERE sb.id IS NULL;
  `);
  const orphanedStaffAddr = orphanedStaffAddrRes[0]?.values[0][0] || 0;
  recordTest('DB_INTEGRITY', 'No orphaned staff addresses (staff_id links valid staff)', orphanedStaffAddr === 0, `Found ${orphanedStaffAddr} orphaned staff addresses`);

  // 1.6 Business Math: Fee Ledger Equation (amount = paid_amount + due_amount + discount_amount)
  const mathAnomalyRes = db.exec(`
    SELECT id, amount, paid_amount, due_amount, discount_amount FROM student_fees 
    WHERE ABS(amount - (paid_amount + due_amount + COALESCE(discount_amount, 0))) > 0.01;
  `);
  const mathAnomalies = mathAnomalyRes[0]?.values || [];
  recordTest('DB_FINANCIAL_MATH', 'Zero mathematical discrepancies in fee ledger equations', mathAnomalies.length === 0, `Found ${mathAnomalies.length} fee calculation anomalies`);

  // 1.7 Negative Balance Check
  const negativeFeesRes = db.exec(`
    SELECT COUNT(*) FROM student_fees WHERE amount < 0 OR paid_amount < 0 OR due_amount < 0;
  `);
  const negativeFeesCount = negativeFeesRes[0]?.values[0][0] || 0;
  recordTest('DB_FINANCIAL_SANITY', 'Zero negative fee amounts or negative dues', negativeFeesCount === 0, `Found ${negativeFeesCount} negative fees`);

  // 1.8 Attendance Range Invariant [0, 100]
  const invalidAttRes = db.exec(`
    SELECT COUNT(*) FROM students WHERE attendance_percentage < 0 OR attendance_percentage > 100;
  `);
  const invalidAttCount = invalidAttRes[0]?.values[0][0] || 0;
  recordTest('DB_ACADEMIC_SANITY', 'All student attendance percentages within [0, 100]', invalidAttCount === 0, `Found ${invalidAttCount} invalid attendance percentages`);

  // 1.9 Enterprise UID Format Validation
  const usersRes = db.exec("SELECT id, username, role, enterprise_uid FROM users;");
  const users = usersRes[0]?.values || [];
  const uidRegex = /^[1-9]001-[0-9]{2}-[0-9]{2}-[0-9]{2}$/;
  let invalidUids = 0;
  for (const u of users) {
    const uid = u[3];
    if (uid && !uidRegex.test(uid)) {
      invalidUids++;
    }
  }
  recordTest('DB_IDENTITY', 'All enterprise user UIDs adhere to canonical pure-digit format', invalidUids === 0, `Found ${invalidUids} non-standard UIDs`);

  // 1.10 Audit Log Completeness
  const auditLogsRes = db.exec("SELECT COUNT(*) FROM audit_logs;");
  const auditLogsCount = auditLogsRes[0]?.values[0][0] || 0;
  recordTest('DB_AUDIT', 'Audit trail has active historical records (> 0)', auditLogsCount > 0, `Audit log count is ${auditLogsCount}`);

  db.close();
  console.log('\n');
}

// -------------------------------------------------------------
// PART 2: SERVER STARTUP & API LIFE-CYCLE STRESS TESTS
// -------------------------------------------------------------
async function startServerIfNeeded() {
  if (process.env.BASE_URL) return;
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) return;
  } catch (e) {
    // Need to start
  }

  console.log(`Starting background server process on port ${PORT}...`);
  serverProcess = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'ignore',
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to spawn server process:', err);
  });

  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        console.log(`Server ready on port ${PORT}!\n`);
        return;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server failed to start on port ${PORT}`);
}

async function auditApiAndWorkflows() {
  console.log('--- [STAGE 2]: FULL HTTP API, RBAC, WORKFLOWS & ATTACK SIMULATION ---');

  // Helper fetcher
  async function call(url, options = {}, token = null) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = { rawText: await res.text().catch(() => '') };
    }
    return { status: res.status, ok: res.ok, data };
  }

  // 2.1 Health Check
  const health = await call('/api/health');
  recordTest('API_INFRA', 'Health check returns 200 OK with operational DB mode', health.ok && (health.data.status === 'ok' || health.data.status === 'healthy'), JSON.stringify(health.data));

  // 2.2 Canonical Master Data
  const master = await call('/api/master-data');
  recordTest('API_MASTER', 'Canonical Master Data endpoint returns states, userTypes, degrees', master.ok && Array.isArray(master.data.states) && master.data.states.length > 0, JSON.stringify(master.data));

  // 2.3 Authentication for all 8 roles
  const roles = [
    { role: 'super_admin', id: '9001-01-03-01', pass: 'super123' },
    { role: 'admin', id: '4001-01-03-01', pass: 'admin123' },
    { role: 'staff', id: '2001-14-03-01', pass: 'staff123' },
    { role: 'hod', id: '3001-01-03-01', pass: 'hod123' },
    { role: 'counselor', id: '6001-02-03-01', pass: 'counselor123' },
    { role: 'accounts', id: '5001-05-03-01', pass: 'accounts123' },
    { role: 'student', id: '1001-88-03-01', pass: 'student123' },
    { role: 'partner', id: '7001-01-03-01', pass: 'partner123' },
  ];

  const tokens = {};

  for (const r of roles) {
    const login = await call('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: r.id, password: r.pass }),
    });
    const success = login.ok && login.data.success && Boolean(login.data.token);
    recordTest('AUTH_LOGIN', `Role "${r.role}" authenticates with Enterprise UID (${r.id})`, success, login.data?.error || login.status);
    if (success) {
      tokens[r.role] = login.data.token;
    }
  }

  // 2.4 Verify `/api/auth/me` token introspection
  for (const r of roles) {
    if (!tokens[r.role]) continue;
    const me = await call('/api/auth/me', {}, tokens[r.role]);
    const matches = me.ok && me.data.user?.role === r.role;
    recordTest('AUTH_ME', `Token introspection for "${r.role}" returns authentic profile`, matches, JSON.stringify(me.data));
  }

  // 2.5 Security Fencing & RBAC Boundary Protection
  console.log('\n--- [STAGE 3]: RBAC SECURITY BOUNDARY & PRIVILEGE ESCALATION ATTACKS ---');

  // Attack 1: Student attempting to access User Management
  const studentVsUsers = await call('/api/users', {}, tokens['student']);
  recordTest('RBAC_FENCE', 'Student blocked from /api/users (HTTP 403 Forbidden)', studentVsUsers.status === 403, `Got ${studentVsUsers.status}`);

  // Attack 2: Student attempting to collect fees for someone else
  const studentVsCollectFee = await call('/api/fees/collect', {
    method: 'POST',
    body: JSON.stringify({ studentId: 'stu-rec-aarav', amount: 5000 }),
  }, tokens['student']);
  recordTest('RBAC_FENCE', 'Student blocked from /api/fees/collect for other accounts (HTTP 403 Forbidden)', studentVsCollectFee.status === 403, `Got ${studentVsCollectFee.status}`);

  // Attack 3: Placement Partner attempting to view student records
  const partnerVsStudents = await call('/api/students', {}, tokens['partner']);
  recordTest('RBAC_FENCE', 'Placement partner blocked from /api/students (HTTP 403 Forbidden)', partnerVsStudents.status === 403, `Got ${partnerVsStudents.status}`);

  // Retrieve user directory for accurate target IDs
  const allUsersRes = await call('/api/users', {}, tokens['super_admin']);
  const allUsersList = allUsersRes.data.users || [];
  const targetAdminUser = allUsersList.find(u => u.role === 'admin') || { id: 'usr-admin-01' };
  const targetSuperUser = allUsersList.find(u => u.role === 'super_admin') || { id: 'usr-super-01' };

  // Attack 4: Counselor attempting to deactivate users
  const counselorVsDeactivate = await call(`/api/users/${targetAdminUser.id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: false }),
  }, tokens['counselor']);
  recordTest('RBAC_FENCE', 'Counselor blocked from /api/users/:id/status (HTTP 403 Forbidden)', counselorVsDeactivate.status === 403, `Got ${counselorVsDeactivate.status}`);

  // Attack 5: Subordinate Admin attempting to deactivate Super Admin
  const adminVsSuperAdmin = await call(`/api/users/${targetSuperUser.id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: false }),
  }, tokens['admin']);
  recordTest('RBAC_FENCE', 'Admin blocked from deactivating Super Admin (HTTP 403 Apex Protection)', adminVsSuperAdmin.status === 403, `Got ${adminVsSuperAdmin.status}`);

  // Attack 6: Unauthenticated request to protected route
  const unauthRequest = await call('/api/students');
  recordTest('RBAC_FENCE', 'Unauthenticated request rejected with HTTP 401', unauthRequest.status === 401, `Got ${unauthRequest.status}`);

  // Attack 7: Fake / Tampered JWT Token
  const tamperedRequest = await call('/api/students', {}, 'fake.jwt.token.here');
  recordTest('RBAC_FENCE', 'Tampered token rejected with HTTP 403', tamperedRequest.status === 403, `Got ${tamperedRequest.status}`);

  // 2.6 Full Functional Modules Lifecycle
  console.log('\n--- [STAGE 4]: FUNCTIONAL WORKFLOWS & EXAMINATION GATE CLEARANCE ---');

  // 4.1 Student Directory (Admin & Staff)
  const studentsList = await call('/api/students', {}, tokens['admin']);
  recordTest('WORKFLOW_STUDENT', 'Admin retrieves full student directory (> 0 records)', studentsList.ok && Array.isArray(studentsList.data.students) && studentsList.data.students.length > 0, `Length: ${studentsList.data?.students?.length}`);
  const targetStudent = studentsList.data?.students?.[0];

  if (targetStudent) {
    // 4.2 Examination Eligibility Check
    const examCheck = await call(`/api/exam/check-eligibility?studentId=${targetStudent.id}`, {}, tokens['admin']);
    recordTest('WORKFLOW_EXAM', `Examination gate eligibility computed for ${targetStudent.first_name} ${targetStudent.last_name}`, examCheck.ok && examCheck.data.success, JSON.stringify(examCheck.data));

    // 4.3 Dean Attendance Condonation Action
    const condoneRes = await call('/api/exam/condone-attendance', {
      method: 'POST',
      body: JSON.stringify({
        studentId: targetStudent.id,
        reason: 'Authorized under University Ordinance 7.4 on Inter-University Sports Representation',
      }),
    }, tokens['admin']);
    recordTest('WORKFLOW_EXAM', 'Dean Attendance Condonation lifts gate restriction', condoneRes.ok && condoneRes.data.success, JSON.stringify(condoneRes.data));

    // 4.4 Instant Fee Dues Clearance
    const clearFeeRes = await call('/api/exam/clear-fee-dues', {
      method: 'POST',
      body: JSON.stringify({ studentId: targetStudent.id }),
    }, tokens['accounts']);
    recordTest('WORKFLOW_EXAM', 'Accounts Branch No-Dues clearance records ledger reconciliation', clearFeeRes.ok && clearFeeRes.data.success, JSON.stringify(clearFeeRes.data));

    // 4.5 Regular Examination Form Registration
    const examFormRes = await call('/api/exam/regular-form', {
      method: 'POST',
      body: JSON.stringify({
        studentId: targetStudent.id,
        semester: targetStudent.current_semester || 1,
        selectedPapers: ['CS-501', 'CS-502', 'CS-503', 'CS-504'],
      }),
    }, tokens['student']);
    recordTest('WORKFLOW_EXAM', 'Regular Examination Form registered with COE Office', examFormRes.ok && examFormRes.data.success, JSON.stringify(examFormRes.data));

    // 4.6 Reappear Form Registration
    const reapFormRes = await call('/api/exam/reappear-form', {
      method: 'POST',
      body: JSON.stringify({
        studentId: targetStudent.id,
        semester: targetStudent.current_semester || 1,
        selectedPapers: ['CS-302'],
        paymentMode: 'online_upi',
      }),
    }, tokens['student']);
    recordTest('WORKFLOW_EXAM', 'Reappear Examination Form collected statutory fee of ₹700', reapFormRes.ok && reapFormRes.data.success && reapFormRes.data.record?.totalFeePaid === 700, JSON.stringify(reapFormRes.data));
  }

  // 4.7 Admissions CRM & Counselor Pipeline
  const radarStats = await call('/api/enquiries/radar-stats', {}, tokens['counselor']);
  recordTest('WORKFLOW_CRM', 'Admissions CRM Radar Stats calculated successfully', radarStats.ok && radarStats.data.success && typeof radarStats.data.stats === 'object', JSON.stringify(radarStats.data));

  // 4.8 New Enquiry Intake
  const newEnquiry = await call('/api/enquiries', {
    method: 'POST',
    body: JSON.stringify({
      student_name: 'Simranjit Kaur',
      mobile: '9876543299',
      email: 'simranjit.test@example.com',
      selected_course: 'B.Tech CSE',
      father_name: 'Harpreet Singh',
      city: 'Bathinda',
      state: 'Punjab',
      source: 'Campus Walk-in',
      admission_probability: 'high',
    }),
  }, tokens['counselor']);
  recordTest('WORKFLOW_CRM', 'Counselor records new prospect walk-in enquiry', newEnquiry.ok && newEnquiry.data.success, JSON.stringify(newEnquiry.data));

  // 4.9 Staff Dossier & Academic Journey
  const staffList = await call('/api/staff', {}, tokens['admin']);
  recordTest('WORKFLOW_HR', 'HRMS Staff list retrieved successfully', staffList.ok && Array.isArray(staffList.data.staff), `Staff count: ${staffList.data?.staff?.length}`);

  // 4.10 Grievance Redressal Portal
  const grvSubject = `Lab 4 AC Maintenance Request #${Date.now().toString().slice(-4)}`;
  const grievanceSubmit = await call('/api/grievances', {
    method: 'POST',
    body: JSON.stringify({
      subject: grvSubject,
      description: 'AC unit in Block B Computer Lab 4 requires servicing immediately.',
      category: 'infrastructure',
      priority: 'medium',
    }),
  }, tokens['student']);
  recordTest('WORKFLOW_GRIEVANCE', 'Scholar lodges infrastructure maintenance grievance', grievanceSubmit.ok && grievanceSubmit.data.success, JSON.stringify(grievanceSubmit.data));

  // 4.11 Dynamic Form Builder
  const formsList = await call('/api/forms', {}, tokens['admin']);
  recordTest('WORKFLOW_FORMS', 'Dynamic Survey & Regulatory Forms catalog loaded', formsList.ok && Array.isArray(formsList.data.forms), `Forms count: ${formsList.data?.forms?.length}`);

  // 4.12 Audit Trail Query
  const auditLogs = await call('/api/audit/logs', {}, tokens['super_admin']);
  recordTest('WORKFLOW_AUDIT', 'Super Admin accesses immutable system audit log trail', auditLogs.ok && Array.isArray(auditLogs.data.logs) && auditLogs.data.logs.length > 0, `Audit log entries: ${auditLogs.data?.logs?.length}`);

  // 4.13 SQL Injection Resilience Test
  const sqliTest = await call("/api/students?search=' OR 1=1 --", {}, tokens['admin']);
  recordTest('SECURITY_SQLI', "SQL Injection search fuzzing safely handled without 500 error", sqliTest.status !== 500, `Status: ${sqliTest.status}`);
}

async function runFullAudit() {
  try {
    await auditDatabaseDirectly();
    await startServerIfNeeded();
    await auditApiAndWorkflows();
  } catch (err) {
    console.error('Audit suite encountered critical unhandled exception:', err);
    totalFailed++;
  } finally {
    if (serverProcess) {
      console.log('\nTearing down temporary test server process...');
      serverProcess.kill('SIGTERM');
    }

    console.log('\n' + '='.repeat(78));
    console.log(`  FINAL AUDIT REPORT SUMMARY:`);
    console.log(`  TOTAL TESTS EXECUTED : ${totalPassed + totalFailed}`);
    console.log(`  PASSED               : ${totalPassed}`);
    console.log(`  FAILED               : ${totalFailed}`);
    console.log(`  PASS RATE            : ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(78));

    if (totalFailed > 0) {
      console.log('\nIdentified Issues:');
      findings.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.category}] ${f.name} - ${f.details}`);
      });
      process.exit(1);
    } else {
      console.log('\n🌟 ALL SYSTEM CHECKS PASSED WITH 100% SUCCESS RATE.');
      process.exit(0);
    }
  }
}

runFullAudit();
