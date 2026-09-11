---
name: seo-rank-watch
description: Google Search Consoleの実測に基づき、1キーワード・1改善・7日観察を繰り返すSEO運用。
---

# SEO Rank Watch

1. `scripts/fetch_gsc_ranks.mjs --repo <REPO_PATH> --days 7` でGSCを測定する。GSCが使えない場合または当日確認だけWebSearchを使い、SERPをスクレイピングしない。
2. `observing` と `achieved` は改善候補から外す。`observing` は `nextReviewDate` まで絶対に再改善しない。
3. 2〜10位かつ表示あり、11〜20位で表示が多いもの、効果なしの高優先度の順に、改善対象を必ず1キーワードだけ選ぶ。順位がすべて `null` の公開前は候補登録とレポートだけで終了する。
4. 検索意図を確認し、title・description・導入・FAQ・不足情報・利用者本位の内部リンクから必要な改善を1つだけ行う。noindexや大規模構造変更は承認なしで行わない。
5. `improvement-log.json` を `observing` にし、当日から7日後を `nextReviewDate` として記録する。効果を予測で断定しない。
6. 7日後の実測で1位なら `achieved`、未達なら `active` に戻す。効果なしの場合は次回に異なる改善方法を選ぶ。
7. `rank-history.json` の過去レコードは書き換えない。秘密情報は出力・コミットしない。`data/seo/*.json` の変更を確認し、それらだけをGitコミットする。
