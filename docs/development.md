# Development

## Set up

Install the pinned Node release, then the locked dependencies:

```sh
mise install
npm ci
npm run dev
```

`npm run dev` starts the local Astro server with live reload.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local Astro development server. |
| `npm run build` | Build the static site in `dist/client/`. It runs `prebuild`, so the generated data files are refreshed first. |
| `npm run build:check` | Build the static site from the committed snapshots, with no refresh step. |
| `npm run check` | Run the Astro diagnostics. |
| `npm run check:site` | Check the built site: routes, docs navigation, source links, and the existing route invariants. It reads `dist/client/`, so build first. |
| `npm run check:prose` | Run the banned-phrase check over the pages in `src/content/docs/`. |
| `npm test` | Run the unit tests in `scripts/test/`. |
| `node scripts/check-release-drift.mjs` | Check app and tool guides against the latest GitHub releases. Needs the network. |
| `npm run ci` | Run the complete local CI gate, in order: `npm test`, `npm run check:prose`, `npm run check`, `npm run build:check`, `npm run check:site`. |
| `npm run sync:problem-schema` | Copy the pinned problem report schema into `public/schemas/problem-report/v1.json`, when its bytes match the pin. |
| `npm run preview` | Build the site, then serve it with `wrangler dev`. |
| `make verify` | Run the template gate (symlinks, docs index, risk paths, corrections format, vendored copies, and their tests), then `npm run ci`. |
| `make check` | The same as `make verify`. |
| `make ci BASE=origin/main` | `make verify`, then a check that `.memory/corrections.jsonl` is append-only against `BASE`. Run it before you call a change complete. |
| `npm run deploy` | Build the site, then run `wrangler deploy`. Agents never run it. Brian deploys by merging to `main`. |

The rules for agents are in [AGENTS.md](../AGENTS.md).

## Generated data

The build refreshes the extension catalog from
`https://repository.frostyard.org/ext/index` and writes
`src/data/extensions.json`. For each extension, it takes the highest version in
that extension's `SHA256SUMS`, in Debian version order
(`scripts/extension-versions.mjs`). It uses the committed catalog snapshot if
the published repository is unavailable. `build:check` deliberately skips the
refresh, so CI stays network-independent and does not rewrite the snapshot.

`scripts/sync-problem-schema.mjs` (`npm run sync:problem-schema`) copies the
pinned problem report schema from frostyard/core into
`public/schemas/problem-report/v1.json`. It writes the copy only when the bytes
match the sha256 in `src/data/problem-report-schema-pin.json`.

`scripts/sync-problem-stats.mjs` runs in `prebuild`. It fetches the weekly
counts from `https://report.frostyard.org/v1/stats`, checks them against the
hiding rules, and writes `src/data/problem-stats.json`. When the service does
not answer, the build uses the committed snapshot.

Do not hand-edit a generated data file.

## Release drift

App and tool guides with a release sentence carry a `follows` field in their
frontmatter. Keep its tag equal to the release named in the page. When you add
an app or tool guide that names a release, add this block to its frontmatter,
for example after `description:`:

```yaml
follows:
  repo: frostyard/nsl
  tag: v0.13.0
```

Use an `owner/name` repository and a `vX.Y.Z` tag. The block accepts only
`repo` and `tag`. Pages without a release sentence, such as Igloo and the APT
repository guide, do not carry it.

Run `node scripts/check-release-drift.mjs` from the repository root. It prints
each tracked page, its tag, the latest published GitHub release tag, and
`OK`, `BEHIND`, or `AHEAD`. It exits 0 when all tags match, 1 when any page is
behind or ahead, and 2 on a malformed `follows` block, a network or API error, or
when no page carries `follows`. Its last line counts the pages it checked.

Set `GITHUB_TOKEN` to authenticate requests and raise the GitHub rate limit.
The script also works without a token. CI does not run it because it needs
the network. GitHub picks the latest release by date, not by version: a patch
to an older line, published after a newer release, makes current pages show
`AHEAD`.

`npm test` checks, without the network, that `follows` matches each release
sentence of the page. It knows 2 forms: "guide follows <Name> vX.Y.Z", with a
1-word name, and "The latest release is vX.Y.Z". Use 1 of them for the release
line of a new guide, or the check does not see it.

## Checks

Every docs page ends with commit-pinned Sources. Add or change a product fact
only with a source file that supports it; do not invent commands or flags.

`npm run check:prose` fails when it finds no docs pages, and it fails on a
banned phrase from `scripts/prose-rules.json`.

`npm run check:site` fails if a pilot page, a required section, a source link, a
docs navigation link, or a Pagefind page disappears. It also fails when
`dist/client/` has no built pages.

## CI and deploy

`.github/workflows/ci.yml` runs `make ci` on each pull request and each push to
`main`.

Cloudflare Workers Builds builds and deploys the site. A push to `main` deploys
to production. A pull request gets a preview URL in its `Workers Builds:
frostyard-org` check. Agents never deploy: the site ships when Brian merges.
