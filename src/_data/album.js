// The album (/album/): our own index of every photo the site has built — what it
// shows, what it is called, where the original lives, and which page uses it.
// It is not in the menu; it is the page we open when we need to find a photo again.
//
// None of the tags are typed out by hand. Each one is worked out from what the
// build already knows:
//
//   src/_data/photos.json   every built photo: caption, size, the original's path
//   the page templates      which pages name a slug (partials counted too)
//   the data files          photos a page renders from data (events, team, ...)
//   the original's path     the date it was taken, the event, the class, the teacher
//
// A photo no page uses is tagged "Not on the site": built, delisted, still ours to
// pull from. When a guess is wrong, picks.json can carry `people`, `tags` or
// `taken` on that photo and scripts/images.mjs copies them into photos.json,
// where they win over anything worked out here.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const SRC = "src";
const DATA = path.join(SRC, "_data");
const INCLUDES = path.join(SRC, "_includes");

// The site's own order, so the "Where it's used" filter reads like the menu.
const PAGE_ORDER = [
  "/", "/about/", "/learning/", "/learning/early-years/", "/learning/primary/",
  "/learning/lower-secondary/", "/learning/upper-secondary/", "/learning/global-program/",
  "/admissions/", "/admissions/tuition-and-fees/", "/families/schedule/",
  "/families/handbook/", "/events/", "/contact/",
];

