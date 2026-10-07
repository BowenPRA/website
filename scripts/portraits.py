"""Build the staff portraits for the team cards on /about/.

    python scripts/portraits.py                 build every portrait
    python scripts/portraits.py seth caleb      build just these
    python scripts/portraits.py --sheet         also write originals/_review/portraits-sheet.jpg
    python scripts/portraits.py --measure       print each face's numbers and the grade they lead to

Each person is cut out of their photo and stands on a coloured card (.team in main.css).
Everyone is framed and graded by the same rules, measured from the face, so the cards
read as one set however different the photos were:

  Framing   A face detector (YuNet, OpenCV) finds the eyes and the mouth. The card is
            scaled so the face is the same size on every card (FACE) and placed so the
            eyes sit on the same line (EYES). Nothing is measured by hand. A person whose
            photo stops too high for that framing is zoomed in just far enough to reach
            the bottom of the card, and the script says so.
  Cutout    BiRefNet-portrait (MIT licence, run through rembg) gives a soft matte that
            keeps hair. The colour of every edge pixel is then re-estimated without the
            old backdrop (pymatting), so no grey or white rim shows on the card.
  Grade     White balance from the photo's own backdrop where it is a plain wall, then
            exposure, contrast and colour pulled part of the way to a common target
            measured on the cheeks. Part of the way, so skin tones stay each person's own;
            the aim is the same light, not the same face. No retouching of faces.

originals/portraits.json is an array of:
  {
    "slug": "seth",                       // matches a team.json member
    "src":  "staff/Mr-Seth-2026.jpg",     // under originals/
    "alt":  "Mr. Seth",
    "wb":   "backdrop" | "skin" | "none", // optional, default "backdrop" (falls back to skin
                                          //   when the backdrop is blown out or coloured)
    "grade": {"exposure": 0.1, "temp": 0.05, "tint": 0, "contrast": 0.05, "saturation": 0},
                                          // optional: added to the measured grade
    "nudge": [0, 0],                      // optional: move the face [right, down] in face units
    "zoom": 1.0                           // optional: >1 makes this face bigger than the rest
  }

Output: src/assets/img/team/<slug>-{360,720}.webp (4:5, alpha) and src/_data/cutouts.json.
The matte is cached in originals/_cache/portraits/, so a change to the grade is quick.

Needs: pip install rembg pymatting opencv-python pillow numpy
and the face model at originals/_models/face_detection_yunet_2023mar.onnx
(https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet).
"""
import hashlib
import json
import math
import os
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ORIG = ROOT / "originals"
OUT = ROOT / "src" / "assets" / "img" / "team"
DATA = ROOT / "src" / "_data" / "cutouts.json"
CACHE = ORIG / "_cache" / "portraits"
YUNET = ORIG / "_models" / "face_detection_yunet_2023mar.onnx"
MATTE_MODEL = os.environ.get("PORTRAIT_MATTE", "birefnet-portrait")

# The framing everyone shares, as fractions of the 4:5 card.
ASPECT = 5 / 4     # height over width
EYES = 0.41        # the eye line, down from the top of the card
FACE = 0.163       # face size (mean of eye-to-eye and eyes-to-mouth) over card width
WIDTHS = (360, 720)
WORK = 1440        # the widest the card is worked at before the final resize

# The grade's targets, measured on the cheeks (CIE Lab) and pulled toward PULL of the way.
SKIN_L = 67.0
SKIN_C = 24.0      # chroma
SKIN_H = 55.0      # hue angle in degrees: lower is pinker, higher is yellower
PULL = 0.65
WARM = 0.025       # the house lean: neutral, slightly warm


# ---------- colour helpers ----------

