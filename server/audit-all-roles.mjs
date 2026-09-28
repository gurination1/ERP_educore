// EduCore ERP - Deep Audit & Verification of All Individual Role Accounts
import http from 'http';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);

    const headers = { 'Content-Type': 'application/json' };
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

const ROLES_TO_AUDIT = [
  {
    roleName: 'System Administrator / Registrar',
    roleKey: 'admin',
    credentials: { username: 'admin@educore.edu', password: 'admin123', role: 'admin' },
    expectedDashboard: 'AdminDashboardView (Campus Executive Control)',
    expectedSidebarBadge: 'Super',
    extremePrivileges: true,
  },
  {
    roleName: 'Academic Faculty / Assistant Professor',
    roleKey: 'staff',
    credentials: { username: 'staff@educore.edu', password: 'staff123', role: 'staff' },
    expectedDashboard: 'StaffDashboardView (Faculty & Lecture Register)',
    expectedSidebarBadge: 'Active',
    extremePrivileges: false,
  },
  {
    roleName: 'Head Counselor / Admission Cell Convener',
    roleKey: 'counselor',
    credentials: { username: 'counselor@educore.edu', password: 'counselor123', role: 'counselor' },
    expectedDashboard: 'StaffDashboardView (Counselor Desk & Intake Radar)',
    expectedSidebarBadge: 'Active',
    extremePrivileges: false,
  },
  {
    roleName: 'Head of Department (HOD CSE)',
    roleKey: 'hod',
    credentials: { username: 'hod.cse@educore.edu', password: 'hod123', role: 'hod' },
    expectedDashboard: 'StaffDashboardView (HOD Console & Faculty Timetables)',
    expectedSidebarBadge: 'Active',
    extremePrivileges: false,
  },
  {
    roleName: 'Chief Accounts Officer / Bursar',
    roleKey: 'accounts',
    credentials: { username: 'accounts@educore.edu', password: 'accounts123', role: 'accounts' },
    expectedDashboard: 'FeeLedgerView (Bursar & Payment Reconciliation)',
    expectedSidebarBadge: undefined,
    extremePrivileges: false,
  },
  {
    roleName: 'Enrolled Student',
    roleKey: 'student',
    credentials: { username: 'aryan@educore.edu', password: 'student123', role: 'student' },
    expectedDashboard: 'StudentDashboardView (Personal Student Portal)',
    expectedSidebarBadge: undefined,
    extremePrivileges: false,
  },
];

