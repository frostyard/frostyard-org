# feat: add a Frostyard projects page

## Goal

Add a Projects entry to the site-wide primary navigation and a `/projects`
page that presents Frostyard projects as an ordered, extensible list of cards.
Millhouse is the first project in that list.

The page should feel like a sibling of `/tools`: use the same hero treatment,
bordered gradient card language, card anatomy, typography, spacing, and
responsive behavior rather than introducing a new visual system.

## Source-grounded context

- `src/layouts/Site.astro` owns the shared primary-navigation link array and
  marks the active entry by comparing its key with the layout's `active` prop.
  Its current ordered links end with Tools.
- `src/pages/tools.astro` renders a page-local data array into full-width
  cards. Each card has a circular mark, category label, name, source link,
  descriptive body, monospace command, feature list, and trailing inspect
  link. At widths up to 800px its two-column card body becomes one column.
- Millhouse describes itself as the human-interactive surface around the
  Frostyard mill. It supervises mill runs across projects and exposes CLI,
  HTTP, and MCP surfaces. Its documented launch command is
  `millhouse mill <repo> <source>`.
  Source: `https://github.com/frostyard/millhouse` and its README, verified
  2026-07-26.

## Requirements

### Shared navigation

1. Add `Projects` to the shared navigation in `src/layouts/Site.astro`.
2. The link points to `/projects`, uses `projects` as its active key, and
   appears immediately after Tools. The existing link order and the separate
   Source link otherwise remain unchanged.
3. The projects page passes `active="projects"` to `Site`, so only its
   Projects navigation link receives `aria-current="page"`.
4. Preserve the navigation's existing mobile behavior; this feature does not
   add a mobile menu or change the 800px breakpoint.

### Projects page

1. Add `src/pages/projects.astro`, producing the `/projects` route through
   Astro's file routing.
2. Use the shared `Site` layout with:
   - title: `Projects | Frostyard`
   - a project-focused meta description
   - footer link label `Explore tools →` and destination `/tools`
3. Give the page a hero with the same structure and styling as the `/tools`
   hero: eyebrow, display heading with an italic serif-accent phrase, and a
   short lede explaining that the page collects Frostyard's open projects.
4. Define projects in an ordered page-local data array and render the cards
   with `map`. Adding a later project to the array must not require another
   hand-written card or a per-card CSS rule.
5. The first array entry and first rendered card is Millhouse, with:
   - display name `Millhouse`
   - circular mark `MH`
   - category label `Mill run supervisor`
   - source URL `https://github.com/frostyard/millhouse`
   - monospace command `millhouse mill <repo> <source>`
   - concise copy accurately describing cross-project mill-run supervision
     and its CLI, HTTP, and MCP control surfaces
   - a short feature list covering run launch, liveness/phase visibility,
     exact-run stopping, and the CLI/HTTP/MCP interfaces
6. Each project card follows the existing `/tools` card anatomy:
   - bordered blue gradient panel
   - header containing the circular mark, category/name block, and an
     accessible source link
   - body containing descriptive copy and the monospace command alongside
     the feature list
   - trailing `Inspect <project name>` link to the project's source
7. The source-arrow link has an accessible name identifying the project.
   Both source links use ordinary anchors and retain the site's current
   same-tab behavior.
8. At widths above 800px, the card body uses the `/tools` two-column
   presentation. At widths up to 800px, it becomes one column and retains the
   existing mobile card padding pattern without horizontal overflow.

## Scope fences

- Do not change the content or project list on `/tools`.
- Do not redesign the shared header, footer, brand, Source button, or mobile
  navigation behavior.
- Do not fetch GitHub data at build time or runtime. Project metadata is
  static page data so validation remains deterministic and offline-capable.
- Do not add filtering, search, pagination, repository statistics, or a
  content-management layer in this change.
- A small extraction that shares card styling between `/tools` and
  `/projects` is allowed only if `/tools` keeps its current rendered content
  and responsive behavior; broad design-system refactoring is out of scope.

## Acceptance criteria

1. `npm run ci` completes successfully.
2. Building the site emits `dist/projects/index.html`.
3. The rendered projects page contains one project card, and that card is
   Millhouse with both project links resolving to
   `https://github.com/frostyard/millhouse`.
4. The shared primary navigation contains a Projects link to `/projects`
   immediately after Tools on pages using `Site`; the Projects link carries
   `aria-current="page"` on `/projects`.
5. The project card is produced from the ordered project data array and
   contains the mark, label, name, description, command, feature list,
   accessible source-arrow link, and trailing inspect link required above.
6. The page uses the existing design tokens and the specified `/tools` card
   and responsive patterns, with no new external runtime dependency or GitHub
   request.
