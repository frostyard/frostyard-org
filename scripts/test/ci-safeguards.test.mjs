import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";
import { referenceError, validateWorkflow, validateWorkflows } from "../check-workflow-pins.mjs";

const repository = fileURLToPath(new URL("../..", import.meta.url));
const pinScript = join(repository, "scripts/check-workflow-pins.mjs");
const snapshotScript = join(repository, "scripts/check-snapshots.mjs");
const makefile = readFileSync(join(repository, "Makefile"), "utf8");
const ciSource = readFileSync(join(repository, ".github/workflows/ci.yml"), "utf8");
const shaLength = 40;
const sha = "a".repeat(shaLength);
// Keep this list independent of the implementation so removing a guarded file fails a test.
const snapshotPaths = ["src/data/extensions.json", "src/data/problem-stats.json"];
const snapshotBytes = '{"fixture":true}\n';

function temporaryRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "ci-safeguards-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function put(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function run(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, {
    cwd, encoding: "utf8", timeout: 30_000,
    // A nested node --test process must not inherit the parent's test-runner IPC mode.
    env: { ...process.env, NODE_TEST_CONTEXT: undefined, ...env },
  });
  assert.ifError(result.error);
  return result;
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

function pinCli(root) {
  return run(process.execPath, [pinScript, "--root", root], root);
}

function referenceWorkflow(reference, position) {
  const job = position === "job" ? { uses: reference } : { steps: [{ uses: reference }] };
  return stringify({ jobs: { check: job } });
}

const rejectedReferences = [
  ["tag", "owner/action@v1"],
  ["branch", "owner/action@main"],
  ["empty", ""],
  ["null", null],
  ["short SHA", "owner/action@abc123"],
  ["39-character SHA", `owner/action@${"a".repeat(shaLength - 1)}`],
  ["41-character SHA", `owner/action@${"a".repeat(shaLength + 1)}`],
  ["nonhex SHA", `owner/action@${"g".repeat(shaLength)}`],
  ["missing owner/repository", `action@${sha}`],
  ["missing repository", `owner/@${sha}`],
  ["non-string", { uses: `owner/action@${sha}` }],
  ["whitespace", ` owner/action@${sha}`],
  ["empty local path", "./"],
  ["local traversal", "./../action"],
];
for (const position of ["step", "job"]) {
  for (const [name, reference] of rejectedReferences) {
    test(`pin guard rejects ${name} at the ${position} position`, () => {
      const result = validateWorkflow(referenceWorkflow(reference, position), "fixture.yml");
      assert.equal(result.usesCount, 1);
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0], position === "job" ? /fixture.yml: jobs.check.uses:/ : /fixture.yml: jobs.check.steps\[0\].uses:/);
    });
  }
  for (const reference of [`owner/action@${sha}`, `owner/repo/.github/workflows/reuse.yml@${sha}`, `owner/action@${"A".repeat(shaLength)}`, "./.github/actions/local"]) {
    test(`pin guard accepts ${reference} at the ${position} position`, () => {
      assert.equal(referenceError(reference), null);
      assert.deepEqual(validateWorkflow(referenceWorkflow(reference, position)), { usesCount: 1, errors: [] });
    });
  }
  test(`docker references at the ${position} position require a source-based explanation`, () => {
    for (const reference of ["docker://alpine:latest", `docker://owner/image@${sha}`, `docker://alpine@sha256:${"a".repeat(64)}`]) {
      const result = validateWorkflow(referenceWorkflow(reference, position));
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0], /docker:\/\/ uses are not exempt under core ADR-0021\/B5/);
      assert.match(result.errors[0], /local \.\/ action.*40-character commit SHA/);
    }
  });
}

test("flow mappings and quoted keys and values expose real uses fields", () => {
  const source = `"jobs": {'reuse': {"uses": 'owner/repo/path@${sha}'}, 'check': {"steps": [{"uses": "./local"}]}}`;
  assert.deepEqual(validateWorkflow(source), { usesCount: 2, errors: [] });
  const mutable = source.replace(sha, "main");
  assert.equal(validateWorkflow(mutable).errors.length, 1);
});

