import assert from "node:assert/strict";
import { test } from "node:test";

import { splitReleasePage } from "../lib/release-page-checks.mjs";
import { textOf } from "../lib/site-files.mjs";

const route = "/docs/apps/frostnotes";
const release = "The latest release is v0.7.0.";
const body = '<p>Install Frostnotes. <a href="#sources">Sources</a></p>';
const heading = '<h2 id="sources">Sources</h2>';
const notes = `<ul><li>${release}</li></ul>`;

// The release sentence occurs only in Sources, where the body check must not see it.
const html = `${body}${heading}${notes}`;

test("one Sources boundary isolates source-only release words from the body", () => {
  const { bodyHtml, sourcesHtml } = splitReleasePage(route, html);
  assert.equal(bodyHtml, body);
  assert.ok(textOf(sourcesHtml).includes(release));
  assert.ok(!textOf(bodyHtml).includes(release));
});

const invalidBoundaries = [
  ["missing", "", 0],
  ["changed", '<h2 class="heading" id="sources">Sources</h2>', 0],
  ["duplicate", `${heading}${heading}`, 2],
];
for (const [name, replacement, count] of invalidBoundaries) {
  test(`a ${name} Sources boundary fails with the page and count`, () => {
    assert.throws(() => splitReleasePage(route, html.replace(heading, replacement)), {
      message: `/docs/apps/frostnotes must render exactly one Sources boundary (<h2 id="sources"); found ${count}.`,
    });
  });
}
