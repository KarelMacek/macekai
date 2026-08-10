"""
Generates the "Happy New Year" poster (1080x1080, square).
Photo band height (720) is chosen to exactly match the source photo's native
3:2 aspect ratio, so it renders with zero crop and no rotation.

Edit the CONTENT constants below and rerun:
    python3 marketing/scripts/make_poster_07_happy_new_year.py
"""
import os
from poster_kit import *

PHOTO = os.path.join(ROOT, "marketing/07_happy_new_year/happy_new_year.png")
OUTPUT_NAME = "poster-07-happy-new-year.png"

W, H = 1080, 1080
MARGIN = 68
PHOTO_H = 720  # = W / (1536/1024), the photo's exact native ratio -> zero crop


def make_poster():
    canvas = Image.new("RGB", (W, H), BG)

    photo = Image.open(PHOTO).convert("RGB")
    canvas.paste(fit_resize(photo, W, PHOTO_H), (0, 0))

    fade_to_bg(canvas, fade_top=PHOTO_H - 140, fade_h=220)

    draw = ImageDraw.Draw(canvas)
    max_width = W - 2 * MARGIN
    y = 750

    line1_font = font(PF_BOLD, 44)
    line1_lines = wrap(draw, "Za 5 měsíců si dáš novoroční předsevzetí.", line1_font, max_width)
    y = draw_lines(draw, line1_lines, line1_font, MARGIN, y, WHITE, 54)
    y += 8

    line2_font = font(PF_ITALIC, 44)
    draw.text((MARGIN, y), "Bude jiné než to letošní?", font=line2_font, fill=GOLD)
    y += 66

    small_font = font(DM_REG, 25)
    small_lines = wrap(draw, "A poznáš aspoň jednu rostlinu na obrázku ↓", small_font, max_width)
    y = draw_lines(draw, small_lines, small_font, MARGIN, y, GRAY, 34)

    logo_x, logo_y, box_size = paste_logo(canvas, W, H, pad_right=MARGIN - 8, pad_bottom=54)
    footer_center_y = logo_y + box_size / 2
    hashtag_font = font(DM_SEMI, 24)
    draw_text_vcenter(draw, "#WinterWillAsk", hashtag_font, MARGIN, footer_center_y, GOLD)

    return canvas


if __name__ == "__main__":
    poster = make_poster()
    save_poster(poster, OUTPUT_NAME)
