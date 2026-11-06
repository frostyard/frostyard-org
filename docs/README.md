# Documentation

This repository is a website, so its docs are the site itself under
`src/content/docs/`; this folder holds only the agent skills that `AGENTS.md`
makes binding.

## Agent skills

- [agents/skills/docs-voice.md](agents/skills/docs-voice.md) — "Write docs for
  the person at the keyboard". Applies to any change to a page under
  `src/content/docs/`, and to component text that renders on those pages.
- [agents/skills/readme-page-inventory.md](agents/skills/readme-page-inventory.md)
  — "Update README.md's page inventory when adding or removing a page".
  Applies to any change that adds, removes, or renames a file under
  `src/pages/`.

A new skill gets a line here, because `make verify` fails on a doc that this
index does not link.
