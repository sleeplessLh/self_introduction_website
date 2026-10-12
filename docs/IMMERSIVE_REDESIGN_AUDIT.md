# Immersive Redesign Preservation Audit

Baseline commit: `91e8a8b4b68b90484b06f1c4f8b5ad5af814e44c`

Rollback tag: `rollback/pre-3d-redesign-2026-10-12`

Verified backup: `D:\BBB_vibecoding_project\self_intro_website_backups\pre-3d-redesign-20261012-105625`

## Authoritative content snapshot

- Schema version: 12
- Navigation records: 7
- About records: 3
- Education records: 3
- Skill groups: 4 (9 skills)
- Projects: 3
- Project gallery images: 12
- Competitions: 3
- Competition gallery images: 0
- Self-learning records: 8
- Strength records: 4
- Social links: 2
- Section visibility settings: 8

The Supabase `portfolio_content` row is backed up separately as
`supabase-portfolio-content.json`. It remains the authoritative persisted content;
the redesign must not change its schema or replace live values with defaults.

## Public experience checklist

- [ ] Global background and responsive document shell
- [ ] Sticky/hiding navigation, mobile menu, anchor navigation and contact action
- [ ] Hero content, portrait, tags and email/project actions
- [ ] About content and profile metadata
- [ ] Education logos, dates, institution, program, grade and description
- [ ] Skill groups and individual skills
- [ ] Projects, labels, descriptions, highlight media, technologies, links and order
- [ ] Competitions, achievements, labels, media and order
- [ ] Visitor three-item collapse/expand behavior
- [ ] Self-learning records, dates, descriptions, hidden records and order
- [ ] Strength records and order
- [ ] Contact content, email compose behavior, social links, resume and footer
- [ ] Detail modal, image zoom, pan, reset, fullscreen and keyboard dismissal
- [ ] Gallery grid, captions, hidden-image filtering, image navigation, zoom, pan,
      fullscreen, thumbnails and external gallery links
- [ ] Section-level show/hide behavior
- [ ] Password-reset route

## Host Mode checklist

- [ ] Login, secure HTTP-only session restoration, logout and rate-limit behavior
- [ ] Password recovery and reset flow
- [ ] Inline text editing
- [ ] Movable Content Studio and contextual editor opening
- [ ] Global Undo, Redo, Save, Discard and Preview
- [ ] Preview retains session, draft, history and scroll position
- [ ] Add/delete/reorder projects and competitions
- [ ] Project and competition metadata, links, labels and highlight media editing
- [ ] Gallery upload, replace, caption, show/hide, reorder and delete
- [ ] Add/delete/reorder education entries and edit logos
- [ ] Add/delete/reorder skill groups and skills; move skills between groups
- [ ] Add/delete/reorder/show/hide self-learning entries
- [ ] Add/delete/reorder/show/hide About and Strength entries
- [ ] Section-level show/hide controls
- [ ] Persistent save to Supabase and refresh reload

## Storage and integrations

- Public reads: Supabase JS client, `portfolio_content`
- Authenticated writes: `/api/content` Vercel Function using the Host session
- Authentication: `/api/host/*` Vercel Functions backed by Supabase Auth
- Browser fallback cache: `localStorage` key managed by `contentStorage.js`
- Media: repository assets plus image payloads/URLs embedded in persisted content
- Contact: Gmail compose URL with `mailto:` fallback
- Deployment: GitHub `main` -> Vercel (production deployment requires explicit approval)

## Redesign constraints

- Keep the content schema and persistence API unchanged.
- Keep all editable DOM paths reachable in Host Mode.
- WebGL must be enhancement-only and never own essential content.
- Canvas layers must remain pointer-transparent except for intentional 3D interaction.
- Pause or reduce rendering when hidden, offscreen, low-power, or reduced-motion.
- Preserve keyboard focus, readable selection, modals and non-WebGL fallbacks.
