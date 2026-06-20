# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code 向けのガイドです。

## プロジェクト概要

**BAI Tool** — ブルーアーカイブ総力戦の TL（タイムライン）をスマホで素早く記録・視覚化する Web ツール。

- 想定ユーザー: 作者個人（GitHub で個人公開予定）
- 主目的: **誰かが作った TL を「速記」のように素早く記録する**こと（TL 自体を考案するツールではない）
- 利用シーン: 出先で**スマホ・片手操作**。フリック等を活用し文字入力より速く、あとから見て**視覚的にわかりやすい**形に残す
- 公開: GitHub Pages（個人アカウント）

## 最重要の設計原則

この 2 点が他のすべての判断に優先する:

1. **入力速度 > 機能の多さ** — 1 イベント登録のタップ数を最小に。文字入力を極力避け、選択・フリック・タップで完結させる
2. **片手・スマホ前提** — 親指の届く範囲（画面下部）に主要操作を置く。タップターゲットは最小 44px（iOS HIG 準拠）

迷ったら「出先で片手で速く記録できるか？」を基準に選ぶこと。

## すぐ着手するための要点（現状）

> まず [docs/SPEC.md](docs/SPEC.md)（正典）と `index.html` 冒頭のコメント（データモデル＋全体像）を読む。

- **形態**: 単一 `index.html`（ビルド不要・外部依存なし・バニラ JS）。ブラウザで開けば動く。
- **UI**: 表（スプレッドシート）型。1 行 = `コスト | タイム | キャラ配置 | メモ`。
  下部バー（親指ゾーン）のキャラを**タップで選択中の行に配置**。
  置いたセルは **タップ=枠色 / 上=+1 / 下=-1 / 右=+3 / 左=削除**。
- **複数 TL**: `☰ TL` で作成/切替/保存(画像)/削除。`store`に複数 doc、`imgLib`は全 TL 共通。
- **保存**: `localStorage`（`bai-tool-store-v1`）に自動保存。旧データは自動移行。
- **画像**: 手動アップ / SchaleDB 公式アイコン自動取得 / 保存済み再利用。端末ローカルのみ。
- **PNG 出力**: Canvas 自前描画。iOS は画像表示→長押し保存（`window.open` は使わない）。
- **キャラ名/アイコン**: `CHAR_NAMES`/`CHAR_ICONS` を `scripts/update-chars.mjs` が SchaleDB から月1更新。
- **確認**: スマホ幅 375px で見る。構文確認は
  `node -e "new Function(require('fs').readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1])"`。
- **公開**: GitHub Pages（`main`/root）。デプロイ手順は [docs/DEPLOY.md](docs/DEPLOY.md)。

## 技術スタック / 構成

- **単一ファイル構成**: `index.html` に HTML + CSS + JS をすべて inline
- **外部依存なし**（CDN も使わない）。PNG 出力も Canvas API で自前実装（html2canvas を使う場合のみ例外的に inline 化を検討）
- 対象ブラウザ: **iPhone Safari（iOS 15 以降）**
- データ保存: `localStorage` に JSON で自動保存（リロード後も復元。エクスポート機能は不要）

## ファイル構成

```
index.html        ← すべてを含む単一ファイル（成果物はこれだけ）
CLAUDE.md         ← このファイル
scripts/
  update-chars.mjs ← キャラ名リスト自動更新スクリプト（依存なし・Node18+）
.github/workflows/
  update-chars.yml ← 月1でキャラ名を自動取得→自動コミットする CI
docs/
  SPEC.md         ← 機能要件・UI 仕様（実装の正典）
  DEPLOY.md       ← GitHub Pages デプロイ手順
  REFERENCE_SITE.md ← 参考サイト調査メモ
```

### キャラ名リストの自動更新

- `index.html` 内のキャラ名は `/* CHAR_NAMES:START */` ～ `/* CHAR_NAMES:END */` で囲まれた行。
  **このマーカーを壊さないこと**（スクリプトがこの範囲だけ置換する）。
