// ブルアカ「全キャラクター一覧」からキャラ名を取得し、index.html の CHAR_NAMES を更新する。
// GitHub Actions（月1）から実行。手動実行も可: `node scripts/update-chars.mjs`
// 依存ライブラリなし（Node 18+ の fetch を使用）。

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, "..", "index.html");
const SRC_URL =
  "https://bluearchive.wikiru.jp/?%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC%E4%B8%80%E8%A6%A7";
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

// wiki から取得して名前リストを返す（1回分）
async function fetchNames() {
  // 非ブラウザ UA / Accept 無しは WAF に 415 で弾かれるため、ブラウザ同等のヘッダを送る
  const res = await fetch(SRC_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ja,en-US;q=0.8,en;q=0.6",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${res.headers.get("content-type")})`);
  const html = await res.text();
  const matches = [...html.matchAll(/title="([^"]*?)_icon\.png"/g)].map((m) => m[1]);
  const list = buildList([...new Set(matches)]);
  // データセンターIPには稀にボット対策ページが返るため、名前数で正否を判定
  if (list.length < 100) {
    throw new Error(`only ${list.length} names extracted (html ${html.length}B, snippet: ${html.slice(0, 200).replace(/\s+/g, " ")})`);
  }
  return list;
}

async function main() {
  // 断続的なボット対策ページ対策として最大3回リトライ
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
