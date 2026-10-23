import { createRequire } from 'module';
const req = createRequire('/usr/lib/node_modules/');
const puppeteer = req('puppeteer');
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));

  // 1. Visit SuperAdmin
  console.log('Visiting /admin for SuperAdmin...');
  await page.goto('http://127.0.0.1:3012/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#login-username-input', { timeout: 10000 });
  await page.type('#login-username-input', '9001-01-03-01');
  await page.type('#login-password-input', 'super123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('header', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Super Admin loaded:', page.url());
  await page.screenshot({ path: '/root/college-erp-educore/screenshots_audit/super_admin_dashboard.png', fullPage: true });

  // 2. Click Onboard Tab
  console.log('Clicking onboarding tab...');
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Onboard') || el.textContent.includes('New Institution'));
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  console.log('Onboarding tab clicked:', clicked);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/root/college-erp-educore/screenshots_audit/super_admin_onboard_tab.png', fullPage: true });

  // 3. Admin Login & Dashboard
  console.log('Visiting /admin for Registrar/Admin...');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('http://127.0.0.1:3012/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#login-username-input', { timeout: 10000 });
  await page.type('#login-username-input', '4001-01-03-01');
  await page.type('#login-password-input', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('header', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Admin loaded:', page.url());
  await page.screenshot({ path: '/root/college-erp-educore/screenshots_audit/admin_dashboard.png', fullPage: true });

  await browser.close();
  console.log('All screenshots captured successfully!');
})().catch(e => { console.error('PUPPETEER_FAIL:', e); process.exit(1); });
