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

async function main() {
  const res = await fetch(SRC_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (BAI-Tool char list updater)" },
  });
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
  const html = await res.text();

  // 各キャラのアイコン画像 title="名前_icon.png" を手がかりに名前を抽出
  const matches = [...html.matchAll(/title="([^"]*?)_icon\.png"/g)].map((m) => m[1]);
  const list = buildList([...new Set(matches)]);

  if (list.length < 100) {
    throw new Error(`abort: extracted only ${list.length} names (wiki structure may have changed)`);
  }

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
