# Development

## Set up

Install the pinned Node release, then the locked dependencies:

```sh
mise install
npm ci
npm run dev
```

`npm run dev` starts the local Astro server with live reload.

`npm ci` also installs the workflow guard's explicit `yaml` 2.9.1
devDependency. That exact version was already in `package-lock.json`.
Making it explicit changed only the root dependency metadata in the lock,
not any resolved package.

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
| `node scripts/check-release-drift.mjs` | Check app, tool and sysext guides against the latest GitHub releases. Needs the network. |
| `npm run ci` | Run the npm checks, in order: `npm test`, `npm run check:prose`, `npm run check`, `npm run build:check`, `npm run check:site`. This is not the full repository gate. |
| `node scripts/check-workflow-pins.mjs` | Check action and reusable-workflow pins in every `.yml` and `.yaml` workflow. |
| `node scripts/check-agent-governance.mjs` | Validate the local agent governance policy offline, from the repository root. |
| `make check-snapshots` | Compare both generated snapshots with `HEAD`, separately for the index and working tree. |
| `npm run sync:problem-schema` | Copy the pinned problem report schema into `public/schemas/problem-report/v1.json`, when its bytes match the pin. |
| `npm run preview` | Build the site, then serve it with `wrangler dev`. |
| `make verify` | Run the template checks and their tests, the workflow pin and agent governance guards, `npm run ci`, then snapshot validation. |
| `make check` | The same as `make verify`. |
| `make ci BASE=origin/main` | Run the full pre-push gate: `make verify`, then the append-only corrections comparison against `BASE`. |
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

App, tool and sysext guides with a release sentence carry a `follows` field in
their frontmatter. Keep its tag equal to the release named in the page. When you
add an app, tool or sysext guide that names a release, add this block to its
frontmatter, for example after `description:`:

```yaml
follows:
  repo: frostyard/nsl
  tag: v0.13.0
```

Use an `owner/name` repository and a `vX.Y.Z` tag. The block accepts only
`repo` and `tag`. Pages without a release sentence, such as Igloo and the APT
repository guide, do not carry it. The sysext guides follow `frostyard/updex`,
because their commands are Updex commands.

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

Run the full gate before each push:

```sh
make ci BASE=origin/main
```

`make verify` and `make check` run these checks in order:

1. The template checks and their tests: instruction links, docs index, risk
   paths, correction records and vendored copies.
2. The workflow pin guard, after checking that `node_modules` exists.
3. The offline agent governance guard.
4. `npm run ci`: tests, prose checks, Astro diagnostics, the offline
   `build:check` build, then built-site checks. The build has no `prebuild`
   refresh step.
5. `make check-snapshots`: compare `src/data/extensions.json` and
   `src/data/problem-stats.json` with `HEAD`. The index and working tree are
   checked separately, so staged changes still fail if the working bytes
   were restored. A missing snapshot in `HEAD`, the index or the working
   tree also fails. The diagnostic reports the number of snapshots checked.

`make ci` runs the same checks. When `BASE` is set, it then checks that
correction records were not removed, renamed or changed against that base.
The only permitted change to an existing record fills an empty
`promoted_to`. The retired single corrections file must not return.

The pin guard parses YAML, including flow mappings, quoted keys and aliases.
It checks only `jobs.<id>.uses` and `jobs.<id>.steps[].uses`. Text in a shell
`run` block, or input data in `env` and `with`, is not an action reference.
Malformed YAML, duplicate keys, an empty workflow set and malformed
reference values fail the guard.

External references must use `owner/repo[/path]@` followed by exactly 40
hexadecimal commit characters. Local `./` actions are exempt from the pin
requirement. `docker://` references fail with an explanation: core
ADR-0021 and repository baseline B5 give no container exemption, so an
image digest does not satisfy the commit-SHA rule. The guard reports the
workflow count and actual `uses` count, including local references.
For fixture checks, pass `--root DIR` to `scripts/check-workflow-pins.mjs`.

