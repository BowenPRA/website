# Originals

Full-size originals pulled from the two Wix sites on 2026-09-22.
Not committed to git (see .gitignore) because they total about 270 MB.
Keep a copy on Google Drive or OneDrive.

- `wix-current/` — palmriveracademy.edu.vn (the live Wix site)
- `wix-draft/` — palmriveracademy.wixstudio.com/test
- `photos/` — the 2026 photo dump (unzipped)
- `manifest.json` — every file with its Wix media id and the pages it appeared on

Files whose names are just a Wix id (like `6c6955_...~mv2.png`) were uploaded
to Wix without a name; open them to see what they are.

Useful ones for the new site:
- Timetables: `2025NurserySchedule.jpg`, `2025KindySchedule.jpg`, `2025Year1-2Schedule.jpg`,
  `2025Year54Schedule.jpg`, `2025Year6Schedule.jpg`, `2025Year8Schedule.jpg`, `2025Year9Schedule.jpg`
- Calendar: `2025Calendar.jpg`
- Team: `Landon2025YearBook_edited_edited.jpg`, `Seth2025YearBook_edited_edited.jpg`,
  `Ali2025YearBook.jpg`, `David2025YearBook.jpg`, and the `Mr_-*.png` / `Ms_-*.png` set from the current site
- Campuses: `PalmRiverPrimaryCampus.jpg`, `PalmRiverSecondaryCampusGate_edited.jpg`, `PalmRiverSecondaryLibrary.jpg`
- Logos: `PRA-Logo-Big.png`, `logo-fb-05.png`

Picked photos are processed by `scripts/images.mjs` into `src/assets/img/photos/` as WebP at three widths.
