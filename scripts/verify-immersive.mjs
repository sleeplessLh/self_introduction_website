import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'artifacts', 'immersive-redesign');
const baseUrl = 'http://127.0.0.1:5191';
const failures = [];
const results = {};
const expect = (condition, message) => { if (!condition) failures.push(message); };
const recordErrors = page => {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', request => {
    if (!request.url().includes('googleapis.com')) errors.push(`request: ${request.url()} — ${request.failure()?.errorText}`);
  });
  return errors;
};
const waitForContent = async (page, { requireExpandedLearning = false } = {}) => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#projects .collection-card').first().waitFor({ timeout: 30000 });
  if (requireExpandedLearning) await page.locator('#learning .learning-toggle').waitFor({ timeout: 30000 });
  await page.waitForTimeout(500);
};

await mkdir(output, { recursive: true });
const server = await createServer({ root, server: { host: '127.0.0.1', port: 5191, strictPort: true } });
await server.listen();

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' });
  const desktop = await desktopContext.newPage();
  const desktopErrors = recordErrors(desktop);
  await waitForContent(desktop, { requireExpandedLearning: true });

  const counts = await desktop.evaluate(() => ({
    projects: document.querySelectorAll('#projects .collection-card').length,
    competitions: document.querySelectorAll('#competitions .collection-card').length,
    education: document.querySelectorAll('#education .education-stage').length,
    skillGroups: document.querySelectorAll('#skills .skill-group').length,
    skills: document.querySelectorAll('#skills .skill-items > li').length,
    about: document.querySelectorAll('#about .about-item-list article').length,
    learningCollapsed: document.querySelectorAll('#learning .learning-item').length,
    strengths: document.querySelectorAll('#strengths .strength-grid article').length,
    canvas: document.querySelectorAll('.spatial-experience canvas').length,
    webgl: Boolean(document.querySelector('.spatial-experience canvas')?.getContext('webgl2')),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    overflowElements: [...document.querySelectorAll('body *')].map(element => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, className: String(element.className || '').slice(0, 100), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
    }).filter(rect => rect.right > window.innerWidth + 2 || rect.left < -2).slice(0, 12),
    scrollContainers: [...document.querySelectorAll('html, body, #root, body *')].map(element => ({ tag: element.tagName, className: String(element.className || '').slice(0, 70), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth })).filter(item => item.scrollWidth > item.clientWidth + 2).slice(0, 20),
  }));
  Object.assign(results, { desktop: counts });
  expect(counts.projects > 0, 'Projects did not render.');
  expect(counts.competitions > 0, 'Competitions did not render.');
  expect(counts.education > 0, 'Education entries did not render.');
  expect(counts.skillGroups > 0 && counts.skills > 0, 'Skill groups or skill names did not render.');
  expect(counts.about > 0, 'Published About entries did not render.');
  expect(counts.learningCollapsed > 0, 'Collapsed Learning entries did not render.');
  expect(counts.strengths > 0, 'Strengths did not render.');
  expect(counts.canvas === 1 && counts.webgl, 'The WebGL canvas did not initialize on desktop.');
  expect(counts.overflow <= 2, `Desktop horizontal overflow is ${counts.overflow}px.`);

  await desktop.screenshot({ path: resolve(output, 'desktop-hero.png') });
  await desktop.locator('#education').scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(450);
  await desktop.screenshot({ path: resolve(output, 'desktop-education.png') });
  await desktop.locator('#projects').scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(450);
  await desktop.screenshot({ path: resolve(output, 'desktop-projects.png') });

  const galleryEntry = desktop.locator('#projects .ring-accessible-list button').filter({ hasText: 'gallery images' }).first();
  let galleryImages = 0;
  let galleryEmpty = false;
  if (await galleryEntry.count()) {
    await galleryEntry.click();
    await desktop.locator('#projects .gallery-link').click();
    await desktop.locator('.gallery-grid-modal').waitFor();
    galleryImages = await desktop.locator('.gallery-photo-grid figure').count();
    expect(galleryImages > 0, 'The selected project gallery has no images.');
    await desktop.locator('.gallery-grid-modal > .detail-close').click();
    await desktop.locator('.gallery-grid-modal').waitFor({ state: 'detached' });
  } else {
    galleryEmpty = await desktop.locator('#projects .gallery-empty-label').count() === 1;
    expect(galleryEmpty, 'An empty project gallery has no empty state.');
  }
  await desktop.locator('#projects .card-open').first().click();
  await desktop.locator('.detail-only-modal').waitFor();
  await desktop.locator('.detail-only-modal > .detail-close').click();
  await desktop.locator('.detail-only-modal').waitFor({ state: 'detached' });

  await desktop.locator('#learning').scrollIntoViewIfNeeded();
  const learningToggle = desktop.locator('#learning .learning-toggle');
  await learningToggle.click();
  const learningExpanded = await desktop.locator('#learning .learning-item').count();
  results.learningExpanded = learningExpanded;
  expect(learningExpanded >= counts.learningCollapsed, 'Expanding Learning removed visible entries.');

  await desktop.keyboard.press('Control+Shift+E');
  await desktop.locator('.host-dialog').waitFor();
  const layers = await desktop.evaluate(() => ({
    spatial: Number.parseInt(getComputedStyle(document.querySelector('.spatial-experience')).zIndex, 10),
    host: Number.parseInt(getComputedStyle(document.querySelector('.host-dialog')).zIndex, 10),
  }));
  results.layers = layers;
  expect(layers.host > layers.spatial, `Host dialog z-index ${layers.host} is not above WebGL ${layers.spatial}.`);
  await desktop.getByRole('button', { name: 'Close Host Access' }).click();

  await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await desktop.waitForTimeout(500);
  await desktop.locator('a[href="#projects"]').first().click();
  await desktop.waitForTimeout(350);
  expect(await desktop.evaluate(() => location.hash === '#projects'), 'Anchor navigation did not update to #projects.');
  for (let index = 0; index < 5; index += 1) await desktop.keyboard.press('Tab');
  const focusTag = await desktop.evaluate(() => document.activeElement?.tagName);
  expect(focusTag && focusTag !== 'BODY', 'Keyboard navigation did not produce a visible focus target.');
  expect(desktopErrors.length === 0, `Desktop browser errors: ${desktopErrors.join(' | ')}`);
  results.galleryImages = galleryImages;
  results.galleryEmpty = galleryEmpty;
  results.desktopErrors = desktopErrors;
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const mobile = await mobileContext.newPage();
  const mobileErrors = recordErrors(mobile);
  await waitForContent(mobile);
  const mobileMetrics = await mobile.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    canvas: document.querySelectorAll('.spatial-experience canvas').length,
    heroHeight: Math.round(document.querySelector('#home').getBoundingClientRect().height),
    portraitWidth: Math.round(document.querySelector('.hero-portrait-stage').getBoundingClientRect().width),
  }));
  results.mobile = mobileMetrics;
  expect(mobileMetrics.overflow <= 2, `Mobile horizontal overflow is ${mobileMetrics.overflow}px.`);
  expect(mobileMetrics.canvas === 1, 'Mobile adaptive WebGL canvas did not initialize.');
  expect(mobileMetrics.portraitWidth <= 280, `Mobile portrait is unexpectedly wide (${mobileMetrics.portraitWidth}px).`);
  await mobile.screenshot({ path: resolve(output, 'mobile-hero.png') });
  await mobile.locator('#education').scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(350);
  await mobile.screenshot({ path: resolve(output, 'mobile-education.png') });
  expect(mobileErrors.length === 0, `Mobile browser errors: ${mobileErrors.join(' | ')}`);
  results.mobileErrors = mobileErrors;
  await mobileContext.close();

  const reducedContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  const reducedErrors = recordErrors(reduced);
  await waitForContent(reduced);
  const reducedState = await reduced.evaluate(() => ({
    canvas: document.querySelectorAll('.spatial-experience canvas').length,
    content: Boolean(document.querySelector('#projects .collection-card')),
  }));
  results.reducedMotion = reducedState;
  expect(reducedState.content, 'Content disappeared under reduced-motion preference.');
  expect(reducedErrors.length === 0, `Reduced-motion browser errors: ${reducedErrors.join(' | ')}`);
  await reducedContext.close();
  await browser.close();

  const fallbackBrowser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-webgl', '--disable-webgl2'] });
  const fallbackPage = await fallbackBrowser.newPage({ viewport: { width: 1280, height: 800 } });
  const fallbackErrors = recordErrors(fallbackPage);
  await waitForContent(fallbackPage);
  const fallbackState = await fallbackPage.evaluate(() => ({
    fallback: document.querySelector('.spatial-experience')?.classList.contains('is-fallback'),
    canvas: document.querySelectorAll('.spatial-experience canvas').length,
    projects: document.querySelectorAll('#projects .collection-card').length,
  }));
  results.webglFallback = fallbackState;
  expect(fallbackState.fallback && fallbackState.canvas === 0, 'WebGL-disabled browser did not activate the CSS fallback.');
  expect(fallbackState.projects > 0, 'Essential content is unavailable without WebGL.');
  expect(fallbackErrors.length === 0, `Fallback browser errors: ${fallbackErrors.join(' | ')}`);
  await fallbackBrowser.close();
} finally {
  await browser?.close().catch(() => {});
  await server.close();
}

console.log(JSON.stringify(results, null, 2));
if (failures.length) {
  console.error(`\nImmersive acceptance failed (${failures.length}):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('\nImmersive acceptance passed.');
}
