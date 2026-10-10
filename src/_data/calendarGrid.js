// The month grids on the schedule page (#calendar), worked out from `grid` in calendar.json.
// One entry per month from grid.from to grid.to; `cells` runs Monday first, with null for the
// blank days before the 1st and after the last. Each day is one kind: weekend, closed, makeup,
// firstlast (first and last day of the year), term (with its quarter) or off (a weekday outside
// every quarter). `fee` marks the days quarterly tuition is due.
import { readFileSync } from "node:fs";

const { grid } = JSON.parse(readFileSync("src/_data/calendar.json", "utf8"));

const iso = (d) => d.toISOString().slice(0, 10);
const utc = (s) => new Date(s + "T00:00:00Z");
function range(from, to = from) {
  const out = [];
  for (const d = utc(from); d <= utc(to); d.setUTCDate(d.getUTCDate() + 1)) out.push(iso(d));
  return out;
}

export default function () {
  const closed = new Set(grid.closed.flatMap(([from, to]) => range(from, to)));
  const makeup = new Set(grid.makeup);
  const fees = new Set(grid.fees);
  const firstLast = new Set(grid.firstLast);
  const quarterOf = (s) => grid.quarters.find((q) => s >= q.from && s <= q.to)?.n;

  const months = [];
  for (const m = utc(grid.from + "-01"); iso(m).slice(0, 7) <= grid.to; m.setUTCMonth(m.getUTCMonth() + 1)) {
    const year = m.getUTCFullYear(), month = m.getUTCMonth();
    const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells = Array((m.getUTCDay() + 6) % 7).fill(null);
    for (let d = 1; d <= length; d++) {
      const date = new Date(Date.UTC(year, month, d));
      const s = iso(date);
      const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      const q = quarterOf(s);
      const kind = weekend ? "weekend" : closed.has(s) ? "closed" : makeup.has(s) ? "makeup"
        : firstLast.has(s) ? "firstlast" : q ? "term" : "off";
      cells.push({ d, date: s, kind, q: kind === "term" ? q : null, fee: fees.has(s) });
    }
    while (cells.length % 7) cells.push(null);
    months.push({ year, month, cells });
  }
  return months;
}
