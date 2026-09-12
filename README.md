# 哲学レンズ

いまの気持ちや生活の悩みから、哲学者の考えを静かに眺める日本語の縦型フィードです。AI API、会員登録、外部データベースを使わないAstro 7の静的サイトです。

## ローカル実行

Node.js 24以上とpnpmを用意し、次を実行します。

```sh
pnpm install
pnpm dev
```

本番相当の検索を確認する場合は、Pagefindインデックスを生成してから静的配信します。

```sh
SITE_URL=https://tetsugakulens.github.io pnpm build
pnpm exec pagefind --site dist --serve
```

現在の公開URLは `https://tetsugakulens.github.io/` です。将来独自ドメインへ移行するときは `SITE_URL` とSearch Consoleのプロパティを同時に更新します。

## 品質確認

```sh
pnpm test
```

このコマンドは全36カードの参照・分類・重複・解説文の長さを検証し、Astroの型チェック、本番ビルド、Pagefind生成を実行します。

## SEO Rank Watch

認証値は `.env` へ置かず、実行環境の `GOOGLE_APPLICATION_CREDENTIALS` と `GSC_SITE_URL` から渡します。サービスアカウントには対象Search Consoleプロパティの閲覧権限が必要です。

```sh
GSC_SITE_URL=https://tetsugakulens.github.io/ pnpm seo:ranks
```

公開直後でGSCの実測値がない監視語は `rank: null` のまま保持します。インプレッション発生後に初回測定し、`.claude/skills/seo-rank-watch/SKILL.md` の「1キーワード・1改善・7日観察」を厳守します。
