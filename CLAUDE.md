# CLAUDE.md

This file gives Claude Code context on this project. Read it before making changes.

> **Reuse note:** most of this file (naming conventions, SEO rules, CSS architecture, tech stack defaults) is written to be copy-pasted as-is into other Astro client projects. Only the "Project overview" and "Central config" sections below are specific to this particular site — update those per project, leave the rest.

## About me

I am a graduated bachelor software engineer and started my business XANDR to earn some money on the side and hopefully scale this business. I now only make small landing pages or marketing websites to get some experience in this world, but the faster i can upgrade and learn the better.

I want good communication as if i am talking with a proffesional. Every output should feel like advice from a proffesional practitioner rather than a consultant or academic.

## Communication Style

* Write in clear, conversational English.
* Use simple language whenever possible.
* Avoid buzzwords, corporate jargon, and vague statements.
* Focus on practical examples and actionable insights.
* Prioritize clarity over sophistication.
* Explain concepts as if speaking to an intelligent beginner.
* Use short paragraphs and strong structure.

## Rules

* Always ask at least three clarifying questions before starting any complex task.
* Always present a plan before execution and wait for approval (for multi-step tasks).
* Never make assumptions when important information is missing. ASK!
* Keep outputs concise and relevant.
* Do not add filler content to increase length.
* Stay within requested word counts and formats.
* Use practical examples whenever possible.
* When multiple approaches exist, explain the tradeoffs.
* If uncertain, ask before proceeding.
* Review outputs before final delivery.

## Agent behaviour

1. Understand the objective
2. Ask clarifying questions if needed
3. Create a plan
4. Execute step by step
5. Review the output
6. Improve weak areas
7. Deliver the final result.

Never skip planning for complex tasks.

Never prioritize speed over quality.

Always optimize for usefulness and accuracy.

## Succes criteria

A succesfull output should be:

* Clear
* Actionable
* Accurate
* Concise
* Easy to understand
* Immediatly usefull

## Project overview

Xandr is a marketing/portfolio website built with **Astro** + **TypeScript**. It's a static site (zero client-side JS by default) for a small web/software development business. The site includes a landing page with hero, services, about, portfolio, and contact sections, and may be extended with additional client sub-sites/galleries over time.

## Tech stack

- **Astro** (component-based, static output, Vite under the hood)
- **TypeScript** (strict mode)
- Plain CSS with CSS custom properties (no Tailwind, no CSS-in-JS)
- No UI framework (React/Vue) is currently in use — components are `.astro` files only unless a specific interactive feature genuinely requires one

## Commands

```bash
npm run dev       # start local dev server (localhost:4321)
npm run build     # build static output to dist/
npm run preview   # preview the production build locally
```

There is no test suite yet. If you add one, use Vitest and document the command here.

## Project structure

```
src/
├── components/   # One component per file, PascalCase (e.g. Hero.astro). Markup only, no <style>.
├── layouts/      # Layout.astro wraps every page (head, fonts, meta)
├── pages/        # File-based routing — index.astro is the homepage
├── config/       # site.ts — central config for site-wide values (see below)
└── styles/
    ├── global.css       # shared design tokens + base styles (colors, fonts, .btn, .container, .eyebrow)
    └── pages/            # one CSS file per page, e.g. home.css for index.astro
public/           # Static assets served as-is (favicon, etc.)
```

## Design system — do not invent new values

All colors, fonts, spacing, and radii are defined as CSS custom properties in `src/styles/global.css`. **Always reuse these variables instead of hardcoding new hex values or font names.**

