#!/usr/bin/env python3
"""Generate FlutterFilms PWA icon PNGs for manifest and Apple touch icon."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BG = (10, 10, 12)
ACCENT = (74, 158, 255)
TEXT = (245, 247, 250)


def draw_icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    inset = int(size * (0.12 if maskable else 0.08))
    radius = int(size * 0.18)
    draw.rounded_rectangle(
        (inset, inset, size - inset, size - inset),
        radius=radius,
        fill=ACCENT,
    )
    font_size = max(12, int(size * 0.22))
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()
    label = "FF"
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, (size - th) / 2 - bbox[1]), label, fill=TEXT, font=font)
    return img


def main() -> None:
    sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]
    for size in sizes:
        purpose = "maskable" if size in (192, 512) else "any"
        img = draw_icon(size, maskable=purpose == "maskable")
        img.save(OUT / f"icon-{size}.png", format="PNG")
    draw_icon(180).save(OUT / "apple-touch-icon.png", format="PNG")
    draw_icon(32).save(ROOT / "public" / "favicon.png", format="PNG")
    print(f"Wrote icons to {OUT}")

if __name__ == "__main__":
    main()