test("aliases resolve scalar references, steps, jobs and mapping keys", () => {
  const source = `
reference: &reference owner/repo@${sha}
key: &key uses
job: &job
  steps:
    - &step
      *key : *reference
    - *step
jobs:
  first: *job
  second: *job
  reuse:
    uses: *reference
`;
  assert.deepEqual(validateWorkflow(source), { usesCount: 5, errors: [] });
  const invalid = validateWorkflow(source.replace(sha, "main"));
  assert.equal(invalid.usesCount, 5);
  assert.equal(invalid.errors.length, invalid.usesCount);
});

for (const [name, source] of [
  ["duplicate literal keys", "jobs: {check: {uses: owner/action@main, uses: ./local}}"],
  ["duplicate alias keys", "key: &key uses\njobs: {check: {uses: owner/action@main, *key : ./local}}"],
  ["duplicate quoted keys", "jobs: {check: {'uses': owner/action@main, \"uses\": ./local}}"],
  ["malformed YAML", "jobs: [\n"],
  ["unresolved alias", "jobs: {check: *missing}"],
  ["multiple documents", "jobs: {}\n---\njobs: {}\n"],
]) {
  test(`pin guard rejects ${name}`, () => {
    const result = validateWorkflow(source, "broken.yaml");
    assert.notEqual(result.errors.length, 0);
    assert.match(result.errors[0], /broken.yaml: invalid YAML:/);
  });
}

test("block/folded run text and env/with keys do not become action references", () => {
  const source = `
env: {uses: owner/not-an-action@main}
jobs:
  check:
    env: {uses: docker://not-an-action}
    steps:
      - run: |
          uses: owner/shell-text@main
          echo 'jobs: {bad: {uses: invalid}}'
      - run: >-
          uses: owner/folded-text@latest
          is shell text
        env: {uses: null}
        with: {uses: 42, nested: {uses: owner/input@main}}
      - uses: ./.github/actions/local
        with: {uses: owner/input@main}
`;
  assert.deepEqual(validateWorkflow(source), { usesCount: 1, errors: [] });
});

function parsedUsesCount(workflows) {
  return workflows.reduce((total, { source }) => {
    const jobs = Object.values(parse(source).jobs);
    return total + jobs.reduce((count, job) => count + Number(Object.hasOwn(job, "uses"))
      + (job.steps ?? []).filter((step) => Object.hasOwn(step, "uses")).length, 0);
  }, 0);
}

function assertReportedCounts(result, workflows) {
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, new RegExp(`checked ${workflows.length} workflows and ${parsedUsesCount(workflows)} uses references`));
}

test("CLI scans both YAML suffixes, ignores other files and counts local references", (t) => {
  const root = temporaryRoot(t);
  const workflows = [
    { filename: "first.yml", source: referenceWorkflow(`owner/repo@${sha}`, "step") },
    { filename: "second.yaml", source: referenceWorkflow("./local", "job") },
  ];
  for (const { filename, source } of workflows) put(root, `.github/workflows/${filename}`, source);
  put(root, ".github/workflows/ignored.txt", "not YAML: [");
  assertReportedCounts(pinCli(root), workflows);
  for (const { filename, source } of workflows) {
    put(root, `.github/workflows/${filename}`, source.replace(`owner/repo@${sha}`, "owner/repo@main").replace("./local", "owner/repo@main"));
    const result = pinCli(root);
    assert.notEqual(result.status, 0, output(result));
    assert.ok(output(result).includes(filename), output(result));
    put(root, `.github/workflows/${filename}`, source);
  }
});

test("CLI and pure validation reject an empty workflow set", (t) => {
  const root = temporaryRoot(t);
  put(root, ".github/workflows/ignored.txt", "ignored");
  const result = pinCli(root);
  assert.notEqual(result.status, 0);
  assert.match(output(result), /no \.yml or \.yaml workflows/);
  assert.match(result.stdout, /checked 0 workflows and 0 uses references/);
  assert.notEqual(validateWorkflows([]).errors.length, 0);
});

