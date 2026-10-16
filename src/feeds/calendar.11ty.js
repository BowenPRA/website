// /data/calendar.json: the academic calendar as a flat list, for The Current (the newsletter's
// "Dates to remember" offers these dates). It fetches the file from pra.edu.vn; GitHub Pages
// allows that from any site. Built from src/_data/calendar.json, whose events carry machine dates
// (`iso`, and `end` for a span) beside the dates people read.
//   { id, iso, end, en, vi, tag }   tag: "off" (no classes), "fees" (tuition due) or ""
const TAGS = { "no classes": "off", fees: "fees" };
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export const data = { permalink: "/data/calendar.json", eleventyExcludeFromCollections: true };

export function render({ calendar }) {
  const out = [];
  for (const month of calendar.months) {
    for (const e of month.events) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.iso || "")) throw new Error(`calendar.json: "${e.date} ${e.what}" has no iso date`);
      out.push({ id: `${e.iso}-${slug(e.what)}`, iso: e.iso, end: e.end || null, en: e.what, vi: e.vi?.what || "", tag: TAGS[e.tag] || "" });
    }
  }
  out.sort((a, b) => a.iso.localeCompare(b.iso));
  return JSON.stringify(out, null, 1);
}
