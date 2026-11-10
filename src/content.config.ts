import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { REPO_PATTERN, TAG_PATTERN } from "../scripts/lib/release-drift.mjs";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({
    extend: z.object({
      follows: z.object({
        repo: z.string().regex(REPO_PATTERN),
        tag: z.string().regex(TAG_PATTERN),
      }).strict().optional(),
    }),
  }) }),
};
