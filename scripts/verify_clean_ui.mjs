import { createRequire } from 'module';
const require = createRequire('/usr/lib/node_modules/');
const puppeteer = require('puppeteer');

async function testCleanUI() {
  console.log('--- STARTING CLEAN UI VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Check Login Page
    console.log('Testing Login Page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    const loginText = await page.evaluate(() => document.body.innerText);

    console.log('Check PURE DIGIT UID in Login:', loginText.includes('PURE DIGIT UID') ? 'FAIL' : 'PASS');
    console.log('Check Node: S1-C01 in Login:', loginText.includes('Node: S1-C01') ? 'FAIL' : 'PASS');
    console.log('Check Collegiate Enterprise Subtitle:', loginText.includes('Collegiate Enterprise Resource Planning') ? 'FAIL' : 'PASS');
    console.log('Check Role: student below input:', loginText.includes('Role: student') ? 'FAIL' : 'PASS');
    console.log('Check Orange Theme text:', loginText.includes('Orange Theme') ? 'FAIL' : 'PASS');
    console.log('Check Recovery Mode text:', loginText.includes('Recovery Mode') ? 'FAIL' : 'PASS');
    console.log('Check Blue Theme text:', loginText.includes('Blue Theme') ? 'FAIL' : 'PASS');
    console.log('Check Governance Desk text:', loginText.includes('Governance Desk') ? 'FAIL' : 'PASS');
    console.log('Check Flip Back text:', loginText.includes('Flip Back') ? 'FAIL' : 'PASS');

    console.log('--- ALL CHECKS FINISHED ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

testCleanUI();
