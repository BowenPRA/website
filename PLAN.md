# Palm River Academy website plan

> Revised 2026-09-22 after Bowen's review of the first build. Structure and look follow
> the Wix Studio draft; facts follow the current palmriveracademy.edu.vn site; the
> timetable comes from the admin app; there is one campus. Sections below are updated
> where they changed.

Working plan for the new palmriveracademy.edu.vn. This replaces both the current
Wix site (one long page) and the unfinished Wix Studio draft (ten pages). It is
a static site hosted on GitHub Pages. No blog for now.

## 1. Who the site is for

- **Parents in Hội An and Đà Nẵng** deciding where to send a child aged 20 months
  to 18. Mix of Vietnamese and international families. Most will find us on a
  phone, often from a Facebook or Zalo link.
- **Travelling families** looking for a 3 week to 3 month place for their kids
  (the Global Program). They compare quickly and want price, dates, and a way
  to ask a question.
- **Current families** looking for the calendar, daily schedule, or handbook.

Everything on the site should answer, fast: what is this place, is it right for
my child's age, what does it cost, how do I visit.

## 2. What we keep and what we drop

Keep from the current site:
- The "English Language Center" identity (we are licensed as one).
- Regular Program / Global Program split.
- Contact details, hours, address, photo gallery idea.

Keep from the Wix Studio draft:
- Page structure: About, one page per stage, Global Program, Enrollment,
  Tuition and Fees, Calendar and Schedules, Book a Tour.
- The facts: founded 2017, Hội An's oldest international learning center,
  under 13 per class, 22+ staff, 10+ alumni studying abroad, two campuses in
  Cẩm Thanh, Cambridge curriculum, EYFS for Early Years, US diploma or
  Cambridge pathway for Upper Years, GED/IELTS/PTE prep (the Cambridge pathway and the
  test prep dropped from the site 2026-09-22, the US diploma 2026-09-24, see section 10),
  rotating vocational
  classes, four-step admissions process. (Checkpoint tests are not mentioned on the site.)
- The five values (Intellectual Exploration, Creative Expression, Sports and
  Fun, Global Citizenship, Leadership Development). The draft says "6
  principles" but lists five; we use five.

Drop:
- The blog / student bulletin.
- Wix booking widget. Replace with a simple form or a direct link.
- Placeholder team bios ("Describe the team member here").
- The current 35% promotion banner unless Bowen wants a promo slot kept.
- Stock-sounding copy. Most paragraphs get rewritten (see voice rules).

## 3. Positioning and voice

**One line:** Palm River Academy is an English language center in Hội An for
children from 20 months to 18 years. We teach English through content: science,
maths, cooking, art and sport. Content through context, and doing.

**The "English Language Center" line** appears in the footer on every page and
in the About page opening: "Palm River Academy is a licensed English language
center in Hội An, Việt Nam." The rest of the site says "learning community",
"school day", "campus", "teachers" naturally.

**Voice rules**
- Short sentences. Plain words. Say the specific thing (13 kids, 2017, Cẩm
  Thanh, cooking class on Thursdays) instead of the general one.
- First person plural. "We" is the staff. "Your child" not "students" when
  talking to a parent.
- Warm and a little playful. Jokes are allowed if they are small and true.
- Honest about what we are: small, hands-on, mixed Vietnamese and
  international, one modest campus near the river.
- Every page ends with one clear next step (book a visit, ask a question).

**Banned words and patterns** (this is the anti-AI-slop list):
- unlock, empower, elevate, nurture, holistic, vibrant, journey, thrive,
  world-class, cutting-edge, seamless, robust, foster, passionate, dynamic,
  transformative, "in today's world", "future-ready", "global leaders of
  tomorrow"
- Triads for their own sake ("Learn. Grow. Succeed.")
- Rhetorical question headings ("Why choose us?")
- Emoji as bullets; sparkle and rocket emoji anywhere
- Three identical icon cards in a row as the default section
- Sentences that could belong to any school on earth

## 4. Site map

Top nav (mirrors the Wix draft; hamburger sheet on mobile):
About Us · Academics ▾ (Early Years, Primary, Secondary, Upper Years, Global Program) ·
Admissions ▾ (Enrollment, Tuition and fees, Schedule and calendar, Family handbook,
Book a tour) · Events · [Contact Us]