def to_linear(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def to_srgb(x):
    x = np.clip(x, 0, None)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def luma(x):
    return x[..., 0] * 0.2126 + x[..., 1] * 0.7152 + x[..., 2] * 0.0722


def lab(rgb):
    """sRGB 0..1 float32 -> CIE Lab (L 0..100)."""
    return cv2.cvtColor(rgb.astype(np.float32), cv2.COLOR_RGB2Lab)


def from_lab(x):
    return cv2.cvtColor(x.astype(np.float32), cv2.COLOR_Lab2RGB)


def y_of_l(L):
    return ((L + 16) / 116) ** 3 if L > 8 else L / 903.3


def shoulder(x, knee=0.82):
    """Roll bright values off towards 1 instead of clipping them flat."""
    over = np.clip(x - knee, 0, None)
    return np.where(x > knee, knee + (1 - knee) * (1 - np.exp(-over / (1 - knee))), x)


# ---------- the face ----------

def find_face(rgb):
    h, w = rgb.shape[:2]
    s = min(1.0, 1400 / max(h, w))
    small = cv2.resize(rgb, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    det = cv2.FaceDetectorYN.create(str(YUNET), "", (small.shape[1], small.shape[0]), 0.6, 0.3, 5000)
    _, faces = det.detect(cv2.cvtColor(small, cv2.COLOR_RGB2BGR))
    if faces is None:
        raise SystemExit("no face found")
    f = max(faces, key=lambda f: f[2] * f[3]) / s
    pts = f[4:14].reshape(5, 2)
    eyes, mouth = pts[:2], pts[3:5]
    eye = eyes.mean(0)
    mth = mouth.mean(0)
    ipd = float(np.linalg.norm(eyes[1] - eyes[0]))
    em = float(np.linalg.norm(mth - eye))
    return {
        "eyes": eyes, "eye": eye, "mouth": mth, "nose": pts[2],
        "size": (ipd + em) / 2, "ipd": ipd, "em": em,
        "cx": float((eye[0] + mth[0]) / 2),
    }


# ---------- the cutout ----------

_session = None


def matte(rgb_u8):
    """Soft alpha 0..1 from BiRefNet-portrait."""
    global _session
    if _session is None:
        from rembg import new_session
        _session = new_session(MATTE_MODEL)
    mask = _session.predict(Image.fromarray(rgb_u8))[0]
    return np.asarray(mask).astype(np.float32) / 255


def clean_alpha(a):
    """Tidy the model's matte: no faint haze far from the person, solid inside."""
    a = np.where(a < 0.03, 0, a)
    a = np.where(a > 0.97, 1, a)
    # keep only the person: the largest solid piece and the soft edge around it
    solid = (a > 0.5).astype(np.uint8)
    n, lab_, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    if n > 2:
        biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        keep = (lab_ == biggest).astype(np.uint8)
        near = cv2.dilate(keep, np.ones((25, 25), np.uint8))
        a = a * near
    return a.astype(np.float32)


def decontaminate(rgb, a):
    """Re-estimate edge colours without the old backdrop, so hair does not carry a grey rim."""
    from pymatting import estimate_foreground_ml
    fg = estimate_foreground_ml(rgb.astype(np.float64), a.astype(np.float64))
    fg = np.clip(fg, 0, 1).astype(np.float32)
    # only where the matte is soft: solid areas keep their own pixels exactly
    w = np.clip((1 - a) * 4, 0, 1)[..., None]
    return rgb * (1 - w) + fg * w


# ---------- measuring for the grade ----------

def cheek_mask(shape, face, box, scale):
    """Two discs on the cheeks and one on the bridge of the nose, in card coordinates."""
    h, w = shape
    m = np.zeros((h, w), np.uint8)
    em = face["em"] * scale
    for ex, ey in face["eyes"]:
        x = (ex - box[0]) * scale
        y = (ey - box[1]) * scale + 0.55 * em
        cv2.circle(m, (round(x), round(y)), max(3, round(0.22 * em)), 1, -1)
    nx, ny = face["nose"]
    cv2.circle(m, (round((nx - box[0]) * scale), round((ny - box[1]) * scale - 0.25 * em)),
               max(3, round(0.14 * em)), 1, -1)
    return m.astype(bool)


def measure(rgb, a, face, box, scale, backdrop):
    """Numbers the grade is worked out from."""
    sk = cheek_mask(a.shape, face, box, scale) & (a > 0.98)
    L = lab(rgb)
    px = L[sk]
    # drop the darkest and brightest tenth: stubble, glasses, shine
    lo, hi = np.percentile(px[:, 0], [12, 92])
    px = px[(px[:, 0] >= lo) & (px[:, 0] <= hi)]
    sL, sa, sb = (float(np.median(px[:, k])) for k in range(3))
    # how flat the light is: the spread of brightness over the face oval, which takes in the
    # hair at its edge too, so dark hair round a pale face reads as already contrasty
    em = face["em"] * scale
    ex, ey = (face["eye"] - box[:2]) * scale
    fm = np.zeros(a.shape, np.uint8)
    cv2.ellipse(fm, (round(ex), round(ey + 0.35 * em)), (round(1.05 * em), round(1.45 * em)), 0, 0, 360, 1, -1)
    fL = L[..., 0][(fm > 0) & (a > 0.98)]
    spread = float(np.percentile(fL, 95) - np.percentile(fL, 5))
    return {"L": sL, "a": sa, "b": sb, "C": math.hypot(sa, sb), "h": math.degrees(math.atan2(sb, sa)),
            "spread": spread, "backdrop": backdrop}


def backdrop_colour(rgb, a):
    """The wall behind the person, if it is a plain wall that has not blown out."""
    far = cv2.erode((a < 0.01).astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)
    if far.mean() < 0.05:
        return None
    px = rgb[far]
    med = np.median(px, axis=0)
    if med.max() > 0.95 or med.max() < 0.25:
        return None                       # blown out or too dark to trust
    spread = np.percentile(px, 75, axis=0) - np.percentile(px, 25, axis=0)
    if spread.max() > 0.12:
        return None                       # not plain: shelves, bricks, a garden
    lin = to_linear(med)
    chroma = (lin.max() - lin.min()) / max(lin.max(), 1e-4)
    if chroma > 0.25:
        return None                       # a coloured wall says nothing about the light
    return lin


# ---------- the grade ----------

def suggest(m, spec):
    """Turn the measurements into a grade, then add the person's own adjustments."""
    g = {"gains": [1.0, 1.0, 1.0], "exposure": 0.0, "contrast": 0.0, "saturation": 0.0}
    mode = spec.get("wb", "backdrop")
    gains = np.ones(3)
    if mode == "backdrop" and m["backdrop"] is not None:
        bd = m["backdrop"]
        gains = (bd.mean() / bd) ** 0.8                      # most of the way to a neutral wall
    elif mode in ("backdrop", "skin"):
        # no usable wall: nudge the skin's hue toward the common one, gently
        dh = SKIN_H - m["h"]
        t = np.clip(dh / 25, -1, 1) * 0.05
        gains = np.array([1 - t * 0.3, 1 + t * 0.2, 1 - t])  # yellower = less blue
    gains = np.clip(gains, 0.88, 1.12)
    gains *= np.array([1 + WARM, 1, 1 - WARM])
    gains /= luma(gains[None, :])[0]
    g["gains"] = gains.tolist()

    target = m["L"] + PULL * (SKIN_L - m["L"])
    g["exposure"] = float(np.clip(math.log2(y_of_l(target) / y_of_l(m["L"])), -0.6, 0.8))
    # flat light gets a little contrast, an already-contrasty face a touch less
    g["contrast"] = float(np.clip((38 - m["spread"]) / 38 * 0.6, -0.12, 0.3))
    # chroma part of the way to the common skin chroma
    g["saturation"] = float(np.clip(PULL * (SKIN_C - m["C"]) / max(m["C"], 1), -0.2, 0.25))

    extra = spec.get("grade", {})
    g["exposure"] += extra.get("exposure", 0)
    g["contrast"] += extra.get("contrast", 0)
    g["saturation"] += extra.get("saturation", 0)
    t, ti = extra.get("temp", 0), extra.get("tint", 0)
    if t or ti:
        k = np.array(g["gains"]) * np.array([1 + 0.12 * t, 1 - 0.06 * ti, 1 - 0.12 * t])
        g["gains"] = (k / luma(k[None, :])[0]).tolist()
    return g


def grade(rgb, g):
    lin = to_linear(rgb) * np.array(g["gains"], np.float32) * (2 ** g["exposure"])
    x = to_srgb(shoulder(lin)).astype(np.float32)
    c = g["contrast"]
    if c:
        y = np.clip(luma(x), 1e-4, 1)
        y2 = y + c * (y - 0.5) * 4 * y * (1 - y)
        x = x * (y2 / y)[..., None]
        x = x / np.clip(x.max(-1, keepdims=True), 1, None)
    s = g["saturation"]
    if s:
        L = lab(np.clip(x, 0, 1))
        C = np.hypot(L[..., 1], L[..., 2])
        k = 1 + s * np.clip(1 - C / 60, 0.3, 1)               # strong colours move less
        L[..., 1] *= k
        L[..., 2] *= k
        x = from_lab(L)
    return np.clip(x, 0, 1).astype(np.float32)


def sharpen(rgba, amount=0.35):
    """Brightness edges only, after the resize; flat skin is left alone."""
    rgb = rgba[..., :3].astype(np.float32) / 255
    ycc = cv2.cvtColor(rgb, cv2.COLOR_RGB2YCrCb)
    y = ycc[..., 0]
    d = y - cv2.GaussianBlur(y, (0, 0), 1.0)
    d = np.sign(d) * np.clip(np.abs(d) - 0.01, 0, None)
    ycc[..., 0] = np.clip(y + 2 * amount * d, 0, 1)
    out = rgba.copy()
    out[..., :3] = (cv2.cvtColor(ycc, cv2.COLOR_YCrCb2RGB).clip(0, 1) * 255 + 0.5).astype(np.uint8)
    return out


# ---------- framing ----------

def frame(face, w, h, spec):
    """The card's box in source pixels: [left, top, width, height]."""
    zoom = spec.get("zoom", 1.0)
    cw = face["size"] / (FACE * zoom)
    ch = cw * ASPECT
    dx, dy = spec.get("nudge", [0, 0])
    cx = face["cx"] + dx * face["size"]
    ey = face["eye"][1] + dy * face["size"]
    return [cx - cw / 2, ey - EYES * ch, cw, ch]


def fit_bottom(box, face, h):
    """If the photo stops above the card's bottom edge, zoom in until it does not."""
    left, top, cw, ch = box
    if top + ch <= h:
        return box, 1.0
    eye_y = face["eye"][1]
    # keep the eyes on their line: the part below them must shrink to fit
    below = h - eye_y
    ch2 = below / (1 - EYES)
    k = ch / ch2
    cw2 = ch2 / ASPECT
    cx = left + cw / 2
    return [cx - cw2 / 2, eye_y - EYES * ch2, cw2, ch2], k


def cut_box(rgb, box, pad):
    """Cut box (plus pad on every side, for context) out of the photo at whole pixels;
    whatever lies outside the photo is filled from its edge and marked."""
    h, w = rgb.shape[:2]
    left, top, cw, ch = box
    x0, y0 = math.floor(left - pad), math.floor(top - pad)
    x1, y1 = math.ceil(left + cw + pad), math.ceil(top + ch + pad)
    inside = np.zeros((y1 - y0, x1 - x0), bool)
    ix0, iy0, ix1, iy1 = max(0, x0), max(0, y0), min(w, x1), min(h, y1)
    inside[iy0 - y0:iy1 - y0, ix0 - x0:ix1 - x0] = True
    crop = cv2.copyMakeBorder(rgb[iy0:iy1, ix0:ix1], iy0 - y0, y1 - iy1, ix0 - x0, x1 - ix1,
                              cv2.BORDER_REPLICATE)
    return crop, inside, (x0, y0)


# ---------- build ----------

def load(path):
    im = ImageOps.exif_transpose(Image.open(path))
    if im.mode in ("RGBA", "LA", "PA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    return np.asarray(im.convert("RGB"))


def build(spec, sheet_tiles, measure_only=False):
    slug = spec["slug"]
    rgb8 = load(ORIG / spec["src"])
    h, w = rgb8.shape[:2]
    face = find_face(rgb8)
    box = frame(face, w, h, spec)
    box, zoomed = fit_bottom(box, face, h)

    # work at no more than WORK pixels across the card; never enlarge here
    scale = min(1.0, WORK / box[2])
    pad = 0.06 * box[2]
    crop, inside, (ox, oy) = cut_box(rgb8, box, pad)
    if scale < 1:
        size = (round(crop.shape[1] * scale), round(crop.shape[0] * scale))
        crop = cv2.resize(crop, size, interpolation=cv2.INTER_AREA)
        inside = cv2.resize(inside.astype(np.uint8), size, interpolation=cv2.INTER_NEAREST).astype(bool)

    key = hashlib.sha1(json.dumps([spec["src"], MATTE_MODEL, [round(float(v), 1) for v in box], WORK]).encode()).hexdigest()[:10]
    cached = CACHE / f"{slug}-{key}.png"
    if cached.exists():
        a = np.asarray(Image.open(cached)).astype(np.float32) / 255
    else:
        a = matte(crop)
        CACHE.mkdir(parents=True, exist_ok=True)
        Image.fromarray((a * 255 + 0.5).astype(np.uint8)).save(cached)
    a = clean_alpha(a)
    a = a * inside                          # nothing from outside the photo

    rgb = crop.astype(np.float32) / 255
    # the card box within the crop, in working pixels
    bx0 = (box[0] - ox) * scale
    by0 = (box[1] - oy) * scale
    m = measure(rgb, a, face, np.array([ox, oy]), scale, backdrop_colour(rgb, a))
    g = suggest(m, spec)
    report = (f"{slug:7} skin L{m['L']:5.1f} C{m['C']:5.1f} h{m['h']:5.1f}  face spread {m['spread']:4.1f}  "
              f"wall {'none' if m['backdrop'] is None else 'yes '}  ->  ev {g['exposure']:+.2f}  "
              f"contrast {g['contrast']:+.2f}  sat {g['saturation']:+.2f}  gains "
              + " ".join(f"{v:.3f}" for v in g["gains"])
              + (f"   zoomed x{zoomed:.2f} to reach the bottom" if zoomed > 1.001 else ""))
    print(report)
    if measure_only:
        return None

    rgb = decontaminate(rgb, a)
    rgb = grade(rgb, g)

    # cut the card out of the working crop (sub-pixel accurate) and make the sizes
    cw_px = box[2] * scale
    ch_px = box[3] * scale
    rgba = np.dstack([rgb, a]).astype(np.float32)
    # premultiply before any resampling, so edges do not pick up dark or pale fringes
    pm = rgba.copy()
    pm[..., :3] *= pm[..., 3:4]
    out = {}
    for width in WIDTHS:
        height = round(width * ASPECT)
        sx = width / cw_px
        M = np.array([[sx, 0, -bx0 * sx], [0, sx, -by0 * sx]], np.float32)
        interp = cv2.INTER_AREA if sx < 1 else cv2.INTER_LANCZOS4
        if sx < 1:
            # INTER_AREA is only used by resize, so resize first, then shift
            small = cv2.resize(pm, (round(pm.shape[1] * sx), round(pm.shape[0] * sx)), interpolation=cv2.INTER_AREA)
            M2 = np.array([[1, 0, -bx0 * sx], [0, 1, -by0 * sx]], np.float32)
            res = cv2.warpAffine(small, M2, (width, height), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        else:
            res = cv2.warpAffine(pm, M, (width, height), flags=interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        res = np.clip(res, 0, 1)
        al = res[..., 3:4]
        col = np.where(al > 1e-4, res[..., :3] / np.maximum(al, 1e-4), 0)
        rgba8 = (np.dstack([np.clip(col, 0, 1), al]) * 255 + 0.5).astype(np.uint8)
        rgba8 = sharpen(rgba8, 0.3 if width <= 400 else 0.35)
        OUT.mkdir(parents=True, exist_ok=True)
        Image.fromarray(rgba8, "RGBA").save(OUT / f"{slug}-{width}.webp", quality=84, alpha_quality=92, method=6)
        out[width] = rgba8
    sheet_tiles.append((slug, out[WIDTHS[-1]]))
    widest = WIDTHS[-1]
    return {"alt": spec["alt"], "width": widest, "height": round(widest * ASPECT), "sizes": list(WIDTHS)}


TINTS = [("#116DFF", "#1F8F73"), ("#48971D", "#FFC857"), ("#7C5CFF", "#116DFF"),
         ("#FF6F59", "#FFC857"), ("#1F8F73", "#9CC64A"), ("#0B4FBF", "#7C5CFF")]


def card(rgba, tint, w=288):
    """The portrait on its card the way main.css draws it, for the contact sheet."""
    h = round(w * ASPECT)
    a_, b_ = (np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255 for c in tint)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # 165deg linear gradient, roughly top-left to bottom-right
    ang = math.radians(165)
    dx, dy = math.sin(ang), -math.cos(ang)
    t = ((xx - w / 2) * dx + (yy - h / 2) * dy)
    t = (t - t.min()) / (t.max() - t.min())
    bg = a_ * (1 - t[..., None]) + b_ * t[..., None]
    rx, ry = 0.64 * w, 0.52 * h
    d = np.sqrt(((xx - 0.5 * w) / rx) ** 2 + ((yy - 0.26 * h) / ry) ** 2)
    glow = np.clip(1 - d / 0.72, 0, 1) * 0.3
    bg = bg + (1 - bg) * glow[..., None]
    p = cv2.resize(rgba.astype(np.float32) / 255, (w, h), interpolation=cv2.INTER_AREA)
    al = p[..., 3:4]
    comp = p[..., :3] * al + bg * (1 - al)
    return (comp * 255 + 0.5).astype(np.uint8)


def write_sheet(tiles):
    team = json.loads((ROOT / "src" / "_data" / "team.json").read_text(encoding="utf8"))
    tint_of = {m["slug"]: m.get("tint", 1) for m in team["members"]}
    order = [m["slug"] for m in team["members"]]
    tiles = sorted(tiles, key=lambda t: order.index(t[0]) if t[0] in order else 99)
    w, gap = 288, 16
    h = round(w * ASPECT)
    cols = 4 if len(tiles) > 3 else len(tiles)
    rows = math.ceil(len(tiles) / cols)
    sheet = np.full((rows * (h + gap) + gap, cols * (w + gap) + gap, 3), 238, np.uint8)
    for i, (slug, rgba) in enumerate(tiles):
        x = gap + (i % cols) * (w + gap)
        y = gap + (i // cols) * (h + gap)
        sheet[y:y + h, x:x + w] = card(rgba, TINTS[(tint_of.get(slug, 1) - 1) % 6], w)
        cv2.putText(sheet, slug, (x + 8, y + h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    path = ORIG / "_review" / "portraits-sheet.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(sheet).save(path, quality=88)
    print(f"contact sheet -> {path}")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if not YUNET.exists():
        raise SystemExit(f"The face model is missing: {YUNET}")
    specs = json.loads((ORIG / "portraits.json").read_text(encoding="utf8"))
    try:
        data = json.loads(DATA.read_text(encoding="utf8"))
    except FileNotFoundError:
        data = {}
    tiles = []
    for spec in specs:
        if args and spec["slug"] not in args:
            continue
        res = build(spec, tiles, measure_only="--measure" in flags)
        if res:
            data[spec["slug"]] = res
    if "--measure" in flags:
        return
    order = [s["slug"] for s in specs]
    data = {k: data[k] for k in order if k in data}
    DATA.write_text(json.dumps(data, indent=2) + "\n", encoding="utf8", newline="\n")
    print(f"{len(data)} portraits -> src/assets/img/team/")
    if "--sheet" in flags or not args:
        write_sheet(tiles)


if __name__ == "__main__":
    main()
