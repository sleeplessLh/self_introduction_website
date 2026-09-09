# Personal Portfolio

A responsive React + Vite personal portfolio starter for a Software Engineer or Software Engineering student. All visible content is intentionally English and uses clearly marked placeholders until a resume is supplied.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Structure

```text
src/
  assets/
    images/       Local SVG placeholder images to replace
    videos/       Add hero.mp4 here
  components/     Reusable page sections and cards
  data/
    portfolio.js  All editable personal and project content
  styles/
    global.css    Design tokens, global styles, and responsive rules
  App.jsx         Page composition only
  main.jsx        Application entry point
```

## Update content

Open `src/data/portfolio.js`. It contains `profile`, `projects`, `experience`, `highlights`, `strengths`, and `socialLinks`. Update these data structures rather than changing the components.

- **Add a project:** add a new object to `projects`.
- **Remove or reorder a project:** delete or move an object inside `projects`.
- **Replace images:** put your optimized files in `src/assets/images/`, import them at the top of `portfolio.js`, and assign them to `profile.portrait` or a project `image`.
- **Replace the hero video:** place a muted, web-optimized `hero.mp4` in `src/assets/videos/`; import it in `portfolio.js`, then set `profile.videoSrc` to that import. The visible fallback labels the exact file location until then.
- **Edit links:** update `profile.email`, `profile.resumeUrl`, and `socialLinks`.
- **Change the look:** edit the variables at the top of `src/styles/global.css`, especially `--ink`, `--paper`, `--acid`, and the font import.

The site has no unnecessary UI dependencies. Its reveal effects are implemented with a small native `IntersectionObserver` component and respect reduced-motion preferences.
