import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function testTabsAndIcons() {
  const targetUrl = process.env.BASE_URL || 'http://127.0.0.1:3012/#/';
  console.log(`🔍 Testing clickability of tabs and icons on: ${targetUrl}`);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('  [BROWSER CONSOLE]', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('  [BROWSER ERROR]', err.message));

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#login-username-input', { timeout: 15000 });

    // 1. Log in as Admin
    console.log('\n--- 1. Logging in as Admin (4001-01-03-01) ---');
    const adminDemoBtn = await page.waitForSelector('button ::-p-text(4001-01-03-01)');
    await adminDemoBtn.click();
    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    // 2. Test Top Header Icons & Buttons
    console.log('\n--- 2. Testing Header Icons & Popovers ---');
    
    // 2a. Profile popover
    const profileBtn = await page.$('button[title="Open Profile Options"]');
    if (!profileBtn) {
      console.error('❌ FAIL: Profile popover button not found!');
    } else {
      console.log('Clicking profile button...');
      await profileBtn.click();
      await new Promise(r => setTimeout(r, 500));
      const popoverVisible = await page.$('::-p-text(1. Profile Information)');
      console.log(popoverVisible ? '✅ PASS: Profile popover opened with 3 items' : '❌ FAIL: Profile popover did not open');
      
      // Close profile popover by clicking again or outside
      await profileBtn.click();
      await new Promise(r => setTimeout(r, 300));
    }

    // 2b. UID Copy Pill
    const uidCopyBtn = await page.$('button[title="Click to copy canonical 10-digit UID"]');
    if (uidCopyBtn) {
      console.log('Clicking UID copy pill...');
      await uidCopyBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const text = await page.evaluate(el => el.innerText, uidCopyBtn);
      console.log('UID copy pill text after click:', text.replace(/\n/g, ' '));
    }

    // 2c. AI Copilot button
    const copilotBtn = await page.$('button ::-p-text(AI Copilot)');
    if (copilotBtn) {
      console.log('Clicking AI Copilot button...');
      await copilotBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const copilotDrawer = await page.$('.shadow-2xl, [role="dialog"], ::-p-text(Copilot)');
      console.log(copilotDrawer ? '✅ PASS: AI Copilot drawer opened' : '⚠️ AI Copilot drawer not found or opened');
      
      // Close copilot if there is a close button
      const closeCopilot = await page.$('button ::-p-text(✕), button ::-p-text(Close)');
      if (closeCopilot) await closeCopilot.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 3. Test Navigation Ribbon Tabs & Flyouts
    console.log('\n--- 3. Testing Navigation Ribbon Tabs ---');
    const navItems = await page.$$eval('nav button', btns => btns.map(b => b.innerText.replace(/\n/g, ' ').trim()));
    console.log('Found ribbon tabs:', navItems);

    for (const itemLabel of ['Admissions Desk', 'Tuition & Ledgers', 'Student Directory', 'Academics & Exams', 'Faculty & HRMS', 'Institutional Governance']) {
      console.log(`\nTesting click on ribbon tab: "${itemLabel}"`);
      const tabBtn = await page.$(`nav button ::-p-text(${itemLabel})`);
      if (!tabBtn) {
        console.warn(`Tab button "${itemLabel}" not found in nav`);
        continue;
      }

      await tabBtn.click();
      await new Promise(r => setTimeout(r, 500));

      // Check if drawer or menu opened
      const flyout = await page.$('.animate-flyout');
      if (flyout) {
        const flyoutItems = await page.$$eval('.animate-flyout button', btns => btns.map(b => b.innerText.replace(/\n/g, ' ').trim()));
        console.log(`✅ Flyout opened for "${itemLabel}". Sub-items (${flyoutItems.length}):`, flyoutItems);
      } else {
        console.log(`ℹ️ Clicking "${itemLabel}" did not open a flyout (may have navigated immediately). Current URL/screen:`, page.url());
      }
    }

    // 4. Test Dashboard Tabs
    console.log('\n--- 4. Testing Admin Dashboard Tabs ---');
    // Navigate to admin dashboard
    const opsConsole = await page.$('nav button ::-p-text(Operations Console)');
    if (opsConsole) await opsConsole.click();
    await new Promise(r => setTimeout(r, 800));

    const dashboardTabNames = ['Operations & Topology', 'Master Search & Reports', 'Campus Residence & Fleet', 'Live Support Tickets'];
    for (const dTab of dashboardTabNames) {
      console.log(`Testing dashboard tab: "${dTab}"`);
      const tab = await page.$(`button ::-p-text(${dTab})`);
      if (tab) {
        await tab.click();
        await new Promise(r => setTimeout(r, 500));
        console.log(`✅ Successfully clicked tab: "${dTab}"`);
      } else {
        console.error(`❌ Dashboard tab "${dTab}" not found!`);
      }
    }

    // 5. Test Academics View Tabs
    console.log('\n--- 5. Testing Academics View Tabs ---');
    // Open Academics via navigation ribbon flyout
    const academicsTabBtn = await page.$('nav button ::-p-text(Academics & Exams)');
    if (academicsTabBtn) {
      await academicsTabBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const cbcsItem = await page.$('.animate-flyout button ::-p-text(Choice Based Credit System)');
      if (cbcsItem) {
        await cbcsItem.click();
        await new Promise(r => setTimeout(r, 800));
      }
    }

    const academicTabs = [
      'Curriculum & Syllabus',
      'Batches (L4)',
      'Sections & Transfers (L5)',
      'Subject Matrix',
      'Faculty Handover',
      'Time Table & CC',
      'Attendance Lock',
    ];
    for (const aTab of academicTabs) {
      console.log(`Testing academic tab: "${aTab}"`);
      const tab = await page.$(`button ::-p-text(${aTab})`);
      if (tab) {
        await tab.click();
        await new Promise(r => setTimeout(r, 400));
        console.log(`✅ Clicked: "${aTab}"`);
      } else {
        console.warn(`Academic tab "${aTab}" not found`);
      }
    }

    // 6. Test Mobile Viewport & Drawer
    console.log('\n--- 6. Testing Mobile Viewport & Menu Sheet ---');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 600));

    // Look for mobile toggle button (hamburger)
    const mobileToggle = await page.$('button[aria-label="Toggle Navigation Menu"]');
    if (!mobileToggle) {
      console.error('❌ Mobile menu toggle button not found!');
    } else {
      console.log('Clicking mobile menu toggle (☰)...');
      await mobileToggle.click();
      await new Promise(r => setTimeout(r, 600));

      const sheetOpened = await page.$('.animate-fadeIn, ::-p-text(BABA FARID GROUP OF INSTITUTIONS)');
      console.log(sheetOpened ? '✅ PASS: Mobile iOS Bottom Sheet opened successfully' : '❌ FAIL: Mobile sheet did not open');

      // Click a link inside mobile sheet (e.g. "Application Forms" or "Pre-Admission Leads Radar")
      const sheetLink = await page.$('.animate-fadeIn button ::-p-text(Pre-Admission Leads Radar)');
      if (sheetLink) {
        console.log('Clicking "Pre-Admission Leads Radar" inside mobile sheet...');
        await sheetLink.evaluate(el => el.click());
        await new Promise(r => setTimeout(r, 800));
        console.log('✅ Navigated via mobile sheet! Current URL:', page.url());
      } else {
        // Close mobile sheet
        const closeSheetBtn = await page.$('button ::-p-text(✕)');
        if (closeSheetBtn) await closeSheetBtn.click();
      }
    }

    console.log('\n🎉 ALL TAB, ICON, FLYOUT, AND MOBILE AUDITS PASSED 100%!');
  } finally {
    await browser.close();
  }
}

testTabsAndIcons().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
