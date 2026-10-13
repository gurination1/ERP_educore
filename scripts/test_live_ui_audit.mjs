// Live UI Puppeteer Audit Suite against EduCore ERP
import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const TARGET_URL = process.env.BASE_URL || 'http://localhost:3012';
const SCREENSHOT_DIR = path.resolve('screenshots_audit/roles');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log(`======================================================================`);
console.log(`  LIVE BROWSER UI TEST SUITE: MULTI-ROLE ERGONOMICS & ACCESS AUDIT`);
console.log(`  Target: ${TARGET_URL}`);
console.log(`  Output: ${SCREENSHOT_DIR}`);
console.log(`======================================================================\n`);

const ROLES = [
  {
    role: 'super_admin',
    label: 'Apex Super Admin (System Provost)',
    uid: '9001-01-03-01',
    password: 'super123',
    expectedRoleBadge: ['Platform Operator', 'Super Admin', 'Provost'],
    expectedNavItems: [
      'Platform Overview',
      'Tenants & Campuses',
      'Universal Access & RBAC',
      'Master Architecture',
      'Cryptographic Forensics',
      'Database & Telemetry',
    ],
    testRoute: '/user-management',
    screenshotName: '1_super_admin.png',
  },
  {
    role: 'admin',
    label: 'Campus Registrar & Provost',
    uid: '4001-01-03-01',
    password: 'admin123',
    expectedRoleBadge: ['Registrar', 'Provost', 'Dean', 'Administrator'],
    expectedNavItems: [
      'Operations Console',
      'Admissions Desk',
      'Tuition & Ledgers',
      'Student Directory',
      'Academics & Exams',
      'Faculty & HRMS',
      'Institutional Governance',
    ],
    testRoute: '/manage-students',
    screenshotName: '2_admin.png',
  },
  {
    role: 'staff',
    label: 'Faculty & Assistant Professor',
    uid: '2001-14-03-01',
    password: 'staff123',
    expectedRoleBadge: ['Professor', 'Faculty', 'Staff'],
    expectedNavItems: [
      'Faculty Desk',
      'Academics',
      'Students',
      'Examination',
      'Faculty Dossier',
      'Grievances',
    ],
    testRoute: '/academics',
    screenshotName: '3_staff.png',
  },
  {
    role: 'hod',
    label: 'Head of Department (CSE)',
    uid: '3001-01-03-01',
    password: 'hod123',
    expectedRoleBadge: ['Head of Department', 'HOD'],
    expectedNavItems: [
      'HOD Desk',
      'Academics',
      'Department Students',
      'Examination',
      'Department Faculty',
      'Academic Reports',
      'Grievances',
    ],
    testRoute: '/staff-management',
    screenshotName: '4_hod.png',
  },
  {
    role: 'counselor',
    label: 'Senior Admissions Counselor',
    uid: '6001-02-03-01',
    password: 'counselor123',
    expectedRoleBadge: ['Counselor', 'Admission'],
    expectedNavItems: [
      'Counselor Desk',
      'Admissions CRM',
      'Enrolled Scholars',
      'Fees & Scholarships',
      'Grievances',
    ],
    testRoute: '/enquiries',
    screenshotName: '5_counselor.png',
  },
  {
    role: 'accounts',
    label: 'Chief Accounts Officer / Bursar',
    uid: '5001-05-03-01',
    password: 'accounts123',
    expectedRoleBadge: ['Accounts', 'Bursar', 'Finance'],
    expectedNavItems: [
      'Collections Home',
      'Fee Ledger & Registers',
      'Student Directory',
      'Exam Clearance',
      'Financial Reports',
    ],
    testRoute: '/fees',
    screenshotName: '6_accounts.png',
  },
  {
    role: 'student',
    label: 'Undergraduate Scholar (Aryan)',
    uid: '1001-88-03-01',
    password: 'student123',
    expectedRoleBadge: ['Scholar', 'Student'],
    expectedNavItems: [
      'Scholar Home',
      'Attendance & Classes',
      'Tuition & Dues',
      'Admit Card & Exams',
      'Syllabus & LMS',
      'Compliance & Help',
    ],
    testRoute: '/examination',
    screenshotName: '7_student.png',
  },
  {
    role: 'partner',
    label: 'Corporate Hiring Partner (Infosys)',
    uid: '7001-01-03-01',
    password: 'partner123',
    expectedRoleBadge: ['Partner', 'Corporate', 'Hiring'],
    expectedNavItems: [
      'Placements Home',
      'Campus Talent Pool',
      'Placement Drives',
    ],
    testRoute: '/partner-portal',
    screenshotName: '8_partner.png',
  },
  {
    role: 'hr',
    label: 'Chief HR & Establishment Officer',
    uid: '8001-01-03-01',
    password: 'hr123',
    expectedRoleBadge: ['Chief HR', 'Establishment', 'Officer', 'HR'],
    expectedNavItems: [
      'HRMS Overview',
      'Faculty & Staff Roster',
      'Status & Lifecycle',
      'Payroll & Deductions',
      'Exit NOC & Clearances',
      'Staff Dossier & Docs',
      'Grievances',
    ],
    testRoute: '/staff-management',
    screenshotName: '9_hr.png',
  },
];