test("actual workflows pass and report counts independently derived from YAML", () => {
  const directory = join(repository, ".github/workflows");
  const workflows = readdirSync(directory).filter((name) => /\.ya?ml$/.test(name)).map((filename) => ({
    filename, source: readFileSync(join(directory, filename), "utf8"),
  }));
  const result = validateWorkflows(workflows);
  assert.deepEqual(result.errors, []);
  assert.equal(result.workflowCount, workflows.length);
  assert.equal(result.usesCount, parsedUsesCount(workflows));
  assertReportedCounts(pinCli(repository), workflows);
});

function git(root, ...args) {
  return execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", ...args], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_AUTHOR_NAME: "CI fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
      GIT_COMMITTER_NAME: "CI fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid",
    },
  });
}

function snapshotFixture(t, omitted) {
  const root = temporaryRoot(t);
  git(root, "init", "--quiet");
  for (const path of snapshotPaths) if (path !== omitted) put(root, path, snapshotBytes);
  put(root, ".memory/corrections/.gitkeep", "");
  git(root, "add", ".");
  git(root, "commit", "--quiet", "-m", "Initialize temporary test fixture");
  return root;
}

function snapshotCli(root) {
  return run(process.execPath, [snapshotScript, "--root", root], root);
}

test("snapshot CLI accepts both unchanged tracked snapshots and reports the count", (t) => {
  const result = snapshotCli(snapshotFixture(t));
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, new RegExp(`checked ${snapshotPaths.length} snapshots against HEAD`));
});

const snapshotMutations = [
  ["unstaged drift", (root, path) => put(root, path, "changed\n"), /working snapshot differs from HEAD/],
  ["staged drift", (root, path) => { put(root, path, "changed\n"); git(root, "add", path); }, /staged snapshot differs from HEAD/],
  ["staged drift with working bytes restored", (root, path) => {
    put(root, path, "changed\n"); git(root, "add", path); put(root, path, snapshotBytes);
  }, /staged snapshot differs from HEAD/],
  ["working deletion", (root, path) => rmSync(join(root, path)), /cannot read the tracked snapshot/],
  ["index removal", (root, path) => git(root, "rm", "--cached", path), /cannot read the tracked snapshot/],
];
for (const path of snapshotPaths) {
  for (const [name, mutate, diagnostic] of snapshotMutations) {
    test(`snapshot CLI rejects ${name}: ${path}`, (t) => {
      const root = snapshotFixture(t);
      mutate(root, path);
      const result = snapshotCli(root);
      assert.notEqual(result.status, 0, output(result));
      assert.ok(result.stderr.includes(path), result.stderr);
      assert.match(result.stderr, diagnostic);
    });
  }
  test(`snapshot CLI rejects a missing HEAD snapshot: ${path}`, (t) => {
    const root = snapshotFixture(t, path);
    // Present and staged is still not a tracked snapshot in HEAD.
    put(root, path, snapshotBytes);
    git(root, "add", path);
    const result = snapshotCli(root);
    assert.notEqual(result.status, 0, output(result));
    assert.ok(result.stderr.includes(path), result.stderr);
    assert.match(result.stderr, /cannot read the tracked snapshot/);
  });
}

function makeFixture(t, text = makefile) {
  const root = snapshotFixture(t);
  put(root, "Makefile", text);
  for (const name of ["check-workflow-pins.mjs", "check-snapshots.mjs", "check-corrections.mjs"]) {
    mkdirSync(join(root, "scripts"), { recursive: true });
    copyFileSync(join(repository, "scripts", name), join(root, "scripts", name));
  }
  // Copied guards import the same installed parser, not a private fixture parser.
  symlinkSync(join(repository, "node_modules"), join(root, "node_modules"), "dir");
  put(root, "scripts/check-template.mjs", 'console.log("fixture template gate");\n');
  put(root, "test/template.test.mjs", 'console.log("fixture template tests");\n');
  put(root, ".github/workflows/check.yml", referenceWorkflow(`owner/action@${sha}`, "step"));
  put(root, "bin/npm", `#!/bin/sh
[ "$*" = "run ci" ] || exit 99
printf 'fixture npm run ci completed\\n'
if [ "$REWRITE_SNAPSHOT" = "1" ]; then
  printf 'build rewrote snapshot\\n' > src/data/extensions.json
fi
`);
  // Only the npm executable and template work are stubbed. The guards and corrections checker are real.
  execFileSync("chmod", ["+x", join(root, "bin/npm")]);
  return root;
}

