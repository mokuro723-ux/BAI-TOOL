// ブルアカのキャラ名・アイコンIDを取得し、index.html の CHAR_NAMES / CHAR_ICONS を更新する。
// GitHub Actions（月1）から実行。手動実行も可: `node scripts/update-chars.mjs`
// 依存ライブラリなし（Node 18+ の fetch を使用）。
//
// 取得元は SchaleDB（プログラム利用前提で公開されている JP のキャラJSON）。
// 以前は wiki から取得していたが、wiki が GitHub のIPに JS チャレンジを返し自動取得できないため切替。
// CHAR_ICONS は 名前→Id のマップ。アプリ側で https://schaledb.com/images/student/icon/{Id}.webp を取得する。

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, "..", "index.html");
const SRC_URL = "https://schaledb.com/data/jp/students.min.json";

// index.html 内の START/END マーカー間を置換
function replaceBlock(src, name, content) {
  const start = `/* ${name}:START */`, end = `/* ${name}:END */`;
  const s = src.indexOf(start), e = src.indexOf(end);
  if (s === -1 || e === -1 || e < s) throw new Error(`${name} markers not found in index.html`);
  return src.slice(0, s) + start + "\n" + content + "\n" + end + src.slice(e + end.length);
}

// 一覧から取得した名前を「ベース名→バージョン付き」順に整形
function buildList(names) {
  const norm = names.map((n) => n.replace(/_(.+)$/, "（$1）").trim()).filter(Boolean);
  const base = (n) => n.replace(/（[^）]*）$/, "");
  const bases = new Set();
  const full = new Set();
  for (const n of norm) {
    full.add(n);
    bases.add(base(n));
  }
  const cmp = (a, b) => a.localeCompare(b, "ja");
  const baseArr = [...bases].sort(cmp);
  const verArr = [...full].filter((n) => n !== base(n)).sort(cmp);
  return [...new Set([...baseArr, ...verArr])];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// SchaleDB から JP のキャラ名リストと 名前→Id マップを取得（1回分）
async function fetchData() {
  const res = await fetch(SRC_URL, {
    headers: {
      "User-Agent": "BAI-Tool char list updater (+https://github.com/mokuro723-ux/BAI-TOOL)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${res.headers.get("content-type")})`);
  const data = await res.json();
  const all = Array.isArray(data) ? data : Object.values(data);
  // IsReleased = [JP, Global, ...]。JP 実装済みのみ採用
  const students = all.filter((s) => (Array.isArray(s.IsReleased) ? s.IsReleased[0] : true) && s.Name);
  const list = buildList(students.map((s) => s.Name));
  if (list.length < 100) {
    throw new Error(`only ${list.length} names extracted (data ${all.length} students)`);
  }
  // 名前→Id（アイコン用）。list の順に並べる
  const idByName = {};
  for (const s of students) if (s.Id != null) idByName[s.Name] = s.Id;
  const icons = {};
  for (const n of list) if (idByName[n] != null) icons[n] = idByName[n];
  return { list, icons };
}

async function main() {
  // 一時的なネットワーク失敗に備えて最大3回リトライ
  let data, lastErr;
  for (let i = 1; i <= 3; i++) {
    try {
      data = await fetchData();
      break;
    } catch (e) {
      lastErr = e;
      console.error(`attempt ${i} failed: ${e.message}`);
      if (i < 3) await sleep(5000);
    }
  }
  if (!data) throw new Error(`giving up after 3 attempts: ${lastErr && lastErr.message}`);

  const src = readFileSync(HTML_PATH, "utf8");
  let updated = replaceBlock(src, "CHAR_NAMES", "const CHAR_NAMES = " + JSON.stringify(data.list) + ";");
  updated = replaceBlock(updated, "CHAR_ICONS", "const CHAR_ICONS = " + JSON.stringify(data.icons) + ";");

  if (updated === src) {
    console.log(`no change (${data.list.length} names)`);
    return;
  }
  writeFileSync(HTML_PATH, updated);
  console.log(`updated: ${data.list.length} names, ${Object.keys(data.icons).length} icons`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
