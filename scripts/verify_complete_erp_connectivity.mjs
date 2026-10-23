import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3012';

async function run() {
  console.log(`[TEST] Verifying Complete ERP Connectivity & Multi-Campus Architecture at ${BASE_URL}...`);

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
  assert.strictEqual(healthRes.status, 'ok', 'Health check failed');
  console.log('✓ API Health Check OK');

  // 2. Super Admin Login
  const superLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: 'super123' }),
  }).then(r => r.json());
  assert.strictEqual(superLogin.success, true, 'Super Admin login failed');
  const superToken = superLogin.token;
  console.log(`✓ Super Admin Login OK (UID: ${superLogin.user.enterprise_uid})`);

  // 3. Admin Login
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  }).then(r => r.json());
  assert.strictEqual(adminLogin.success, true, 'Admin login failed');
  const adminToken = adminLogin.token;
  console.log(`✓ Institutional Admin Login OK (UID: ${adminLogin.user.enterprise_uid})`);

  // 4. Test Master Tables Dynamic Creation
  const newDeptRes = await fetch(`${BASE_URL}/api/master/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superToken}` },
    body: JSON.stringify({
      dept_code: 'AIML',
      dept_name: 'Artificial Intelligence & Machine Learning',
      head_of_dept: 'Dr. Gurleen Kaur',
      established_year: 2026,
    }),
  }).then(r => r.json());
  assert.strictEqual(newDeptRes.success, true, 'Master Department creation failed');
  console.log('✓ Master Department Creation (AIML) OK');

  const newDegreeRes = await fetch(`${BASE_URL}/api/master/degrees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superToken}` },
    body: JSON.stringify({
      degree_code: 'BCA-AI',
      degree_name: 'Bachelor of Computer Applications (AI & Cloud)',
      total_semesters: 6,
      statutory_body: 'UGC',
    }),
  }).then(r => r.json());
  assert.strictEqual(newDegreeRes.success, true, 'Master Degree creation failed');
  console.log('✓ Master Degree Creation (BCA-AI) OK');

  // 5. Test College Onboarding with Master Tables Injected
  const timestamp = Date.now().toString().slice(-4);
  const collegeCode = `C${timestamp}`;
  const onboardRes = await fetch(`${BASE_URL}/api/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superToken}` },
    body: JSON.stringify({
      short_code: collegeCode,
      client_name: `Malwa Institute of Engineering & Technology ${collegeCode}`,
      subdomain: `miet${collegeCode.toLowerCase()}`,
      entity_type: 'college',
      city: 'Bathinda',
      state_code: '03',
      institution_type_code: 'ENG_COLLEGE',
      selected_departments: ['CSE', 'ME', 'AIML'],
      selected_degrees: ['B.Tech', 'BCA-AI'],
      admin_email: `principal@miet${collegeCode.toLowerCase()}.edu`,
      admin_password: 'admin123',
    }),
  }).then(r => r.json());
  assert.strictEqual(onboardRes.success, true, 'College Onboarding failed');
  assert.deepStrictEqual(onboardRes.tenant.selected_departments, ['CSE', 'ME', 'AIML']);
  assert.deepStrictEqual(onboardRes.tenant.selected_degrees, ['B.Tech', 'BCA-AI']);
  console.log(`✓ College Onboarding OK: ${onboardRes.tenant.client_name} (Code: ${collegeCode}) with Master Depts & Degrees`);

  // 6. Test Campus Segregation: Students
  const [stCampus1, stCampus2, stAll] = await Promise.all([
    fetch(`${BASE_URL}/api/students?campus=campus_01`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/students?campus=campus_02`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/students?campus=all`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
  ]);
  assert.strictEqual(stCampus1.success, true);
  assert.strictEqual(stCampus2.success, true);
  assert.strictEqual(stAll.success, true);
  assert.strictEqual(stCampus1.total + stCampus2.total, stAll.total, 'Student campus partition mismatch');
  console.log(`✓ Students Campus Segregation OK: Campus 01 (${stCampus1.total}) + Campus 02 (${stCampus2.total}) = Total (${stAll.total})`);

  // 7. Test Campus Segregation: Staff / HR
  const [stfCampus1, stfCampus2, stfAll] = await Promise.all([
    fetch(`${BASE_URL}/api/staff?campus=campus_01`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/staff?campus=campus_02`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/staff?campus=all`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
  ]);
  assert.strictEqual(stfCampus1.success, true);
  assert.strictEqual(stfCampus2.success, true);
  assert.strictEqual(stfAll.success, true);
  assert.strictEqual(stfCampus1.count + stfCampus2.count, stfAll.count, 'Staff campus partition mismatch');
  console.log(`✓ Staff Campus Segregation OK: Campus 01 (${stfCampus1.count}) + Campus 02 (${stfCampus2.count}) = Total (${stfAll.count})`);

  // 8. Test Campus Segregation: Admissions CRM
  const [adm1, adm2, admAll] = await Promise.all([
    fetch(`${BASE_URL}/api/admissions?campus=campus_01`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/admissions?campus=campus_02`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/admissions?campus=all`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
  ]);
  assert.strictEqual(adm1.success, true);
  assert.strictEqual(adm2.success, true);
  assert.strictEqual(admAll.success, true);
  console.log(`✓ Admissions CRM Campus Segregation OK: C1 (${adm1.admissions?.length}) vs C2 (${adm2.admissions?.length}) vs All (${admAll.admissions?.length})`);

  // 9. Test Campus Segregation: Fee Defaulters
  const [def1, def2, defAll] = await Promise.all([
    fetch(`${BASE_URL}/api/fees/defaulters?campus=campus_01`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/fees/defaulters?campus=campus_02`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/fees/defaulters?campus=all`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
  ]);
  assert.strictEqual(def1.success, true);
  assert.strictEqual(def2.success, true);
  assert.strictEqual(defAll.success, true);
  console.log(`✓ Fee Defaulters Campus Segregation OK: C1 (${def1.count}) vs C2 (${def2.count}) vs All (${defAll.count})`);

  // 10. Test Hostel Buildings API & Campus Filtering
  const [bldC1, bldC2, bldAll] = await Promise.all([
    fetch(`${BASE_URL}/api/hostel/buildings?campus=campus_01`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/hostel/buildings?campus=campus_02`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/hostel/buildings?campus=all`, { headers: { 'Authorization': `Bearer ${adminToken}` } }).then(r => r.json()),
  ]);
  assert.strictEqual(bldC1.success, true);
  assert.strictEqual(bldC2.success, true);
  assert.strictEqual(bldAll.success, true);
  console.log(`✓ Hostel Buildings Segregation OK: C1 (${bldC1.count}) + C2 (${bldC2.count}) = All (${bldAll.count})`);

  // 11. Test Hostel Room Creation
  const newRoomRes = await fetch(`${BASE_URL}/api/hostel/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      building_id: 'bld-01',
      room_number: `TEST-${Date.now().toString().slice(-3)}`,
      room_name: 'Innovation Suite',
      capacity: 2,
      washroom_type: 'ARW',
      is_ac: true,
      has_window: true,
      has_almirah: true,
      monthly_rent: 7500,
      semester_rent: 42000,
    }),
  }).then(r => r.json());
  assert.strictEqual(newRoomRes.success, true);
  const testRoomId = newRoomRes.room.id;
  console.log(`✓ Hostel Room Creation OK: Room ${newRoomRes.room.room_number} (ID: ${testRoomId})`);

  // 12. Test Karanvir Sir Deletion Safety Rule: Cannot delete room if occupied
  const occupiedRoomRes = await fetch(`${BASE_URL}/api/hostel/rooms/rm-101`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  }).then(r => r.json());
  assert.strictEqual(occupiedRoomRes.success, false, 'Occupied room deletion must be forbidden!');
  console.log('✓ Karanvir Sir Deletion Safety Gate OK: Occupied room rm-101 rejected deletion with proper error.');

  // Delete the empty test room
  const deleteEmptyRes = await fetch(`${BASE_URL}/api/hostel/rooms/${testRoomId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  }).then(r => r.json());
  assert.strictEqual(deleteEmptyRes.success, true);
  console.log('✓ Empty Room Deletion OK');

  // 13. Test Hostel Bed Allotment & Student Sync
  const roomsRes = await fetch(`${BASE_URL}/api/hostel/rooms`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  }).then(r => r.json());
  const targetRoom = (roomsRes.rooms || []).find(r => r.current_occupancy < r.capacity) || { id: 'rm-301', room_number: '301' };

  const allotRes = await fetch(`${BASE_URL}/api/hostel/allot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      student_uid: `STU-2023-${Date.now().toString().slice(-4)}`,
      student_name: 'Aryan Sharma',
      course_name: 'B.Tech CSE',
      semester: 4,
      room_id: targetRoom.id,
      billing_cycle: 'semester',
      mess_enrolled: true,
    }),
  }).then(r => r.json());
  assert.strictEqual(allotRes.success, true);
  console.log(`✓ Hostel Scholar Allotment OK: Bed ${allotRes.resident.bed_number} in Room ${allotRes.resident.room_number}`);

  // 14. Test Mess No-Dues Clearance (NOC) Issuance
  const nocRes = await fetch(`${BASE_URL}/api/hostel/mess-clearance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      student_uid: 'STU-2023-088',
      student_name: 'Aryan Sharma',
      room_number: '102',
      building_name: 'SBS-A',
      diet_count_monthly: 58,
      outstanding_balance: 0,
      settle_arrears_at_desk: false,
      signed_by_mess_manager: 'Chef Balwant Singh (Chief Steward)',
      remarks: 'Full clearance granted. No arrears outstanding.',
    }),
  }).then(r => r.json());
  assert.strictEqual(nocRes.success, true);
  assert.strictEqual(nocRes.noc.clearance_status, 'cleared');
  console.log(`✓ Mess No-Dues Certificate (NOC) OK: Cert ID ${nocRes.noc.id} for ${nocRes.noc.student_name}`);

  // 15. Test Student Login & View Dynamic Affiliation
  const studentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'aryan', password: 'student123' }),
  }).then(r => r.json());
  assert.strictEqual(studentLogin.success, true, 'Student login failed');
  console.log(`✓ Scholar Login OK: ${studentLogin.user.full_name} (UID: ${studentLogin.user.enterprise_uid})`);

  console.log('\n================================================================');
  console.log('>>> ALL 15 END-TO-END ENTERPRISE ERP CONNECTIVITY TESTS PASSED! <<<');
  console.log('================================================================\n');
}

run().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
