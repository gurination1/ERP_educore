import http from 'http';
import { spawn } from 'child_process';

const TEST_PORT = 3015;

const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${TEST_PORT}`;

const ROLE_CREDENTIALS = {
  super_admin: { username: '9001-01-03-01', password: 'super123' },
  admin: { username: '4001-01-03-01', password: 'admin123' },
  staff: { username: '2001-14-03-01', password: 'staff123' },
  hod: { username: '3001-01-03-01', password: 'hod123' },
  counselor: { username: '6001-02-03-01', password: 'counselor123' },
  accounts: { username: '5001-05-03-01', password: 'accounts123' },
  student: { username: '1001-88-03-01', password: 'student123' },
  partner: { username: '7001-01-03-01', password: 'partner123' },
  hr: { username: '8001-01-03-01', password: 'hr123' },
};

const tokenCache = {};

async function rawRequest(path, method = 'GET', headers = {}, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.text();
  const resHeaders = {};
  res.headers.forEach((v, k) => { resHeaders[k] = v; });
  return { status: res.status, data, headers: resHeaders };
}

async function getTokenForRole(role) {
  if (tokenCache[role]) return tokenCache[role];
  const creds = ROLE_CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role ${role}`);

  const res = await rawRequest('/api/auth/login', 'POST', {}, creds);
  if (res.status !== 200) {
    throw new Error(`Failed to login as ${role} (${creds.username}): status ${res.status} - ${res.data}`);
  }
  const json = JSON.parse(res.data);
  tokenCache[role] = json.token;
  return json.token;
}

async function reqRole(path, role, method = 'GET', body = null) {
  const token = await getTokenForRole(role);
  return rawRequest(path, method, { 'Authorization': `Bearer ${token}` }, body);
}

