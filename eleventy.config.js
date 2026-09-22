import { readFileSync } from "node:fs";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

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
  // The default sizes fit a .two column: half the 1180px wrap on desktop, capped at 560px when stacked.
  eleventyConfig.addShortcode("photo", (slug, classes = "", sizes = "(min-width: 1240px) 560px, (min-width: 900px) 46vw, (min-width: 620px) 560px, 92vw", eager = false) => {
    const p = photos[slug];
    if (!p) return `<div class="photo ${classes}" data-caption="photo: ${slug}"></div>`;
    const base = `${pathPrefix}assets/img/photos/${slug}`.replace(/\/{2,}/g, "/");
    const srcset = p.sizes.map((w) => `${base}-${w}.webp ${w}w`).join(", ");
    const largest = p.sizes[p.sizes.length - 1];
    const alt = String(p.alt).replace(/"/g, "&quot;");
    const focus = p.focus ? ` style="object-position: ${p.focus}"` : "";
    return `<div class="photo ${classes}"><img src="${base}-${largest}.webp" srcset="${srcset}" sizes="${sizes}" width="${p.width}" height="${p.height}" alt="${alt}"${focus}${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}></div>`;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
