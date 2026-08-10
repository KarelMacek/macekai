"""
Generates the "IC -> Team Lead" LinkedIn carousel (1080x1350 slides):
cover + 6 question slides (weak IC answer vs strong lead answer) +
a "common thread" recap slide + a closing punch-line slide.

Edit CONTENT below and rerun:
    python3 marketing/scripts/make_carousel_08_lead_questions.py
"""
import os
from PIL import Image, ImageOps, ImageDraw
from poster_kit import *

PHOTO = os.path.join(ROOT, "marketing/08_lead_questions/karel_icecream.jpg")
OUTPUT_PREFIX = "poster-08-lead-questions"

W, H = 1080, 1350
MARGIN = 76


def slide_counter(draw, idx, total, x, y):
    draw.text((x, y), f"{idx} / {total}", font=font(DM_SEMI, 22), fill=GRAY)


def eyebrow(draw, text, x, y, fill=GOLD, size=22):
    draw.text((x, y), text, font=font(DM_SEMI, size), fill=fill)


def fit_quote(draw, text, x, y, max_width, max_bottom, fill, start_size=32, min_size=22, bold=True):
    size = start_size
    fname = DM_SEMI if bold else DM_REG
    while size > min_size:
        fnt = font(fname, size)
        lines = wrap(draw, text, fnt, max_width)
        line_h = int(size * 1.32)
        if y + len(lines) * line_h <= max_bottom:
            break
        size -= 2
    else:
        fnt = font(fname, min_size)
        lines = wrap(draw, text, fnt, max_width)
        line_h = int(min_size * 1.32)
    return draw_lines(draw, lines, fnt, x, y, fill, line_h)


# ---------- Cover slide ----------
def make_cover(headline_lines, punch_line, subtitle, tagline):
    canvas = Image.new("RGB", (W, H), BG)
    photo = Image.open(PHOTO).convert("RGB")
    photo = ImageOps.exif_transpose(photo)
    canvas.paste(cover_crop(photo, W, 900, anchor_x=0.5, anchor_y=0.4), (0, 0))
    fade_to_bg(canvas, fade_top=620, fade_h=380)

    draw = ImageDraw.Draw(canvas)
    accent_line(draw, MARGIN, 970)

    y = 1015
    headline_font = font(PF_BOLD, 58)
    lh = 70
    y = draw_lines(draw, headline_lines, headline_font, MARGIN, y, WHITE, lh)
    gold_font = font(PF_ITALIC, 58)
    y = draw_lines(draw, [punch_line], gold_font, MARGIN, y, GOLD, lh)

    y += 20
    max_width = W - 2 * MARGIN
    sub_lines = wrap(draw, subtitle, font(DM_LIGHT, 30), max_width)
    y = draw_lines(draw, sub_lines, font(DM_LIGHT, 30), MARGIN, y, GRAY, 38)

    y += 10
    tag_lines = wrap(draw, tagline, font(DM_REG, 24), max_width)
    draw_lines(draw, tag_lines, font(DM_REG, 24), MARGIN, y, GOLD, 32)

    paste_logo(canvas, W, H)
    return canvas


# ---------- Question slide ----------
def make_question(idx, total, qnum, question, typicka, silna):
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    draw.text((MARGIN, 80), "IC → LEAD", font=font(DM_SEMI, 24), fill=GRAY)
    slide_counter(draw, idx, total, W - MARGIN - 70, 80)
    accent_line(draw, MARGIN, 130)

    max_width = W - 2 * MARGIN
    y = 168
    eyebrow(draw, f"OTÁZKA {qnum:02d}", MARGIN, y, fill=GOLD, size=24)
    y += 42

    q_font = font(PF_BOLD, 38)
    q_lines = wrap(draw, question, q_font, max_width)
    y = draw_lines(draw, q_lines, q_font, MARGIN, y, WHITE, 48)
    y += 34

    eyebrow(draw, "TYPICKÁ ODPOVĚĎ IC", MARGIN, y, fill=GRAY, size=21)
    y += 36
    t_font = font(DM_REG, 27)
    t_lines = wrap(draw, f"„{typicka}“", t_font, max_width)
    y = draw_lines(draw, t_lines, t_font, MARGIN, y, GRAY, 36)
    y += 30

    draw.text((MARGIN, y), "↓", font=font(DM_SEMI, 30), fill=GOLD)
    y += 48

    eyebrow(draw, "SILNÁ ODPOVĚĎ", MARGIN, y, fill=GOLD, size=21)
    y += 38
    fit_quote(draw, f"„{silna}“", MARGIN, y, max_width, max_bottom=1225, fill=GOLD, start_size=30, min_size=21)

    paste_logo(canvas, W, H)
    return canvas


# ---------- Closing discussion-question slide ----------
def make_discussion(idx, total, eyebrow_text, question, cta, hashtag):
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    draw.text((MARGIN, 80), "IC → LEAD", font=font(DM_SEMI, 24), fill=GRAY)
    slide_counter(draw, idx, total, W - MARGIN - 70, 80)
    accent_line(draw, MARGIN, 560)

    max_width = W - 2 * MARGIN
    y = 600
    eyebrow(draw, eyebrow_text, MARGIN, y, fill=GOLD, size=26)
    y += 56

    q_font = font(PF_BOLD, 48)
    y = draw_lines(draw, wrap(draw, question, q_font, max_width), q_font, MARGIN, y, WHITE, 60)
    y += 30

    draw.text((MARGIN, y), cta, font=font(DM_SEMI, 28), fill=GOLD)

    logo_x, logo_y, box_size = paste_logo(canvas, W, H)
    footer_center_y = logo_y + box_size / 2
    draw_text_vcenter(draw, hashtag, font(DM_SEMI, 24), MARGIN, footer_center_y, GOLD)
    return canvas


