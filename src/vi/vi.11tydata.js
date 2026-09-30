// Every page under src/vi/ is Vietnamese. The shared data files keep a `vi` block beside the
// English fields; here each file is swapped for its Vietnamese version, so templates and
// partials read `events`, `days`, `site` and so on exactly as the English pages do.
// This has to be eleventyComputed: plain directory data is deep-merged with the global data,
// which joins the English and Vietnamese arrays (every event twice). Computed data replaces.
import { readFileSync } from "node:fs";
import { loc } from "../../lib/i18n.js";

const FILES = ["site", "announcements", "calendar", "days", "events", "programs", "team", "enroll"];
const vi = (f) => () => loc(JSON.parse(readFileSync(`src/_data/${f}.json`, "utf8")), "vi");

export default {
  lang: "vi",
  eleventyComputed: Object.fromEntries(FILES.map((f) => [f, vi(f)])),
};
