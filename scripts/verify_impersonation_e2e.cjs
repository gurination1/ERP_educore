const puppeteer = require('/root/guri-v10-webjs/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runTest() {
  console.log('=== STARTING IMPERSONATION CONNECTIVITY E2E TEST ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.error('PAGE ERROR CAUGHT:', err.message);
    errors.push(err.message);
  });

  const url = 'https://gurination1.github.io/ERP_educore/';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Take screenshot of login
  await page.screenshot({ path: '/root/college-erp-educore/screenshots/test_1_login.png' });
  console.log('Login page loaded.');

  // Find Super Admin Fast Login button (Provost 10126090001)
  console.log('Clicking Super Admin demo button...');
  const superAdminBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.innerText.includes('Super Admin') || b.innerText.includes('10126090001') || b.innerText.includes('Provost'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (!superAdminBtn) {
    throw new Error('Super Admin demo login button not found');
  }

  // Click Sign In
  await delay(1000);
  console.log('Clicking Sign In...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signIn = buttons.find(b => b.innerText.trim() === 'Sign In' && !b.disabled);
    if (signIn) signIn.click();
  });

  await delay(3000);
  await page.screenshot({ path: '/root/college-erp-educore/screenshots/test_2_super_admin_cockpit.png' });

  // Verify Super Admin Cockpit
  const pageTitle = await page.evaluate(() => document.body.innerText);
  const isSuperAdminCockpit = pageTitle.includes('Universal Provost & SaaS Platform Master Cockpit') || pageTitle.includes('APEX 9001');
  console.log('Super Admin Cockpit visible:', isSuperAdminCockpit);

  // Locate the "Open" button for Baba Farid
  console.log('Clicking "Open" button on Baba Farid Group of Institutions...');
  const clickedOpen = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr'));
    const bfgiRow = rows.find(r => r.innerText.includes('Baba Farid') || r.innerText.includes('BFGI'));
    if (bfgiRow) {
      const openBtn = bfgiRow.querySelector('button');
      if (openBtn) {
        openBtn.click();
        return true;
      }
    }
    return false;
  });

  console.log('Clicked Open on Baba Farid:', clickedOpen);
  await delay(3000);

  await page.screenshot({ path: '/root/college-erp-educore/screenshots/test_3_impersonated_dashboard.png' });

  // Verify Impersonated College State
  const impersonatedState = await page.evaluate(() => {
    const banner = document.getElementById('impersonation-active-banner');
    const bodyText = document.body.innerText;
    return {
      hasBanner: !!banner,
      bannerText: banner ? banner.innerText : null,
      hasBfgiTitle: bodyText.includes('Baba Farid') || bodyText.includes('BFGI'),
      hasExitButton: banner ? banner.querySelector('button') !== null : false,
      hasExecutiveCockpit: bodyText.includes('Executive Cockpit') || bodyText.includes('Governance Cockpit')
    };
  });

  console.log('Impersonated State Verification:', JSON.stringify(impersonatedState, null, 2));

  // Now test the Exit Impersonation Button
  if (impersonatedState.hasBanner && impersonatedState.hasExitButton) {
    console.log('Clicking "Exit Impersonation & Return to Cockpit"...');
    await page.evaluate(() => {
      const banner = document.getElementById('impersonation-active-banner');
      if (banner) {
        const btn = banner.querySelector('button');
        if (btn) btn.click();
      }
    });

    await delay(3000);
    await page.screenshot({ path: '/root/college-erp-educore/screenshots/test_4_returned_to_super_admin.png' });

    const returnedState = await page.evaluate(() => {
      const banner = document.getElementById('impersonation-active-banner');
      const text = document.body.innerText;
      return {
        hasBanner: !!banner,
        isBackInSuperAdmin: text.includes('Universal Provost') || text.includes('APEX 9001')
      };
    });

    console.log('Returned to Super Admin Verification:', JSON.stringify(returnedState, null, 2));
  }

  // Check for any uncaught errors
  console.log('Total page errors caught:', errors.length);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
  }

  await browser.close();
  console.log('=== TEST COMPLETE ===');
}

runTest().catch(err => {
  console.error('Test script failed:', err);
  process.exit(1);
});
