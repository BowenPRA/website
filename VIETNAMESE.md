# The Vietnamese site

Every public page exists twice: in English at its usual address, and in Vietnamese at
the same address under `/vi/` (`/about/` and `/vi/about/`). The EN | VI toggle in the
header links each page to its twin. Added 2026-09-29.

## How it fits together

| What | Where |
|---|---|
| Which language a page is in | `lang`: `"en"` from `src/_data/lang.json`, `"vi"` for everything under `src/vi/` (`src/vi/vi.11tydata.js`) |
| Vietnamese pages | `src/vi/`, mirroring `src/` file for file (`src/learning/primary.njk` -> `src/vi/learning/primary.njk`) |
| Header, menu, footer, buttons | `src/_data/strings.json`, `en` and `vi` side by side. Partials read `strings[lang]` as `T` |
| Data files (events, team, days, programs, announcements, calendar, site) | Each object keeps its English fields plus a `vi` block with the same fields in Vietnamese. `src/vi/vi.11tydata.js` swaps the Vietnamese in for pages under `/vi/`, so templates read `events`, `days` etc. the same way in both languages |
| Photo captions / alt text | English in `photos.json` (built from `originals/picks.json`); Vietnamese in `src/_data/altVi.json`, by slug. A missing slug falls back to English |
| Words written by main.js | The `words` object at the top of `src/assets/js/main.js` |
| Font | Poppins has no Vietnamese letters, so Vietnamese pages use Be Vietnam Pro (`:root:lang(vi)` in main.css) |
| Search engines | Each page lists its twin with `hreflang` in `<head>`; English is `x-default` |

Links inside pages are written `{{ '/about/' | href(lang) }}`, never `| url`, so the
same template line points at the English page on an English page and the Vietnamese
page on a Vietnamese one. `href` leaves `/assets/...`, `#anchors` and full URLs alone.

