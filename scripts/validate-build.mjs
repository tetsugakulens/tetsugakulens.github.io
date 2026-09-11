#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dist = path.join(root,"dist");
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(root,"src/data",`${name}.json`),"utf8"));
const [thoughts,philosophers,sources] = await Promise.all([readJson("thoughts"),readJson("philosophers"),readJson("sources")]);
const philosopherMap = new Map(philosophers.map((x) => [x.id,x]));
const sourceMap = new Map(sources.map((x) => [x.id,x]));
const moodSlug = {compare:"compare",indecisive:"indecisive",unmotivated:"unmotivated",hated:"fear-of-dislike",hurt:"hurt",angry:"angry",lonely:"lonely",failure:"fear-of-failure",uncertain:"uncertain-future",meaning:"meaning-of-life"};
const areaSlug = {work:"work",relationships:"relationships",love:"love",future:"future",study:"study",career:"career",self:"self"};
const fail = (message) => { throw new Error(`ビルド検証エラー: ${message}`); };

for (const thought of thoughts.filter((x) => x.published)) {
  const file = path.join(dist,"thoughts",thought.slug,"index.html");
  let html; try { html = await fs.readFile(file,"utf8"); } catch { fail(`思想ページがありません: ${thought.slug}`); }
  const philosopher = philosopherMap.get(thought.philosopherId);
  const expected = [`/philosophers/${philosopher.slug}/`,`<script type=\"application/ld+json\"`];
  expected.push(...thought.moodIds.map((id) => `/moods/${moodSlug[id]}/`));
  expected.push(...thought.areaIds.map((id) => `/areas/${areaSlug[id]}/`));
  expected.push(...thought.sourceRefs.map((id) => sourceMap.get(id).url));
  for (const value of expected) if (!html.includes(value)) fail(`${thought.slug} に必要な表示・リンクがありません: ${value}`);
}

const homeHtml = await fs.readFile(path.join(dist,"index.html"),"utf8");
if (homeHtml.includes("思想をもとにした現代語の要約")) fail("トップのカードに編集方針ラベルが重複しています");
const aboutHtml = await fs.readFile(path.join(dist,"about/index.html"),"utf8");
if ((aboutHtml.match(/思想をもとにした現代語の要約/g) || []).length !== 1) fail("現代語要約の説明はaboutページに1回だけ必要です");

const required = ["index.html","search/index.html","saved/index.html","about/index.html","safety/index.html","404.html","robots.txt","rss.xml","sitemap-index.xml","pagefind/pagefind.js"];
for (const relative of required) { try { await fs.access(path.join(dist,relative)); } catch { fail(`${relative} がありません`); } }
const pages = [];
const walk = async (directory) => { for (const entry of await fs.readdir(directory,{withFileTypes:true})) { const full=path.join(directory,entry.name); if(entry.isDirectory()) await walk(full); else if(entry.name.endsWith(".html")) pages.push(full); } };
await walk(dist);
for (const file of pages) {
  const html = await fs.readFile(file,"utf8");
  if (!html.includes('<meta name="description"')) fail(`${path.relative(dist,file)} にdescriptionがありません`);
  if (!html.includes('<link rel="canonical"')) fail(`${path.relative(dist,file)} にcanonicalがありません`);
  if (/noindex/i.test(html)) fail(`${path.relative(dist,file)} に未承認のnoindexがあります`);
}
console.log(`ビルド検証完了: ${pages.length} HTML / 思想個別ページ ${thoughts.length}件`);