const readJson = async (f) => JSON.parse(await readFile(path.join(DATA, f), "utf8"));
const posix = (p) => p.split(path.sep).join("/");
// Vietnamese names lose their marks so "Ms. Thắm V" still matches "Tham" in a file name.
const plain = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const key = (s) => plain(String(s)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default async function () {
  const photos = await readJson("photos.json");
  const events = await readJson("events.json");
  const team = await readJson("team.json");
  const announcements = await readJson("announcements.json");
  const programs = await readJson("programs.json");
  const days = await readJson("days.json");
  const site = await readJson("site.json");

  const slugs = Object.keys(photos);
  const used = new Map(slugs.map((s) => [s, []]));
  const add = (slug, page) => {
    const list = used.get(slug);
    if (!list || list.some((p) => p.url === page.url && p.title === page.title)) return;
    list.push(page);
  };

  // ---- pages that name a slug outright ----
  // A page's text plus every partial it includes, so a slug written into a
  // partial counts on the pages that pull that partial in.
  const fileText = new Map();
  const textOf = async (file) => {
    if (!fileText.has(file)) fileText.set(file, await readFile(file, "utf8").catch(() => ""));
    return fileText.get(file);
  };
  const closure = async (file, seen = new Set()) => {
    if (seen.has(file)) return "";
    seen.add(file);
    const text = await textOf(file);
    let all = text;
    for (const m of text.matchAll(/{%-?\s*include\s+"([^"]+)"/g)) all += await closure(path.join(INCLUDES, m[1]), seen);
    return all;
  };

  const templates = [];
  const collect = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith("_") || entry.name === "assets") continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) await collect(p);
      else if (entry.name.endsWith(".njk")) templates.push(p);
    }
  };
  await collect(SRC);

  for (const file of templates) {
    const text = await textOf(file);
    const front = text.startsWith("---") ? text.slice(3, text.indexOf("\n---", 3) + 1) : "";
    const field = (name) => (new RegExp(`^${name}:\\s*"?(.*?)"?\\s*$`, "m").exec(front) || [])[1];
    const permalink = field("permalink");
    if (permalink && permalink.includes("{{")) continue; // redirects.njk stamps out many URLs
    if (permalink && !permalink.startsWith("/")) continue; // 404.html
    const rel = posix(file).replace(`${SRC}/`, "");
    if (rel === "album.njk") continue; // the album shows every photo; that is not "used on a page"
    const url = permalink
      ? permalink.replace(/index\.html$/, "")
      : "/" + rel.replace(/index\.njk$/, "").replace(/\.njk$/, "/");
    const title = rel === "index.njk" ? "Home" : field("title") || url;
    // every quoted word in the page, so each slug is one lookup rather than a
    // search through the whole template
    const quoted = new Set([...(await closure(file)).matchAll(/["']([a-z0-9-]{4,})["']/g)].map((m) => m[1]));
    for (const slug of slugs) if (quoted.has(slug)) add(slug, { title, url });
  }

  // ---- pages that render a photo out of a data file ----
  // The scan above cannot see these: the template only ever names a variable.
  // Each one is listed here by hand, so a new data file full of slugs needs a
  // line adding; until it gets one, the fallback below flags it rather than
  // calling the photo unused.
  for (const e of events) for (const slug of e.photos || []) add(slug, { title: e.name, url: `/events/#${e.id}`, group: "Events" });
  for (const m of team.members) for (const slug of m.shots || []) add(slug, { title: `About Us · ${m.name}`, url: "/about/", group: "About Us" });
  for (const a of announcements) if (a.flyer) add(a.flyer, { title: "Home · noticeboard", url: "/", group: "Home" });
  for (const p of programs) {
    if (!p.photo) continue;
    add(p.photo, { title: "Academics", url: "/learning/" });
    if (p.key !== "global") add(p.photo, { title: "Home", url: "/" }); // the home grid leaves the Global Program out
  }
  for (const s of days.stages || []) if (s.photo) add(s.photo, { title: "Schedule and calendar", url: "/families/schedule/" });
  if (site.campus && site.campus.photo) {
    for (const [url, title] of [["/", "Home"], ["/about/", "About Us"], ["/contact/", "Book a tour"]]) {
      add(site.campus.photo, { title, url });
    }
  }

  // Safety net: a slug sitting in a data file nobody mapped is still on the site
  // somewhere, so say so rather than filing it under "Not on the site".
  for (const file of await readdir(DATA)) {
    if (!file.endsWith(".json") || file === "photos.json") continue;
    const text = await readFile(path.join(DATA, file), "utf8");
    const quoted = new Set([...text.matchAll(/"([a-z0-9-]{4,})"/g)].map((m) => m[1]));
    for (const slug of slugs) {
      if (used.get(slug).length || !quoted.has(slug)) continue;
      add(slug, { title: `In site data · ${file}`, url: "" });
    }
  }

  // ---- what the original's path can tell us ----
  const roster = team.members
    .map((m) => ({ name: m.name, first: plain(m.name).replace(/^(Mr|Ms)\.\s*/, "") }))
    .sort((a, b) => b.first.length - a.first.length); // "Thắm V" before "Tham", so the longer name wins

  const thisYear = schoolYear(new Date().toISOString().slice(0, 10));

  const entries = slugs.map((slug) => {
    const p = photos[slug];
    const src = p.src || "";
    const file = src.split("/").pop() || "";
    const folder = src.split("/").slice(0, -1).join("/");
    const usedOn = used.get(slug);

    // when it was taken: the file name first (the camera's own date), then the
    // dated folder the event photos live in
    const taken = p.taken || dateFromName(file) || dateFromPath(src);
    const year = schoolYear(taken) || yearFromPath(src, thisYear);

    // which event, if any: the events page is the truth, and the folder answers
    // for the sets no page has taken yet (the Da Lat trip, say)
    const listed = events.find((e) => (e.photos || []).includes(slug));
    const event = listed ? { name: listed.name, url: `/events/#${listed.id}` } : eventFromPath(src, events);

    const people = p.people || who({ slug, alt: p.alt, file, team, roster });
    const stages = stagesOf({ slug, alt: p.alt, usedOn });
    const klass = classOf(src, p.alt);
    const kind = kindOf(slug, src);

    const tokens = [
      ...usedOn.map((u) => `use:${key(u.group || u.title)}`),
      ...(usedOn.length ? [] : ["use:not-on-the-site"]),
      `year:${key(year)}`,
      ...(event ? [`event:${key(event.name)}`] : []),
      ...people.map((n) => `who:${key(n)}`),
      ...stages.map((s) => `stage:${key(s)}`),
      `kind:${key(kind)}`,
    ];

    return {
      slug, alt: p.alt, width: p.width, height: p.height, sizes: p.sizes,
      src, file, folder,
      taken, year, event, people, stages, klass, kind,
      tags: p.tags || [],
      used: usedOn,
      tokens: tokens.join(" "),
      search: plain([slug, p.alt, src, year, event && event.name, klass, kind, ...people, ...stages, ...(p.tags || []), ...usedOn.map((u) => u.title)].filter(Boolean).join(" ")).toLowerCase(),
    };
  });

  // Newest first, undated last. The delisted ones stay in date order with the
  // rest rather than being swept to the end, since a filter brings them up.
  entries.sort((a, b) => (b.taken || "").localeCompare(a.taken || "") || a.slug.localeCompare(b.slug));

  // ---- the filter chips ----
  // One group per facet, each value with the number of photos behind it. A group
  // with nothing to choose between (one value for all 149) is dropped.
  const labels = new Map([["use:not-on-the-site", "Not on the site"]]);
  const pageUrl = new Map();
  for (const e of entries) {
    for (const u of e.used) { labels.set(`use:${key(u.group || u.title)}`, u.group || u.title); pageUrl.set(key(u.group || u.title), u.url); }
    labels.set(`year:${key(e.year)}`, e.year);
    if (e.event) labels.set(`event:${key(e.event.name)}`, e.event.name);
    for (const n of e.people) labels.set(`who:${key(n)}`, n);
    for (const s of e.stages) labels.set(`stage:${key(s)}`, s);
    labels.set(`kind:${key(e.kind)}`, e.kind);
  }

  // The pages in menu order, then the delisted photos on the end.
  const inMenuOrder = (a, b) => {
    const place = (v) => {
      if (v.token === "use:not-on-the-site") return PAGE_ORDER.length + 1;
      const i = PAGE_ORDER.indexOf((pageUrl.get(v.token.replace("use:", "")) || "").split("#")[0]);
      return i === -1 ? PAGE_ORDER.length : i;
    };
    return place(a) - place(b);
  };
  const byCount = (a, b) => b.count - a.count || a.label.localeCompare(b.label);
  // newest year first, with the photos nobody can date on the end
  const newestFirst = (a, b) => (a.label === "Undated") - (b.label === "Undated") || String(b.label).localeCompare(String(a.label));

  const facets = [
    { group: "use", label: "Where it's used", sort: inMenuOrder },
    { group: "year", label: "School year", sort: newestFirst },
    { group: "event", label: "Event", sort: byCount },
    { group: "who", label: "Who's in it", sort: byCount },
    { group: "stage", label: "Stage", sort: byCount },
    { group: "kind", label: "Type", sort: byCount },
  ].map((f) => {
    const counts = new Map();
    for (const e of entries) {
      for (const token of e.tokens.split(" ")) {
        if (token.startsWith(`${f.group}:`)) counts.set(token, (counts.get(token) || 0) + 1);
      }
    }
    const values = [...counts].map(([token, count]) => ({ token, count, label: labels.get(token) || token })).sort(f.sort);
    return { group: f.group, label: f.label, values };
  }).filter((f) => f.values.length > 1);

  return {
    photos: entries,
    facets,
    counts: {
      total: entries.length,
      unused: entries.filter((e) => !e.used.length).length,
      events: new Set(entries.filter((e) => e.event).map((e) => e.event.name)).size,
    },
  };
}

// ---------- reading the original's path ----------

// A date out of the file name: "20260817_134631.jpg", "IMG_20260310_083727.jpg",
// or the 13-digit epoch the phone exports carry. Hội An is UTC+7, so the epoch is
// read there and not wherever the build happens to run.
function dateFromName(name) {
  const ymd = /(?:^|\D)(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:\D|$)/.exec(name);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const ms = /(?:^|\D)(1[5-9]\d{11})(?:\D|$)/.exec(name);
  if (ms) return new Date(Number(ms[1]) + 7 * 3600 * 1000).toISOString().slice(0, 10);
  return null;
}

// The event and trip folders are named "2026_03 March Mathness", so the folder
// dates everything inside it, down to the day when it has one.
function dateFromPath(src) {
  const m = /^(?:events|trips)\/(20\d{2})[_-](\d{2})(?:[_-](\d{2}))?/.exec(src);
  return m ? [m[1], m[2], m[3]].filter(Boolean).join("-") : null;
}

// Our year runs August to July: 3 October 2025 is 2025-26, and so is March 2026.
function schoolYear(date) {
  const m = /^(\d{4})-(\d{2})/.exec(date || "");
  if (!m) return null;
  const y = Number(m[1]) - (Number(m[2]) >= 8 ? 0 : 1);
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

// No date in the name or the folder: the folder the original was filed under
// still says which year it belongs to. The Wix downloads are the old site's
// photos and nobody knows when they were taken.
function yearFromPath(src, thisYear) {
  const m = /(20\d{2})[-_](?:20)?(\d{2})\b/.exec(src);
  if (m) return `${m[1]}-${m[2]}`;
  if (src.startsWith("yearbook/")) return "2025-26"; // the 2025-26 yearbook uploads
  if (src.startsWith("flyers/")) return thisYear; // a flyer is for the year we are in
  return "Undated";
}

function eventFromPath(src, events) {
  const m = /^(?:events|trips)\/20\d{2}[_-]\d{2}(?:[_-]\d{2})? ([^/]+)/.exec(src);
  if (!m) return null;
  const folder = plain(m[1].split("_")[0]).trim().toLowerCase(); // "Welcome Back Night_ Y6-Secondary" -> "welcome back night"
  const listed = events.find((e) => {
    const name = plain(e.name).toLowerCase();
    return name.includes(folder) || folder.includes(name);
  });
  if (listed) return { name: listed.name, url: `/events/#${listed.id}` };
  return { name: src.startsWith("trips/") ? `${m[1]} trip` : m[1], url: "" };
}

// Who is in it: the staff card that claims the photo, then the caption, then the
// file name — we name the teacher in a lot of them ("PrimaryCalebMovement.jpg").
function who({ slug, alt, file, team, roster }) {
  const portrait = team.members.find((m) => `team-${m.slug}` === slug);
  if (portrait) return [portrait.name];

  const found = new Set();
  for (const m of team.members) if ((m.shots || []).includes(slug)) found.add(m.name);

  let caption = plain(alt || "");
  for (const r of roster) {
    const re = new RegExp(`\\b(?:Mr|Ms)\\.?\\s+${r.first}\\b`);
    if (re.test(caption)) { found.add(r.name); caption = caption.replace(re, " "); }
  }

  const words = new Set(plain(file).replace(/([a-z])([A-Z])/g, "$1 $2").split(/[^A-Za-z]+/).map((w) => w.toLowerCase()));
  for (const r of roster) if (!r.first.includes(" ") && words.has(r.first.toLowerCase())) found.add(r.name);

  return [...found];
}

// Which part of the school. The page it is used on is the firm answer; the slug
// and the caption fill in for the photos no page has taken yet.
function stagesOf({ slug, alt, usedOn }) {
  const byUrl = {
    "/learning/early-years/": "Early Years",
    "/learning/primary/": "Primary",
    "/learning/lower-secondary/": "Lower Secondary",
    "/learning/upper-secondary/": "Upper Secondary",
    "/learning/global-program/": "Global Program",
  };
  const found = new Set();
  for (const u of usedOn) if (byUrl[u.url]) found.add(byUrl[u.url]);

  const text = `${slug} ${plain(alt || "")}`.toLowerCase();
  if (/early.years|nursery|kindergarten|toddler/.test(text)) found.add("Early Years");
  if (/\bprimary\b|year [1-6]\b/.test(text)) found.add("Primary");
  if (/lower.secondary|year [789]\b/.test(text)) found.add("Lower Secondary");
  if (/^upper|upper.secondary|upper.years/.test(text)) found.add("Upper Secondary");
  if (/global.program/.test(text)) found.add("Global Program");
  if (!found.size && /\bsecondary\b/.test(text)) found.add("Secondary");
  return [...found];
}

// The class, when the original was filed under one ("Year 2-3 _ 2026-2027") or
// the caption names it.
function classOf(src, alt) {
  const filed = /\b(Year [0-9]+(?:-[0-9]+)?)\b/.exec(src);
  if (filed) return filed[1];
  const caption = /\b(Year [0-9]+(?:-[0-9]+)?)\b/.exec(alt || "");
  return caption ? caption[1] : null;
}

function kindOf(slug, src) {
  if (src.startsWith("flyers/") || /-flyer$/.test(slug)) return "Flyer";
  if (/^poster-/.test(slug)) return "Poster";
  if (/^team-/.test(slug)) return "Staff portrait";
  return "Photo";
}
