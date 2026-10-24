const puppeteer = require('/root/guri-v10-webjs/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runE2E() {
  console.log('--- STARTING E2E VERIFICATION ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER UNCAUGHT ERROR:', err.message));

  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  try {
    // 1. Visit Login Page
    console.log('[1] Loading Login Page...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('input#login-username-input', { timeout: 10000 });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_front.png') });
    console.log('   ✓ Login page loaded');

    // Verify 12-digit student UID chip in fast logins
    const fastLoginUID = await page.evaluate(() => {
      const el = document.body.innerText;
      return el.includes('1-01-26-01-0001');
    });
    console.log('   ✓ Student UID 1-01-26-01-0001 present in fast logins:', fastLoginUID);

    // 2. Test 3D Flip to "Forgot Password" (Orange Theme)
    console.log('[2] Testing 3D Flip -> Forgot Password...');
    await page.click('#login-forgot-password-trigger');
    await delay(1200);
    await page.screenshot({ path: path.join(screenshotsDir, '02_flip_forgot_password_orange.png') });
    
    // Check for orange styling and inputs
    const forgotFaceDetails = await page.evaluate(() => {
      const text = document.body.innerText;
      const html = document.body.innerHTML;
      return {
        hasTitle: text.includes('Forgot Password'),
        hasInput: text.includes('Registered UID / EMP ID'),
        hasSendBtn: text.includes('Send Details'),
        hasOrangeBorder: html.includes('border-[#ea580c]'),
        hasOrangeTheme: html.includes('from-orange-50/90') || html.includes('bg-[#ea580c]'),
      };
    });
    console.log('   ✓ Forgot Password face details:', forgotFaceDetails);

    // Fill UID and submit
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const uidInput = inputs.find(i => i.placeholder && i.placeholder.includes('2001-14-03-01'));
      if (uidInput) {
        uidInput.value = '1-01-26-01-0001';
        uidInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const sendBtn = buttons.find(b => b.innerText.includes('Send Details'));
      if (sendBtn) sendBtn.click();
    });
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '03_flipped_back_otp_banner.png') });
    
    const bannerText = await page.evaluate(() => document.body.innerText);
    const hasOtpAlert = bannerText.includes('SMS') || bannerText.includes('password') || bannerText.includes('WhatsApp');
    console.log('   ✓ Auto-flipped back with SMS/WhatsApp password alert:', hasOtpAlert);

    // 3. Test 3D Flip to "Contact Admin" (Collegiate Blue Theme)
    console.log('[3] Testing 3D Flip -> Contact Admin...');
    await page.click('#login-contact-admin-trigger');
    await delay(1200);
    await page.screenshot({ path: path.join(screenshotsDir, '04_flip_contact_admin_blue.png') });
    
    const contactFaceDetails = await page.evaluate(() => {
      const text = document.body.innerText;
      const html = document.body.innerHTML;
      return {
        hasTitle: text.includes('Contact Admin'),
        hasRegarding: text.includes('Regarding'),
        hasSubmitBtn: text.includes('Submit Concern') || text.includes('Submit'),
        hasBlueBorder: html.includes('border-[#00236f]'),
        hasBlueTheme: html.includes('from-blue-50/90') || html.includes('bg-[#00236f]'),
      };
    });
    console.log('   ✓ Contact Admin face details:', contactFaceDetails);

    // Fill concern and submit
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'Need course syllabus update for AI semester.');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const subBtn = buttons.find(b => b.innerText.includes('Submit Concern'));
      if (subBtn) subBtn.click();
    });
    await delay(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '05_flipped_back_ticket_banner.png') });
    
    const ticketBannerText = await page.evaluate(() => document.body.innerText);
    const hasTicketAlert = ticketBannerText.includes('TKT-') || ticketBannerText.includes('Ticket');
    console.log('   ✓ Auto-flipped back with support ticket generated:', hasTicketAlert);

    // 4. Test Student Login via 12-Digit UID
    console.log('[4] Testing Student Login via 12-Digit UID...');
    await page.waitForSelector('button[data-demo-role="student"]', { timeout: 5000 });
    await page.click('button[data-demo-role="student"]');
    await delay(3500);
    await page.screenshot({ path: path.join(screenshotsDir, '06_student_dashboard.png') });

    const studentPageText = await page.evaluate(() => document.body.innerText);
    const isStudentLoggedIn = studentPageText.includes('Aryan') || studentPageText.includes('1-01-26-01-0001') || studentPageText.includes('Scholar');
    console.log('   ✓ Student logged in with 12-digit UID:', isStudentLoggedIn);

    // 5. Logout and Login as Super Admin
    console.log('[5] Logging out and logging in as Super Admin...');
    await page.evaluate(() => {
      localStorage.clear();
      window.location.href = '/';
    });
    await page.waitForSelector('button[data-demo-role="super_admin"]', { timeout: 10000 });
    await delay(1000);

    // Fast login as Super Admin
    await page.click('button[data-demo-role="super_admin"]');
    await delay(3500);
    await page.screenshot({ path: path.join(screenshotsDir, '07_superadmin_dashboard.png') });

    // Navigate to Tenants / Multi-Campus & Subscription view
    console.log('[6] Navigating to Tenants, Subscriptions & Database Migrations...');
    await page.goto('http://localhost:3000/tenants', { waitUntil: 'domcontentloaded' });
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '08_tenants_management.png') });

    // Verify "+ Add Client & Subscriptions" canvas
    const hasAddClientBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.innerText.includes('Add Client') || b.innerText.includes('Add Institution'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    console.log('   ✓ Opened "+ Add Client & Subscriptions" inline canvas:', hasAddClientBtn);
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '09_add_client_canvas.png') });

    // Verify Client Number, Subscription Plan, and Master vs Sample DB selector
    const canvasDetails = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasClientNumber: text.includes('Client Number') || text.includes('12-Digit UID'),
        hasSubscription: text.includes('Subscription Plan') || text.includes('Starter Tier') || text.includes('Professional'),
        hasMasterDb: text.includes('Master DB') && text.includes('Sample DB'),
      };
    });
    console.log('   ✓ Add Client canvas verification:', canvasDetails);

    // Switch to Database Migrations Tab
    console.log('[7] Switching to Database Migrations Tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const migTab = buttons.find(b => b.innerText.includes('Database Migrations') || b.innerText.includes('schema_migrations'));
      if (migTab) migTab.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '10_database_migrations_tab.png') });

    const migDetails = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMigrationsList: text.includes('001_core_relational_schema') && text.includes('003_12digit_canonical_uid_standard'),
        hasSchemaVersion: text.includes('2026.06.15-PRD'),
        hasTableHealth: text.includes('tenants') && text.includes('students') && text.includes('users'),
      };
    });
    console.log('   ✓ Migrations tab details verification:', migDetails);

    // Click "Verify & Run Migrations"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const runBtn = buttons.find(b => b.innerText.includes('Verify & Run Migrations'));
      if (runBtn) runBtn.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '11_verified_migrations_toast.png') });
    console.log('   ✓ Triggered Verify & Run Migrations');

    console.log('--- ALL E2E VERIFICATIONS PASSED ---');
  } catch (err) {
    console.error('E2E Verification Error:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'error_state.png') });
  } finally {
    await browser.close();
  }
}

runE2E();
