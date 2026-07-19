# インタビューデータの編集場所

- `catalog.ts`: タイトル、公開日、URL、サムネイル、説明、タグ
- `transcripts/`: 英語原文と日本語訳
- `loadInterview.ts`: catalogのslugと翻訳ファイルを接続
- `types.ts`: データ形式。通常は変更不要
- `autoCandidates.ts`: GitHub Actionsが追加した非公開候補と公開判断
- `discoverySources.ts`: YouTube検索語、記事RSS、自動タグ候補

## 自動取得候補の公開

自動取得した動画・記事は `isPublished: false`、`reviewStatus: "pending"` で保存されるため、一般ページには表示されません。
開発環境の `/data-check` で取得元と自動概要を確認し、公開する候補だけ次の値へ変更します。

```ts
isPublished: true,
reviewStatus: "approved",
contentStatus: "approved",
```

掲載しない候補は `reviewStatus: "rejected"` のまま残します。同期処理はこの判断を維持するため、同じURLを再登録しません。

YouTube説明欄、RSS、記事の公開メタ説明から短い概要だけを作成します。外部記事の全文は保存しません。
字幕を取得できない動画は `transcriptSource: "unavailable"` とし、発言録として扱いません。

追加手順と入力例はプロジェクト直下の `README.md` を参照してください。
