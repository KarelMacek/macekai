# Karel Macek — Kouč pro AI & tech experty: Design Brainstorm

## Tři přístupy

### A. Precision Lab (0.04)
Čistý, vědecký estetika inspirovaná výzkumnou laboratoří. Monochromatická paleta s jedním ostrým akcentem. Technická typografie.

### B. Warm Engineer (0.07)
Teplé, zemité tóny kombinované s technickými prvky. Přátelský, ale seriózní. Jako kancelář CTO, který má rád lidi.

### C. Inventor's Studio (0.89)
Ateliér vynálezce — kombinace industriálního a organického. Tmavé pozadí, zlaté akcenty, textura papíru a kovu. Odkazuje na 17 patentů, akademické zázemí a metaforu „vynálezce sebe sama".

---

## Zvolený přístup: C — Inventor's Studio

### Design Movement
Industrial Warmth — kombinace Bauhaus funkcionalismu s teplem ateliéru. Inspirováno prostředím, kde vznikají patenty: laboratoř, skicář, workshop.

### Core Principles
1. **Kontrast hloubky** — tmavé pozadí s teplými zlatými a krémovými akcenty vytváří pocit hloubky a serióznosti
2. **Typografická hierarchie** — velká, sebevědomá display typografie vs. čitelný, klidný body text
3. **Textura jako důvěra** — jemné textury (papír, kov, šum) dávají webu hmatatelnost a autenticitu
4. **Asymetrické rozvržení** — žádné generické centrované sloupce; sekce se překrývají, posunují, dýchají

### Color Philosophy
- **Pozadí:** Hluboká teplá černá `oklch(0.12 0.015 60)` — jako tmavý workshop
- **Akcent (signature):** Zlatá `oklch(0.78 0.12 85)` — barva patentů, úspěchu, průlomu
- **Krémová:** `oklch(0.95 0.02 80)` — pro text a světlé plochy
- **Šedá:** `oklch(0.35 0.01 60)` — sekundární prvky
- Emoce: serióznost, důvěra, teplo, intelekt

### Layout Paradigm
- Hero: fullscreen s diagonálním rozdělením — levá tmavá (text), pravá s vizuálem
- Sekce se střídají: plná šířka vs. asymetrické dvousloupcové
- Problémy klientů: mřížka karet s hover efektem, ne seznam
- Rozhovor Sušita: chat-bubliny jako živá ukázka koučovacího stylu

### Signature Elements
1. **Zlatá linka** — tenká horizontální linka jako oddělovač, opakující se motiv
2. **Čísla v kroužku** — pro procesy a kroky, zlatá na tmavém pozadí
3. **Textura šumu** — jemný grain overlay na hero sekcích

### Interaction Philosophy
- Hover na kartách: lehké zvednutí + zlatý border
- Scroll: fade-in elementy s mírným posunem zdola
- Navigace: fixní, průhledná → opaque při scrollu

### Animation
- Vstupní animace: `opacity 0→1` + `translateY 20px→0`, 400ms ease-out
- Hover karty: `translateY -4px`, 200ms
- Čísla: counter animace při vstupu do viewportu
- Žádné přehnané efekty — pohyb má smysl, ne dekoraci

### Typography System
- **Display:** Playfair Display (serif) — pro velké nadpisy, evokuje akademičnost a autoritu
- **Body:** DM Sans — čistý, moderní, čitelný
- **Mono:** JetBrains Mono — pro technické detaily, čísla patentů
- Hierarchie: 72px hero → 48px h2 → 32px h3 → 18px body

### Brand Essence
**Pro AI experty, kteří chtějí řídit svůj život, ne jen reagovat na něj.**
Adjektiva: *systematický, autentický, průlomový*

### Brand Voice
- Přímý, bez omáčky: „Pracuješ 60 hodin týdně. Víš proč. Nevíš jak z toho ven."
- CTA: „Pojďme na to" místo „Kontaktujte nás"
- Žádné „Vítejte na mém webu" ani „Jsem tu pro vás"

### Wordmark & Logo
Stylizované „K" s integrovaným symbolem průlomu (šipka nebo paprsek) — zlaté na tmavém pozadí. Žádný výchozí font.

### Signature Brand Color
Zlatá `oklch(0.78 0.12 85)` — barva průlomu, patentů a vynálezů.

---

## Style Decisions
- Tmavý theme jako výchozí
- Playfair Display pro všechny nadpisy
- Zlatá jako jediný barevný akcent (vše ostatní je neutrální)
- Sušita sekce jako interaktivní chat-ukázka, ne statický text
