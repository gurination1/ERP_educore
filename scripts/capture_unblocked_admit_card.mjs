import puppeteer from 'puppeteer-core';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 3012;
const OUT_DIR = '/root/college-erp-educore/screenshots_audit';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Spawning test server on port', PORT);
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
    defaultViewport: { width: 1440, height: 1100 },
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
    await sleep(2500);

    // Navigate to Examination Portal
    await page.goto(`http://127.0.0.1:${PORT}/examination`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Click Admit Card / Hall Ticket Tab
    const tabButtons = await page.$$('button');
    for (const btn of tabButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Admit Card / Hall Ticket')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);

    // Click "Instant Reconcile Tuition Dues (Clear Hold)"
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Instant Reconcile Tuition Dues')) {
        console.log('Clicking Instant Reconcile Tuition Dues button...');
        await btn.click();
        break;
      }
    }
    await sleep(2000);

    // Screenshot the unblocked released Hall Ticket
    const ssPath = path.join(OUT_DIR, '16_exam_portal_admit_card_unblocked.png');
    await page.screenshot({ path: ssPath });
    console.log('Saved unblocked Admit Card screenshot:', ssPath);
  } catch (err) {
    console.error('Error during unblocking capture:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Done unblocked admit card capture!');
  }
}

run();
