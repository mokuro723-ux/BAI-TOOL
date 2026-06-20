# GitHub Pages デプロイ手順

## 前提

- GitHubアカウントを持っていること
- リポジトリ名: `bai-tool`（任意だがこれを推奨）
- デプロイ後URL: `https://[ユーザー名].github.io/bai-tool/`

---

## 手順

### 1. リポジトリを作成

1. GitHub にログイン
2. 右上「+」→「New repository」
3. Repository name: `bai-tool`
4. Public に設定（GitHub Pages は Public が必要、無料プランの場合）
5. 「Create repository」

### 2. ファイルをアップロード

1. 作成したリポジトリを開く
2. 「Add file」→「Upload files」
3. `index.html` をドラッグ＆ドロップ
4. 「Commit changes」

### 3. GitHub Pages を有効化

1. リポジトリの「Settings」タブ
2. 左メニュー「Pages」
3. Branch: `main`、フォルダ: `/ (root)` に設定
4. 「Save」
5. 数分後に `https://[ユーザー名].github.io/bai-tool/` でアクセス可能

---

## 更新方法

`index.html` を修正した場合は、同じリポジトリに上書きアップロードするだけ。

---

## キャラ名リストの自動更新（GitHub Actions）

`.github/workflows/update-chars.yml` が **毎月1日**に wiki からキャラ名を取得し、
`index.html` の `CHAR_NAMES` を自動更新してコミットする。

### 有効化の前提

1. リポジトリにファイル一式（`index.html` / `scripts/` / `.github/`）をプッシュしておく
2. Settings → Actions → General → **Workflow permissions** を
   「**Read and write permissions**」に設定（自動コミットに必要）
3. 初回は Actions タブ → 「Update character list」→ **Run workflow** で手動実行して動作確認

### 仕組み・トラブル時

- 取得元: bluearchive.wikiru.jp「全キャラクター一覧」
- 抽出名が 100 件未満だとスクリプトが失敗し、Actions が赤くなる（wiki の構造変更のサイン）
  → その場合は `scripts/update-chars.mjs` の抽出ロジックを見直す
- 手動でも更新可能: ローカルで `node scripts/update-chars.mjs` 実行後にコミット
