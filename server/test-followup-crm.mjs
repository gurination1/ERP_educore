// EduCore College ERP - Admissions Prospect CRM & Follow-Up Radar Verification Suite
import http from 'http';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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

async function runFollowupCRMSuite() {
  console.log('======================================================================');
  console.log('  EduCore ERP: Admissions Prospect CRM & Recall Radar Test Suite     ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Check health
  console.log(`[1] Verifying server health on PORT=${PORT}...`);
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.status === 200, 'EduCore server is healthy and running');

  // 2. Authenticate as Admin
  console.log('\n[2] Authenticating as Administrator...');
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin@educore.edu',
    password: 'admin123',
    role: 'admin',
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Admin login successful and JWT issued');
  const adminToken = loginRes.data.token;

  // 3. Test GET /api/admissions/followups radar endpoint
  console.log('\n[3] Testing GET /api/admissions/followups (Recall Radar)...');
  const radarRes = await request('GET', '/api/admissions/followups', null, adminToken);
  assert(radarRes.status === 200, 'GET /api/admissions/followups returns 200 OK');
  assert(radarRes.data.success === true, 'Response reports success: true');
  assert(radarRes.data.stats !== undefined, 'Stats object present');
  assert(typeof radarRes.data.stats.p1_high_priority === 'number', 'p1_high_priority counter is numeric', `val: ${radarRes.data.stats.p1_high_priority}`);
  assert(typeof radarRes.data.stats.overdue === 'number', 'overdue counter is numeric');
  assert(typeof radarRes.data.stats.due_today === 'number', 'due_today counter is numeric');
  assert(Array.isArray(radarRes.data.prospects), 'Prospects leads queue is an array');

  // 4. Test Step 1 Progressive Intake (Campus Visit Walk-in)
  console.log('\n[4] Testing Step 1 Progressive Intake (Campus Visit Walk-in)...');
  const uniqueSuffix = Date.now().toString().slice(-6);
  const walkinLead = {
    intakeStep: 1,
    firstName: 'Gurinder',
    lastName: 'Gill',
    email: `gurinder.gill.${uniqueSuffix}@punjab.in`,
    phone: `9814${uniqueSuffix}`,
    courseId: 'crs-btech-cse',
    city: 'Amritsar',
    district: 'Amritsar',
    state: 'Punjab',
    remarks: 'Walk-in campus counseling inquiry. Interested in AI & Robotics specialization.',
  };

  const step1Res = await request('POST', '/api/admissions/progressive-intake', walkinLead, adminToken);
  assert(step1Res.status === 201 || step1Res.status === 200, 'Step 1 progressive intake created (HTTP 201/200)', `status ${step1Res.status}`);
  assert(step1Res.data.student !== undefined, 'Created student object returned');
  const createdStudent = step1Res.data.student;
  assert(createdStudent.intake_step === 1, 'Intake step recorded as 1');
  assert(createdStudent.followup_priority === 'p1_high', 'Walk-in lead auto-classified as P1 High priority');
  assert(createdStudent.followup_status === 'pending', 'Follow-up status set to pending');
  assert(Boolean(createdStudent.next_followup_date), `Next follow-up date auto-scheduled: ${createdStudent.next_followup_date}`);

  // 5. Verify Radar Reflects New Lead
  console.log('\n[5] Verifying Lead Queue & Urgency sorting...');
  const radarRes2 = await request('GET', '/api/admissions/followups', null, adminToken);
  const foundProspect = radarRes2.data.prospects.find(p => p.student.id === createdStudent.id);
  assert(Boolean(foundProspect), 'New walk-in lead present in prospect queue');
  assert(foundProspect?.student?.followup_priority === 'p1_high', 'Lead tagged P1 High in queue');

  // 6. Test Logging Follow-Up Call Interaction
  console.log('\n[6] Testing POST /api/admissions/:id/followups (Log Call Interaction)...');
  const callbackDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const logCallPayload = {
    interaction_type: 'call',
    outcome: 'contacted',
    notes: 'Spoke with candidate and father. Discussed tuition fees, Punjab domicile quota 85%, and campus bus route from Amritsar. Scheduled callback.',
    next_followup_date: callbackDate,
    priority: 'p1_high',
  };
  const logCallRes = await request('POST', `/api/admissions/${createdStudent.id}/followups`, logCallPayload, adminToken);
  assert(logCallRes.status === 201, 'Log call returned 201 Created');
  assert(logCallRes.data.followup !== undefined, 'Follow-up record created');
  assert(logCallRes.data.followup.interaction_type === 'call', 'Interaction type recorded as call');
  assert(logCallRes.data.followup.outcome === 'contacted', 'Outcome recorded as contacted');
  assert(logCallRes.data.student.next_followup_date === callbackDate, `Student next callback date updated to ${callbackDate}`);

  // 7. Test GET /api/admissions/:id/followups (Interaction Timeline Audit)
  console.log('\n[7] Testing GET /api/admissions/:id/followups (Timeline Audit)...');
  const timelineRes = await request('GET', `/api/admissions/${createdStudent.id}/followups`, null, adminToken);
  assert(timelineRes.status === 200, 'Timeline audit returned 200 OK');
  assert(Array.isArray(timelineRes.data.followups), 'Followups timeline is an array');
  assert(timelineRes.data.followups.length >= 1, 'Contains at least 1 interaction record');
  assert(timelineRes.data.followups[0].notes.includes('Punjab domicile quota'), 'Timeline notes accurately retrieved');

  // 8. Test POST /api/admissions/:id/quick-ping (Internal SMS Recall Notice)
  console.log('\n[8] Testing POST /api/admissions/:id/quick-ping (Internal SMS Recall Dispatch)...');
  const pingRes = await request('POST', `/api/admissions/${createdStudent.id}/quick-ping`, {}, adminToken);
  assert(pingRes.status === 200, 'Quick-ping returned 200 OK');
  assert(pingRes.data.success === true, 'Quick-ping success: true');
  assert(pingRes.data.notice_text.includes('EduCore Admissions Notice'), 'SMS notice text generated correctly');
  assert(pingRes.data.followup.interaction_type === 'sms', 'Interaction logged as internal sms');

  // 9. Verify NO WhatsApp references exist in returned payloads
  console.log('\n[9] Verifying NO WhatsApp references in follow-up CRM responses...');
  const serializedPing = JSON.stringify(pingRes.data).toLowerCase();
  const serializedRadar = JSON.stringify(radarRes2.data).toLowerCase();
  assert(!serializedPing.includes('whatsapp') && !serializedPing.includes('wa.me'), 'Zero WhatsApp leakage in quick-ping response');
  assert(!serializedRadar.includes('wa.me'), 'Zero wa.me leakage in radar response');

  // 10. Test Progressive Intake Step 3 Auto-Converts Lead
  console.log('\n[10] Testing Progressive Intake Step 3 (Lead Conversion to Enrolled)...');
  // Complete step 2
  await request('POST', '/api/admissions/progressive-intake', {
    intakeStep: 2,
    studentId: createdStudent.id,
    fatherName: 'Harpreet Gill',
    motherName: 'Jaswinder Kaur',
    category: 'General',
    quota: 'punjab_85',
    residentialMode: 'Day Scholar (Self)',
  }, adminToken);

  // Complete Step 3 with token fee
  const step3Res = await request('POST', '/api/admissions/progressive-intake', {
    intakeStep: 3,
    id: createdStudent.id,
    studentId: createdStudent.id,
    aadhaarNo: '987654321098',
    tenthPercentage: 88.5,
    twelfthPercentage: 86.2,
    boardName: 'PSEB Mohali',
    tokenFeeAmount: 5000,
    tokenFeeMode: 'cash',
    remarks: 'Token fee paid at admission desk.',
  }, adminToken);

  assert(step3Res.status === 200, 'Step 3 admission completion returned 200 OK', JSON.stringify(step3Res.data || step3Res.raw));
  assert(step3Res.data?.student?.followup_status === 'converted', 'Student follow-up status auto-updated to "converted"');
  assert(step3Res.data?.student?.admission_status === 'approved', 'Admission status approved');

  console.log('\n======================================================================');
  console.log(`  SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFollowupCRMSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
