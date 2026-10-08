import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 3012;
const OUT_DIR = '/root/college-erp-educore/screenshots_audit';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Spawning test server on port', PORT);
  const server = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  server.stdout.on('data', d => console.log('[Server]', d.toString().trim()));
  server.stderr.on('data', d => console.error('[Server Err]', d.toString().trim()));

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (res.ok) {
        console.log('Server is healthy!');
        break;
      }
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

    // 1. Login as Admin
    const inputs = await page.$$('input');
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('4001-01-03-01');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('admin123');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(2500);

    // 2. Navigate to Examination Portal
    await page.goto(`http://127.0.0.1:${PORT}/examination`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Screenshot 1: Regular Examination Form Tab
    const ss1 = path.join(OUT_DIR, '11_exam_portal_regular_form.png');
    await page.screenshot({ path: ss1 });
    console.log('Saved', ss1);

    // 3. Click Reappear / Backlog Form Tab
    const tabButtons = await page.$$('button');
    for (const btn of tabButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Reappear / Backlog Form')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);
    const ss2 = path.join(OUT_DIR, '12_exam_portal_reappear_backlog.png');
    await page.screenshot({ path: ss2 });
    console.log('Saved', ss2);

    // 4. Click Admit Card / Hall Ticket Tab
    for (const btn of tabButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Admit Card / Hall Ticket')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);
    const ss3 = path.join(OUT_DIR, '13_exam_portal_admit_card_verified.png');
    await page.screenshot({ path: ss3 });
    console.log('Saved', ss3);

    // 5. Click Official Datesheets Tab
    for (const btn of tabButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Official Datesheets')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);
    const ss4 = path.join(OUT_DIR, '14_exam_portal_datesheets.png');
    await page.screenshot({ path: ss4 });
    console.log('Saved', ss4);

    // 6. Click CBCS Grade Cards Tab
    for (const btn of tabButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('CBCS Grade Cards')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);
    const ss5 = path.join(OUT_DIR, '15_exam_portal_cbcs_results.png');
    await page.screenshot({ path: ss5 });
    console.log('Saved', ss5);

    // 7. Test Universal Back Navigation from Examination Portal
    const backBtn = await page.$('button[title*="Return to Previous Screen"]');
    if (backBtn) {
      console.log('Clicking ‹ Back button in Examination Portal...');
      await backBtn.click();
      await sleep(1500);
      console.log('URL after Back click:', page.url());
      if (page.url().includes('/dashboard')) {
        console.log('✅ Back button safely returned to /dashboard!');
      }
    }
  } catch (err) {
    console.error('Error during examination portal audit:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Done examination portal verification!');
  }
}

run();
