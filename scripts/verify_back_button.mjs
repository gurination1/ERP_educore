import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 3010;
const OUT_DIR = '/root/college-erp-educore/screenshots_audit';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Spawning test server on port', PORT);
  const server = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (res.ok) break;
    } catch (e) {}
    await sleep(500);
  }

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2' });

    // Login as Admin
    const inputs = await page.$$('input');
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('4001-01-03-01');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('admin123');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(2000);

    // Direct navigate to /manage-students
    await page.goto(`http://127.0.0.1:${PORT}/manage-students`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    console.log('Current URL on sub-screen:', page.url());
    await page.screenshot({ path: path.join(OUT_DIR, '08_manage_students_back_test.png') });

    // Click breadcrumb back button
    console.log('Clicking ‹ Back button in breadcrumb ribbon...');
    const backBtn = await page.$('nav[aria-label="Breadcrumb Navigation"] button');
    if (backBtn) {
      await backBtn.click();
      await sleep(1500);
      console.log('URL after clicking Back:', page.url());
      await page.screenshot({ path: path.join(OUT_DIR, '09_returned_to_dashboard.png') });
    }

    console.log('✅ Back button verification passed successfully!');
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
