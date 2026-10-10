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

    // Login as Admin
    const inputs = await page.$$('input');
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('4001-01-03-01');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('admin123');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(2500);

    // Screenshot 1: Sleek Header & Operations Dashboard
    const ss1 = path.join(OUT_DIR, '09_header_and_dashboard_sleek.png');
    await page.screenshot({ path: ss1 });
    console.log('Saved', ss1);

    // Hover over Admissions menu section in horizontal text strip
    const navButtons = await page.$$('header nav button');
    for (const btn of navButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Admissions')) {
        console.log('Clicking Admissions section in horizontal text strip to open vertical section...');
        await btn.click();
        break;
      }
    }
    await sleep(1000);
    const ss2 = path.join(OUT_DIR, '10_horizontal_strip_vertical_flyout.png');
    await page.screenshot({ path: ss2 });
    console.log('Saved', ss2);
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Done!');
  }
}

run();
