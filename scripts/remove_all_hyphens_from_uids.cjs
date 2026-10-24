const fs = require('fs');
const initSqlJs = require('sql.js');

async function migrate(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`File not found: ${dbPath}`);
    return;
  }
  console.log(`\nMigrating database at: ${dbPath}`);
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  // 1. Remove hyphens from users.enterprise_uid
  db.run("UPDATE users SET enterprise_uid = REPLACE(enterprise_uid, '-', '') WHERE enterprise_uid LIKE '%-%';");
  console.log('✅ Stripped hyphens from users.enterprise_uid');

  // 2. Remove hyphens from students.student_id
  db.run("UPDATE students SET student_id = REPLACE(student_id, '-', '') WHERE student_id LIKE '%-%';");
  console.log('✅ Stripped hyphens from students.student_id');

  // 3. Update master_user_types description examples
  try {
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-01-0001', '10126010001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-02-0014', '10126020014');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-03-0001', '10126030001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-04-0001', '10126040001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-05-0001', '10126050001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-06-0001', '10126060001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-07-0001', '10126070001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-08-0001', '10126080001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-09-0001', '10126090001');");
    db.run("UPDATE master_user_types SET description = REPLACE(description, '1-01-26-10-0001', '10126100001');");
    console.log('✅ Updated master_user_types description formats');
  } catch (e) {
    console.log('master_user_types not present in seed db, skipping table');
  }

  // Verify
  const sampleUsers = db.exec("SELECT username, enterprise_uid, role FROM users LIMIT 10;");
  console.log('Sample Users after migration:', JSON.stringify(sampleUsers[0].values));

  const sampleStudents = db.exec("SELECT student_id, first_name, last_name FROM students LIMIT 5;");
  console.log('Sample Students after migration:', JSON.stringify(sampleStudents[0].values));

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log(`Saved migrated database to: ${dbPath}`);
}

async function run() {
  await migrate('/root/college-erp-educore/database/educore.sqlite');
  await migrate('/root/college-erp-educore/database/educore-seed.sqlite');
  console.log('\n🎉 ALL HYPHENS REMOVED FROM DATABASES SUCCESSFULLY!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
