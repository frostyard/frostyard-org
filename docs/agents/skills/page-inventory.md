# Update the page inventory when adding or removing a page

**When it applies:** Any change that adds, removes, or renames a file under
`src/pages/` or `src/content/docs/docs/`.

**What to do:** `docs/site.md` has a "Page inventory" table with a row for
every page file: the file path, its route, and what it covers. When a page file
is added, removed, or renamed, update its row in the same change. Treat a
missing row as documentation directly contradicted by the change, not as an
optional touch-up. `scripts/test/site-map.test.mjs` fails when a page file has
no row, or when a row names a file that does not exist.

**Learned from:** projects-page-md run — the plan explicitly flagged the
page inventory as needing a one-sentence addition alongside the new `/projects`
route; no gate checked this, so a future agent skipping it would ship a page
invisible to readers. The inventory moved from `README.md` to `docs/site.md` on
2026-11-05, and `scripts/test/site-map.test.mjs` now checks it.
