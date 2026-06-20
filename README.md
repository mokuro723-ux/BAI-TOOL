# BAI Tool

ブルーアーカイブ総力戦の TL（タイムライン）を、スマホで片手で素早く「速記」するための Web ツール。

- 公開ページ: https://mokuro723-ux.github.io/BAI-TOOL/
- 単一ファイル構成（`index.html` のみ・外部依存なし・バニラ JS）
- 左列＝ゲーム内タイム/コストの縦リスト、アイコン 1 タップで 1 イベント記録
- キャラ名検索（ブルアカ wiki 由来）＋アップした画像の使い回し（localStorage）
- 「画像として保存」で TL を PNG 出力
- データは端末内 localStorage に自動保存（リロード復元）

詳細仕様は [docs/SPEC.md](docs/SPEC.md)、デプロイ手順は [docs/DEPLOY.md](docs/DEPLOY.md) を参照。

## 開発

ビルド不要。`index.html` をブラウザで開けば動作する。スマホ幅（375px 程度）で確認すること。

キャラ名リストは月 1 で GitHub Actions が wiki から自動更新する（`scripts/update-chars.mjs`）。

---

本ツールは非公式のファン制作物です。「ブルーアーカイブ」の著作権は © NEXON Games / Yostar に帰属します。
