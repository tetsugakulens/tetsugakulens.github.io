#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { GoogleAuth } from "google-auth-library";

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const repo = path.resolve(arg("--repo", "."));
const days = Number.parseInt(arg("--days", "7"), 10);
if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error("--days は1〜90の整数で指定してください。");
const siteUrl = process.env.GSC_SITE_URL || "https://tetsugakulens.github.io/";
const localCredentials = path.join(repo, ".secrets", "gsc-service-account.json");
const credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || localCredentials;

const seoDir = path.join(repo, "data", "seo");
const watchPath = path.join(seoDir, "watchwords.json");
const historyPath = path.join(seoDir, "rank-history.json");
const logPath = path.join(seoDir, "improvement-log.json");
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const [watch, history, log] = await Promise.all([readJson(watchPath), readJson(historyPath), readJson(logPath)]);

const end = new Date();
const start = new Date(end);
start.setUTCDate(end.getUTCDate() - days + 1);
const isoDay = (date) => date.toISOString().slice(0, 10);
const measuredAt = new Date().toISOString();
if (history.records.some((record) => record.measuredAt.slice(0, 10) === isoDay(end))) {
  throw new Error("本日の順位レコードは既に存在します。履歴保護のため上書きしません。");
}

try {
  await fs.access(credentialsFile);
} catch {
  throw new Error("GSC認証ファイルがありません。.secrets/gsc-service-account.json を設定してください。秘密情報の内容は表示しません。");
}
const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  keyFilename: credentialsFile,
});
const client = await auth.getClient();
const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
const response = await client.request({ url:endpoint, method:"POST", data:{startDate:isoDay(start),endDate:isoDay(end),dimensions:["query","page"],rowLimit:25000,dataState:"final"} });
const rows = response.data.rows || [];
const normalizePath = (value) => { try { return new URL(value).pathname.replace(/\/$/, "") || "/"; } catch { return value.replace(/\/$/, "") || "/"; } };

const keywords = watch.keywords.map((item) => {
  const matching = rows.filter((row) => row.keys?.[0]?.toLocaleLowerCase("ja") === item.keyword.toLocaleLowerCase("ja") && normalizePath(row.keys?.[1] || "") === normalizePath(item.targetPath));
  const impressions = matching.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const clicks = matching.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const weighted = matching.reduce((sum, row) => sum + Number(row.position || 0) * Number(row.impressions || 0), 0);
  return {keyword:item.keyword,targetPath:item.targetPath,clicks,impressions,position:impressions ? Number((weighted / impressions).toFixed(2)) : null};
});
history.records.push({ measuredAt, startDate:isoDay(start), endDate:isoDay(end), siteUrl, days, keywords });

for (const entry of log.entries) {
  const metric = keywords.find((item) => item.keyword === entry.keyword && item.targetPath === entry.targetPath);
  if (!metric || metric.position === null) continue;
  if (metric.position <= 1) { entry.status = "achieved"; entry.nextReviewDate = null; }
  else if (entry.status === "observing" && entry.nextReviewDate && entry.nextReviewDate <= isoDay(end)) {
    const action = entry.actions.at(-1);
    const delta = action?.rankAtAction == null ? null : Number((action.rankAtAction - metric.position).toFixed(2));
    entry.reviews ||= [];
    entry.reviews.push({date:isoDay(end),measuredRank:metric.position,rankChange:delta,result:"not_achieved"});
    entry.status = "active"; entry.nextReviewDate = null;
  }
}

await Promise.all([
  fs.writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`),
  fs.writeFile(logPath, `${JSON.stringify(log, null, 2)}\n`),
]);
console.log(`GSC実測を追記しました: ${keywords.length}キーワード / ${isoDay(start)}〜${isoDay(end)}`);
console.log("順位改善は行っていません。選定・1改善・7日観察はSKILL.mdの手順で実施してください。");