- 取得元は SchaleDB の JP データ（`https://schaledb.com/data/jp/students.min.json`）。
  `IsReleased[0]`（JP 実装済み）の `Name` を採用。
  ※ wiki は GitHub のIPに JS チャレンジを返し CI から取得できなかったため SchaleDB に変更した。
- 更新対象は 2 ブロック: `CHAR_NAMES`（名前リスト）と `CHAR_ICONS`（名前→SchaleDB Id）。
  どちらも START/END マーカーで囲まれており、`scripts/update-chars.mjs` が両方を置換する。
- 手動更新は `node scripts/update-chars.mjs`。GitHub Actions が毎月1日に自動実行＆コミットする。
- 取得名が 100 件未満になった場合はスクリプトが中断（誤って空リストを書かない安全装置）。
- **このキャラ名/アイコンの月1自動更新（GitHub Actions + update-chars.mjs）は本ツールの中核機能。
  仕様変更や実装変更の際も、この自動更新の仕組み自体を止めたり弱めたりする変更は行わないこと。**

### キャラアイコンの自動取得

- キャラ名検索で名前を選ぶと、`CHAR_ICONS` の Id から
  `https://schaledb.com/images/student/icon/{Id}.webp` を取得し、96px JPEG にして
  そのキャラの画像にする。SchaleDB は `Access-Control-Allow-Origin: *` なので
  canvas に描いても汚染されず、PNG 出力も成立する。
- 取得した画像は **端末の localStorage にのみ保存**（リポジトリには同梱しない＝再配布しない）。
  一度取得すれば imgLib に名前キーで残り、次回以降は再取得不要。
- 公式アートは © NEXON Games / Yostar。非営利・端末ローカル保存の範囲で利用する。

> **⚠️ 重要（変更禁止事項）**: 上記の「キャラ名/アイコンの月1自動更新」と「キャラアイコンの自動取得（`iconUrlFor`/`autoIcon`/`imageUrlToDataUrl` による名前選択時の自動フェッチ）」は、
> 本ツールの利用者にとって必須の挙動として**現状のまま絶対に維持する**こと。
> 他の機能追加・リファクタ・UI変更を行う際も、これらのロジック・トリガー条件（名前選択時に画像未設定なら自動取得する、等）・データ取得先（SchaleDB）・保存先（localStorage のみ）を
> 弱める・削除する・無効化する・条件を変える、といった変更は行わないこと。
> もし変更が必要だと判断した場合は、実装前に必ず確認を取ること。

**実装の詳細仕様は [docs/SPEC.md](docs/SPEC.md) を参照**。コードを書く前に必ず読むこと。

## 開発・確認方法

- ビルド工程なし。`index.html` をブラウザで開けば動く
- ローカル確認は `index.html` を直接開くか、`python -m http.server` 等で配信
- **必ずスマホ幅（375px 程度）の表示で確認**する。PC 幅だけで判断しない
- localStorage の挙動はリロードして復元されるかまで確認する

## コーディング方針

- 単一 HTML ファイルを壊さない。新規ファイルに分割しない（公開のしやすさが要件）
- 余計なライブラリ・フレームワークを導入しない（バニラ JS）
- UI 文言・ページタイトル・ヘッダーは "BAI Tool" で統一
- 参考サイトのコードは模倣せず、要件から独立して設計する（[docs/REFERENCE_SITE.md](docs/REFERENCE_SITE.md) 参照）

## 補足（Claude から）

- 「TL を速記する」用途上、**よく使う操作の連打しやすさ**が体験を左右する。配置まわりの UI を変えるときは「何タップで 1 配置できるか」を明示してから実装すると判断しやすい
- 視覚的わかりやすさのため、キャラ色・アイコン・枠色の見分けやすさ（色覚配慮含む）を意識する
- 仕様変更が出たら、コードだけでなく [docs/SPEC.md](docs/SPEC.md) も更新して正典を保つこと
