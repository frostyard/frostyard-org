// A complete description map for the problem report table tests.
//
// The builder fills every envelope field, kind and detail field that the given
// schema copy has, with text that only has to be non-empty. The tests then
// break 1 item at a time to check the error.

export function completeDescriptions(schema) {
  const envelope = {};
  for (const name of Object.keys(schema.properties)) {
    if (name === "detail") continue;
    if (name === "image") {
      for (const leaf of Object.keys(schema.properties.image.properties)) envelope[`image.${leaf}`] = `Fixture text for image.${leaf}.`;
      continue;
    }
    envelope[name] = `Fixture text for ${name}.`;
  }

  const kinds = {};
  for (const kind of schema.properties.kind.enum) {
    const fields = {};
    for (const field of Object.keys(schema.$defs[kind]?.properties ?? {})) {
      fields[field] = `Fixture text for ${kind}.${field}.`;
    }
    kinds[kind] = { title: `Fixture title for ${kind}`, purpose: `Fixture purpose for ${kind}`, fields };
  }

  return { envelope, kinds };
}
