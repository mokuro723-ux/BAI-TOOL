# HANDOFF.md

このファイルは、別のAI（Claude Code 以外も含む）に作業を引き継ぐためのメモ。
作業を始める前に **CLAUDE.md → docs/SPEC.md → このファイル** の順に読むこと。

## プロジェクト

BAI Tool — ブルーアーカイブ総力戦TLをスマホ片手で速記するための単一HTMLツール。
詳細は [CLAUDE.md](CLAUDE.md) と [docs/SPEC.md](docs/SPEC.md)（実装の正典）を参照。

## 直近の作業（このセッション）

### 強化: キャラ名マッチング + あだ名辞書機能

#### 1. `findRosterChar` の強化（部分一致・あだ名解決）

- **あだ名辞書を先に参照**: 入力名をまず `resolveNickname()` で辞書引きし、正式名に変換してから照合。
- **ベース名による1件確定マッチを追加**:
  ロスターに「アリス(臨戦)」のみ登録されている状態で「アリス」と書かれた場合、
  `()` 以前のベース名が一致するキャラが1件だけならそれに確定マッチする。
  複数候補があれば未マッチ扱い（曖昧マッチはしない）。
- 照合順序: ①あだ名辞書変換→完全一致 ②完全一致 ③前方一致 ④ベース名1件確定

#### 2. あだ名辞書（`localStorage: "bai-tool-nicknames"`）

- `loadNicknames()` / `saveNicknames(d)` / `resolveNickname(name)` を `findRosterChar` の直前に追加。
- 辞書構造: `{ "クロコ": "シロコ(テラー)", "アリス": "アリス(臨戦)" }` のようなJSON。
- `bai-tool-store-v1`（TLデータ）とは別キーで独立保存。

#### 3. TL取込シートの未マッチ紐付けUI

- 「解析→反映」後、未マッチ名が存在する場合に **「未マッチ名を誰かに紐付け」パネル**を表示。
  - 未マッチ名ごとに現在のロスターからドロップダウン選択。
  - 「紐付けを辞書に保存して再解析」ボタンで辞書保存→即座に再解析・プレビュー更新。
  - 「（無視）」を選んだ名前は辞書登録しない。
- 変更箇所: `openImportSheet` 内の `#impParse` onclick ブロック。

#### 4. ヘッダーにあだ名管理ボタン（📖）追加

- `btnImport`（📋）の右隣に `btnNick`（📖）を追加。
- タップで `openNickSheet()` を開く。
- `openNickSheet`: 辞書の全エントリを一覧表示（「あだ名 → 正式名」）、
  エントリごとの「削除」ボタン、「すべて削除」ボタン。
  エントリが0件の場合は「まだ辞書がありません」メッセージを表示。

#### 変更ファイル
- `index.html` のみ（`/* ===== TL取込 */` ブロック内の `findRosterChar`、
  `openImportSheet` の `#impParse` onclick、ヘッダーHTML、`openNickSheet` 関数追加）

#### 確認事項
- 構文チェック（`node -e "new Function(...)"` ）: ✅ パス
- 未確認: 実機（iPhone Safari）での動作・375px表示

---

### 強化: TL取込パース精度（前セッション）

1. **「5 チャージ①」のようなキャラ名省略行に対応**
   - ロスター名と一致しないセグメントが来た場合、直前に配置したキャラ
     （`lastChar` で追跡）のスキル行とみなして自動配置する。
2. **「アリスチャージ①,②」のような名前+丸数字の複数指定に対応**
3. **`〆`（おしまい印）を削除せず保持**（`row.memo` に残す）
4. **注意書き行（※★・等で始まる行）の誤爆を防止**

### 追加: 元に戻す/やり直し（Undo/Redo）

- ヘッダー右上に `↶` / `↷` ボタン。履歴上限50件（`HISTORY_LIMIT`）。
- `snapshotHistory()` を行・セル操作系ボタンの先頭および入力欄の `focus` 時に呼ぶ。

### 追加: PinP用余白トグル

- ヘッダーに `⬓` ボタン。タップで `#pinpSpacer` の高さを 0 ⇔ 300px に切替。
- 状態は `localStorage`（キー `bai-tool-pinp-gap`）に保存。

### 修正: 行追加連打でスクロール不能になるバグ

- `scrollIntoView` を `instant` に変更 + `scrollRowIntoView()` で RAF制御。

## 変更してはいけないもの（再掲・最重要）

1. **キャラ名/アイコンの月1自動更新**
   （GitHub Actions + `scripts/update-chars.mjs`、SchaleDB から取得）
2. **名前選択時のアイコン自動取得**
   （`iconUrlFor` / `autoIcon` / `imageUrlToDataUrl`。端末localStorageのみ保存）

`CHAR_NAMES:START`〜`END`、`CHAR_ICONS:START`〜`END` のマーカーを壊さないこと。

## localStorage キー一覧

| キー | 内容 |
|---|---|
| `bai-tool-store-v1` | TLデータ本体（docs, roster, imgLib等） |
| `bai-tool-pinp-gap` | PinP余白トグルの状態 |
| `bai-tool-nicknames` | あだ名辞書（`{"あだ名":"正式名"}`） |

## このプロジェクト共通のコーディング方針

- 単一 `index.html` のみで完結。新規ファイルに分割しない。
- 外部ライブラリ・CDN を追加しない（バニラJS）。
  例外: TL取込の画像OCRのみ `Tesseract.js` を CDN から動的読込（ユーザー承認済み）。
- 対象環境: iPhone Safari（iOS 15+）、スマホ幅375px。
- コメントは日本語。
- 構文確認コマンド:
  ```
  node -e "new Function(require('fs').readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1])"
  ```
- 仕様変更したら `docs/SPEC.md` も更新して正典を保つ。
- **指示された範囲だけを過不足なく直すこと。**

## ユーザーの作業スタイル

- 説明は簡潔に。褒め言葉・前置き不要。淡々とタスクを進める。
- 不要な確認を挟まない（仕様に影響する判断が必要な場合のみ確認）。
- 作業のたびに HANDOFF.md を更新した状態で ZIP として渡す運用。

## 未着手・既知の懸念

- TL取込のOCR動作・速度・精度は実機（iPhone Safari）で未検証。
- あだ名管理UIは375px実機での表示未確認。
- ロスター未登録のキャラは引き続き手動登録が前提（あだ名辞書はロスター登録済みキャラへの紐付けのみ）。
