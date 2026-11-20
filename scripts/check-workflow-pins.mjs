import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAlias, isScalar, parseDocument, visit } from "yaml";

// ADR-0021 exempts local actions, but not container references.
export function referenceError(reference) {
  if (typeof reference !== "string" || reference.length === 0 || /\s/.test(reference)) {
    return "uses must be a non-empty reference string without whitespace";
  }
  if (reference.startsWith("docker://")) {
    return "docker:// uses are not exempt under core ADR-0021/B5; use a local ./ action or an owner/repo[/path] action pinned to a full 40-character commit SHA";
  }
  if (reference.startsWith("./")) {
    const segments = reference.slice(2).split("/");
    return segments.some((segment) => !segment || segment === "." || segment === "..")
      ? "local uses must name a non-empty ./ path without empty, . or .. segments"
      : null;
  }
  const match = reference.match(/^([A-Za-z0-9_-]+)\/([A-Za-z0-9_.-]+)((?:\/[A-Za-z0-9_.-]+)*)@([a-fA-F0-9]{40})$/);
  if (!match || [match[2], ...match[3].split("/").slice(1)].some((part) => part === "." || part === "..")) {
    return "external uses must be owner/repo[/path]@ followed by exactly 40 hexadecimal commit characters (no tags or branches)";
  }
  return null;
}

// Parse only the structural uses fields. Text in run, env and with is not code to inspect.
export function validateWorkflow(source, filename = "workflow") {
  const errors = [];
  let usesCount = 0;
  let workflow;
  try {
    const document = parseDocument(source, { uniqueKeys: true });
    if (document.errors.length) throw new Error(document.errors.map((error) => error.message).join("\n"));
    // Resolve alias keys too: the parser checks literal duplicate keys before alias resolution.
    visit(document, {
      Map(_key, mapping) {
        const keys = new Set();
        for (const pair of mapping.items) {
          const key = isAlias(pair.key) ? pair.key.resolve(document) : pair.key;
          if (!isScalar(key)) continue;
          if (keys.has(key.value)) throw new Error(`duplicate mapping key: ${String(key.value)}`);
          keys.add(key.value);
        }
      },
    });
    workflow = document.toJS({ mapAsMap: true });
  } catch (error) {
    return { usesCount, errors: [`${filename}: invalid YAML: ${error.message}`] };
  }
  const fail = (location, message) => errors.push(`${filename}: ${location}: ${message}`);
  const checkUses = (mapping, location) => {
    if (!mapping.has("uses")) return;
    usesCount += 1;
    const error = referenceError(mapping.get("uses"));
    if (error) fail(`${location}.uses`, error);
  };
  const jobs = workflow instanceof Map ? workflow.get("jobs") : null;
  if (!(jobs instanceof Map) || jobs.size === 0) {
    fail("jobs", "expected a non-empty job mapping");
    return { usesCount, errors };
  }
  for (const [id, job] of jobs) {
    const location = `jobs.${String(id)}`;
    if (typeof id !== "string" || !(job instanceof Map)) {
      fail(location, "expected a named job mapping");
      continue;
    }
    checkUses(job, location);
    if (!job.has("steps")) continue;
    const steps = job.get("steps");
    if (!Array.isArray(steps)) {
      fail(`${location}.steps`, "expected a step sequence");
      continue;
    }
    steps.forEach((step, index) => {
      const stepLocation = `${location}.steps[${index}]`;
      if (!(step instanceof Map)) fail(stepLocation, "expected a step mapping");
      else checkUses(step, stepLocation);
    });
  }
  return { usesCount, errors };
}

export function validateWorkflows(workflows) {
  const results = workflows.map(({ source, filename }) => validateWorkflow(source, filename));
  return {
    workflowCount: workflows.length,
    usesCount: results.reduce((count, result) => count + result.usesCount, 0),
    errors: workflows.length ? results.flatMap((result) => result.errors) : ["no .yml or .yaml workflows found in .github/workflows"],
  };
}

function main(args) {
  if (args.length && (args.length !== 2 || args[0] !== "--root")) {
    throw new Error("usage: node scripts/check-workflow-pins.mjs [--root DIR]");
  }
  const root = args.length ? resolve(args[1]) : fileURLToPath(new URL("..", import.meta.url));
  const directory = join(root, ".github/workflows");
  const workflows = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => /\.ya?ml$/.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      filename: `.github/workflows/${entry.name}`,
      source: readFileSync(join(directory, entry.name), "utf8"),
    }));
  const result = validateWorkflows(workflows);
  for (const error of result.errors) console.error(`FAIL: ${error}`);
  console.log(`check-workflow-pins: checked ${result.workflowCount} workflows and ${result.usesCount} uses references (including local references).`);
  if (result.errors.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`check-workflow-pins: ${error.message}`);
    process.exitCode = 1;
  }
}