if __name__ == "__main__":
    COVER_HEADLINE = ["Individual Contributor"]
    COVER_PUNCH = "→ Team Lead"
    COVER_SUBTITLE = "6 otázek na pohovor, kde se ledaskdo zapotí"
    COVER_TAGLINE = "Vy to zvládnete s chladnou hlavou ↓"

    QUESTIONS = [
        (
            "Zdědíte člověka, kterého byste sami nikdy nenabrali. Co uděláte?",
            "Zjistím jeho silné stránky, budu ho mentorovat a najdu mu vhodnější práci.",
            "Svůj první dojem bych bral jako hypotézu, ne jako verdikt. Zjistil bych, proč "
            "byl člověk přijat, co se od něj očekává, jaké má výsledky a jaký má dopad na "
            "tým. Nastavil bych jasná očekávání, přímou zpětnou vazbu a časově omezený plán "
            "zlepšení. Pokud by problém přetrvával, udělal bych potřebné personální rozhodnutí.",
        ),
        (
            "Co vás na této roli motivuje?",
            "Větší dopad, více odpovědnosti, architektura a mentoring.",
            "Motivuje mě vytvářet prostředí, ve kterém několik lidí podává lepší výkon. "
            "Chci určovat směr, rozvíjet lidi, odstraňovat překážky a nést odpovědnost za "
            "fungování celého týmu. Zároveň chápu, že nebudu autorem každého důležitého řešení.",
        ),
        (
            "Kdy jste chránili vědeckou svobodu — a kdy ji naopak omezili?",
            "Nechal jsem tým experimentovat, ale před deadlinem jsem vybral jedno řešení.",
            "V jednom projektu jsem chránil prostor pro různé hypotézy, protože problém "
            "ještě nebyl dostatečně pochopený. Stanovil jsem ale společná hodnoticí "
            "kritéria, rozpočet a termín rozhodnutí. V jiném projektu jsem omezil volbu "
            "nástrojů a způsob nasazení, protože řešení muselo být auditovatelné, "
            "reprodukovatelné a dlouhodobě podporovatelné.",
        ),
        (
            "Administrativu kreativní člověk nemusí mít rád. Jak zajistíte, že se udělá?",
            "Používám Jira, kalendář, připomínky a time blocking.",
            "U povinných činností nespoléhám na momentální motivaci. Nastavuji pravidelný "
            "rytmus, jasné vlastníky, jednoduché šablony a kontrolu dokončení. Co lze, "
            "zjednoduším nebo automatizuji. Úkoly, které musí udělat vedoucí osobně, ale "
            "neodsouvám jen proto, že mě baví méně než technická práce.",
        ),
        (
            "Proces dává smysl, ale zdá se, že zkratka by byla praktičtější. Co uděláte?",
            "Pokud je riziko malé, změna vratná a ušetří nám to čas, udělám výjimku a zdokumentuji ji.",
            "Nejdřív bych zjistil, jaké riziko proces řídí a kdo za něj odpovídá. Pokud "
            "situace skutečně vyžaduje výjimku, musí být vědomá, schválená, zdokumentovaná "
            "a časově omezená. Pokud se stejná výjimka opakuje, je potřeba změnit proces, "
            "ne vytvořit kulturu skrytých zkratek.",
        ),
        (
            "Jaká je vaše největší mezera pro tuto roli?",
            "Občas jdu do detailu. Mám problém delegovat. Jsem perfekcionista.",
            "Pod tlakem mám tendenci problém sám převzít a vyřešit. Krátkodobě to může "
            "pomoci, ale oslabuje to vlastnictví a růst lidí v týmu. Proto nechávám kolegy "
            "nejdřív navrhnout řešení, jasně rozděluji odpovědnost a hodnotím se podle "
            "toho, zda jsem zvýšil schopnost týmu, ne jen zachránil konkrétní výsledek.",
        ),
    ]

    DISCUSSION_EYEBROW = "DO DISKUSE"
    DISCUSSION_QUESTION = "Podle jaké otázky poznáte vy, že je kandidát na manažerskou roli zralý?"
    DISCUSSION_CTA = "Napište ji do komentářů ↓"
    DISCUSSION_HASHTAG = "#YourThinkingMatters"

    total = len(QUESTIONS) + 2  # cover + questions + discussion

    cover = make_cover(COVER_HEADLINE, COVER_PUNCH, COVER_SUBTITLE, COVER_TAGLINE)
    save_poster(cover, f"{OUTPUT_PREFIX}-1-cover.png")

    idx = 2
    for qnum, (question, typicka, silna) in enumerate(QUESTIONS, start=1):
        img = make_question(idx, total, qnum, question, typicka, silna)
        save_poster(img, f"{OUTPUT_PREFIX}-{idx}.png")
        idx += 1

    discussion = make_discussion(idx, total, DISCUSSION_EYEBROW, DISCUSSION_QUESTION, DISCUSSION_CTA, DISCUSSION_HASHTAG)
    save_poster(discussion, f"{OUTPUT_PREFIX}-{idx}-closing.png")

    print("done")