Home page section order, top to bottom: full-bleed photo hero with palm leaves ·
Our story · values marquee · "Content through context" (the English
language center explanation) · four photo tiles for the stages · stats band ·
Global Program · campus-life gallery · the student-made yearbook film (navy band,
native video player, a 3 min cut of the 2025-26 yearbook video in src/assets/video/,
with a taped polaroid of the Yearbook Team under the text; credit it to the "Yearbook Team",
not a year group) · Find your way to PRA · CTA.

| URL | Page | Purpose | Sections | Main CTA |
|---|---|---|---|---|
| `/` | Home | Say what we are in 5 seconds, route by age | Hero, "How old is your child?" age picker, three true facts, a day at PRA (photo strip), values in one breath, Global Program teaser, campus map, CTA | Book a visit |
| `/about/` | About | Story, philosophy, values, team | Opening (learning community + ELC line), founded 2017 story, five values, philosophy, team grid, campuses | Book a visit |
| `/learning/` | Learning overview | One page that compares all stages by age | Age ladder, table: ages / curriculum / day length / class cap, links to each stage | Pick a stage |
| `/learning/early-years/` | Early Years (20 months to 4) | EYFS, play, language | What a morning looks like, four areas (social, physical, language, maths), partial-day option, FAQ | Book a visit |
| `/learning/primary/` | Primary (5 to 11) | Cambridge core + PE + vocational | Subjects, daily PE, vocational rotation, reports, FAQ | Book a visit |
| `/learning/lower-secondary/` | Lower Secondary (Years 7 to 9) | Same shape as Primary, own copy (the draft reused Primary text) | Subjects, PE, vocational, FAQ | Book a visit |
| `/learning/upper-secondary/` | Upper Secondary (14 to 18) | An individual plan around the student's goal, in English, often towards study abroad; projects, internships, annual trip | How the plan is made, the day, projects and internships, where alumni went | Ask a question |
| `/learning/global-program/` | Global Program (3 weeks to 3 months) | For travelling families; four pathways; price from | Who it is for, four pathways (Early Years, Vocational half day, Academic half day, Full day), what you get (reports, certificate), price from, how to book | Ask about dates |
| `/admissions/` | How to enroll | Four steps + FAQ | Steps 1 to 4, FAQ (documents, assessment, English level, trial day, rolling admissions), inquiry form | Send inquiry |
| `/admissions/tuition-and-fees/` | Tuition and fees | Real numbers | Regular Program table, Global Program table, other fees, payment schedule, transport, refund policy, Vietnamese translation link | Ask a question |
| `/families/calendar/` | Calendar | Academic year dates | Month-by-month list (from data file), download .ics link later | none |
| `/families/schedule/` | Schedule and calendar | The shape of the day at each stage, then the year's dates | Day-at-a-glance chart, one card per stage (core mornings, weekly mix of specialist and vocational classes), practical notes, calendar | Book a visit |
| `/families/handbook/` | Family handbook | Norms and guidelines | Link to PDF plus a short summary | none |
| `/events/` | Events | Last year's festivals, theme weeks, trips and graduation, August to June | Month chips, one section per event (from `src/_data/events.json`: name, date, 1 to 3 sentences, polaroids with a lightbox), link to this year's calendar | Book a visit |
| `/contact/` | Contact / Book a visit | One form, map, phone, Zalo/WhatsApp, hours | Form (name, child's age, dates if visiting, message), addresses of both campuses, hours | Send |
| `/album/` | Photo album (ours) | Find a photo again: every photo the site has built, with its tags, file names and the page it is used on | Search, filter chips (where it's used, school year, event, who's in it, stage, type), a card per photo, lightbox | none — not in the nav, `noindex` |
| `/404.html` | Not found | Friendly | A palm and a link home | Home |

The `/learning/` overview page and `/contact/` page are new; the rest map to
the Wix draft.

## 5. Design direction

> Revised 2026-09-22 in the polish pass: blue and green became the whole identity, the yellow
> circles gave way to a drawn palm frond, and every page shares one set of parts.

**Feel:** polished and bright, with the playfulness of a good children's book: white and pale
blue or pale green, bright blue and leaf green, palm fronds, framed photos with a slight tilt,
one hand-drawn underline per page, big photos of real students.

**Colours** (all in `:root` in `main.css`)
- Core pair: bright blue `#116DFF` (headings, primary buttons, blue band, CTA) and green
  `#48971D` (fronds, eyebrows, small marks). Deep blue `#0B4FBF` for links and hover, navy
  `#0E2A5C` for the footer and small headings, light blue `#7FB2FF` in the tape and calendar.
  Deep green `#2F7D14` carries any small white text (Contact Us and Send buttons, the green
  band, step badges, icons), because white on `#48971D` is only 3.7:1. Light green `#9CC64A`
  for the underline, footer headings, stat marks and the tape. Pale green `#EDF7E3` and pale
  blue `#EEF5FF` for tinted bands.
- Stage colours (sun `#FFC857`, green, blue, coral `#FF6F59`, violet `#7C5CFF`) are markers
  only: menu dots, age chips, tile labels, price-card bars, the day chart and one sticker. They
  never colour a whole page or a button. Sun, coral and violet never carry body text.
- Small accents keep the pages from looking samey: card icons cycle through the five colours,
  as do value numbers, step badges, checklist ticks, calendar month bars, event month badges,
  gallery tape, staff cards and the three stat marks. All of these are small shapes, never
  text on a coloured field except ink on sun.
- **Staff cards.** The team grid follows the Wix Studio draft: each person is cut out of their
  photo and stands on a two-colour card, above the waist, name and role on a white plate below.
  `scripts/cutouts.mjs` keys the backdrop out and frames everyone from a hand-measured face width
  (`originals/cutouts.json`) so every face is the same size on every card; where a source photo
  stops at the chest the bottom of the portrait is faded into the colour instead of ending on a
  hard line. Card colours cycle all six pairs (`tint` in team.json) because they are accents.
  Anyone with `shots` in team.json also carries photos of them at work: on a mouse those fan up
  from the bottom of the card on hover, on a touch screen a photo-count badge is the cue, and
  the card opens the shared lightbox either way.
- **Page tones.** Front matter `tone:` is `blue` (default: Home, Academics, Lower Secondary,
  Contact), `green` (About, Primary, Handbook), `navy` (Admissions, Events, Upper Secondary) or
  `light`, a pale green-to-blue hero with blue headings (Early Years, Fees, Global Program,
  Schedule). The tone colours the hero band and the page's pale bands, FAQ, tables and form edge.
  Optional `stage:` sets the page's marker colour for its eyebrows and tags.
- Buttons: blue on white pages, white on coloured bands, deep green for Contact Us and Send.
- The tape at the top of the footer and the mobile menu is greens and blues with one thread of sun.

**Type**
- Poppins throughout (700/800 for headings and big numbers, 400/500 for body).
- One type scale and one space scale, as custom properties (`--t-h1` to `--t-eyebrow`,
  `--s-1` to `--s-5`, `--section`). Body 18px on mobile, 19.5px from 720px.

**Shape system**
- Radii `--r-sm` 12, `--r` 18, `--r-lg` 28, pills. Three shadows (`--shadow-sm`, `--shadow`,
  `--shadow-pop`). Every framed photo (`.photo--lg`, the hero photo) has the same 8px white
  frame, large radius, pop shadow and a 2 degree tilt.
- **The palm frond** is the one recurring motif. It is drawn in code (`src/assets/img/frond.svg`
  for CSS masks; the same paths inlined once per page as `#frond` and `#frond-hang` symbols via
  `partials/frond-symbol.njk`, placed with `partials/frond.njk`). It hangs into the home hero,
  sits behind every inner-page hero photo and every framed photo (`.leaf-wrap`), peeks from a
  corner of every tinted band, frames the CTA and sits in the footer. Two tones per frond: back
  leaflets darker, stem and front leaflets lighter.
- Stickers are white paper labels by default, with green, blue, sun, coral or violet variants.
- Polaroids with tape in the galleries, alternating sun and green tape.

**Whimsy that earns its place**
- Age picker on the Academics page; river divider under every hero; wavy edges between bands;
  the hand-drawn underline in leaf green; a leaf mascot on the ribbons; polaroids with a lightbox.
- **Motion** (all of it stops under `prefers-reduced-motion`): hero text rises in and the
  underline draws itself; a slow zoom on the home photo; the river drifts; fronds sway a few
  degrees; the two ribbons scroll; sections fade up as they scroll in; stat numbers count up;
  cards lift and their colour bar grows on hover; stickers bob; the mascot blinks; the header
  slides away on the way down and back on the way up.

**What we do not do**
- Purple or neon gradients, glassmorphism, morphing blobs, floating rings or bubbles.
- Yellow as a page or section colour. Yellow, coral and violet are accents only.
- Hero video autoplay, parallax, scroll-jacking, cursor effects, stock photos.
- Icon-card grids of three as the default section.

## 6. Mobile-first rules

- Write the CSS for a 360px phone first; add columns at 720px and 1024px.
- One column on mobile, always. Tables scroll sideways inside a box or
  collapse to stacked rows (fee tables use stacked rows).
- Tap targets at least 44px. Nav is a full-screen sheet with big links.
- Sticky "Book a visit" button in the bottom right on mobile.
- Images: `loading="lazy"`, `srcset` for 480 / 960 / 1600 widths, WebP.
- No web fonts blocking render (`font-display: swap`), two families max.
- Page weight target under 500KB on the home page, under 300KB elsewhere.
- Test on a real phone in Vietnam on 4G before launch.

## 7. Technical setup

- **Generator:** Eleventy 3 (Node). Nunjucks templates, JSON data files for
  calendar, team, programs, fees. One shared layout, header and footer
  partials. No client-side framework; about 60 lines of vanilla JS for the
  nav sheet, age picker, and accordions.
- **Hosting:** GitHub Pages from a GitHub Actions workflow on push to `main`.
  Output folder `_site`. Custom domain via `CNAME` in `src/` when DNS is
  moved off Wix. `PATH_PREFIX` env var handles the interim
  `bowenpra.github.io/<repo>/` URL.
- **Forms:** GitHub Pages cannot receive form posts. Options, in order of
  preference: (1) Formspree free tier posting to admin@palmriveracademy.edu.vn,
  (2) a Google Form embedded on `/contact/`, (3) `mailto:` plus Zalo/WhatsApp
  buttons as the fallback. The scaffold ships with (3) plus a placeholder
  Formspree action.
- **Map:** static image of both campuses with a "Open in Google Maps" link.
  No embedded iframe (slow, cookie banner).
- **Vietnamese version:** phase 5. Same templates, content under `src/vi/`,
  language toggle in the header. Do not machine-translate.
- **Analytics:** none at launch. Add a privacy-friendly one later if wanted.

## 8. Content Bowen needs to supply

Filled in on 2026-09-22 from the 2026-27 Tuition and Fees sheet, the 2026-27
academic calendar (10 Aug version), the 2025-26 Family Handbook, the Global
Program brochure (Sep 2025), the admissions SOP and the admin app. Decisions from
Bowen: Upper Secondary fees are "ask us"; the Global brochure table stands for
2026-27; there is no development fee any more; the contact form stays (Formspree).

Done: fee tables and fee FAQs, enrollment FAQs, program FAQs, team, daily
schedules, 2026-27 calendar, handbook short version.

Still open:
- Formspree form ID for the contact form (sign up with admin@, create a form,
  put the ID in `src/_data/site.json` `formAction`). Until then Send is disabled
  and the form points people to email and WhatsApp.
- A 2026-27 family handbook. The site offers a copy by email rather than a PDF,
  because only the 2025-26 edition exists.
- Quarter 4 start: the fee sheet says 29 March, the calendar says 25 March. The
  site gives neither, only the 22 March payment date.
- Trial day price: the 2026-27 fee sheet says 1,600,000 and the SOP says 1,500,000.
  The site uses 1,600,000.
- Parent and teacher meeting dates for 2026-27 (not on the calendar).
- Whether to keep a promotion slot on the home page.

## 9. Build phases

1. **Scaffold (this commit).** Repo, Eleventy, layout, design tokens, header,
   footer, nav sheet, home page with age picker, all other pages present with
   first-draft copy, GitHub Actions deploy, README.
2. **Content pass.** Drop in fees, FAQs, schedules, team, photos. Review
   every paragraph against the voice rules.
3. **Polish.** Real phone testing, Lighthouse over 95 on mobile, alt text,
   focus states, 404, social share image, favicon set.
4. **Launch.** Add `CNAME`, move DNS from Wix, redirect old Wix URLs,
   update Google Business Profile link.
5. **Later.** Vietnamese version, calendar `.ics` export, photo gallery page.

## 10. Decisions made in this plan

- Eleventy over plain HTML so the header and footer live in one place.
- Fredoka + Nunito as the type pairing.
- "Families" as the nav label for calendar, schedule, and handbook.
- Ages on stage pages follow the Wix draft (Early Years to 4, Primary 5 to
  11, Secondary 11 to 14, Upper 14 to 18). The Global Program says Early
  Years is 2 to 5; the draft is inconsistent and we go with 20 months to 4
  for the Regular Program page. Bowen to confirm.
- One campus: Trần Nhân Tông, Cẩm Thanh, Hội An. The ĐX18 secondary campus is
  no longer used.
- Staff on the site are the ten people on the current site plus Ms. Duyen from the
  timetable (Mr. Chiến removed at Bowen's request, 2026-09-22) and Ms. Hien, Operations
  Manager (added 2026-09-23). Each person gets a role and one short line, no bio paragraph.
  Ms. Hien has no line yet and Ms. Duyen still has no photo. Mr. Landon, Ms. Thuy and
  Ms. Ali from the Wix draft are not listed until Bowen confirms.
- The schedule page does not show full timetables (Bowen, 2026-09-22): it is for
  parents and gives the broad strokes. A day-at-a-glance chart compares the stages,
  then one card per stage shows the core subjects every morning and the mix of
  specialist and vocational classes. Bowen's follow-ups: no counts of how often
  each class runs; no Year 8 / Year 9 split, just Lower Secondary (the Year 7
  timetable) and Upper Secondary (the teens timetable); never mention Checkpoint
  tests anywhere on the site. The content lives in
  `src/_data/days.json`, written by hand from `src/_data/schedule.json` (still
  copied from the admin app by `scripts/schedule-from-admin.mjs`, but no longer
  rendered). The same file feeds the "A day in ..." timelines on the stage pages.
- Upper Secondary copy (Bowen, 2026-09-22, revised 2026-09-24): no Cambridge pathway, no
  IELTS, PTE or GED, and since 24 September no US high school diploma either — the site does
  not name a qualification anywhere. Say that we build an academic plan with the family around
  the student's goal, that the focus is stronger English and, for many, studying abroad, and
  that academics mix with projects and internships. The lead of the page carries that; everything
  from the projects down (the personal project, the maths cluster, the trip, internships and
  learning buddies, where students have gone) is as Bowen wants it. Internships are mentioned
  softly ("sometimes an internship", "ask us what might be possible").
- Stage-page copy (Bowen, 2026-09-24): the core sections on Primary and Lower Secondary lead
  with the language, not the subjects. Say plainly that we are an English language center and
  that the Cambridge subjects are how we teach English, then give each subject the English it
  builds: Primary maths has the words for comparing and explaining (more than, half, heavier,
  roll or stack), Primary science the words for what happened (first, then, because); Lower
  Secondary maths is reading the problem and explaining the method, science is the write-up and
  defending it, English is the lesson where the language itself is the subject. Each page keeps
  one line that lands it: "A child who can tell you why the shape rolled has just used English
  for something real", and "A student who can explain a fair test has learned some science and a
  lot of English". IGCSE is no longer named on Lower Secondary (it implied a pathway the Upper
  Secondary page does not offer); Bowen to say if it should come back.
- Home hero facts are three leaf-shaped bubbles (round on three corners, pointed at the stem, pale
  veins behind the text) in deep green, mint and teal: "20 months to 18 years", "Small classes", "Since 2017". The stats band shows years in Hội An (computed from the founding year), not staff count.
- Photos: prefer the ones Bowen chose for the Wix draft plus polished activity shots
  of older students; avoid close-up toddler phone snapshots.

- The photo album at `/album/` is for us, not for families: it is left out of the
  header, the mobile sheet and the footer, and carries `noindex` so it stays out
  of search results. Its tags are worked out at build time in `src/_data/album.js`
  from photos.json, the templates and the original's own path, so a new photo
  appears on it with no extra typing. When a guess is wrong, `picks.json` takes
  `people`, `tags` or `taken` for that photo and those win. This is not the public
  gallery page in the phases list below; that one is still to come.
