// Make numbered contact sheets from a folder of photos so a reviewer (human or model)
// can scan many images at once and refer to them by number.
//
//   node scripts/contact-sheets.mjs <folder under originals/> <outDir> [perSheet=20] [skip regex]
//
// Writes <outDir>/sheet-001.jpg ... and <outDir>/index.json mapping sheet -> [{n, file}].
// Sheets are 4 columns, 300px cells, with the number burned into each cell.
// sharp cannot read HEIC, so convert those first (scripts/heic-to-jpg.py); files whose
// path under the folder matches the skip regex (posters, tickets) are left off.

import sharp from "sharp";
import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const [, , folderArg, outArg, perArg, skipArg] = process.argv;
const FOLDER = join(ROOT, "originals", folderArg || "photos");
const OUT = outArg || join(ROOT, "originals", "_sheets");
const PER = Number(perArg) || 20;
const COLS = 4, CELL = 300, PAD = 6, LABEL = 22;
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
const SKIP = skipArg ? new RegExp(skipArg, "i") : null;

async function walk(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else if (EXT.has(extname(e.name).toLowerCase())) acc.push(p);
  }
  return acc;
}

const files = (await walk(FOLDER)).sort().filter((f) => !SKIP || !SKIP.test(relative(FOLDER, f).replace(/\\/g, "/")));
await mkdir(OUT, { recursive: true });
const index = [];
const rows = Math.ceil(PER / COLS);
const W = COLS * (CELL + PAD) + PAD, H = rows * (CELL + LABEL + PAD) + PAD;

for (let s = 0; s * PER < files.length; s++) {
  const batch = files.slice(s * PER, (s + 1) * PER);
  const composites = [];
  const entries = [];
  for (const [i, f] of batch.entries()) {
    const n = s * PER + i + 1;
    const rel = relative(FOLDER, f).replace(/\\/g, "/");
    entries.push({ n, file: rel });
    const x = PAD + (i % COLS) * (CELL + PAD);
    const y = PAD + Math.floor(i / COLS) * (CELL + LABEL + PAD);
    let thumb;
    try {
      thumb = await sharp(f, { failOn: "none" }).rotate().resize(CELL, CELL, { fit: "inside" }).jpeg({ quality: 70 }).toBuffer();
    } catch (err) {
      console.warn(`skip ${rel}: ${err.message}`);
      continue;
    }
    const meta = await sharp(thumb).metadata();
    composites.push({ input: thumb, left: x + Math.floor((CELL - meta.width) / 2), top: y + Math.floor((CELL - meta.height) / 2) });
    const label = Buffer.from(
      `<svg width="${CELL}" height="${LABEL}"><rect width="100%" height="100%" fill="#22302B"/><text x="6" y="16" font-family="Arial" font-size="15" font-weight="bold" fill="#fff">#${n}  ${rel.slice(-34)}</text></svg>`
    );
    composites.push({ input: label, left: x, top: y + CELL });
  }
  const name = `sheet-${String(s + 1).padStart(3, "0")}.jpg`;
  await sharp({ create: { width: W, height: H, channels: 3, background: "#FFF8EC" } })
    .composite(composites).jpeg({ quality: 82 }).toFile(join(OUT, name));
  index.push({ sheet: name, entries });
  console.log(`${name}: #${entries[0].n} to #${entries[entries.length - 1].n}`);
}
await writeFile(join(OUT, "index.json"), JSON.stringify({ folder: folderArg || "photos", total: files.length, sheets: index }, null, 2));
console.log(`${files.length} images, ${index.length} sheets in ${OUT}`);
