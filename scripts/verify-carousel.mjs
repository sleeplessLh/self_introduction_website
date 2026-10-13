import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const snapshotPath = process.argv[2];
if (!snapshotPath) throw new Error('Pass the private saved-content snapshot path.');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const original = snapshot.rows?.[0]?.content;
if (!original) throw new Error('No saved content in snapshot.');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const root = resolve(import.meta.dirname, '..');
const server = await createServer({ root, server: { host: '127.0.0.1', port: 5196, strictPort: true } });
await server.listen();
let browser;
const report = [];
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const width of [1920, 1440, 1024, 768, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    await context.route('**/rest/v1/portfolio_content*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: snapshot.rows[0].id, content: original }) }));
    await context.route('**/api/host/session', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"authenticated":false}' }));
    await context.route('**/api/content', route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5196', { waitUntil: 'domcontentloaded' });
    await page.locator('#projects .collection-entry').first().waitFor();
    for (const [sectionId, records] of [['projects', original.projects], ['competitions', original.competitions]]) {
      const section = page.locator(`#${sectionId}`);
      await section.scrollIntoViewIfNeeded();
      const track = section.locator('.compact-list');
      assert(await track.locator('.collection-entry').count() === records.length, `${width} ${sectionId}: not all records rendered`);
      assert(await track.getAttribute('aria-roledescription') === 'carousel', `${width} ${sectionId}: carousel semantics missing`);
      if (records.length > 1) {
        await section.getByRole('button', { name: `Next ${sectionId === 'projects' ? 'project' : 'competition'}` }).click();
        await page.waitForTimeout(550);
        assert(await track.locator('.collection-entry.is-active').count() === 1, `${width} ${sectionId}: no active card after Next`);
        assert(await track.locator('.collection-entry').nth(1).evaluate(el => el.classList.contains('is-active')), `${width} ${sectionId}: Next did not advance`);
        await section.getByRole('button', { name: `Previous ${sectionId === 'projects' ? 'project' : 'competition'}` }).click();
        await page.waitForTimeout(550);
        assert(await track.locator('.collection-entry').first().evaluate(el => el.classList.contains('is-active')), `${width} ${sectionId}: Previous did not return`);
        await track.focus();
        await page.keyboard.press('End');
        await page.waitForTimeout(550);
        assert(await track.locator('.collection-entry').last().evaluate(el => el.classList.contains('is-active')), `${width} ${sectionId}: End key did not select last card`);
        await page.keyboard.press('Home');
        await page.waitForTimeout(550);
        assert(await track.locator('.collection-entry').first().evaluate(el => el.classList.contains('is-active')), `${width} ${sectionId}: Home key did not select first card`);
        if (width >= 1024) {
          const box = await track.boundingBox();
          await page.mouse.move(box.x + box.width * .55, box.y + box.height * .5);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * .22, box.y + box.height * .5, { steps: 8 });
          await page.mouse.up();
          await page.waitForTimeout(550);
          assert(await page.locator('.detail-only-modal,.gallery-grid-modal').count() === 0, `${width} ${sectionId}: drag accidentally opened a card`);
          assert(!(await track.locator('.collection-entry').first().evaluate(el => el.classList.contains('is-active'))), `${width} ${sectionId}: mouse drag did not advance`);
          await track.locator('.collection-entry.is-active .card-open').click();
          const afterDragDetail = page.locator('.detail-only-modal');
          await afterDragDetail.waitFor();
          await afterDragDetail.getByRole('button', { name: 'Close details' }).click();
          await afterDragDetail.waitFor({ state: 'detached' });
        }
        if (width === 390) {
          const box = await track.boundingBox();
          const client = await context.newCDPSession(page);
          const point = (x, y) => [{ x, y, id: 1 }];
          const y = Math.round(box.y + box.height * .5);
          const startX = Math.round(box.x + box.width * .78);
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(startX, y) });
          for (const fraction of [.63, .48, .33, .18]) {
            await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(Math.round(box.x + box.width * fraction), y) });
            await page.waitForTimeout(45);
          }
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await page.waitForTimeout(650);
          assert(!(await track.locator('.collection-entry').first().evaluate(el => el.classList.contains('is-active'))), `${width} ${sectionId}: touch swipe did not advance`);
        }
      }
      const focusedBeforeArchive = await track.locator('.collection-entry.is-active').evaluate(el => [...el.parentElement.children].indexOf(el));
      await section.getByRole('button', { name: /View All \(/ }).click();
      assert(await track.evaluate(el => el.classList.contains('is-grid-view')), `${width} ${sectionId}: View All did not switch to grid`);
      assert(await track.locator('.collection-entry').count() === records.length, `${width} ${sectionId}: View All lost records`);
      await section.getByRole('button', { name: /Carousel View/ }).click();
      assert(await track.evaluate(el => el.classList.contains('is-carousel-view')), `${width} ${sectionId}: Carousel View did not return`);
      await page.waitForTimeout(250);
      assert(await track.locator('.collection-entry').nth(focusedBeforeArchive).evaluate(el => el.classList.contains('is-active')), `${width} ${sectionId}: Carousel View lost the prior position`);
      const galleryIndex = records.findIndex(item => (item.gallery || []).some(image => typeof image === 'string' || !image.hidden));
      if (galleryIndex >= 0) {
        await section.getByRole('button', { name: /View All \(/ }).click();
        const galleryOpener = track.locator('.collection-entry').nth(galleryIndex).locator('.gallery-link');
        await galleryOpener.click();
        const gallery = page.locator('.gallery-grid-modal');
        await gallery.waitFor();
        assert(await gallery.getAttribute('data-gallery-owner') === records[galleryIndex].id, `${width} ${sectionId}: gallery owner mismatch`);
        assert(await gallery.locator('.gallery-photo-grid figure').count() > 0, `${width} ${sectionId}: direct gallery has no images`);
        await gallery.getByRole('button', { name: 'Close gallery' }).click();
        await gallery.waitFor({ state: 'detached' });
        await page.waitForTimeout(40);
        assert(await galleryOpener.evaluate(el => document.activeElement === el), `${width} ${sectionId}: closing gallery did not restore keyboard focus`);
      }
      const detailOpener = track.locator('.collection-entry').first().locator('.card-open');
      await detailOpener.click();
      const detail = page.locator('.detail-only-modal');
      await detail.waitFor();
      assert(await detail.locator('h2').count() > 0, `${width} ${sectionId}: detail title missing`);
      await detail.getByRole('button', { name: 'Close details' }).click();
      await detail.waitFor({ state: 'detached' });
      await page.waitForTimeout(40);
      assert(await detailOpener.evaluate(el => document.activeElement === el), `${width} ${sectionId}: closing details did not restore keyboard focus`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 2, `${width} ${sectionId}: horizontal overflow`);
    }
    assert(errors.length === 0, `${width}: browser errors: ${errors.join(' | ')}`);
    report.push({ width, projects: original.projects.length, competitions: original.competitions.length, errors });
    await context.close();
  }
  for (const count of [1, 2]) {
    const content = { ...original, projects: original.projects.slice(0, count), competitions: original.competitions.slice(0, count) };
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.route('**/rest/v1/portfolio_content*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: snapshot.rows[0].id, content }) }));
    await context.route('**/api/host/session', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"authenticated":false}' }));
    await context.route('**/api/content', route => route.abort());
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5196', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(expected => document.querySelectorAll('#projects .collection-entry').length === expected && document.querySelectorAll('#competitions .collection-entry').length === expected, count);
    for (const id of ['projects', 'competitions']) {
      const section = page.locator(`#${id}`);
      await section.locator('.collection-entry').first().waitFor();
      assert(await section.locator('.collection-entry').count() === count, `${count} ${id}: wrong card count`);
      assert(await section.locator('.collection-entry.is-active').count() === 1, `${count} ${id}: active item missing`);
      if (count === 1) assert(await section.locator('.carousel-arrows button').count() === 2 && await section.locator('.carousel-arrows button:disabled').count() === 2, `${count} ${id}: single-item arrows must be disabled`);
      await section.getByRole('button', { name: /View All \(/ }).click();
      assert(await section.locator('.is-grid-view .collection-entry').count() === count, `${count} ${id}: grid omitted records`);
    }
    await context.close();
  }
  console.log(JSON.stringify(report, null, 2));
  console.log('Carousel, archive, direct gallery, detail, keyboard, and 1/2/many-item checks passed.');
} finally {
  await browser?.close();
  await server.close();
}
