import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { parseTree } from "jsonc-parser";

const policyPath = "policies/agent-governance.json";
const schemaPath = "policies/schemas/repository-agent-governance.schema.json";
const schemaPin = {
  commit: "96bf43226d19a05811e1767fb69cd051a3691060",
  path: "organization/schemas/v1/repository-agent-governance.schema.json",
  sha256: "254e131a94c5477e861b0ec792defa1fd05ddebe380fc4e062d03cefc3ab8ebe",
};
const schemaBytes = readFileSync(new URL(`../${schemaPath}`, import.meta.url));
const schemaHash = createHash("sha256").update(schemaBytes).digest("hex");
if (schemaHash !== schemaPin.sha256) {
  throw new Error(`${schemaPath}: SHA-256 mismatch: got ${schemaHash}, expected ${schemaPin.sha256} for frostyard/core@${schemaPin.commit}:${schemaPin.path}`);
}
const schema = JSON.parse(schemaBytes.toString("utf8"));
const validateSchema = new Ajv2020({ allErrors: true, ownProperties: true }).compile(schema);

const deniedActions = [
  "merge-pr", "push-protected-branch", "publish-artifact", "publish-release",
  "deploy", "modify-protected-environment", "manage-credentials",
];
const localActions = new Set(["read", "write", "run-tests"]);
const requiredPaths = new Map([
  ["release-and-publication", ["astro.config.mjs", "package.json", "package-lock.json", "public/schemas/**"]],
  ["deployment-and-infrastructure", ["wrangler.jsonc", "astro.config.mjs", ".github/workflows/stats-rebuild.yml"]],
]);

function rejectDuplicateKeys(node) {
  if (node.type === "object") {
    const keys = new Set();
    for (const { children: [key, value] } of node.children) {
      if (keys.has(key.value)) throw new Error(`duplicate JSON key ${JSON.stringify(key.value)}`);
      keys.add(key.value);
      rejectDuplicateKeys(value);
    }
  } else if (node.type === "array") {
    for (const child of node.children) rejectDuplicateKeys(child);
  }
}

// Evaluate only validated policy. Inherited object names are not action rules.
export function actionDecision(policy, action) {
  return Object.hasOwn(policy.actions, action) ? policy.actions[action] : policy.default_decision;
}

export function validatePolicy(source) {
  const policy = JSON.parse(source);
  rejectDuplicateKeys(parseTree(source));
  if (policy?.schema_version !== 1) throw new Error("unsupported or missing schema_version (expected 1)");
  if (!validateSchema(policy)) {
    throw new Error(validateSchema.errors.map(({ instancePath, message }) => `${instancePath || "/"} ${message}`).join("; "));
  }

  for (const action of deniedActions) {
    if (policy.actions[action] !== "deny") throw new Error(`actions.${action} must explicitly deny`);
  }
  for (const [action, decision] of Object.entries(policy.actions)) {
    if (decision !== "deny" && !localActions.has(action) && !(action === "open-pr" && decision === "review-required")) {
      throw new Error(`actions.${action} may not grant additional site authority`);
    }
  }

  const boundaries = new Map();
  for (const boundary of policy.protected_boundaries) {
    if (boundaries.has(boundary.id)) throw new Error(`duplicate protected boundary ${boundary.id}`);
    boundaries.set(boundary.id, boundary);
  }
  for (const [id, paths] of requiredPaths) {
    const boundary = boundaries.get(id);
    if (!boundary) throw new Error(`missing protected boundary ${id}`);
    if (!["high", "critical"].includes(boundary.minimum_risk_tier)) throw new Error(`${id} requires at least high risk`);
    for (const path of paths) {
      if (!boundary.paths.includes(path)) throw new Error(`${id} must cover ${path}`);
    }
  }
  return policy;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const path = join(process.cwd(), policyPath);
    if (!lstatSync(path).isFile()) throw new Error("expected a regular policy file");
    const source = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path));
    const policy = validatePolicy(source);
    console.log(`Agent governance: checked 1 policy (v${policy.schema_version}, ${Object.keys(policy.actions).length} actions, ${policy.protected_boundaries.length} protected boundaries) and 1 pinned schema`);
  } catch (error) {
    console.error(`FAIL: ${policyPath}: ${error.message}`);
    process.exitCode = 1;
  }
}
