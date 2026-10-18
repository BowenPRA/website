// Copy the weekly timetable from the admin app (the admin folder in the user folder)
// into src/_data/schedule.json, dropping teacher names (public site) and keeping
// subjects, times and kinds.
//   node scripts/schedule-from-admin.mjs
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const { DEFAULT_SCHEDULE, DAYS } = await import(pathToFileURL(join(homedir(), "admin", "src", "data", "schedule.js")).href);
const out = {
  schoolYear: DEFAULT_SCHEDULE.schoolYear,
  days: DAYS,
  classes: DEFAULT_SCHEDULE.classes.map((k) => ({
    key: k.key, name: k.name, yearGroups: k.yearGroups, note: k.note || "",
    rows: k.rows.map((r) => r.all !== undefined
      ? { time: r.time, all: r.all, kind: r.kind || "" }
      : { time: r.time, days: r.days.map((d) => ({ s: d.s, kind: d.kind || "" })) }),
  })),
};
await writeFile(new URL("../src/_data/schedule.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
const subjects = new Set();
for (const k of out.classes) for (const r of k.rows) { if (r.days) r.days.forEach((d) => !d.kind && subjects.add(d.s)); }
console.log(out.classes.map((k) => `${k.name} [${k.yearGroups.join(", ")}] ${k.rows.length} rows`).join("\n"));
console.log("subjects:", [...subjects].sort().join(" | "));
