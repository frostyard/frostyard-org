import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { actionDecision, validatePolicy } from "../check-agent-governance.mjs";

const source = readFileSync(new URL("../../policies/agent-governance.json", import.meta.url), "utf8");
function mutate(change) {
  const policy = JSON.parse(source);
  change(policy);
  return JSON.stringify(policy);
}

test("the canonical v1 policy is valid and denies unlisted actions", () => {
  const policy = validatePolicy(source);
  assert.equal(actionDecision(policy, "run-tests"), "allow");
  for (const action of ["approve-pr", "unknown-action", "constructor", "__proto__"]) {
    assert.equal(Object.hasOwn(policy.actions, action), false);
    assert.equal(actionDecision(policy, action), "deny");
  }
});

test("governance rejects malformed and ambiguous JSON", () => {
  assert.throws(() => validatePolicy("{"), SyntaxError);
  const duplicate = source.replace('"deploy": "deny"', '"deploy": "allow", "deplo\\u0079": "deny"');
  assert.throws(() => validatePolicy(duplicate), /duplicate JSON key "deploy"/);
});

for (const version of [0, 2, "1", undefined]) {
  test(`governance rejects unsupported schema_version ${JSON.stringify(version)}`, () => {
    assert.throws(() => validatePolicy(mutate((policy) => { policy.schema_version = version; })), /unsupported or missing schema_version/);
  });
}

test("the core schema rejects default allow, unknown actions and loss of independent exception review", () => {
  for (const [change, diagnosis] of [
    [(policy) => { policy.default_decision = "allow"; }, /\/default_decision/],
    [(policy) => { policy.actions.unknown = "allow"; }, /\/actions.*additional properties/],
    [(policy) => { policy.exception_controls.self_approval = true; }, /\/exception_controls\/self_approval/],
    [(policy) => { policy.exception_controls.independent_authorized_approver = false; }, /\/exception_controls\/independent_authorized_approver/],
  ]) assert.throws(() => validatePolicy(mutate(change)), diagnosis);
});

for (const action of ["merge-pr", "push-protected-branch", "publish-artifact", "publish-release", "deploy", "modify-protected-environment", "manage-credentials"]) {
  test(`site governance requires explicit deny for ${action}`, () => {
    for (const decision of ["allow", "review-required", undefined]) {
      assert.throws(() => validatePolicy(mutate((policy) => { policy.actions[action] = decision; })),
        new RegExp(`actions\\.${action} must explicitly deny`));
    }
  });
}

test("site governance rejects unauthorized actions and unrestricted PR opening", () => {
  for (const action of ["approve-pr", "open-issue", "create-followup", "open-pr"]) {
    assert.throws(() => validatePolicy(mutate((policy) => { policy.actions[action] = "allow"; })),
      /may not grant additional site authority/);
  }
});

for (const [id, path] of [["release-and-publication", "package.json"], ["deployment-and-infrastructure", "wrangler.jsonc"]]) {
  test(`site governance requires the ${id} boundary and its paths`, () => {
    const drop = (policy) => { policy.protected_boundaries = policy.protected_boundaries.filter((item) => item.id !== id); };
    assert.throws(() => validatePolicy(mutate(drop)), new RegExp(`missing protected boundary ${id}`));
    const edit = (change) => mutate((policy) => change(policy.protected_boundaries.find((item) => item.id === id)));
    assert.throws(() => validatePolicy(edit((boundary) => { boundary.paths = boundary.paths.filter((item) => item !== path); })), /must cover/);
    assert.throws(() => validatePolicy(edit((boundary) => { boundary.minimum_risk_tier = "moderate"; })), /requires at least high risk/);
  });
}
