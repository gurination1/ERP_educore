import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

async function migrate() {
  const dbPath = path.join(process.cwd(), 'database', 'educore.sqlite');
  const seedPath = path.join(process.cwd(), 'database', 'educore-seed.sqlite');

  console.log('[Migration] Starting canonical 12-digit student UID migration...');

  const SQL = await initSqlJs();

  for (const file of [dbPath, seedPath]) {
    if (!fs.existsSync(file)) {
      console.log(`[Migration] File not found: ${file}, skipping.`);
      continue;
    }

    console.log(`[Migration] Migrating database: ${file}...`);
    const fileBuffer = fs.readFileSync(file);
    const db = new SQL.Database(fileBuffer);

    // 1. Ensure enterprise_uid column exists
    try {
      db.run(`ALTER TABLE users ADD COLUMN enterprise_uid TEXT;`);
    } catch (e) {
      // Column might already exist, ignore
    }

    // 1. Update Aryan Sharma UID in users table
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-01-0001' 
      WHERE username = 'aryan' OR id = 'usr-stu-aryan'
    `);

    // 2. Update other demo students
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-02-0002' 
      WHERE username = 'rohan' OR id = 'usr-stu-rohan'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-05-0003' 
      WHERE username = 'priya' OR id = 'usr-stu-priya'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-01-0004' 
      WHERE username = 'aarav' OR id = 'usr-stu-aarav'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-07-0005' 
      WHERE username = 'neha' OR id = 'usr-stu-neha'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-01-0006' 
      WHERE username = 'stu001' OR id = 'usr-stu-001'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-05-0007' 
      WHERE username = 'stu002' OR id = 'usr-stu-002'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-01-0008' 
      WHERE username = 'stu003' OR id = 'usr-stu-003'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-02-0009' 
      WHERE username = 'stu004' OR id = 'usr-stu-004'
    `);
    db.run(`
      UPDATE users 
      SET enterprise_uid = '1-01-26-07-0010' 
      WHERE username = 'stu005' OR id = 'usr-stu-005'
    `);

    // Check if hostel_residents table exists and update
    try {
      db.run(`
        UPDATE hostel_residents 
        SET student_uid = '1-01-26-01-0001' 
        WHERE student_name LIKE '%Aryan%' OR student_uid = '1001-88-03-01'
      `);
      db.run(`
        UPDATE hostel_residents 
        SET student_uid = '1-01-26-02-0002' 
        WHERE student_name LIKE '%Gurpreet%' OR student_uid = '1001-01-02-03-01'
      `);
      db.run(`
        UPDATE hostel_residents 
        SET student_uid = '1-01-26-08-0003' 
        WHERE student_name LIKE '%Navjot%' OR student_uid = '1001-01-03-03-01'
      `);
      db.run(`
        UPDATE hostel_residents 
        SET student_uid = '1-01-26-01-0004' 
        WHERE student_name LIKE '%Simranjit%' OR student_uid = '1001-01-04-03-01'
      `);
    } catch (e) {
      console.log(`[Migration] hostel_residents table note: ${e.message}`);
    }

    // Save modified database back to disk
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(file, buffer);
    db.close();
    console.log(`[Migration] Successfully migrated: ${file}`);
  }

  console.log('[Migration] Completed 12-digit Student UID migration.');
}

migrate().catch(console.error);
