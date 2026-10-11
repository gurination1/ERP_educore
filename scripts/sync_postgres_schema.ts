import { db } from '../server/db.ts';

async function main() {
  console.log('[SYNC] Starting PostgreSQL initialization and schema synchronization...');
  await db.initialize();
  console.log(`[SYNC] Completed! Active mode: ${db.mode}`);
  
  // Verify payment gateways
  const gateways = await db.getPaymentGateways();
  console.log(`[SYNC] Payment gateways count: ${gateways.length}`);

  // Verify field permissions
  const fieldPerms = await db.getFieldPermissions('student');
  console.log(`[SYNC] Student field permissions count: ${fieldPerms.length}`);

  // Verify staff additional roles
  const staffRoles = await db.getStaffAdditionalRoles('usr-staff-01');
  console.log(`[SYNC] Staff additional roles count: ${staffRoles.length}`);

  // Verify subjects take_attendance
  const subjects = await db.getSubjects();
  console.log(`[SYNC] Subjects count: ${subjects.length}`);
  const fc = subjects.find((s: any) => s.subject_code?.startsWith('FC_'));
  console.log('[SYNC] Free period subject:', fc);

  console.log('[SYNC] All PostgreSQL synchronizations successful!');
  process.exit(0);
}

main().catch(err => {
  console.error('[SYNC ERROR]:', err);
  process.exit(1);
});