Not translated: `/album/` (ours, not the public's; no toggle), the redirect stubs in
`src/learning/redirects.njk` and `src/families/calendar.njk`. The 404 page is one page
in both languages.

## Keeping the two in step

**Every change to English copy needs the same change in Vietnamese.** Run

    npm run check:vi

It lists Vietnamese pages that are missing, pages whose photos, links or sections no
longer match their English twin, data objects with no `vi` block (or a `vi` block missing
a field), photos with no Vietnamese caption, and Vietnamese pages last committed before
their English twin changed. It also flags banned words (below). It does not block a deploy.

When adding a page: copy `src/x.njk` to `src/vi/x.njk`, translate the words only, and
if the English front matter has a `permalink`, give the twin the same one under `/vi/`.

## Who we are, in Vietnamese

Palm River Academy is a licensed **English language center**. We are never a school, in
either language (Bowen, 2026-09-29). In Vietnamese that rules out some everyday words:

| Never, for us | Use |
|---|---|
| trường, trường học, nhà trường, ngôi trường | trung tâm, Palm River Academy, PRA, chúng tôi |
| sân trường, đến trường, tan trường, đồng phục trường | sân, đến lớp / đến trung tâm, tan học, đồng phục |
| hiệu trưởng, phó hiệu trưởng | see staff titles below |
| học sinh (for our students) | học viên; when talking to a parent about their child: con, các con; for the youngest: các bé |

Other schools are still schools: "trường cũ của con", "trường quốc tế ở Đà Nẵng",
"đại học ở Úc".

The full name, as on our invoices and reports: **Trung tâm Anh ngữ Palm River Academy**.
The licence line: "Palm River Academy là trung tâm Anh ngữ được cấp phép tại Hội An, Việt Nam."

## Glossary

Program, class and year-group names stay in English. They are the names families see on
timetables, reports and invoices, and "Year 7" is not "lớp 7" (it matches Vietnamese
grade 6).

| English | Vietnamese |
|---|---|
| Early Years, Nursery, Kindergarten, Primary, Lower Secondary, Upper Secondary, Global Program, Regular Program | unchanged |
| Year 1 ... Year 9 | unchanged ("Year 1 đến Year 6") |
| ages 5 to 11 / 20 months to 4 | 5 đến 11 tuổi / 20 tháng đến 4 tuổi |
| named classes: Maker Space, Art of Science, Movement, Wellbeing, Review, Boredom, Master Minds, Book Worms, Everyday Experts, Practice, Presentation and Play, Executive Function | unchanged; the sentence around it says what the class is |
| English (the subject / the language) | tiếng Anh |
| Maths, Science, History, Art, Technology, Cooking, PE | Toán, Khoa học, Lịch sử, Mỹ thuật, Công nghệ, nấu ăn, thể dục |
| Cambridge curriculum; Cambridge Primary | chương trình Cambridge; Cambridge Primary |
| EYFS | khung chương trình EYFS của Anh |
| phonics | phonics (ngữ âm) on first use, then phonics |
| academic year / quarter / fall break / make-up day | năm học / quý (Quý 1) / kỳ nghỉ thu / ngày học bù |
| tuition, fees | học phí, các khoản phí |
| enrollment, enrol | đăng ký học |
| admissions | tuyển sinh |
| book a tour / a visit | đặt lịch tham quan |
| trial day | học thử |
| progress report | báo cáo tiến bộ |
| Certificate of Completion | Giấy chứng nhận hoàn thành |
| homeroom teacher | giáo viên chủ nhiệm |
| subject teacher / specialist | giáo viên bộ môn |
| specialist and vocational classes | các lớp bộ môn và thực hành |
| Global Program pathways: Vocational half day / Academic half day / Cambridge and vocational full day | Nửa ngày thực hành / Nửa ngày học thuật / Cả ngày: Cambridge và thực hành |
| homeroom (the daily slot) | sinh hoạt lớp |
| silent auction | đấu giá im lặng |
| Owner / Head Teacher / Deputy Head Teacher | Chủ sở hữu / Giáo viên trưởng / Phó giáo viên trưởng |
| campus | cơ sở (the site as a place: khuôn viên) |
| lunch, snack | bữa trưa, bữa phụ |
| the bus, transport | xe đưa đón |
| internship | thực tập |
| the five values: Intellectual Exploration, Creative Expression, Sports and Fun, Global Citizenship, Leadership Development | Khám phá tri thức, Sáng tạo và thể hiện, Thể thao và vui chơi, Công dân toàn cầu, Rèn luyện khả năng lãnh đạo |
| Contact Us | Liên hệ |
| Events | Sự kiện |

## Writing it

The English voice rules in PLAN.md section 3 apply unchanged: short sentences, plain
words, the specific thing, no closing flourish. Write it the way a Vietnamese member of
staff would tell a parent at the front desk, not as a word-for-word copy of the English.

- **Who is talking to whom.** Parents are "ba mẹ" (not "bố mẹ", and "quý phụ huynh" only in
  formal notes such as payment terms). Their child is "con". We are "chúng tôi" or "PRA".
  Teachers are "giáo viên" or "thầy cô".
- **Keep every fact.** Same numbers, prices, dates, ages and names. Add nothing, drop nothing.
  If an English joke does not work in Vietnamese, say the plain thing instead.
- **Sentence case** for headings: capital on the first word and on names only.
- **Names** stay as they are: "Ms. Xuan", "Mr. Seth". Place names keep their marks: Hội An,
  Đà Nẵng, Cẩm Thanh, Vĩnh Điện, Việt Nam; countries in Vietnamese (Mỹ, Úc, Ấn Độ).
- **Numbers and money:** dots for thousands, "33.500.000 VNĐ", "VNĐ mỗi quý", "VNĐ mỗi tuần".
  Percentages "10%". Times on the 24-hour clock: 2:30pm is "14:30"; ranges "8:00 đến 16:00".
- **Dates:** "thứ Sáu, 25/9", "25/9/2026", "tháng 9". Weekdays "thứ Hai" ... "thứ Sáu",
  "Chủ nhật". Short forms in tight spaces: "T6, 25/9".
- **Quotes** “like this”.

Banned, on top of the English list (Vietnamese marketing clichés): toàn diện, năng động,
đẳng cấp, hàng đầu, chắp cánh, khơi dậy, khơi gợi, tiềm năng vô hạn, nuôi dưỡng tâm hồn,
hành trang, hành trình, vững bước, tương lai tươi sáng, vươn tầm, bứt phá, tỏa sáng,
môi trường chuẩn quốc tế, trải nghiệm tuyệt vời, "Tại sao nên chọn ...?". "Công dân toàn
cầu" only as the name of the value.

Have a Vietnamese member of staff read any new copy before it goes live.
