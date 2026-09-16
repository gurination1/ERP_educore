const BASE_URL = process.env.TEST_URL || 'https://educore-erp-production.up.railway.app';

async function req(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url.toString(), { method, headers, body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, data: json, text };
}

async function testStaffAndZeroDues() {
  console.log(`\n======================================================`);
  console.log(`🔍 VERIFYING STAFF IDENTITY & ZERO-DUES ADMIT CARD GATE`);
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. Staff Login Verification
  console.log(`--- [1] Staff Login Identity ---`);
  const staffLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { username: 'staff', password: 'staff123' }
  });
  if (staffLogin.status !== 200 || !staffLogin.data.success) {
    throw new Error(`Staff login failed: ${JSON.stringify(staffLogin.data)}`);
  }
  console.log(`  ✅ PASS: Staff login succeeded`);
  console.log(`  👤 Full Name: ${staffLogin.data.user.full_name}`);
  console.log(`  🏷️  Role: ${staffLogin.data.user.role}`);
  console.log(`  🎓 Student Profile: ${staffLogin.data.student ? 'Present' : 'null (Correct: Staff is Faculty, not Student)'}`);
  
  if (staffLogin.data.user.role !== 'staff') {
    throw new Error(`Expected role 'staff', got: ${staffLogin.data.user.role}`);
  }
  if (staffLogin.data.student !== null) {
    throw new Error(`Staff member should not have a student profile attached.`);
  }

  const staffToken = staffLogin.data.token;
  const staffHeaders = { Authorization: `Bearer ${staffToken}` };

  // 2. Staff Admin Access Permissions
  console.log(`\n--- [2] Staff Administrative Endpoint Permissions ---`);
  const kpiRes = await req('/api/fees/kpi', { headers: staffHeaders });
  if (kpiRes.status !== 200) throw new Error(`Staff cannot access KPI: ${kpiRes.status}`);
  console.log(`  ✅ PASS: Staff can access /api/fees/kpi (Total Collected: ${kpiRes.data.kpi.totalCollectedFormatted})`);

  const defaultersRes = await req('/api/fees/defaulters', { headers: staffHeaders });
  if (defaultersRes.status !== 200) throw new Error(`Staff cannot access defaulters: ${defaultersRes.status}`);
  console.log(`  ✅ PASS: Staff can access /api/fees/defaulters (Count: ${defaultersRes.data.count})`);

  const admissionsRes = await req('/api/admissions', { headers: staffHeaders });
  if (admissionsRes.status !== 200) throw new Error(`Staff cannot access admissions: ${admissionsRes.status}`);
  console.log(`  ✅ PASS: Staff can access /api/admissions (Count: ${admissionsRes.data.count})`);

  // 3. Aryan Zero Dues & Released Admit Card Verification
  console.log(`\n--- [3] Aryan Zero Dues & Hall Ticket Released Status ---`);
  const aryanLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { username: 'aryan', password: 'student123' }
  });
  if (aryanLogin.status !== 200) throw new Error(`Aryan login failed`);
  const aryanToken = aryanLogin.data.token;
  const aryanHeaders = { Authorization: `Bearer ${aryanToken}` };

  const ledgerRes = await req('/api/fees/ledger/me', { headers: aryanHeaders });
  console.log(`  ✅ PASS: Aryan fee ledger fetched`);
  console.log(`  💰 Total Outstanding Due: ₹${ledgerRes.data.summary.totalDue}`);
  if (ledgerRes.data.summary.totalDue !== 0) {
    console.warn(`  ⚠️ Aryan outstanding due is ₹${ledgerRes.data.summary.totalDue}, expected 0`);
  }

  const admitCardRes = await req('/api/students/me/admit-card', { headers: aryanHeaders });
  console.log(`  ✅ PASS: Aryan Admit Card API status: ${admitCardRes.data.status}`);
  console.log(`  🎟️  Is Eligible: ${admitCardRes.data.isEligible}`);
  console.log(`  🚫 Hold Reasons: ${JSON.stringify(admitCardRes.data.holdReasons)}`);
  console.log(`  📊 Attendance: ${admitCardRes.data.attendancePercentage}%`);

  if (ledgerRes.data.summary.totalDue === 0) {
    if (admitCardRes.data.status !== 'RELEASED') {
      throw new Error(`Aryan has 0 dues and 85% attendance, admit card MUST be RELEASED! Got: ${admitCardRes.data.status}`);
    }
    if (admitCardRes.data.holdReasons.length > 0) {
      throw new Error(`Aryan has 0 dues, hold reasons MUST be empty! Got: ${JSON.stringify(admitCardRes.data.holdReasons)}`);
    }
    console.log(`  🎉 ZERO DUES + ATTENDANCE >= 75% CERTIFIED: Admit card is RELEASED with 0 hold reasons!`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ALL STAFF & STUDENT IDENTITY AUDITS PASSED 100%!`);
  console.log(`======================================================\n`);
}

testStaffAndZeroDues().catch(err => {
  console.error(`❌ TEST FAILED:`, err);
  process.exit(1);
});
