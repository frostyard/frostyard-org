// Validate the public weekly problem statistics and turn them into a view.
//
// The statistics come from report.frostyard.org/v1/stats, a service outside
// this repository (frostyard/problem-intake). The values are untrusted display
// data, and a number from 1 to 4 must never reach a page: the service hides
// small cells, and this module refuses a document that publishes one anyway.
// The shape and the rules are in that repository's docs/specs/stats.md.

const INDEX_SCHEMA = "frostyard.problem-stats-index/1";
const WEEK_SCHEMA = "frostyard.problem-stats/1";
const MIN_CELL = 5;
const WEEK = /^20[2-9][0-9]-W(0[1-9]|[1-4][0-9]|5[0-3])$/;
const IMAGE_VERSION = /^[0-9]{14}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const TABLE_NAMES = ["reports", "app_problems", "installs"];

const TABLE_INFO = {
  reports: {
    label: "System problems, by image and kind",
    note: "Counts of system problems for each image and kind.",
    groupLabel: "Image",
  },
  app_problems: {
    label: "App problems, by app and class",
    note: "Counts of Frostyard app problems for each app and class.",
    groupLabel: "App",
  },
  installs: {
    label: "Weekly counts, by image and version",
    note: "Weekly count reports, for each image and version. Only users who turned reporting on send them (on Floe, the computer), so 1 desktop can count more than once.",
    groupLabel: "Image",
  },
};

/**
 * @typedef {{ key: string, value: number | null }} StatsCell
 * @typedef {{ key: string, total: number | null, cells: StatsCell[] }} StatsRow
 * @typedef {{
 *   name: string,
 *   label: string,
 *   note: string,
 *   groupLabel: string,
 *   groupBy: string,
 *   cellBy: string,
 *   total: number | null,
 *   columns: string[],
 *   rows: StatsRow[]
 * }} StatsTable
 * @typedef {{ empty: false, fetchedAt: string | null, week: string, weekCount: number, tables: StatsTable[] }} StatsView
 * @typedef {{ empty: true, fetchedAt: string | null }} EmptyStatsView
 */