- Colors: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-accent-start`, `--color-accent-end`, `--color-accent-solid`, `--gradient-accent`
- Fonts: `--font-display` (Space Grotesk, for headings), `--font-body` (Inter, for body text), `--font-mono` (JetBrains Mono, used only for the `<eyebrow>` labels and small tags — this ties back to the `</>` motif in the logo)
- Radii: `--radius-sm`, `--radius-md`, `--radius-lg`

The recurring visual motif across the site is the bracket pair `<label/>` used as a small eyebrow above section headings (see any component for the pattern) — keep this consistent if adding new sections.

## CSS architecture — one file per page, not per component

This project uses **per-page CSS files**, not Astro's default component-scoped `<style>` blocks. This is a deliberate choice for maintainability as the project grows to more pages/clients — all styling for a page lives in one place instead of being scattered across every component file.

- `.astro` files in `src/components/` and `src/pages/` contain **markup only** — no `<style>` blocks.
- Each page has one matching CSS file in `src/styles/pages/` (e.g. `src/pages/index.astro` → `src/styles/pages/home.css`), imported once in the page's frontmatter: `import '../styles/pages/home.css';`
- Inside a page's CSS file, group rules by section with a comment header (`/* ---------- Hero ---------- */`) in the same order the sections appear on the page, so the file reads top-to-bottom like the page itself.
- Class names must stay unique across the whole site (e.g. `.hero__title`, `.service-card`) since styles are no longer scoped by Astro — avoid generic class names like `.title` or `.card` that could collide between pages.
- Shared, truly cross-page tokens (colors, fonts, spacing scale, `.btn`, `.container`, `.eyebrow`) stay in `src/styles/global.css`. Only page/section-specific rules go in a page's CSS file.
- When adding a new page, create its CSS file in `src/styles/pages/` following this same pattern rather than reintroducing scoped `<style>` blocks in components.

## Central config

Site-wide values (business name, contact email, nav links, SEO defaults) live in `src/config/site.ts` as a single `siteConfig` object. **Never hardcode an email address, phone number, or nav item directly in a component** — import and use `siteConfig` instead. Add new site-wide values to this file rather than scattering them across components.

## Conventions

- Styling follows the per-page CSS pattern above — do not add `<style>` blocks back into individual components.
- Client-side interactivity uses plain `<script>` tags with vanilla DOM APIs (see `Header.astro` mobile menu, `Contact.astro` form validation) — this project intentionally avoids React/Vue islands unless a feature has real state complexity that justifies the added JS payload.
- All text is currently in Dutch. Keep new user-facing copy in Dutch unless told otherwise.
- Written for a non-technical business owner to eventually read/edit some content — prefer clear, simple structures (plain arrays of objects, e.g. in `Services.astro`/`Portfolio.astro`) over clever abstractions.

## Naming — always readable, never cryptic

Favor descriptive, self-explanatory names over short or clever ones, in every language (TS/JS, HTML/CSS class names, CSS custom properties). A longer, obvious name is always preferred over a short, ambiguous one.

- **No magic numbers.** Any non-trivial numeric literal (breakpoints, timeouts, thresholds, array indices used more than once, animation durations, z-index values) gets a named constant instead of being inlined. `const MOBILE_NAV_BREAKPOINT_PX = 780;` not a bare `780` reused across files. Exceptions: numbers that are self-evidently structural and used exactly once inline (e.g. `gap: 8px` in a single one-off style rule) don't need a named constant — use judgment, but default to naming it if the number's purpose isn't obvious from context.
- **No single-letter or abbreviated variable names**, including in loops — use `service` / `serviceIndex`, not `s` / `i`; use `project`, not `p` or `proj`.
- **HTML/CSS class names describe what the element is or does**, not its appearance or position — e.g. `.service-card__tags`, not `.blue-pills` or `.row-3-item`. Follow the existing `.block__element--modifier`-style naming already used across components.
- **CSS custom properties describe role, not raw value** — e.g. `--color-accent-start`, not `--blue-1`. Follow the existing token names in `global.css`.
- This applies to Claude Code's own output as much as to existing code — when editing a file, upgrade unclear names nearby if touching that code anyway, but don't do unrelated drive-by renames in files you're not otherwise editing.

## SEO — treat as a hard requirement, not an afterthought

This project exists to get found on Google — every page and every content change should be evaluated against this. SEO is not optional polish; weigh it as heavily as functionality when making decisions.

- **Every page needs a unique, specific `<title>` and meta description** — never leave a page on the layout's generic default if the page has distinct content. Titles should include the relevant service/location keywords a real customer would search for, not just the business name.
- **Every `<img>` needs a real, descriptive `alt` attribute** — describe what's actually in the image (e.g. "gel nails ombre pink manicure", not "photo1" or a blank string), since this also drives image-search traffic, which matters a lot for visually-led businesses (portfolios, galleries, food, styling, etc.).
- **Heading structure must be semantic and hierarchical** — exactly one `<h1>` per page, `<h2>` for section headings, `<h3>` for sub-points — never skip a level or use headings purely for visual size (use CSS for that instead).
- **Maintain `astro.config.mjs`'s `site` value accurately** for the current deployment target, since it feeds the sitemap and canonical URLs — do not leave it pointing at a stale or placeholder domain.
- **Add `@astrojs/sitemap`** as soon as the project has more than one page, and confirm the generated sitemap is submitted to Google Search Console before considering a project "launched."
- **Keep the site fast.** SEO and performance are linked — don't introduce render-blocking scripts, unnecessarily large images, or client-side frameworks for content that could be static HTML. Optimize/compress images before adding them (prefer WebP where practical) rather than dropping in raw exports.
- **Location and service keywords belong in real, visible page copy**, not just in meta tags — Google weighs on-page content. If a business serves a specific city/region, that should appear naturally in headings and body text, not only in the `<title>`.
- When in doubt on an SEO decision, prefer the more explicit/descriptive option over the more minimal one.

## Deployment

- **Target: Cloudflare Pages** (build command `npm run build`, output directory `dist`). Do **not** set a `base` path in `astro.config.mjs` for this deployment target.
- If a GitHub Pages deployment is ever needed again, `base: '/REPO_NAME'` must be reintroduced, and every reference to a `public/` asset must go through `import.meta.env.BASE_URL` rather than a hardcoded absolute path — this has broken before (see favicon bug history), so always check for hardcoded `/asset.svg`-style paths when touching `<head>` or asset references.

## Things to avoid

- Don't add a UI framework (React/Vue/Svelte) "just in case" — this is a static marketing site, and Astro's zero-JS-by-default approach is a deliberate performance/SEO choice for this project.
- Don't introduce a database, backend API, or authentication system without discussing it first — the whole point of the current architecture is to stay static and free to host.
- Don't reintroduce Tabler icon fonts or any icon font — inline SVGs are used for icons (see the hamburger menu icon in `Header.astro`) because icon fonts from other tooling contexts don't work in a real Astro build.