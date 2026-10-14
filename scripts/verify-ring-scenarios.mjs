import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const snapshot = JSON.parse(await readFile(process.argv[2], 'utf8'));
const original = snapshot.rows?.[0]?.content;
if (!original) throw new Error('Saved content snapshot missing.');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const server = await createServer({ root: resolve(import.meta.dirname, '..'), server: { host: '127.0.0.1', port: 5199, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function fixturePage(content, width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390 });
  await context.route('**/rest/v1/portfolio_content*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: snapshot.rows[0].id, content }) }));
  await context.route('**/api/host/session', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"authenticated":false}' }));
  await context.route('**/api/content', route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5199', { waitUntil: 'domcontentloaded' });
  return { context, page, errors };
}

try {
  for (const count of [1, 2, 3, 5, 8, 12, 20, 24]) {
    const content = structuredClone(original);
    content.projects = Array.from({ length: count }, (_, index) => ({ ...structuredClone(original.projects[index % original.projects.length]), id: `ring-fixture-${count}-${index}`, title: `Exhibit ${index + 1}`, date: '2026', coverImage: index % 3 ? '' : original.projects.find(item => item.coverImage)?.coverImage || '', gallery: [] }));
    const width = count === 24 ? 390 : 1440;
    const { page, context, errors } = await fixturePage(content, width);
    const section = page.locator('#projects');
    const ring = section.locator('.ring-carousel');
    await ring.scrollIntoViewIfNeeded();
    await ring.locator('canvas').waitFor();
    assert(await ring.locator('.ring-accessible-list button').count() === count, `${count}: entry count mismatch`);
    assert(await section.locator('.carousel-indicators button').count() === (count > 1 ? count : 0), `${count}: indicator count mismatch`);
    const activeOwner = () => ring.locator('.ring-active-card').getAttribute('data-ring-owner');
    assert(await activeOwner() === content.projects[0].id, `${count}: wrong initial item`);
    assert(await ring.locator('.ring-active-card .collection-card').evaluate(element => getComputedStyle(element).backgroundColor === 'rgb(17, 24, 35)'), `${count}: center card is not opaque`);
    if (count > 1) {
      await section.getByRole('button', { name: 'Previous project', exact: true }).click();
      assert(await activeOwner() === content.projects.at(-1).id, `${count}: reverse wrap failed`);
      await section.getByRole('button', { name: 'Next project', exact: true }).click();
      assert(await activeOwner() === content.projects[0].id, `${count}: forward wrap failed`);
      await ring.focus();
      for (let index = 1; index < count; index++) {
        await page.keyboard.press('ArrowRight');
        assert(await activeOwner() === content.projects[index].id, `${count}: card ${index + 1} could not reach center`);
      }
      await page.keyboard.press('Home');
      assert(await activeOwner() === content.projects[0].id, `${count}: keyboard Home did not restore first card`);
    }
    if (count === 5) {
      await page.waitForTimeout(250);
      await ring.scrollIntoViewIfNeeded();
      const box = await ring.locator('.ring-active-card .collection-cover').boundingBox();
      const beforeFrame = await ring.locator('canvas').screenshot();
      await page.mouse.move(box.x + box.width * .7, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .2, box.y + box.height * .5, { steps: 8 });
      assert(await ring.evaluate(element => element.classList.contains('is-dragging')), 'mouse drag did not enter continuous rotation');
      assert(await activeOwner() === content.projects[0].id, 'mouse drag changed selection before release');
      const duringFrame = await ring.locator('canvas').screenshot();
      assert(Buffer.compare(beforeFrame, duringFrame) !== 0, '3D scene did not redraw while dragging');
      await ring.screenshot({ path: resolve(import.meta.dirname, '../artifacts/ring-live-drag-5-1440.png') });
      await page.mouse.up();
      assert(await activeOwner() === content.projects[1].id, 'mouse drag did not rotate to next card');
      assert(await page.locator('.detail-only-modal').count() === 0, 'mouse drag opened details');
      const ringBox = await ring.boundingBox();
      const orbitY = ringBox.y + ringBox.height * .24;
      await page.mouse.move(ringBox.x + ringBox.width * .8, orbitY);
      await page.mouse.down();
      await page.mouse.move(ringBox.x + ringBox.width * .2, orbitY, { steps: 12 });
      await page.mouse.up();
      assert(await activeOwner() === content.projects[4].id, 'long drag did not cross multiple ring positions');
    }
    if (count === 24) {
      await page.waitForTimeout(250);
      await ring.scrollIntoViewIfNeeded();
      const box = await ring.locator('.ring-active-card .collection-cover').boundingBox();
      const client = await context.newCDPSession(page);
      const point = (x, y) => [{ x, y, id: 1 }];
      const y = Math.round(box.y + box.height * .5);
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(Math.round(box.x + box.width * .8), y) });
      for (const fraction of [.65, .5, .35, .2]) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(Math.round(box.x + box.width * fraction), y) });
      assert(await ring.evaluate(element => element.classList.contains('is-dragging')), 'touch swipe did not rotate continuously');
      const touchBounds = await ring.boundingBox();
      assert(touchBounds && touchBounds.y < 844 && touchBounds.y + touchBounds.height > 0, 'touch drag scrolled the carousel out of view');
      await page.screenshot({ path: resolve(import.meta.dirname, '../artifacts/ring-live-touch-24-390.png') });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert(await activeOwner() === content.projects[1].id, 'touch swipe did not rotate to next card');
      assert(await page.locator('.detail-only-modal').count() === 0, 'touch swipe opened details');
    }
    await section.getByRole('button', { name: /View All \(/ }).click();
    assert(await section.locator('.is-grid-view .collection-entry').count() === count, `${count}: archive missing records`);
    await section.getByRole('button', { name: /Carousel View/ }).click();
    await ring.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    assert(!horizontalOverflow, `${count}: horizontal overflow`);
    await ring.screenshot({ path: resolve(import.meta.dirname, `../artifacts/ring-count-${count}-${width}.png`) });
    assert(!errors.length, `${count}: browser error ${errors.join(' | ')}`);
    console.log(`${count} cards at ${width}px: opaque center, every card focusable, 360 wrap, archive, no page overflow PASS`);
    await context.close();
  }

  const content = structuredClone(original);
  const svg = color => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${color}"/></svg>`)}`;
  content.competitions[0].gallery = [{ id: 'competition-fixture-1', src: svg('#bb8866'), hidden: false }, { id: 'competition-fixture-2', src: svg('#6688bb'), hidden: false }];
  const { page, context, errors } = await fixturePage(content);
  for (const [sectionId, item, position] of [['projects', content.projects[2], 2], ['competitions', content.competitions[0], 0]]) {
    const section = page.locator(`#${sectionId}`);
    const ring = section.locator('.ring-carousel');
    await ring.scrollIntoViewIfNeeded();
    await ring.locator('.ring-accessible-list button').nth(position).click();
    await ring.locator('.ring-active-card .gallery-link').click();
    const gallery = page.locator('.gallery-grid-modal');
    await gallery.waitFor();
    assert(await gallery.getAttribute('data-gallery-owner') === item.id, `${sectionId}: gallery owner mismatch`);
    const expected = item.gallery.filter(image => !image.hidden).length;
    assert(await gallery.locator('.gallery-photo-grid figure').count() === expected, `${sectionId}: gallery image count mismatch`);
    await gallery.getByRole('button', { name: 'Open image 1', exact: true }).click();
    const viewer = page.locator('.gallery-lightbox');
    await viewer.waitFor();
    await viewer.getByRole('button', { name: 'Next image' }).click();
    assert(await viewer.locator('.gallery-viewer-thumbnails .is-selected').count() === 1, `${sectionId}: image navigation failed`);
    await viewer.getByRole('button', { name: 'Zoom in' }).click();
    assert((await viewer.locator('.detail-stage img').getAttribute('style')).includes('scale(1.25)'), `${sectionId}: zoom failed`);
    await page.keyboard.press('Escape');
    await viewer.waitFor({ state: 'detached' });
    await gallery.getByRole('button', { name: 'Close gallery' }).click();
    await gallery.waitFor({ state: 'detached' });
    await ring.locator('.ring-active-card .card-open').click();
    const detail = page.locator('.detail-only-modal');
    await detail.waitFor();
    await detail.getByRole('button', { name: /View .* gallery/ }).click();
    await gallery.waitFor();
    await gallery.getByRole('button', { name: 'Back to details' }).click();
    await detail.waitFor();
    await detail.getByRole('button', { name: 'Close details' }).click();
    await detail.waitFor({ state: 'detached' });
    assert(await ring.locator('.ring-active-card').getAttribute('data-ring-owner') === item.id, `${sectionId}: selected card lost after modal`);
    console.log(`${sectionId}: direct gallery, ownership, image navigation, zoom, detail round-trip PASS`);
  }
  assert(!errors.length, `gallery: browser error ${errors.join(' | ')}`);
  await context.close();
} finally { await browser.close(); await server.close(); }