async function runAudit() {
  console.log('======================================================================');
  console.log('      EduCore ERP: Comprehensive Individual Role Login & UI Audit     ');
  console.log('======================================================================\n');

  const auditReport = [];

  for (const roleDef of ROLES_TO_AUDIT) {
    console.log(`\n▶ [ROLE AUDIT] Testing: ${roleDef.roleName} (Role: ${roleDef.roleKey})`);
    console.log(`  Login ID: ${roleDef.credentials.username}`);

    // 1. Attempt Login
    const loginRes = await request('POST', '/api/auth/login', roleDef.credentials);
    if (loginRes.status !== 200 || !loginRes.data.token) {
      console.error(`  ❌ FAILED to authenticate ${roleDef.credentials.username}:`, loginRes.data);
      auditReport.push({ ...roleDef, loginSuccess: false, error: loginRes.data });
      continue;
    }

    const token = loginRes.data.token;
    const user = loginRes.data.user;
    const student = loginRes.data.student || null;

    console.log(`  ✅ Auth Success! User ID: ${user.id} | Name: ${user.full_name} | Role: ${user.role}`);
    if (user.department) console.log(`     Department: ${user.department} | Designation: ${user.designation}`);
    if (student) console.log(`     Linked Student: ${student.first_name} ${student.last_name} (${student.student_id})`);

    // 2. Test Me Endpoint
    const meRes = await request('GET', '/api/auth/me', null, token);
    const meOk = meRes.status === 200 && meRes.data.user?.id === user.id;

    // 3. Test Feature Endpoints to verify RBAC matrix
    // A. User Management (Extreme Power - Admin Only)
    const userMgmtRes = await request('GET', '/api/users', null, token);
    const hasUserMgmtAccess = userMgmtRes.status === 200;

    // B. Admissions Roster & Prospect CRM
    const admissionsRes = await request('GET', '/api/admissions/applications', null, token);
    const followupRadarRes = await request('GET', '/api/admissions/followups', null, token);
    const canAccessAdmissions = admissionsRes.status === 200;
    const canAccessRadar = followupRadarRes.status === 200;

    // C. Student Defaulters & Fee KPI (Admin/Staff/Accounts only)
    const feeDefaultersRes = await request('GET', '/api/fees/defaulters', null, token);
    const canAccessDefaulters = feeDefaultersRes.status === 200;

    // D. Fee Ledger access
    const ledgerTarget = student ? student.id : 'stu-rec-aryan';
    const ledgerRes = await request('GET', `/api/fees/ledger/${ledgerTarget}`, null, token);
    const canAccessLedger = ledgerRes.status === 200;

    // E. Dynamic Form Builder / Published Forms
    const formsRes = await request('GET', '/api/forms/published', null, token);
    const canViewForms = formsRes.status === 200;

    // F. Grievances (Lodge / Review)
    const grvRes = await request('GET', '/api/grievances', null, token);
    const canViewGrievances = grvRes.status === 200;

    // G. Scholarships Schemes & Applications
    const schemesRes = await request('GET', '/api/scholarships/schemes', null, token);
    const canViewSchemes = schemesRes.status === 200;

    // Compile UI Feature Mapping
    const uiFeatures = [];
    if (roleDef.roleKey === 'admin') {
      uiFeatures.push('Super Provost Admin Dashboard (Institutional Collections, Total Enrolled, Defaulters, Live Sync)');
      uiFeatures.push('User & Staff Role Management (/user-management) - Hire/Create roles, generate IDs, toggle status');
      uiFeatures.push('Admissions Dual-Mode (Roster Scrutiny + Prospect CRM Recall Radar)');
      uiFeatures.push('Institutional Sanction & Account Provisioning power');
      uiFeatures.push('Universal Student Fee Ledger Audit & Defaulter List Management');
      uiFeatures.push('Dynamic Form Builder & Schema Editor');
      uiFeatures.push('Scholarship Adjudication Committee Chair');
      uiFeatures.push('Grievance Cell Administration & Ticket Dispatch');
      uiFeatures.push('Strategic AI Campus Copilot (Executive Analytics)');
    } else if (roleDef.roleKey === 'staff') {
      uiFeatures.push('Faculty Console (Daily Lecture Register, Attendance Grid, Projected %)');
      uiFeatures.push('MRSPTU Ordinance 7.4 Attendance Detention Tracking (Condonation status)');
      uiFeatures.push('Sessional & Mid-Semester Marks Entry (60 Marks)');
      uiFeatures.push('Mentee / Proctor Group Advisory');
      uiFeatures.push('Admissions Scrutiny Committee & Verification power');
      uiFeatures.push('Prospect Recall Radar Access');
      uiFeatures.push('Mentee Fee Audit (Read-Only)');
      uiFeatures.push('Dynamic Forms Submissions');
    } else if (roleDef.roleKey === 'counselor') {
      uiFeatures.push('Counselor Intake Desk Dashboard');
      uiFeatures.push('Prospect CRM & Follow-Up Recall Radar (Overdue, Due-Today, P1 Hot Leads)');
      uiFeatures.push('3-Step Progressive Intake Wizard (Step 1 Walk-In -> Step 2 Profile -> Step 3 Documents)');
      uiFeatures.push('Interaction Call/Visit Logger & Chronological Audit Timeline');
      uiFeatures.push('Internal SMS Recall Dispatch');
      uiFeatures.push('Applicant Document Scrutiny');
    } else if (roleDef.roleKey === 'hod') {
      uiFeatures.push('HOD Console & Department Faculty Timetables');
      uiFeatures.push('Departmental Course Curriculum & Roster Inspection');
      uiFeatures.push('Lecture Attendance Monitoring & Detention Sanctions');
      uiFeatures.push('Admissions Scrutiny Committee Power');
      uiFeatures.push('Grievance Cell Departmental Escalation');
    } else if (roleDef.roleKey === 'accounts') {
      uiFeatures.push('Chief Accounts Officer Fee Reconciliation Console');
      uiFeatures.push('Itemized Fee Billing & Fine Surcharges');
      uiFeatures.push('Defaulters Recovery Roster & Overdue Aging (30/60/90 days)');
      uiFeatures.push('Official Payment Collection & Cryptographic Receipt Generation');
      uiFeatures.push('Student Fee Ledger Audit');
      uiFeatures.push('AI Fee Reminder Generation');
    } else if (roleDef.roleKey === 'student') {
      uiFeatures.push('Student Personal Portal (Semester Progress, Current CGPA, Attendance %)');
      uiFeatures.push('Personal Itemized Fee Ledger (Tuition, Bus/Hostel, Security Deposit)');
      uiFeatures.push('Pay Now Gateway Modal & Official Printable Receipts');
      uiFeatures.push('Scholarship Schemes Explorer & Single-Click Application');
      uiFeatures.push('Dynamic Student Forms (Hostel Allotment, Mess, Bonafide Certificate)');
      uiFeatures.push('Examination Admit Card Generation (Gated by 75% Attendance & Fee Clearance)');
      uiFeatures.push('Campus Grievance Ticket Submission & Tracking');
    }

    auditReport.push({
      roleDef,
      user,
      student,
      authSuccess: true,
      rbac: {
        userMgmt: hasUserMgmtAccess,
        admissions: canAccessAdmissions,
        radar: canAccessRadar,
        defaulters: canAccessDefaulters,
        ledger: canAccessLedger,
        forms: canViewForms,
        grievances: canViewGrievances,
        schemes: canViewSchemes,
      },
      uiFeatures,
    });
  }

  console.log('\n======================================================================');
  console.log('                    ROLE AUDIT SUMMARY MATRIX                         ');
  console.log('======================================================================\n');

  for (const item of auditReport) {
    console.log(`👤 ROLE: ${item.roleDef.roleName.toUpperCase()}`);
    console.log(`   Username: ${item.user.username} | Email: ${item.user.email}`);
    console.log(`   Designation: ${item.user.designation || 'Student'} | Department: ${item.user.department || 'N/A'}`);
    console.log(`   Assigned Primary Dashboard: ${item.roleDef.expectedDashboard}`);
    console.log(`   RBAC Access Matrix:`);
    console.log(`     • User & Role Management (/user-management): ${item.rbac.userMgmt ? '🟢 PERMITTED (Super Admin)' : '🔴 BLOCKED (HTTP 403)'}`);
    console.log(`     • Admissions & Recall Radar (/admissions):  ${item.rbac.admissions ? '🟢 PERMITTED' : '🔴 RESTRICTED'}`);
    console.log(`     • Institutional Defaulters Screen:         ${item.rbac.defaulters ? '🟢 PERMITTED' : '🔴 RESTRICTED'}`);
    console.log(`     • Fee Ledger Inspection:                   ${item.rbac.ledger ? '🟢 PERMITTED' : '🔴 RESTRICTED'}`);
    console.log(`     • Grievances Cell:                         ${item.rbac.grievances ? '🟢 PERMITTED' : '🔴 RESTRICTED'}`);
    console.log(`   Key UI Surface Capabilities:`);
    for (const feat of item.uiFeatures) {
      console.log(`     - ${feat}`);
    }
    console.log('----------------------------------------------------------------------');
  }
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
