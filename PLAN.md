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
  Cambridge pathway for Upper Years, GED/IELTS/PTE prep, rotating vocational
  classes, Y6 and Y9 Checkpoint, four-step admissions process.
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
Book a tour) · [Contact Us]

Home page section order, top to bottom: full-bleed photo hero with palm leaves ·
Discover our story · values marquee · "Content through context" (the English
language center explanation) · four photo tiles for the stages · stats band ·
Global Program · campus-life gallery · Find your way to PRA · CTA.

| URL | Page | Purpose | Sections | Main CTA |
|---|---|---|---|---|
| `/` | Home | Say what we are in 5 seconds, route by age | Hero, "How old is your child?" age picker, three true facts, a day at PRA (photo strip), values in one breath, Global Program teaser, campus map, CTA | Book a visit |
| `/about/` | About | Story, philosophy, values, team | Opening (learning community + ELC line), founded 2017 story, five values, philosophy, team grid, campuses | Book a visit |
| `/learning/` | Learning overview | One page that compares all stages by age | Age ladder, table: ages / curriculum / day length / class cap, links to each stage | Pick a stage |
| `/learning/early-years/` | Early Years (20 months to 4) | EYFS, play, language | What a morning looks like, four areas (social, physical, language, maths), partial-day option, FAQ | Book a visit |
| `/learning/primary/` | Primary (5 to 11) | Cambridge core + PE + vocational | Subjects, daily PE, vocational rotation, Y6 Checkpoint, FAQ | Book a visit |
| `/learning/lower-secondary/` | Lower Secondary (Years 7 to 9) | Same shape as Primary, own copy (the draft reused Primary text) | Subjects, PE, vocational, Y9 Checkpoint, FAQ | Book a visit |
| `/learning/upper-secondary/` | Upper Secondary (14 to 18) | Pathways: US diploma or Cambridge; exams; personal project; annual trip | Pathways, exam prep (GED, IELTS, PTE), project, trip | Ask a question |
| `/learning/global-program/` | Global Program (3 weeks to 3 months) | For travelling families; four pathways; price from | Who it is for, four pathways (Early Years, Vocational half day, Academic half day, Full day), what you get (reports, certificate), price from, how to book | Ask about dates |
| `/admissions/` | How to enroll | Four steps + FAQ | Steps 1 to 4, FAQ (documents, assessment, English level, trial day, rolling admissions), inquiry form | Send inquiry |
| `/admissions/tuition-and-fees/` | Tuition and fees | Real numbers | Regular Program table, Global Program table, other fees, payment schedule, transport, refund policy, Vietnamese translation link | Ask a question |
| `/families/calendar/` | Calendar | Academic year dates | Month-by-month list (from data file), download .ics link later | none |
| `/families/schedule/` | Daily schedule | Per-group timetables | Accordions per group (Nursery, Kindy, Y1-2, Y4-5, Y6, Y8, Y9) | none |
| `/families/handbook/` | Family handbook | Norms and guidelines | Link to PDF plus a short summary | none |
| `/contact/` | Contact / Book a visit | One form, map, phone, Zalo/WhatsApp, hours | Form (name, child's age, dates if visiting, message), addresses of both campuses, hours | Send |
| `/404.html` | Not found | Friendly | A palm and a link home | Home |

The `/learning/` overview page and `/contact/` page are new; the rest map to
the Wix draft.

## 5. Design direction

**Feel:** polished and bright, like the Wix draft, with the playfulness of a good
children's book: white and pale blue, bright blue and green, palm leaves, rounded
photo tiles, a hand-drawn underline here and there, big photos of real students.

**Colours** (from the Wix draft)
- Bright blue `#116DFF` (headings, buttons), deep blue `#0B4FBF`, navy `#0E2A5C` (footer)
- Green `#48971D` (contact button, accents), light green `#9CC64A`
- Pale blue `#EDF6F8` for alternating bands, white page background
- Mango `#F6A64B` only for focus rings

**Type**
- Poppins throughout (600/700 for headings, 400/500 for body), as on the Wix draft
- Big, generous line height. Body 18px on mobile, 19px on desktop.

**Whimsy that earns its place**
- **Age picker on the home page.** "How old is your child?" with tappable
  chips (Under 5, 5 to 11, 11 to 14, 14 to 18, Just visiting Hội An). Picking
  one swaps in the right program card. Works without JS (all cards shown).
- **River divider.** A wavy SVG edge between major sections instead of hard
  lines. One shape, reused, slightly different colour each time.
- **Palm leaves that peek in** from the edge of the hero and footer. Static
  SVG, positioned so they never cover text on narrow screens.
- **Hand-drawn underline** under one key phrase per page (an SVG stroke).
- **Blob photo masks** on team and stage photos, rotated a few degrees.
- **Tiny motion:** a slow palm sway on the logo mark and a hover wobble on
  the main button. All off under `prefers-reduced-motion`.
- **Microcopy with a wink** in the 404 page, the form success message, and
  the FAQ headings. Never in the fee table.

**What we do not do**
- Purple or neon gradients, glassmorphism, floating 3D blobs.
- Hero video autoplay.
- Icon-card grids of three as the default section.
- Parallax, scroll-jacking, cursor effects.
- Stock photos. If we do not have the photo, the section gets an illustration
  or nothing.

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

- Fee tables (Regular and Global) and the answers to the five fee FAQs
  (other fees, development fee, payment schedule, transport, refund).
- Answers to the five enrollment FAQs.
- Real team list with two-sentence bios and photos (the draft had five names,
  three with placeholder text).
- Daily schedule per group (seven groups).
- 2026-27 calendar (the draft has 2025-26).
- Family handbook PDF.
- 15 to 25 good photos: kids working, outside time, cooking class, both
  campuses, a classroom, the river. Landscape and portrait mix.
- Where the inquiry form should deliver (Formspree account or Google Form).
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
- Staff on the site are the ten people on the current site plus Ms. Duyen and
  Mr. Chiến from the timetable. Mr. Landon, Ms. Thuy and Ms. Ali from the Wix draft
  are not listed until Bowen confirms.
- The schedule page is generated from the admin app's timetable
  (`scripts/schedule-from-admin.mjs`), with teacher names removed.
- Photos: prefer the ones Bowen chose for the Wix draft plus polished activity shots
  of older students; avoid close-up toddler phone snapshots.
