# David Tennant Fan Archive

デイヴィッド・テナントの出演作品、キャラクター、コミコン参加情報、インタビュー翻訳をまとめた非公式ファンサイトです。Next.js互換のVinext構成で、VS Codeから編集できます。

## 動かし方

必要環境はNode.js 22.13以上です。

```bash
npm install
npm run dev
```

Windowsでは `npm run dev` を使ってください。開発時だけCloudflareのローカルランナーを使わないため、Windows固有の起動エラーを避けられます。TMDBの作品情報も確認する場合は、同じPowerShellで次を実行してから起動します。

```powershell
$env:TMDB_READ_TOKEN = "TMDBのAPI Read Access Token"
npm run dev
```

公開用ビルドの確認:

```bash
npm run lint
npm run build
```

TMDBから作品情報を取得する場合は、環境変数 `TMDB_READ_TOKEN` にTMDB Read Access Tokenを設定してください。未設定時は `app/lib/tmdb.ts` の軽量な予備データを使用します。

### UPCOMINGの自動監視

`/upcoming`は最大1日ごとにTMDB、TVmaze、Wikidata、ニュースRSS、登録した公式発表ページの記事本文を確認します。YouTube公式チャンネルの監視と、英語記事の自動翻訳を使う場合は、Vercelへ次の環境変数を追加してください。

```text
YOUTUBE_API_KEY=YouTube Data API v3のAPIキー
DEEPL_API_KEY=DeepL APIキー（英語の確認待ち情報を日本語化する場合）
CRON_SECRET=16文字以上のランダムな文字列
```

監視先、記事URLの条件、公式チャンネル名、抽出キーワードは`app/data/upcomingSources.ts`で編集できます。記事本文の解析は`app/lib/upcoming-sources/articleScraper.ts`、翻訳は`translate.ts`へ分離しています。TMDB等にない確認済み情報は`app/data/upcomingWorks.ts`へ手入力します。

## 主なフォルダ

```text
app/
├─ components/               共通UI
│  └─ interviews/            インタビュー専用の共通表示部品
├─ data/
│  ├─ interviews/
│  │  ├─ catalog.ts          一覧用の軽量な基本情報
│  │  ├─ loadInterview.ts    詳細本文の遅延読み込み対応表
│  │  ├─ types.ts            インタビューデータの型
│  │  └─ transcripts/        英語原文・日本語訳
│  ├─ characterDetails.ts    キャラクター名と説明
│  ├─ characterImages.ts     キャラクター画像
│  ├─ overviews.ts           作品あらすじの補完
│  ├─ searchDictionary.ts    原題・邦題の対応
│  ├─ upcomingSources.ts     UPCOMINGの自動監視先・抽出条件
│  ├─ upcomingWorks.ts       公式発表済み予定の手入力補完
│  └─ yearOverrides.ts       公開年の補完
├─ interviews/               インタビュー一覧・詳細ページ
├─ characters/               キャラクター一覧ページ
├─ works/                    出演作品一覧ページ
├─ upcoming/                 未公開作品・発表候補ページ
└─ lib/                      データ取得・変換処理
public/                      ローカル画像
```

## キャラクター画像

キャラクター画像はすべて `public/characters/` に配置します。外部サイトの画像URLは使いません。
`app/data/characterImages.ts` に、作品名をキーとして `/characters/画像ファイル名` を指定してください。

## インタビューを手入力で追加する

### 1. 基本情報を追加

`app/data/interviews/catalog.ts` の配列へ1件追加します。

```ts
{
  slug: "url-safe-name",
  title: "記事または動画タイトル",
  year: "2026",
  publishedDate: "2026-07-12",
  source: "媒体名",
  mediaType: "video", // 記事は "article"
  videoId: "YouTubeの動画ID", // 記事は null
  externalUrl: "https://...",
  thumbnailUrl: "https://...",
  duration: "Video · 3:58〜",
  description: "一覧に表示する説明",
  tags: ["Tag 1", "Tag 2"],
},
```

### 2. 英語原文と日本語訳を追加

`app/data/interviews/transcripts/` に新しい `.ts` ファイルを作り、次の形式で入力します。

```ts
export const sampleTranscript = [
  {
    speakerEn: "David Tennant",
    speakerJa: "デイヴィッド・テナント",
    en: "English transcript.",
    ja: "日本語訳。",
  },
] as const;
```

### 3. 詳細ページと接続

`app/data/interviews/loadInterview.ts` の `transcriptLoaders` に、catalog.tsと同じ `slug` と翻訳ファイルの対応を1行追加します。

長い翻訳は詳細ページを開いた時だけ読み込まれるため、トップページや一覧ページの初期表示を重くしません。

## 作品・キャラクター情報の編集

- TMDBにない作品の追加: `app/data/manualWorks.ts`
- 邦題検索: `app/data/searchDictionary.ts`
- 取得できない作品説明: `app/data/overviews.ts`
- キャラクター名・説明: `app/data/characterDetails.ts`
- キャラクター画像: `app/data/characterImages.ts`
- 年代補完: `app/data/yearOverrides.ts`

データ取得・作品とキャラクターの紐づけ処理は `app/lib/` にまとめています。画面部品からデータ変換処理を分離し、表示と内容を別々に修正できる構成です。

### TMDBにない作品を追加する

`app/data/manualWorks.ts` の配列へ作品のid・媒体・原題・邦題・公開日・英語役名などの基本情報を追加します。映画は `movie`、テレビは `tv`、舞台は `stage` を指定してください。

本文や役柄は既存の辞書で管理します。

- 作品あらすじ: `app/data/overviews.ts`
- キャラクター名・詳細: `app/data/characterDetails.ts`
- キャラクター画像: `app/data/characterImages.ts`
- キャラクター属性: `app/data/characterAttributes.ts`
- 追加ジャンル: `app/data/manualWorks.ts` の `workGenreOverrides`

各辞書では `manualWorks.ts` の原題（例: `Don Juan in Soho`）を同じキーとして使用します。`workGenreOverrides` はTMDB取得作品にも適用できるため、`Macbeth` や `National Theatre Live: Good` のような舞台収録作品へ「舞台」タグを追加できます。

画像をサイト内へ保存する場合は `public/images/manual-works/` に置き、`posterUrl` やキャラクターの `image` に `/images/manual-works/ファイル名.jpg` を指定します。手入力作品にはTMDBと重ならない負のidを使用してください。

## 軽量化の方針

- インタビュー一覧は本文を含まない軽量カタログのみ読み込み
- 長い翻訳データは詳細ページ単位で遅延読み込み
- 一覧画像は `loading="lazy"` と `decoding="async"` を使用
- TMDB通信結果は24時間キャッシュ
- 検索・絞り込み処理は `useMemo` で再計算を抑制

## 注意

このサイトは非公式ファンサイトです。画像・映像・記事・作品情報の権利は各権利者に帰属します。公開時は各素材の利用条件をご確認ください。
