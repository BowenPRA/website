# Palm River Academy website

Static site for pra.edu.vn, built with [Eleventy](https://www.11ty.dev/)
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
| `src/assets/js/main.js` | Nav sheet, age picker, lightbox, the album's search and filters |
| `src/_data/album.js` | Works out the tags behind `/album/`, our own index of every photo on the site |
| `src/*.njk`, `src/**/*.njk` | The pages |
| `originals/` | Full-size photos and Wix exports, not in git (too big); see its README |
| `scripts/images.mjs` | Turns `originals/picks.json` into WebP files in `src/assets/img/photos/` |

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes it to GitHub Pages. In the repo settings, set Pages, Source to
"GitHub Actions" once.

The site is served at `https://pra.edu.vn/` (custom domain set under Settings, Pages).
`src/CNAME` holds the domain; while it exists the workflow builds with the path
prefix `/`. Without it the workflow falls back to `/<repo-name>/` for
`https://bowenpra.github.io/<repo-name>/`. The admin app keeps its own domain,
`current.pra.edu.vn`, from the BowenPRA/admin repo.

DNS for pra.edu.vn is at P.A Vietnam: four A and four AAAA records for GitHub
Pages on the apex, `www` as a CNAME to `bowenpra.github.io`, `current` as a
CNAME to `bowenpra.github.io`. The MX and TXT records are Google Workspace
email; leave them alone.
