# Update README.md's page inventory when adding or removing a page

**When it applies:** Any change that adds, removes, or renames a file under
`src/pages/`.

**What to do:** `README.md` contains a prose sentence for every route
(`src/pages/index.astro`, `src/pages/tools.astro`, `src/pages/install.astro`,
etc.), each naming the file and describing its purpose in one clause. When a
page is added or removed, update this sentence-per-page list in the same
change. Treat a missing entry as documentation directly contradicted by the
change, not as an optional touch-up.

**Learned from:** projects-page-md run — the plan explicitly flagged the
README page inventory as needing a one-sentence addition alongside the new
`/projects` route; no gate checks this, so a future agent skipping it would
ship a page invisible to README readers without any automated signal.
