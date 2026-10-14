# Master 3D Carousel Delivery and QA — 2026-10-14

## Safety and rollback

- Baseline commit: `a7dd9ce3743bb8859e520a72d32de700d8882e84`
- Complete working-state copy: `D:\BBB_vibecoding_project\self_intro_website_backups\pre-3d-ring-20261013-225211`
- The copy includes Git state, tracked files, untracked QA artifacts, local configuration, dependencies, and build output.
- Read-only Supabase snapshot: `supabase-portfolio-content.json` inside the backup directory.
- Snapshot SHA-256: `94094b6b322a2c343ec7938fe8d5d496bf334c2595bb0b0a08355204dbd24e3b`
- Snapshot verification: 5 projects, 3 competitions, 12 visible gallery images; gallery associations passed.
- Restore safely by copying the backup into a new empty directory and verifying `git rev-parse HEAD`. Do not overwrite the current checkout until the restored copy has been inspected.

## Architecture changes

- Replaced the visitor-only horizontal slider with a lazy-loaded React Three Fiber ring exhibition.
- Cards are placed around a calculated circular radius and the parent ring rotates around the world-up axis.
- Every spatial card compensates for parent rotation, preserving cylindrical camera-facing orientation and vertical posture.
- A sharp DOM card remains centered above the WebGL stage for readable content and reliable Details/Gallery controls.
- Host Mode and View All retain the existing complete grid and editing components.
- The ring mounts only near the viewport, renders on demand, caps DPR, disposes generated textures, and loads only visible card images.
- WebGL-disabled visitors receive a complete accessible card-grid fallback.

## Verified behavior

| Area | Status | Evidence |
| --- | --- | --- |
| Production build | PASS | `npm run build` |
| Responsive ring | PASS | 1920, 1440, 1024, 768, and 390 px |
| Adaptive counts | PASS | 1, 2, 3, 5, 8, 12, 20, and 24 cards |
| 360-degree wrap | PASS | Previous/Next and keyboard Home/End/Next |
| Mouse drag | PASS | 5-card isolated fixture; no accidental modal |
| Touch swipe | PASS | 24-card 390 px fixture; no accidental modal |
| View All / return | PASS | All records preserved, selected ID retained |
| Project gallery isolation | PASS | Owner ID, count, navigation, zoom, detail round-trip |
| Competition gallery isolation | PASS | Separate disposable competition fixture |
| Frosted detail/gallery overlays | PASS | 16 px blur, fixed portal, focus trap, Escape, scroll lock |
| Modal scroll restoration | PASS | Desktop and mobile regression suite |
| Host authentication UI | PASS | Invalid/valid login, recovery, persistence, logout, guest protection |
| Host project/competition editing | PASS | Isolated add, edit, delete, reorder, label and gallery workflows |
| Host gallery persistence | PASS | Upload, hide/show, reorder, save, refresh, preview, cleanup |
| Host toolbar | PASS | Save, Discard, Undo, Redo, Preview, Exit Preview |
| Education, Skills, Learning editors | PASS | Isolated add/delete/hide/show flows |
| About/Skills layout | PASS | Five responsive widths; no content obstruction |
| Full-page media health | PASS | Desktop/mobile major sections; 0 broken images |
| Horizontal overflow | PASS | 0 px in full-page and dynamic-count checks |
| Production data writes | PASS | Zero; all destructive QA used intercepted disposable fixtures |

## Data integrity

No production content or media was changed. The stored project, competition, education, skill, learning, About, Strength, and Contact content remain authoritative. Existing project gallery images remain associated with their original owner. Competition gallery behavior was verified with an in-memory fixture because the current saved competitions have no published gallery images.

## Known limitations

- The installed React Three Fiber version emits a non-failing Three.js `Clock` deprecation warning in development. There were no page errors or critical console errors.
- Real production Host credentials were not used. Authentication and persistence were verified through the same HTTP/UI workflow with intercepted local fixtures, so production-service credential acceptance is NOT TESTED in this run.
- No deployment or remote push was performed because the task explicitly requires approval before production deployment.

## Follow-up visual refinement

- Reduced the spatial scale and brightness of non-selected 3D cards so pale covers no longer overpower the central reading surface.
- On narrow screens, the surrounding cards use restrained dark materials rather than loading cover textures; the selected card still shows its actual cover image at full fidelity. This also reduces mobile GPU texture work.
- The carousel screenshot test now waits for the re-mounted WebGL scene after returning from View All, preventing misleading blank-frame captures.
- Reverified `npm run build`, five-width Project/Competition carousel navigation and screenshots, and `npm run verify:critical` with isolated Host fixtures. All passed. The existing non-failing Three.js `Clock` development warning remains.

## Continuous 360-degree drag follow-up

- The circular WebGL exhibition now follows the pointer or touch continuously while held, rather than changing only one record on release. Releasing snaps to the nearest card, including across multiple positions in one gesture.
- During drag, the DOM reading card yields to the underlying real 3D card. Click suppression prevents a drag from opening a detail panel.
- The camera target now advances toward the front of larger rings. A 24-card, 390 px touch-drag screenshot confirmed the foreground 3D card remains within the stage instead of falling below it.
- Isolated tests verified live WebGL redraw during mouse drag, no premature selection, multi-position drag, mobile touch drag, 1/2/3/5/8/12/20/24-card counts, gallery isolation, and no accidental detail opening. The five-width carousel suite, production build, and full critical visitor/Host fixture suite passed afterward.
- The critical scroll-restoration test now waits for the app's existing asynchronous restoration callback before checking the final position, avoiding a timing-dependent false failure.
