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
