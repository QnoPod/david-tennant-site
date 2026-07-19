# INTERVIEWS 自動候補取得

## 動作

毎日、YouTube検索と登録済みRSSを確認し、新しいインタビュー候補を `app/data/interviews/autoCandidates.ts` へ保存します。
候補は必ず `isPublished: false` で追加されるため、確認前に一般サイトへ表示されることはありません。

- YouTube: タイトル、公開日、チャンネル、動画説明、サムネイル、再生時間
- 記事: RSS、公開メタ説明、公開日、掲載元、元ページ
- 概要: 説明文の先頭3文・最大600文字を使った短い概要
- 日本語: `DEEPL_API_KEY` がある場合にタイトルと概要を自動翻訳
- 表記統一: 「デイヴィッド・テナント」「グッド・オーメンズ」などの正式表記へ自動補正
- Shorts除外: タイトルまたは説明欄に `#shorts` / `#short` がある動画は保存しない
- 公式限定: `discoverySources.ts` の公式YouTubeチャンネル許可リストと完全一致する動画だけを保存
- 重複防止: YouTube動画ID、正規化URL、原題と公開日の組み合わせで既存記事・既存候補と照合

記事全文は保存しません。YouTubeの字幕を取得できない場合も、動画説明を発言原文として扱いません。

## GitHub Actions Secrets

GitHubの `Settings → Secrets and variables → Actions` に登録します。

- `YOUTUBE_API_KEY`: YouTube Data API v3のAPIキー
- `DEEPL_API_KEY`: DeepL APIキー。未登録の場合は英語のまま候補保存

`Settings → Actions → General → Workflow permissions` は `Read and write permissions` を選択します。

## 初回に取得できる過去動画をまとめて取得

`Actions → Sync INTERVIEW candidates → Run workflow` を開き、`mode` に `full-backfill` を選んで実行します。

`full-backfill` が0件の場合は、実行ログの `Discover videos and articles as unpublished candidates` を開いてください。修正版では `YOUTUBE_API_KEY` がGitHub Actionsに未設定なら成功扱いにせず停止し、検索語ごとの件数と候補判定の内訳を表示します。Vercelに同名の変数があってもGitHub Actionsからは参照できないため、GitHub側のActions Secretにも登録が必要です。

`YouTube API failed (429)` は短時間のリクエスト制限、または日次割当の超過です。同期処理は短時間制限ならリクエスト間隔を空け、`Retry-After`または指数バックオフに従って最大5回再試行します。エラー本文に`Search Queries per day`がある場合は日次上限なので、無駄な再試行をせず停止します。上限までに取得済みの動画IDがある場合は、その分だけ候補化して保存します。次の日に`full-backfill`を再実行しても、動画IDなどによる重複防止で同じ候補は増えません。

`full-backfill`は6検索語×最大12ページで最大72回の`search.list`を使うため、同じ日に繰り返し実行しないでください。Google Cloudの割当画面を確認し、超過時は太平洋時間の日次リセット後に再実行します。

- 過去7,300日（約20年）を検索
- 6種類の検索語を使用
- 各検索語を最大12ページ、1ページ50件まで確認
- 動画IDで重複を除去
- 既存の手入力記事と同じ動画は追加しない
- すべて非公開候補として保存

YouTube検索APIや各検索エンジンが返さない動画、削除・限定公開動画、RSSに残っていない過去記事までは取得できません。
記事RSSは原則として現在配信されている範囲だけです。取得元を増やす場合は `discoverySources.ts` のRSS一覧へ追加します。

初回バックフィル後は、毎日のスケジュール実行が直近14日・各検索語1ページだけを確認します。

## ローカル確認

`.env.local` にキーを保存してから実行します。

```env
YOUTUBE_API_KEY=your-key
DEEPL_API_KEY=your-key
```

```powershell
npm run sync:interviews
npm run dev
```

`http://127.0.0.1:3000/data-check` の「インタビュー公開判断」で候補を確認できます。
本番環境では `/data-check` は404になります。

## 公開・非掲載の判断

公開する候補:

```ts
isPublished: true,
reviewStatus: "approved",
contentStatus: "approved",
```

掲載しない候補:

```ts
isPublished: false,
reviewStatus: "rejected",
```

公開状態・非掲載状態は次回の自動同期でも維持されます。