function fail(path, message) {
  throw new Error(`stats: ${path} ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, wanted, path) {
  if (!isObject(value)) fail(path, "must be an object.");
  const actual = Object.keys(value).sort();
  const expected = [...wanted].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(path, `must have exactly the keys ${expected.join(", ")}, not ${actual.join(", ")}.`);
  }
}

function checkCount(value, path) {
  if (value === null) return;
  if (!Number.isInteger(value) || value < MIN_CELL) {
    fail(path, `must be null or a whole number of at least ${MIN_CELL}, not ${JSON.stringify(value)}.`);
  }
}

function checkWeek(value, path) {
  if (typeof value !== "string" || !WEEK.test(value)) {
    fail(path, `must be an ISO week such as 2026-W45, not ${JSON.stringify(value)}.`);
  }
}

// The 3 tables and their axes, as the schema copy defines them.
function axes(schema) {
  const imageIds = schema?.properties?.image?.properties?.id?.enum ?? [];
  const kinds = (schema?.properties?.kind?.enum ?? []).filter((kind) => kind !== "app_problem" && kind !== "count");
  const appIds = schema?.$defs?.app_problem?.properties?.app_id?.enum ?? [];
  const classes = schema?.$defs?.app_problem?.properties?.class?.enum ?? [];
  if (!Array.isArray(imageIds) || imageIds.length === 0) fail("schema", "has no image ID enum.");
  return {
    reports: { group_by: "image", cell_by: "kind", groups: imageIds, cells: kinds },
    app_problems: { group_by: "app_id", cell_by: "class", groups: appIds, cells: classes },
    installs: { group_by: "image", cell_by: "image_version", groups: imageIds, cells: null },
  };
}

function checkTable(table, axis, path) {
  exactKeys(table, ["group_by", "cell_by", "total", "groups"], path);
  if (table.group_by !== axis.group_by) fail(`${path}.group_by`, `must be "${axis.group_by}".`);
  if (table.cell_by !== axis.cell_by) fail(`${path}.cell_by`, `must be "${axis.cell_by}".`);
  if (!isObject(table.groups)) fail(`${path}.groups`, "must be an object.");

  for (const [groupKey, group] of Object.entries(table.groups)) {
    const groupPath = `${path}.groups.${groupKey}`;
    if (!axis.groups.includes(groupKey)) fail(groupPath, `is not a value of ${axis.group_by} in the schema.`);
    exactKeys(group, ["total", "cells"], groupPath);
    checkCount(group.total, `${groupPath}.total`);
    if (!isObject(group.cells)) fail(`${groupPath}.cells`, "must be an object.");
    if (Object.keys(group.cells).length === 0) fail(`${groupPath}.cells`, "must hold at least 1 cell: a group with no cell is absent.");
    for (const [cellKey, value] of Object.entries(group.cells)) {
      const cellPath = `${groupPath}.cells.${cellKey}`;
      if (axis.cells === null) {
        if (!IMAGE_VERSION.test(cellKey)) fail(cellPath, `is not an image version of 14 digits.`);
      } else if (!axis.cells.includes(cellKey)) {
        fail(cellPath, `is not a value of ${axis.cell_by} in the schema.`);
      }
      checkCount(value, cellPath);
    }
  }

  // A table with no groups is empty: its total is exactly 0, and only then.
  if (Object.keys(table.groups).length === 0) {
    if (table.total !== 0) fail(`${path}.total`, `must be 0 for a table with no groups, not ${JSON.stringify(table.total)}.`);
  } else if (table.total === 0) {
    fail(`${path}.total`, "must not be 0 while the table has groups.");
  } else {
    checkCount(table.total, `${path}.total`);
  }

  checkTableEquations(table, path);
}

function publishedSum(values) {
  return values.filter((value) => value !== null).reduce((total, value) => total + value, 0);
}

function hiddenCount(values) {
  return values.filter((value) => value === null).length;
}

// The equations of docs/specs/stats.md rules 5 and 6, which keep every hidden
// count at 2 or more possible values. A document that publishes 1 of the
// parts of an equation beside 1 hidden part lets a reader work the hidden
// part out by subtraction, so this refuses it.
function checkTableEquations(table, path) {
  const groupKeys = Object.keys(table.groups);

  // The group equation, and the bound rule for a group.
  for (const groupKey of groupKeys) {
    const group = table.groups[groupKey];
    const groupPath = `${path}.groups.${groupKey}`;
    const values = Object.values(group.cells);
    const hidden = hiddenCount(values);
    const sum = publishedSum(values);
    if (group.total === null) {
      // A hidden total beside only published cells is their sum.
      if (hidden === 0) fail(`${groupPath}.total`, "must not be hidden while every cell is published: it is the sum of the cells.");
      continue;
    }
    if (hidden === 0) {
      if (group.total !== sum) fail(`${groupPath}.total`, `must be the sum of its cells (${sum}), not ${group.total}.`);
      continue;
    }
    if (hidden === 1) {
      fail(`${groupPath}.total`, "must not stay published beside 1 hidden cell: the hidden cell can be found by subtraction.");
    }
    if (group.total < sum + hidden) {
      fail(`${groupPath}.total`, `must be at least the published cells plus 1 for each hidden cell (${sum + hidden}), not ${group.total}.`);
    }
    if (group.total - sum - hidden < 1) {
      fail(`${groupPath}.total`, "must leave slack above the hidden cells: each of them could be 1, so the hidden cells can be found by subtraction.");
    }
  }

  // The table equation, and the bound rule for the table.
  if (groupKeys.length === 0) return;
  const hiddenTotals = groupKeys.filter((groupKey) => table.groups[groupKey].total === null);
  if (table.total === null) {
    // A hidden table total beside only published group totals is their sum.
    if (hiddenTotals.length === 0) fail(`${path}.total`, "must not be hidden while every group total is published: it is their sum.");
    return;
  }
  const sumPublished = publishedSum(groupKeys.map((groupKey) => table.groups[groupKey].total));
  if (hiddenTotals.length === 0) {
    if (table.total !== sumPublished) fail(`${path}.total`, `must be the sum of the group totals (${sumPublished}), not ${table.total}.`);
    return;
  }
  if (hiddenTotals.length === 1) {
    fail(`${path}.total`, "must not stay published beside 1 hidden group total: that total can be found by subtraction.");
  }

  // Each hidden group total sits at or above its lower bound: its published
  // cells plus 1 for each hidden cell. The table total must leave room above
  // those bounds, or each hidden total has only 1 possible value.
  let lower = 0;
  for (const groupKey of hiddenTotals) {
    const values = Object.values(table.groups[groupKey].cells);
    lower += publishedSum(values) + hiddenCount(values);
  }
  const room = table.total - sumPublished;
  if (room < lower) {
    fail(`${path}.total`, `must be at least ${lower} above the published group totals, not ${room}: a hidden group total cannot be below its own cells.`);
  }
  if (room - lower < 1) {
    fail(`${path}.total`, "must leave slack above the hidden group totals: each of them could sit at its lower bound, so they can be found by subtraction.");
  }
}

function checkWeekDocument(document, weeks, schema, path) {
  exactKeys(document, ["schema", "week", "min_cell", "tables"], path);
  if (document.schema !== WEEK_SCHEMA) fail(`${path}.schema`, `must be "${WEEK_SCHEMA}".`);
  checkWeek(document.week, `${path}.week`);
  if (!weeks.includes(document.week)) fail(`${path}.week`, `is ${JSON.stringify(document.week)}, which is not in the week list.`);
  if (document.min_cell !== MIN_CELL) fail(`${path}.min_cell`, `must be ${MIN_CELL}.`);
  exactKeys(document.tables, TABLE_NAMES, `${path}.tables`);

  const tableAxes = axes(schema);
  for (const name of TABLE_NAMES) {
    checkTable(document.tables[name], tableAxes[name], `${path}.tables.${name}`);
  }
}

function checkIndex(document, schema, path) {
  exactKeys(document, ["schema", "weeks", "latest"], path);
  if (document.schema !== INDEX_SCHEMA) fail(`${path}.schema`, `must be "${INDEX_SCHEMA}".`);
  if (!Array.isArray(document.weeks)) fail(`${path}.weeks`, "must be an array.");
  let previous = null;
  document.weeks.forEach((week, index) => {
    const weekPath = `${path}.weeks[${index}]`;
    checkWeek(week, weekPath);
    if (previous !== null && week <= previous) fail(weekPath, `must be later than ${previous}: the weeks are sorted and unique.`);
    previous = week;
  });
  if (document.latest !== null) checkWeekDocument(document.latest, document.weeks, schema, `${path}.latest`);
}

// A snapshot file is the committed fallback: the checked answer, its date, and
// null until the service answers for the first time.
function checkSnapshot(snapshot, schema) {
  exactKeys(snapshot, ["source", "fetchedAt", "stats"], "snapshot");
  if (typeof snapshot.source !== "string" || snapshot.source === "") fail("snapshot.source", "must be the URL of the statistics.");
  if (snapshot.fetchedAt !== null) {
    if (typeof snapshot.fetchedAt !== "string" || !ISO_DATE_TIME.test(snapshot.fetchedAt) || Number.isNaN(Date.parse(snapshot.fetchedAt))) {
      fail("snapshot.fetchedAt", `must be null or an ISO date and time, not ${JSON.stringify(snapshot.fetchedAt)}.`);
    }
  }
  if (snapshot.stats !== null) checkIndex(snapshot.stats, schema, "snapshot.stats");
}

function isSnapshot(document) {
  return isObject(document) && Object.hasOwn(document, "stats") && Object.hasOwn(document, "source");
}

// Accepts the answer of /v1/stats, or the committed snapshot around it, and
// returns what it was given. It throws an Error that names the bad part.
/**
 * @param {Record<string, any>} document
 * @param {Record<string, any>} schema
 * @returns {Record<string, any>}
 */
export function validateStats(document, schema) {
  if (!isObject(schema)) throw new Error("stats: the problem report schema is missing.");
  if (!isObject(document)) throw new Error("stats: the statistics document is missing.");
  if (isSnapshot(document)) checkSnapshot(document, schema);
  else checkIndex(document, schema, "stats");
  return document;
}

function countedColumns(axis, groups) {
  if (axis.cells !== null) return [...axis.cells];
  const versions = new Set();
  for (const group of Object.values(groups)) {
    for (const key of Object.keys(group.cells)) versions.add(key);
  }
  return [...versions].sort().reverse();
}

function viewTable(name, table, axis) {
  const columns = countedColumns(axis, table.groups);
  const rows = Object.keys(table.groups)
    .sort()
    .map((key) => {
      const group = table.groups[key];
      return {
        key,
        total: group.total,
        cells: columns.map((column) => ({
          key: column,
          value: Object.hasOwn(group.cells, column) ? group.cells[column] : 0,
        })),
      };
    });
  return {
    name,
    label: TABLE_INFO[name].label,
    note: TABLE_INFO[name].note,
    groupLabel: TABLE_INFO[name].groupLabel,
    groupBy: table.group_by,
    cellBy: table.cell_by,
    total: table.total,
    columns,
    rows,
  };
}

// The view the stats page renders: the week, how many weeks are published, and
// 1 table for each of the 3 tables. The empty view means the service has no
// week yet.
/**
 * @param {Record<string, any>} snapshot
 * @param {Record<string, any>} schema
 * @returns {StatsView | EmptyStatsView}
 */
export function statsView(snapshot, schema) {
  validateStats(snapshot, schema);
  const { fetchedAt } = snapshot;
  if (snapshot.stats === null || snapshot.stats.latest === null) return { empty: true, fetchedAt };

  const { weeks, latest } = snapshot.stats;
  const tableAxes = axes(schema);
  return {
    empty: false,
    fetchedAt,
    week: latest.week,
    weekCount: weeks.length,
    tables: TABLE_NAMES.map((name) => viewTable(name, latest.tables[name], tableAxes[name])),
  };
}
