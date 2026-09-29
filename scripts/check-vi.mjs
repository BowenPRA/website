// npm run check:vi
// Does the Vietnamese site still match the English one? See VIETNAMESE.md.
//
// Errors (exit 1): an English page with no Vietnamese twin, a twin with different photos,
// links, anchors or permalink, a data object with no `vi` block or one missing a field.
// Warnings: photos with no Vietnamese caption, Vietnamese pages committed before their
// English twin last changed, and words we do not use in Vietnamese (above all "trường").
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SRC = join(ROOT, "src");
const read = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n"); // working copies are CRLF (autocrlf)
const json = (p) => JSON.parse(read(p));
const errors = [];
const warnings = [];

// ---------- pages ----------

// English pages that have no Vietnamese twin on purpose.
const UNTWINNED = new Set(["album.njk", "404.njk", "learning/redirects.njk", "families/calendar.njk"]);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const rel = (p) => relative(SRC, p).replace(/\\/g, "/");
const enPages = walk(SRC)
  .map(rel)
  .filter((p) => p.endsWith(".njk") && !p.startsWith("_includes/") && !p.startsWith("vi/") && !UNTWINNED.has(p));

const photos = json("src/_data/photos.json");
const cutouts = existsSync(join(SRC, "_data/cutouts.json")) ? json("src/_data/cutouts.json") : {};

