// Build the site's photos from originals/picks.json.
//
// picks.json is an array of:
//   {
//     "src":  "photos/IMG_1234.jpg",          // path under originals/
//     "slug": "hoi-an-primary-science-class", // becomes the file name (SEO: descriptive, kebab-case)
//     "alt":  "Two Year 3 students pour vinegar into a volcano model during science",
//     "aspect": "4:3",                        // optional: "4:3", "3:4", "1:1", "16:9", "3:2"; omit to keep the original
//     "position": "attention",                // optional sharp crop position; default "attention"
//     "region": [0.1, 0.2, 0.5, 0.5],         // optional [left, top, width, height] fractions, cut before the aspect crop
//     "trim": true,                           // optional: cut a transparent border off first
//     "focus": "50% 20%",                     // optional object-position for pages that crop it again (gallery squares)
//     "quality": 60,                          // optional WebP quality for a busy photo that comes out too heavy (default 78)
//     "taken": "2026-03-10",                  // optional, for the album: the date, when the file name does not say
//     "people": ["Mr. Seth"],                 // optional, for the album: who is in it, when it cannot be worked out
//     "tags": ["cooking"]                     // optional, for the album: anything else worth finding it by
//   }
//
// The last three are only ever read by the album page (src/_data/album.js), which
// works the same things out from the file name and the caption; they are there for
// when a guess comes out wrong.
//
// Output: src/assets/img/photos/<slug>-{480,960,1600}.webp
//         src/_data/photos.json  (slug -> alt, width, height, sizes) used by the {% photo %} shortcode.
//
// Run:  node scripts/images.mjs            (only rebuilds slugs whose output is missing)
//       node scripts/images.mjs --force    (rebuild everything)

import sharp from "sharp";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const ORIGINALS = join(ROOT, "originals");
const OUT = join(ROOT, "src", "assets", "img", "photos");
const DATA = join(ROOT, "src", "_data", "photos.json");
const WIDTHS = [480, 960, 1600];
const QUALITY = 78;
const force = process.argv.includes("--force");

const ratios = { "4:3": 4 / 3, "3:4": 3 / 4, "1:1": 1, "16:9": 16 / 9, "3:2": 3 / 2, "2:3": 2 / 3, "4:5": 4 / 5, "5:4": 5 / 4, "21:9": 21 / 9 };

// the notes only the album reads, carried through whether or not the photo is rebuilt
const notes = (p) => ({
  ...(p.taken ? { taken: p.taken } : {}),
  ...(p.people ? { people: p.people } : {}),
  ...(p.tags ? { tags: p.tags } : {}),
});

const picks = JSON.parse(await readFile(join(ORIGINALS, "picks.json"), "utf8"));
await mkdir(OUT, { recursive: true });

let existing = {};
try { existing = JSON.parse(await readFile(DATA, "utf8")); } catch {}

const out = {};
for (const p of picks) {
  if (!p.slug || !p.src || !p.alt) { console.warn("skipping pick without slug/src/alt:", p); continue; }
  const srcPath = join(ORIGINALS, p.src);

  // optional "trim": true cuts a transparent border off the source first (region is then relative to what is left),
  // plus 2px of its soft edge so padding never repeats a half-clear row
  let input = srcPath;
  if (p.trim) {
    const { data, info } = await sharp(srcPath, { failOn: "none" }).rotate().trim().png().toBuffer({ resolveWithObject: true });
    input = await sharp(data).extract({ left: 2, top: 2, width: info.width - 4, height: info.height - 4 }).removeAlpha().png().toBuffer();
  }

  // optional "region": [left, top, width, height] as fractions of the source, applied first.
  // A region may run past the edges; the overhang is filled by repeating the edge pixels.
  let base = sharp(input, { failOn: "none" }).rotate();
  let meta = await base.metadata();
  let srcW = meta.width, srcH = meta.height;
  if ((meta.orientation || 1) >= 5) [srcW, srcH] = [srcH, srcW];
  const region = p.region && p.region.map((f, i) => Math.round(f * (i % 2 ? srcH : srcW)));
  const imgW = srcW, imgH = srcH;
  if (region) { srcW = region[2]; srcH = region[3]; }
  const ratio = p.aspect ? ratios[p.aspect] : srcW / srcH;
  if (!ratio) throw new Error(`unknown aspect ${p.aspect} for ${p.slug}`);

  // crop box at source resolution
  let cropW = srcW, cropH = Math.round(srcW / ratio);
  if (cropH > srcH) { cropH = srcH; cropW = Math.round(srcH * ratio); }

  // Every step up to the crop width. When the source falls between steps, the last file is the
  // full crop width (480 + 810, say), so a small original is never upscaled or thrown away.
  const widths = [];
  for (const w of WIDTHS) {
    const width = Math.min(w, cropW);
    if (widths.length && width - widths[widths.length - 1] < 120) break;
    widths.push(width);
    if (width < w) break;
  }

  const prev = existing[p.slug];
  if (!force && prev && prev.sizes.join() === widths.join()) {
    try { await stat(join(OUT, `${p.slug}-${widths[0]}.webp`)); out[p.slug] = { ...prev, alt: p.alt, focus: p.focus, ...notes(p) }; continue; } catch {}
  }

  let regionBuf = null;
  if (region) {
    const [l, t, w, h] = region;
    const left = Math.max(0, l), top = Math.max(0, t);
    const right = Math.min(imgW, l + w), bottom = Math.min(imgH, t + h);
    regionBuf = await base.extract({ left, top, width: right - left, height: bottom - top }).toBuffer();
    if (left > l || top > t || right < l + w || bottom < t + h) {
      regionBuf = await sharp(regionBuf)
        .extend({ left: left - l, top: top - t, right: l + w - right, bottom: t + h - bottom, extendWith: "copy" })
        .toBuffer();
    }
  }
  const source = () => (regionBuf ? sharp(regionBuf) : sharp(input, { failOn: "none" }).rotate());

  for (const width of widths) {
    await source()
      .resize({ width, height: Math.round(width / ratio), fit: "cover", position: p.position || "attention" })
      .webp({ quality: p.quality || QUALITY })
      .toFile(join(OUT, `${p.slug}-${width}.webp`));
  }
  const sizes = widths;
  const width = widths[widths.length - 1];
  out[p.slug] = { alt: p.alt, width, height: Math.round(width / ratio), sizes, src: p.src, focus: p.focus, ...notes(p) };
  console.log(`built ${p.slug} (${sizes.join("/")}) from ${p.src}`);
}

await writeFile(DATA, JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.keys(out).length} photos in ${DATA}`);
