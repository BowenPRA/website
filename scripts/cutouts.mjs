// Build the staff cutouts from originals/cutouts.json.
//
// Each member is photographed against a plain backdrop; this keys that backdrop
// out to transparency so the portrait can sit on a coloured card (see .team in
// main.css). The key floods in from the border, so background-coloured areas
// inside the subject (a white shirt, a pale áo dài) are kept.
//
// cutouts.json is an array of:
//   {
//     "src":  "wix-current/Mr_-Seth.png",  // path under originals/
//     "slug": "seth",                       // matches a team.json member slug
//     "alt":  "Mr. Seth",
//     "tol":  16,        // optional: colour distance that still counts as backdrop (default 18)
//     "face": [0.51, 0.22],               // [centre x, width] of the face as fractions of the
//                        //   source width, measured by hand; the crop is built from the width so
//                        //   every face comes out the same size. Omit it and the head is guessed
//                        //   from the row profile. The top of the head and the horizontal centre
//                        //   both come from the cut itself, so only the width really matters.
//     "scale": 4.2,      // optional: crop width as a multiple of the face's width — smaller
//                        //   crops in tighter (default 4.2)
//     "mattes": [[0.0, 0.3, 0.2, 0.7]],   // optional [x, y, w, h] boxes in fractions of the source,
//                        //   rubbed out before the cut — for a cast shadow joined to the subject
//     "lift": 0.07,      // optional: headroom above the head, as a fraction of the crop height
//     "shift": 0.04,     // optional: nudge the crop sideways, as a fraction of its width
//     "grow": 2,         // optional: pixels of the cut grown into the subject to eat the fringe
//     "fade": false      // optional: keep a hard bottom edge on a portrait that stops short
//   }
//
// Output: src/assets/img/team/<slug>-{360,720}.webp   (WebP keeps the alpha channel)
//         src/_data/cutouts.json  (slug -> alt, width, height, sizes)
//
// Run:  node scripts/cutouts.mjs           (only rebuilds slugs whose output is missing)
//       node scripts/cutouts.mjs --force   (rebuild everything)
//       node scripts/cutouts.mjs --sheet   (also write a contact sheet to check the crops)

import sharp from "sharp";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const ORIGINALS = join(ROOT, "originals");
const OUT = join(ROOT, "src", "assets", "img", "team");
const DATA = join(ROOT, "src", "_data", "cutouts.json");
const WIDTHS = [360, 720];
const ASPECT = 4 / 5;        // the card's portrait window
const QUALITY = 82;
const force = process.argv.includes("--force");

/* ---------- the key ---------- */

