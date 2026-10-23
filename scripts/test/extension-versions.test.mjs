import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { compareDebianVersions, listedVersions, newestVersion } from "../extension-versions.mjs";

// Real SHA256SUMS files from https://repository.frostyard.org/ext/<name>/SHA256SUMS,
// saved on 2026-10-23. Each lists its images in no fixed order.
const fixture = name => readFile(new URL(`./fixtures/${name}.SHA256SUMS`, import.meta.url), "utf8");

test("selects the newest published version, not the first line", async () => {
  const expected = {
    coder: "2.37.4-1+r2",
    "1password": "8.12.40+r1",
    vscode: "1.143.1-1792691907+r1",
    paseo: "0.12.0+r1",
  };
  for (const [name, version] of Object.entries(expected)) {
    const sums = await fixture(name);
    assert.notEqual(listedVersions(name, sums)[0], version, `${name}: the fixture must not list the newest version first`);
    assert.equal(newestVersion(name, sums), version, name);
  }
});

test("reads every image in a SHA256SUMS file", async () => {
  assert.equal(listedVersions("coder", await fixture("coder")).length, 14);
  assert.equal(listedVersions("vscode", await fixture("vscode")).length, 26);
});

test("orders versions like dpkg", () => {
  const ordered = [
    ["2.37.4-1", "2.37.4-1+r1"],
    ["2.37.4-1+r1", "2.37.4-1+r2"],
    ["2.37.4-1+r2", "2.37.4-1+r10"],
    ["8.12.32+r1", "8.12.34"],
    ["8.12.40", "8.12.40+r1"],
    ["0.9.2+r1", "0.10.0+r1"],
    ["1.133.0-1786487972", "1.143.0-1792533444+r1"],
    ["1.0~rc1", "1.0"],
    ["1.0", "1.0a"],
    ["1.0a", "1.0+"],
    ["9.9-1", "1:0.1-1"],
    ["5+29.7.2-1~debian.13~trixie", "5+29.9.1-1~debian.13~trixie"],
    ["1+7.5.1-debian13-202610032056+r3", "1+7.5.1-debian13-202610032056+r4"],
  ];
  for (const [older, newer] of ordered) {
    assert.ok(compareDebianVersions(older, newer) < 0, `${older} < ${newer}`);
    assert.ok(compareDebianVersions(newer, older) > 0, `${newer} > ${older}`);
  }
  assert.equal(compareDebianVersions("1.0-1", "1.00-1"), 0);
  assert.equal(compareDebianVersions("0:1.0", "1.0"), 0);
});

test("matches only the named extension and handles binary-mode lines", () => {
  const sums = "aaa  dev_12.12+r1_13_x86-64.raw\nbbb *dev_12.13_13_x86-64.raw.zst\nccc  debdev_99.0_13_x86-64.raw\n\n";
  assert.deepEqual(listedVersions("dev", sums), ["12.12+r1", "12.13"]);
  assert.equal(newestVersion("dev", sums), "12.13");
  assert.equal(newestVersion("dev", ""), null);
});
