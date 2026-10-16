// The page of one newsletter issue, as HTML. The website build uses it for every issue page
// (partials/nl-issue.njk, through the nlPage filter), and the browser uses the very same file
// for the preview The Current opens (/newsletter/preview/, served as /assets/js/nl-page.js).
// So no Node and no imports here: it runs in both places.
//
// The office writes each issue the way its Google Doc always was: sections with a heading
// (often an emoji first), paragraphs, a line in bold for a small heading, bullet lists. This
// file reads that shape and gives each section the look that suits it:
//   - a list of dates ("🎃 Friday, October 30: Halloween…") becomes calendar leaves, each with
//     "Add to calendar";
//   - a section that is only a short list ("🎒 Family Reminders") becomes a checklist;
//   - "🐣 Nursery | Learning Through Play" with small headings becomes a class card, its small
//     headings a set of cards;
//   - anything else is a story: the emoji in a round badge, the text, the photos.

// ---------- text ----------
const ALLOWED = { p: "p", div: "p", b: "b", strong: "b", i: "i", em: "i", ul: "ul", ol: "ul", li: "li", br: "br", a: "a" };
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
export const escHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const decode = (s) => String(s ?? "").replace(/&(#\d+|#x[0-9a-f]+|[a-z0-9]+);/gi, (m, e) => {
  if (ENT[e.toLowerCase()] !== undefined) return ENT[e.toLowerCase()];
  if (/^#x/i.test(e)) return String.fromCodePoint(parseInt(e.slice(2), 16));
  if (/^#\d/.test(e)) return String.fromCodePoint(Number(e.slice(1)));
  return m;
});
const linkOk = (u) => { const s = decode(u).trim(); return /^(https?:\/\/|mailto:|tel:)/i.test(s) ? s : ""; };
const escText = (t) => t.replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&nbsp;| /g, " ");

/**
 * The text HTML of a payload, cleaned: only paragraphs, bold, italics, bullet lists, line
 * breaks and web/mail/phone links come through, whatever was saved. The same cleaner as
 * cleanHtml in the admin repo's src/lib/newsletter/text.js.
 */
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

const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
/** The text for this language, falling back to English. */
export function pick(obj, lang) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  const vi = obj.vi ?? "";
  if (lang === "vi" && strip(vi)) return vi;
  return obj.en ?? "";
}
/** True when a Vietnamese page has to show the English, because the Vietnamese is not written. */
export function isEnglishOnly(obj, lang) {
  if (lang !== "vi" || obj == null || typeof obj !== "object") return false;
  return !strip(obj.vi) && !!strip(obj.en);
}

// ---------- dates ----------
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const utc = (iso) => new Date(String(iso).slice(0, 10) + "T00:00:00Z");
export const addDays = (iso, n) => new Date(utc(iso).getTime() + n * 864e5).toISOString().slice(0, 10);

/** The little calendar leaf beside a date: { month, day, more }. "Oct" / "9–14". */
export function dateLeaf(iso, end, lang) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const a = utc(iso);
  const b = end && end !== iso ? utc(end) : null;
  const month = (d) => (lang === "vi" ? `Tháng ${d.getUTCMonth() + 1}` : MON[d.getUTCMonth()]);
  if (!b) return { month: month(a), day: String(a.getUTCDate()), more: false };
  if (a.getUTCMonth() === b.getUTCMonth()) return { month: month(a), day: `${a.getUTCDate()}–${b.getUTCDate()}`, more: false };
  return { month: month(a), day: String(a.getUTCDate()), more: true };
}

/** "Add to calendar" in Google Calendar, for a whole day (or days). */
export function calendarLink(iso, end, title) {
  const ymd = (d) => d.replace(/-/g, "");
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${ymd(iso)}/${ymd(addDays(end || iso, 1))}`, ctz: "Asia/Ho_Chi_Minh", location: "Palm River Academy, Hội An" });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
/**
 * The day a label such as "Friday, October 30", "Oct 30–31", "30 October" or "30/10" means,
 * in the year that puts it near the issue: { iso, end } or null.
 */
export function readDay(label, issueDate) {
  const s = decode(String(label || "")).replace(/ /g, " ").trim();
  let mo = 0, d1 = 0, d2 = 0, m;
  if ((m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\b/i))) { mo = MONTHS[m[1].toLowerCase()]; d1 = +m[2]; d2 = +(m[3] || 0); }
  else if ((m = s.match(/\b(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i))) { d1 = +m[1]; d2 = +(m[2] || 0); mo = MONTHS[m[3].toLowerCase()]; }
  else if ((m = s.match(/\b(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\/(\d{1,2})\b/))) { d1 = +m[1]; d2 = +(m[2] || 0); mo = +m[3]; }
  else if ((m = s.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})/i))) { d1 = +m[1]; mo = +m[2]; }
  if (!mo || mo > 12 || !d1 || d1 > 31) return null;
  const base = /^\d{4}-\d{2}-\d{2}$/.test(issueDate || "") ? issueDate : new Date().toISOString().slice(0, 10);
  let y = +base.slice(0, 4);
  const iso = (yy, dd) => `${yy}-${String(mo).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  // A date well before the issue is next year's (a December issue that lists January).
  if (iso(y, d1) < addDays(base, -90)) y += 1;
  return { iso: iso(y, d1), end: d2 > d1 ? iso(y, d2) : null };
}

// ---------- the shape of a section's text ----------
const EMOJI = /^((?:[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}]️?(?:‍[\p{Extended_Pictographic}]️?)*)+)\s*/u;
/** A heading split into its leading emoji, its title, and what follows " | ": { emoji, title, sub }. */
export function splitHeading(text) {
  let t = String(text || "").trim();
  const m = t.match(EMOJI);
  const emoji = m ? m[1] : "";
  if (m) t = t.slice(m[0].length);
  const [title, ...rest] = t.split(/\s+\|\s+/);
  return { emoji, title: title.trim(), sub: rest.join(" | ").trim() };
}

