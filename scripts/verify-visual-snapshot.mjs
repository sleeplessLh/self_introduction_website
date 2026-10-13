import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const path = process.argv[2];
if (!path) throw new Error('Pass the private saved-content snapshot path.');
const snapshot = JSON.parse(await readFile(path, 'utf8'));
const content = snapshot.rows?.[0]?.content;
if (!content) throw new Error('Snapshot has no portfolio content.');
const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'artifacts', 'final-qa');
await mkdir(output, { recursive: true });
const server = await createServer({ root, server: { host: '127.0.0.1', port: 5195, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = {};
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, isMobile: width === 390, hasTouch: width === 390 });
    await context.route('**/rest/v1/portfolio_content*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: snapshot.rows[0].id, content }) }));
    await context.route('**/api/host/session', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"authenticated":false}' }));
    await context.route('**/api/content', route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5195', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(expected => document.querySelectorAll('#projects .collection-card').length === expected, content.projects.length, { timeout: 30000 });
    report[width] = { sections: {}, errors };
    for (const id of ['home', 'about', 'education', 'skills', 'projects', 'competitions', 'learning', 'strengths', 'contact']) {
      const section = page.locator(`#${id}`);
      if (await section.count() !== 1) throw new Error(`${width}: ${id} section missing`);
      const bounds = await section.evaluate(element => ({ top: element.getBoundingClientRect().top + scrollY, height: element.getBoundingClientRect().height }));
      for (let y = bounds.top; y <= bounds.top + bounds.height; y += Math.round((width === 390 ? 844 : 900) * .65)) {
        await page.evaluate(position => scrollTo(0, position), y);
        await page.waitForTimeout(90);
      }
      await page.waitForTimeout(700);
      const metrics = await section.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const heading = element.querySelector('h1,h2');
        const headingRect = heading?.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height), headingVisible: !heading || (headingRect.width > 0 && headingRect.height > 0), overflow: document.documentElement.scrollWidth - innerWidth };
      });
      if (!metrics.headingVisible || metrics.overflow > 2) throw new Error(`${width}: ${id} heading invisible or horizontal overflow: ${JSON.stringify(metrics)}`);
      if (id === 'projects' || id === 'competitions') {
        const clipped = await section.evaluate(element => [...element.querySelectorAll('.collection-entry:not(.is-collapsed)')].some(entry => entry.getBoundingClientRect().bottom + 2 < entry.querySelector('.collection-card').getBoundingClientRect().bottom));
        if (clipped) throw new Error(`${width}: ${id} card content exceeds its entry container`);
      }
      report[width].sections[id] = metrics;
      const imageBounds = await section.evaluate(element => { const rect = element.getBoundingClientRect(); return { x: Math.max(0, rect.x + scrollX), y: Math.max(0, rect.y + scrollY), width: rect.width, height: rect.height }; });
      await page.screenshot({ path: resolve(output, `${id}-${width}.png`), clip: imageBounds, fullPage: true, animations: 'disabled' });
    }
    await page.locator('#projects .collection-toggle').click();
    const imageHealth = await page.evaluate(async () => {
      const sources = [...document.querySelectorAll('main img')].map(image => image.currentSrc || image.src).filter(Boolean);
      const unique = [...new Set(sources)];
      const results = await Promise.all(unique.map(src => new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({ ok: image.naturalWidth > 0, src });
        image.onerror = () => resolve({ ok: false, src });
        image.src = src;
      })));
      return { checked: unique.length, broken: results.filter(result => !result.ok).length };
    });
    if (imageHealth.broken || errors.length) throw new Error(`${width}: ${imageHealth.broken} broken media or browser errors: ${errors.join(' | ')}`);
    report[width].imageHealth = imageHealth;
    await context.close();
  }
  console.log(JSON.stringify(report, null, 2));
  console.log('Saved-content visual and image-health checks passed.');
} finally {
  await browser?.close();
  await server.close();
}