function shape(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const body = text.slice(fm.length);
  const quoted = [...body.matchAll(/["']([a-z0-9][a-z0-9-]+)["']/g)].map((m) => m[1]);
  const count = (re) => (body.match(re) || []).length;
  return {
    permalink: fm.match(/^permalink:\s*"?([^"\n]+)"?/m)?.[1]?.trim(),
    photos: quoted.filter((s) => photos[s]).join(" "),
    links: [...body.matchAll(/["'](\/[^"']*)["']\s*\|\s*href\(lang\)/g)].map((m) => m[1]).sort().join(" "),
    ids: [...body.matchAll(/\sid="([^"{]+)"/g)].map((m) => m[1]).sort().join(" "),
    includes: [...body.matchAll(/{%\s*include\s+"([^"]+)"/g)].map((m) => m[1]).join(" "),
    tags: ["<section", "<h2", "<h3", "<details", "<li", "<table", "<tr", "<form", "<input", "<select", "<textarea"]
      .map((t) => `${t.slice(1)} ${count(new RegExp(t + "[\\s>]", "g"))}`).join(", "),
    urlFilter: count(/["']\/(?!assets\/)[^"']*["']\s*\|\s*url\b/g),
  };
}

function gitTime(path) {
  try {
    const dirty = execFileSync("git", ["status", "--porcelain", "--", path], { cwd: ROOT, encoding: "utf8" }).trim();
    if (dirty) return null; // not committed yet: nothing to compare
    const t = execFileSync("git", ["log", "-1", "--format=%ct", "--", path], { cwd: ROOT, encoding: "utf8" }).trim();
    return t ? Number(t) : null;
  } catch { return null; }
}

for (const p of enPages) {
  const vp = "vi/" + p;
  if (!existsSync(join(SRC, vp))) { errors.push(`missing page: src/${vp} (twin of src/${p})`); continue; }
  const en = shape(read("src/" + p));
  const vi = shape(read("src/" + vp));
  if (en.permalink && vi.permalink !== "/vi" + en.permalink) errors.push(`src/${vp}: permalink should be /vi${en.permalink} (is ${vi.permalink ?? "not set"})`);
  if (!en.permalink && vi.permalink) errors.push(`src/${vp}: has a permalink but src/${p} does not`);
  for (const k of ["photos", "links", "ids", "includes", "tags"]) {
    if (en[k] !== vi[k]) errors.push(`src/${vp}: ${k} differ from src/${p}\n      en: ${en[k]}\n      vi: ${vi[k]}`);
  }
  if (vi.urlFilter) errors.push(`src/${vp}: ${vi.urlFilter} internal link(s) use | url, which points at the English page. Use | href(lang)`);
  const te = gitTime("src/" + p), tv = gitTime("src/" + vp);
  if (te && tv && te > tv) warnings.push(`src/${vp} was last committed before src/${p} changed: check the Vietnamese still says the same thing`);
}
for (const p of walk(join(SRC, "vi")).map(rel).filter((p) => p.endsWith(".njk"))) {
  if (!existsSync(join(SRC, p.slice(3)))) warnings.push(`src/${p} has no English twin`);
}

// ---------- data files ----------

// Keys that are ids, colours, paths or times, never words to translate.
const TECH = new Set(["_about", "id", "key", "tone", "slug", "tag", "k", "href", "url", "photo", "photos", "flyer", "shots", "tint",
  "mapUrl", "email", "phone", "phoneIntl", "formAction", "social", "from", "to", "year", "founded", "classCap"]);
// Per file: keys that stay as they are (names, editor notes).
const SKIP = {
  "site.json": ["name", "shortName", "url", "address"],
  "team.json": ["note", "name"],
};
// Values that stay in English in Vietnamese too (VIETNAMESE.md, glossary).
const KEEP = new Set(["Early Years", "Nursery", "Kindergarten", "Primary", "Lower Secondary", "Upper Secondary", "Global Program",
  "Regular Program", "Maker Space", "Art of Science", "Movement", "Wellbeing", "Review", "Boredom", "Master Minds", "Book Worms",
  "Everyday Experts", "Executive Function", "Practice, Presentation and Play", "Palm River Academy", "PRA"]);

const isWords = (v) => typeof v === "string" && /[A-Za-z]/.test(v) && !/^(#|\/|https?:|mailto:|tel:)/.test(v)
  && !/^[a-z0-9-]+$/.test(v) && !/^\d{1,2}:\d{2}$/.test(v) && !KEEP.has(v);
const needsVi = (k, v, skip) => !TECH.has(k) && !skip.includes(k) && !k.startsWith("_")
  && (isWords(v) || (Array.isArray(v) && v.some(isWords)));

function checkData(file, node, path, skip) {
  if (Array.isArray(node)) return node.forEach((n, i) => checkData(file, n, `${path}[${i}]`, skip));
  if (!node || typeof node !== "object") return;
  const want = Object.keys(node).filter((k) => needsVi(k, node[k], skip));
  if (node.tag) want.push("tagLabel");
  if (want.length) {
    const vi = node.vi;
    if (!vi) errors.push(`${file} ${path || "(top)"}: no vi block (needs ${want.join(", ")})`);
    else {
      const missing = want.filter((k) => vi[k] === undefined || vi[k] === "");
      if (missing.length) errors.push(`${file} ${path || "(top)"}: vi block is missing ${missing.join(", ")}`);
      for (const k of want) if (Array.isArray(node[k]) && Array.isArray(vi[k]) && node[k].length !== vi[k].length)
        errors.push(`${file} ${path}.${k}: ${node[k].length} items in English, ${vi[k].length} in Vietnamese`);
    }
  }
  for (const [k, v] of Object.entries(node)) if (k !== "vi" && v && typeof v === "object") checkData(file, v, path ? `${path}.${k}` : k, skip);
}
for (const f of ["site.json", "announcements.json", "calendar.json", "days.json", "events.json", "programs.json", "team.json"]) {
  checkData(f, json("src/_data/" + f), "", SKIP[f] || []);
}

// ---------- photo captions ----------

const altVi = existsSync(join(SRC, "_data/altVi.json")) ? json("src/_data/altVi.json") : {};
const noCaption = [...Object.keys(photos), ...Object.keys(cutouts)].filter((s) => !altVi[s]);
if (noCaption.length) warnings.push(`${noCaption.length} photo(s) with no Vietnamese caption in src/_data/altVi.json:\n      ${noCaption.join("\n      ")}`);
const stale = Object.keys(altVi).filter((s) => !photos[s] && !cutouts[s]);
if (stale.length) warnings.push(`altVi.json has captions for photos that no longer exist: ${stale.join(", ")}`);

// ---------- words ----------

// Every Vietnamese string on the site, with where it came from.
const texts = [];
for (const p of walk(join(SRC, "vi")).map(rel).filter((p) => p.endsWith(".njk"))) texts.push([`src/${p}`, read("src/" + p)]);
function collectVi(file, node) {
  if (Array.isArray(node)) return node.forEach((n) => collectVi(file, n));
  if (!node || typeof node !== "object") return;
  if (node.vi) texts.push([file, JSON.stringify(node.vi)]);
  Object.entries(node).forEach(([k, v]) => k !== "vi" && collectVi(file, v));
}
for (const f of ["site.json", "announcements.json", "calendar.json", "days.json", "events.json", "programs.json", "team.json"]) collectVi(`src/_data/${f}`, json("src/_data/" + f));
texts.push(["src/_data/strings.json", JSON.stringify(json("src/_data/strings.json").vi)]);
texts.push(["src/_data/altVi.json", JSON.stringify(altVi)]);

const WORDS = [
  // "trường" alone is school; môi trường, thị trường, trường hợp, quảng trường, trưởng are other words.
  [/(?<!môi |thị |quảng |chiến |lập |hiện |sở |thao |nông |ngư |phi |từ |điện )trường(?! hợp)/gi, "trường: fine for another school (trường cũ, trường quốc tế, đại học), never for PRA"],
  [/hiệu trưởng/gi, "hiệu trưởng: we have no principal (Giáo viên trưởng)"],
  [/học sinh/gi, "học sinh: our students are học viên, or con / các con / các bé"],
  [/bố mẹ/gi, "bố mẹ: we write ba mẹ"],
  [/quý phụ huynh/gi, "quý phụ huynh: only in formal notes, otherwise ba mẹ"],
  [/toàn diện|năng động|đẳng cấp|hàng đầu|chắp cánh|khơi dậy|khơi gợi|tiềm năng vô hạn|nuôi dưỡng tâm hồn|hành trang|hành trình|vững bước|tương lai tươi sáng|vươn tầm|bứt phá|tỏa sáng|chuẩn quốc tế|trải nghiệm tuyệt vời|tại sao nên chọn/gi, "a banned cliché (VIETNAMESE.md)"],
];
for (const [file, text] of texts) {
  const plain = text.replace(/{#[\s\S]*?#}/g, "");
  for (const [re, why] of WORDS) {
    for (const m of plain.matchAll(re)) {
      const at = plain.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, " ");
      warnings.push(`${file}: ${why}\n      …${at}…`);
    }
  }
}

// ---------- report ----------

for (const w of warnings) console.log("warn  " + w);
for (const e of errors) console.log("ERROR " + e);
console.log(`\n${enPages.length} English pages checked: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
