// The school years in src/_data/events.json, newest first (Bowen, 2026-10-16: the events page
// shows this year, newest event on top; each past year has its own page at /events/<year>/).
// `current` is the newest year that has an event; `past` are the others, newest first.
// src/events/past.njk makes one page per past year from `past`, so a new year needs no new page.
import { readFileSync } from "node:fs";

const events = JSON.parse(readFileSync("src/_data/events.json", "utf8"));
const years = [...new Set(events.map((e) => e.school_year))].sort().reverse();

export default { current: years[0], past: years.slice(1), all: years };
