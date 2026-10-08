import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';

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
  const port = 3014;
  const s = await startServer(port);
  console.log('Server started on', port);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle2' });
  
  // Login as admin
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('4001-01-03-01');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('admin123');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(1500);
  }

  await page.screenshot({ path: 'screenshots_audit/debug_menu_01_dashboard.png' });

  // Let's find navigation buttons
  const buttons = await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button, header button'));
    return navButtons.map(b => ({ text: b.innerText.trim(), tag: b.tagName }));
  });
  console.log('Found buttons:', buttons);

  // Click on "Examination"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const examBtn = buttons.find(b => b.innerText.includes('Examination'));
    if (examBtn) examBtn.click();
  });
  await sleep(800);
  await page.screenshot({ path: 'screenshots_audit/debug_menu_02_examination_clicked.png' });

  // Click on "Students"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const studentBtn = buttons.find(b => b.innerText.includes('Students'));
    if (studentBtn) studentBtn.click();
  });
  await sleep(800);
  await page.screenshot({ path: 'screenshots_audit/debug_menu_03_students_clicked.png' });

  // Click on "Admissions"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const admBtn = buttons.find(b => b.innerText.includes('Admissions'));
    if (admBtn) admBtn.click();
  });
  await sleep(800);
  await page.screenshot({ path: 'screenshots_audit/debug_menu_04_admissions_clicked.png' });

  // Also check mobile view (e.g. viewport 390x844 iPhone 14/15)
  await page.setViewport({ width: 390, height: 844 });
  await sleep(500);
  await page.screenshot({ path: 'screenshots_audit/debug_menu_05_mobile_closed.png' });
  // Click mobile hamburger menu
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const hamburger = buttons.find(b => b.innerText.includes('☰'));
    if (hamburger) hamburger.click();
  });
  await sleep(800);
  await page.screenshot({ path: 'screenshots_audit/debug_menu_06_mobile_opened.png' });

  await browser.close();
  s.kill();
  console.log('Done screenshots!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