async function run() {
  console.log('Testing target endpoint:', BASE_URL);
  let server = null;
  if (!process.env.BASE_URL) {
    let ready = false;
    try {
      const h = await fetch(`${BASE_URL}/api/health`);
      if (h.ok) ready = true;
    } catch {}

    if (!ready) {
      console.log('Spawning test server on port', TEST_PORT);
      server = spawn('node', ['dist/server.cjs'], {
        env: { ...process.env, PORT: String(TEST_PORT) },
        stdio: 'inherit',
      });

      // Poll /api/health until ready
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 600));
        try {
          const res = await fetch(`${BASE_URL}/api/health`);
          if (res.ok) {
            ready = true;
            console.log('Server successfully initialized and listening on port', TEST_PORT);
            break;
          }
        } catch {}
      }
      if (!ready) {
        throw new Error('Server failed to start within timeout on port ' + TEST_PORT);
      }
    }
  }

  let totalPassed = 0;
  let totalFailed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ [PASS]: ${msg}`);
      totalPassed++;
    } else {
      console.error(`  ❌ [FAIL]: ${msg}`);
      totalFailed++;
    }
  }

  try {
    console.log('\n--- 1. Testing Role Authorization Expansion on Reports ---');
    for (const role of ['accounts', 'hod', 'hr', 'staff', 'admin']) {
      const res = await reqRole('/api/reports/admissions-by-course', role);
      assert(res.status === 200, `GET /api/reports/admissions-by-course for role '${role}' returns 200 OK`);

      const resWork = await reqRole('/api/reports/academic-workload', role);
      assert(resWork.status === 200, `GET /api/reports/academic-workload for role '${role}' returns 200 OK`);

      const resCsv = await reqRole('/api/reports/export-students-csv', role);
      assert(resCsv.status === 200 && resCsv.headers['content-type']?.includes('text/csv'), `GET /api/reports/export-students-csv for role '${role}' returns 200 CSV`);
    }

    console.log('\n--- 2. Testing Fee KPIs & Defaulters across Roles ---');
    for (const role of ['accounts', 'hod', 'hr', 'counselor']) {
      const resKpi = await reqRole('/api/fees/kpi', role);
      assert(resKpi.status === 200, `GET /api/fees/kpi for role '${role}' returns 200 OK`);

      const resTrend = await reqRole('/api/fees/trend', role);
      assert(resTrend.status === 200, `GET /api/fees/trend for role '${role}' returns 200 OK`);

      const resDef = await reqRole('/api/fees/defaulters', role);
      assert(resDef.status === 200, `GET /api/fees/defaulters for role '${role}' returns 200 OK`);
    }

    console.log('\n--- 3. Testing Scholarship Schemes & Reviews across Roles ---');
    for (const role of ['accounts', 'counselor', 'hod', 'staff', 'admin']) {
      const resSchemes = await reqRole('/api/scholarships/schemes', role);
      assert(resSchemes.status === 200, `GET /api/scholarships/schemes for role '${role}' returns 200 OK`);
    }

    console.log('\n--- 4. Testing HR access to Student Directory ---');
    const resHrStudents = await reqRole('/api/students', 'hr');
    assert(resHrStudents.status === 200, "GET /api/students for role 'hr' returns 200 OK (no 403 Forbidden)");

    console.log('\n--- 5. Testing Grievance Adjudication permissions ---');
    for (const role of ['hod', 'hr', 'staff', 'admin']) {
      const resGrv = await reqRole('/api/grievances/grv-nonexistent/resolve', role, 'PATCH', { status: 'resolved', adminRemarks: 'Resolved by committee' });
      assert(resGrv.status !== 403, `PATCH /api/grievances/:id/resolve for role '${role}' is NOT 403 Forbidden (status: ${resGrv.status})`);
    }

    console.log('\n--- 6. Testing Partner Profile Permissions ---');
    for (const role of ['partner', 'hr', 'admin']) {
      const resPart = await reqRole('/api/partners/part-nonexistent', role, 'PUT', { firm_name: 'Test Partner Corp' });
      assert(resPart.status !== 403, `PUT /api/partners/:id for role '${role}' is NOT 403 Forbidden (status: ${resPart.status})`);
    }

    console.log('\n--- 7. Testing Super Admin Universal Route Access (No 403 Lockouts) ---');
    const saUsers = await reqRole('/api/users', 'super_admin');
    assert(saUsers.status === 200, "GET /api/users for role 'super_admin' returns 200 OK");

    const saStudents = await reqRole('/api/students', 'super_admin');
    assert(saStudents.status === 200, "GET /api/students for role 'super_admin' returns 200 OK");

    const saAdmissions = await reqRole('/api/admissions', 'super_admin');
    assert(saAdmissions.status === 200, "GET /api/admissions for role 'super_admin' returns 200 OK");

    const saEnquiries = await reqRole('/api/enquiries', 'super_admin');
    assert(saEnquiries.status === 200, "GET /api/enquiries for role 'super_admin' returns 200 OK");

    const saDepartments = await reqRole('/api/masters/departments', 'super_admin');
    assert(saDepartments.status === 200, "GET /api/masters/departments for role 'super_admin' returns 200 OK");

    console.log('\n--- 8. Testing Accounts Role Access on AI Fee Notice Engine ---');
    const accAiNotice = await reqRole('/api/ai/fee-notice', 'accounts', 'POST', {
      studentName: 'Aryan Sharma',
      amountDue: 45000,
      dueDate: '2026-11-01',
      tone: 'formal'
    });
    assert(accAiNotice.status !== 403, `POST /api/ai/fee-notice for role 'accounts' is NOT 403 Forbidden (status: ${accAiNotice.status})`);

    console.log('\n--- 9. Testing Attendance Gate Ordinance (75% Cutoff) ---');
    const admitRes = await reqRole('/api/exam/admit-card/1001-88-03-01', 'student');
    assert(admitRes.status === 200, "GET /api/exam/admit-card/1001-88-03-01 for 'student' returns 200 OK");
    const admitJson = JSON.parse(admitRes.data);
    assert(admitJson.success === true && typeof admitJson.isEligible === 'boolean' && typeof admitJson.status === 'string', "Admit card gate clearance eligibility is present and valid");

    console.log('\n======================================================================');
    console.log(`TOTAL PASSED: ${totalPassed} | TOTAL FAILED: ${totalFailed}`);
    console.log('======================================================================');

    if (totalFailed > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (server) server.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
