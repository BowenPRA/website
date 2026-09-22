import { readFileSync } from "node:fs";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // {% photo "slug", "css classes", "sizes attr" %}
  // Renders a responsive <img> from src/_data/photos.json (built by scripts/images.mjs).
  // Unknown slugs fall back to a labelled placeholder so a page never breaks.
  const pathPrefix = process.env.PATH_PREFIX || "/";
  let photos = {};
  try { photos = JSON.parse(readFileSync("src/_data/photos.json", "utf8")); } catch {}
  eleventyConfig.addShortcode("photo", (slug, classes = "", sizes = "(min-width: 900px) 50vw, 100vw", eager = false) => {
    const p = photos[slug];
    if (!p) return `<div class="photo ${classes}" data-caption="photo: ${slug}"></div>`;
    const base = `${pathPrefix}assets/img/photos/${slug}`.replace(/\/{2,}/g, "/");
    const srcset = p.sizes.map((w) => `${base}-${w}.webp ${w}w`).join(", ");
    const largest = p.sizes[p.sizes.length - 1];
    const alt = String(p.alt).replace(/"/g, "&quot;");
    return `<div class="photo ${classes}"><img src="${base}-${largest}.webp" srcset="${srcset}" sizes="${sizes}" width="${p.width}" height="${p.height}" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}></div>`;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
