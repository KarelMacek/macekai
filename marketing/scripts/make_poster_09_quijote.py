"""
Generates the "Epistemická suverenita" (Quijote) poster.
Canvas = the source photo's exact native size (941x864) -- full-bleed, no
crop, no added margin/letterboxing. Text is drawn straight on top of the
photo with a dark stroke for legibility instead of a background band.

One-off type choice (not the shared PF_BOLD/DM_SEMI brand pair from
poster_kit.py): the elegant Playfair Display read too editorial/luxury
against this raw, absurd photo. Source Serif 4 Black is sturdier and more
"intellectual paperback" while keeping serif diacritics; Inter SemiBold
gives the hashtag clean contrast without competing with the headline.

Edit the CONTENT constants below and rerun:
    python3 marketing/scripts/make_poster_09_quijote.py
"""
import os
from poster_kit import *

PHOTO = os.path.join(ROOT, "marketing/09_quijote/20260811_060233_copy.jpg")
OUTPUT_NAME = "poster-09-quijote.png"

SOURCE_SERIF = "SourceSerif4-Variable.ttf"
INTER = "Inter-Variable.ttf"


def variable_font(name, size, weight, opsz=None):
    fnt = ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    values = []
    for ax in fnt.get_variation_axes():
        if ax["name"] == b"Weight":
            values.append(weight)
        elif ax["name"] in (b"Optical Size", b"Optical size") and opsz is not None:
            values.append(opsz)
        else:
            values.append(ax["default"])
    fnt.set_variation_by_axes(values)
    return fnt


def vignette(canvas, fade_h, max_alpha=175):
    """Darkens the top of the canvas with a soft vertical gradient (photo still
    shows through) so light title/hashtag text stays legible without an outline."""
    w, h = canvas.size
    grad = Image.new("L", (1, fade_h), color=0)
    for i in range(fade_h):
        grad.putpixel((0, i), int(max_alpha * (1 - i / fade_h)))
    grad = grad.resize((w, fade_h))
    overlay = Image.new("RGB", (w, fade_h), BG)
    canvas.paste(overlay, (0, 0), grad)


def make_poster():
    photo = Image.open(PHOTO).convert("RGB")
    W, H = photo.size
    canvas = photo.copy()

    vignette(canvas, fade_h=210)

    draw = ImageDraw.Draw(canvas)
    margin = 56

    title_font = variable_font(SOURCE_SERIF, 50, weight=900, opsz=60)
    y = 46
    for line in ["EPISTEMICKÁ", "SUVERENITA"]:
        draw.text((margin, y), line, font=title_font, fill=WHITE)
        y += 54

    y += 30
    hashtag_font = variable_font(INTER, 21, weight=600, opsz=21)
    draw.text((margin, y), "#YourThinkingMatters", font=hashtag_font, fill=GOLD)

    paste_logo(canvas, W, H, pad_right=48, pad_bottom=44, box_size=76, icon_size=50)

    return canvas


if __name__ == "__main__":
    poster = make_poster()
    save_poster(poster, OUTPUT_NAME)
