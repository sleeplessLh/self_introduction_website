# Portfolio carousel refinement — local acceptance record

## Rollback

The untouched pre-refinement project is preserved at
`D:\BBB_vibecoding_project\self_intro_website_backups\pre-carousel-20261013-193834`.
Its Git HEAD is `ae170c249df441f26e906331219c9e40fdfee4e0`.
The copy includes `.git`, `.env.local`, committed files, 42 pre-existing untracked
development artifacts, installed dependencies, and build output. Robocopy copied
35,469 files (824.49 MB) with zero failures; a read-only comparison found zero
differences and `git fsck --full --no-reflogs` passed.

The private Supabase content snapshot is
`D:\BBB_vibecoding_project\self_intro_website_backups\pre-carousel-20261013-193834\supabase-portfolio-content.json`.
SHA-256: `edf75bd188734e76d2974933801751dfe98ae6b5b68262d172269d912e01887d`.
It contains one portfolio row, including five projects, three competitions, and
twelve existing gallery images (all attached to the third project). Never commit
or publish this file.

To restore, first preserve any work made after this record, then copy the backup
into a **new directory** and verify its Git status and content snapshot. Move it
into place only after checking the destination; do not erase the current project
or overwrite live CMS data blindly. The unchanged production baseline is also
referenced by the commit above.

## Changes

- About's two saved Focus Areas / Open To records now occupy two deliberate
  panels, with no empty third column. No personal copy was invented.
- Strengths cards use readable editorial typography and a compact 2×2 / 1-column
  responsive composition. A decorative arrow that implied a nonexistent click
  action was removed.
- Self-Learning retains its timeline, records, expand/collapse, and editor, with
  proportional heading/body type, controlled text measure, and a restrained date
  separator.
- Projects and Competitions share a carousel with arrows, drag, touch swipe,
  keyboard control, position indicators, direct Details/Gallery actions, and a
  complete View All grid. Host Mode still shows the full editable collection.
  Empty galleries are labelled instead of offered as active card buttons.
  Records without uploaded cover images use their existing title as a typographic
  cover and clearly state that no image has been uploaded.
- Existing detail and gallery overlays, 3D scene, data structures, and media
  associations were not rewritten.

## Checks actually run

| Area | Status | Evidence |
| --- | --- | --- |
| Production build | PASS | `npm run build` (662 modules; large-chunk warning remains) |
| Saved-content visual QA | PASS | `verify-visual-snapshot.mjs` at 1440 and 390; nine sections, no document overflow, 7 visible image sources healthy, no browser page errors |
| Carousel / View All / direct gallery / details | PASS | `verify-carousel.mjs` at 1920, 1440, 1024, 768, 390 using private content snapshot; also one/two-item cases |
| Mouse drag, post-drag click, and touch swipe | PASS | Physical pointer and CDP touch interactions in `verify-carousel.mjs` |
| Existing modal, gallery, section, Host fixture flows | PASS | `npm run verify:critical` at five widths, including Host add/reorder/delete synchronization with the collection grid; isolated test data, zero production writes |
| Ordering | PASS | `npm run verify:ordering` |
| 3D, reduced motion, no-WebGL fallback | PASS | `npm run verify:immersive` |
| Authentication UI | PASS | `npm run verify:auth-ui` with fixture endpoints |
| API authorization | PASS | `npm run verify:api-auth`; guest and cross-origin writes rejected, fixture Host save accepted |
| Live Host credentials / cross-session production save | NOT TESTED | No real credentials or destructive changes to user content used |
| Real media upload / delete | NOT TESTED | No production gallery records altered |
| Production deployment | NOT TESTED | Deliberately not deployed without explicit approval |

The existing THREE.Clock deprecation warning and Vite large-chunk warning are
non-blocking but remain for a future performance pass.
