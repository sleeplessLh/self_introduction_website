import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const backupPath = process.argv[2];
if (!backupPath) throw new Error('Pass the absolute path to the read-only Supabase snapshot.');
const snapshot = JSON.parse(await readFile(backupPath, 'utf8'));
const content = snapshot.rows?.[0]?.content;
if (!content?.projects || !content?.competitions) throw new Error('Snapshot is missing project or competition records.');
const root = resolve(import.meta.dirname, '..');
const server = await createServer({ root, server: { host: '127.0.0.1', port: 5193, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/rest/v1/portfolio_content*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: snapshot.rows[0].id, content }) }));
  await context.route('**/api/host/session', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"authenticated":false}' }));
  await context.route('**/api/content', route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5193', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(expected => document.querySelectorAll('#projects .collection-card').length === expected, content.projects.filter(item => !item.hidden).length, { timeout: 30000 });
  const results = {};
  for (const [section, allRecords, kind] of [['projects', content.projects, 'project'], ['competitions', content.competitions, 'competition']]) {
    const records = allRecords.filter(item => !item.hidden);
    const cards = page.locator(`#${section} .collection-card`);
    if (await cards.count() !== records.length) throw new Error(`${section}: rendered card count differs from saved records`);
    if (records.length > 3) await page.locator(`#${section} .collection-toggle`).click();
    results[section] = [];
    for (let index = 0; index < records.length; index++) {
      await cards.nth(index).locator('.collection-cover').click();
      const detail = page.locator('.detail-only-modal');
      await detail.waitFor();
      await detail.getByRole('button', { name: new RegExp(`View ${kind} gallery`) }).click();
      const gallery = page.locator('.gallery-grid-modal');
      await gallery.waitFor();
      const owner = await gallery.getAttribute('data-gallery-owner');
      const visibleCount = (records[index].gallery || []).filter(image => !image.hidden).length;
      const actualCount = await gallery.locator('.gallery-photo-grid figure').count();
      if (actualCount !== visibleCount) throw new Error(`${section} ${index + 1}: expected ${visibleCount} visible images, found ${actualCount}`);
      if (visibleCount) {
        const imageHealth = await gallery.locator('.gallery-photo-grid img').evaluateAll(async images => Promise.all(images.map(async image => {
          await image.decode().catch(() => {});
          return { loaded: image.naturalWidth > 0 && image.naturalHeight > 0, portrait: image.naturalHeight > image.naturalWidth };
        })));
        if (imageHealth.some(image => !image.loaded)) throw new Error(`${section} ${index + 1}: saved gallery contains an image that cannot load`);
      }
      if (!visibleCount && await gallery.locator('.gallery-empty-state').count() !== 1) throw new Error(`${section} ${index + 1}: empty state missing`);
      results[section].push({ index: index + 1, owner, visibleImages: actualCount });
      await gallery.getByRole('button', { name: 'Close gallery' }).click();
      await gallery.waitFor({ state: 'detached' });
      await detail.getByRole('button', { name: 'Close details' }).click();
      await detail.waitFor({ state: 'detached' });
    }
    if (new Set(results[section].map(item => item.owner)).size !== records.length) throw new Error(`${section}: galleries do not have unique owners`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(results, null, 2));
  console.log('Read-only saved-content gallery checks passed.');
  await context.close();
} finally {
  await browser?.close();
  await server.close();
}
