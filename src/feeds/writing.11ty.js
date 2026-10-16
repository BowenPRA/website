// /data/writing.json: the posts on the Student Blog (/writing/, The Palm Press until 2026-10-16), newest first, for The Current
// (a newsletter's "From The Palm Press" (on the website now "From the Student Blog") part picks one). Each English post is paired with its
// Vietnamese twin for the Vietnamese blurb.
//   { title, author, url, date, blurb_en, blurb_vi }
export const data = { permalink: "/data/writing.json", eleventyExcludeFromCollections: true };

export function render({ collections, site }) {
  const vi = new Map((collections.writingVi || []).map((p) => [p.fileSlug, p]));
  const posts = [...(collections.writing || [])].sort((a, b) => b.date - a.date).map((p) => ({
    title: p.data.title,
    author: p.data.author || "",
    url: `${site.url}${p.url}`,
    date: p.date.toISOString().slice(0, 10),
    blurb_en: p.data.summary || "",
    blurb_vi: vi.get(p.fileSlug)?.data.summary || "",
  }));
  return JSON.stringify(posts, null, 1);
}
