// Test Script for Staff / Faculty Portal, RBAC Separation, Reports CSV Export, and Academic Operations
import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'https://educore-erp-production.up.railway.app';

console.log(`[TEST] Targeting: ${BASE_URL}\n`);

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Authenticate Staff (Prof. Sunita Rao)
  console.log('--- 1. Staff Authentication & Profile Verification ---');
  let staffToken = '';
  let staffUser = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'staff123' }),
    });
    const data = await res.json();
    assert(data.success === true, 'Staff login succeeded with username "staff"');
    assert(data.user?.role === 'staff', `Staff role is "staff" (got: ${data.user?.role})`);
    assert(data.user?.full_name?.includes('Sunita Rao'), `Staff name is Prof. Sunita Rao (got: ${data.user?.full_name})`);
    staffToken = data.token;
    staffUser = data.user;
  } catch (err) {
    assert(false, `Staff login failed: ${err.message}`);
  }

  // 2. Authenticate Admin (Dr. Ramesh Chandra)
  console.log('\n--- 2. Admin Authentication & Role Separation ---');
  let adminToken = '';
  let adminUser = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const data = await res.json();
    assert(data.success === true, 'Admin login succeeded with username "admin"');
    assert(data.user?.role === 'admin', `Admin role is "admin" (got: ${data.user?.role})`);
    assert(data.user?.full_name?.includes('Ramesh Chandra'), `Admin name is Dr. Ramesh Chandra (got: ${data.user?.full_name})`);
    adminToken = data.token;
    adminUser = data.user;
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  // 3. Authenticate Student (Aryan Sharma)
  console.log('\n--- 3. Student Authentication (Aryan Sharma) ---');
  let studentToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'aryan', password: 'student123' }),
    });
    const data = await res.json();
    assert(data.success === true, 'Student login succeeded with username "aryan"');
    assert(data.user?.role === 'student', `Student role is "student" (got: ${data.user?.role})`);
    studentToken = data.token;
  } catch (err) {
    assert(false, `Student login failed: ${err.message}`);
  }

  // 4. Test Staff Updating Lecture Attendance
  console.log('\n--- 4. Staff Lecture Attendance Marking ---');
  try {
    // Fetch students list using staff token
    const studentsRes = await fetch(`${BASE_URL}/api/students?limit=5`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const studentsData = await studentsRes.json();
    assert(studentsData.success === true, 'Staff can fetch student master list');
    const testStudent = studentsData.students?.[0];
    assert(Boolean(testStudent), `Target test student found: ${testStudent?.student_id} (${testStudent?.first_name})`);

    if (testStudent) {
      const currentAttended = testStudent.attended_classes || 0;
      const currentTotal = testStudent.total_classes || 0;
      const updateRes = await fetch(`${BASE_URL}/api/students/${testStudent.id}/attendance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          attendedClasses: currentAttended + 1,
          totalClasses: currentTotal + 1,
        }),
      });
      const updateData = await updateRes.json();
      assert(updateData.success === true, `Staff successfully recorded lecture attendance for ${testStudent.student_id}`);
      assert(updateData.student?.attended_classes === currentAttended + 1, 'Attended classes incremented correctly');
    }

    // RBAC check: Ensure Student CANNOT update attendance
    const forbiddenRes = await fetch(`${BASE_URL}/api/students/${testStudent?.id}/attendance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ attendedClasses: 99, totalClasses: 100 }),
    });
    assert(forbiddenRes.status === 403, `Security check: Student blocked from updating attendance (Status ${forbiddenRes.status})`);
  } catch (err) {
    assert(false, `Attendance test failed: ${err.message}`);
  }

  // 5. Test Reports CSV Export with Query Token
  console.log('\n--- 5. Reports CSV Export with Query Token ---');
  try {
    // 5a. With query token (simulating direct browser anchor download)
    const exportRes = await fetch(`${BASE_URL}/api/reports/export-students-csv?token=${staffToken}`);
    assert(exportRes.status === 200, `CSV export with ?token= query parameter succeeded (Status ${exportRes.status})`);
    const contentType = exportRes.headers.get('content-type') || '';
    assert(contentType.includes('text/csv'), `Content-Type is text/csv (got: ${contentType})`);
    const csvBody = await exportRes.text();
    assert(csvBody.includes('Student ID') && csvBody.includes('First Name'), 'CSV header row verified');
    assert(csvBody.includes('STU-'), 'CSV contains active student records');

    // 5b. Without token (ensure unauthenticated requests are rejected)
    const unauthRes = await fetch(`${BASE_URL}/api/reports/export-students-csv`);
    assert(unauthRes.status === 401, `Security check: Unauthenticated CSV request rejected (Status ${unauthRes.status})`);
  } catch (err) {
    assert(false, `CSV export test failed: ${err.message}`);
  }

  // 6. Test Course Admissions Report
  console.log('\n--- 6. Course Admissions & Enrollment Distribution Report ---');
  try {
    const reportRes = await fetch(`${BASE_URL}/api/reports/admissions-by-course`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const reportData = await reportRes.json();
    assert(reportData.success === true, 'Staff fetched admissions-by-course analytical report');
    assert(Array.isArray(reportData.distribution) && reportData.distribution.length > 0, `Report contains ${reportData.distribution?.length} courses`);
    const csCourse = reportData.distribution.find(c => c.courseCode === 'B.Tech' || c.courseCode === 'B.Tech CS' || c.department.includes('Computer'));
    assert(Boolean(csCourse), `Found CS course entry in report (${csCourse?.courseName || csCourse?.courseCode})`);
  } catch (err) {
    assert(false, `Admissions report test failed: ${err.message}`);
  }

  // 7. Test Staff Access to Dynamic Forms
  console.log('\n--- 7. Staff Access to Dynamic Forms ---');
  try {
    const newForm = {
      title: `Faculty Course Feedback Survey ${Date.now().toString().slice(-4)}`,
      description: 'Mid-term curriculum evaluation by Prof. Sunita Rao',
      form_code: `FEEDBACK-${Date.now().toString().slice(-4)}`,
      schema_json: [
        { name: 'coursePace', label: 'Lecture Delivery Pace', type: 'select', required: true, options: ['Fast', 'Optimal', 'Slow'] },
        { name: 'comments', label: 'Suggestions for Improvement', type: 'textarea', required: false },
      ],
    };

    const createFormRes = await fetch(`${BASE_URL}/api/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify(newForm),
    });
    const createFormData = await createFormRes.json();
    assert(createFormData.success === true, `Staff successfully published dynamic form: "${newForm.title}"`);
    assert(Boolean(createFormData.form?.id), `Created form ID: ${createFormData.form?.id}`);
  } catch (err) {
    assert(false, `Dynamic form test failed: ${err.message}`);
  }

  // Summary
  console.log('\n========================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