Every docs page ends with commit-pinned Sources. Add or change a product fact
only with a source file that supports it; do not invent commands or flags.

`npm run check:prose` fails when it finds no docs pages, and it fails on a
banned phrase from `scripts/prose-rules.json`.

`npm run check:site` fails if a pilot page, a required section, a source link, a
docs navigation link, or a Pagefind page disappears. It also fails when
`dist/client/` has no built pages.

## Agent governance

[`policies/agent-governance.json`](../policies/agent-governance.json) records the
site's existing agent authority under [core ADR-0019](https://github.com/frostyard/core/blob/96bf43226d19a05811e1767fb69cd051a3691060/docs/adr/0019-governance-as-code-and-risk-tiers.md).
The default is deny: actions without a rule are denied. Writes are limited to
work on a proposed change, not protected-branch pushes. Opening a PR is subject
to review. Agents cannot merge, publish artifacts or releases, deploy directly,
modify protected environments, or manage credentials. Exceptions require an
independent authorized approver; agents cannot approve their own exceptions.

Publication and deployment file changes require high-risk review. That review
is for the proposed file changes, not permission for the agent to publish or
deploy. This policy does not enroll the site in Fluent and does not change
GitHub permissions, Cloudflare deployment, or the scheduled statistics rebuild.

The [local schema](../policies/schemas/repository-agent-governance.schema.json)
is a byte copy of [core's v1 schema at `96bf43226d19a05811e1767fb69cd051a3691060`](https://github.com/frostyard/core/blob/96bf43226d19a05811e1767fb69cd051a3691060/organization/schemas/v1/repository-agent-governance.schema.json).
The [checker](../scripts/check-agent-governance.mjs) records the source commit,
path, and SHA-256 together in `schemaPin`. It hashes the local bytes before
parsing the schema and rejects any mismatch, including whitespace changes.
It uses the locked `ajv` and `jsonc-parser` devDependencies and does not fetch a
schema. It also rejects a missing or invalid policy, unknown version, expanded
authority, or incomplete publication or deployment boundaries. It reports one
pinned schema, one policy, and the policy's action and boundary counts.

To refresh the pin, choose a full core commit SHA and the schema path at that
commit. Download the raw bytes into a temporary file, not into the vendored
copy. From the repository root, set `core_commit` to the chosen SHA and
`core_path` to the chosen path, then run:

```sh
schema_tmp=$(mktemp)
gh api -H 'Accept: application/vnd.github.raw+json' \
  "repos/frostyard/core/contents/${core_path}?ref=${core_commit}" > "$schema_tmp" &&
  sha256sum "$schema_tmp"
```

Review the downloaded schema before replacing the copy. If the download
succeeded and the change is intended, copy the file as-is and remove it:

```sh
cp "$schema_tmp" policies/schemas/repository-agent-governance.schema.json
rm "$schema_tmp"
```

Update `schemaPin` with the source commit, path, and printed digest, update the
schema link above, and run `mise exec -- make ci BASE=origin/main`. Commit the
copy and the pin together. Do not edit the copy by hand or rehash a drifted
copy to make the check pass.

## CI and deploy

`.github/workflows/ci.yml` runs `npm ci` and the full `make ci` gate on each
pull request, each push to `main`, and nightly at 02:23 UTC. All 3 events use
the same unconditional `ci` job, read-only contents permission and no secrets.
On a pull request, `BASE` is the PR base SHA. Push and scheduled runs leave
`BASE` empty, so they omit only the optional corrections comparison.

The separate weekly `stats-rebuild.yml` workflow starts a statistics
rebuild through a credentialed deployment hook. It is not the nightly
compliance check. The secret-free nightly contract applies only to
`ci.yml`; the workflow-wide pin guard checks `uses` references, not
statistics deployment behavior.

Cloudflare Workers Builds builds and deploys the site. A push to `main` deploys
to production. A pull request gets a preview URL in its `Workers Builds:
frostyard-org` check. Agents never deploy: the site ships when Brian merges.
