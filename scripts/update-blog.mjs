// noteのRSSから最新記事を取得し assets/blog.json を生成する。
// GitHub Actions（.github/workflows/update-blog.yml）から定期実行される。
import { writeFileSync } from "node:fs";

const RSS = "https://note.com/three_t_ltd/rss";

const pick = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[/, "").replace(/\]\]>/, "").trim();
};

const fmtDate = (str) => {
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "";
  // 日本時間(JST)基準で表示（実行環境のUTCに依存しない）
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}.${get("month")}.${get("day")}`;
};

const res = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (three.T blog updater)" } });
if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`);
const xml = await res.text();

const blocks = xml.split(/<item>/).slice(1).map((s) => s.split(/<\/item>/)[0]);
const items = blocks.slice(0, 6).map((b) => {
  let thumb = "";
  const attr = b.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
  if (attr) thumb = attr[1];
  if (!thumb) {
    const img = b.match(/https?:\/\/assets\.st-note\.com\/[^\s"'<>)]+\.(?:png|jpe?g|webp)[^\s"'<>)]*/i);
    if (img) thumb = img[0];
  }
  if (thumb) thumb = thumb.replace(/width=\d+/, "width=600");
  return { title: pick(b, "title"), url: pick(b, "link"), date: fmtDate(pick(b, "pubDate")), thumb };
}).filter((it) => it.title && it.url);

if (!items.length) throw new Error("No items parsed from RSS");

writeFileSync("assets/blog.json", JSON.stringify(items, null, 2) + "\n", "utf8");
console.log(`Wrote assets/blog.json with ${items.length} items. Latest: ${items[0].date} ${items[0].title}`);
