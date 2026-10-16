import { readFileSync } from "node:fs";
import { loc, isVi, toLang, twinPath, basePath } from "./lib/i18n.js";
import { pick as nlPick, cleanHtml as nlClean, isEnglishOnly as nlIsEnglishOnly, icon as nlIcon, dateLeaf as nlDateLeaf, sitePath as nlSitePath, addDays as nlAddDays } from "./lib/newsletter.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // Languages. English lives at the root, Vietnamese under /vi/ with the same paths
  // (VIETNAMESE.md). `lang` is "en" from src/_data/lang.json and "vi" from src/vi/vi.11tydata.js.
  // {{ '/about/' | href(lang) }} -> the page in the current language, with the path prefix.
  const urlFilter = eleventyConfig.getFilter("url");
  eleventyConfig.addFilter("href", (path, lang) => urlFilter(toLang(path, lang)));
  // The same page in the other language, for the toggle and the hreflang links.
  eleventyConfig.addFilter("twin", (url) => twinPath(url));
  // The English path of any page ("/vi/learning/" -> "/learning/"), for working out which menu is current.
  eleventyConfig.addFilter("basePath", (url) => basePath(url));
  // Merge each object's `vi` block over its English fields (data files keep both side by side).
  eleventyConfig.addFilter("loc", (data, lang) => loc(data, lang));
  // 33500000 -> "33,500,000" in English, "33.500.000" in Vietnamese.
  eleventyConfig.addFilter("money", (n, lang) => Number(n).toLocaleString(lang === "vi" ? "vi-VN" : "en-US"));

  // A post's date: "10 October 2026" in English, "10/10/2026" in Vietnamese.
  eleventyConfig.addFilter("longDate", (d, lang) => {
    const date = new Date(d);
    if (lang === "vi") return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  });

  // Google reviews for a home page (src/_data/reviews.json): the page's own language first; the
  // Vietnamese home tops up with English ones. At most `max`.
  eleventyConfig.addFilter("reviewsFor", (items, lang, max = 9) => {
    const own = (items || []).filter((r) => r.lang === lang);
    const more = lang === "en" ? [] : (items || []).filter((r) => r.lang === "en");
    return [...own, ...more].slice(0, max);
  });

  // A review's `pull` line for the home carousel, with whether a sentence was cut before or after it
  // (the carousel shows … there). A line that starts or ends on a sentence boundary needs none.
  // Falls back to the first paragraph.
  eleventyConfig.addFilter("pullQuote", (r) => {
    const ends = /[.!?…]["”’)]?$/;
    for (const p of r.paras) {
      const i = r.pull ? p.indexOf(r.pull) : -1;
      if (i < 0) continue;
      const before = p.slice(0, i).trimEnd();
      const after = p.slice(i + r.pull.length).trim();
      return { text: r.pull, pre: before !== "" && !ends.test(before), post: after !== "" && !ends.test(r.pull) };
    }
    return { text: r.paras[0], pre: false, post: false };
  });
  // One paragraph of a review, HTML-escaped, with its `pull` line marked like a highlighter pen.
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  eleventyConfig.addFilter("markPull", (para, pull) => {
    const i = pull ? para.indexOf(pull) : -1;
    if (i < 0) return esc(para);
    return esc(para.slice(0, i)) + '<mark class="review__mark">' + esc(pull) + "</mark>" + esc(para.slice(i + pull.length));
  });

  // Reel items (src/_data/reel.json) whose hideFrom date has come, by the date in Vietnam, are left out.
  eleventyConfig.addFilter("current", (items) => {
    const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    return (items || []).filter((i) => !i.hideFrom || i.hideFrom > today);
  });

  // ---------- the weekly newsletter (lib/newsletter.js, src/_data/newsletters.js) ----------
  // Text from a payload in the page's language, English when the Vietnamese is not written yet.
  eleventyConfig.addFilter("nl", (obj, lang) => nlPick(obj, lang));
  eleventyConfig.addFilter("nlHtml", (html) => nlClean(html));
  // True when a Vietnamese page shows English for this text (it gets an "English" tag).
  eleventyConfig.addFilter("nlEn", (obj, lang) => nlIsEnglishOnly(obj, lang));
  // A lucide icon as inline SVG: {{ "trophy" | ico | safe }}, {{ "check" | ico("nl-tick") | safe }}
  eleventyConfig.addFilter("ico", (name, cls) => nlIcon(name, cls));
  // "From {name}" | fill({ name: "Ms. Thanh" })
  eleventyConfig.addFilter("fill", (s, vars = {}) => String(s ?? "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ""));
  // The calendar leaf beside a date to remember: { month, day, more }.
  eleventyConfig.addFilter("nlLeaf", (d, lang) => nlDateLeaf(d.iso, d.end, lang));
  // srcset for a newsletter photo (small is about 800 px wide, src about 1600 px).
  eleventyConfig.addFilter("nlSrcset", (p) => (p?.small && p.small !== p.src ? `${p.small} 800w, ${p.src} 1600w` : ""));
  // Only web, mail and phone addresses go into a link or an image; anything else becomes "#".
  eleventyConfig.addFilter("nlUrl", (url) => (/^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(String(url || "").trim()) ? String(url).trim() : "#"));
  // A photo's focus ("50% 30%") as object-position, or "" when it is anything else.
  eleventyConfig.addFilter("nlFocus", (f) => (/^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(String(f || "")) ? f : ""));
  // True for an address on this website (opens in the same tab).
  eleventyConfig.addFilter("nlOnSite", (url) => !!nlSitePath(url) || /^\/(?!\/)/.test(String(url || "")));
  // A full pra.edu.vn address as a site path in this language; any other address unchanged.
  eleventyConfig.addFilter("nlLink", (url, lang) => {
    const path = nlSitePath(url);
    return path ? urlFilter(toLang(path, lang)) : url;
  });
  // The archive: issues grouped by academic year and quarter, newest first.
  eleventyConfig.addFilter("nlByQuarter", (issues) => {
    const groups = [];
    for (const is of issues || []) {
      const key = `${is.school_year}-q${is.quarter}`;
      let g = groups.find((x) => x.key === key);
      if (!g) groups.push((g = { key, year: is.school_year, quarter: is.quarter, issues: [] }));
      g.issues.push(is);
    }
    return groups;
  });
  // The newest `n` other issues of the same newsletter, for "Past issues".
  eleventyConfig.addFilter("nlPast", (issues, issue, n = 6) =>
    (issues || []).filter((x) => x.edition === issue.edition && x.slug !== issue.slug && x.date <= issue.date).slice(0, n));
  // The newest issue of each newsletter, Post first.
  eleventyConfig.addFilter("nlLatest", (issues) => ["post", "ey"].map((e) => (issues || []).find((x) => x.edition === e)).filter(Boolean));
  // Reminders (or any { en, vi } list) with something written in them.
  eleventyConfig.addFilter("nlWithText", (list) => (list || []).filter((x) => nlPick(x, "en").trim()));
  // Whether an issue has a part of this type.
  eleventyConfig.addFilter("nlHasPart", (parts, type) => (parts || []).some((p) => p?.type === type));
  // The newest issue of one newsletter, or null.
  eleventyConfig.addFilter("nlNewest", (issues, edition) => (issues || []).find((x) => x.edition === edition) || null);
  // How many of the issues belong to one newsletter.
  eleventyConfig.addFilter("nlCount", (issues, edition) => (issues || []).filter((x) => x.edition === edition).length);
  // The announcement reel with the newest issue on top for four days from its Friday
  // (hideFrom is the fifth day), so nobody has to add it by hand.
  eleventyConfig.addFilter("withNewsletter", (items, issues, lang, strings) => {
    const is = (issues || [])[0];
    if (!is) return items || [];
    const T = strings[lang].nl;
    const item = {
      id: `newsletter-${is.slug}`,
      text: `${nlPick(is.edition_name, lang)}, ${nlPick(is.label, lang)}`,
      url: `/newsletter/${is.slug}/?from=site`,
      link: T.reelLink,
      hideFrom: nlAddDays(is.date, 4),
    };
    return [item, ...(items || [])];
  });

  // "8:45" -> 525, minutes since midnight (day chart on the schedule page)
  eleventyConfig.addFilter("mins", (t) => {
    const [h, m] = String(t).split(":").map(Number);
    return h * 60 + (m || 0);
  });

  // {% photo "slug", "css classes", "sizes attr" %}
  // Renders a responsive <img> from src/_data/photos.json (built by scripts/images.mjs).
  // Unknown slugs fall back to a labelled placeholder so a page never breaks.
  const pathPrefix = process.env.PATH_PREFIX || "/";
  let photos = {};
  try { photos = JSON.parse(readFileSync("src/_data/photos.json", "utf8")); } catch {}
  // Vietnamese alt text, by slug (photos and staff cutouts). A slug missing here falls back to English;
  // `npm run check:vi` lists the gaps. Read at startup like photos.json, so restart the dev server after editing.
  let altVi = {};
  try { altVi = JSON.parse(readFileSync("src/_data/altVi.json", "utf8")); } catch {}
  const altFor = (page, slug, en) => (isVi(page?.url) && altVi[slug]) || en;
  // The default sizes fit a .two column: half the 1180px wrap on desktop, capped at 560px when stacked.
  eleventyConfig.addShortcode("photo", function (slug, classes = "", sizes = "(min-width: 1240px) 560px, (min-width: 900px) 46vw, (min-width: 620px) 560px, 92vw", eager = false) {
    const p = photos[slug];
    if (!p) return `<div class="photo ${classes}" data-caption="photo: ${slug}"></div>`;
    const base = `${pathPrefix}assets/img/photos/${slug}`.replace(/\/{2,}/g, "/");
    const srcset = p.sizes.map((w) => `${base}-${w}.webp ${w}w`).join(", ");
    const largest = p.sizes[p.sizes.length - 1];
    const alt = String(altFor(this.page, slug, p.alt)).replace(/"/g, "&quot;");
    const focus = p.focus ? ` style="object-position: ${p.focus}"` : "";
    return `<div class="photo ${classes}"><img src="${base}-${largest}.webp" srcset="${srcset}" sizes="${sizes}" width="${p.width}" height="${p.height}" alt="${alt}"${focus}${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}></div>`;
  });

  // {% cutout "slug" %}
  // A staff portrait cut out of its photo, from src/_data/cutouts.json
  // (built by scripts/portraits.py). It sits on the coloured card in .team.
  let cutouts = {};
  try { cutouts = JSON.parse(readFileSync("src/_data/cutouts.json", "utf8")); } catch {}
  eleventyConfig.addShortcode("cutout", function (slug, sizes = "(min-width: 1040px) 260px, (min-width: 720px) 30vw, 44vw") {
    const p = cutouts[slug];
    if (!p) return `<div class="cutout cutout--none" aria-hidden="true"></div>`;
    const base = `${pathPrefix}assets/img/team/${slug}`.replace(/\/{2,}/g, "/");
    const srcset = p.sizes.map((w) => `${base}-${w}.webp ${w}w`).join(", ");
    const largest = p.sizes[p.sizes.length - 1];
    const alt = String(altFor(this.page, slug, p.alt)).replace(/"/g, "&quot;");
    return `<img class="cutout" src="${base}-${largest}.webp" srcset="${srcset}" sizes="${sizes}" width="${p.width}" height="${p.height}" alt="${alt}" loading="lazy" decoding="async">`;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
