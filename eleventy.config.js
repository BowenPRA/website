import { readFileSync } from "node:fs";
import { loc, isVi, toLang, twinPath, basePath } from "./lib/i18n.js";

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

  // Reel items (src/_data/reel.json) whose hideFrom date has come, by the date in Vietnam, are left out.
  eleventyConfig.addFilter("current", (items) => {
    const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    return (items || []).filter((i) => !i.hideFrom || i.hideFrom > today);
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
