import http from 'http';
import { spawn } from 'child_process';

const TEST_PORT = 3015;

const ROLE_CREDENTIALS = {
  super_admin: { username: '9001-01-03-01', password: 'superadmin123' },
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

function rawRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const request = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    request.on('error', reject);
    if (body) {
      request.write(JSON.stringify(body));
    }
    request.end();
  });
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
  console.log('Testing server on port', TEST_PORT);
  let server = null;
  try {
    await new Promise((resolve) => {
      const ping = http.get(`http://127.0.0.1:${TEST_PORT}/api/health`, () => {
        resolve(true);
      });
      ping.on('error', () => {
        console.log('Spawning test server on port', TEST_PORT);
        server = spawn('node', ['dist/server.cjs'], {
          env: { ...process.env, PORT: String(TEST_PORT) },
          stdio: 'inherit',
        });
        setTimeout(resolve, 5000);
      });
    });
  } catch (e) {}

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
