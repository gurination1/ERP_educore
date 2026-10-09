import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const PORT = 3018;
const OUT_DIR = '/root/college-erp-educore/screenshots_audit';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServer(port) {
  const s = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
    stdio: 'ignore'
  });
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) return s;
    } catch (e) {}
    await sleep(300);
  }
  return s;
}

async function run() {
  console.log('🚀 Spawning test server on port', PORT);
  const server = await startServer(PORT);
  console.log('⚡ Server active on port', PORT);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2' });

  // 1. Login as Admin
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('4001-01-03-01');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('admin123');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForSelector('header nav button', { timeout: 10000 });
    await sleep(1000);
  }

  console.log('Current URL on Dashboard:', page.url());

  // Check 1: Telephony removed from Tier 1
  const telephonyText = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('header button'));
    return buttons.some(b => b.innerText.trim() === 'Telephony');
  });
  console.log(telephonyText ? '❌ Telephony still found!' : '✅ Telephony removed from top header');

  // Check 2: Online (120Hz) removed
  const hzText = await page.evaluate(() => {
    return document.body.innerText.includes('120Hz') || document.body.innerText.includes('120 hertz');
  });
  console.log(hzText ? '❌ 120Hz still found!' : '✅ 120Hz removed from header ribbon');

  // Check 3: Relational DB Engine Live removed
  const dbEngineText = await page.evaluate(() => {
    return document.body.innerText.includes('Relational DB Engine Live');
  });
  console.log(dbEngineText ? '❌ Relational DB Engine Live still found!' : '✅ Relational DB Engine Live removed from console');

  // Capture Dashboard Screenshot
  await page.screenshot({ path: `${OUT_DIR}/17_clean_professional_dashboard.png` });

  // Test Clicking Navigation Strip Items
  const navTests = [
    { label: 'Examination', expectedPath: '/examination' },
    { label: 'Academics', expectedPath: '/academics' },
    { label: 'Students', expectedPath: '/manage-students' },
    { label: 'Admissions', expectedPath: '/enquiries' },
    { label: 'Faculty & HR', expectedPath: '/staff-management' },
    { label: 'Placements', expectedPath: '/partner-portal' },
    { label: 'Governance', expectedPath: '/user-management' },
    { label: 'Home', expectedPath: '/dashboard' },
  ];

  for (const test of navTests) {
    console.log(`Clicking navigation strip item: "${test.label}"...`);
    const clicked = await page.evaluate((targetLabel) => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const btn = navButtons.find(b => b.innerText.includes(targetLabel));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, test.label);

    if (!clicked) {
      console.error(`❌ Could not find nav button for "${test.label}"`);
      continue;
    }

    await sleep(600);
    const currentUrl = page.url();
    const matches = currentUrl.endsWith(test.expectedPath);
    console.log(matches ? `✅ [PASS] "${test.label}" navigated to ${test.expectedPath}` : `❌ [FAIL] "${test.label}" expected ${test.expectedPath}, got ${currentUrl}`);
  }

  // Also verify on a mobile viewport (390 x 844)
  await page.setViewport({ width: 390, height: 844 });
  await sleep(400);
  console.log('Testing mobile navigation strip click on "Examination"...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const btn = navButtons.find(b => b.innerText.includes('Examination'));
    if (btn) btn.click();
  });
  await sleep(600);
  console.log(page.url().endsWith('/examination') ? '✅ [PASS] Mobile navigation strip click on "Examination" navigated to /examination' : `❌ [FAIL] Mobile navigation URL: ${page.url()}`);
  await page.screenshot({ path: `${OUT_DIR}/18_mobile_nav_click_verified.png` });

  await browser.close();
  server.kill();
  console.log('\nAll navigation strip click verifications finished!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