/** Cleaned HTML as top-level blocks: { kind: 'sub' | 'p' | 'ul', html, items }. */
function blocks(html) {
  const out = [];
  for (const m of String(html || "").matchAll(/<(p|ul)>([\s\S]*?)<\/\1>/g)) {
    if (m[1] === "ul") out.push({ kind: "ul", items: [...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]) });
    else if (/^<b>((?:(?!<\/?(?:p|b)>).)*)<\/b>$/.test(m[2].trim())) out.push({ kind: "sub", html: m[2].trim().slice(3, -4) });
    else out.push({ kind: "p", html: m[2] });
  }
  return out;
}
/** A list item as "<emoji> <b>Label:</b> the rest": { emoji, label, rest } (label '' when there is none). */
function splitItem(html) {
  let s = String(html || "").trim();
  const e = decode(s.replace(/<[^>]+>/g, "")).match(EMOJI);
  let emoji = "";
  if (e && s.startsWith(e[1])) { emoji = e[1]; s = s.slice(e[1].length).trim(); }
  const m = s.match(/^<b>([\s\S]*?)<\/b>\s*:?\s*([\s\S]*)$/);
  if (!m) return { emoji, label: "", rest: s };
  return { emoji, label: m[1].replace(/\s*:\s*$/, "").trim(), rest: m[2].replace(/^[:–—-]\s*/, "").trim() };
}

/**
 * What a section is, from its English (so the English and Vietnamese pages match):
 * 'dates', 'checklist', 'class' or 'story'.
 */
export function sectionKind(part, issueDate) {
  const en = blocks(cleanHtml(part.body?.en));
  const lists = en.filter((b) => b.kind === "ul");
  const items = lists.flatMap((b) => b.items);
  const days = items.filter((it) => readDay(splitItem(it).label, issueDate)).length;
  if (items.length >= 2 && days >= Math.ceil(items.length * 0.6)) return "dates";
  const subs = en.filter((b) => b.kind === "sub").length;
  const head = splitHeading(part.heading?.en);
  if (head.sub && subs >= 2) return "class";
  const words = en.filter((b) => b.kind === "p").reduce((n, b) => n + strip(b.html).length, 0);
  if (lists.length === 1 && !subs && items.length <= 8 && words <= 220) return "checklist";
  return "story";
}

// ---------- icons the page uses (the browser preview gets these as a map) ----------
export const PAGE_ICONS = [
  "chevron-right", "download", "languages", "bell", "calendar-days", "clock", "calendar-plus", "pin", "check", "users", "arrow-right",
  "message-circle", "quote", "pen-line", "newspaper", "share-2", "link", "book-open", "images", "circle",
  // what The Current offers for a section or a photo set (admin repo constants.js STORY_ICONS)
  "pencil", "flask-conical", "microscope", "calculator", "globe", "palette", "paintbrush", "music", "drama", "mic",
  "cooking-pot", "apple", "sprout", "leaf", "flower-2", "tree-palm", "sun", "cloud-rain", "waves", "bus", "map-pin", "ticket",
  "trophy", "medal", "star", "party-popper", "gift", "cake-slice", "ghost", "moon", "lamp", "heart", "hand-heart",
  "credit-card", "clipboard-list", "megaphone", "camera", "dumbbell", "bike", "puzzle", "lightbulb", "rocket", "smile",
];

// ---------- the page ----------
/**
 * The issue's page: { hero, body } HTML.
 * @param {object} issue  a public payload, version 1 (admin repo src/lib/newsletter/README.md)
 * @param {object} ctx
 * @param {'en'|'vi'} ctx.lang
 * @param {object} ctx.T  the site's words in that language (strings.json [lang]); ctx.T.nl the newsletter's
 * @param {string} ctx.siteName
 * @param {(name:string, cls?:string) => string} ctx.icon  an icon as inline SVG
 * @param {boolean} [ctx.preview]  for The Current's preview: no links to other pages of the site
 */
