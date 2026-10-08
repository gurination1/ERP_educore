import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const OUT_DIR = '/root/college-erp-educore/screenshots_audit';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  console.log('Starting fast screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  // 1. Login Page
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUT_DIR, '01_login_verified.png') });
  console.log('Saved 01_login_verified.png');

  // Fill and submit admin login
  await page.evaluate(() => {
    const adminTab = document.getElementById('role-toggle-admin');
    if (adminTab) adminTab.click();
    const uInput = document.getElementById('login-username-input');
    if (uInput) {
      uInput.value = '4001-03-BFGI-0001';
      uInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const pInput = document.getElementById('login-password-input');
    if (pInput) {
      pInput.value = 'admin123';
      pInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const submitBtn = document.getElementById('login-submit-btn');
    if (submitBtn) submitBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUT_DIR, '02_admin_dashboard_verified.png') });
  console.log('Saved 02_admin_dashboard_verified.png');

  // Navigate to Staff Management
  await page.goto('http://localhost:3000/staff-management', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '03_staff_management_verified.png') });
  console.log('Saved 03_staff_management_verified.png');

  // Navigate to CRM Enquiries
  await page.goto('http://localhost:3000/enquiries', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '04_crm_enquiries_verified.png') });
  console.log('Saved 04_crm_enquiries_verified.png');

  // Navigate to Bulk Import
  await page.goto('http://localhost:3000/bulk-import', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '05_bulk_import_verified.png') });
  console.log('Saved 05_bulk_import_verified.png');

  // Navigate to Partner Portal
  await page.goto('http://localhost:3000/partner-portal', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '06_partner_portal_verified.png') });
  console.log('Saved 06_partner_portal_verified.png');

  // Navigate to Fees
  await page.goto('http://localhost:3000/fees', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '07_fee_ledger_verified.png') });
  console.log('Saved 07_fee_ledger_verified.png');

  await browser.close();
  console.log('All screens successfully captured!');
}

main().catch(console.error);
