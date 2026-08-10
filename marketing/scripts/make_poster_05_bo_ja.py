"""
Generates the "Бо я буду з тобою" scholarship poster (1080x1350).
Reuses marketing/fonts and the gold-K logo, matching the poster-01/02 style.

Edit the CONTENT constants below and rerun:
    python3 marketing/scripts/make_poster_05_bo_ja.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT_DIR = os.path.join(ROOT, "marketing/fonts")
OUT_DIR = os.path.join(ROOT, "marketing/linkedin")
PHOTO = os.path.join(ROOT, "marketing/05_bo_ja_budu_s_toboyu/karel_ua.png")
LOGO = os.path.join(ROOT, "landing/public/images/logo-icon.png")
OUTPUT_NAME = "poster-05-bo-ja-budu-s-toboyu.png"

W, H = 1080, 1350
MARGIN = 76
GOLD = (228, 183, 80)
BG = (9, 7, 5)
WHITE = (238, 232, 222)
GRAY = (150, 140, 128)

def f(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

PF_BOLD = "PlayfairDisplay-Bold.ttf"
PF_ITALIC = "PlayfairDisplay-BoldItalic.ttf"
DM_LIGHT = "DMSans-Light.ttf"
DM_REG = "DMSans-Regular.ttf"
DM_SEMI = "DMSans-SemiBold.ttf"
DM_BOLD = "DMSans-Bold.ttf"

def wrap(draw, text, font, max_width):
    words = text.split(" ")
    lines = []
    cur = ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines

def draw_lines(draw, lines, font, x, y, fill, line_height):
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y

def accent_line(draw, x, y):
    draw.rectangle([x, y, x + 48, y + 4], fill=GOLD)

def paste_logo(canvas):
    logo = Image.open(LOGO).convert("RGBA")
    box_size = 84
    pad_right = 76
    pad_bottom = 66
    box = Image.new("RGBA", (box_size, box_size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(box)
    bd.rounded_rectangle([0, 0, box_size - 1, box_size - 1], radius=14, fill=(18, 15, 12, 255))
    icon = logo.resize((56, 56), Image.LANCZOS)
    box.paste(icon, ((box_size - 56) // 2, (box_size - 56) // 2), icon)
    x = W - pad_right - box_size
    y = H - pad_bottom - box_size
    canvas.paste(box, (x, y), box)
    return x, y, box_size

def draw_text_vcenter(draw, text, font, x, center_y, fill, anchor="l"):
    bbox = draw.textbbox((0, 0), text, font=font)
    h = bbox[3] - bbox[1]
    y = center_y - h / 2 - bbox[1]
    if anchor == "l":
        draw.text((x, y), text, font=font, fill=fill)
    elif anchor == "m":
        w = bbox[2] - bbox[0]
        draw.text((x - w / 2, y), text, font=font, fill=fill)

def make_poster():
    canvas = Image.new("RGB", (W, H), BG)

    photo_h = 650
    photo = Image.open(PHOTO).convert("RGB")
    sw, sh = photo.size
    crop_w = int(sh * (W / photo_h))
    x_offset = (sw - crop_w) // 2
    crop = photo.crop((x_offset, 0, x_offset + crop_w, sh))
    crop = crop.resize((W, photo_h), Image.LANCZOS)
    canvas.paste(crop, (0, 0))

    fade_top = photo_h - 130
    fade_h = 220
    grad = Image.new("L", (1, fade_h), color=0)
    for i in range(fade_h):
        grad.putpixel((0, i), int(255 * (i / fade_h)))
    grad = grad.resize((W, fade_h))
    overlay = Image.new("RGB", (W, fade_h), BG)
    canvas.paste(overlay, (0, fade_top), grad)

    solid = Image.new("RGB", (W, H - (fade_top + fade_h)), BG)
    canvas.paste(solid, (0, fade_top + fade_h))

    draw = ImageDraw.Draw(canvas)
    max_width = W - 2 * MARGIN

    y = photo_h + 45
    accent_line(draw, MARGIN, y)
    y += 40

    headline_font = f(PF_ITALIC, 54)
    draw.text((MARGIN, y), "Бо я буду з тобою.", font=headline_font, fill=GOLD)
    y += 74

    subtitle_font = f(PF_BOLD, 38)
    draw.text((MARGIN, y), "3 full coaching scholarships", font=subtitle_font, fill=WHITE)
    y += 56

    body_font = f(DM_REG, 29)
    body_lines = [
        "A 6-month transformational coaching program",
        "for AI and data professionals living in Ukraine.",
    ]
    y = draw_lines(draw, body_lines, body_font, MARGIN, y, GRAY, 40)
    y += 26

    normal_font = f(DM_REG, 28)
    normal_text = "Normal price: €1,800"
    draw.text((MARGIN, y), normal_text, font=normal_font, fill=GRAY)
    tw = draw.textlength(normal_text, font=normal_font)
    strike_y = y + 17
    draw.line([(MARGIN, strike_y), (MARGIN + tw, strike_y)], fill=GRAY, width=2)
    y += 46

    price_font = f(DM_BOLD, 44)
    draw.text((MARGIN, y), "Your price: €0", font=price_font, fill=GOLD)
    y += 66

    apply_font = f(DM_SEMI, 30)
    draw.text((MARGIN, y), "Apply by August 21, 2026.", font=apply_font, fill=WHITE)
    y += 42

    link_font = f(DM_REG, 26)
    draw.text((MARGIN, y), "Link in the comments ↓", font=link_font, fill=GRAY)

    logo_x, logo_y, box_size = paste_logo(canvas)
    footer_center_y = logo_y + box_size / 2

    hashtag_font = f(DM_SEMI, 24)
    hashtag_text = "#InventYourNextSelf"
    brand_font = f(DM_SEMI, 22)
    brand_text = "www.macek.ai"

    hashtag_bbox = draw.textbbox((0, 0), hashtag_text, font=hashtag_font)
    brand_bbox = draw.textbbox((0, 0), brand_text, font=brand_font)
    hashtag_h = hashtag_bbox[3] - hashtag_bbox[1]
    brand_h = brand_bbox[3] - brand_bbox[1]
    line_gap = 10

    block_h = hashtag_h + line_gap + brand_h
    block_top = footer_center_y - block_h / 2

    hashtag_y = block_top - hashtag_bbox[1]
    draw.text((MARGIN, hashtag_y), hashtag_text, font=hashtag_font, fill=GOLD)

    brand_y = block_top + hashtag_h + line_gap - brand_bbox[1]
    draw.text((MARGIN, brand_y), brand_text, font=brand_font, fill=GRAY)

    return canvas

if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    poster = make_poster()
    out_path = os.path.join(OUT_DIR, OUTPUT_NAME)
    poster.save(out_path)
    print(f"saved {out_path}")