function runMake(root, env = {}) {
  return run("make", ["ci", "BASE=HEAD"], root, {
    PATH: `${join(root, "bin")}:${process.env.PATH}`,
    MAKEFLAGS: "", MFLAGS: "", MAKELEVEL: "0", REWRITE_SNAPSHOT: "0", ...env,
  });
}

function assertOrdered(text, markers) {
  let previous = -1;
  for (const marker of markers) {
    const index = text.indexOf(marker);
    assert.ok(index > previous, `Missing or out-of-order marker: ${marker}\n${text}`);
    previous = index;
  }
}

function assertPinsBlock(result) {
  assert.notEqual(result.status, 0, "make ci must reject a mutable action reference");
  assert.match(output(result), /check.yml: jobs.check.steps\[0\].uses: external uses/);
  assert.doesNotMatch(result.stdout, /fixture npm run ci completed/);
}

function assertBuildDriftBlocks(result) {
  assert.notEqual(result.status, 0, "make ci must reject a snapshot rewritten by its offline build");
  assert.match(result.stdout, /fixture npm run ci completed/);
  assert.match(result.stderr, /src\/data\/extensions.json: working snapshot differs from HEAD/);
  assertOrdered(result.stdout, ["fixture npm run ci completed", "check-snapshots: checked"]);
}

test("actual Makefile reaches both guards in order and compares corrections with BASE", (t) => {
  const result = runMake(makeFixture(t));
  assert.equal(result.status, 0, output(result));
  assertOrdered(result.stdout, [
    "fixture template gate", "fixture template tests", "check-workflow-pins: checked",
    "fixture npm run ci completed", "check-snapshots: checked", "append-only vs HEAD",
  ]);
});

test("make ci rejects mutable pins before npm work", (t) => {
  const root = makeFixture(t);
  put(root, ".github/workflows/check.yml", referenceWorkflow("owner/action@main", "step"));
  assertPinsBlock(runMake(root));
});

test("make ci rejects a snapshot rewritten by the npm build", (t) => {
  assertBuildDriftBlocks(runMake(makeFixture(t), { REWRITE_SNAPSHOT: "1" }));
});

test("removing the pin command makes the integration regression assertion fail", (t) => {
  const mutated = makefile.replace(/^\tnode scripts\/check-workflow-pins.mjs\n/m, "");
  assert.notEqual(mutated, makefile);
  const root = makeFixture(t, mutated);
  put(root, ".github/workflows/check.yml", referenceWorkflow("owner/action@main", "step"));
  const result = runMake(root);
  assert.equal(result.status, 0, output(result));
  assert.throws(() => assertPinsBlock(result), assert.AssertionError);
});

test("removing the snapshot recipe makes the integration regression assertion fail", (t) => {
  const mutated = makefile.replace(/^\tnode scripts\/check-snapshots.mjs\n/m, "");
  assert.notEqual(mutated, makefile);
  const result = runMake(makeFixture(t, mutated), { REWRITE_SNAPSHOT: "1" });
  assert.equal(result.status, 0, output(result));
  assert.throws(() => assertBuildDriftBlocks(result), assert.AssertionError);
});

