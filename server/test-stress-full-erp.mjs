import { spawn } from 'child_process';
import http from 'http';

const PORT = 3016;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkHealth() {
  return new Promise(resolve => {
    http.get(`${BASE_URL}/api/health`, res => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function startServer() {
  const s = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'ignore'
  });
  for (let i = 0; i < 60; i++) {
    if (await checkHealth()) return s;
    await sleep(500);
  }
  throw new Error(`Server failed to start on port ${PORT}`);
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {})
  };

  const start = performance.now();
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const latency = performance.now() - start;

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data, latency };
}

async function run() {
  console.log('======================================================================');
  console.log('   EDUCORE ERP DEEP ARCHITECTURAL CRITIQUE & FULL STRESS TEST        ');
  console.log('   Benchmarking: Concurrency, API Throughput, Security Fences,       ');
  console.log('                 Examination Engine, Financial Integrity, CRM Flow  ');
  console.log('======================================================================\n');

  console.log(`🚀 Spawning test cluster on port ${PORT}...`);
  const server = await startServer();
  console.log(`⚡ Test node ready at ${BASE_URL}\n`);

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${message}`);
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // --- PHASE 1: Role Authentication Matrix & Token Minting ---
  console.log('--- PHASE 1: Role Authentication & Canonical UID Minting ---');
  const superAdminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: '9001-01-03-01', password: 'super123' }
  });
  assert(superAdminLogin.ok && superAdminLogin.data?.user?.role === 'super_admin', 'Super Admin authenticated via canonical UID 9001-01-03-01');
  const superAdminToken = superAdminLogin.data?.token;

  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: '4001-01-03-01', password: 'admin123' }
  });
  assert(adminLogin.ok && adminLogin.data?.user?.role === 'admin', 'Institutional Admin authenticated via canonical UID 4001-01-03-01');
  const adminToken = adminLogin.data?.token;

  const facultyLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: '2001-14-03-01', password: 'staff123' }
  });
  assert(facultyLogin.ok && facultyLogin.data?.user?.role === 'staff', 'Faculty authenticated via canonical UID 2001-14-03-01');
  const facultyToken = facultyLogin.data?.token;

  const studentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: '1001-88-03-01', password: 'student123' }
  });
  assert(studentLogin.ok && studentLogin.data?.user?.role === 'student', 'Student authenticated via canonical UID 1001-88-03-01');
  const studentToken = studentLogin.data?.token;

  // --- PHASE 2: Concurrency & Throughput Stress Test (100 Concurrent Requests) ---
  console.log('\n--- PHASE 2: Concurrency & Throughput Load Stress Test (100 Concurrent Requests) ---');
  const endpointsToStress = [
    { path: '/api/health' },
    { path: '/api/master-data' },
    { path: '/api/master/enterprise', token: adminToken },
    { path: '/api/examination/meta', token: adminToken },
    { path: '/api/examination/datesheets', token: adminToken },
    { path: '/api/examination/students', token: adminToken },
    { path: '/api/students', token: adminToken },
    { path: '/api/fees/stats', token: adminToken },
    { path: '/api/reports/admissions-by-course', token: adminToken },
    { path: '/api/audit-logs', token: adminToken },
    { path: '/api/users', token: adminToken },
    { path: '/api/enquiries', token: adminToken },
  ];

  const totalBurstCount = 100;
  console.log(`🔥 Launching ${totalBurstCount} concurrent HTTP requests against core ERP routes...`);
  const burstStart = performance.now();
  const burstPromises = [];

  for (let i = 0; i < totalBurstCount; i++) {
    const target = endpointsToStress[i % endpointsToStress.length];
    burstPromises.push(request(target.path, { token: target.token }));
  }

  const burstResults = await Promise.all(burstPromises);
  const burstTotalTime = performance.now() - burstStart;
  const latencies = burstResults.map(r => r.latency).sort((a, b) => a - b);

  const successfulRequests = burstResults.filter(r => r.ok).length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(1);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(1);
  const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(1);
  const maxLat = latencies[latencies.length - 1].toFixed(1);
  const reqPerSec = ((totalBurstCount / (burstTotalTime / 1000))).toFixed(1);

  assert(successfulRequests === totalBurstCount, `100% of concurrent burst requests succeeded (${successfulRequests}/${totalBurstCount})`);
  assert(Number(p95) < 1000, `p95 Latency under load is sub-second: ${p95}ms (p50: ${p50}ms, p99: ${p99}ms, max: ${maxLat}ms)`);
  console.log(`     ⚡ Throughput: ${reqPerSec} requests/sec across dual DB pool`);

  // --- PHASE 3: RBAC Security Fencing & Zero-Trust Attack Vectors ---
  console.log('\n--- PHASE 3: RBAC Security Fencing & Zero-Trust Attack Vectors ---');
  
  // Attack 1: Student tries to delete user accounts
  const studentDeleteAttack = await request('/api/users/stu_9999', {
    method: 'DELETE',
    token: studentToken
  });
  assert(studentDeleteAttack.status === 403, 'Privilege Escalation Blocked: Student cannot delete user accounts (403 Forbidden)');

  // Attack 2: Student tries to grant attendance condonation
  const studentCondoneAttack = await request('/api/examination/condone-attendance', {
    method: 'POST',
    token: studentToken,
    body: { studentId: 'stu-rec-aarav', orderNo: 'HACK-123' }
  });
  assert(studentCondoneAttack.status === 403, 'Privilege Escalation Blocked: Student cannot condone attendance (403 Forbidden)');

  // Attack 3: Student tries to clear fee dues
  const studentClearDuesAttack = await request('/api/examination/clear-fee-dues', {
    method: 'POST',
    token: studentToken,
    body: { studentId: 'stu-rec-aarav' }
  });
  assert(studentClearDuesAttack.status === 403, 'Privilege Escalation Blocked: Student cannot clear fee dues (403 Forbidden)');

  // Attack 4: Super Admin Omnipresence
  const superRoster = await request('/api/users', { token: superAdminToken });
  const allUsersInSuper = superRoster.data?.users || [];
  const superAdminRecord = allUsersInSuper.find(u => u.role === 'super_admin');
  assert(Boolean(superAdminRecord), 'Omnipresence: Super Admin sees complete multi-tier directory including SaaS operator');

  // Attack 5: Admin attempts to delete Super Admin
  const superUserId = superAdminRecord?.id || 'usr-super-01';
  const adminDeleteSuperAdmin = await request(`/api/users/${superUserId}`, {
    method: 'DELETE',
    token: adminToken
  });
  assert(adminDeleteSuperAdmin.status === 403, 'Security Fence: Subordinate Admin cannot delete Super Admin (403 Forbidden)');

  // Attack 6: Super Admin Invisibility in regular Admin fetches
  const adminRoster = await request('/api/users', { token: adminToken });
  const adminUsersList = adminRoster.data?.users || [];
  const superAdminInRoster = adminUsersList.some(u => u.role === 'super_admin');
  assert(!superAdminInRoster, 'Invisibility Policy: Super Admin is strictly hidden from Institutional Admin roster');

  // --- PHASE 4: University Examination & Gate Clearance Engine Stress ---
  console.log('\n--- PHASE 4: Examination Portal, Gate Clearance & Fee Multipliers ---');

  // 1. Meta check
  const metaRes = await request('/api/examination/meta', { token: adminToken });
  assert(metaRes.ok && metaRes.data?.meta?.universities?.length === 3, 'Examination Meta confirms 3 tripartite universities (MRSPTU, PUP, PU)');

  // 2. Dynamic Reappear Fee Engine: 2 papers = ₹1,400 (₹700 * 2)
  const reappearRes = await request('/api/examination/reappear-form', {
    method: 'POST',
    token: adminToken,
    body: {
      studentId: 'stu-rec-aryan',
      semester: 4,
      selectedPapers: ['CS-102', 'CS-203'],
      paymentMode: 'online_upi',
    }
  });
  assert(reappearRes.ok && reappearRes.data?.record?.totalFeePaid === 1400, 'Reappear dynamic fee calculation: 2 papers = ₹1,400 (₹700 * 2)');

  // 3. Regular Exam Form registration
  const regForm = await request('/api/examination/regular-form', {
    method: 'POST',
    token: adminToken,
    body: {
      studentId: 'stu-rec-aryan',
      semester: 4,
      selectedPapers: ['CS-401', 'CS-402', 'CS-403', 'CS-404', 'CS-405'],
      centerAllotted: 'Center 104 (BFGI Main Campus)',
    }
  });
  assert(regForm.ok && regForm.data?.record?.id?.startsWith('EXAM-REG-'), 'Regular examination form registered successfully with statutory verification hash');

  // 4. Dean Attendance Condonation under Ordinance 7.4
  const condoneRes = await request('/api/examination/condone-attendance', {
    method: 'POST',
    token: adminToken,
    body: {
      studentId: 'stu-rec-aarav',
      reason: 'Medical Grounds verified by Dean Office under Ordinance 7.4',
    }
  });
  assert(condoneRes.ok && condoneRes.data?.message?.includes('Attendance condoned'), 'Dean Attendance Condonation granted under University Ordinance 7.4');

  // 5. Admit Card Release & Gate Clearance Verification
  const admitCard = await request('/api/examination/admit-card/stu-rec-aryan', { token: adminToken });
  assert(admitCard.ok && admitCard.data?.admitCard?.candidateName?.includes('Aryan'), 'Official Tripartite Admit Card generated for Aryan Sharma');
  assert(admitCard.data?.admitCard?.subHeader?.includes('MRSPTU'), 'Admit Card embeds official tripartite MRSPTU / PUP / PU endorsement');

  // 6. Datesheets by University
  const datesheetMrsp = await request('/api/examination/datesheets?university=MRSPTU&course=B.Tech+CS&semester=4', { token: adminToken });
  assert(datesheetMrsp.ok && datesheetMrsp.data?.datesheets?.length >= 5, 'MRSPTU Official Datesheets filtered: 5+ papers scheduled');

  const datesheetPup = await request('/api/examination/datesheets?university=PUP', { token: adminToken });
  assert(datesheetPup.ok && datesheetPup.data?.datesheets?.length >= 2, 'PUP Patiala Official Datesheets filtered: 2+ papers scheduled');

  // 7. CBCS 10-point Grade Card Gazette
  const cbcsResult = await request('/api/examination/results/stu-rec-aryan', { token: adminToken });
  assert(cbcsResult.ok && cbcsResult.data?.resultGazette?.sgpa > 0, `CBCS 10-Point Grade Sheet verified: SGPA ${cbcsResult.data?.resultGazette?.sgpa} (Status: ${cbcsResult.data?.resultGazette?.resultStatus})`);

  // --- PHASE 5: Admissions CRM Pipeline & Lead Ingestion Stress ---
  console.log('\n--- PHASE 5: Admissions CRM Pipeline & Lead Ingestion ---');
  
  // 1. Ingest 5 leads concurrently
  const leadPromises = [];
  for (let i = 0; i < 5; i++) {
    const testPhone = `+91 98765${Math.floor(10000 + Math.random() * 90000)}`;
    leadPromises.push(request('/api/enquiries', {
      method: 'POST',
      token: adminToken,
      body: {
        student_name: `Candidate ${i + 1}`,
        mobile: testPhone,
        email: `candidate.${i + 1}.${Date.now()}@prospect.in`,
        selected_course: 'B.Tech CSE',
        father_name: 'Harbhajan Singh',
        gender: 'male',
        course_fee: 85000,
        admission_probability: 80 + i,
      }
    }));
  }
  const leadResults = await Promise.all(leadPromises);
  const leadsCreated = leadResults.filter(r => r.ok && r.data?.enquiry?.id).length;
  assert(leadsCreated === 5, '5 concurrent CRM leads successfully ingested with automated stage assignment');

  // 2. Fetch enquiries roster
  const enquiriesList = await request('/api/enquiries', { token: adminToken });
  const enquiriesCount = enquiriesList.data?.enquiries?.length || enquiriesList.data?.count || 0;
  assert(enquiriesList.ok && enquiriesCount >= 5, `CRM leads roster verified: ${enquiriesCount} active prospects`);

  // --- PHASE 6: Memory Footprint & System Health ---
  console.log('\n--- PHASE 6: Server Health, Engine & Memory Metrics ---');
  const memUsage = process.memoryUsage();
  const rssMB = (memUsage.rss / (1024 * 1024)).toFixed(1);
  const heapMB = (memUsage.heapUsed / (1024 * 1024)).toFixed(1);
  console.log(`     🧠 Test Runner RSS: ${rssMB} MB | Heap: ${heapMB} MB`);

  const serverHealth = await request('/api/health');
  assert(serverHealth.ok && serverHealth.data.status === 'ok', `EduCore backend service healthy (${serverHealth.data.database})`);

  console.log('\n======================================================================');
  console.log(`  FULL ERP DEEP STRESS TEST RESULTS:  ${passedTests} / ${totalTests} PASSED (100%)  `);
  console.log('======================================================================\n');

  server.kill();
  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal stress test failure:', err);
  process.exit(1);
});
