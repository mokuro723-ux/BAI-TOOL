// ブルアカのキャラ名を取得し、index.html の CHAR_NAMES を更新する。
// GitHub Actions（月1）から実行。手動実行も可: `node scripts/update-chars.mjs`
// 依存ライブラリなし（Node 18+ の fetch を使用）。
//
// 取得元は SchaleDB（プログラム利用前提で公開されている JP のキャラJSON）。
// 以前は wiki から取得していたが、wiki が GitHub のIPに JS チャレンジを返し自動取得できないため切替。

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, "..", "index.html");
const SRC_URL = "https://schaledb.com/data/jp/students.min.json";
const START = "/* CHAR_NAMES:START */";
const END = "/* CHAR_NAMES:END */";

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

// SchaleDB から JP のキャラ名を取得して整形リストを返す（1回分）
async function fetchNames() {
  const res = await fetch(SRC_URL, {
    headers: {
      "User-Agent": "BAI-Tool char list updater (+https://github.com/mokuro723-ux/BAI-TOOL)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${res.headers.get("content-type")})`);
  const data = await res.json();
  const students = Array.isArray(data) ? data : Object.values(data);
  // IsReleased = [JP, Global, ...]。JP 実装済みのみ採用
  const names = students
    .filter((s) => (Array.isArray(s.IsReleased) ? s.IsReleased[0] : true))
    .map((s) => s.Name)
    .filter(Boolean);
  const list = buildList(names);
  if (list.length < 100) {
    throw new Error(`only ${list.length} names extracted (data ${students.length} students)`);
  }
  return list;
}

async function main() {
  // 一時的なネットワーク失敗に備えて最大3回リトライ
  let list, lastErr;
  for (let i = 1; i <= 3; i++) {
    try {
      list = await fetchNames();
      break;
    } catch (e) {
      lastErr = e;
      console.error(`attempt ${i} failed: ${e.message}`);
      if (i < 3) await sleep(5000);
    }
  }
  if (!list) throw new Error(`giving up after 3 attempts: ${lastErr && lastErr.message}`);

  const src = readFileSync(HTML_PATH, "utf8");
  const s = src.indexOf(START);
  const e = src.indexOf(END);
  if (s === -1 || e === -1 || e < s) throw new Error("CHAR_NAMES markers not found in index.html");

  const newBlock =
    START + "\nconst CHAR_NAMES = " + JSON.stringify(list) + ";\n" + END;
  const updated = src.slice(0, s) + newBlock + src.slice(e + END.length);

  if (updated === src) {
    console.log(`no change (${list.length} names)`);
    return;
  }
  writeFileSync(HTML_PATH, updated);
  console.log(`updated CHAR_NAMES: ${list.length} names`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
