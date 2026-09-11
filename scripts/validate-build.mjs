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

const required = ["index.html","search/index.html","saved/index.html","about/index.html","safety/index.html","404.html","robots.txt","rss.xml","sitemap-index.xml","pagefind/pagefind.js","og.png"];
for (const relative of required) { try { await fs.access(path.join(dist,relative)); } catch { fail(`${relative} がありません`); } }
const ogPng = await fs.readFile(path.join(dist,"og.png"));
if (ogPng.readUInt32BE(16) !== 1200 || ogPng.readUInt32BE(20) !== 630) fail("OG画像は1200×630pxである必要があります");
const robots = await fs.readFile(path.join(dist,"robots.txt"),"utf8");
if (!robots.includes("Allow: /") || !robots.includes("Sitemap:")) fail("robots.txtにクロール許可またはサイトマップ案内がありません");
const sitemap = await fs.readFile(path.join(dist,"sitemap-index.xml"),"utf8");
if (!sitemap.includes("<sitemapindex")) fail("サイトマップ索引が不正です");
const pages = [];
const walk = async (directory) => { for (const entry of await fs.readdir(directory,{withFileTypes:true})) { const full=path.join(directory,entry.name); if(entry.isDirectory()) await walk(full); else if(entry.name.endsWith(".html")) pages.push(full); } };
await walk(dist);
const titles = new Set();
for (const file of pages) {
  const html = await fs.readFile(file,"utf8");
  const relative = path.relative(dist,file);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim();
  if (!title) fail(`${relative} にtitleがありません`);
  if (titles.has(title)) fail(`${relative} のtitleが他ページと重複しています: ${title}`);
  titles.add(title);
  if (!description || description.length < 20) fail(`${relative} のdescriptionが空または短すぎます`);
  if (!html.includes('<link rel="canonical"')) fail(`${path.relative(dist,file)} にcanonicalがありません`);
  for (const value of ['property="og:title"','property="og:description"','property="og:image"','name="twitter:card"','type="application/ld+json"']) if (!html.includes(value)) fail(`${relative} にSEO要素がありません: ${value}`);
  if (/noindex/i.test(html)) fail(`${path.relative(dist,file)} に未承認のnoindexがあります`);
}
if (!homeHtml.includes('name="q"') || !homeHtml.includes('/moods/fear-of-failure/') || !homeHtml.includes('/areas/career/')) fail("トップに悩み検索の入口がありません");
const errorHtml = await fs.readFile(path.join(dist,"404.html"),"utf8");
for (const value of ['name="q"','href="/#find"','href="/"']) if (!errorHtml.includes(value)) fail(`404ページに復帰導線がありません: ${value}`);
console.log(`ビルド検証完了: ${pages.length} HTML / 思想個別ページ ${thoughts.length}件`);
