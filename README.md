# Palm River Academy website

Static site for palmriveracademy.edu.vn, built with [Eleventy](https://www.11ty.dev/)
and deployed to GitHub Pages. See [PLAN.md](PLAN.md) for the site plan, voice
rules, and what content is still needed.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:8080. Edits under `src/` rebuild automatically.

## Where things live

| Path | What |
|---|---|
| `src/_data/site.json` | Name, phone, email, addresses, hours |
| `src/_data/programs.json` | The five program cards used by the age picker and Learning overview |
| `src/_data/calendar.json` | Academic calendar, month by month |
| `src/_data/team.json` | Team members and bios |
| `src/_includes/layouts/base.njk` | The one page layout (head, header, footer) |
| `src/_includes/partials/` | Header, footer, river divider, CTA block |
| `src/assets/css/main.css` | All styles. Design tokens are at the top |
| `src/assets/js/main.js` | Nav sheet, age picker |
| `src/*.njk`, `src/**/*.njk` | The pages |

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes it to GitHub Pages. In the repo settings, set Pages, Source to
"GitHub Actions" once.

Until the custom domain is pointed here the site lives at
`https://bowenpra.github.io/<repo-name>/`. The workflow sets `PATH_PREFIX`
from the repo name so links work there. When DNS moves, add `src/CNAME`
containing `palmriveracademy.edu.vn` and the prefix becomes `/`.