// Flood the backdrop in from the border. Interior areas that happen to match the
// backdrop survive because the flood never reaches them.
async function key(src, { tol, grow, feather }) {
  const { data, info } = await sharp(src).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const n = w * h;

  const mask = new Uint8Array(n);   // 1 = backdrop
  const work = [];

  // Anything already transparent is backdrop. Some sources are a rectangular
  // photo sitting inside a transparent frame rather than a cutout, so this
  // step only strips the frame and the real backdrop is keyed after it.
  for (let p = 0; p < n; p++) if (data[p * c + 3] < 128) mask[p] = 1;

  // Sample the backdrop where the opaque area begins: the image border for a
  // plain photo, the inside edge of the frame for a framed one.
  const edge = [];
  for (let p = 0; p < n; p++) {
    if (mask[p] || data[p * c + 3] < 128) continue;
    const x = p % w, y = (p / w) | 0;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
        (x > 0 && mask[p - 1]) || (x < w - 1 && mask[p + 1]) ||
        (y > 0 && mask[p - w]) || (y < h - 1 && mask[p + w])) edge.push(p);
  }
  const bg = [0, 1, 2].map((k) => {
    const v = edge.map((p) => data[p * c + k]).sort((a, b) => a - b);
    return v[v.length >> 1];
  });

  const lim = tol * 3;
  const isBg = (p) =>
    data[p * c + 3] < 128 ||
    (Math.abs(data[p * c] - bg[0]) + Math.abs(data[p * c + 1] - bg[1]) + Math.abs(data[p * c + 2] - bg[2]) <= lim);

  for (const p of edge) if (!mask[p] && isBg(p)) { mask[p] = 1; work.push(p); }
  while (work.length) {
    const p = work.pop(), x = p % w, y = (p / w) | 0;
    if (x > 0)     { const q = p - 1; if (!mask[q] && isBg(q)) { mask[q] = 1; work.push(q); } }
    if (x < w - 1) { const q = p + 1; if (!mask[q] && isBg(q)) { mask[q] = 1; work.push(q); } }
    if (y > 0)     { const q = p - w; if (!mask[q] && isBg(q)) { mask[q] = 1; work.push(q); } }
    if (y < h - 1) { const q = p + w; if (!mask[q] && isBg(q)) { mask[q] = 1; work.push(q); } }
  }

  // The last pixel or two of the subject is a blend of hair and backdrop and
  // reads as a pale halo on a coloured card, so grow the cut inwards.
  for (let s = 0; s < grow; s++) {
    const add = [];
    for (let p = 0; p < n; p++) {
      if (mask[p]) continue;
      const x = p % w, y = (p / w) | 0;
      if ((x > 0 && mask[p - 1]) || (x < w - 1 && mask[p + 1]) ||
          (y > 0 && mask[p - w]) || (y < h - 1 && mask[p + w])) add.push(p);
    }
    for (const p of add) mask[p] = 1;
  }

  const alpha = Buffer.alloc(n);
  for (let p = 0; p < n; p++) alpha[p] = mask[p] ? 0 : 255;
  // sharp promotes a one-channel raw buffer to three, so read the stride back.
  const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
    .blur(feather).raw().toBuffer({ resolveWithObject: true });
  const sd = soft.data, sc = soft.info.channels;

  const out = Buffer.alloc(n * 4);
  for (let p = 0; p < n; p++) {
    out[p * 4] = data[p * c];
    out[p * 4 + 1] = data[p * c + 1];
    out[p * 4 + 2] = data[p * c + 2];
    out[p * 4 + 3] = Math.min(sd[p * sc], data[p * c + 3]);
  }
  return { buf: out, w, h };
}

