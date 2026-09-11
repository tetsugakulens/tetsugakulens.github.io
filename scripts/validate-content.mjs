#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const load = async (name) => JSON.parse(await fs.readFile(path.join(root, "src", "data", `${name}.json`), "utf8"));
const [sources, philosophers, thoughts] = await Promise.all([load("sources"), load("philosophers"), load("thoughts")]);
const moodIds = new Set(["compare","indecisive","unmotivated","hated","hurt","angry","lonely","failure","uncertain","meaning"]);
const areaIds = new Set(["work","relationships","love","future","study","career","self"]);
const fail = (message) => { throw new Error(`コンテンツ検証エラー: ${message}`); };
const unique = (items, key, label) => {
  const seen = new Set();
  for (const item of items) { if (!item[key]) fail(`${label}に空の${key}`); if (seen.has(item[key])) fail(`${label}の${key}が重複: ${item[key]}`); seen.add(item[key]); }
};
unique(sources,"id","出典"); unique(philosophers,"id","哲学者"); unique(philosophers,"slug","哲学者"); unique(thoughts,"id","思想"); unique(thoughts,"slug","思想");
if (philosophers.filter((x) => x.published).length !== 9) fail("公開哲学者は9件である必要があります");
if (thoughts.filter((x) => x.published).length !== 36) fail("公開思想カードは36件である必要があります");
const sourceSet = new Set(sources.map((x) => x.id));
const philosopherSet = new Set(philosophers.map((x) => x.id));
for (const source of sources) {
  if (![source.author,source.work,source.section,source.url,source.language,source.usageNote,source.lastVerifiedAt].every((value) => String(value || "").trim())) fail(`出典 ${source.id} に空欄があります`);
  try { new URL(source.url); } catch { fail(`出典 ${source.id} のURLが不正です`); }
}
for (const philosopher of philosophers) {
  if (!philosopher.sourceRefs?.length) fail(`哲学者 ${philosopher.id} に出典がありません`);
  for (const ref of philosopher.sourceRefs) if (!sourceSet.has(ref)) fail(`哲学者 ${philosopher.id} の出典 ${ref} が存在しません`);
}
const counts = new Map(philosophers.map((x) => [x.id,0]));
for (const thought of thoughts) {
  if (!philosopherSet.has(thought.philosopherId)) fail(`思想 ${thought.id} の哲学者 ${thought.philosopherId} が存在しません`);
  counts.set(thought.philosopherId,(counts.get(thought.philosopherId) || 0) + 1);
  if (!thought.sourceRefs?.length) fail(`思想 ${thought.id} に出典がありません`);
  for (const ref of thought.sourceRefs) if (!sourceSet.has(ref)) fail(`思想 ${thought.id} の出典 ${ref} が存在しません`);
  if (!thought.moodIds?.length || !thought.areaIds?.length) fail(`思想 ${thought.id} が未分類です`);
  for (const id of thought.moodIds) if (!moodIds.has(id)) fail(`思想 ${thought.id} の気持ちID ${id} が不正です`);
  for (const id of thought.areaIds) if (!areaIds.has(id)) fail(`思想 ${thought.id} の生活領域ID ${id} が不正です`);
  if (!thought.themeTags?.length) fail(`思想 ${thought.id} にテーマタグがありません`);
  if (!["summary","direct_quote","editorial"].includes(thought.contentKind)) fail(`思想 ${thought.id} のcontentKindが不正です`);
  if (thought.contentKind === "direct_quote") fail(`MVPでは権利確認済みの直接引用を登録していません: ${thought.id}`);
  if (thought.explanation.length < 95 || thought.explanation.length > 180) fail(`思想 ${thought.id} の解説は読みやすい95〜180文字にしてください（現在${thought.explanation.length}文字）`);
}
for (const [id,count] of counts) if (count !== 4) fail(`${id} の思想カードは4件ではなく${count}件です`);

const watch = JSON.parse(await fs.readFile(path.join(root,"data/seo/watchwords.json"),"utf8"));
const log = JSON.parse(await fs.readFile(path.join(root,"data/seo/improvement-log.json"),"utf8"));
const watchKeys = new Set(watch.keywords.map((x) => `${x.keyword}\u0000${x.targetPath}`));
for (const entry of log.entries) {
  if (!watchKeys.has(`${entry.keyword}\u0000${entry.targetPath}`)) fail(`改善ログ ${entry.keyword} に対応する監視語がありません`);
  if (!['active','observing','achieved'].includes(entry.status)) fail(`改善ログ ${entry.keyword} のstatusが不正です`);
  if (entry.status === 'observing' && !entry.nextReviewDate) fail(`観察中 ${entry.keyword} にnextReviewDateがありません`);
}
console.log(`検証完了: 哲学者 ${philosophers.length}件 / 思想 ${thoughts.length}件 / 出典 ${sources.length}件`);