export function renderIssue(issue, ctx) {
  const { lang, T } = ctx;
  const W = T.nl;
  const ico = (n, c) => ctx.icon(n, c);
  const fill = (s, vars = {}) => String(s ?? "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  const href = (p) => (lang === "vi" ? `/vi${p}` : p);
  const url = (u) => (/^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(String(u || "").trim()) ? String(u).trim() : "#");
  const attr = (s) => escHtml(s);
  const ed = issue.edition === "ey" ? "ey" : "post";
  const other = lang === "en" ? "vi" : "en";

  // One field: its words, with a small "English" tag when the Vietnamese is not written yet.
  const text = (obj) => {
    const s = escHtml(pick(obj, lang));
    return isEnglishOnly(obj, lang) ? `<span lang="en">${s}</span> <span class="nl-entag">${escHtml(W.english)}</span>` : s;
  };
  const enTag = (obj) => (isEnglishOnly(obj, lang) ? `<p class="nl-entag-row"><span class="nl-entag">${escHtml(W.english)}</span></p>` : "");
  const langAttr = (obj) => (isEnglishOnly(obj, lang) ? ' lang="en"' : "");
  // A paragraph all in bold is a small heading.
  const subheads = (html) => html.replace(/<p><b>((?:(?!<\/?(?:p|b)>).)*)<\/b><\/p>/g, '<h3 class="nl-sub">$1</h3>');
  const body = (obj) => `<div class="nl-text"${langAttr(obj)}>${enTag(obj)}${subheads(cleanHtml(pick(obj, lang)))}</div>`;

  const srcset = (p) => (p?.small && p.small !== p.src ? `${attr(p.small)} 800w, ${attr(p.src)} 1600w` : "");
  const focus = (f) => (/^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(String(f || "")) ? f : "");
  const img = (p, sizes, eager = false) => {
    const ss = srcset(p);
    return `<img src="${attr(url(p.src))}"${ss ? ` srcset="${ss}" sizes="${sizes}"` : ""}${p.w && p.h ? ` width="${p.w}" height="${p.h}"` : ""} alt="${attr(pick(p.alt, lang))}"${focus(p.focus) ? ` style="object-position: ${focus(p.focus)}"` : ""}${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
  };
  const fig = (p, sizes, own = false) => `<figure class="nl-fig"><div class="photo"${own && p.w && p.h ? ` style="aspect-ratio: ${p.w} / ${p.h}"` : ""}>${img(p, sizes)}</div>${pick(p.alt, lang) ? `<figcaption>${escHtml(pick(p.alt, lang))}</figcaption>` : ""}</figure>`;
  const photoRow = (photos) => {
    const n = photos.length;
    if (!n) return "";
    if (n === 1) return `<div class="nl-gallery nl-row nl-row--1">${fig(photos[0], "(min-width: 1040px) 560px, 92vw", true)}</div>`;
    return `<div class="nl-gallery nl-row nl-row--${n}">${photos.map((p) => fig(p, "(min-width: 1040px) 260px, (min-width: 720px) 30vw, 46vw")).join("")}</div>`;
  };
  const badge = (emoji, icon) => (emoji ? `<span class="nl-badge nl-badge--emoji" aria-hidden="true">${escHtml(emoji)}</span>` : `<span class="nl-badge">${ico(icon || "book-open")}</span>`);

  // ----- the parts of a section, in this page's language -----
  const headOf = (part) => {
    const h = splitHeading(pick(part.heading, lang));
    const en = splitHeading(part.heading?.en);
    return { ...h, emoji: h.emoji || en.emoji };
  };
  const titleHtml = (part, h) => (isEnglishOnly(part.heading, lang) ? `<span lang="en">${escHtml(h.title)}</span> <span class="nl-entag">${escHtml(W.english)}</span>` : escHtml(h.title));
  // Lists whose lines start with a word in bold ("Phonics: …") show that word as a label.
  const listHtml = (items) => {
    const parts = items.map(splitItem);
    if (parts.length && parts.every((x) => x.label)) {
      return `<ul class="nl-labels">${parts.map((x) => `<li>${x.emoji ? `<span class="nl-labels__e" aria-hidden="true">${x.emoji}</span>` : ""}<b class="nl-label">${x.label}</b><span>${x.rest}</span></li>`).join("")}</ul>`;
    }
    return `<ul>${items.map((it) => `<li>${it}</li>`).join("")}</ul>`;
  };
  const blocksHtml = (bs) => bs.map((b) => (b.kind === "ul" ? listHtml(b.items) : b.kind === "sub" ? `<h3 class="nl-sub">${b.html}</h3>` : `<p>${b.html}</p>`)).join("");
  // The small headings of a section as cards: { intro, cards }.
  const cardsOf = (bs) => {
    const intro = [];
    const cards = [];
    for (const b of bs) {
      if (b.kind === "sub") { cards.push({ head: b.html, bs: [] }); continue; }
      if (cards.length) cards[cards.length - 1].bs.push(b); else intro.push(b);
    }
    return { intro, cards };
  };
  const cardHtml = (c) => {
    const e = decode(c.head).match(EMOJI);
    const head = e && c.head.startsWith(e[1]) ? c.head.slice(e[1].length).trim() : c.head;
    const wide = c.bs.some((b) => b.kind === "ul") || c.bs.reduce((n, b) => n + strip(b.html || b.items?.join(" ")).length, 0) > 420;
    return `<article class="nl-card2${wide ? " nl-card2--wide" : ""}${c.bs.some((b) => b.kind === "ul") ? " nl-card2--list" : ""}"><h3>${e && c.head.startsWith(e[1]) ? `<span class="nl-card2__e" aria-hidden="true">${e[1]}</span>` : ""}<span>${head}</span></h3><div class="nl-text">${blocksHtml(c.bs)}</div></article>`;
  };

  const sectionHtml = (part, kind) => {
    const h = headOf(part);
    const bs = blocks(cleanHtml(pick(part.body, lang)));
    const enOnly = isEnglishOnly(part.body, lang);
    const n = part.photos?.length || 0;
    const when = part.when && pick(part.when, lang) ? `<p class="nl-when">${ico("clock")}${text(part.when)}</p>` : "";
    const button = part.button?.url ? `<p class="nl-btnrow"><a class="btn btn--small nl-btn" href="${attr(url(part.button.url))}" target="_blank" rel="noopener">${text(part.button.label)}${ico("arrow-right")}</a></p>` : "";
    const sub = h.sub ? `<p class="nl-kicker">${escHtml(h.sub)}</p>` : "";

    if (kind === "dates") {
      // The dates come from the English lines, so both pages show the same leaves.
      const enItems = blocks(cleanHtml(part.body?.en)).filter((b) => b.kind === "ul").flatMap((b) => b.items);
      let k = 0;
      const rows = bs.map((b) => {
        if (b.kind !== "ul") return b.kind === "sub" ? `<h3 class="nl-sub">${b.html}</h3>` : `<p class="nl-dates__note">${b.html}</p>`;
        return `<ul>${b.items.map((it) => {
          const x = splitItem(it);
          const day = readDay(splitItem(enItems[k] || "").label, issue.date) || readDay(x.label, issue.date);
          k += 1;
          if (!day) return `<li class="nl-date nl-date--plain"><span class="nl-leaf nl-leaf--none" aria-hidden="true">${x.emoji || ico("calendar-days")}</span><div class="nl-date__body"><p class="nl-date__what">${x.label ? `<b>${x.label}</b> ` : ""}${x.rest}</p></div></li>`;
          const leaf = dateLeaf(day.iso, day.end, lang);
          const off = /no classes|closed|nghỉ học|nghỉ/i.test(strip(enItems[k - 1] || it));
          const title = strip(splitItem(enItems[k - 1] || it).rest).replace(/\s+[—–-]\s+.*$/, "");
          return `<li class="nl-date${off ? " nl-date--off" : ""}">`
            + `<span class="nl-leafwrap" aria-hidden="true"><span class="nl-leaf"><span class="nl-leaf__m">${escHtml(leaf.month)}</span><span class="nl-leaf__d${leaf.day.includes("–") ? " nl-leaf__d--range" : ""}">${escHtml(leaf.day)}${leaf.more ? "<i>+</i>" : ""}</span></span>${x.emoji ? `<span class="nl-leaf__e">${x.emoji}</span>` : ""}</span>`
            + `<div class="nl-date__body"><p class="nl-date__what">${x.rest || x.label}${off ? ` <span class="nl-tag nl-tag--off">${escHtml(W.off)}</span>` : ""}</p>`
            + `<p class="nl-date__when"><span class="nl-pill">${x.label}</span></p>`
            + (ctx.preview || !title ? "" : `<a class="nl-gcal" href="${attr(calendarLink(day.iso, day.end, `${title} (Palm River Academy)`))}" target="_blank" rel="noopener">${ico("calendar-plus")}${escHtml(W.addToCalendar)}</a>`)
            + `</div></li>`;
        }).join("")}</ul>`;
      }).join("");
      return `<section class="nl-part nl-need nl-datesec nl-t--${part.tone}" id="s-${part.id}">`
        + `<h2 class="nl-need__h">${h.emoji ? `<span class="nl-need__e" aria-hidden="true">${escHtml(h.emoji)}</span>` : ico("calendar-days")}<span>${titleHtml(part, h)}</span></h2>`
        + `<div class="nl-dates"${enOnly ? ' lang="en"' : ""}>${enOnly ? `<p class="nl-entag-row"><span class="nl-entag">${escHtml(W.english)}</span></p>` : ""}${rows}</div>${photoRow(part.photos || [])}</section>`;
    }

    if (kind === "checklist") {
      const list = bs.find((b) => b.kind === "ul");
      const notes = bs.filter((b) => b !== list);
      return `<section class="nl-part nl-need nl-checksec nl-t--${part.tone}" id="s-${part.id}">`
        + `<div class="nl-rem"${enOnly ? ' lang="en"' : ""}><h2 class="nl-rem__h">${h.emoji ? `<span class="nl-need__e" aria-hidden="true">${escHtml(h.emoji)}</span>` : ico("pin")}<span>${titleHtml(part, h)}</span></h2>`
        + `${enOnly ? `<p class="nl-entag-row"><span class="nl-entag">${escHtml(W.english)}</span></p>` : ""}`
        + `${notes.length ? `<div class="nl-text nl-rem__note">${blocksHtml(notes)}</div>` : ""}`
        + `<ul>${(list?.items || []).map((it) => { const x = splitItem(it); return `<li>${ico("check")}<span>${x.emoji ? `${x.emoji} ` : ""}${x.label ? `<b>${x.label}:</b> ` : ""}${x.rest}</span></li>`; }).join("")}</ul></div>`
        + `${photoRow(part.photos || [])}</section>`;
    }

    const { intro, cards } = cardsOf(bs);
    const asCards = cards.length >= 2;
    const inner = asCards
      ? `${intro.length ? `<div class="nl-text"${enOnly ? ' lang="en"' : ""}>${blocksHtml(intro)}</div>` : ""}<div class="nl-cards2">${cards.map(cardHtml).join("")}</div>`
      : `<div class="nl-text"${enOnly ? ' lang="en"' : ""}>${blocksHtml(bs)}</div>`;
    const tag = enOnly ? `<p class="nl-entag-row"><span class="nl-entag">${escHtml(W.english)}</span></p>` : "";

    if (kind === "class") {
      return `<section class="nl-part nl-class nl-t--${part.tone}" id="s-${part.id}">`
        + `<header class="nl-class__band"><span class="nl-class__face nl-class__face--emoji" aria-hidden="true">${h.emoji ? escHtml(h.emoji) : ico("users")}</span>`
        + `<div><h2>${titleHtml(part, h)}</h2>${h.sub ? `<p class="nl-class__theme">${escHtml(h.sub)}</p>` : ""}</div></header>`
        + `<div class="nl-class__inner">${when}${tag}${inner}${photoRow(part.photos || [])}${button}</div></section>`;
    }

    // A story: one photo sits beside the text; more go in a row under it.
    const side = n === 1 && !asCards;
    return `<section class="nl-part nl-story nl-t--${part.tone}" id="s-${part.id}">`
      + `<header class="nl-head">${badge(h.emoji, part.icon)}<div><h2>${titleHtml(part, h)}</h2>${sub}</div></header>${when}${tag}`
      + `<div class="nl-story__cols${side ? " nl-story__cols--side" : ""}"><div>${inner}${button}</div>${side ? `<div class="nl-gallery nl-side">${fig(part.photos[0], "(min-width: 1040px) 330px, (min-width: 720px) 40vw, 92vw", true)}</div>` : ""}</div>`
      + `${!side ? photoRow(part.photos || []) : ""}</section>`;
  };

  // ----- the hero: nameplate, cover, opening -----
  const decoHead = ed === "ey"
    ? `<svg class="nlhead__sun" viewBox="0 0 200 200" aria-hidden="true"><g class="nlhead__rays">${Array.from({ length: 12 }, (_, i) => `<rect x="95" y="4" width="10" height="38" rx="5" transform="rotate(${i * 30} 100 100)"/>`).join("")}</g><circle cx="100" cy="100" r="44"/></svg>`
    : `<svg class="frond frond--tr frond--soft" viewBox="0 0 640 640" aria-hidden="true"><use href="#frond-hang"/></svg>`;
  const river = `<div class="river" aria-hidden="true"><svg class="river__back" viewBox="0 0 2880 80" preserveAspectRatio="none"><path d="M0 36 C240 0 480 72 720 36 S1200 72 1440 36 S1920 72 2160 36 S2640 72 2880 36 V80 H0 Z" fill="currentColor"/></svg><svg class="river__front" viewBox="0 0 2880 80" preserveAspectRatio="none"><path d="M0 50 C240 26 480 74 720 50 S1200 74 1440 50 S1920 74 2160 50 S2640 74 2880 50 V80 H0 Z" fill="currentColor"/></svg></div>`;
  const pdfButtons = () => `${issue.pdf?.en ? `<a class="btn btn--small nl-btn" href="${attr(url(issue.pdf.en))}" target="_blank" rel="noopener">${ico("download")}${escHtml(W.pdfEn)}</a>` : ""}${issue.pdf?.vi ? `<a class="btn btn--small nl-btn nl-btn--line" href="${attr(url(issue.pdf.vi))}" target="_blank" rel="noopener">${ico("download")}${escHtml(W.pdfVi)}</a>` : ""}`;
  const otherLink = `<a class="nl-otherlang" href="${attr(other === "vi" ? `/vi/newsletter/${issue.slug}/` : `/newsletter/${issue.slug}/`)}" lang="${other}" hreflang="${other}" data-lang="${other}">${ico("languages")}${escHtml(T.lang?.switchTo || (other === "vi" ? "Tiếng Việt" : "English"))}</a>`;
  const hasOpening = !!(pick(issue.opening?.lead, lang) || strip(pick(issue.opening?.body, lang)));
  const cover = issue.cover?.src ? `<figure class="nl-cover rise" style="--d:1"><div class="leaf-wrap"><div class="photo photo--lg nl-cover__photo${issue.cover.h > issue.cover.w ? " photo--tall" : ""}">${img(issue.cover, "(min-width: 1240px) 540px, (min-width: 900px) 44vw, (min-width: 620px) 560px, 92vw", true)}</div></div>${pick(issue.cover.alt, lang) ? `<figcaption>${escHtml(pick(issue.cover.alt, lang))}</figcaption>` : ""}</figure>` : "";
  // The Early Years pages start green, like the newsletter itself (The Current hands out blue first).
  const EY_TONES = { blue: "green", green: "sun", sun: "coral", coral: "teal" };
  const parts = (issue.parts || []).filter((p) => p && p.type).map((p) => (ed === "ey" && p.tone && EY_TONES[p.tone] ? { ...p, tone: EY_TONES[p.tone] } : p));
  const kinds = new Map(parts.filter((p) => p.type === "story").map((p) => [p.id, sectionKind(p, issue.date)]));

  // "In this issue": a chip per section, with its emoji.
  const tocItems = [];
  const dates = issue.need?.dates || [];
  const reminders = (issue.need?.reminders || []).filter((r) => pick(r, "en").trim());
  const hasNeed = dates.length || reminders.length;
  if (hasNeed) tocItems.push(`<li><a href="#s-need">${ico("bell")}<span>${escHtml(W.needToKnow)}</span></a></li>`);
  for (const p of parts) {
    if (p.type === "story" || p.type === "photos") {
      const h = headOf(p);
      tocItems.push(`<li class="nl-t--${p.tone}"><a href="#s-${p.id}">${h.emoji ? `<span class="nl-toc__e" aria-hidden="true">${escHtml(h.emoji)}</span>` : ico(p.icon || "book-open")}<span>${escHtml(h.title)}</span></a></li>`);
    } else if (p.type === "class") tocItems.push(`<li class="nl-t--${p.tone}"><a href="#s-${p.id}"><span class="nl-toc__dot" aria-hidden="true"></span><span>${escHtml(p.class)}</span></a></li>`);
    else if (p.type === "quote") tocItems.push(`<li class="nl-t--green"><a href="#s-${p.id}">${ico("quote")}<span>${text(p.who)}</span></a></li>`);
    else if (p.type === "press") tocItems.push(`<li class="nl-t--violet"><a href="#s-${p.id}">${ico("pen-line")}<span>${escHtml(W.pressFrom)}</span></a></li>`);
  }

  const hero = `<section class="nlhead nlhead--${ed}"><span class="nlhead__dots" aria-hidden="true"></span>${decoHead}<div class="wrap">`
    + (ctx.preview ? "" : `<nav class="nl-crumbs" aria-label="${attr(T.newsletter)}"><a href="${href("/newsletter/")}">${escHtml(T.newsletter)}</a>${ico("chevron-right")}<span>${escHtml(W.editions[ed])}</span></nav>`)
    + `<header class="nameplate rise" style="--d:0"><p class="nameplate__kicker"><span class="nameplate__mark" aria-hidden="true"></span>${escHtml(ctx.siteName || "Palm River Academy")} · Hội An<span class="nameplate__mark nameplate__mark--r" aria-hidden="true"></span></p>`
    + `<h1 class="nameplate__title">${escHtml(pick(issue.edition_name, lang))}</h1>`
    + `<p class="nameplate__line"><span>${escHtml(pick(issue.label, lang))}</span><span><time datetime="${attr(issue.date)}">${escHtml(pick(issue.day, lang))}</time></span>${issue.reading_minutes ? `<span>${escHtml(fill(W.minRead, { n: issue.reading_minutes }))}</span>` : ""}</p></header>`
    + `<div class="nlhead__grid${cover ? "" : " nlhead__grid--solo"}">${cover}`
    + `<div class="nl-opening rise" style="--d:2">${hasOpening ? `<p class="nl-lead">${text(issue.opening?.lead)}</p>${body(issue.opening?.body)}` : ""}`
    + `${!hasOpening && tocItems.length && !cover ? `<ul class="nl-heroc">${tocItems.join("")}</ul>` : ""}`
    + `<div class="nl-actions">${pdfButtons()}${otherLink}</div></div></div></div>${river}</section>`;

  // ----- the issue -----
  let main = "";
  if (hasNeed) {
    main += `<section class="nl-part nl-need" id="s-need" aria-labelledby="nl-need-h"><h2 class="nl-need__h" id="nl-need-h">${ico("bell")}${escHtml(W.needToKnow)}</h2><div class="nl-need__grid${dates.length && reminders.length ? "" : " nl-need__grid--one"}">`;
    if (dates.length) {
      main += `<div class="nl-dates"><h3>${ico("calendar-days")}${escHtml(W.dates)}</h3><ul>${dates.map((d) => {
        const leaf = dateLeaf(d.iso, d.end, lang);
        return `<li class="nl-date${d.tag ? ` nl-date--${d.tag}` : ""}">${leaf ? `<span class="nl-leaf" aria-hidden="true"><span class="nl-leaf__m">${escHtml(leaf.month)}</span><span class="nl-leaf__d${leaf.day.includes("–") ? " nl-leaf__d--range" : ""}">${escHtml(leaf.day)}${leaf.more ? "<i>+</i>" : ""}</span></span>` : `<span class="nl-leaf nl-leaf--none" aria-hidden="true">${ico("calendar-days")}</span>`}`
          + `<div class="nl-date__body"><p class="nl-date__what">${text(d.what)}${d.tag && W[d.tag] ? ` <span class="nl-tag nl-tag--${d.tag}">${escHtml(W[d.tag])}</span>` : ""}</p>`
          + `<p class="nl-date__when"><span class="nl-pill">${escHtml(pick(d.date, lang))}</span>${d.time && pick(d.time, lang) ? `<span class="nl-date__time">${ico("clock")}${escHtml(pick(d.time, lang))}</span>` : ""}</p>`
          + `${d.gcal && !ctx.preview ? `<a class="nl-gcal" href="${attr(url(d.gcal))}" target="_blank" rel="noopener">${ico("calendar-plus")}${escHtml(W.addToCalendar)}</a>` : ""}</div></li>`;
      }).join("")}</ul></div>`;
    }
    if (reminders.length) main += `<div class="nl-rem"><h3>${ico("pin")}${escHtml(W.reminders)}</h3><ul>${reminders.map((r) => `<li>${ico("check")}<span>${text(r)}</span></li>`).join("")}</ul></div>`;
    main += "</div></section>";
  }

  for (const p of parts) {
    if (p.type === "story") main += sectionHtml(p, kinds.get(p.id));
    else if (p.type === "photos" && p.photos?.length) {
      const h = headOf(p);
      const n = p.photos.length;
      main += `<section class="nl-part nl-photoset nl-t--${p.tone}" id="s-${p.id}"><header class="nl-head">${badge(h.emoji, p.icon || "images")}<div><h2>${titleHtml(p, h)}</h2></div></header>`
        + `<div class="collage collage--wide nl-prints nl-prints--${n < 4 ? n : "many"}">${p.photos.map((ph) => `<div class="photo">${img(ph, "(min-width: 1040px) 250px, (min-width: 720px) 30vw, 44vw")}</div>`).join("")}</div></section>`;
    } else if (p.type === "class") {
      const n = p.photos?.length || 0;
      main += `<section class="nl-part nl-class nl-t--${p.tone}" id="s-${p.id}"><header class="nl-class__band">`
        + (p.teacher?.photo ? `<span class="nl-class__face"><img src="${attr(url(p.teacher.photo))}" alt="" width="120" height="138" loading="lazy" decoding="async"></span>` : `<span class="nl-class__face nl-class__face--none">${ico("users")}</span>`)
        + `<div><h2>${escHtml(p.class)}</h2>${p.teacher?.name ? `<p class="nl-class__from">${escHtml(fill(W.fromTeacher, { name: p.teacher.name }))}</p>` : ""}</div></header>`
        + `<div class="nl-class__inner"><div class="nl-story__cols${n === 1 ? " nl-story__cols--side" : ""}">${body(p.body)}${n === 1 ? `<div class="nl-gallery nl-side">${fig(p.photos[0], "(min-width: 1040px) 300px, (min-width: 720px) 38vw, 92vw", true)}</div>` : ""}</div>`
        + (n > 1 ? photoRow(p.photos) : "")
        + (p.words?.length ? `<div class="nl-words"><h3>${ico("languages")}${escHtml(W.wordsOfWeek)}</h3><ul>${p.words.map((w) => `<li><b lang="en">${escHtml(w.en)}</b>${w.vi ? `<span lang="vi">${escHtml(w.vi)}</span>` : ""}</li>`).join("")}</ul></div>` : "")
        + (p.ask && pick(p.ask, lang) ? `<div class="nl-ask"><p class="nl-ask__label">${ico("message-circle")}${escHtml(W.askYourChild)}</p><p class="nl-ask__q">${text(p.ask)}</p></div>` : "")
        + "</div></section>";
    } else if (p.type === "quote") {
      main += `<section class="nl-part nl-quote${p.photo ? " nl-quote--photo" : ""}" id="s-${p.id}"><figure>${p.photo ? `<div class="nl-gallery nl-quote__pic"><div class="photo">${img(p.photo, "160px")}</div></div>` : ""}<div><span class="nl-quote__mark" aria-hidden="true">“</span><blockquote><p>${text(p.text)}</p></blockquote><figcaption>${text(p.who)}</figcaption></div></figure></section>`;
    } else if (p.type === "press") {
      main += `<section class="nl-part" id="s-${p.id}"><a class="nl-press" href="${attr(url(p.url))}" target="_blank" rel="noopener"><span class="nl-press__ico">${ico("pen-line")}</span><span class="nl-press__body"><span class="nl-press__kicker">${escHtml(W.pressFrom)}</span><h2 class="nl-press__title" lang="en">${escHtml(p.title)}</h2>${p.author ? `<span class="nl-press__by">${escHtml(fill(W.by, { name: p.author }))}</span>` : ""}${pick(p.blurb, lang) ? `<span class="nl-press__blurb">${text(p.blurb)}</span>` : ""}<span class="nl-press__go">${escHtml(W.readPost)}${ico("arrow-right")}</span></span></a></section>`;
    } else if (p.type === "closing") {
      main += `<section class="nl-part nl-closing" id="s-${p.id}">${body(p.body)}<p class="nl-sign">${escHtml(W.signoff)}<br><strong>${escHtml(W.from)}</strong></p></section>`;
    }
  }
  if (!parts.some((p) => p.type === "closing")) main += `<section class="nl-part nl-closing"><p class="nl-sign">${escHtml(W.signoff)}<br><strong>${escHtml(W.from)}</strong></p></section>`;
  main += `<div class="nl-end">${pdfButtons()}<button type="button" class="btn btn--small nl-btn nl-btn--line nl-share" data-copied="${attr(W.copied || "Link copied")}">${ico("share-2")}<span>${escHtml(W.share || "Share this issue")}</span></button>`
    + (ctx.preview ? "" : `<a class="nl-end__all" href="${href("/newsletter/")}">${ico("newspaper")}${escHtml(W.allIssues)}</a>`) + "</div>";

  const body2 = `<section class="nlbody nlbody--${ed}"><div class="nl-progress" aria-hidden="true"><span></span></div><div class="wrap nlbody__grid">`
    + `<nav class="nl-toc" aria-labelledby="nl-toc-h"><p class="nl-toc__h" id="nl-toc-h">${escHtml(W.inIssue)}</p><ul>${tocItems.join("")}</ul></nav>`
    + `<div class="nl-main">${main}</div></div></section>`;
  return { hero, body: body2 };
}

/**
 * In the browser: the reading bar at the top and the share button. Safe to call again after
 * the page is drawn anew (the preview does).
 */
export function enhance(root = document) {
  const bar = root.querySelector(".nl-progress span");
  const body = root.querySelector(".nlbody");
  if (bar && body && !window.__nlProgress) {
    window.__nlProgress = true;
    let ticking = false;
    const update = () => {
      ticking = false;
      const b = document.querySelector(".nlbody");
      const s = document.querySelector(".nl-progress span");
      if (!b || !s) return;
      const r = b.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight * 0.6);
      s.style.transform = `scaleX(${Math.min(1, Math.max(0, -r.top / total))})`;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
  root.querySelectorAll(".nl-share").forEach((b) => {
    if (b.dataset.on) return;
    b.dataset.on = "1";
    b.addEventListener("click", async () => {
      const link = location.href.split(/[?#]/)[0];
      const title = document.title;
      try {
        if (navigator.share) { await navigator.share({ title, url: link }); return; }
      } catch { return; }
      try {
        await navigator.clipboard.writeText(link);
        const span = b.querySelector("span");
        const was = span.textContent;
        span.textContent = b.dataset.copied;
        setTimeout(() => { span.textContent = was; }, 2200);
      } catch { /* the address bar still has it */ }
    });
  });
}
