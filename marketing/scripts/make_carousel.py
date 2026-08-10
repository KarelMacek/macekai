"""
Generates a LinkedIn carousel (1080x1350 slides): a cover with a photo + hook
headline, followed by "misto/rekni" (instead of / say this) content slides.
Reuses marketing/fonts and the gold-K logo, matching the poster-01/02 style.

Edit PHOTO / OUTPUT_PREFIX / COVER_LINES / slides_content below and rerun:
    python3 marketing/scripts/make_carousel.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT_DIR = os.path.join(ROOT, "marketing/fonts")
OUT_DIR = os.path.join(ROOT, "marketing/linkedin")
PHOTO = os.path.join(ROOT, "marketing/karel_thumbs_up.png")
LOGO = os.path.join(ROOT, "landing/public/images/logo-icon.png")
OUTPUT_PREFIX = "poster-03-pohovor-vety"

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

def accent_line(draw, x, y):
    draw.rectangle([x, y, x + 48, y + 4], fill=GOLD)

def slide_counter(draw, idx, total, x, y):
    draw.text((x, y), f"{idx} / {total}", font=f(DM_SEMI, 22), fill=GRAY)

def eyebrow_label(draw, text, x, y):
    draw.text((x, y), text, font=f(DM_SEMI, 26), fill=GOLD)

# ---------- Cover slide ----------
def make_cover(headline_lines, punch_line, subtitle, photo_path=PHOTO, photo_crop_x=200):
    canvas = Image.new("RGB", (W, H), BG)
    photo = Image.open(photo_path).convert("RGB")
    sw, sh = photo.size
    crop_w = int(sh * (W / 900))
    crop = photo.crop((photo_crop_x, 0, photo_crop_x + crop_w, sh))
    crop = crop.resize((W, 900), Image.LANCZOS)
    canvas.paste(crop, (0, 0))

    fade_top = 620
    fade_h = 380
    grad = Image.new("L", (1, fade_h), color=0)
    for i in range(fade_h):
        grad.putpixel((0, i), int(255 * (i / fade_h)))
    grad = grad.resize((W, fade_h))
    overlay = Image.new("RGB", (W, fade_h), BG)
    canvas.paste(overlay, (0, fade_top), grad)

    solid = Image.new("RGB", (W, H - (fade_top + fade_h)), BG)
    canvas.paste(solid, (0, fade_top + fade_h))

    draw = ImageDraw.Draw(canvas)
    accent_line(draw, MARGIN, 970)

    y = 1015
    headline_font = f(PF_BOLD, 62)
    lh = 74
    y = draw_lines(draw, headline_lines, headline_font, MARGIN, y, WHITE, lh)
    gold_font = f(PF_ITALIC, 62)
    y = draw_lines(draw, [punch_line], gold_font, MARGIN, y, GOLD, lh)

    y += 22
    draw.text((MARGIN, y), subtitle, font=f(DM_LIGHT, 32), fill=GRAY)

    paste_logo(canvas)
    return canvas

# ---------- Content slide ----------
def make_content(idx, total, top_label, misto_text, rekni_text):
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    draw.text((MARGIN, 90), top_label, font=f(DM_SEMI, 24), fill=GRAY)
    slide_counter(draw, idx, total, W - MARGIN - 70, 90)

    accent_line(draw, MARGIN, 200)

    max_width = W - 2 * MARGIN
    y = 250

    eyebrow_label(draw, "MÍSTO:", MARGIN, y)
    y += 54
    misto_font = f(DM_REG, 40)
    misto_lines = wrap(draw, misto_text, misto_font, max_width)
    y = draw_lines(draw, misto_lines, misto_font, MARGIN, y, WHITE, 54)

    y += 50
    draw.text((MARGIN, y), "↓", font=f(DM_SEMI, 34), fill=GOLD)
    y += 68

    eyebrow_label(draw, "ŘEKNĚTE:", MARGIN, y)
    y += 58

    rekni_font_size = 40
    rekni_font = f(DM_SEMI, rekni_font_size)
    rekni_lines = wrap(draw, rekni_text, rekni_font, max_width)
    while len(rekni_lines) * 52 > (1200 - y) and rekni_font_size > 26:
        rekni_font_size -= 2
        rekni_font = f(DM_SEMI, rekni_font_size)
        rekni_lines = wrap(draw, rekni_text, rekni_font, max_width)
    line_h = int(rekni_font_size * 1.3)
    draw_lines(draw, rekni_lines, rekni_font, MARGIN, y, GOLD, line_h)

    paste_logo(canvas)
    return canvas

# ---------- Closing / bonus slide ----------
def make_bonus(idx, total, top_label, eyebrow, question, tips):
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    draw.text((MARGIN, 90), top_label, font=f(DM_SEMI, 24), fill=GRAY)
    slide_counter(draw, idx, total, W - MARGIN - 70, 90)

    accent_line(draw, MARGIN, 200)

    max_width = W - 2 * MARGIN
    y = 250

    eyebrow_label(draw, eyebrow, MARGIN, y)
    y += 58

    question_font = f(PF_BOLD, 50)
    question_lines = wrap(draw, question, question_font, max_width)
    y = draw_lines(draw, question_lines, question_font, MARGIN, y, WHITE, 62)

    y += 60
    arrow_font = f(DM_SEMI, 34)
    tip_font = f(DM_REG, 34)
    indent = MARGIN + 54
    tip_max_width = max_width - 54
    for tip in tips:
        draw.text((MARGIN, y), "→", font=arrow_font, fill=GOLD)
        tip_lines = wrap(draw, tip, tip_font, tip_max_width)
        y2 = draw_lines(draw, tip_lines, tip_font, indent, y, WHITE, 46)
        y = y2 + 34

    paste_logo(canvas)
    return canvas

if __name__ == "__main__":
    COVER_HEADLINE = ["Tři dokonalé věty,", "které jsou na (AI) pohovoru"]
    COVER_PUNCH = "k ničemu."
    COVER_SUBTITLE = "A co říct místo nich →"
    TOP_LABEL = "TŘI VĚTY, KTERÉ NEFUNGUJÍ"

    slides_content = [
        (
            "„Chci pracovat se zajímavými technologiemi.“",
            "„Stavět RAG systém pro tisíc uživatelů jsou fakt nervy a hlavně "
            "piplačka. Mě na tom ale nejvíc baví evaluace, to je pořádná "
            "piplačka: zjistit, kde se to rozbíjí a kde to šlape.“",
        ),
        (
            "„Chci, aby moje práce měla reálný dopad.“",
            "„V poslední práci mě nejvíc bavilo, když jsme ten RAG přeprali, "
            "takže i účtárna řekla ‚okay‘. Najednou jim ta věc začala fakt "
            "šetřit čas.“",
        ),
        (
            "„Chci se učit nové věci.“",
            "„Kromě automatizace truhlíků na balkoně se chci konečně vrhnout "
            "na knowledge graphy. Myslím, že by na náš bankovní byznys mohly "
            "dobře sednout.“",
        ),
    ]

    BONUS_EYEBROW = "JEŠTĚ JEDNA VĚC:"
    BONUS_QUESTION = "Co čekáte vy osobně od této pozice?"
    BONUS_TIPS = [
        "Neříkej obecně, co si myslíš, že hiring manager chce slyšet.",
        "Popiš sebe v práci, která ti šla od ruky. A dodej „něco na ten způsob“.",
    ]

    os.makedirs(OUT_DIR, exist_ok=True)
    total = len(slides_content) + 2  # cover + content slides + closing slide

    cover = make_cover(COVER_HEADLINE, COVER_PUNCH, COVER_SUBTITLE)
    cover.save(os.path.join(OUT_DIR, f"{OUTPUT_PREFIX}-1-cover.png"))

    for i, (m, r) in enumerate(slides_content, start=2):
        img = make_content(i, total, TOP_LABEL, m, r)
        img.save(os.path.join(OUT_DIR, f"{OUTPUT_PREFIX}-{i}.png"))

    closing_idx = len(slides_content) + 2
    closing = make_bonus(closing_idx, total, TOP_LABEL, BONUS_EYEBROW, BONUS_QUESTION, BONUS_TIPS)
    closing.save(os.path.join(OUT_DIR, f"{OUTPUT_PREFIX}-{closing_idx}-closing.png"))

    print("done")
