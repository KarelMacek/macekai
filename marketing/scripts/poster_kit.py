"""
Shared helpers for the marketing/*/make_poster_*.py scripts.

Every poster is a small script that imports this module, builds a Pillow
canvas, and calls poster.save(...). Keeps brand tokens (fonts, colors, logo
badge) and the repeated layout mechanics (crop, fade-to-bg, logo badge,
vertically centered footer text) in one place instead of re-copied per file.

Usage sketch:
    from poster_kit import *

    W, H = 1080, 1350
    canvas = Image.new("RGB", (W, H), BG)
    photo = Image.open(PHOTO).convert("RGB")
    canvas.paste(cover_crop(photo, W, 650), (0, 0))
    fade_to_bg(canvas, fade_top=520, fade_h=220)
    draw = ImageDraw.Draw(canvas)
    ...
    paste_logo(canvas, W, H)
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT_DIR = os.path.join(ROOT, "marketing/fonts")
OUT_DIR = os.path.join(ROOT, "marketing/linkedin")
LOGO = os.path.join(ROOT, "landing/public/images/logo-icon.png")

GOLD = (228, 183, 80)
BG = (9, 7, 5)
WHITE = (238, 232, 222)
GRAY = (150, 140, 128)

PF_BOLD = "PlayfairDisplay-Bold.ttf"
PF_ITALIC = "PlayfairDisplay-BoldItalic.ttf"
DM_LIGHT = "DMSans-Light.ttf"
DM_REG = "DMSans-Regular.ttf"
DM_SEMI = "DMSans-SemiBold.ttf"
DM_BOLD = "DMSans-Bold.ttf"


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def wrap(draw, text, fnt, max_width):
    words = text.split(" ")
    lines = []
    cur = ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_lines(draw, lines, fnt, x, y, fill, line_height):
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += line_height
    return y


def accent_line(draw, x, y, width=48, height=4, fill=GOLD):
    draw.rectangle([x, y, x + width, y + height], fill=fill)


def cover_crop(img, target_w, target_h, anchor_x=0.5, anchor_y=0.5):
    """Scale+crop img to exactly fill target_w x target_h (like CSS object-fit: cover)."""
    sw, sh = img.size
    scale = max(target_w / sw, target_h / sh)
    new_w, new_h = round(sw * scale), round(sh * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    x = round((new_w - target_w) * anchor_x)
    y = round((new_h - target_h) * anchor_y)
    x = max(0, min(x, new_w - target_w))
    y = max(0, min(y, new_h - target_h))
    return resized.crop((x, y, x + target_w, y + target_h))


def fit_resize(img, target_w, target_h):
    """Resize img to exactly target_w x target_h with zero crop. Only call this
    when img's aspect ratio already matches target_w/target_h (pick the target
    band size to match the source photo instead of the other way around)."""
    return img.resize((target_w, target_h), Image.LANCZOS)


def fade_to_bg(canvas, fade_top, fade_h, bg=BG):
    """Gradient-fades the canvas from transparent to bg starting at fade_top,
    then fills solid bg for the remainder of the canvas below the fade."""
    w, h = canvas.size
    grad = Image.new("L", (1, fade_h), color=0)
    for i in range(fade_h):
        grad.putpixel((0, i), int(255 * (i / fade_h)))
    grad = grad.resize((w, fade_h))
    overlay = Image.new("RGB", (w, fade_h), bg)
    canvas.paste(overlay, (0, fade_top), grad)

    solid_top = fade_top + fade_h
    if solid_top < h:
        solid = Image.new("RGB", (w, h - solid_top), bg)
        canvas.paste(solid, (0, solid_top))


def paste_logo(canvas, canvas_w, canvas_h, pad_right=76, pad_bottom=66, box_size=84, icon_size=56, badge_fill=(18, 15, 12, 255)):
    """Pastes the gold-K logo in a rounded dark badge, bottom-right. Returns
    (x, y, box_size) of the badge so callers can vertically align footer text
    against it via draw_text_vcenter(..., center_y=y + box_size / 2)."""
    logo = Image.open(LOGO).convert("RGBA")
    box = Image.new("RGBA", (box_size, box_size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(box)
    bd.rounded_rectangle([0, 0, box_size - 1, box_size - 1], radius=14, fill=badge_fill)
    icon = logo.resize((icon_size, icon_size), Image.LANCZOS)
    box.paste(icon, ((box_size - icon_size) // 2, (box_size - icon_size) // 2), icon)
    x = canvas_w - pad_right - box_size
    y = canvas_h - pad_bottom - box_size
    canvas.paste(box, (x, y), box)
    return x, y, box_size


def draw_text_vcenter(draw, text, fnt, x, center_y, fill, anchor="l"):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    h = bbox[3] - bbox[1]
    y = center_y - h / 2 - bbox[1]
    if anchor == "l":
        draw.text((x, y), text, font=fnt, fill=fill)
    elif anchor == "m":
        w = bbox[2] - bbox[0]
        draw.text((x - w / 2, y), text, font=fnt, fill=fill)


def save_poster(canvas, output_name):
    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, output_name)
    canvas.save(out_path)
    print(f"saved {out_path}")
    return out_path
