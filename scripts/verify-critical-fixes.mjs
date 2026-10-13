import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'artifacts', 'critical-fixes');
const baseUrl = 'http://127.0.0.1:5192';
const widths = [1920, 1440, 1024, 768, 390];
const failures = [];
const results = {};
const expect = (condition, message) => { if (!condition) failures.push(message); };
// Stable, browser-local sample records keep UI regression tests independent of live CMS data.
const tinyPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
const fixtureContent = {
  schemaVersion: 12,
  navigation: [],
  projects: [
    { id: 'fixture-project-01', title: 'pAIcture', label: 'Product Engineering', date: '2026', coverImage: '/src/assets/images/project-one.svg', gallery: [{ id: 'fixture-image-01', src: tinyPngUrl, caption: 'First image' }, { id: 'fixture-image-02', src: tinyPngUrl, caption: 'Second image' }], description: 'A sample project for isolated browser testing.', technologies: [{ id: 'fixture-tag-01', label: 'React' }] },
    { id: 'fixture-project-02', title: 'PROJECT / TWO', label: 'Systems & Data', date: '2026', coverImage: '/src/assets/images/project-two.svg', gallery: [], description: 'A separate project with an empty gallery.', technologies: [] },
    { id: 'fixture-project-03', title: 'PROJECT / THREE', label: 'Experiment', date: '2026', coverImage: '/src/assets/images/project-three.svg', gallery: [], description: 'A third project for layout checks.', technologies: [] },
  ],
  competitions: [
    { id: 'fixture-competition-01', title: 'COMPETITION / ONE', label: 'Competition experience', date: '2026', coverImage: '/src/assets/images/project-one.svg', gallery: [{ id: 'fixture-competition-image-01', src: tinyPngUrl, caption: 'Competition image one' }, { id: 'fixture-competition-image-02', src: tinyPngUrl, caption: 'Competition image two' }], description: 'A sample competition for isolated browser testing.', achievement: 'Finalist', tags: [] },
    { id: 'fixture-competition-02', title: 'COMPETITION / TWO', label: 'Competition experience', date: '2026', coverImage: '/src/assets/images/project-two.svg', gallery: [], description: 'A separate competition with an empty gallery.', tags: [] },
  ],
};
const fixtureRow = content => ({ id: 'local-test-only', content });
const routeContentFixture = context => context.route('**/rest/v1/portfolio_content*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureRow(fixtureContent)) }));

await mkdir(output, { recursive: true });
const server = await createServer({ root, server: { host: '127.0.0.1', port: 5192, strictPort: true } });
await server.listen();
let browser;

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    await routeContentFixture(context);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('#projects .collection-card').first().waitFor({ timeout: 30000 });
    await page.locator('#learning').waitFor({ timeout: 30000 });

    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);
    const about = await page.evaluate(() => {
      const heading = document.querySelector('#about .about-intro h2').getBoundingClientRect();
      const bio = document.querySelector('#about .about-intro > p:last-child').getBoundingClientRect();
      return { headingTop: heading.top, headingBottom: heading.bottom, bioTop: bio.top, sceneFocus: document.querySelector('.spatial-experience').classList.contains('is-content-focus') };
    });
    expect(about.sceneFocus, `${width}: About 3D scene did not recede behind content`);
    if (width > 800) expect(Math.abs(about.headingTop - about.bioTop) < 18, `${width}: About heading and introduction do not share a row`);
    else expect(about.bioTop >= about.headingBottom - 2, `${width}: About mobile text overlaps the heading`);
    if (width === 1440 || width === 390) await page.screenshot({ path: resolve(output, `about-${width}.png`) });

    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    const skills = await page.evaluate(() => {
      const groups = [...document.querySelectorAll('#skills .skill-group')];
      return groups.map(group => {
        const title = group.querySelector('h3').getBoundingClientRect();
        const list = group.querySelector('.skill-items').getBoundingClientRect();
        return { titleRight: title.right, titleBottom: title.bottom, listLeft: list.left, listTop: list.top, groupRight: group.getBoundingClientRect().right };
      });
    });
    expect(skills.length >= 4, `${width}: Skills groups missing`);
    expect(skills.every(skill => skill.listTop >= skill.titleBottom - 2 && skill.listLeft < skill.groupRight), `${width}: Skills title/list collision or clipping`);
    if (width === 1440 || width === 390) await page.screenshot({ path: resolve(output, `skills-${width}.png`) });

    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    const sections = await page.evaluate(() => {
      const ids = ['skills', 'projects', 'competitions', 'learning'];
      return ids.map(id => ({ id, top: document.getElementById(id).getBoundingClientRect().top + scrollY, bottom: document.getElementById(id).getBoundingClientRect().bottom + scrollY }));
    });
    expect(sections.every((section, index) => index === 0 || section.top >= sections[index - 1].bottom - 2), `${width}: Section bounds overlap`);
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      cards: [...document.querySelectorAll('#projects .collection-card')].map(card => ({ left: card.getBoundingClientRect().left, right: card.getBoundingClientRect().right })),
      sceneFocus: document.querySelector('.spatial-experience').classList.contains('is-content-focus'),
      canvasPointerEvents: getComputedStyle(document.querySelector('.spatial-experience')).pointerEvents,
    }));
    expect(layout.overflow <= 2, `${width}: ${layout.overflow}px horizontal overflow`);
    expect(layout.cards.every(card => card.left >= -2 && card.right <= width + 2), `${width}: Project card clipped`);
    expect(layout.sceneFocus && layout.canvasPointerEvents === 'none', `${width}: 3D scene is not subordinate to Projects`);
    if (width === 1440 || width === 390) await page.screenshot({ path: resolve(output, `projects-${width}.png`) });

    await page.locator('#projects .collection-cover').first().click();
    const scrollBefore = await page.evaluate(() => scrollY);
    const detail = page.locator('.detail-only-modal');
    await detail.waitFor();
    await page.waitForTimeout(350);
    const detailState = await detail.evaluate(element => ({ parent: element.parentElement.tagName, position: getComputedStyle(element).position, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }));
    expect(detailState.parent === 'BODY' && detailState.position === 'fixed' && detailState.width >= width - 2, `${width}: Project detail is trapped in section layout`);
    const backdrop = await detail.evaluate(element => ({ blur: getComputedStyle(element).backdropFilter, background: getComputedStyle(element).backgroundColor, focusInside: element.contains(document.activeElement) }));
    expect(backdrop.blur.includes('blur(16px)') && backdrop.focusInside, `${width}: Detail frosted backdrop or keyboard focus is missing`);
    await page.keyboard.press('Shift+Tab');
    expect(await detail.evaluate(element => element.contains(document.activeElement)), `${width}: Detail keyboard focus escaped the dialog`);
    expect(await detail.getByRole('button', { name: /View project gallery/ }).count() === 1, `${width}: Gallery action missing from project details`);
    if (width === 1440 || width === 390) await page.screenshot({ path: resolve(output, `detail-${width}.png`) });
    await detail.getByRole('button', { name: /View project gallery/ }).click();
    const gallery = page.locator('.gallery-grid-modal');
    await gallery.waitFor();
    const firstOwner = await gallery.getAttribute('data-gallery-owner');
    const imageCount = await gallery.locator('.gallery-photo-grid figure').count();
    expect(imageCount >= 2, `${width}: Project 01 gallery images missing`);
    await gallery.getByRole('button', { name: /^Open image 1(?:\:|$)/ }).click();
    const lightbox = page.locator('.gallery-lightbox');
    await lightbox.waitFor();
    await page.keyboard.press('ArrowRight');
    expect(await lightbox.locator('.gallery-viewer-thumbnails button.is-selected').getAttribute('aria-label') === 'Select image 2', `${width}: Arrow navigation failed`);
    await lightbox.getByRole('button', { name: 'Select image 1', exact: true }).click();
    expect(await lightbox.locator('.gallery-viewer-thumbnails button.is-selected').getAttribute('aria-label') === 'Select image 1', `${width}: Thumbnail navigation failed`);
    await lightbox.getByRole('button', { name: 'Zoom in' }).click();
    expect(await lightbox.locator('.detail-stage img').evaluate(image => image.style.transform.includes('scale(1.25)')), `${width}: Image zoom failed`);
    await lightbox.getByRole('button', { name: 'Reset' }).click();
    if (width === 390) {
      const box = await lightbox.locator('.detail-stage img').boundingBox();
      await page.mouse.move(box.x + box.width * .7, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .25, box.y + box.height * .5, { steps: 5 });
      await page.mouse.up();
      expect(await lightbox.locator('.gallery-viewer-thumbnails button.is-selected').getAttribute('aria-label') === 'Select image 2', '390: Swipe navigation failed');
    }
    await page.keyboard.press('Escape');
    expect(await lightbox.count() === 0, `${width}: Escape did not close image viewer`);
    await gallery.getByRole('button', { name: 'Close gallery' }).click();
    await gallery.waitFor({ state: 'detached' });
    await detail.waitFor();
    expect(await detail.getByRole('button', { name: /View project gallery/ }).count() === 1, `${width}: Closing gallery did not return to project details`);
    await detail.getByRole('button', { name: 'Close details' }).click();
    await detail.waitFor({ state: 'detached' });
    const scrollAfter = await page.evaluate(() => scrollY);
    expect(Math.abs(scrollAfter - scrollBefore) < 5, `${width}: Closing gallery lost scroll position (${scrollBefore} → ${scrollAfter})`);

    await page.locator('#projects .collection-cover').nth(1).click();
    await page.locator('.detail-only-modal').getByRole('button', { name: /View project gallery/ }).click();
    await gallery.waitFor();
    const secondOwner = await gallery.getAttribute('data-gallery-owner');
    expect(secondOwner !== firstOwner, `${width}: Galleries share the same project owner`);
    expect(await gallery.locator('.gallery-empty-state').count() === 1, `${width}: Empty project gallery state missing`);
    await gallery.getByRole('button', { name: 'Close gallery' }).click();
    await gallery.waitFor({ state: 'detached' });
    await detail.waitFor();
    await detail.getByRole('button', { name: 'Close details' }).click();
    await detail.waitFor({ state: 'detached' });

    await page.locator('#competitions .collection-cover').first().click();
    await detail.waitFor();
    await detail.getByRole('button', { name: /View competition gallery/ }).click();
    await gallery.waitFor();
    const competitionOwner = await gallery.getAttribute('data-gallery-owner');
    expect(competitionOwner !== firstOwner && competitionOwner !== secondOwner, `${width}: Competition gallery owner overlaps a project`);
    expect(await gallery.locator('.gallery-photo-grid figure').count() === 2, `${width}: Competition gallery images missing`);
    await gallery.getByRole('button', { name: 'Back to details' }).click();
    await gallery.waitFor({ state: 'detached' });
    await detail.waitFor();
    await detail.getByRole('button', { name: 'Close details' }).click();
    await detail.waitFor({ state: 'detached' });
    await page.locator('#competitions .collection-cover').nth(1).click();
    await detail.getByRole('button', { name: /View competition gallery/ }).click();
    await gallery.waitFor();
    expect(await gallery.locator('.gallery-empty-state').count() === 1, `${width}: Empty competition gallery state missing`);
    await gallery.getByRole('button', { name: 'Close gallery' }).click();
    await detail.waitFor();
    await detail.getByRole('button', { name: 'Close details' }).click();
    await detail.waitFor({ state: 'detached' });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    const contactScene = await page.locator('.spatial-experience').evaluate(element => ({
      focused: element.classList.contains('is-content-focus'),
      opacity: Number(getComputedStyle(element).opacity),
    }));
    expect(contactScene.focused && contactScene.opacity <= .25, `${width}: Contact 3D scene obstructs the text`);
    expect(errors.length === 0, `${width}: Browser errors: ${errors.join(' | ')}`);
    results[width] = { skills: skills.length, about, projects: layout.cards.length, imageCount, independentGalleries: firstOwner !== secondOwner && competitionOwner !== firstOwner, detail: detailState, backdrop, contactScene, overflow: layout.overflow, errors };
    await context.close();
  }

  // Host integration is exercised against a browser-local API fixture. No save reaches production.
  let savedDraft = null;
  let mockSaves = 0;
  const hostContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await hostContext.route('**/api/host/session', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true }) }));
  await hostContext.route('**/api/content', async route => {
    savedDraft = JSON.parse(route.request().postData()).content;
    mockSaves += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'local-test-only' }) });
  });
  await hostContext.route('**/rest/v1/portfolio_content*', route => savedDraft
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureRow(savedDraft)) })
    : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureRow(fixtureContent)) }));
  const host = await hostContext.newPage();
  await host.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await host.locator('body.host-mode-active').waitFor({ timeout: 30000 });
  await host.waitForFunction(() => document.querySelector('#projects .collection-card h3')?.textContent?.includes('pAIcture'), { timeout: 30000 });
  const originalTitle = await host.locator('#projects .collection-card h3').first().innerText();
  const originalOtherProject = await host.locator('#projects .collection-card').nth(1).locator('h3').innerText();
  const firstProjectId = await host.locator('#projects .collection-card').first().evaluate(card => card.id);
  await host.locator('#projects .gallery-link').first().click();
  const editor = host.locator('.host-gallery-editor-overlay');
  await editor.waitFor();
  expect(await editor.getAttribute('aria-label') === `Edit ${originalTitle} Gallery`, 'Host gallery editor opened for the wrong project');
  const originalGalleryCount = await editor.locator('.gallery-editor figure').count();
  const tinyPng = Buffer.from(tinyPngUrl.split(',')[1], 'base64');
  await editor.locator('input[type="file"][multiple]').setInputFiles({ name: 'disposable-test.png', mimeType: 'image/png', buffer: tinyPng });
  await editor.locator('.gallery-editor figure').nth(originalGalleryCount).waitFor();
  await editor.locator('.gallery-editor figure').last().getByLabel(`Image ${originalGalleryCount + 1} Caption`).fill('Disposable test image');
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Hide' }).click();
  await editor.locator('.gallery-editor figure').last().getByText('Hidden from visitors').waitFor();
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Show' }).click();
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Earlier' }).click();
  await editor.locator('.gallery-editor figure').nth(originalGalleryCount - 1).getByRole('button', { name: 'Later' }).click();
  expect(await editor.locator('.gallery-editor figure').count() === originalGalleryCount + 1, 'Host gallery draft lost the uploaded image during hide/reorder');
  await editor.getByRole('button', { name: 'Save Gallery Draft' }).click();
  await editor.waitFor({ state: 'detached' });
  await host.locator('#projects .collection-cover').first().click();
  const drawer = host.locator('.cms-drawer');
  await drawer.waitFor();
  await drawer.getByLabel('Title', { exact: true }).fill(`${originalTitle} — test draft`);
  await host.getByRole('button', { name: 'Save', exact: true }).first().click();
  await host.getByText('Saved successfully').first().waitFor();
  expect(mockSaves === 1, 'Host save did not reach the isolated API fixture');
  expect(savedDraft?.projects?.[0]?.gallery?.length === originalGalleryCount + 1, 'Isolated saved record did not contain the uploaded image');
  await host.reload();
  await host.locator('body.host-mode-active').waitFor();
  await host.locator('#projects .collection-card h3').first().getByText(`${originalTitle} — test draft`).waitFor();
  await host.locator('#projects .gallery-link').first().click();
  await editor.waitFor();
  expect(await editor.locator('.gallery-editor figure').count() === originalGalleryCount + 1, 'Uploaded gallery image did not survive refresh');
  await editor.getByRole('button', { name: 'Return to card' }).click();
  await editor.waitFor({ state: 'detached' });
  expect(await host.locator('#projects .collection-card').nth(1).locator('h3').innerText() === originalOtherProject, 'Another project was changed by the Host edit');
  await host.getByRole('button', { name: 'Preview', exact: true }).click();
  await host.locator('body.host-preview-active').waitFor();
  await host.locator('#projects .gallery-link').first().click();
  const previewGallery = host.locator('.gallery-grid-modal');
  await previewGallery.waitFor();
  expect(await previewGallery.locator('.gallery-photo-grid figure').count() === originalGalleryCount + 1, 'Saved Host upload is absent from visitor preview');
  await previewGallery.getByRole('button', { name: 'Close gallery' }).click();
  await previewGallery.waitFor({ state: 'detached' });
  await host.getByRole('button', { name: 'Exit Preview' }).click();
  await host.locator('body.host-mode-active').waitFor();
  await host.locator('#projects .gallery-link').first().click();
  await editor.waitFor();
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Remove' }).click();
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Confirm remove' }).click();
  await editor.getByRole('button', { name: 'Save Gallery Draft' }).click();
  await editor.waitFor({ state: 'detached' });
  await host.getByRole('button', { name: 'Save', exact: true }).first().click();
  await host.reload();
  await host.locator('body.host-mode-active').waitFor();
  await host.locator('#projects .gallery-link').first().click();
  await editor.waitFor();
  expect(await editor.locator('.gallery-editor figure').count() === originalGalleryCount, 'Disposable Host gallery image was not removed from the isolated fixture');
  await editor.getByRole('button', { name: 'Return to card' }).click();
  await host.locator('#competitions .gallery-link').first().click();
  await editor.waitFor();
  expect(await editor.getAttribute('aria-label') === 'Edit COMPETITION / ONE Gallery', 'Host competition editor opened for the wrong item');
  const competitionGalleryCount = await editor.locator('.gallery-editor figure').count();
  await editor.locator('input[type="file"][multiple]').setInputFiles({ name: 'disposable-competition-test.png', mimeType: 'image/png', buffer: tinyPng });
  await editor.locator('.gallery-editor figure').nth(competitionGalleryCount).waitFor();
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Hide' }).click();
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Show' }).click();
  await editor.locator('.gallery-editor figure').last().getByRole('button', { name: 'Earlier' }).click();
  await editor.getByRole('button', { name: 'Save Gallery Draft' }).click();
  await host.getByRole('button', { name: 'Save', exact: true }).first().click();
  await host.reload();
  await host.locator('body.host-mode-active').waitFor();
  await host.locator('#competitions .gallery-link').first().click();
  await editor.waitFor();
  expect(await editor.locator('.gallery-editor figure').count() === competitionGalleryCount + 1, 'Competition gallery upload did not persist in the isolated fixture');
  expect(savedDraft?.projects?.[0]?.gallery?.length === originalGalleryCount, 'Competition gallery edit changed project media');
  await editor.locator('.gallery-editor figure').nth(competitionGalleryCount - 1).getByRole('button', { name: 'Remove' }).click();
  await editor.locator('.gallery-editor figure').nth(competitionGalleryCount - 1).getByRole('button', { name: 'Confirm remove' }).click();
  await editor.getByRole('button', { name: 'Save Gallery Draft' }).click();
  await host.getByRole('button', { name: 'Save', exact: true }).first().click();
  await host.reload();
  await host.locator('body.host-mode-active').waitFor();
  await host.locator('#competitions .gallery-link').first().click();
  await editor.waitFor();
  expect(await editor.locator('.gallery-editor figure').count() === competitionGalleryCount, 'Disposable competition image was not removed from the isolated fixture');
  await editor.getByRole('button', { name: 'Return to card' }).click();
  await editor.waitFor({ state: 'detached' });
  // The general Host lifecycle uses isolated content and intercepted saves only.
  await host.locator('.nav-more summary').click();
  await host.getByRole('menuitem', { name: /Open Content Studio/ }).click();
  const studio = host.locator('.cms-drawer');
  await studio.getByRole('button', { name: 'Profile', exact: true }).click();
  const emailField = studio.getByLabel('Email', { exact: true });
  const originalEmail = await emailField.inputValue();
  const testEmail = 'qa-fixture@example.test';
  await emailField.fill(testEmail);
  await host.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await emailField.inputValue() === originalEmail, 'Undo did not restore the Host email');
  await host.getByRole('button', { name: 'Redo', exact: true }).click();
  expect(await emailField.inputValue() === testEmail, 'Redo did not restore the Host email edit');
  await host.getByRole('button', { name: 'Discard', exact: true }).click();
  await host.getByRole('dialog', { name: 'Confirm discard' }).getByRole('button', { name: 'Discard' }).click();
  expect(await emailField.inputValue() === originalEmail, 'Discard did not restore the saved email');
  await emailField.fill(testEmail);
  await host.getByRole('button', { name: 'Save', exact: true }).first().click();
  await host.getByText('Saved successfully').first().waitFor();
  await host.reload();
  await host.locator('body.host-mode-active').waitFor();
  await host.locator('.nav-more summary').click();
  await host.getByRole('menuitem', { name: /Open Content Studio/ }).click();
  await host.locator('.cms-drawer').getByRole('button', { name: 'Profile', exact: true }).click();
  expect(await host.locator('.cms-drawer').getByLabel('Email', { exact: true }).inputValue() === testEmail, 'Saved Host email was overwritten on refresh');
  const hostStudio = host.locator('.cms-drawer');
  await hostStudio.getByRole('button', { name: 'Projects', exact: true }).click();
  await hostStudio.getByRole('button', { name: '+ Add Project' }).click();
  const newProject = hostStudio.locator('.editor-item').first();
  await newProject.getByLabel('Title', { exact: true }).fill('Disposable Project');
  expect(await newProject.locator('.editor-item-select').innerText().then(value => value.includes('Disposable Project')), 'New Project did not become first');
  await newProject.getByRole('button', { name: 'Move Project 1 down' }).click();
  expect(await hostStudio.locator('.editor-item').nth(1).locator('.editor-item-select').innerText().then(value => value.includes('Disposable Project')), 'Project move down failed');
  await hostStudio.locator('.editor-item').nth(1).getByRole('button', { name: 'Move Project 2 up' }).click();
  await hostStudio.locator('.editor-item').first().getByRole('button', { name: 'Delete', exact: true }).click();
  await hostStudio.locator('.editor-item').first().getByRole('button', { name: 'Confirm delete' }).click();
  expect(await hostStudio.locator('.editor-item').count() === fixtureContent.projects.length, 'Project delete failed');
  await hostStudio.getByRole('button', { name: 'Competitions', exact: true }).click();
  await hostStudio.getByRole('button', { name: '+ Add Competition' }).click();
  await hostStudio.locator('.editor-item').first().getByLabel('Title', { exact: true }).fill('Disposable Competition');
  await hostStudio.locator('.editor-item').first().getByRole('button', { name: 'Delete', exact: true }).click();
  await hostStudio.locator('.editor-item').first().getByRole('button', { name: 'Confirm delete' }).click();
  expect(await hostStudio.locator('.editor-item').count() === fixtureContent.competitions.length, 'Competition delete failed');
  await hostStudio.getByRole('button', { name: 'Learning', exact: true }).click();
  await hostStudio.getByRole('button', { name: '+ Add Learning Item' }).click();
  await hostStudio.locator('.learning-editor .editor-item').first().getByLabel('Title', { exact: true }).fill('Disposable Learning');
  await hostStudio.locator('.learning-editor .editor-item').first().getByRole('button', { name: 'Hide' }).click();
  await hostStudio.locator('.learning-editor .editor-item').first().getByRole('button', { name: 'Show' }).click();
  await hostStudio.locator('.learning-editor .editor-item').first().getByRole('button', { name: 'Delete' }).click();
  await hostStudio.locator('.learning-editor .editor-item').first().getByRole('button', { name: 'Confirm delete' }).click();
  expect(await hostStudio.locator('.learning-editor .editor-item').count() === 0, 'Learning delete failed');
  await hostStudio.getByRole('button', { name: 'Education', exact: true }).click();
  const educationBefore = await hostStudio.locator('[data-education-id]').count();
  await hostStudio.getByRole('button', { name: '+ Add Education' }).click();
  expect(await hostStudio.locator('[data-education-id]').count() === educationBefore + 1, 'Education add failed');
  await hostStudio.locator('[data-education-id]').first().getByRole('button', { name: 'Delete' }).click();
  await hostStudio.locator('[data-education-id]').first().getByRole('button', { name: 'Confirm delete' }).click();
  await hostStudio.getByRole('button', { name: 'Skills', exact: true }).click();
  const groupsBefore = await hostStudio.locator('[data-skill-group-id]').count();
  await hostStudio.getByRole('button', { name: '+ Add Skill Group' }).click();
  expect(await hostStudio.locator('[data-skill-group-id]').count() === groupsBefore + 1, 'Skill group add failed');
  await hostStudio.locator('[data-skill-group-id]').last().getByRole('button', { name: 'Delete group' }).click();
  await hostStudio.locator('[data-skill-group-id]').last().getByRole('button', { name: 'Delete', exact: true }).click();
  expect(await hostStudio.locator('[data-skill-group-id]').count() === groupsBefore, 'Skill group delete failed');
  await hostStudio.getByRole('button', { name: 'Profile', exact: true }).click();
  await host.locator('.cms-drawer').getByLabel('Email', { exact: true }).fill('unsaved-fixture@example.test');
  host.once('dialog', dialog => dialog.dismiss());
  await host.locator('.nav-more summary').click();
  await host.getByRole('menuitem', { name: /Exit Host Mode/ }).click();
  expect(await host.locator('body.host-mode-active').count() === 1, 'Canceled Host exit still exited');
  host.once('dialog', dialog => dialog.accept());
  await host.locator('.nav-more summary').click();
  await host.getByRole('menuitem', { name: /Exit Host Mode/ }).click();
  await host.locator('body.host-mode-active').waitFor({ state: 'detached' });
  expect(savedDraft?.profile?.email === testEmail, 'Host exit published an unsaved email draft');
  results.hostMock = { owner: firstProjectId, originalGalleryCount, competitionGalleryCount, mockSaves, titlePersisted: true, previewWorked: true, disposableUploadRemoved: true, productionWrites: 0 };
  await hostContext.close();
  console.log(JSON.stringify(results, null, 2));
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('Critical layout, detail, and gallery checks passed.');
} finally {
  await browser?.close();
  await server.close();
}
