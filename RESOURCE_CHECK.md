# リンク・画像切れチェック

開発者用の `/data-check` に、サイト内で参照しているローカル画像、外部リンク、YouTube動画の確認結果を表示します。本番環境の `/data-check` は従来どおり404になり、一般ユーザーには公開されません。

## ローカルで確認

```powershell
npm run check:resources
```

外部通信をせず、`public` 内の画像だけをすばやく確認する場合は次を使います。

```powershell
npm run check:resources -- --local-only
```

実行後に開発サーバーを起動し、`http://127.0.0.1:3000/data-check` を開いてください。

## 判定

- `切れ`: ローカル画像が存在しない、またはリンク先が404・410を返した
- `要手動確認`: 403・429、サーバーエラー、タイムアウトなどで自動判定できない
- `未確認`: `--local-only` で外部リンクを検査していない
- `正常`: 画像ファイルが存在する、またはリンク先が正常に応答した

GitHub Actionsの `Check links and images` は毎週月曜日に実行されます。結果が変化した場合だけ `app/data/generated/resourceChecks.json` を更新します。
