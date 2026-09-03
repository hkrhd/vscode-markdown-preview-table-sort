# Markdown Preview Table Sort

[English README.md](./README.md)

VSCode 標準の Markdown プレビュー上で，テーブルのソート機能を追加する拡張です．

## 仕様

- テーブルヘッダーをクリックして列をソート
- クリックごとに昇順、降順、Markdown 記載順を切り替え
- `item2` が `item10` より前になる自然順ソート
- 空セルは常に末尾
- 複数のテーブルをそれぞれ独立してソート
- Markdown 原文は変更しません

## 必要環境

- VS Code 1.136.0 以降

## 制限事項

- 日付型は推定せず、自然な文字列として比較します。
- ヘッダーと本文の両方を持たない生 HTML テーブルは変更しません。

## 開発

```sh
npm ci
npm run lint
npm test
npm run package:vsix
```

`npm test` は実際の VS Code を起動し、標準 Markdown プレビューを E2E で検証します。

## ライセンス

[MIT](./LICENSE)
