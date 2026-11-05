// Pure page checks for the problem report pages, so they can be tested on a
// fixture instead of a build.
//
// The privacy page must show every field of the schema in the part of the page
// that belongs to it. A field appears in more than 1 kind (`error_class`,
// `outcome`, `version`, and `count`, which is also a kind name), so a check
// over the whole page would pass while 1 kind silently loses a row. The stats
// page must show exactly the counts that the validated snapshot allows: a
// number from 1 to 4, or a count that should be hidden, must never render.

const TABLE_NAMES = ["reports", "app_problems", "installs"];

function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The first-column cells of the field tables: a <td> whose first child is the
// <code> element that names the field.
function fieldNames(part) {
  return [...part.matchAll(/<td\b[^>]*>\s*<code\b[^>]*>([^<]+)<\/code>/g)].map((match) => match[1].trim());
}

// Every top-level property but `detail`, with the image object flattened to
// its 2 leaf fields. This is the same envelope the report table renders.
function envelopeFields(schema) {
  const fields = [];
  for (const [name, property] of Object.entries(schema?.properties ?? {})) {
    if (name === "detail") continue;
    if (name === "image") {
      for (const leaf of Object.keys(property?.properties ?? {})) fields.push(`image.${leaf}`);
      continue;
    }
    fields.push(name);
  }
  return fields;
}

function kindParts(html) {
  const parts = new Map();
  const starts = [...html.matchAll(/id="kind-([^"]+)"/g)];
  for (const [index, match] of starts.entries()) {
    const start = match.index ?? 0;
    const end = starts[index + 1]?.index ?? html.length;
    parts.set(match[1], html.slice(start, end));
  }
  return parts;
}

/**
 * @param {string} html the built /privacy/problem-reports/ page
 * @param {Record<string, any>} schema the built schema copy
 * @returns {string[]} what is wrong, as messages; empty when the page is complete
 */
export function checkPrivacyPage(html, schema) {
  const errors = [];
  const firstKind = html.search(/id="kind-/);
  const envelope = firstKind === -1 ? html : html.slice(0, firstKind);
  const names = new Set(fieldNames(envelope));
  for (const field of envelopeFields(schema)) {
    if (!names.has(field)) errors.push(`the envelope table has no row for the field ${field}.`);
  }

  const parts = kindParts(html);
  for (const kind of schema?.properties?.kind?.enum ?? []) {
    const part = parts.get(kind);
    if (part === undefined) {
      errors.push(`the kind ${kind} has no id="kind-${kind}" part.`);
      continue;
    }
    const kindNames = new Set(fieldNames(part));
    for (const field of Object.keys(schema.$defs?.[kind]?.properties ?? {})) {
      if (!kindNames.has(field)) errors.push(`the kind ${kind} has no row for the field ${field}.`);
    }
    if (kind === "app_problem") {
      const partText = textOf(part);
      for (const appId of schema.$defs.app_problem.properties.app_id.enum ?? []) {
        if (!partText.includes(appId)) errors.push(`the kind app_problem does not name the app ID ${appId}.`);
      }
    }
  }

  return errors;
}

function expectedStatsValues(snapshot) {
  const latest = snapshot?.stats?.latest ?? null;
  if (latest === null) return [];
  const expected = [];
  for (const name of TABLE_NAMES) {
    const table = latest.tables?.[name] ?? {};
    for (const group of Object.values(table.groups ?? {})) {
      for (const value of Object.values(group.cells ?? {})) {
        expected.push(value === null ? "hidden" : String(value));
      }
      expected.push(group.total === null ? "hidden" : String(group.total));
    }
    if (table.total === null) expected.push("hidden");
    // An empty table publishes 0, which the page shows without data-stat.
    else if (typeof table.total === "number" && table.total !== 0) expected.push(String(table.total));
  }
  return expected;
}

function difference(left, right) {
  const rest = [...right];
  const missing = [];
  for (const value of left) {
    const index = rest.indexOf(value);
    if (index === -1) missing.push(value);
    else rest.splice(index, 1);
  }
  return { missing, extra: rest };
}

/**
 * @param {string} html the built /stats/ page
 * @param {Record<string, any>} snapshot the validated src/data/problem-stats.json
 * @returns {string[]} what is wrong, as messages; empty when the page matches the snapshot
 */
export function checkStatsPage(html, snapshot) {
  const errors = [];
  const rendered = [...html.matchAll(/data-stat="([^"]*)"/g)].map((match) => match[1]);
  for (const value of rendered) {
    if (value !== "hidden" && !(/^[0-9]+$/.test(value) && Number(value) >= 5)) {
      errors.push(`the page renders data-stat="${value}": no published count is from 1 to 4.`);
    }
  }

  if ((snapshot?.stats?.latest ?? null) === null) {
    if (!textOf(html).includes("No data yet")) errors.push('the page must say "No data yet" while the snapshot is empty.');
    if (rendered.length !== 0) errors.push("the page renders a count while the snapshot has no week.");
    return errors;
  }

  const expected = expectedStatsValues(snapshot);
  const { missing, extra } = difference(expected, rendered);
  if (missing.length > 0) errors.push(`the page does not render ${missing.length} count(s) that the snapshot publishes: ${missing.join(", ")}.`);
  if (extra.length > 0) errors.push(`the page renders ${extra.length} count(s) that the snapshot does not publish: ${extra.join(", ")}.`);
  return errors;
}
