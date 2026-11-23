// Match the rendered Starlight Sources heading marker, not a link to it.
export function splitReleasePage(route, html) {
  const parts = html.split(/<h2 id="sources"(?=[\s>])/);
  if (parts.length !== 2) {
    throw new Error(`${route} must render exactly one Sources boundary (<h2 id="sources"); found ${parts.length - 1}.`);
  }
  const [bodyHtml, sourcesHtml] = parts;
  return { bodyHtml, sourcesHtml };
}
