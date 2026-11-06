# Documentation

The site docs are the pages under `src/content/docs/`, which Starlight renders
under `/docs/`. This folder holds the repository docs and the agent skills that
`AGENTS.md` makes binding.

## Repository docs

- [development.md](development.md) — "Development": how to set up the
  repository, what each command does, the generated data files, the checks, and
  how CI and the deploy work.
- [site.md](site.md) — "Site structure": how the Starlight docs are built, and
  the page inventory with the file, the route, and what it covers for every page
  file.

## Agent skills

- [agents/skills/docs-voice.md](agents/skills/docs-voice.md) — "Write docs for
  the person at the keyboard". Applies to any change to a page under
  `src/content/docs/`, and to component text that renders on those pages.
- [agents/skills/page-inventory.md](agents/skills/page-inventory.md) — "Update
  the page inventory when adding or removing a page". Applies to any change that
  adds, removes, or renames a file under `src/pages/` or
  `src/content/docs/docs/`.

A new skill gets a line here, because `make verify` fails on a doc that this
index does not link.
