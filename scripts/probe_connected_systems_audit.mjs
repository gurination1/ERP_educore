import express from 'express';
import { db } from '../server/db.ts';
import { authRouter } from '../server/routes/authRoutes.ts';
import { studentRouter } from '../server/routes/studentRoutes.ts';
import { documentRouter } from '../server/routes/documentRoutes.ts';
import { quizRouter } from '../server/routes/quizRoutes.ts';
import { academicTopologyRouter } from '../server/routes/academicTopologyRoutes.ts';
import { examRouter } from '../server/routes/examRoutes.ts';
import { feeRouter } from '../server/routes/feeRoutes.ts';
import { enquiryRouter } from '../server/routes/enquiryRoutes.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runAudit() {
  console.log('=== EDUCORE CONNECTED DATA & LOGIC AUDIT ===');
  await db.initialize();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/documents', documentRouter);
  app.use('/api/quizzes', quizRouter);
  app.use('/api/academics', academicTopologyRouter);
  app.use('/api/examination', examRouter);
  app.use('/api/fees', feeRouter);
  app.use('/api/enquiries', enquiryRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Authenticate Admin and Student
    console.log('\n--- 1. Authenticating Test Users ---');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    }).then(r => r.json());
    assert(adminLoginRes.success && adminLoginRes.token, 'Admin login returns valid JWT token');
    const adminToken = adminLoginRes.token;

    const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'aryan', password: 'student123' })
    }).then(r => r.json());
    assert(studentLoginRes.success && studentLoginRes.token, 'Student Aryan login returns valid JWT token');
    const studentToken = studentLoginRes.token;

    // 2. Document Compliance Vault
    console.log('\n--- 2. Document Compliance Vault & Verification ---');
    const docsRes = await fetch(`${baseUrl}/api/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(docsRes.success && docsRes.count >= 6, `Fetched ${docsRes.count} documents from repository`);

    // Upload a new 10th marksheet for student Aryan
    const uploadRes = await fetch(`${baseUrl}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        doc_type_code: 'DOC_10TH',
        title: 'CBSE 10th Attested Marksheet Audit',
        file_name: 'cbse_10th_audit_attested.pdf',
        file_size_kb: 1540,
        remarks: 'Uploaded by student Aryan Sharma for clearance',
      })
    }).then(r => r.json());
    assert(uploadRes.success && uploadRes.document?.id, 'Student uploaded document to repository');
    const uploadedDocId = uploadRes.document.id;

    // Verify document as Admin
    const verifyRes = await fetch(`${baseUrl}/api/documents/${uploadedDocId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'verified',
        remarks: 'Physical stamp verified by Registrar Office',
        verified_by: 'Dr. Ramesh Chandra (Registrar)'
      })
    }).then(r => r.json());
    assert(verifyRes.success && verifyRes.document?.status === 'verified', 'Admin verified document record in repository');

    // Verify that student Aryan tenth_doc_verified is now true
    const studentProfileRes = await fetch(`${baseUrl}/api/students/usr-stu-aryan`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(studentProfileRes.success && studentProfileRes.student?.tenth_doc_verified === true,
      'Student profile tenth_doc_verified flag automatically synchronized in database');

    // 3. CBT Examination & LMS Quiz Engine
    console.log('\n--- 3. CBT Examination & LMS Quiz Engine ---');
    const quizzesRes = await fetch(`${baseUrl}/api/quizzes`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    }).then(r => r.json());
    assert(quizzesRes.success && quizzesRes.count >= 2, `Retrieved ${quizzesRes.count} online examination quizzes`);

    const targetQuiz = quizzesRes.quizzes[0];
    const answers = {
      q1: 1, // correct
      q2: 2, // correct
      q3: 1, // correct
      q4: 1, // correct
      q5: 2, // correct
      q6: 0, // correct
    };
    const submitQuizRes = await fetch(`${baseUrl}/api/quizzes/${targetQuiz.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        selectedAnswers: answers,
        timeTakenSeconds: 320,
      })
    }).then(r => r.json());
    assert(submitQuizRes.success && submitQuizRes.result?.score === 30 && submitQuizRes.result?.passed === true,
      `Quiz submitted & scored: ${submitQuizRes.result?.score}/${submitQuizRes.result?.totalMarks} (${submitQuizRes.result?.percentage}%, PASSED)`);

    const submissionsRes = await fetch(`${baseUrl}/api/quizzes/submissions?quizId=${targetQuiz.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(submissionsRes.success && submissionsRes.count >= 1, 'Faculty/Admin can inspect student quiz submission log');

    // 4. LMS Resources
    console.log('\n--- 4. Digital Courseware & Study Materials ---');
    const resourcesRes = await fetch(`${baseUrl}/api/quizzes/resources`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    }).then(r => r.json());
    assert(resourcesRes.success && resourcesRes.count >= 4, `LMS lecture handouts listed: ${resourcesRes.count} items`);

    // 5. Internal Sessional Marks
    console.log('\n--- 5. Internal Sessional Marks Storage & Sync ---');
    const saveMarksRes = await fetch(`${baseUrl}/api/academics/sessional-marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        marks: [
          {
            studentId: 'stu-rec-aryan',
            studentName: 'Aryan Sharma',
            courseCode: 'BTCS-401-18',
            semester: 4,
            mst1: 23,
            mst2: 22,
            assignment: 12,
          },
          {
            studentId: 'stu-rec-priya',
            studentName: 'Priya Patel',
            courseCode: 'BTCS-401-18',
            semester: 4,
            mst1: 21,
            mst2: 20,
            assignment: 11,
          }
        ]
      })
    }).then(r => r.json());
    assert(saveMarksRes.success && saveMarksRes.result?.count === 2, 'Faculty saved sessional marks into database');

    const fetchMarksRes = await fetch(`${baseUrl}/api/academics/sessional-marks?courseCode=BTCS-401-18`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(fetchMarksRes.success && fetchMarksRes.marks.length >= 2,
      `Retrieved persisted sessional marks from DB for ${fetchMarksRes.marks.length} students`);
    const aryanMarks = fetchMarksRes.marks.find(m => m.studentId === 'stu-rec-aryan');
    assert(aryanMarks && aryanMarks.mst1 === 23 && aryanMarks.assignment === 12,
      'Aryan Sharma MST-1=23 and Assignment=12 verified accurately from database');

    // 6. University CBCS Examination Results Gazette
    console.log('\n--- 6. University CBCS Grade Cards & Results Gazette ---');
    const resultsRes = await fetch(`${baseUrl}/api/examination/results/stu-rec-aryan`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    }).then(r => r.json());
    assert(resultsRes.success && resultsRes.resultGazette?.sgpa > 0,
      `Results gazette generated for ${resultsRes.resultGazette?.studentName}: SGPA ${resultsRes.resultGazette?.sgpa}, CGPA ${resultsRes.resultGazette?.cgpa}`);
    assert(resultsRes.resultGazette?.grades?.length >= 6,
      `Grade card contains ${resultsRes.resultGazette?.grades?.length} accredited university courses`);

    // 7. Fee Defaulters Dynamic Reporting
    console.log('\n--- 7. Dynamic Fee Defaulters Reporting ---');
    const defaultersRes = await fetch(`${baseUrl}/api/fees/defaulters`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(defaultersRes.success && defaultersRes.defaulters?.length >= 1,
      `Dynamic defaulters query returned ${defaultersRes.defaulters?.length} overdue students with live balances`);

    // 8. Locked Attendance Registers in Database
    console.log('\n--- 8. Locked Attendance Registers in Database ---');
    const lockedRegListRes = await fetch(`${baseUrl}/api/students/attendance/registers?courseCode=CS-401`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(lockedRegListRes.success && Array.isArray(lockedRegListRes.registers),
      'Retrieved locked attendance registers from database');

    const bulkLockRes = await fetch(`${baseUrl}/api/students/attendance/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseCode: 'CS-401',
        lectureDate: '2026-10-13',
        lectureSlot: 'Period 3',
        topic: 'Distributed Transactions & 2PC Protocol',
        updates: [
          { studentId: 'stu-rec-aryan', status: 'P', attendedClasses: 143, totalClasses: 161, attendancePercentage: 89 },
          { studentId: 'stu-rec-priya', status: 'P', attendedClasses: 139, totalClasses: 161, attendancePercentage: 86 },
        ]
      })
    }).then(r => r.json());
    assert(bulkLockRes.success && bulkLockRes.lockedRegister?.registerKey === 'CS-401_2026-10-13_Period 3',
      'Faculty locked attendance register persisted directly into database');

    const checkSavedRegRes = await fetch(`${baseUrl}/api/students/attendance/registers?courseCode=CS-401`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    const foundLocked = checkSavedRegRes.registers?.find(r => r.registerKey === 'CS-401_2026-10-13_Period 3');
    assert(foundLocked && foundLocked.topic === 'Distributed Transactions & 2PC Protocol',
      'Persistent register retrieved with matching topic & slot from database');

    // 9. Telephony Integration Configuration Sync
    console.log('\n--- 9. Telephony Integration Configuration Sync ---');
    const dialerGetRes = await fetch(`${baseUrl}/api/enquiries/dialer/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(dialerGetRes.success && dialerGetRes.settings?.provider === 'exotel',
      'Administrator retrieved cloud telephony settings from database');

    const dialerUpdateRes = await fetch(`${baseUrl}/api/enquiries/dialer/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ is_enabled: true, provider: 'exotel' })
    }).then(r => r.json());
    assert(dialerUpdateRes.success && dialerUpdateRes.settings?.is_enabled === true,
      'Telephony dialer configuration toggle synchronized across database');

    console.log('\n============================================');
    console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('============================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
