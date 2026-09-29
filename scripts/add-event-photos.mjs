// Puts the photos an office account chose in The Current onto this website, and
// takes down the ones that are no longer allowed.
//
//   node "C:\Users\bowen\pra-website\scripts\add-event-photos.mjs" "C:\Users\bowen\Downloads\website-<event>.json"
//   ... --dry-run                 say what would change, change nothing
//   ... --library "D:\Photos"     where the photo library is (default C:\Users\bowen\PRA Photos)
//   ... --event mid-autumn-2026   also list the photos under this event in src/_data/events.json
//
// The list comes from The Current > Photos > an event > Website > "Download the
// list". Every photo in it has been checked against the no-photo list by a member
// of staff; The Current will not put a photo in the list otherwise. Nothing on
// this website is private, so that check is the only gate there is.
//
// What it does:
//   1. copies each chosen photo, in the look chosen for it, from the photo
//      library into originals/events/<date> <event>/curated/<slug>.jpg
//   2. adds it to originals/picks.json (slug, caption, date, tags)
//   3. removes the photos in the list's take_down: from picks.json, from
//      originals, the built files, and from any event in events.json
//   4. runs scripts/images.mjs to build the pictures
//
// It does not commit or push. The website goes live on a push to main, so that is
// done on Bowen's word, after looking at the album page. Once it is live, The
// Current's "Free the storage" step finds the photos here and deletes its copies.
//
// Taking a photo down removes it from the website from the next push. It stays
// in this repository's history, which is public. A photo that must be gone for
// good needs the history rewritten; say so to Bowen rather than leaving it.

