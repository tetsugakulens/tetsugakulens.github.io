import { defineCollection, reference } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

const sources = defineCollection({
  loader: file("./src/data/sources.json"),
  schema: z.object({
    id: z.string().min(1), author: z.string().min(1), work: z.string().min(1),
    section: z.string().min(1), url: z.url(), language: z.string().min(1),
    usageNote: z.string().min(1), lastVerifiedAt: z.coerce.date(),
  }),
});

const philosophers = defineCollection({
  loader: file("./src/data/philosophers.json"),
  schema: z.object({
    id: z.string().min(1), slug: z.string().min(1), nameJa: z.string().min(1),
    nameOriginal: z.string().min(1), era: z.string().min(1), region: z.string().min(1),
    oneLine: z.string().min(1), story: z.string().min(1), centralQuestion: z.string().min(1),
    sourceRefs: z.array(reference("sources")).min(1), published: z.boolean(),
  }),
});

const thoughts = defineCollection({
  loader: file("./src/data/thoughts.json"),
  schema: z.object({
    id: z.string().min(1), slug: z.string().min(1), philosopherId: reference("philosophers"),
    empathy: z.string().min(1), statement: z.string().min(1), explanation: z.string().min(1),
    reflectionQuestion: z.string().min(1), moodIds: z.array(z.string()).min(1),
    areaIds: z.array(z.string()).min(1), themeTags: z.array(z.string()).min(1),
    contentKind: z.enum(["summary", "direct_quote", "editorial"]),
    sourceRefs: z.array(reference("sources")).min(1), reviewedAt: z.coerce.date(), published: z.boolean(),
  }),
});

export const collections = { sources, philosophers, thoughts };
