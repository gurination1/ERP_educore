// EduCore Complete 32-Agent Fleet Action Trigger & Verification Benchmark
import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

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

async function triggerFleetActions() {
  console.log('======================================================================');
  console.log('   EduCore College ERP — 32-Agent Real Action Execution & Fleet Test  ');
  console.log('======================================================================\n');

  let totalActions = 0;
  let passedActions = 0;
  let failedActions = 0;

  function record(condition, msg) {
    totalActions++;
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passedActions++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failedActions++;
    }
  }

  // --------------------------------------------------------------------------
  // ADMIN 1: Dr. Ramesh Chandra (Registrar & Provost)
  // --------------------------------------------------------------------------
  console.log('\n--- Deploying Admin 1: Provost & Registrar (admin@educore.edu) ---');
  let admin1Token = null;
  const a1Login = await request('POST', '/api/auth/login', { username: 'admin@educore.edu', password: '123456' });
  record(a1Login.status === 200 && a1Login.data.user?.role === 'admin', 'Admin 1 authenticated successfully');
  admin1Token = a1Login.data.token;

  // Admin 1 action: Fetch admissions
  const admList = await request('GET', '/api/admissions', null, admin1Token);
  record(admList.status === 200 && Array.isArray(admList.data.admissions), `Admin 1 inspected admissions queue (${admList.data.admissions?.length} applications)`);

  // Admin 1 action: Publish emergency circular notice
  const noticeRes = await request('POST', '/api/notices', {
    title: 'Fleet Campus Verification: Fall Semester Operations',
    content: 'All departmental academic schedules, fee structures, and attendance monitoring portals are synchronized.',
    category: 'academic',
    is_pinned: 1,
  }, admin1Token);
  record(noticeRes.status === 201 || noticeRes.status === 200, 'Admin 1 published campus circular notice');

  // Admin 1 action: Create dynamic student survey form
  const formRes = await request('POST', '/api/forms', {
    title: 'Fleet Student Campus Experience Survey 2025',
    description: 'Comprehensive evaluation of lab facilities, cafeteria, and hybrid cloud learning infrastructure.',
    schema_json: [
      { name: 'satisfaction', label: 'Overall Satisfaction', type: 'select', required: true, options: ['Excellent', 'Good', 'Average'] },
      { name: 'lab_access', label: 'Lab Systems Rating', type: 'radio', required: true, options: ['5 Stars', '4 Stars', '3 Stars'] },
    ],
  }, admin1Token);
  record(formRes.status === 201, `Admin 1 published dynamic student survey form (ID: ${formRes.data.form?.id})`);
  const activeFormId = formRes.data.form?.id;

  // --------------------------------------------------------------------------
  // ADMIN 2: Dr. Priya Nair (Chief Financial Officer & Bursar)
  // --------------------------------------------------------------------------
  console.log('\n--- Deploying Admin 2: Chief Financial Officer & Bursar (bursar@educore.edu) ---');
  let bursarToken = null;
  const a2Login = await request('POST', '/api/auth/login', { username: 'bursar@educore.edu', password: '123456' });
  record(a2Login.status === 200 && a2Login.data.user?.role === 'admin', 'Admin 2 authenticated successfully');
  bursarToken = a2Login.data.token;

  // Admin 2 action: KPI Fee Collections
  const kpiRes = await request('GET', '/api/fees/kpi', null, bursarToken);
  record(kpiRes.status === 200 && kpiRes.data.kpi?.totalCollectedRaw >= 0, `Admin 2 audited fee KPIs (Total Collected: ₹${kpiRes.data.kpi?.totalCollectedRaw})`);

  // Admin 2 action: Defaulters review
  const defRes = await request('GET', '/api/fees/defaulters', null, bursarToken);
  record(defRes.status === 200 && Array.isArray(defRes.data.defaulters), `Admin 2 audited active fee defaulters (${defRes.data.defaulters?.length} defaulters identified)`);

  // Admin 2 action: Review scholarships queue
  const schRes = await request('GET', '/api/scholarships/applications', null, bursarToken);
  record(schRes.status === 200 && Array.isArray(schRes.data.applications), `Admin 2 audited scholarship applications queue (${schRes.data.applications?.length} applications)`);

  // --------------------------------------------------------------------------
  // 30 STUDENTS: Individual Actions Execution Loop
  // --------------------------------------------------------------------------
  console.log('\n--- Deploying 30 Active Students Fleet (stu001 to stu030) ---');

  for (let i = 1; i <= 30; i++) {
    const num = i.toString().padStart(3, '0');
    const email = `stu${num}@educore.edu`;
    const studentDbId = `stu-rec-${num}`;

    // 1. Student Login
    const login = await request('POST', '/api/auth/login', { username: email, password: '123456' });
    if (login.status !== 200) {
      record(false, `Student ${num} (${email}) login failed: ${login.status}`);
      continue;
    }
    const token = login.data.token;
    const studentProfile = login.data.student;
    record(true, `Student ${num} (${login.data.user?.full_name}): Authenticated, enrolled in Sem ${studentProfile?.current_semester || 1}`);

    // 2. Student Check Fee Ledger
    const ledger = await request('GET', `/api/fees/ledger/${studentDbId}`, null, token);
    record(ledger.status === 200, `Student ${num} fee ledger retrieved (Due: ₹${ledger.data.summary?.totalDue}, Paid: ₹${ledger.data.summary?.totalPaid})`);

    // 3. Student Action: If fee is due, pay installment or check receipt
    if (ledger.data.summary?.totalDue > 0) {
      const payRes = await request('POST', '/api/fees/collect', {
        studentId: studentDbId,
        amount: ledger.data.summary.totalDue,
        paymentMode: 'online_upi',
        notes: 'Fleet automated semester fee clearance',
      }, admin1Token);
      record(payRes.status === 201, `Student ${num} settled outstanding balance, generated receipt: ${payRes.data.receiptNo}`);
    } else {
      record(true, `Student ${num} has zero outstanding balance (fully compliant)`);
    }

    // 4. Student Dynamic Form Response Submission
    if (activeFormId && i % 3 === 0) {
      const subRes = await request('POST', `/api/forms/${activeFormId}/submit`, {
        responses: {
          satisfaction: 'Excellent',
          lab_access: '5 Stars',
        },
      }, token);
      record(subRes.status === 201, `Student ${num} submitted dynamic campus survey feedback`);
    }

    // 5. Student Scholarship Application (Sample batch)
    if (i % 5 === 0) {
      const schAppRes = await request('POST', '/api/scholarships/apply', {
        scheme_id: 'sch-merit-01',
        student_id: studentDbId,
        annual_family_income: 350000,
        previous_gpa: 9.2,
        reason_for_application: 'High academic rank and STEM research honors.',
      }, token);
      record(schAppRes.status === 201, `Student ${num} applied for Institutional Merit Scholarship`);
    }

    // 6. Student RBAC Fence Test: Must be BLOCKED from Admin Defaulters list
    const rbacTest = await request('GET', '/api/fees/defaulters', null, token);
    record(rbacTest.status === 403, `Student ${num} RBAC fence: Forbidden from Admin Defaulters (HTTP 403 Verified)`);

    // 7. Student AI Copilot Query (every 6th student)
    if (i % 6 === 0) {
      const copilotRes = await request('POST', '/api/ai/copilot', {
        query: 'What is my current semester attendance percentage and am I eligible for final exams?',
      }, token);
      record(copilotRes.status === 200 && copilotRes.data.result?.answer?.length > 20, `Student ${num} queried AI Student Advisor (Attendance & Exam Advisory OK)`);
    }
  }

  console.log('\n======================================================================');
  console.log(`FLEET TRIGGER RESULTS: ${passedActions} PASSED, ${failedActions} FAILED (Total: ${totalActions} Actions)`);
  console.log('======================================================================');

  if (failedActions === 0) {
    console.log('🚀 ALL 32 AGENT ACTIONS (2 ADMINS + 30 STUDENTS) EXECUTED WITH 100% PRECISION!\n');
  } else {
    console.error(`⚠️ Found ${failedActions} failures during fleet action execution.\n`);
    process.exit(1);
  }
}

triggerFleetActions().catch(err => {
  console.error('Fatal Fleet Execution Error:', err);
  process.exit(1);
});
