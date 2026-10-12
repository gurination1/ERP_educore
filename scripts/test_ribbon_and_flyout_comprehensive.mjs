import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://127.0.0.1:3015/admin', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://127.0.0.1:3015/admin', { waitUntil: 'networkidle2' });

  await page.waitForSelector('#login-username-input', { timeout: 10000 });
  await page.type('#login-username-input', '9001-01-03-01');
  await page.type('#login-password-input', 'super123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('header nav button', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  async function closeModal() {
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.animate-scaleUp button'));
      const closeBtn = closeBtns.find(b => b.innerText.trim() === '✕');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
  }

  async function getActiveModalTab() {
    return page.evaluate(() => {
      const modal = document.querySelector('.animate-scaleUp');
      if (!modal) return null;
      const activeTab = Array.from(modal.querySelectorAll('button')).find(b => b.className.includes('border-[#00236f]'));
      return activeTab ? activeTab.innerText.trim() : null;
    });
  }

  async function getModalTitle() {
    return page.evaluate(() => {
      const modal = document.querySelector('.animate-scaleUp');
      if (!modal) return null;
      const title = modal.querySelector('h3');
      return title ? title.innerText.trim() : null;
    });
  }

  async function toggleChevron(buttonText) {
    return page.evaluate((text) => {
      const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes(text));
      const chevron = btn ? btn.querySelector('span[role="button"]') : null;
      if (chevron) {
        chevron.click();
        return true;
      }
      return false;
    }, buttonText);
  }

  console.log('======================================================================');
  console.log('  TEST 1: DIRECT CLICK ON "Master Architecture" IN HORIZONTAL STRIP');
  console.log('======================================================================');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Master Architecture'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  let title = await getModalTitle();
  console.log('Modal title:', title);
  if (!title || !title.includes('Master Relational System')) throw new Error('FAIL TEST 1');
  console.log('✅ TEST 1 PASSED: Direct ribbon click opens Master Architecture modal');
  await closeModal();

  console.log('\n======================================================================');
  console.log('  TEST 2: DIRECT CLICK ON "Cryptographic Forensics" IN HORIZONTAL STRIP');
  console.log('======================================================================');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Cryptographic Forensics'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  title = await getModalTitle();
  console.log('Modal title:', title);
  if (!title || !title.includes('Universal Immutable Audit Trail')) throw new Error('FAIL TEST 2');
  console.log('✅ TEST 2 PASSED: Direct ribbon click opens Cryptographic Forensics modal');
  await closeModal();

  console.log('\n======================================================================');
  console.log('  TEST 3: FLYOUT ITEM "Approved Degrees (AICTE / UGC / PCI)"');
  console.log('======================================================================');
  await toggleChevron('Master Architecture');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.animate-flyout button'));
    const item = items.find(b => b.innerText.includes('Approved Degrees'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 600));

  let activeTab = await getActiveModalTab();
  console.log('Active tab:', activeTab);
  if (!activeTab || !activeTab.includes('Degrees')) throw new Error('FAIL TEST 3');
  console.log('✅ TEST 3 PASSED: Opened directly to CBCS Master Degrees tab');
  await closeModal();

  console.log('\n======================================================================');
  console.log('  TEST 4: FLYOUT ITEM "Enterprise User Type Codes (1001-9001)"');
  console.log('======================================================================');
  await toggleChevron('Master Architecture');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.animate-flyout button'));
    const item = items.find(b => b.innerText.includes('Enterprise User Type'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 600));

  activeTab = await getActiveModalTab();
  console.log('Active tab:', activeTab);
  if (!activeTab || !activeTab.includes('User Type')) throw new Error('FAIL TEST 4');
  console.log('✅ TEST 4 PASSED: Opened directly to User Type Hierarchy tab');
  await closeModal();

  console.log('\n======================================================================');
  console.log('  TEST 5: FLYOUT ITEM "Statutory Document Types & MIME Rules"');
  console.log('======================================================================');
  await toggleChevron('Master Architecture');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.animate-flyout button'));
    const item = items.find(b => b.innerText.includes('Statutory Document Types'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 600));

  activeTab = await getActiveModalTab();
  console.log('Active tab:', activeTab);
  if (!activeTab || !activeTab.includes('Document')) throw new Error('FAIL TEST 5');
  console.log('✅ TEST 5 PASSED: Opened directly to Statutory Document Types tab');
  await closeModal();

  console.log('\n======================================================================');
  console.log('  TEST 6: FLYOUT ITEM "Immutable Audit Log Stream"');
  console.log('======================================================================');
  await toggleChevron('Cryptographic Forensics');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.animate-flyout button'));
    const item = items.find(b => b.innerText.includes('Immutable Audit Log Stream'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 600));

  title = await getModalTitle();
  console.log('Modal title:', title);
  if (!title || !title.includes('Universal Immutable Audit Trail')) throw new Error('FAIL TEST 6');
  console.log('✅ TEST 6 PASSED: Opened Cryptographic Forensics modal');
  await closeModal();

  console.log('\n======================================================================');
  console.log('  TEST 7: FLYOUT ITEM "Security & Actor Difference Forensics"');
  console.log('======================================================================');
  await toggleChevron('Cryptographic Forensics');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.animate-flyout button'));
    const item = items.find(b => b.innerText.includes('Security & Actor Difference'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 600));

  title = await getModalTitle();
  console.log('Modal title:', title);
  if (!title || !title.includes('Universal Immutable Audit Trail')) throw new Error('FAIL TEST 7');
  console.log('✅ TEST 7 PASSED: Opened Cryptographic Forensics modal');
  await closeModal();

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('  🏆 ALL 7/7 RIBBON & FLYOUT TESTS PASSED WITH 100% SUCCESS!');
  console.log('══════════════════════════════════════════════════════════════════════');
  await browser.close();
})();