// A shadow the key could not reach is a blob of its own; the person is the big one.
function keepLargest(buf, w, h, a = 20) {
  const n = w * h;
  const lab = new Int32Array(n).fill(-1);
  let best = -1, bestSize = 0, id = 0;
  const stack = [];
  for (let s = 0; s < n; s++) {
    if (lab[s] !== -1 || buf[s * 4 + 3] < a) continue;
    let size = 0; lab[s] = id; stack.push(s);
    while (stack.length) {
      const p = stack.pop(); size++;
      const x = p % w, y = (p / w) | 0;
      if (x > 0)     { const q = p - 1; if (lab[q] === -1 && buf[q * 4 + 3] >= a) { lab[q] = id; stack.push(q); } }
      if (x < w - 1) { const q = p + 1; if (lab[q] === -1 && buf[q * 4 + 3] >= a) { lab[q] = id; stack.push(q); } }
      if (y > 0)     { const q = p - w; if (lab[q] === -1 && buf[q * 4 + 3] >= a) { lab[q] = id; stack.push(q); } }
      if (y < h - 1) { const q = p + w; if (lab[q] === -1 && buf[q * 4 + 3] >= a) { lab[q] = id; stack.push(q); } }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  for (let p = 0; p < n; p++) if (lab[p] !== best) buf[p * 4 + 3] = 0;
}

/* ---------- framing ---------- */

// Rows and columns that hold any of the subject, so the crop can be measured
// from the person rather than from the photo.
function extent(buf, w, h, a = 24) {
  const rows = new Int32Array(h), cols = new Int32Array(w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (buf[(y * w + x) * 4 + 3] >= a) { rows[y]++; cols[x]++; }
  }
  let y0 = 0; while (y0 < h && rows[y0] === 0) y0++;
  let y1 = h - 1; while (y1 > y0 && rows[y1] === 0) y1--;
  let x0 = 0; while (x0 < w && cols[x0] === 0) x0++;
  let x1 = w - 1; while (x1 > x0 && cols[x1] === 0) x1--;
  return { rows, cols, x0, y0, x1, y1 };
}

// Everyone is framed the same way: a 4:5 window scaled to the width of the
// person's face, so every face lands the same size on the card whatever the
// source photo was, and the body runs off the bottom edge.
//
// The face width is measured by hand once per person (originals/cutouts.json)
// because nothing automatic survives long hair, a hat or a tilted head. Run
// `node scripts/cutouts.mjs --sheet` and check the contact sheet after changing one.
function frame(buf, w, h, { face, scale, lift, shift }) {
  const { x0, y0, x1, y1 } = extent(buf, w, h);

  const faceW = face ? face[1] * w : autoFaceWidth(buf, w, h);
  const crown = y0;   // the top of the cut is the top of the head

  // Centre on the head rather than the whole body: folded arms, a hand on a hip
  // or a leaning stance should not push the face off centre. Once the face width
  // is known the head band is just under the crown, so this needs no guessing.
  const band = Math.min(y1, crown + Math.round(faceW * 1.25));
  let sum = 0, count = 0;
  for (let y = crown; y <= band; y++) for (let x = x0; x <= x1; x++) {
    if (buf[(y * w + x) * 4 + 3] >= 24) { sum += x; count++; }
  }
  const cx = (count ? sum / count : w / 2) + faceW * scale * shift;

  const cropW = Math.round(faceW * scale);
  const cropH = Math.round(cropW / ASPECT);

  return {
    left: Math.round(cx - cropW / 2),
    top: Math.round(crown - cropH * lift),
    width: cropW,
    height: cropH,
    faceW: Math.round(faceW),
  };
}

// Fallback for a member with no measured face box: the row profile dips at the
// neck, so the first peak below the crown is roughly the head.
function autoFaceWidth(buf, w, h) {
  const { rows, y0, y1 } = extent(buf, w, h);
  const win = Math.max(2, Math.round((y1 - y0 + 1) * 0.012));
  const smooth = (y) => {
    let sum = 0, k = 0;
    for (let i = Math.max(y0, y - win); i <= Math.min(y1, y + win); i++) { sum += rows[i]; k++; }
    return sum / k;
  };
  let wmax = 0;
  for (let y = y0; y <= y1; y++) if (rows[y] > wmax) wmax = rows[y];
  for (let y = y0 + win; y < y1 - win; y++) {
    const v = smooth(y);
    if (v > 0.12 * wmax && v >= smooth(y - win) && v > smooth(y + win)) return v;
  }
  return wmax * 0.35;
}

// Cut the box out of the image. The box is allowed to run past the edges —
// a tight studio shot often has no room above the head — so the part that
// overlaps is extracted and the rest is made up with transparent padding.
async function extract(buf, w, h, box) {
  const left = Math.max(0, box.left);
  const top = Math.max(0, box.top);
  const right = Math.min(w, box.left + box.width);
  const bottom = Math.min(h, box.top + box.height);
  if (right <= left || bottom <= top) throw new Error("crop falls outside the photo");

  return sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width: right - left, height: bottom - top })
    .extend({
      left: left - box.left,
      top: top - box.top,
      right: box.left + box.width - right,
      bottom: box.top + box.height - bottom,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer();
}

// Not every source photo holds a whole above-the-waist portrait: several of the
// old square headshots stop at the chest, which on a coloured card leaves the
// body ending on a razor-straight line partway down. Where the person stops
// before the bottom of the card, the last stretch of them is faded out so they
// sink into the colour instead. A portrait that already runs off the bottom
// edge is left alone — that cut is the card's own edge and looks right.
function fadeCutEdge(buf, w, h) {
  let lastY = -1;
  for (let y = h - 1; y >= 0 && lastY < 0; y--) {
    for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] >= 24) { lastY = y; break; }
  }
  if (lastY < 0 || lastY >= h - 3) return false;

  let firstY = 0;
  outer: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] >= 24) { firstY = y; break outer; }
  }
  const span = Math.max(24, Math.round((lastY - firstY) * 0.16));
  for (let y = Math.max(0, lastY - span); y <= lastY; y++) {
    const k = (lastY - y) / span;
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4 + 3;
      if (buf[p]) buf[p] = Math.round(buf[p] * k);
    }
  }
  return true;
}

