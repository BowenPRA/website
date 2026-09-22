"""Pull still images out of an event folder so they can go on a contact sheet.

- Pictures embedded in .pptx and .docx files (ppt/media, word/media). Icons, logos and
  anything under 600px on the long side are left out; repeats are kept once.
- A few sharp, well-lit frames from each video (OpenCV decodes H.264 and HEVC).
  Live Photo clips (a video next to a still with the same name) and videos under
  700px on the short side are skipped.

    python scripts/event-stills.py "events/2025_12_17 Christmas"
    python scripts/event-stills.py events --skip "resources|Early years|Songs/"
    python scripts/event-stills.py "events/2025_10_03 Mid-Autumn Festival" --skip "Songs/" --frames 8

Paths are under originals/. Output goes to <event>/_extracted/<source file>/.
"""
import argparse
import hashlib
import io
import re
import sys
import zipfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import cv2
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "originals"
IMG_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff", ".bmp"}
VID_EXT = {".mov", ".mp4", ".m4v"}
STILL_EXT = {".jpg", ".jpeg", ".heic", ".png"}
MIN_SIDE = 600


def event_of(path: Path) -> Path:
    """The event folder a file belongs to: its first folder under originals/events."""
    events = ROOT / "events"
    try:
        return events / path.relative_to(events).parts[0]
    except ValueError:
        return path.parent


def office_images(doc: Path, out_dir: Path, seen: set) -> int:
    n = 0
    with zipfile.ZipFile(doc) as z:
        for info in z.infolist():
            name = info.filename
            if "/media/" not in name or Path(name).suffix.lower() not in IMG_EXT or info.file_size < 40_000:
                continue
            data = z.read(info)
            digest = hashlib.md5(data).hexdigest()
            if digest in seen:
                continue
            seen.add(digest)
            try:
                w, h = Image.open(io.BytesIO(data)).size
            except Exception:  # noqa: BLE001
                continue
            if max(w, h) < MIN_SIDE:
                continue
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / Path(name).name).write_bytes(data)
            n += 1
    return n


def video_frames(args) -> str:
    video, out_dir, keep = args
    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    dur = total / fps
    if dur <= 0:
        return f"FAIL {video.name}: no frames"
    keep = keep or max(2, min(10, round(dur / 12)))
    samples = min(60, max(8, int(dur / 2)))
    scored = []
    for i in range(samples):
        t = dur * (0.03 + 0.94 * i / max(1, samples - 1))
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * fps))
        best = None
        for _ in range(3):  # the sharpest of three neighbouring frames
            ok, frame = cap.read()
            if not ok:
                break
            small = cv2.resize(frame, (0, 0), fx=720 / max(frame.shape[:2]), fy=720 / max(frame.shape[:2]))
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            sharp = cv2.Laplacian(gray, cv2.CV_64F).var()
            if best is None or sharp > best[0]:
                best = (sharp, gray.mean(), gray.std(), frame)
        if best is None:
            continue
        sharp, mean, std, frame = best
        if 55 < mean < 235 and std > 25:
            scored.append((sharp, t, frame))
    scored.sort(key=lambda s: -s[0])
    chosen, gap = [], dur / (keep * 1.5)
    for sharp, t, frame in scored:
        if all(abs(t - c[1]) >= gap for c in chosen):
            chosen.append((sharp, t, frame))
        if len(chosen) == keep:
            break
    out_dir.mkdir(parents=True, exist_ok=True)
    for _, t, frame in sorted(chosen, key=lambda c: c[1]):
        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
        (out_dir / f"t{t:06.1f}s.jpg").write_bytes(buf.tobytes())
    return f"ok   {video.name}: {len(chosen)} frames from {dur:.0f}s"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", help="folder under originals/, e.g. events or 'events/2026_03 March Mathness'")
    ap.add_argument("--skip", default="", help="regex; files whose path under the folder matches are left alone")
    ap.add_argument("--frames", type=int, default=0, help="frames per video (default: about one per 12 seconds, 2 to 10)")
    opts = ap.parse_args()
    base = ROOT / opts.folder
    skip = re.compile(opts.skip) if opts.skip else None
    files = sorted(p for p in base.rglob("*") if p.is_file() and "_extracted" not in p.parts)
    files = [p for p in files if not (skip and skip.search(p.relative_to(base).as_posix()))]

    seen: dict[Path, set] = {}
    for doc in (p for p in files if p.suffix.lower() in (".pptx", ".docx")):
        event = event_of(doc)
        n = office_images(doc, event / "_extracted" / doc.stem, seen.setdefault(event, set()))
        print(f"{'ok  ' if n else '--  '} {doc.relative_to(base)}: {n} images", flush=True)

    videos, sizes = [], set()
    for v in (p for p in files if p.suffix.lower() in VID_EXT):
        if any(v.with_suffix(e).exists() or v.with_suffix(e.upper()).exists() for e in STILL_EXT):
            continue  # Live Photo clip; the still is already there
        size = v.stat().st_size
        if size in sizes:
            continue  # a copy, e.g. IMG_8710(1).MOV
        sizes.add(size)
        cap = cv2.VideoCapture(str(v))
        short = min(cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.release()
        if short < 700:
            print(f"--   {v.relative_to(base)}: too small ({short:.0f}px)", flush=True)
            continue
        event = event_of(v)
        videos.append((v, event / "_extracted" / v.stem, opts.frames))
    with ProcessPoolExecutor(max_workers=4) as pool:
        for line in pool.map(video_frames, videos):
            print(line, flush=True)


if __name__ == "__main__":
    sys.exit(main())
