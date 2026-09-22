// Merge reviewer shortlists in originals/_review/*.json, keep score >= 4,
// and build larger contact sheets (3 columns, 420px cells) for a final pass.
import sharp from "sharp";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const REVIEW = join(ROOT, "originals", "_review");
const OUT = join(REVIEW, "finalists");
const COLS = 3, CELL = 420, PAD = 8, LABEL = 26, PER = 12;

const all = [];
for (const f of (await readdir(REVIEW)).filter((f) => f.endsWith(".json") && f !== "finalists.json")) {
  const items = JSON.parse(await readFile(join(REVIEW, f), "utf8"));
  const wix = f.startsWith("wix");
  for (const it of items) {
    const rel = wix ? it.file : `photos-jpg/${it.file}`;
    if (it.score >= 4) all.push({ ...it, rel, batch: f.replace(".json", "") });
  }
}
all.sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));
all.forEach((it, i) => (it.id = i + 1));
await mkdir(OUT, { recursive: true });
await writeFile(join(REVIEW, "finalists.json"), JSON.stringify(all, null, 2));

const rows = Math.ceil(PER / COLS);
const W = COLS * (CELL + PAD) + PAD, H = rows * (CELL + LABEL + PAD) + PAD;
for (let s = 0; s * PER < all.length; s++) {
  const batch = all.slice(s * PER, (s + 1) * PER);
  const composites = [];
  for (const [i, it] of batch.entries()) {
    const x = PAD + (i % COLS) * (CELL + PAD);
    const y = PAD + Math.floor(i / COLS) * (CELL + LABEL + PAD);
    const thumb = await sharp(join(ROOT, "originals", it.rel), { failOn: "none" }).rotate().resize(CELL, CELL, { fit: "inside" }).jpeg({ quality: 78 }).toBuffer();
    const m = await sharp(thumb).metadata();
    composites.push({ input: thumb, left: x + Math.floor((CELL - m.width) / 2), top: y + Math.floor((CELL - m.height) / 2) });
    const text = `F${it.id}  ${it.score}★  ${it.use}  ${it.rel.split("/").slice(-2).join("/").slice(-40)}`.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    composites.push({ input: Buffer.from(`<svg width="${CELL}" height="${LABEL}"><rect width="100%" height="100%" fill="#22302B"/><text x="6" y="18" font-family="Arial" font-size="14" font-weight="bold" fill="#fff">${text}</text></svg>`), left: x, top: y + CELL });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#FFF8EC" } }).composite(composites).jpeg({ quality: 82 }).toFile(join(OUT, `finalists-${s + 1}.jpg`));
}
console.log(`${all.length} finalists, ${Math.ceil(all.length / PER)} sheets in ${OUT}`);
const byUse = {};
for (const it of all) byUse[it.use] = (byUse[it.use] || 0) + 1;
console.log(JSON.stringify(byUse));
