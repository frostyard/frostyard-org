// Build the problem report field table from the schema copy and a description map.
//
// The privacy page renders this table, so every kind and every field of the
// schema must have a description. A kind or a field without one fails the
// build: the page is public documentation of what a report can contain, and a
// field that arrives without words would publish silently. A description map
// that names a kind or a field the schema does not have also fails, because
// the page would describe data that is never sent.

/**
 * @typedef {{ field: string, description: string, values: string[] | null, required: boolean }} ReportField
 * @typedef {{ kind: string, title: string, purpose: string, fields: ReportField[] }} ReportKind
 * @typedef {{ envelope: ReportField[], kinds: ReportKind[], appIds: string[] }} ReportTable
 */

function nonEmpty(value) {
  return typeof value === "string" && value.trim() !== "";
}

function valuesOf(property) {
  if (!property || typeof property !== "object") return null;
  if (Array.isArray(property.enum)) return property.enum.map(String);
  if (Object.hasOwn(property, "const")) return [String(property.const)];
  return null;
}

function requiredOf(owner) {
  return Array.isArray(owner?.required) ? owner.required.map(String) : [];
}

// The envelope is every top-level property but `detail`. The image object is
// flattened to its 2 leaf fields, so the table names the 8 values a sender
// actually fills.
function envelopeFields(schema) {
  const properties = schema?.properties ?? {};
  const fields = [];
  for (const [name, property] of Object.entries(properties)) {
    if (name === "detail") continue;
    if (name === "image") {
      const required = new Set(requiredOf(property));
      for (const [leaf, leafProperty] of Object.entries(property?.properties ?? {})) {
        fields.push({
          field: `image.${leaf}`,
          property: leafProperty,
          required: required.has(leaf),
        });
      }
      continue;
    }
    fields.push({ field: name, property, required: requiredOf(schema).includes(name) });
  }
  return fields;
}

function describeEnvelope(descriptions, name) {
  const text = descriptions.envelope?.[name];
  if (!nonEmpty(text)) {
    throw new Error(`The envelope field "${name}" has no description in the description map.`);
  }
  return text.trim();
}

function staleKeys(mapped, known, where) {
  const stale = Object.keys(mapped ?? {}).filter((key) => !known.has(key));
  if (stale.length > 0) {
    throw new Error(`The description map has "${stale[0]}", which is not ${where} in the schema.`);
  }
}

/**
 * @param {Record<string, any>} schema
 * @param {Record<string, any>} descriptions
 * @returns {ReportTable}
 */
export function reportTable(schema, descriptions) {
  if (!schema || typeof schema !== "object") throw new Error("The problem report schema is missing.");
  if (!descriptions || typeof descriptions !== "object") throw new Error("The problem report description map is missing.");

  const envelope = envelopeFields(schema);
  const envelopeNames = new Set(envelope.map((item) => item.field));
  staleKeys(descriptions.envelope, envelopeNames, "an envelope field");

  const kindEnum = valuesOf(schema.properties?.kind) ?? [];
  const kindsMap = descriptions.kinds ?? {};
  staleKeys(kindsMap, new Set(kindEnum), "a kind");

  const envelopeRows = envelope.map((item) => ({
    field: item.field,
    description: describeEnvelope(descriptions, item.field),
    values: valuesOf(item.property),
    required: item.required,
  }));

  const kinds = kindEnum.map((kind) => {
    const entry = kindsMap[kind];
    if (!entry || typeof entry !== "object") {
      throw new Error(`The kind "${kind}" has no entry in the description map.`);
    }
    if (!nonEmpty(entry.title)) throw new Error(`The kind "${kind}" has no title in the description map.`);
    if (!nonEmpty(entry.purpose)) throw new Error(`The kind "${kind}" has no purpose in the description map.`);

    const definition = schema.$defs?.[kind] ?? {};
    const properties = definition.properties ?? {};
    const required = new Set(requiredOf(definition));
    staleKeys(entry.fields, new Set(Object.keys(properties)), `a field of kind "${kind}"`);
    const fields = Object.entries(properties).map(([field, property]) => {
      const text = entry.fields?.[field];
      if (!nonEmpty(text)) {
        throw new Error(`The field "${field}" of kind "${kind}" has no description in the description map.`);
      }
      return {
        field,
        description: text.trim(),
        values: valuesOf(property),
        required: required.has(field),
      };
    });

    return { kind, title: entry.title.trim(), purpose: entry.purpose.trim(), fields };
  });

  const appIds = valuesOf(schema.$defs?.app_problem?.properties?.app_id) ?? [];

  return { envelope: envelopeRows, kinds, appIds };
}
