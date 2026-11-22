"""P0-E06-T01: fake TDW scans and a fake manuscript, to measure MB per page (AS-11, AS-12).

Spike code (BUILD_PLAN §2 rule): throwaway, fake data only. No real form, signature or name.
It draws the text of each TDW form (docs/reference/tdw-forms/text/) on a page, adds fake
ink marks, and "scans" the page in the common ways a Student or Coordinator makes a scan.

Run:  python spec/spikes/fake_scans.py [out_dir]
Needs: Pillow and PyMuPDF (spike tools only, not app dependencies). Output files go to
out_dir (default: a temp folder). Do not commit them. The script prints a Markdown table.
"""

import io
import random
import sys
import tempfile
import textwrap
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FORMS = ROOT / "docs" / "reference" / "tdw-forms" / "text"
MB = 1024 * 1024
random.seed(7)  # Same output on each run.

# Letter size (PUP forms use 8.5 x 11 in). Text area holds about 100 columns and 66 lines.
PAGE_IN = (8.5, 11.0)
COLS, LINES = 100, 66


def font(size: int) -> ImageFont.ImageFont:
    for name in ("cour.ttf", "DejaVuSansMono.ttf", "LiberationMono-Regular.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def form_pages(path: Path) -> list[list[str]]:
    """Wraps the form text and splits it into pages. The page count is an estimate (AS-12)."""
    raw = [l.rstrip() for l in path.read_text(encoding="utf-8", errors="replace").splitlines()]
    while raw and not raw[0].strip():
        raw.pop(0)
    lines: list[str] = []
    for l in raw:
        lines.extend(textwrap.wrap(l, COLS, replace_whitespace=False) or [""])
    return [lines[i : i + LINES] for i in range(0, len(lines), LINES)] or [[]]


def draw_page(lines: list[str], dpi: int) -> Image.Image:
    w, h = int(PAGE_IN[0] * dpi), int(PAGE_IN[1] * dpi)
    img = Image.new("RGB", (w, h), (252, 251, 247))
    d = ImageDraw.Draw(img)
    margin = int(0.6 * dpi)
    fsize = int((w - 2 * margin) / COLS / 0.6)
    f = font(fsize)
    step = (h - 2 * margin) / LINES
    for i, line in enumerate(lines):
        d.text((margin, margin + i * step), line, fill=(20, 20, 20), font=f)
    # Fake handwriting: filled-in fields and two signatures in blue ink (fake marks only).
    for _ in range(6):
        x, y = random.randint(margin, w // 2), random.randint(margin, h - margin)
        pts = [(x + k * dpi // 20, y + random.randint(-dpi // 30, dpi // 30)) for k in range(25)]
        d.line(pts, fill=(25, 40, 140), width=max(2, dpi // 100))
    for _ in range(2):
        x, y = random.randint(w // 2, w - 2 * margin), random.randint(h // 2, h - margin)
        pts = [(x + k * dpi // 25, y + int(dpi / 8 * ((k % 5) - 2) / 2)) for k in range(30)]
        d.line(pts, fill=(15, 30, 120), width=max(2, dpi // 80), joint="curve")
    return img


def scan(img: Image.Image, phone: bool = False) -> Image.Image:
    """Makes the page look scanned: tilt, slight blur, paper grain. Phone photos get shading."""
    img = img.rotate(random.uniform(-0.8, 0.8), resample=Image.BICUBIC, expand=False, fillcolor=(235, 235, 230))
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    noise = Image.effect_noise(img.size, 18 if phone else 8).convert("RGB")
    img = Image.blend(img, noise, 0.06 if phone else 0.03)
    if phone:
        shade = Image.linear_gradient("L").resize(img.size).convert("RGB")
        img = Image.blend(img, shade, 0.12)
    return img


def jpeg(img: Image.Image, gray: bool, q: int) -> bytes:
    buf = io.BytesIO()
    (img.convert("L") if gray else img).save(buf, "JPEG", quality=q, optimize=True)
    return buf.getvalue()


def pdf_of_jpegs(pages: list[bytes]) -> bytes:
    """Puts JPEG pages into a PDF without re-encoding, as scanner software does."""
    doc = pymupdf.open()
    for data in pages:
        p = doc.new_page(width=PAGE_IN[0] * 72, height=PAGE_IN[1] * 72)
        p.insert_image(p.rect, stream=data)
    return doc.tobytes(garbage=3, deflate=True)


# Scan profiles: (name, dpi, gray, jpeg quality, phone photo)
PROFILES = [
    ("Scanner 200 dpi gray", 200, True, 80, False),
    ("Scanner 300 dpi gray", 300, True, 80, False),
    ("Scanner 300 dpi color", 300, False, 85, False),
    ("Phone photo 12 MP color", 0, False, 90, True),
]


def phone_size_page(lines: list[str]) -> Image.Image:
    # A 12 MP phone photo (4000 x 3000) of a portrait page: about 3000 x 4000 pixels.
    return draw_page(lines, 360).resize((3000, 4000))


def scans(out: Path) -> list[tuple]:
    rows = []
    for path in sorted(FORMS.glob("TDW Form No. *.txt")):
        form_no = path.name.split(" - ")[0].replace("TDW Form No. ", "TDW ")
        pages = form_pages(path)
        for name, dpi, gray, q, phone in PROFILES:
            imgs = [scan(phone_size_page(p) if phone else draw_page(p, dpi), phone) for p in pages]
            jpgs = [jpeg(i, gray, q) for i in imgs]
            pdf = pdf_of_jpegs(jpgs)
            stem = f"{form_no.replace(' ', '')}_{name.replace(' ', '_')}"
            (out / f"{stem}.pdf").write_bytes(pdf)
            (out / f"{stem}_p1.jpg").write_bytes(jpgs[0])
            rows.append((form_no, name, len(pages), sum(map(len, jpgs)) / MB, len(pdf) / MB))
    return rows


FAKE_WORDS = (
    "system thesis data model network signal design result method test analysis sensor "
    "circuit performance accuracy proposed study chapter figure table value error rate "
    "the of and to in for with on by is are was were this that from as an be at"
).split()


def fake_text(n: int) -> str:
    return " ".join(random.choice(FAKE_WORDS) for _ in range(n)).capitalize() + "."


def manuscript(out: Path, pages: int = 100, figure_every: int = 0) -> float:
    """A fake text manuscript as a word processor exports it. Some pages hold one figure."""
    doc = pymupdf.open()
    for n in range(pages):
        p = doc.new_page(width=612, height=792)
        y = 72
        if figure_every and n % figure_every == 0:
            fig = scan(draw_page([fake_text(12)] * 20, 150))  # A photo-like raster figure.
            p.insert_image(pymupdf.Rect(72, 72, 540, 400), stream=jpeg(fig, False, 85))
            y = 420
        p.insert_textbox(pymupdf.Rect(72, y, 540, 720), " ".join(fake_text(14) for _ in range(30)), fontsize=11, fontname="tiro")
    data = doc.tobytes(garbage=3, deflate=True)
    (out / f"manuscript_{pages}p_fig{figure_every}.pdf").write_bytes(data)
    return len(data) / MB


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.mkdtemp(prefix="p0-scans-"))
    out.mkdir(parents=True, exist_ok=True)
    rows = scans(out)
    print(f"Output: {out}\n")
    print("| Form | Scan profile | Pages (estimate) | JPEG MB (all pages) | PDF MB | PDF MB per page |")
    print("| :---- | :---- | ----: | ----: | ----: | ----: |")
    for f, name, n, j, p in rows:
        print(f"| {f} | {name} | {n} | {j:.2f} | {p:.2f} | {p / n:.2f} |")
    print("\n| Profile | Mean PDF MB per page | Max PDF MB per page |")
    print("| :---- | ----: | ----: |")
    for name, *_ in PROFILES:
        per = [p / n for _, nm, n, _, p in rows if nm == name]
        print(f"| {name} | {sum(per) / len(per):.2f} | {max(per):.2f} |")
    print("\n| Fake manuscript (100 pages) | PDF MB | MB per page |")
    print("| :---- | ----: | ----: |")
    for label, every in (("Text only", 0), ("One figure every 10 pages", 10), ("One figure every 3 pages", 3)):
        mb = manuscript(out, 100, every)
        print(f"| {label} | {mb:.2f} | {mb / 100:.3f} |")


if __name__ == "__main__":
    main()
