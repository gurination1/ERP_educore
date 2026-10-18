import { createRequire } from 'module';
const req = createRequire('/usr/lib/node_modules/');
const puppeteer = req('puppeteer');
import fs from 'fs';

const TARGET_URL = process.env.BASE_URL || 'https://gurination1.github.io/ERP_educore';

console.log(`[DEEP ROLE & CLICKS AUDIT] Target: ${TARGET_URL}`);

const ROLES = [
  { name: 'SUPER_ADMIN', selectorText: '[SUPER]', expectedBadge: 'Provost' },
  { name: 'ADMIN', selectorText: '[ADMIN]', expectedBadge: 'Registrar' },
  { name: 'STAFF', selectorText: '[STAFF]', expectedBadge: 'Faculty' },
  { name: 'STUDENT', selectorText: '[STUDENT]', expectedBadge: 'Scholar' },
  { name: 'HRMS', selectorText: '[HRMS]', expectedBadge: 'Establishment' },
  { name: 'ACCOUNTS', selectorText: '[ACCOUNTS]', expectedBadge: 'Accounts' },
  { name: 'COUNSELOR', selectorText: '[COUNSELOR]', expectedBadge: 'Counselor' },
  { name: 'HOD', selectorText: '[HOD-CSE]', expectedBadge: 'HOD' },
  { name: 'PARTNER', selectorText: '[PARTNER - INFOSYS]', expectedBadge: 'Partner' },
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('pageerror', err => {
    console.error(`  [PAGE ERROR DETECTED]: ${err.message}`);
  });

  const results = [];

  for (const role of ROLES) {
    console.log(`\n======================================================`);
    console.log(`🔍 AUDITING ROLE: ${role.name}`);
    console.log(`======================================================`);

    const roleResult = {
      role: role.name,
      success: false,
      headerPillsClicked: 0,
      sidebarItemsClicked: 0,
      subviewsTested: 0,
      errors: []
    };

    try {
      // 1. Fresh navigation
      await page.goto(`${TARGET_URL}/`, { waitUntil: 'networkidle2', timeout: 35000 });
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.goto(`${TARGET_URL}/`, { waitUntil: 'networkidle2', timeout: 35000 });

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
        throw new Error(`Demo button "${role.selectorText}" not found on login screen`);
      }

      await new Promise(r => setTimeout(r, 400));

      // 3. Submit login
      await page.click('button[type="submit"]');

      // 4. Wait for Header
      await page.waitForSelector('header', { timeout: 20000 });
      await new Promise(r => setTimeout(r, 1200));

      // Check for immediate safeguard
      let bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('RUNTIME SAFEGUARD') || bodyText.includes('slice')) {
        throw new Error(`Runtime safeguard crashed immediately on dashboard load: ${bodyText.slice(0, 300)}`);
      }

      // 5. Audit all Header Ribbon Nav Pills
      const navPills = await page.evaluate(() => {
        const h = document.querySelector('header');
        if (!h) return [];
        return Array.from(h.querySelectorAll('nav button span.whitespace-nowrap')).map(s => s.innerText.trim());
      });

      console.log(`  Header Nav Pills (${navPills.length}): ${navPills.join(' | ')}`);

      for (const pill of navPills) {
        const clicked = await page.evaluate(pText => {
          const btns = Array.from(document.querySelectorAll('header nav button'));
          const target = btns.find(b => b.innerText.includes(pText));
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, pill);

        if (clicked) {
          roleResult.headerPillsClicked++;
          await new Promise(r => setTimeout(r, 600));

          // Verify no error boundary
          const checkText = await page.evaluate(() => document.body.innerText);
          if (checkText.includes('RUNTIME SAFEGUARD') || checkText.includes("reading 'slice'")) {
            throw new Error(`Runtime safeguard triggered after clicking Header Pill "${pill}"`);
          }
        }
      }

      // 6. Audit all Sidebar Navigation Items
      const sidebarItemLabels = await page.evaluate(() => {
        const sidebar = document.querySelector('aside#educore-sidebar') || document.querySelector('aside');
        if (!sidebar) return [];
        return Array.from(sidebar.querySelectorAll('nav button')).map(b => b.innerText.trim());
      });

      console.log(`  Sidebar Nav Items (${sidebarItemLabels.length}): ${sidebarItemLabels.join(' | ')}`);

      for (const itemLabel of sidebarItemLabels) {
        const clicked = await page.evaluate(lbl => {
          const sidebar = document.querySelector('aside#educore-sidebar') || document.querySelector('aside');
          if (!sidebar) return false;
          const btns = Array.from(sidebar.querySelectorAll('nav button'));
          const target = btns.find(b => b.innerText.trim() === lbl);
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, itemLabel);

        if (clicked) {
          roleResult.sidebarItemsClicked++;
          await new Promise(r => setTimeout(r, 700));

          // Verify no error boundary
          const checkText = await page.evaluate(() => document.body.innerText);
          if (checkText.includes('RUNTIME SAFEGUARD') || checkText.includes("reading 'slice'")) {
            throw new Error(`Runtime safeguard triggered after clicking Sidebar Item "${itemLabel}"`);
          }
        }
      }

      // 7. Test Subview interactions if applicable
      // Test direct navigation to crucial paths
      const pathsToTest = ['/student-documents', '/teacher-documents', '/bulk-import', '/tenants', '/enquiries', '/fees', '/academics'];
      for (const path of pathsToTest) {
        // Only test if not 403 redirected to dashboard
        await page.evaluate(p => {
          window.location.hash = p;
        }, path);
        await new Promise(r => setTimeout(r, 400));
        const checkText = await page.evaluate(() => document.body.innerText);
        if (checkText.includes('RUNTIME SAFEGUARD') || checkText.includes("reading 'slice'")) {
          throw new Error(`Runtime safeguard triggered on route ${path}`);
        }
        roleResult.subviewsTested++;
      }

      roleResult.success = true;
      console.log(`  ✅ ${role.name}: Passed 100% cleanly! Header pills: ${roleResult.headerPillsClicked}, Sidebar items: ${roleResult.sidebarItemsClicked}`);

      // 8. Sign out
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Out'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 600));

    } catch (err) {
      console.error(`  ❌ ${role.name} FAILED:`, err.message);
      roleResult.errors.push(err.message);
    }

    results.push(roleResult);
  }

  await browser.close();

  fs.writeFileSync('test_deep_roles_results.json', JSON.stringify(results, null, 2));

  console.log(`\n======================================================`);
  const passed = results.filter(r => r.success).length;
  console.log(`  DEEP ROLE & CLICKS AUDIT RESULT: ${passed} / ${results.length} PASSED`);
  console.log(`======================================================\n`);

  if (passed !== results.length) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal crash in deep audit:', err);
  process.exit(1);
});
