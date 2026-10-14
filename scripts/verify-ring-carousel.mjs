import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const snapshotPath = process.argv[2];
if (!snapshotPath) throw new Error('Pass the private saved-content snapshot path.');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const content = snapshot.rows?.[0]?.content;
if (!content) throw new Error('Snapshot content missing.');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const server = await createServer({ root: resolve(import.meta.dirname, '..'), server: { host: '127.0.0.1', port: 5198, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1920, 1440, 1024, 768, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    await context.route('**/rest/v1/portfolio_content*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: snapshot.rows[0].id, content }) }));
    await context.route('**/api/host/session', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"authenticated":false}' }));
    await context.route('**/api/content', route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5198', { waitUntil: 'domcontentloaded' });
    for (const [sectionId, records, singular] of [['projects', content.projects, 'project'], ['competitions', content.competitions, 'competition']]) {
      const section = page.locator(`#${sectionId}`);
      const ring = section.locator('.ring-carousel');
      await ring.waitFor();
      await ring.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      if (width === 1440) {
        await ring.screenshot({ path: resolve(import.meta.dirname, `../artifacts/ring-initial-${sectionId}.png`) });
        console.log('Canvas diagnostics', sectionId, await ring.locator('canvas').evaluate(el => ({ width: el.width, height: el.height, css: getComputedStyle(el).cssText, rect: el.getBoundingClientRect().toJSON() })));
      }
      assert(await ring.locator('canvas').count() === 1, `${width} ${sectionId}: WebGL canvas absent`);
      assert(await ring.locator('.ring-active-card').count() === 1, `${width} ${sectionId}: active DOM card absent`);
      assert((await ring.locator('.ring-active-card').getAttribute('data-ring-owner')) === records[0].id, `${width} ${sectionId}: wrong initial card`);
      await section.getByRole('button', { name: `Next ${singular}`, exact: true }).click();
      await page.waitForTimeout(600);
      assert((await ring.locator('.ring-active-card').getAttribute('data-ring-owner')) === records[1].id, `${width} ${sectionId}: Next failed`);
      await section.getByRole('button', { name: `Previous ${singular}`, exact: true }).click();
      assert((await ring.locator('.ring-active-card').getAttribute('data-ring-owner')) === records[0].id, `${width} ${sectionId}: Previous failed`);
      await ring.focus();
      await page.keyboard.press('End');
      assert((await ring.locator('.ring-active-card').getAttribute('data-ring-owner')) === records.at(-1).id, `${width} ${sectionId}: End failed`);
      await section.getByRole('button', { name: `Next ${singular}`, exact: true }).click();
      assert((await ring.locator('.ring-active-card').getAttribute('data-ring-owner')) === records[0].id, `${width} ${sectionId}: 360 wrap failed`);
      await section.getByRole('button', { name: /View All \(/ }).click();
      assert(await section.locator('.is-grid-view .collection-entry').count() === records.length, `${width} ${sectionId}: View All lost records`);
      await section.getByRole('button', { name: /Carousel View/ }).click();
      await ring.waitFor();
      const activeBounds = await ring.locator('.ring-active-card').boundingBox();
      const ringBounds = await ring.boundingBox();
      assert(activeBounds && ringBounds && activeBounds.width >= 160 && activeBounds.x >= ringBounds.x - 4 && activeBounds.x + activeBounds.width <= ringBounds.x + ringBounds.width + 4, `${width} ${sectionId}: active card unreadable or clipped ${JSON.stringify(activeBounds)}`);
      await ring.locator('canvas').waitFor();
      await page.waitForTimeout(500);
      await ring.screenshot({ path: resolve(import.meta.dirname, `../artifacts/ring-${sectionId}-${width}.png`) });
    }
    assert(!errors.length, `${width}: browser errors: ${errors.join(' | ')}`);
    console.log(`${width}px: 3D project and competition ring controls, archive, and card bounds PASS`);
    await context.close();
  }
} finally { await browser.close(); await server.close(); }
