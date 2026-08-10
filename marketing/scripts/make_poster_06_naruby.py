"""
Generates the "Doktorát naruby" poster (1080x1350).
Reuses marketing/fonts and the gold-K logo, matching the poster-01/02/04 style.

Edit the CONTENT constants below and rerun:
    python3 marketing/scripts/make_poster_06_naruby.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT_DIR = os.path.join(ROOT, "marketing/fonts")
OUT_DIR = os.path.join(ROOT, "marketing/linkedin")
PHOTO = os.path.join(ROOT, "marketing/06_doktorat_naruby/naruby.jpg")
LOGO = os.path.join(ROOT, "landing/public/images/logo-icon.png")
OUTPUT_NAME = "poster-06-doktorat-naruby.png"

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

def draw_lines(draw, lines, font, x, y, fill, line_height):
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y

def accent_line(draw, x, y):
    draw.rectangle([x, y, x + 48, y + 4], fill=GOLD)

def cover_crop(img, target_w, target_h, anchor_x=0.5, anchor_y=0.5):
    sw, sh = img.size
    scale = max(target_w / sw, target_h / sh)
    new_w, new_h = round(sw * scale), round(sh * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    x = round((new_w - target_w) * anchor_x)
    y = round((new_h - target_h) * anchor_y)
    x = max(0, min(x, new_w - target_w))
    y = max(0, min(y, new_h - target_h))
    return resized.crop((x, y, x + target_w, y + target_h))

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

def draw_text_vcenter(draw, text, font, x, center_y, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    h = bbox[3] - bbox[1]
    y = center_y - h / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=fill)

def make_poster():
    canvas = Image.new("RGB", (W, H), BG)

    photo_h = 820
    photo = Image.open(PHOTO).convert("RGB")
    crop = cover_crop(photo, W, photo_h, anchor_x=0.5, anchor_y=0.32)
    canvas.paste(crop, (0, 0))

    fade_top = photo_h - 140
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

    y = photo_h + 40
    accent_line(draw, MARGIN, y)
    y += 38

    eyebrow_font = f(DM_SEMI, 26)
    draw.text((MARGIN, y), "DOKTORÁT NARUBY", font=eyebrow_font, fill=GOLD)
    y += 62

    line_font = f(PF_BOLD, 56)
    y = draw_lines(draw, ["Nečekej na titul.", "Začni v cíli."], line_font, MARGIN, y, WHITE, 70)

    punch_font = f(PF_ITALIC, 56)
    draw.text((MARGIN, y), "Chovej se jako vědec.", font=punch_font, fill=GOLD)

    logo_x, logo_y, box_size = paste_logo(canvas)
    footer_center_y = logo_y + box_size / 2
    hashtag_font = f(DM_SEMI, 26)
    draw_text_vcenter(draw, "#InventYourNextSelf", hashtag_font, MARGIN, footer_center_y, GOLD)

    return canvas

if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    poster = make_poster()
    out_path = os.path.join(OUT_DIR, OUTPUT_NAME)
    poster.save(out_path)
    print(f"saved {out_path}")
