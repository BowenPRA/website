export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
