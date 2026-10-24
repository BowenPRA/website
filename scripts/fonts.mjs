// Copies the two fonts, Poppins and Be Vietnam Pro, from Google Fonts into the site, so a page
// no longer waits on a second website (fonts.googleapis.com, then fonts.gstatic.com) before it
// can show its text. Run it again only to change the weights or pick up a new version:
//
//   node scripts/fonts.mjs
//
// It writes the .woff2 files to src/assets/fonts/ and the @font-face rules to
// src/_includes/partials/fonts.njk, which the layout puts inside a <style> in each page's head.
// English pages get both fonts (Be Vietnam Pro only for Vietnamese letters, as in Hội An);
// Vietnamese pages get Be Vietnam Pro only. Each font comes in pieces by alphabet (latin,
// latin-ext, vietnamese) and a browser downloads only the pieces the page's letters need.

import { mkdir, writeFile, readdir, unlink } from "node:fs/promises";

const WEIGHTS = "400;500;600;700;800";
const CSS_URL = `https://fonts.googleapis.com/css2?family=Poppins:wght@${WEIGHTS}&family=Be+Vietnam+Pro:wght@${WEIGHTS}&display=swap`;
// Google sends .woff2 only to a browser it knows takes them.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const KEEP = new Set(["latin", "latin-ext", "vietnamese"]); // Poppins also has devanagari, which the site never uses
const FONT_DIR = "src/assets/fonts";
const PARTIAL = "src/_includes/partials/fonts.njk";

const css = await (await fetch(CSS_URL, { headers: { "User-Agent": UA } })).text();
const faces = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)].map(([, subset, body]) => ({
  subset,
  family: body.match(/font-family: '([^']+)'/)[1],
  weight: body.match(/font-weight: (\d+)/)[1],
  src: body.match(/url\((https:[^)]+\.woff2)\)/)[1],
  range: body.match(/unicode-range: ([^;]+);/)[1],
})).filter((f) => KEEP.has(f.subset));
if (faces.length !== 25) throw new Error(`Expected 25 font pieces (2 fonts x 5 weights, less Poppins' devanagari), got ${faces.length}`);

await mkdir(FONT_DIR, { recursive: true });
for (const old of await readdir(FONT_DIR)) if (old.endsWith(".woff2")) await unlink(`${FONT_DIR}/${old}`);
let bytes = 0;
for (const f of faces) {
  f.file = `${f.family.toLowerCase().replace(/ /g, "-")}-${f.weight}-${f.subset}.woff2`;
  const buf = Buffer.from(await (await fetch(f.src)).arrayBuffer());
  if (buf.subarray(0, 4).toString() !== "wOF2") throw new Error(`${f.src} is not a woff2 file`);
  await writeFile(`${FONT_DIR}/${f.file}`, buf);
  bytes += buf.length;
}

const rule = (f) => `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:swap;src:url({{ "/assets/fonts/${f.file}" | url }}) format("woff2");unicode-range:${f.range}}`;
const poppins = faces.filter((f) => f.family === "Poppins").map(rule);
const viet = faces.filter((f) => f.family === "Be Vietnam Pro").map(rule);
await writeFile(PARTIAL, `{#- Written by scripts/fonts.mjs from Google Fonts; run it again rather than editing this file. -#}
{%- if lang != "vi" %}
${poppins.join("\n")}
{%- endif %}
${viet.join("\n")}
`);
console.log(`${faces.length} font files, ${Math.round(bytes / 1024)} KB in all, in ${FONT_DIR}; rules in ${PARTIAL}`);
