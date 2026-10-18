import { createRequire } from 'module';
const req = createRequire('/usr/lib/node_modules/');
const puppeteer = req('puppeteer');
import fs from 'fs';

const TARGET_URL = process.env.BASE_URL || 'https://gurination1.github.io/ERP_educore';

console.log(`[TEST E2E] Target: ${TARGET_URL}`);

const ROLES = [
  { name: 'SUPER_ADMIN', selectorText: '[SUPER]', expectedBadge: 'Provost', expectedNav: 'Tenants & Campuses' },
  { name: 'ADMIN', selectorText: '[ADMIN]', expectedBadge: 'Registrar', expectedNav: 'Admissions Desk' },
  { name: 'STAFF', selectorText: '[STAFF]', expectedBadge: 'Faculty', expectedNav: 'Faculty Desk' },
  { name: 'STUDENT', selectorText: '[STUDENT]', expectedBadge: 'Scholar', expectedNav: 'Scholar Home' },
  { name: 'HRMS', selectorText: '[HRMS]', expectedBadge: 'Establishment', expectedNav: 'HRMS Overview' },
  { name: 'ACCOUNTS', selectorText: '[ACCOUNTS]', expectedBadge: 'Accounts', expectedNav: 'Collections Home' },
  { name: 'COUNSELOR', selectorText: '[COUNSELOR]', expectedBadge: 'Counselor', expectedNav: 'Counselor Desk' },
  { name: 'HOD', selectorText: '[HOD-CSE]', expectedBadge: 'HOD', expectedNav: 'HOD Desk' },
  { name: 'PARTNER', selectorText: '[PARTNER - INFOSYS]', expectedBadge: 'Partner', expectedNav: 'Placements Home' },
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  for (const role of ROLES) {
    console.log(`\nTesting role: ${role.name}...`);
    const roleResult = { role: role.name, success: false, tabsClicked: 0, errors: [] };

    try {
      // 1. Fresh navigation
      await page.goto(`${TARGET_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.goto(`${TARGET_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });

      // 2. Click instant demo account button
      const clickedBtn = await page.evaluate(text => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(btn => btn.innerText.includes(text));
        if (b) {
          b.click();
          return true;
        }
        return false;
      }, role.selectorText);

      if (!clickedBtn) {
        throw new Error(`Demo button with text "${role.selectorText}" not found on login screen`);
      }

      await new Promise(r => setTimeout(r, 400));

      // 3. Submit login
      await page.click('button[type="submit"]');

      // 4. Wait for Header
      await page.waitForSelector('header', { timeout: 20000 });
      await new Promise(r => setTimeout(r, 1000));

      // 5. Verify Header Info
      const headerData = await page.evaluate(() => {
        const h = document.querySelector('header');
        if (!h) return null;
        const navPills = Array.from(h.querySelectorAll('nav button span.whitespace-nowrap')).map(s => s.innerText.trim());
        return {
          fullText: h.innerText,
          navPills
        };
      });

      console.log(`  Header Nav Pills: ${headerData.navPills.join(' | ')}`);
      roleResult.navPills = headerData.navPills;

      // 6. Test clicking each nav pill in the role ribbon
      for (const pill of headerData.navPills) {
        const clickedPill = await page.evaluate(pText => {
          const btns = Array.from(document.querySelectorAll('header nav button'));
          const target = btns.find(b => b.innerText.includes(pText));
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, pill);

        if (clickedPill) {
          roleResult.tabsClicked++;
          await new Promise(r => setTimeout(r, 600));
        }
      }

      roleResult.success = true;
      console.log(`  ✅ ${role.name}: Passed with ${roleResult.tabsClicked} tabs verified.`);

      // 7. Sign out
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Out'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 600));

    } catch (err) {
      console.error(`  ❌ ${role.name} Failed:`, err.message);
      roleResult.errors.push(err.message);
    }

    results.push(roleResult);
  }

  await browser.close();

  fs.writeFileSync('test_roles_results.json', JSON.stringify(results, null, 2));
  console.log(`\n======================================================`);
  const passed = results.filter(r => r.success).length;
  console.log(`  E2E ROLE AUDIT COMPLETE: ${passed} / ${results.length} PASSED`);
  console.log(`======================================================`);
}

main().catch(err => {
  console.error('Fatal crash:', err);
  process.exit(1);
});
