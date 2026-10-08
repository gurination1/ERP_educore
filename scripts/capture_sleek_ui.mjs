import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 3009;
const OUT_DIR = '/root/college-erp-educore/screenshots_audit';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`🚀 Launching production server on port ${PORT}...`);
  const server = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  server.stdout.on('data', d => console.log('[SERVER]', d.toString().trim()));
  server.stderr.on('data', d => console.error('[SERVER ERR]', d.toString().trim()));

  // Wait for server health
  let healthy = false;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch (e) {}
    await sleep(500);
  }

  if (!healthy) {
    console.error('Server failed to start on port', PORT);
    server.kill();
    process.exit(1);
  }
  console.log(`⚡ Server healthy on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // 1. Sleek Login Page
    console.log('Capturing 01_login_view.png...');
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2' });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT_DIR, '01_login_view.png') });

    // 2. Admin Login
    console.log('Logging in as Admin (4001-01-03-01)...');
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('4001-01-03-01');
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type('admin123');
    }
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(2500);

    // 2. Admin Dashboard with sleek continuous text strip navbar
    console.log('Capturing 02_admin_header_sleek.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '02_admin_header_sleek.png') });

    // 3. Hover / Click on Examination dropdown in the header
    console.log('Opening Examination dropdown...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('nav button'));
      const examBtn = buttons.find(b => b.textContent && b.textContent.includes('Examination'));
      if (examBtn) examBtn.click();
    });
    await sleep(800);
    console.log('Capturing 03_examination_dropdown_open.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '03_examination_dropdown_open.png') });

    // 4. Click Admit Card in dropdown to trigger Hall Ticket Modal
    console.log('Clicking Admit Card / Hall Ticket...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      const admitLink = links.find(el => el.textContent && (el.textContent.includes('Admit Card') || el.textContent.includes('Hall Ticket')));
      if (admitLink) admitLink.click();
    });
    await sleep(1000);
    console.log('Capturing 04_admit_card_modal.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '04_admit_card_modal.png') });

    // Close modal if open
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('button'));
      const xBtn = closeButtons.find(b => b.textContent && (b.textContent.trim() === '✕' || b.textContent.includes('Close')));
      if (xBtn) xBtn.click();
    });
    await sleep(500);

    // 5. Open Academics dropdown and click Choice Based Credit System (CBCS)
    console.log('Opening Academics dropdown...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('nav button'));
      const acadBtn = buttons.find(b => b.textContent && b.textContent.includes('Academics'));
      if (acadBtn) acadBtn.click();
    });
    await sleep(500);

    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button'));
      const cbcsBtn = items.find(b => b.textContent && b.textContent.includes('Choice Based Credit System'));
      if (cbcsBtn) cbcsBtn.click();
    });
    await sleep(1000);
    console.log('Capturing 05_academics_curriculum_sleek.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '05_academics_curriculum_sleek.png') });

    // 6. Sign out and log in as Student (1001-88-03-01)
    console.log('Logging in as Student (1001-88-03-01)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signOut = btns.find(b => b.textContent && b.textContent.includes('Sign Out'));
      if (signOut) signOut.click();
    });
    await sleep(800);

    const sInputs = await page.$$('input');
    if (sInputs.length >= 2) {
      await sInputs[0].click({ clickCount: 3 });
      await sInputs[0].type('1001-88-03-01');
      await sInputs[1].click({ clickCount: 3 });
      await sInputs[1].type('student123');
    }
    const sSubmit = await page.$('button[type="submit"]');
    if (sSubmit) await sSubmit.click();
    await sleep(2500);

    console.log('Capturing 06_student_dashboard_sleek.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '06_student_dashboard_sleek.png') });

    // 7. Sign out and log in as Faculty (2001-14-03-01)
    console.log('Logging in as Faculty (2001-14-03-01)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signOut = btns.find(b => b.textContent && b.textContent.includes('Sign Out'));
      if (signOut) signOut.click();
    });
    await sleep(800);

    const fInputs = await page.$$('input');
    if (fInputs.length >= 2) {
      await fInputs[0].click({ clickCount: 3 });
      await fInputs[0].type('2001-14-03-01');
      await fInputs[1].click({ clickCount: 3 });
      await fInputs[1].type('staff123');
    }
    const fSubmit = await page.$('button[type="submit"]');
    if (fSubmit) await fSubmit.click();
    await sleep(2500);

    console.log('Capturing 07_faculty_dashboard_sleek.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '07_faculty_dashboard_sleek.png') });

    console.log('✅ All sleek screenshots successfully captured in', OUT_DIR);
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    server.kill();
  }
}

main();
