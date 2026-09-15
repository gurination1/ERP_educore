// Live Railway EduCore Multi-Agent Verification & Punjab EduMarshal (BFGI) Audit
import https from 'https';
import http from 'http';

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3333';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'EduCore-MultiAgent-Auditor/1.0',
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
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

async function runLiveMultiAgentAudit() {
  console.log('======================================================================');
  console.log('  EDUCORE LIVE RAILWAY MULTI-AGENT VERIFICATION & PUNJAB BFGI AUDIT  ');
  console.log('  Target: ' + BASE_URL);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  const auditReport = {
    admin: {},
    studentAryan: {},
    otherStudents: {},
    bidirectionalSync: {},
    punjabBfgiGaps: []
  };

  function test(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `-> ${details}` : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // AGENT 1: ADMIN & REGISTRAR PORTAL (Dr. Ramesh Chandra)
  // --------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('AGENT 1: ADMIN / REGISTRAR PORTAL (Dr. Ramesh Chandra)');
  console.log('----------------------------------------------------------------------');

  let adminToken = null;
  try {
    const login = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    });
    test(login.status === 200 && login.data.success, 'Admin Login (admin / admin123)');
    test(login.data.user?.role === 'admin', 'Admin Role Verified in JWT payload');
    adminToken = login.data.token;
    auditReport.admin.login = { status: login.status, user: login.data.user?.full_name };

    // Admin Dashboard / Students List
    const studentsRes = await request('GET', '/api/students?limit=10', null, adminToken);
    test(studentsRes.status === 200, 'Admin can list students', `Count: ${studentsRes.data?.students?.length}`);
    test(studentsRes.data?.total > 0, `Total student records in live DB: ${studentsRes.data?.total}`);

    // Fee KPIs
    const feeKpi = await request('GET', '/api/fees/kpi', null, adminToken);
    test(feeKpi.status === 200, 'Fee KPIs endpoint operational', `Total Collected: ${feeKpi.data?.kpi?.totalCollected}`);

    // Fee Defaulters List
    const defaulters = await request('GET', '/api/fees/defaulters', null, adminToken);
    test(defaulters.status === 200, 'Defaulters list accessible', `Defaulters: ${defaulters.data?.defaulters?.length}`);

    // Scholarship Applications Queue
    const scholarships = await request('GET', '/api/scholarships/applications', null, adminToken);
    test(scholarships.status === 200, 'Admin can view scholarship applications queue', `Apps: ${scholarships.data?.applications?.length}`);

    // Dynamic Forms
    const forms = await request('GET', '/api/forms', null, adminToken);
    test(forms.status === 200, 'Admin can view dynamic forms', `Forms: ${forms.data?.forms?.length}`);

    // Campus Notices
    const notices = await request('GET', '/api/notices', null, adminToken);
    test(notices.status === 200, 'Campus notices accessible', `Notices: ${notices.data?.notices?.length}`);

    // Grievance Redressal Cell
    const grievances = await request('GET', '/api/grievances', null, adminToken);
    test(grievances.status === 200, 'Admin can inspect UGC Grievance Redressal tickets', `Tickets: ${grievances.data?.count}`);

    // AI Copilot
    const copilot = await request('POST', '/api/ai/copilot', {
      query: 'Check college fee collection status and attendance warnings.'
    }, adminToken);
    test(copilot.status === 200, 'AI Campus Copilot response ready for live demo');
  } catch (err) {
    test(false, 'Admin Agent crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // AGENT 2: PRIMARY STUDENT PORTAL (Aryan Sharma - STU-2023-088)
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('AGENT 2: PRIMARY STUDENT PORTAL (Aryan Sharma)');
  console.log('----------------------------------------------------------------------');

  let studentToken = null;
  let aryanStudentId = null;
  try {
    const sLogin = await request('POST', '/api/auth/login', {
      username: 'aryan',
      password: 'student123',
      role: 'student',
    });
    test(sLogin.status === 200 && sLogin.data.success, 'Student Aryan Login (aryan / student123)');
    test(sLogin.data.user?.role === 'student', 'Student Role Verified in JWT');
    studentToken = sLogin.data.token;
    aryanStudentId = sLogin.data.student?.id || 'stu-rec-aryan';

    // Student Dashboard
    const dashboard = await request('GET', `/api/students/${aryanStudentId}/dashboard`, null, studentToken);
    test(dashboard.status === 200, 'Aryan Dashboard fetched successfully');
    test(dashboard.data.student?.student_id === 'STU-2023-088', 'Aryan Roll No verified (STU-2023-088)');
    test(dashboard.data.attendance !== undefined, `Aryan Attendance: ${dashboard.data.attendance?.percentage}% (${dashboard.data.attendance?.attended}/${dashboard.data.attendance?.total} classes)`);

    // Student Fee Ledger
    const ledger = await request('GET', `/api/fees/ledger/${aryanStudentId}`, null, studentToken);
    test(ledger.status === 200, 'Aryan Fee Ledger retrieved');
    test(ledger.data.summary?.totalDue !== undefined, `Fee Status: Due ₹${ledger.data.summary?.totalDue}, Paid ₹${ledger.data.summary?.totalPaid}`);

    // Student Scholarships
    const schemes = await request('GET', '/api/scholarships/schemes', null, studentToken);
    test(schemes.status === 200, 'Aryan can browse active scholarship schemes', `Schemes: ${schemes.data?.schemes?.length}`);

    // Student Grievances
    const myGrievances = await request('GET', '/api/grievances', null, studentToken);
    test(myGrievances.status === 200, 'Aryan can access Grievance Redressal tickets');

    // Security Fence Test: Aryan cannot access Admin Defaulters List
    const breach = await request('GET', '/api/fees/defaulters', null, studentToken);
    test(breach.status === 403, 'RBAC Fence: Student blocked from Admin Defaulters list (HTTP 403)');
  } catch (err) {
    test(false, 'Aryan Agent crashed', err.message);
  }

  // --------------------------------------------------------------------------
  // AGENT 3: OTHER STUDENT ACCOUNTS AUTHENTICATION AUDIT
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('AGENT 3: OTHER STUDENT ACCOUNTS AUDIT (rohan, priya, aarav, neha, stu001)');
  console.log('----------------------------------------------------------------------');

  const candidateAccounts = [
    { username: 'rohan', pass: 'student123', name: 'Rohan Gupta (B.Sc Physics, STU-008)' },
    { username: 'priya', pass: 'student123', name: 'Priya Patel (MBA Finance, STU-007)' },
    { username: 'aarav', pass: 'student123', name: 'Aarav Sharma (B.Tech CS, STU-006)' },
    { username: 'neha', pass: 'student123', name: 'Neha Singh (B.Tech ME, STU-009)' },
    { username: 'stu001', pass: 'student123', name: 'Aaditya Verma (B.Tech CS, STU-2025-001 - Seeded)' },
  ];

  for (const acc of candidateAccounts) {
    const res = await request('POST', '/api/auth/login', {
      username: acc.username,
      password: acc.pass,
      role: 'student'
    });
    if (res.status === 200 && res.data.success) {
      test(true, `Account [${acc.username}] login SUCCEEDED (${acc.name})`);
      auditReport.otherStudents[acc.username] = { status: 'OK', user: res.data.user?.full_name };
    } else {
      test(false, `Account [${acc.username}] login FAILED: ${res.data?.error || 'HTTP ' + res.status} (${acc.name})`);
      auditReport.otherStudents[acc.username] = { status: 'MISSING_IN_USERS_TABLE', error: res.data?.error };
    }
  }

  // --------------------------------------------------------------------------
  // AGENT 4: BIDIRECTIONAL SYNC (Student <-> Admin Workflows)
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('AGENT 4: BIDIRECTIONAL SYNC WORKFLOWS');
  console.log('----------------------------------------------------------------------');

  if (studentToken && adminToken) {
    const ts = Date.now();
    // 1. Student lodges a Grievance Ticket
    const grvRes = await request('POST', '/api/grievances', {
      category: 'hostel',
      subject: `Hostel Wi-Fi Connectivity Issue Wing-B [${ts}]`,
      description: 'The Wi-Fi router on 2nd floor hostel wing B has been dropping packets during evening study hours.',
      priority: 'high'
    }, studentToken);
    test(grvRes.status === 201, 'Student lodges Grievance Ticket under UGC Redressal');
    const trackingCode = grvRes.data?.trackingCode;
    const grievanceId = grvRes.data?.grievance?.id;

    // 2. Admin retrieves and resolves the Grievance
    if (grievanceId) {
      const resolveRes = await request('PATCH', `/api/grievances/${grievanceId}/resolve`, {
        status: 'resolved',
        adminRemarks: 'IT Services inspected Access Point AP-204, rebooted firmware and replaced Ethernet patch cable.'
      }, adminToken);
      test(resolveRes.status === 200, 'Admin resolves Grievance with official remarks');

      // 3. Student inspects ticket to verify real-time status sync
      const verifyGrv = await request('GET', `/api/grievances/${grievanceId}`, null, studentToken);
      test(verifyGrv.data?.grievance?.status === 'resolved', 'Student sees ticket status updated to "resolved" in real-time');
      test(verifyGrv.data?.grievance?.admin_remarks?.includes('IT Services'), 'Student sees Admin resolution remarks');
    }

    // 4. Student discovers Dynamic Forms and submits
    const formsRes = await request('GET', '/api/forms', null, studentToken);
    if (formsRes.data?.forms?.length > 0) {
      const form = formsRes.data.forms[0];
      const validResponses = {};
      if (Array.isArray(form.schema_json)) {
        for (const f of form.schema_json) {
          if (f.type === 'number') validResponses[f.name] = 1;
          else if (f.type === 'select' && f.options?.length > 0) validResponses[f.name] = f.options[0];
          else if (f.type === 'checkbox') validResponses[f.name] = true;
          else validResponses[f.name] = 'Sample input text';
        }
      }
      const subRes = await request('POST', `/api/forms/${form.id}/submit`, {
        responses: validResponses
      }, studentToken);
      test(subRes.status === 201 || subRes.status === 409, `Student submits response to dynamic form "${form.title}"`);
    }
  }

  // --------------------------------------------------------------------------
  // AGENT 5: PUNJAB EDUMARSHAL ERP (BFGI) CRITIQUE & GAP ANALYSIS
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('AGENT 5: PUNJAB EDUMARSHAL ERP (BFGI) CRITIQUE & GAP MATRIX');
  console.log('----------------------------------------------------------------------');

  const punjabBenchmarks = [
    {
      module: 'Attendance & PTU 75% Detention Rule',
      edumarshalStandard: 'Strict 75% mandatory attendance calculation per subject (Lecture/Tutorial/Practical). Automated detention list generation and blocking of university admit cards (Roll Number Slips).',
      educoreStatus: 'PARTIAL',
      details: 'EduCore tracks overall attendance percentage and flags <75% with `isLowAttendance: true`, but lacks subject-wise L-T-P breakdown and automated admit-card detention blocking.'
    },
    {
      module: 'MST & Continuous Internal Assessment (CIA)',
      edumarshalStandard: 'Mid-Semester Tests (MST-1, MST-2), Quiz/Assignment marks (usually 24 or 40 internal marks per PTU/MRSPTU scheme) with faculty entry and student report card view.',
      educoreStatus: 'MISSING IN DEMO',
      details: 'EduCore currently does not expose an Examination / Internal Marks entry router (focused on admissions, fees, scholarships, grievances).'
    },
    {
      module: 'Punjab Post-Matric Scholarship (PMS - Dr. Ambedkar Portal)',
      edumarshalStandard: 'SC/ST Freeship Card integration for families < 2.5 Lakhs income, 100% zero-fee admission with Punjab Govt reimbursement tracking.',
      educoreStatus: 'PARTIAL',
      details: 'EduCore has a powerful Scholarship module with scheme creation and student document upload, but needs explicit Punjab PMS Freeship category.'
    },
    {
      module: 'Centre for Grievance Redressal and Mentoring',
      edumarshalStandard: 'UGC-compliant digital grievance ticketing for Academic, Hostel, Transport, Fees, Ragging with mentor assignment and escalation SLA.',
      educoreStatus: 'EXCELLENT',
      details: 'EduCore implements `/api/grievances` with tracking codes (GRV-YYYY-XXXX), RBAC scoping, multi-category classification, and admin resolution.'
    },
    {
      module: 'Institutional Bus & Fleet Transport',
      edumarshalStandard: 'BFGI runs 100+ buses covering Bathinda, Mansa, Muktsar, Barnala. ERP has route number, boarding point, and bus pass generation.',
      educoreStatus: 'PARTIAL / DB-READY',
      details: 'EduCore DB schema supports `is_transport_user` and `transport_route`, but UI lacks active bus pass management view.'
    },
    {
      module: 'Multi-Department No-Dues Clearance',
      edumarshalStandard: 'End-of-semester digital clearance signoffs (Library, Hostel, Lab, Accounts, Sports) before degree/hall-ticket dispatch.',
      educoreStatus: 'ROADMAP',
      details: 'EduCore enforces fee clearance (Ledger / Defaulters), but does not yet chain Library/Lab department signoffs.'
    }
  ];

  punjabBenchmarks.forEach((b, idx) => {
    console.log(`  [${idx + 1}] ${b.module}: [${b.educoreStatus}]`);
    console.log(`      BFGI Standard: ${b.edumarshalStandard}`);
    console.log(`      EduCore Reality: ${b.details}\n`);
  });

  console.log('======================================================================');
  console.log(`TOTAL AUDIT METRICS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');
}

runLiveMultiAgentAudit().catch(err => {
  console.error('Fatal audit error:', err);
});
