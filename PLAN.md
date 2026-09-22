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
Book a tour) · Events · [Contact Us]

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
| `/families/schedule/` | Schedule and calendar | The shape of the day at each stage, then the year's dates | Day-at-a-glance chart, one card per stage (core mornings, weekly mix of specialist and vocational classes), practical notes, calendar | Book a visit |
| `/families/handbook/` | Family handbook | Norms and guidelines | Link to PDF plus a short summary | none |
| `/events/` | Events | Last year's festivals, theme weeks, trips and graduation, August to June | Month chips, one section per event (from `src/_data/events.json`: name, date, 1 to 3 sentences, polaroids with a lightbox), link to this year's calendar | Book a visit |
| `/contact/` | Contact / Book a visit | One form, map, phone, Zalo/WhatsApp, hours | Form (name, child's age, dates if visiting, message), addresses of both campuses, hours | Send |
| `/404.html` | Not found | Friendly | A palm and a link home | Home |

The `/learning/` overview page and `/contact/` page are new; the rest map to
the Wix draft.

## 5. Design direction

**Feel:** polished and bright, like the Wix draft, with the playfulness of a good
children's book: white and pale blue, bright blue and green, palm leaves, rounded
photo tiles, a hand-drawn underline here and there, big photos of real students.

**Colours** (from the Wix draft, extended 2026-09-22 in the colour and motion pass)
- Bright blue `#116DFF` (headings, buttons), deep blue `#0B4FBF`, navy `#0E2A5C` (footer)
- Green `#48971D` (contact button, accents), light green `#9CC64A`
- Stage colours: sun `#FFC857` (Early Years), green (Primary), blue (Lower Secondary),
  coral `#FF6F59` (Upper Secondary), violet `#7C5CFF` (Global Program). The same
  colour follows a stage everywhere: tiles, menu dots, age chips, program cards.
- **Page tones.** Each page sets `tone:` in front matter (blue, green, sun, coral,
  violet). The tone colours that page's hero band, its pale bands, FAQ, tables and
  form edge, so each page has its own colour and all pages share the same parts.
  Hero band shades are picked for 4.5:1 contrast with their text (white, or ink on sun).
- White page background; a five-colour tape at the top of the footer and in the menu.

**Type**
- Poppins throughout (700/800 for headings and big numbers, 400/500 for body), as on the Wix draft
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
- **Motion that feels alive, never in the way** (all of it stops under
  `prefers-reduced-motion`): hero text rises in and the underline draws itself;
  a slow zoom on the home photo; the river edge under every hero drifts; two
  crossed ribbons carry the values and subjects; sections fade up as they scroll
  in; stat numbers count up; cards lift and their colour bar grows on hover;
  stickers bob; the leaf mascot blinks; the header slides away when scrolling
  down and back when scrolling up; pages cross-fade in browsers that support it.
- **Gallery** is polaroids with tape; tap one to open a lightbox. On phones it is
  a swipe strip.
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
  timetable (Mr. Chiến removed at Bowen's request, 2026-09-22). Each person gets a
  role and one short line, no bio paragraph. Mr. Landon, Ms. Thuy and Ms. Ali from
  the Wix draft are not listed until Bowen confirms.
- The schedule page does not show full timetables (Bowen, 2026-09-22): it is for
  parents and gives the broad strokes. A day-at-a-glance chart compares the stages,
  then one card per stage shows the core subjects every morning and the week's mix
  of specialist and vocational classes (with days a week). Stages split where the
  timetable does: Nursery / Kindergarten, Year 1 / Years 2 to 6, Year 7 / Years 8
  and 9 (who share the Upper Secondary day). The content lives in
  `src/_data/days.json`, written by hand from `src/_data/schedule.json` (still
  copied from the admin app by `scripts/schedule-from-admin.mjs`, but no longer
  rendered). The same file feeds the "A day in ..." timelines on the stage pages.
- Photos: prefer the ones Bowen chose for the Wix draft plus polished activity shots
  of older students; avoid close-up toddler phone snapshots.
