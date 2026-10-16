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

const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// The text for this language, falling back to English.
export function pick(obj, lang) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  const vi = obj.vi ?? "";
  if (lang === "vi" && strip(vi)) return vi;
  return obj.en ?? "";
}
// The text HTML of a payload, cleaned again before it goes on the page: only paragraphs,
// bold, italics, bullet lists, line breaks and web/mail/phone links can come through.
// The same cleaner as cleanHtml in the admin repo's src/lib/newsletter/text.js.
const ALLOWED = { p: "p", div: "p", b: "b", strong: "b", i: "i", em: "i", ul: "ul", ol: "ul", li: "li", br: "br", a: "a" };
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
const escHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const decode = (s) => String(s ?? "").replace(/&(#\d+|#x[0-9a-f]+|[a-z0-9]+);/gi, (m, e) => {
  if (ENT[e.toLowerCase()] !== undefined) return ENT[e.toLowerCase()];
  if (/^#x/i.test(e)) return String.fromCodePoint(parseInt(e.slice(2), 16));
  if (/^#\d/.test(e)) return String.fromCodePoint(Number(e.slice(1)));
  return m;
});
const linkOk = (u) => { const s = decode(u).trim(); return /^(https?:\/\/|mailto:|tel:)/i.test(s) ? s : ""; };
const escText = (t) => t.replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&nbsp;|\u00a0/g, " ");
export function cleanHtml(html) {
  const src = String(html || "")
    .replace(/<!--[\s\S]*?(-->|$)/g, "")
    .replace(/<(script|style|head|title|xml|template|iframe|object|svg|math)\b[\s\S]*?(<\/\1\s*>|$)/gi, "");
  let out = "";
  const stack = [];
  const has = (t) => stack.includes(t);
  const inBlock = () => has("p") || has("li");
  const close = (t) => { if (!has(t)) return; while (stack.length) { const x = stack.pop(); if (x !== "a0") out += `</${x}>`; if (x === t) break; } };
  const openP = () => { if (has("ul")) { if (!has("li")) { stack.push("li"); out += "<li>"; } } else { stack.push("p"); out += "<p>"; } };
  const text = (t) => { if (!t) return; if (!inBlock()) { if (!t.trim()) return; openP(); } out += escText(t); };
  const re = /<(\/?)([a-z][a-z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  let last = 0, m;
  while ((m = re.exec(src))) {
    text(src.slice(last, m.index));
    last = re.lastIndex;
    const t = ALLOWED[m[2].toLowerCase()];
    if (!t) continue;
    if (t === "br") { if (inBlock()) out += "<br>"; continue; }
    if (m[1] === "/") {
      if (t === "a") { if (stack.lastIndexOf("a0") > stack.lastIndexOf("a")) stack.splice(stack.lastIndexOf("a0"), 1); else close("a"); }
      else if (t !== "p" || !has("li")) close(t);
      continue;
    }
    if (t === "p") { if (has("li")) { if (!out.endsWith("<li>")) out += "<br>"; } else { close("p"); if (!has("ul")) { stack.push("p"); out += "<p>"; } } continue; }
    if (t === "ul") { if (!has("ul")) { close("p"); stack.push("ul"); out += "<ul>"; } continue; }
    if (t === "li") { close("li"); if (!has("ul")) { close("p"); stack.push("ul"); out += "<ul>"; } stack.push("li"); out += "<li>"; continue; }
    if (!inBlock()) openP();
    if (t === "a") {
      const hm = m[3].match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i) || [];
      const href = linkOk(hm[1] ?? hm[2] ?? hm[3] ?? "");
      if (href && !has("a")) { stack.push("a"); out += `<a href="${escHtml(href)}">`; } else stack.push("a0");
    } else if (!has(t)) { stack.push(t); out += `<${t}>`; }
  }
  text(src.slice(last));
  while (stack.length) { const x = stack.pop(); if (x !== "a0") out += `</${x}>`; }
  let prev;
  do {
    prev = out;
    out = out.replace(/<(b|i)>\s*<\/\1>/g, "").replace(/<a href="[^"]*">\s*<\/a>/g, "")
      .replace(/<(p|li)>(\s|<br>)*<\/\1>/g, "").replace(/<ul>\s*<\/ul>/g, "")
      .replace(/(<(p|li)>)(\s|<br>)+/g, "$1").replace(/(\s|<br>)+(<\/(p|li)>)/g, "$2");
  } while (out !== prev);
  return out.trim();
}

// True when a Vietnamese page has to show the English, because the Vietnamese is not written.
export function isEnglishOnly(obj, lang) {
  if (lang !== "vi" || obj == null || typeof obj !== "object") return false;
  return !strip(obj.vi) && !!strip(obj.en);
}

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
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const utc = (iso) => new Date(String(iso).slice(0, 10) + "T00:00:00Z");
export const addDays = (iso, n) => new Date(utc(iso).getTime() + n * 864e5).toISOString().slice(0, 10);

// The little calendar leaf beside a date: month and day(s). "Oct" / "9–14"; "Dec" / "18" for a
// range that runs into the next month shows its first day and an arrow.
export function dateLeaf(iso, end, lang) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const a = utc(iso);
  const b = end && end !== iso ? utc(end) : null;
  const month = (d) => (lang === "vi" ? `Tháng ${d.getUTCMonth() + 1}` : MON[d.getUTCMonth()]);
  if (!b) return { month: month(a), day: String(a.getUTCDate()), more: false };
  if (a.getUTCMonth() === b.getUTCMonth()) return { month: month(a), day: `${a.getUTCDate()}–${b.getUTCDate()}`, more: false };
  return { month: month(a), day: String(a.getUTCDate()), more: true };
}

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
