// EduCore ERP Automated End-to-End Verification Test Suite
import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE_URL);

    const headers = {
      'Content-Type': 'application/json',
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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

async function runTests() {
  console.log('====================================================');
  console.log('   EduCore AI College ERP - Verification Test Suite   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Check
  console.log('▶ Test 1: System Health & Persistence Engine');
  try {
    const health = await request('GET', '/api/health');
    assert(health.status === 200, `Health check HTTP 200 (got ${health.status})`);
    assert(health.data.status === 'ok', `Service status is "ok"`);
    assert(health.data.database.toLowerCase().includes('sqlite'), `Active database engine is SQLite fallback (got ${health.data.database})`);
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. AI Intelligence Hub Status
  console.log('\n▶ Test 2: AI Status & Gemini Key Verification');
  try {
    const aiStatus = await request('GET', '/api/ai/status');
    assert(aiStatus.status === 200, `AI Status HTTP 200`);
    assert(aiStatus.data.status === 'ready', `Gemini AI service status is "ready"`);
    assert(aiStatus.data.features.includes('ai_admission_parser'), `Feature ai_admission_parser enabled`);
    assert(aiStatus.data.features.includes('ai_fee_recommendation'), `Feature ai_fee_recommendation enabled`);
  } catch (err) {
    assert(false, `AI status check failed: ${err.message}`);
  }

  // 3. Admin Authentication
  console.log('\n▶ Test 3: Role-Based Authentication (Admin Login)');
  let adminToken = null;
  try {
    const loginRes = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'password', // fallback or admin123
    });
    // Try admin123 if password failed
    let effective = loginRes;
    if (loginRes.status !== 200) {
      effective = await request('POST', '/api/auth/login', {
        username: 'admin',
        password: 'admin123',
      });
    }
    assert(effective.status === 200, `Admin login HTTP 200 (got ${effective.status})`);
    assert(effective.data.token && effective.data.user.role === 'admin', `Admin JWT generated for user "${effective.data.user?.username}"`);
    adminToken = effective.data.token;
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  // 4. AI Admission Parser
  console.log('\n▶ Test 4: AI Admission Parser with Raw Application Text');
  const sampleAppText = `
    INCOMING STUDENT ADMISSION APPLICATION
    Applicant: Siddharth Malhotra
    Email: siddharth.malhotra2026@gmail.com
    Mobile Phone: 9819283746
    Date of Birth: 2005-09-22, Gender: Male
    Father: Vikram Malhotra (Contact: 9819283700)
    Program Sought: B.Tech Computer Science and Engineering
    Academic Records: 12th Board Score 95.2% from St. Columba School
    Extracurricular: State Level Basketball, Hackathon Winner
  `;
  let parsedStudent = null;
  try {
    const parseRes = await request('POST', '/api/ai/parse-admission', { text: sampleAppText });
    assert(parseRes.status === 200, `AI Parse HTTP 200`);
    assert(parseRes.data.success === true, `Parse success is true`);
    assert(parseRes.data.data.firstName.toLowerCase() === 'siddharth', `Extracted first name: ${parseRes.data.data.firstName}`);
    assert(parseRes.data.data.lastName.toLowerCase() === 'malhotra', `Extracted last name: ${parseRes.data.data.lastName}`);
    assert(parseRes.data.data.email.includes('siddharth'), `Extracted email: ${parseRes.data.data.email}`);
    assert(parseRes.data.data.meritScore >= 90, `Computed merit score: ${parseRes.data.data.meritScore}%`);
    parsedStudent = parseRes.data.data;
  } catch (err) {
    assert(false, `AI Parse failed: ${err.message}`);
  }

  // 5. Submit Admission Application to Database
  console.log('\n▶ Test 5: Student Registration & Admission Database Insertion');
  let newStudentId = null;
  const uniqueEmail = `siddharth.${Date.now()}@gmail.com`;
  try {
    const submitRes = await request('POST', '/api/admissions/submit', {
      firstName: parsedStudent ? parsedStudent.firstName : 'Siddharth',
      lastName: parsedStudent ? parsedStudent.lastName : 'Malhotra',
      email: uniqueEmail,
      phone: parsedStudent ? parsedStudent.phone : '9819283746',
      gender: parsedStudent ? parsedStudent.gender : 'male',
      dob: parsedStudent ? parsedStudent.dob : '2005-09-22',
      guardianName: parsedStudent ? parsedStudent.guardianName : 'Vikram Malhotra',
      relationship: 'parent',
      guardianPhone: parsedStudent ? parsedStudent.guardianPhone : '9819283700',
      courseId: 'crs-btech-cs',
      admissionYear: 2025,
    });
    assert(submitRes.status === 201, `Admission submission HTTP 201`);
    assert(submitRes.data.success === true, `Submission success confirmed`);
    assert(submitRes.data.student && submitRes.data.student.student_id, `Generated Student ID: ${submitRes.data.student?.student_id}`);
    newStudentId = submitRes.data.student?.id;
  } catch (err) {
    assert(false, `Admission submission failed: ${err.message}`);
  }

  // 6. AI Fee Recommendation Engine
  console.log('\n▶ Test 6: AI Automated Fee Structure & Scholarship Assessment');
  try {
    const feeRecRes = await request('POST', '/api/ai/recommend-fee', {
      studentData: parsedStudent,
      courseId: 'crs-btech-cs',
    });
    assert(feeRecRes.status === 200, `Fee recommendation HTTP 200`);
    assert(feeRecRes.data.recommendation.baseTuition > 0, `Base Tuition identified: ₹${feeRecRes.data.recommendation.baseTuition}`);
    assert(feeRecRes.data.recommendation.concessionPercentage > 0, `AI Concession assigned: ${feeRecRes.data.recommendation.concessionPercentage}% (${feeRecRes.data.recommendation.concessionCategory})`);
    assert(feeRecRes.data.recommendation.installments.length >= 2, `Installment milestones generated: ${feeRecRes.data.recommendation.installments.length} terms`);
  } catch (err) {
    assert(false, `Fee recommendation failed: ${err.message}`);
  }

  // 7. Student Fee Ledger Verification
  console.log('\n▶ Test 7: Student Fee Ledger Inspection');
  let studentFeeId = null;
  let dueAmount = 0;
  try {
    const ledgerRes = await request('GET', `/api/fees/ledger/${newStudentId}`, null, adminToken);
    assert(ledgerRes.status === 200, `Student Ledger HTTP 200`);
    assert(ledgerRes.data.summary.totalDue > 0, `Outstanding fee ledger recorded: ₹${ledgerRes.data.summary.totalDue}`);
    dueAmount = ledgerRes.data.summary.totalDue;
    if (ledgerRes.data.ledger && ledgerRes.data.ledger.length > 0) {
      studentFeeId = ledgerRes.data.ledger[0].id;
    }
  } catch (err) {
    assert(false, `Fee ledger check failed: ${err.message}`);
  }

  // 8. Fee Payment Processing & Receipt Generation
  console.log('\n▶ Test 8: Fee Collection & Payment Receipt Generation');
  let receiptNo = null;
  try {
    const payRes = await request('POST', '/api/fees/collect', {
      studentId: newStudentId,
      amount: dueAmount || 95000,
      paymentMode: 'online_upi',
      studentFeeId: studentFeeId || undefined,
      notes: 'Semester 1 full tuition fee payment via EduCore Portal',
    }, adminToken);
    assert(payRes.status === 201 || payRes.status === 200, `Fee payment HTTP 201/200 (got ${payRes.status})`);
    assert(payRes.data.success === true, `Payment processed successfully`);
    assert(payRes.data.payment && payRes.data.payment.receipt_no, `Receipt generated: ${payRes.data.payment?.receipt_no}`);
    receiptNo = payRes.data.payment?.receipt_no;
  } catch (err) {
    assert(false, `Fee payment failed: ${err.message}`);
  }

  // 9. Verify Ledger Updated to Paid
  console.log('\n▶ Test 9: Verify Fee Ledger Balance Cleared');
  try {
    const updatedLedgerRes = await request('GET', `/api/fees/ledger/${newStudentId}`, null, adminToken);
    assert(updatedLedgerRes.data.summary.totalDue === 0, `Total Due balance updated to ₹0`);
    assert(updatedLedgerRes.data.summary.totalPaid > 0, `Total Paid updated to ₹${updatedLedgerRes.data.summary.totalPaid}`);
  } catch (err) {
    assert(false, `Ledger balance check failed: ${err.message}`);
  }

  // 10. AI Defaulter Recovery Notice Generation
  console.log('\n▶ Test 10: AI Fee Recovery Notice Generation');
  try {
    const noticeRes = await request('POST', '/api/ai/fee-notice', {
      studentId: 'stu-rec-aryan', // Default student with dues
      urgency: 'urgent',
    }, adminToken);
    assert(noticeRes.status === 200, `Notice generation HTTP 200`);
    assert(noticeRes.data.notice.subject.length > 5, `Email subject drafted: "${noticeRes.data.notice.subject}"`);
    assert(noticeRes.data.notice.emailBody.length > 50, `Email body generated (${noticeRes.data.notice.emailBody.length} chars)`);
    assert(noticeRes.data.notice.smsText.length > 10, `SMS text formatted (${noticeRes.data.notice.smsText.length} chars)`);
    assert(noticeRes.data.notice.whatsappText.length > 20, `WhatsApp notice formatted (${noticeRes.data.notice.whatsappText.length} chars)`);
  } catch (err) {
    assert(false, `Notice generation failed: ${err.message}`);
  }

  // 11. AI Campus Copilot Live Query
  console.log('\n▶ Test 11: AI Campus Copilot Natural Language Analytics');
  try {
    const copilotRes = await request('POST', '/api/ai/copilot', {
      query: 'What is the current total fee collection and what are the top financial priorities for this semester?',
    }, adminToken);
    assert(copilotRes.status === 200, `Copilot query HTTP 200`);
    assert(copilotRes.data.result.answer.length > 30, `Copilot generated contextual analysis`);
    assert(copilotRes.data.result.insights && copilotRes.data.result.insights.length > 0, `Copilot produced strategic insights: ${copilotRes.data.result.insights.length}`);
    console.log(`\nCopilot Sample Answer:\n"${copilotRes.data.result.answer.substring(0, 200)}..."\n`);
  } catch (err) {
    assert(false, `Copilot query failed: ${err.message}`);
  }

  // Final Summary
  console.log('====================================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED (Total ${passed + failed})`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