let spawnedServer = null;

async function ensureServer() {
  try {
    const res = await fetch(`${TARGET_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      console.log(`[INFO] Server already responsive at ${TARGET_URL}`);
      return;
    }
  } catch (_) {
    // server unreachable
  }

  if (TARGET_URL.includes('localhost') || TARGET_URL.includes('127.0.0.1')) {
    const url = new URL(TARGET_URL);
    const port = url.port || '3012';
    const serverScript = path.resolve('dist/server.cjs');
    if (!fs.existsSync(serverScript)) {
      throw new Error(`dist/server.cjs does not exist at ${serverScript}. Run build first.`);
    }

    console.log(`[LAUNCH] Spawning local server on port ${port}...`);
    spawnedServer = spawn(process.execPath, [serverScript], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: port, NODE_ENV: 'production' },
      stdio: 'pipe',
    });

    spawnedServer.stdout.on('data', d => {
      const msg = d.toString().trim();
      if (msg) console.log(`  [server] ${msg}`);
    });
    spawnedServer.stderr.on('data', d => {
      const msg = d.toString().trim();
      if (msg) console.error(`  [server err] ${msg}`);
    });

    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${TARGET_URL}/api/health`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) {
          console.log(`[READY] Local server is healthy on ${TARGET_URL}\n`);
          return;
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error(`Timeout waiting for local server at ${TARGET_URL}`);
  }
}

async function runLiveUITest() {
  await ensureServer();

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  let passedAssertions = 0;
  let failedAssertions = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS]: ${message}`);
      passedAssertions++;
    } else {
      console.error(`  ❌ [FAIL]: ${message}`);
      failedAssertions++;
    }
  }

  try {
    for (const roleDef of ROLES) {
      console.log(`\n----------------------------------------------------------------------`);
      console.log(`  TESTING ROLE: [${roleDef.role.toUpperCase()}] - ${roleDef.label}`);
      console.log(`----------------------------------------------------------------------`);

      try {
        // 1. Navigate to target URL and guarantee completely fresh session
        await page.goto(`${TARGET_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.evaluate(() => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (_) {}
        });
        await page.goto(`${TARGET_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Check if we are on login screen
        await page.waitForSelector('#login-username-input', { timeout: 15000 });

        // 2. Fill login credentials
        await page.evaluate(() => {
          const u = document.querySelector('#login-username-input');
          const p = document.querySelector('#login-password-input');
          if (u) u.value = '';
          if (p) p.value = '';
        });
        await page.type('#login-username-input', roleDef.uid);
        await page.type('#login-password-input', roleDef.password);

        // 3. Submit form
        await page.click('button[type="submit"]');
        await page.waitForSelector('header', { timeout: 25000 });
        await new Promise(r => setTimeout(r, 1200));

        // 4. Inspect Header Elements in live DOM
        const headerInfo = await page.evaluate(() => {
          const header = document.querySelector('header');
          if (!header) return null;

          // Role title badge
          const badge = Array.from(header.querySelectorAll('span')).find(s =>
            s.className.includes('bg-amber-400') || s.className.includes('text-amber-300')
          );

          // Canonical UID button text
          const uidBtn = Array.from(header.querySelectorAll('button')).find(b =>
            b.textContent.includes('UID')
          );

          // Ribbon Navigation buttons
          const navButtons = Array.from(header.querySelectorAll('nav button span.whitespace-nowrap')).map(s => s.textContent.trim());

          // Full Header text content
          const greetingText = header.innerText;

          return {
            roleBadge: badge ? badge.textContent.trim() : '',
            uidText: uidBtn ? uidBtn.textContent.trim() : '',
            navItems: navButtons,
            fullHeader: greetingText,
          };
        });

        assert(Boolean(headerInfo), `Header rendered for ${roleDef.role}`);
        assert(
          headerInfo.uidText.includes(roleDef.uid) || headerInfo.fullHeader.includes(roleDef.uid),
          `Enterprise UID [${roleDef.uid}] verified in Header pill`
        );
        const badgeMatched = Array.isArray(roleDef.expectedRoleBadge)
          ? roleDef.expectedRoleBadge.some(kw => headerInfo.fullHeader.toLowerCase().includes(kw.toLowerCase()))
          : headerInfo.fullHeader.includes(roleDef.expectedRoleBadge);
        assert(
          badgeMatched,
          `Institutional role title badge verified for ${roleDef.role}`
        );

        // Verify each expected navigation item is present in the ribbon
        for (const expectedNav of roleDef.expectedNavItems) {
          const exists = headerInfo.navItems.includes(expectedNav) || headerInfo.fullHeader.includes(expectedNav);
          assert(exists, `Navigation ribbon contains authorized tab: "${expectedNav}"`);
        }

        // Verify no leaked privileged modules for student/partner
        if (roleDef.role === 'student' || roleDef.role === 'partner') {
          const leakedGov = headerInfo.navItems.some(n => n.toLowerCase().includes('governance'));
          const leakedCrm = headerInfo.navItems.some(n =>
            n.toLowerCase().includes('admissions desk') ||
            n.toLowerCase().includes('crm') ||
            n.toLowerCase().includes('leads radar')
          );
          assert(!leakedGov, `Privileged tab "Governance" correctly HIDDEN from ${roleDef.role}`);
          assert(!leakedCrm, `Privileged tab "Admissions CRM" correctly HIDDEN from ${roleDef.role}`);
        }

        // 5. Capture Dashboard Screenshot
        const ssPath = path.join(SCREENSHOT_DIR, roleDef.screenshotName);
        await page.screenshot({ path: ssPath, fullPage: false });
        console.log(`  📸 Screenshot saved: ${ssPath}`);

        // 6. Test direct authorized sub-route
        if (roleDef.testRoute) {
          await page.goto(`${TARGET_URL}${roleDef.testRoute}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await new Promise(r => setTimeout(r, 1500));
          const currentUrl = page.url();
          assert(currentUrl.includes(roleDef.testRoute) || currentUrl.includes('dashboard'), `Navigated to authorized view: ${roleDef.testRoute}`);
          const subSsPath = path.join(SCREENSHOT_DIR, `${roleDef.role}_subview.png`);
          await page.screenshot({ path: subSsPath, fullPage: false });
          console.log(`  📸 Sub-view Screenshot saved: ${subSsPath}`);
        }

        // 7. Clean Sign Out & Session Storage
        await page.evaluate(() => {
          try {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out'));
            if (btn) btn.click();
            localStorage.clear();
            sessionStorage.clear();
          } catch (_) {}
        });
        await new Promise(r => setTimeout(r, 1200));

      } catch (err) {
        assert(false, `Browser UI testing failed for ${roleDef.role}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
    if (spawnedServer) {
      console.log(`[TEARDOWN] Stopping spawned test server...`);
      spawnedServer.kill();
    }
  }

  console.log(`\n======================================================================`);
  console.log(`  LIVE BROWSER UI TEST COMPLETED: Passed: ${passedAssertions} | Failed: ${failedAssertions}`);
  console.log(`======================================================================`);

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLiveUITest().catch(err => {
  console.error('Fatal browser test failure:', err);
  if (spawnedServer) {
    spawnedServer.kill();
  }
  process.exit(1);
});
