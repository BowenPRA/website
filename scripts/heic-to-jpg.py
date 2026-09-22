"""Convert every HEIC under originals/photos into JPG under originals/photos-jpg,
mirroring the folder tree, and copy existing JPG/PNG files across unchanged.
Orientation from EXIF is applied so the JPGs are upright.

    python scripts/heic-to-jpg.py
    python scripts/heic-to-jpg.py events events   (folders under originals/; the same
                                                   folder twice converts in place, next to each HEIC)
"""
import shutil
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "originals" / (sys.argv[1] if len(sys.argv) > 1 else "photos")
DST = ROOT / "originals" / (sys.argv[2] if len(sys.argv) > 2 else "photos-jpg")


def convert(path: Path) -> str:
    rel = path.relative_to(SRC)
    out = DST / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    suffix = path.suffix.lower()
    try:
        if suffix in (".heic", ".heif"):
            out = out.with_suffix(".jpg")
            if out.exists():
                return f"skip {rel}"
            img = Image.open(path)
            img = ImageOps.exif_transpose(img).convert("RGB")
            img.save(out, "JPEG", quality=92, optimize=True)
            return f"ok   {rel}"
        if suffix in (".jpg", ".jpeg", ".png"):
            if out.exists():
                return f"skip {rel}"
            img = Image.open(path)
            fixed = ImageOps.exif_transpose(img)
            if fixed is not img:  # had a rotation tag: rewrite upright
                fixed.convert("RGB").save(out.with_suffix(".jpg"), "JPEG", quality=94)
            else:
                shutil.copy2(path, out)
            return f"copy {rel}"
        return f"---- {rel}"
    except Exception as exc:  # noqa: BLE001
        return f"FAIL {rel}: {exc}"


if __name__ == "__main__":
    files = sorted(p for p in SRC.rglob("*") if p.is_file())
    print(f"{len(files)} files", flush=True)
    ok = fail = 0
    with ProcessPoolExecutor() as pool:
        for line in pool.map(convert, files, chunksize=4):
            if line.startswith("FAIL"):
                fail += 1
                print(line, flush=True)
            else:
                ok += 1
    print(f"done: {ok} ok, {fail} failed", flush=True)
    sys.exit(1 if fail else 0)
