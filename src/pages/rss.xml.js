import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
export async function GET(context) {
  const thoughts = (await getCollection("thoughts")).filter((x) => x.data.published);
  return rss({ title:"哲学レンズ", description:"いまの気持ちに、哲学の見方を。", site:context.site,
    items:thoughts.map((x) => ({title:x.data.statement,description:x.data.explanation,link:`/thoughts/${x.data.slug}/`,pubDate:x.data.reviewedAt})) });
}
