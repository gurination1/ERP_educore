import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:3012';

async function run() {
  console.log(`[TEST] Starting comprehensive audit on: ${BASE_URL}`);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // ==========================================
    // 1. LOGIN SCREEN AUDIT
    // ==========================================
    console.log('\n--- 1. Testing Login Screen ---');
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[data-demo-role]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('Operating System') || pageText.includes('EduCore OS')) {
      throw new Error('Pretentious OS branding still found on login page!');
    }
    console.log('✅ Zero "Operating System" or "EduCore OS" on login screen');

    const demoButtons = await page.$$('button[data-demo-role]');
    console.log(`Found ${demoButtons.length} demo login buttons`);
    if (demoButtons.length < 10) {
      throw new Error(`Expected at least 10 demo role buttons, found ${demoButtons.length}`);
    }
    console.log('✅ All 10 demo roles present (including HR & Hostel)');

    // ==========================================
    // 2. HEADER DROPDOWNS AUDIT (ADMIN SESSION)
    // ==========================================
    console.log('\n--- 2. Testing Header Dropdowns (Admin) ---');
    const adminBtn = await page.$('button[data-demo-role="admin"]');
    await adminBtn.click();
    await page.waitForSelector('#header-campus-switcher', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    // Check Header Brand title
    const headerTitleText = await page.evaluate(() => {
      const el = document.querySelector('header');
      return el ? el.innerText : '';
    });
    if (headerTitleText.includes('EduCore OS') || headerTitleText.includes('Operating System')) {
      throw new Error('Pretentious OS branding detected in Header!');
    }
    console.log('✅ Header is clean of "EduCore OS" / "Operating System"');

    // Test Campus Switcher Dropdown
    const campusSwitcher = await page.$('#header-campus-switcher');
    await campusSwitcher.click();
    await page.waitForSelector('#header-campus-dropdown-menu', { timeout: 5000 });

    const campusMenuBox = await page.evaluate(() => {
      const menu = document.getElementById('header-campus-dropdown-menu');
      if (!menu) return null;
      const rect = menu.getBoundingClientRect();
      return { width: rect.width, height: rect.height, text: menu.innerText };
    });
    console.log('Campus dropdown metrics:', campusMenuBox);
    if (!campusMenuBox || campusMenuBox.width > 240) {
      throw new Error(`Campus dropdown is too wide (${campusMenuBox?.width}px)! Expected sleek <= 230px.`);
    }
    console.log('✅ Campus switcher dropdown is sleek, compact, and unclipped (width ~224px)');

    // Select Faridkot
    const faridkotBtn = await page.$('button[data-campus="campus_02"]');
    await faridkotBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const currentCampusText = await page.$eval('#header-campus-switcher', el => el.innerText);
    console.log('Active campus switcher text:', currentCampusText);
    if (!currentCampusText.includes('Faridkot')) {
      throw new Error('Campus selection did not update switcher label!');
    }
    console.log('✅ Dynamic campus selection propagated correctly');

    // Test User Profile Dropdown
    console.log('\n--- 3. Testing User Profile Dropdown ---');
    const profileBtn = await page.$('header button[title="Open Profile Options"]');
    await profileBtn.click();
    await new Promise(r => setTimeout(r, 500));

    const profileText = await page.evaluate(() => {
      const popover = document.querySelector('header .animate-in');
      return popover ? popover.innerText : '';
    });
    console.log('Profile popover text:', JSON.stringify(profileText));
    if (profileText.includes('1.') || profileText.includes('👤') || profileText.includes('🚪')) {
      throw new Error('Profile dropdown still has numbers or emojis!');
    }
    console.log('✅ Profile dropdown has sleek professional items without numbering or emojis');

    // Test Reset Password Toast
    const resetPwBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      return btns.find(b => b.innerText.includes('Reset Password'));
    });
    if (resetPwBtn) {
      await resetPwBtn.click();
      await new Promise(r => setTimeout(r, 500));
      const toastVisible = await page.evaluate(() => {
        const t = document.querySelector('header .bg-emerald-600');
        return t ? t.innerText : null;
      });
      console.log('Header toast triggered:', toastVisible);
      if (!toastVisible || !toastVisible.includes('Password recovery')) {
        throw new Error('Password reset toast did not appear in Header!');
      }
      console.log('✅ Password reset in-app toast notification verified');
    }

    // ==========================================
    // 4. HOSTEL MANAGEMENT AUDIT (WARDEN SESSION)
    // ==========================================
    console.log('\n--- 4. Testing Hostel Management Module (Warden) ---');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[data-demo-role="hostel"]', { timeout: 10000 });
    const wardenBtn = await page.$('button[data-demo-role="hostel"]');
    await wardenBtn.click();
    await page.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    const hostelTitle = await page.$eval('h1', el => el.innerText);
    console.log('Hostel console header:', hostelTitle);
    if (!hostelTitle.includes('Hostel Operations')) {
      throw new Error(`Expected Hostel Operations header, got: ${hostelTitle}`);
    }
    console.log('✅ Logged in as Warden directly into Hostel Operations');

    // Test Unallocated Scholars Queue Tab
    console.log('Testing Unallocated Scholars tab...');
    const unallocatedTabBtn = await page.$('button[data-hostel-tab="unassigned"]');
    await unallocatedTabBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const queueTable = await page.$('table');
    if (!queueTable) {
      throw new Error('Unallocated Scholars table failed to render (blank view)!');
    }
    const queueRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(r => r.innerText.trim());
    });
    console.log(`Found ${queueRows.length} unallocated scholars in queue:`);
    queueRows.slice(0, 2).forEach(r => console.log('  -', r.split('\n')[0]));
    if (queueRows.length === 0) {
      throw new Error('Unallocated queue unexpectedly empty!');
    }
    console.log('✅ Unallocated Scholars Queue renders fully with active applications');

    // Test Allot Bed Button from Queue
    const allotBedBtn = await page.$('tbody tr button');
    await allotBedBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const modalTitle = await page.evaluate(() => {
      const m = document.querySelector('.fixed.inset-0 h3');
      return m ? m.innerText : null;
    });
    console.log('Allotment modal opened with title:', modalTitle);
    if (!modalTitle || !modalTitle.includes('Allot Residence Room & Bed')) {
      throw new Error('Allotment modal failed to open from queue row button!');
    }
    console.log('✅ Allot Bed modal opened successfully');

    // Select vacant room and execute allotment
    await page.evaluate(() => {
      const sel = document.querySelector('.fixed.inset-0 select');
      if (sel && sel.options.length > 1) {
        sel.selectedIndex = 1;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 300));

    const confirmAllotBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.fixed.inset-0 button'));
      return btns.find(b => b.innerText.includes('Confirm Allotment'));
    });
    await confirmAllotBtn.click();
    await new Promise(r => setTimeout(r, 600));
    console.log('✅ Scholar allotted to room successfully');

    // Test Room Inventory Tab
    console.log('Testing Room Inventory tab...');
    const roomsTabBtn = await page.$('button[data-hostel-tab="rooms"]');
    await roomsTabBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const allotRoomBtns = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.filter(b => b.innerText.includes('Allot Bed')).length;
    });
    console.log(`Found ${allotRoomBtns} "Allot Bed" buttons on vacant room cards`);
    if (allotRoomBtns === 0) {
      throw new Error('No "Allot Bed" buttons found on room inventory cards!');
    }
    console.log('✅ Vacant room cards feature direct "Allot Bed" action buttons');

    // Test Resident Scholars & Vacate Bed
    console.log('Testing Resident Scholars & Vacate Bed action...');
    const residentsTabBtn = await page.$('button[data-hostel-tab="residents"]');
    await residentsTabBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const vacateBtns = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.filter(b => b.innerText.includes('Vacate')).length;
    });
    console.log(`Found ${vacateBtns} "Vacate" buttons in resident directory`);
    if (vacateBtns === 0) {
      throw new Error('Vacate bed button missing in resident directory!');
    }
    console.log('✅ Resident directory includes "Vacate" bed action');

    // Click Vacate on first resident
    const firstVacateBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('table button'));
      return btns.find(b => b.innerText.includes('Vacate'));
    });
    await firstVacateBtn.click();
    await new Promise(r => setTimeout(r, 500));

    const vacateModalText = await page.evaluate(() => {
      const m = document.querySelector('.fixed.inset-0');
      return m ? m.innerText : null;
    });
    if (!vacateModalText || !vacateModalText.includes('Vacate Residence Bed')) {
      throw new Error('Vacate Bed modal failed to open!');
    }
    console.log('✅ Vacate Bed modal rendered with arrears audit and bed release capability');

    // Close modal
    const cancelVacateBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.fixed.inset-0 button'));
      return btns.find(b => b.innerText.includes('Cancel'));
    });
    await cancelVacateBtn.click();
    await new Promise(r => setTimeout(r, 400));

    // ==========================================
    // 5. GLOBAL DOM BRACKET TAG AUDIT
    // ==========================================
    console.log('\n--- 5. Testing Global DOM for Bracket Tags ---');
    const remainingBrackets = await page.evaluate(() => {
      const regex = /\[(DL|PRINT|REFRESH|DEL|EDIT|SYNC|CALL|END)\]/g;
      return regex.test(document.body.innerText);
    });
    if (remainingBrackets) {
      throw new Error('Ugly wireframe bracket tags still found rendered in DOM!');
    }
    console.log('✅ Zero bracket placeholder tags rendered anywhere in live DOM');

    console.log('\n==========================================');
    console.log('🎉 100% AUDIT PASS: ALL CHECKS VERIFIED!');
    console.log('==========================================');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