// This deliberately checks this small workflow's shape, not arbitrary shell syntax.
function assertNightlyContract(workflow) {
  assert.ok(Object.hasOwn(workflow.on, "pull_request"), "PR coverage");
  assert.deepEqual(workflow.on.push.branches, ["main"], "main push coverage");
  assert.equal(workflow.on.schedule.length, 1, "one daily schedule");
  assert.match(workflow.on.schedule[0].cron, /^(?:[0-5]?\d) (?:[01]?\d|2[0-3]) \* \* \*$/, "daily UTC cron");
  assert.deepEqual(workflow.permissions, { contents: "read" }, "read-only token");
  assert.deepEqual(Object.keys(workflow.jobs), ["ci"], "same full CI job");
  const job = workflow.jobs.ci;
  assert.ok(!Object.hasOwn(job, "if"), "unconditional CI job");
  assert.ok(!Object.hasOwn(job, "permissions"), "no job token override");
  const steps = job.steps;
  assert.equal(steps.length, 4, "only checkout, setup, locked install and full gate");
  assert.ok(steps.every((step) => !Object.hasOwn(step, "if")), "unconditional CI steps");
  assert.match(steps[0].uses, /^actions\/checkout@/);
  assert.equal(referenceError(steps[0].uses), null, "pinned checkout");
  assert.equal(steps[0].with["persist-credentials"], false);
  assert.equal(steps[0].with["fetch-depth"], 0, "BASE comparison needs history");
  assert.match(steps[1].uses, /^jdx\/mise-action@/);
  assert.equal(referenceError(steps[1].uses), null, "pinned setup");
  assert.equal(steps[1].with.install, true);
  assert.equal(steps[1].with.install_args, "node");
  assert.deepEqual(steps.filter((step) => Object.hasOwn(step, "run")).map((step) => step.run), ["npm ci", 'make ci BASE="$BASE"'], "locked install and full gate; no deployment command");
  assert.deepEqual(steps[3].env, { BASE: "${{ github.event.pull_request.base.sha || '' }}" });
  assert.doesNotMatch(JSON.stringify(workflow), /\bsecrets\b/i, "no secrets reference");
}

test("actual CI workflow has a daily, secret-free, read-only full gate", () => {
  assertNightlyContract(parse(ciSource));
});

for (const [name, mutate] of [
  ["removed schedule", (workflow) => { delete workflow.on.schedule; }],
  ["weekly schedule", (workflow) => { workflow.on.schedule[0].cron = "23 2 * * 1"; }],
  ["removed full gate", (workflow) => { workflow.jobs.ci.steps.pop(); }],
  ["replaced full gate", (workflow) => { workflow.jobs.ci.steps[3].run = "npm test"; }],
  ["secret reference", (workflow) => { workflow.jobs.ci.env = { TOKEN: "${{ secrets.TOKEN }}" }; }],
  ["write token", (workflow) => { workflow.permissions.contents = "write"; }],
  ["job write token", (workflow) => { workflow.jobs.ci.permissions = { contents: "write" }; }],
  ["conditional job", (workflow) => { workflow.jobs.ci.if = "github.event_name == 'pull_request'"; }],
  ["missing PR coverage", (workflow) => { delete workflow.on.pull_request; }],
  ["missing main push coverage", (workflow) => { workflow.on.push.branches = ["other"]; }],
  ["mutable setup", (workflow) => { workflow.jobs.ci.steps[1].uses = "jdx/mise-action@main"; }],
  ["unlocked install", (workflow) => { workflow.jobs.ci.steps[2].run = "npm install"; }],
  ["persisted checkout credentials", (workflow) => { workflow.jobs.ci.steps[0].with["persist-credentials"] = true; }],
  ["removed BASE env", (workflow) => { delete workflow.jobs.ci.steps[3].env; }],
  ["deployment command", (workflow) => { workflow.jobs.ci.steps[3].run = "wrangler deploy"; }],
]) {
  test(`nightly contract rejects a mutation: ${name}`, () => {
    const workflow = parse(ciSource);
    // Establish a valid baseline so a pre-existing failure cannot prove mutation coverage.
    assertNightlyContract(workflow);
    mutate(workflow);
    assert.throws(() => assertNightlyContract(workflow));
  });
}

test("pin validation accepts changed weekly statistics workflows with secrets and no uses", () => {
  const source = `
name: revised-statistics-rebuild
on:
  schedule:
    - cron: "17 6 * * 2"
permissions: {}
jobs:
  rebuild:
    runs-on: ubuntu-24.04
    steps:
      - name: Request the revised statistics build
        env:
          BUILD_HOOK_URL: \${{ secrets.REVISED_STATS_DEPLOY_HOOK_URL }}
        run: curl --fail --silent --output /dev/null -X POST "$BUILD_HOOK_URL"
`;
  // The secret-free nightly contract belongs to ci.yml, not to the pin guard.
  assert.deepEqual(validateWorkflow(source, "stats-rebuild.yml"), { usesCount: 0, errors: [] });
});
