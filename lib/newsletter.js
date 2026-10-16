// The weekly newsletters (The Palm River Post and the Early Years Weekly Newsletter).
//
// They are written in The Current (the staff app) and published there. At build time
// src/_data/newsletters.js reads the published issues from the database; each one is a
// "payload", version 1, described in the admin repo's src/lib/newsletter/README.md. That
// object is the only thing the two sides share. The website shows the `public` payload
// only, never the families one (which can carry first names of new students).
//
// Text in a payload is always { en, vi }. `vi` may be empty while the Vietnamese is not
// written yet: the Vietnamese page then shows the English, marked "English".
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
// The text helpers and the dates are shared with the issue page itself (nl-page.js, which also runs in the browser).
import { pick, cleanHtml, isEnglishOnly, addDays, dateLeaf } from "./nl-page.js";
export { pick, cleanHtml, isEnglishOnly, addDays, dateLeaf };

const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// Issue sort: newest first; on the same Friday the Post comes before Early Years.
export function byNewest(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return (a.edition === "post" ? 0 : 1) - (b.edition === "post" ? 0 : 1);
}

// Checks a payload is one this website can show. Returns why not, or "".
export function problem(p) {
  if (!p || typeof p !== "object") return "not an object";
  if (p.v !== 1) return `version ${p.v}, not 1`;
  if (p.audience && p.audience !== "public") return `audience ${p.audience}`;
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(p.slug || "")) return `slug "${p.slug}"`;
  if (!["post", "ey"].includes(p.edition)) return `edition "${p.edition}"`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || "")) return `date "${p.date}"`;
  return "";
}

// Families-only parts never reach the website, even if one slips into a public payload.
export const PUBLIC_PARTS = new Set(["story", "class", "photos", "quote", "press", "closing"]);

// ---------- icons ----------
// Lucide icons (the `lucide-static` package, a dev dependency), read at build time and
// written into the page as inline SVG. The Current names them (constants.js STORY_ICONS).
const require = createRequire(import.meta.url);
let ICONS = null;
function iconDir() {
  if (ICONS) return ICONS;
  try { ICONS = join(dirname(require.resolve("lucide-static/package.json")), "icons"); } catch { ICONS = ""; }
  return ICONS;
}
const iconCache = new Map();
export function icon(name, cls = "") {
  const key = `${name}|${cls}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const dir = iconDir();
  const safe = /^[a-z0-9-]+$/.test(name || "") ? name : "circle";
  let file = dir && join(dir, `${safe}.svg`);
  if (!file || !existsSync(file)) {
    if (name) console.warn(`[newsletter] no lucide icon "${name}", using a circle`);
    file = dir && join(dir, "circle.svg");
  }
  let inner = "";
  try {
    inner = readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>[\s\S]*$/, "");
  } catch {
    inner = '<circle cx="12" cy="12" r="9"/>';
  }
  inner = inner.replace(/\s*\n\s*/g, "").replace(/\s+\/>/g, "/>");
  const svg = `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
  iconCache.set(key, svg);
  return svg;
}

// ---------- dates ----------
// Today in Hội An.
export const todayHoiAn = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

// A link to pra.edu.vn written out in full (a Palm Press post in a press part) becomes a site
// path, and on a Vietnamese page the Vietnamese twin of that page.
export function sitePath(url) {
  const m = String(url || "").match(/^https?:\/\/(?:www\.)?pra\.edu\.vn(\/[^#?]*)?([?#].*)?$/i);
  return m ? (m[1] || "/") + (m[2] || "") : null;
}

// ---------- page data ----------
// The <head> of an issue page (src/newsletter/ and src/vi/newsletter/, through their
// newsletter.11tydata.js): its title, the share preview (Zalo, WhatsApp, Facebook) and the colour.
// The archive page in the same folder has no `issue` and keeps its own front matter.
export function pageData(lang) {
  const when = (fn) => (data) => (data.issue ? fn(data.issue, data) : undefined);
  return {
    eleventyComputed: {
      pageTitle: when((is, data) => `${pick(is.edition_name, lang)} · ${pick(is.label, lang)} · ${data.site?.name || "Palm River Academy"}`),
      ogTitle: when((is) => `${pick(is.edition_name, lang)} · ${pick(is.label, lang)}`),
      metaDescription: when((is) => strip(pick(is.preheader, lang)) || strip(pick(is.opening?.lead, lang))),
      ogType: when(() => "article"),
      ogImage: when((is) => is.cover?.src || undefined),
      ogImageW: when((is) => (is.cover?.src ? is.cover.w : undefined)),
      ogImageH: when((is) => (is.cover?.src ? is.cover.h : undefined)),
      ogImageAlt: when((is) => (is.cover?.src ? strip(pick(is.cover.alt, lang)) : undefined)),
      ogPublished: when((is) => is.published_at || undefined),
      tone: (data) => (data.issue?.edition === "ey" ? "green" : "blue"),
    },
  };
}
