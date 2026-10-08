import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/root/college-erp-educore/screenshots_audit';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('Launching Chromium...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
    defaultViewport: { width: 1440, height: 950 }
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('1. Loading Login Page...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_view.png') });
  console.log('Saved 01_login_view.png');

  // Fill Admin Credentials
  console.log('Authenticating as Admin (4001-03-BFGI-0001)...');
  await page.evaluate(() => {
    // Click ADMIN tab
    const roleBtn = document.getElementById('role-toggle-admin');
    if (roleBtn) roleBtn.click();
    
    // Fill credentials
    const userInput = document.getElementById('login-username-input');
    if (userInput) {
      userInput.value = '4001-03-BFGI-0001';
      userInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const passInput = document.getElementById('login-password-input');
    if (passInput) {
      passInput.value = 'admin123';
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Submit form
    const submitBtn = document.getElementById('login-submit-btn');
    if (submitBtn) submitBtn.click();
  });

  // Wait for dashboard to render
  console.log('Waiting for Admin Dashboard...');
  await page.waitForFunction(
    () => window.location.pathname === '/dashboard' || document.querySelector('header') !== null,
    { timeout: 15000 }
  );
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Capturing Admin Dashboard...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_admin_dashboard.png') });
  console.log('Saved 02_admin_dashboard.png');

  // 3. Open Master Tables Modal
  console.log('Capturing Master Tables Modal...');
  const openedMasterModal = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('MASTER TABLE ARCHITECTURE'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (openedMasterModal) {
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02b_master_tables_modal.png') });
    console.log('Saved 02b_master_tables_modal.png');
    // Close modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('[CLOSE]'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
  }

  // 4. Staff Management
  console.log('3. Navigating to Staff Directory (/staff-management)...');
  await page.evaluate(() => window.history.pushState({}, '', '/staff-management'));
  await page.goto('http://localhost:3000/staff-management', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_staff_management.png') });
  console.log('Saved 03_staff_management.png');

  // 5. CRM & Enquiries
  console.log('4. Navigating to CRM Enquiries (/enquiries)...');
  await page.goto('http://localhost:3000/enquiries', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_enquiries_crm.png') });
  console.log('Saved 04_enquiries_crm.png');

  // 6. Bulk Import Mapper
  console.log('5. Navigating to Bulk Import (/bulk-import)...');
  await page.goto('http://localhost:3000/bulk-import', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_bulk_import.png') });
  console.log('Saved 05_bulk_import.png');

  // 7. Partner Portal
  console.log('6. Navigating to Partner Portal (/partner-portal)...');
  await page.goto('http://localhost:3000/partner-portal', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_partner_portal.png') });
  console.log('Saved 06_partner_portal.png');

  // 8. Student Regulatory Vault
  console.log('7. Navigating to Student Documents (/student-documents)...');
  await page.goto('http://localhost:3000/student-documents', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_student_documents.png') });
  console.log('Saved 07_student_documents.png');

  // 9. Teacher Credentials Vault
  console.log('8. Navigating to Teacher Documents (/teacher-documents)...');
  await page.goto('http://localhost:3000/teacher-documents', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_teacher_documents.png') });
  console.log('Saved 08_teacher_documents.png');

  // 10. CBT Quiz & LMS
  console.log('9. Navigating to CBT Quiz LMS (/student-quiz-lms)...');
  await page.goto('http://localhost:3000/student-quiz-lms', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_quiz_lms.png') });
  console.log('Saved 09_quiz_lms.png');

  // 11. Fee Ledger
  console.log('10. Navigating to Fee Ledger (/fees)...');
  await page.goto('http://localhost:3000/fees', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_fee_ledger.png') });
  console.log('Saved 10_fee_ledger.png');

  // 12. Student Dashboard
  console.log('11. Authenticating as Student (1001-03-BFGI-260088)...');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const roleBtn = document.getElementById('role-toggle-student');
    if (roleBtn) roleBtn.click();
    
    const userInput = document.getElementById('login-username-input');
    if (userInput) {
      userInput.value = '1001-03-BFGI-260088';
      userInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const passInput = document.getElementById('login-password-input');
    if (passInput) {
      passInput.value = 'student123';
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const submitBtn = document.getElementById('login-submit-btn');
    if (submitBtn) submitBtn.click();
  });

  await page.waitForFunction(
    () => window.location.pathname === '/dashboard' || document.querySelector('header') !== null,
    { timeout: 15000 }
  );
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_student_dashboard.png') });
  console.log('Saved 11_student_dashboard.png');

  console.log('Audit complete! All screenshots saved in:', SCREENSHOT_DIR);
  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