/* ---------- build ---------- */

const specs = JSON.parse(await readFile(join(ORIGINALS, "cutouts.json"), "utf8"));
await mkdir(OUT, { recursive: true });

let existing = {};
try { existing = JSON.parse(await readFile(DATA, "utf8")); } catch {}

const out = {};
const sheet = [];

for (const spec of specs) {
  const { slug, src, alt } = spec;
  const tol = spec.tol ?? 18;
  const scale = spec.scale ?? 4.2;
  const lift = spec.lift ?? 0.10;
  const shift = spec.shift ?? 0;
  const grow = spec.grow ?? 2;
  const feather = spec.feather ?? 1.1;

  const done = !force && existing[slug] && (await stat(join(OUT, `${slug}-${WIDTHS[0]}.webp`)).catch(() => null));
  if (done && !process.argv.includes("--sheet")) { out[slug] = existing[slug]; continue; }

  const { buf, w, h } = await key(join(ORIGINALS, src), { tol, grow, feather });
  // A cast shadow the key cannot tell from the wall stays joined to the person,
  // so it is rubbed out by hand and the stray piece then falls away below.
  for (const [mx, my, mw, mh] of spec.mattes ?? []) {
    const ax = Math.round(mx * w), ay = Math.round(my * h);
    const bx = Math.round((mx + mw) * w), by = Math.round((my + mh) * h);
    for (let y = Math.max(0, ay); y < Math.min(h, by); y++)
      for (let x = Math.max(0, ax); x < Math.min(w, bx); x++) buf[(y * w + x) * 4 + 3] = 0;
  }
  keepLargest(buf, w, h);
  const box = frame(buf, w, h, { face: spec.face, scale, lift, shift });
  const cropped = await extract(buf, w, h, box);
  const faded = spec.fade === false ? false : fadeCutEdge(cropped, box.width, box.height);
  const png = await sharp(cropped, { raw: { width: box.width, height: box.height, channels: 4 } }).png().toBuffer();

  for (const width of WIDTHS) {
    await sharp(png)
      .resize({ width, height: Math.round(width / ASPECT), fit: "fill" })
      .webp({ quality: QUALITY, alphaQuality: 90 })
      .toFile(join(OUT, `${slug}-${width}.webp`));
  }
  out[slug] = { alt, width: WIDTHS[WIDTHS.length - 1], height: Math.round(WIDTHS[WIDTHS.length - 1] / ASPECT), sizes: WIDTHS };
  if (process.argv.includes("--sheet")) sheet.push({ slug, png });
  console.log(`${slug.padEnd(9)} face ${String(box.faceW).padStart(4)}px wide  crop ${box.width}x${box.height}  from ${w}x${h}${faded ? '  (bottom faded)' : ''}`);
}

await writeFile(DATA, JSON.stringify(out, null, 2) + "\n");
console.log(`\n${Object.keys(out).length} cutouts -> src/assets/img/team/`);

if (sheet.length) {
  const cw = 200, ch = 250, cols = 6;
  const rows = Math.ceil(sheet.length / cols);
  const tiles = await Promise.all(sheet.map(async (s, i) => ({
    input: await sharp(s.png).resize(cw, ch, { fit: "fill" }).png().toBuffer(),
    left: (i % cols) * cw, top: Math.floor(i / cols) * ch,
  })));
  const bg = Buffer.from(
    `<svg width="${cols * cw}" height="${rows * ch}"><rect width="100%" height="100%" fill="#116DFF"/></svg>`
  );
  const path = join(ROOT, "originals", "_review", "cutouts-sheet.jpg");
  await mkdir(join(ROOT, "originals", "_review"), { recursive: true });
  await sharp(bg).composite(tiles).jpeg({ quality: 80 }).toFile(path);
  console.log(`contact sheet -> ${path}`);
}