import { readFile, writeFile, mkdir, copyFile, rm, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const dryRun = args.includes("--dry-run");
const library = flag("--library") || "C:\\Users\\bowen\\PRA Photos";
const eventId = flag("--event");
const skip = new Set([flag("--library"), flag("--event")].filter(Boolean));
const listPath = args.find((a) => !a.startsWith("--") && !skip.has(a));

if (!listPath || !existsSync(listPath)) {
  console.error('Give the list downloaded from The Current, e.g. "C:\\Users\\bowen\\Downloads\\website-2026-09-25-mid-autumn-festival.json"');
  process.exit(1);
}
const list = JSON.parse((await readFile(listPath, "utf8")).replace(/^\uFEFF/, ""));
if (!list?.event?.slug || !Array.isArray(list.photos)) { console.error("That file is not a website list from The Current."); process.exit(1); }

const { event } = list;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const bad = [...list.photos.map((p) => p.slug), ...(list.take_down || [])].filter((s) => !SLUG.test(s || ""));
if (bad.length) { console.error(`Names the website cannot use, nothing changed: ${bad.join(", ")}`); process.exit(1); }

// The event's folder in the library is "<date> <name>"; its packaged pictures are in current/files.
const folders = existsSync(library) ? await readdir(library) : [];
const eventFolder = folders.find((f) => f === `${event.event_date} ${event.name}`) || folders.find((f) => f.startsWith(event.event_date));
if (list.photos.length && !eventFolder) { console.error(`No folder for ${event.event_date} in ${library}.`); process.exit(1); }
const source = (p) => join(library, eventFolder, "current", "files", `${p.code}-${p.look}.jpg`);
const lost = list.photos.filter((p) => !existsSync(source(p)));
if (lost.length) {
  console.error(`${lost.length} pictures are not in the library's package, nothing changed. First missing: ${source(lost[0])}`);
  console.error("Run package.py for the event again, then this.");
  process.exit(1);
}

const dated = `${event.event_date.replace(/-/g, "_")} ${event.name}`.replace(/[<>:"/\\|?*]/g, "");
const srcOf = (p) => `events/${dated}/curated/${p.slug}.jpg`;
const picksPath = join(ROOT, "originals", "picks.json");
const eventsPath = join(ROOT, "src", "_data", "events.json");
const picks = JSON.parse(await readFile(picksPath, "utf8"));
const events = JSON.parse(await readFile(eventsPath, "utf8"));
const bySlug = new Map(picks.map((p, i) => [p.slug, i]));

// A slug that is already on the website and did not come from this event is somebody else's photo.
const clash = list.photos.filter((p) => bySlug.has(p.slug) && picks[bySlug.get(p.slug)].src !== srcOf(p));
if (clash.length) { console.error(`Already used on the website by another photo, nothing changed: ${clash.map((p) => p.slug).join(", ")}`); process.exit(1); }

const focusOf = (f) => (Array.isArray(f) && f.length === 2 ? `${Math.round(f[0] * 100)}% ${Math.round(f[1] * 100)}%` : undefined);
let added = 0, changed = 0, same = 0;
const next = [...picks];
for (const p of list.photos) {
  if (!p.alt) { console.error(`${p.slug} has no caption, nothing changed. Give it one in The Current.`); process.exit(1); }
  const entry = { src: srcOf(p), slug: p.slug, alt: p.alt, taken: p.taken, ...(p.tags?.length ? { tags: p.tags } : {}), ...(focusOf(p.focus) ? { focus: focusOf(p.focus) } : {}) };
  if (bySlug.has(p.slug)) {
    const old = next[bySlug.get(p.slug)];
    const merged = { ...old, ...entry };
    if (JSON.stringify(merged) === JSON.stringify(old)) same++; else { changed++; next[bySlug.get(p.slug)] = merged; }
  } else { added++; next.push(entry); }
}

// Only photos that this script put there are ever taken down.
const ours = (slug) => bySlug.has(slug) && /^events\/.+\/curated\//.test(picks[bySlug.get(slug)].src);
const down = (list.take_down || []).filter(ours);
const kept = next.filter((p) => !down.includes(p.slug));
const newEvents = events.map((e) => ({ ...e, photos: (e.photos || []).filter((s) => !down.includes(s)) }));
let listed = 0;
if (eventId) {
  const e = newEvents.find((x) => x.id === eventId);
  if (!e) { console.error(`No event "${eventId}" in src/_data/events.json. Its ids are: ${events.map((x) => x.id).join(", ")}`); process.exit(1); }
  for (const p of list.photos) if (!e.photos.includes(p.slug)) { e.photos.push(p.slug); listed++; }
}

console.log(`${event.name}, ${event.event_date}`);
console.log(`  to add: ${added}   caption, tags or date changed: ${changed}   already there and the same: ${same}   to take down: ${down.length}`);
if (eventId) console.log(`  to list under "${eventId}" on the events page: ${listed}`);
for (const p of list.photos) if (!bySlug.has(p.slug)) console.log(`    + ${p.slug}`);
for (const s of down) console.log(`    - ${s}`);
if (dryRun) { console.log("Dry run: nothing was changed."); process.exit(0); }

// The pictures are copied again every time: the look chosen in The Current may have changed.
let rebuilt = [];
for (const p of list.photos) {
  const to = join(ROOT, "originals", srcOf(p));
  await mkdir(dirname(to), { recursive: true });
  const before = existsSync(to) ? (await stat(to)).size : -1;
  await copyFile(source(p), to);
  if (before !== -1 && before !== (await stat(to)).size) rebuilt.push(p.slug);
}
const OUT = join(ROOT, "src", "assets", "img", "photos");
for (const slug of [...down, ...rebuilt]) {
  for (const f of existsSync(OUT) ? await readdir(OUT) : []) if (new RegExp(`^${slug}-\\d+\\.webp$`).test(f)) await rm(join(OUT, f));
}
for (const slug of down) await rm(join(ROOT, "originals", picks[bySlug.get(slug)].src), { force: true });

await writeFile(picksPath, JSON.stringify(kept, null, 2) + "\n");
if (JSON.stringify(newEvents) !== JSON.stringify(events)) await writeFile(eventsPath, JSON.stringify(newEvents, null, 2) + "\n");

const built = spawnSync(process.execPath, [join(ROOT, "scripts", "images.mjs")], { cwd: ROOT, encoding: "utf8" });
if (built.status !== 0) { console.error(built.stdout, built.stderr); console.error("The pictures could not be built. picks.json has been changed; fix the error and run `node scripts/images.mjs`."); process.exit(1); }
console.log(`  built: ${(built.stdout.match(/^built /gm) || []).length} pictures`);
console.log(`Done. ${kept.length} photos on the website. Nothing has been committed or pushed.`);
console.log("Next: look at /album/ on the local site, then commit and push when Bowen says so.");
