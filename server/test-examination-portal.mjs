import fetch from 'node-fetch';
import { spawn } from 'child_process';

const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('======================================================================');
  console.log('   EDUCORE ERP UNIVERSITY EXAMINATION PORTAL TEST SUITE               ');
  console.log('   Auditing: Meta, Regular Forms, Reappear Backlogs, Admit Cards,     ');
  console.log('             Gate Clearance Engine, Datesheets, CBCS Results          ');
  console.log('======================================================================\n');

  console.log(`🚀 Spawning test server on port ${PORT}...`);
  const server = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  // Wait for health
  let healthy = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch (e) {}
    await sleep(500);
  }

  if (!healthy) {
    console.error('❌ Test server failed to start on port', PORT);
    server.kill();
    process.exit(1);
  }
  console.log(`⚡ Server active on ${BASE}\n`);

  try {
    // 1. Authenticate as Admin
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '4001-01-03-01',
        password: 'admin123',
        role: 'admin',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      console.error('❌ Failed to login as Admin:', loginData);
      process.exit(1);
    }
    const token = loginData.token;
    console.log('✅ [PASS] Admin authenticated successfully via Enterprise UID 4001-01-03-01');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 2. Test Examination Meta
    const metaRes = await fetch(`${BASE}/api/examination/meta`, { headers });
    const metaData = await metaRes.json();
    if (metaData.success && metaData.meta.universities.length === 3) {
      console.log('✅ [PASS] Examination Meta loaded with 3 tripartite universities (MRSPTU, PUP, PU)');
    } else {
      console.error('❌ Meta failed:', metaData);
      process.exit(1);
    }

    // 3. Test Eligible Students List
    const studentsRes = await fetch(`${BASE}/api/examination/students`, { headers });
    const studentsData = await studentsRes.json();
    if (studentsData.success && studentsData.students.length > 0) {
      console.log(`✅ [PASS] Examination student roster retrieved: ${studentsData.students.length} students found`);
    } else {
      console.error('❌ Students failed:', studentsData);
      process.exit(1);
    }

    // 4. Test Student Profile & Gate Clearance
    const profRes = await fetch(`${BASE}/api/examination/student-profile/stu-rec-aryan`, { headers });
    const profData = await profRes.json();
    if (profData.success && profData.student.full_name.includes('Aryan')) {
      console.log('✅ [PASS] Aryan Sharma examination profile loaded successfully');
      console.log(`         Clearance status: ${profData.clearance.status} (Attendance: ${profData.clearance.attendancePercentage}%)`);
    } else {
      console.error('❌ Profile failed:', profData);
      process.exit(1);
    }

    // 5. Test Submit Regular Form
    const regFormRes = await fetch(`${BASE}/api/examination/regular-form`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        studentId: 'stu-rec-aryan',
        semester: 4,
        selectedPapers: ['CS-401', 'CS-402', 'CS-403', 'CS-404', 'CS-405'],
        centerAllotted: 'Center 104 (BFGI Main Campus)',
      }),
    });
    const regFormData = await regFormRes.json();
    if (regFormData.success && regFormData.record.id.startsWith('EXAM-REG-')) {
      console.log(`✅ [PASS] Regular examination form registered: Ref ${regFormData.record.id}`);
    } else {
      console.error('❌ Regular form submission failed:', regFormData);
      process.exit(1);
    }

    // 6. Test Submit Reappear Form
    const reapFormRes = await fetch(`${BASE}/api/examination/reappear-form`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        studentId: 'stu-rec-aryan',
        semester: 4,
        selectedPapers: ['CS-102', 'CS-203'],
        paymentMode: 'online_upi',
      }),
    });
    const reapFormData = await reapFormRes.json();
    if (reapFormData.success && reapFormData.record.totalFeePaid === 1400) {
      console.log(`✅ [PASS] Reappear form registered: 2 papers, Total Fee ₹1,400 (Ref ${reapFormData.record.id})`);
    } else {
      console.error('❌ Reappear form submission failed:', reapFormData);
      process.exit(1);
    }

    // 7. Test Attendance Condonation Action on Aarav Sharma (blocked attendance)
    const condoneRes = await fetch(`${BASE}/api/examination/condone-attendance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        studentId: 'stu-rec-aarav',
        reason: 'Medical Grounds verified by Dean Office under Ordinance 7.4',
      }),
    });
    const condoneData = await condoneRes.json();
    if (condoneData.success) {
      console.log('✅ [PASS] Dean Attendance Condonation granted for Aarav Sharma');
    } else {
      console.error('❌ Condonation failed:', condoneData);
      process.exit(1);
    }

    // 8. Test Instant Fee Clearance Simulation
    const clearFeeRes = await fetch(`${BASE}/api/examination/clear-fee-dues`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ studentId: 'stu-rec-aarav' }),
    });
    const clearFeeData = await clearFeeRes.json();
    if (clearFeeData.success) {
      console.log('✅ [PASS] Fee clearance simulation succeeded for Aarav Sharma');
    } else {
      console.error('❌ Fee clearance failed:', clearFeeData);
      process.exit(1);
    }

    // 9. Test Datesheets Archive with Multi-University Filters
    const dsRes = await fetch(`${BASE}/api/examination/datesheets?university=MRSPTU&course=B.Tech+CS&semester=4`, { headers });
    const dsData = await dsRes.json();
    if (dsData.success && dsData.datesheets.length >= 5) {
      console.log(`✅ [PASS] Official MRSPTU datesheet retrieved: ${dsData.datesheets.length} papers scheduled`);
    } else {
      console.error('❌ Datesheets failed:', dsData);
      process.exit(1);
    }

    // 10. Test Official Admit Card Generation
    const cardRes = await fetch(`${BASE}/api/examination/admit-card/stu-rec-aryan`, { headers });
    const cardData = await cardRes.json();
    if (cardData.success && cardData.admitCard.candidateName.includes('Aryan')) {
      console.log(`✅ [PASS] Official Tripartite Admit Card generated for Aryan Sharma (Roll: ${cardData.admitCard.rollNumber})`);
      console.log(`         Center: ${cardData.admitCard.centerCode} • Schedule count: ${cardData.admitCard.schedule.length}`);
    } else {
      console.error('❌ Admit card failed:', cardData);
      process.exit(1);
    }

    // 11. Test CBCS Semester Grade Card Results
    const resRes = await fetch(`${BASE}/api/examination/results/stu-rec-aryan`, { headers });
    const resData = await resRes.json();
    if (resData.success && resData.resultGazette.sgpa > 0) {
      console.log(`✅ [PASS] CBCS Result Gazette verified: SGPA ${resData.resultGazette.sgpa} / 10.0 (Status: ${resData.resultGazette.resultStatus})`);
    } else {
      console.error('❌ Results failed:', resData);
      process.exit(1);
    }

    console.log('\n======================================================================');
    console.log('  EXAMINATION PORTAL API VERIFICATION: ALL 11 TESTS PASSED (100%)    ');
    console.log('======================================================================\n');
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
