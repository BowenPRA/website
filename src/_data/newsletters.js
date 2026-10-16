// The published weekly newsletters, newest first (lib/newsletter.js says what an issue is).
//
// Read at build time from The Current's database: the function adm_newsletters_public(), called
// with the publishable key in site.json (forms.base, forms.key). It returns the `published`
// payload of each issue on the website. Each element may be the payload itself or a row
// holding it ({ adm_newsletters_public: payload }); both are handled.
//
// If the database cannot be reached:
//   - on GitHub (CI is set) the build fails, so the live site stays as it was;
//   - on a laptop it warns and carries on with no issues.
// If the database answers that the function does not exist yet (the newsletter's SQL has not
// been run), there are no issues to show: the build carries on everywhere, so the rest of the
// site can still be published.
// For local work, NEWSLETTER_FIXTURES=<folder> reads every *-public.json in that folder instead.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { problem, byNewest, PUBLIC_PARTS } from "../../lib/newsletter.js";

const site = JSON.parse(readFileSync("src/_data/site.json", "utf8"));

function fromFixtures(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith("-public.json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
}

async function fromDatabase() {
  const { base, key } = site.forms;
  const res = await fetch(`${base}/rest/v1/rpc/adm_newsletters_public`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const text = await res.text();
    // PostgREST's "Could not find the function" (PGRST202): the newsletter is not set up yet.
    if (res.status === 404 && /PGRST202|could not find the function/i.test(text)) return { notSetUp: true };
    throw new Error(`adm_newsletters_public answered ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("adm_newsletters_public did not return a list");
  return data;
}

// One element of the answer -> the payload.
function unwrap(el) {
  let p = el;
  if (p && typeof p === "object" && !("v" in p) && "adm_newsletters_public" in p) p = p.adm_newsletters_public;
  if (typeof p === "string") { try { p = JSON.parse(p); } catch { return null; } }
  return p;
}

export default async function () {
  let raw;
  const dir = process.env.NEWSLETTER_FIXTURES;
  if (dir && existsSync(dir) && statSync(dir).isDirectory()) {
    raw = fromFixtures(dir);
    console.log(`[newsletters] ${raw.length} issue(s) from fixtures in ${dir}`);
  } else {
    try {
      raw = await fromDatabase();
      if (raw.notSetUp) {
        console.warn("[newsletters] the database has no adm_newsletters_public() yet (supabase/updates-2026-10-16-newsletter.sql in The Current); building without newsletters");
        return [];
      }
    } catch (err) {
      if (process.env.CI) throw new Error(`[newsletters] could not read the published newsletters: ${err.message}`);
      console.warn(`[newsletters] could not read the published newsletters (${err.message}); building without them`);
      return [];
    }
  }

  const seen = new Set();
  const issues = [];
  for (const el of raw) {
    const p = unwrap(el);
    const why = problem(p);
    if (why) { console.warn(`[newsletters] left out an issue: ${why}`); continue; }
    if (seen.has(p.slug)) { console.warn(`[newsletters] left out a second issue with the slug ${p.slug}`); continue; }
    seen.add(p.slug);
    issues.push({ ...p, parts: (p.parts || []).filter((part) => PUBLIC_PARTS.has(part?.type)) });
  }
  return issues.sort(byNewest);
}
