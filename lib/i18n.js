// English and Vietnamese. See VIETNAMESE.md for how the two languages fit together.
//
// English pages live at the root ("/about/"); each Vietnamese page lives at the same path
// under /vi/ ("/vi/about/"). Data files keep both languages in one place: an object's
// English fields, plus a `vi` block that repeats the fields that need translating.

export const LANGS = ["en", "vi"];

export const isVi = (url) => /^\/vi(\/|$)/.test(url || "");

// "/vi/learning/" -> "/learning/"; English paths come back unchanged.
export const basePath = (url) => (isVi(url) ? String(url).replace(/^\/vi/, "") || "/" : url || "/");

// A site path in the given language: "/about/" -> "/vi/about/" for Vietnamese.
// Anchors, full URLs, mailto/tel links and assets are left alone.
export function toLang(path, lang) {
  const p = String(path ?? "");
  if (lang !== "vi" || !p.startsWith("/") || p.startsWith("//") || p.startsWith("/assets/") || isVi(p)) return p;
  return "/vi" + p;
}

// The same page in the other language.
export const twinPath = (url) => (isVi(url) ? basePath(url) : toLang(url || "/", "vi"));

// Deep copy of `data` with each object's `vi` block merged over it (for lang "vi"),
// and every `vi` block dropped (for either language).
export function loc(data, lang) {
  if (Array.isArray(data)) return data.map((d) => loc(d, lang));
  if (!data || typeof data !== "object") return data;
  const out = {};
  for (const [k, v] of Object.entries(data)) if (k !== "vi") out[k] = v;
  if (lang === "vi" && data.vi && typeof data.vi === "object") Object.assign(out, data.vi);
  for (const k of Object.keys(out)) out[k] = loc(out[k], lang);
  return out;
}
