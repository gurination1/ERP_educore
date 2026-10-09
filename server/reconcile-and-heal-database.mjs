// Database Reconciliation, Integrity Healing & Math Audit Script
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

async function healDatabase() {
  console.log('='.repeat(70));
  console.log('  EDUCORE DATABASE RECONCILIATION & INTEGRITY HEALING');
  console.log('='.repeat(70) + '\n');

  const SQL = await initSqlJs();
  const dbPath = path.join(process.cwd(), 'database', 'educore.sqlite');
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // 1. Clean Orphaned Records
  console.log('[1/4] Scanning and cleaning orphaned relational records...');
  
  // 1.1 Orphaned student fees
  db.run(`
    DELETE FROM student_fees 
    WHERE student_id NOT IN (SELECT id FROM students) 
      AND student_id NOT IN (SELECT student_id FROM students);
  `);
  console.log('  -> Removed orphaned student_fees.');

  // 1.2 Orphaned payments
  db.run(`
    DELETE FROM payments 
    WHERE student_id NOT IN (SELECT id FROM students) 
      AND student_id NOT IN (SELECT student_id FROM students);
  `);
  console.log('  -> Removed orphaned payments.');

  // 2. Reconcile Fee Ledger Math & Discrepancies
  console.log('\n[2/4] Reconciling fee ledger mathematics and invariants...');
  const feesRes = db.exec(`SELECT id, student_id, amount, paid_amount, due_amount, discount_amount, status FROM student_fees;`);
  const feeRows = feesRes[0]?.values || [];

  let healedFeesCount = 0;
  for (const row of feeRows) {
    const [id, studentId, rawAmount, rawPaid, rawDue, rawDiscount, rawStatus] = row;
    const amount = Number(rawAmount) || 0;
    const paid = Number(rawPaid) || 0;
    let discount = Number(rawDiscount) || 0;

    // Cap discount so it cannot exceed (amount - paid)
    if (discount > amount) {
      discount = 0; // If discount exceeds full tuition, it was an erroneous scholarship value recorded as concession
    }
    if (paid + discount > amount) {
      discount = Math.max(0, amount - paid);
    }

    const correctDue = Math.max(0, amount - paid - discount);
    let correctStatus = 'due';
    if (correctDue <= 0.01) {
      correctStatus = 'paid';
    } else if (paid > 0) {
      correctStatus = 'partial';
    }

    // Check if discrepancy existed
    if (
      Math.abs(correctDue - (Number(rawDue) || 0)) > 0.01 ||
      Math.abs(discount - (Number(rawDiscount) || 0)) > 0.01 ||
      correctStatus !== rawStatus
    ) {
      db.run(
        `UPDATE student_fees SET due_amount = ?, discount_amount = ?, status = ? WHERE id = ?;`,
        [correctDue, discount, correctStatus, id]
      );
      healedFeesCount++;
    }
  }
  console.log(`  -> Reconciled ${healedFeesCount} fee ledger mathematical discrepancies.`);

  // 3. Normalize Enterprise UIDs to Canonical Pure-Digit Format
  console.log('\n[3/4] Normalizing all user enterprise UIDs to canonical 10-digit format...');
  const typeMap = {
    student: '1001',
    staff: '2001',
    hod: '3001',
    admin: '4001',
    accounts: '5001',
    counselor: '6001',
    partner: '7001',
    super_admin: '9001',
  };

  const usersRes = db.exec(`SELECT id, username, role, enterprise_uid FROM users;`);
  const users = usersRes[0]?.values || [];
  const uidRegex = /^[1-9]001-[0-9]{2}-[0-9]{2}-[0-9]{2}$/;

  let normalizedUidCount = 0;
  users.forEach((u, idx) => {
    const [id, username, role, currentUid] = u;
    if (!currentUid || !uidRegex.test(currentUid)) {
      const prefix = typeMap[role] || '1001';
      // Deterministic serial from row index or id digits
      const serialDigits = (idx + 1).toString().padStart(2, '0').slice(-2);
      const newUid = `${prefix}-${serialDigits}-03-01`;
      db.run(`UPDATE users SET enterprise_uid = ? WHERE id = ?;`, [newUid, id]);
      normalizedUidCount++;
    }
  });
  console.log(`  -> Normalized ${normalizedUidCount} non-standard UIDs to canonical pure-digit format.`);

  // 4. Save Changes to Disk
  console.log('\n[4/4] Persisting healed database buffer to disk...');
  const data = db.export();
  const nodeBuf = Buffer.from(data);
  fs.writeFileSync(dbPath, nodeBuf);
  console.log(`  -> Saved ${nodeBuf.length} bytes to ${dbPath}`);

  // Also verify again
  const remainingDiscrepancies = db.exec(`
    SELECT COUNT(*) FROM student_fees 
    WHERE ABS(amount - (paid_amount + due_amount + COALESCE(discount_amount, 0))) > 0.01;
  `);
  console.log(`\n  Verification: Remaining mathematical discrepancies: ${remainingDiscrepancies[0]?.values[0][0]}`);

  const remainingOrphans = db.exec(`
    SELECT COUNT(*) FROM student_fees sf 
    LEFT JOIN students s ON sf.student_id = s.id OR sf.student_id = s.student_id
    WHERE s.id IS NULL;
  `);
  console.log(`  Verification: Remaining orphaned fees: ${remainingOrphans[0]?.values[0][0]}`);

  db.close();
  console.log('\n🌟 DATABASE HEALING & RECONCILIATION COMPLETE.');
}

healDatabase().catch(console.error);
