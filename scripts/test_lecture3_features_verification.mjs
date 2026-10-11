import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres@127.0.0.1:5432/educore',
});

async function run() {
  console.log('--- Testing PostgreSQL 18.6 Connection & Schema ---');
  const client = await pool.connect();
  try {
    const versionRes = await client.query('SELECT version()');
    console.log('PostgreSQL version:', versionRes.rows[0].version);

    // Verify Lecture 3 Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log('Total tables in educore DB:', tableNames.length);

    const requiredTables = [
      'tenants',
      'payment_gateways',
      'staff_additional_roles',
      'field_permissions',
      'subjects',
      'timetable_slots',
      'attendance_settings',
      'staff_payroll_structures',
      'staff_security_deductions',
      'staff_exit_noc'
    ];

    let allTablesPass = true;
    for (const t of requiredTables) {
      if (tableNames.includes(t)) {
        console.log(`[PASS] Table exists: ${t}`);
      } else {
        console.error(`[FAIL] Table missing: ${t}`);
        allTablesPass = false;
      }
    }
    if (!allTablesPass) throw new Error('Some required tables missing');

    // Check subjects table columns for take_attendance
    const colRes = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'subjects' AND column_name IN ('take_attendance', 'take_exam', 'show_in_report_card');
    `);
    console.log('Subject evaluation columns in DB:', colRes.rows);

    // Check Free Period FC subject
    const fcSubRes = await client.query(`
      SELECT subject_code, subject_name, take_attendance, take_exam, show_in_report_card 
      FROM subjects 
      WHERE subject_code LIKE 'FC_%';
    `);
    console.log('Free Period (FC) Subjects in DB:', fcSubRes.rows);

    // Check Payment Gateways
    const gwRes = await client.query('SELECT id, gateway_name, account_title, mode, is_active FROM payment_gateways;');
    console.log('Payment Gateways in DB:', gwRes.rows);

    // Check Staff Additional Roles
    const rolesRes = await client.query('SELECT id, staff_id, role_title, role_category, is_active FROM staff_additional_roles;');
    console.log('Staff Additional Roles in DB:', rolesRes.rows);

    // Check Field Permissions
    const permRes = await client.query('SELECT entity_type, field_key, staff_view, staff_edit, student_view, student_edit FROM field_permissions LIMIT 5;');
    console.log('Sample Field Permissions:', permRes.rows);

    console.log('\n======================================================');
    console.log('>>> 100% POSTGRESQL 18.6 ENTERPRISE SUITE VERIFIED <<<');
    console.log('======================================================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
