export type Lang = "cs" | "en";

export const t = {
  // ── Nav ──────────────────────────────────────────────────────────────────
  nav: {
    about: { cs: "O mně", en: "About" },
    method: { cs: "Jak pracuji", en: "How I work" },
    why: { cs: "Proč já", en: "Why me" },
    clients: { cs: "Klienti", en: "Clients" },
    demo: { cs: "Ukázka", en: "Demo" },
    cta: { cs: "Pojďme na to →", en: "Let's go →" },
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero: {
    label: { cs: "ACC certifikovaný kouč · AI & Data", en: "ACC Certified Coach · AI & Data" },
    patent: { cs: "PAT. №17", en: "PAT. №17" },
    h1a: { cs: "Vynalezni", en: "Invent" },
    h1b: { cs: "sebe sama.", en: "your next self." },
    p1: {
      cs: "Pracuješ v AI nebo datech. Jsi chytrý, schopný — a přesto máš pocit, že tvůj život řídí kalendář, ne ty.",
      en: "You work in AI or data. You're smart, capable — and yet you feel like your calendar runs your life, not you.",
    },
    p2: {
      cs: "Pomáhám ti to otočit.",
      en: "I help you change that.",
    },
    ctaPrimary: { cs: "Pojďme na to →", en: "Let's go →" },
    ctaSecondary: { cs: "Sleduj ukázku koučinku", en: "Watch a coaching demo" },
    stat1: { cs: "patentů", en: "patents" },
    stat2: { cs: "sezení", en: "sessions" },
    stat3: { cs: "specializace", en: "speciality" },
  },

  // ── About ────────────────────────────────────────────────────────────────
  about: {
    label: { cs: "01 — Kdo jsem", en: "01 — Who I am" },
    h2a: { cs: "Kouč, který mluví", en: "A coach who speaks" },
    h2b: { cs: "tvým jazykem.", en: "your language." },
    p1: {
      cs: "Jsem kouč pro lidi z AI a dat — AI inženýry, datové inženýry a technologické lídry. Pomáhám jim vést dobrý život — život, který vás uživí a bude vás bavit",
      en: "I coach people in AI and data — software engineers, data engineers, and tech leaders. I help them lead a good life: live it, don't just earn a living.",
    },
    p2: {
      cs: "Jako bývalý technik, CTO a zakladatel startupů s 17 patenty a akademickým zázemím v matematickém inženýrství a AI — nemusíš mi nic vysvětlovat. Znám tvůj svět zevnitř.",
      en: "As a former engineer, CTO, and startup founder with 17 patents and a background in mathematical engineering and AI — you don't need to explain your world to me. I've lived it.",
    },
    figCaption: { cs: "FIG. 1 — KOUČOVACÍ SEZENÍ", en: "FIG. 1 — COACHING SESSION" },
    tags: {
      cs: ["ACC certifikovaný kouč", "17 patentů", "Neurověda", "Mat. inženýrství & AI", "CTO & startup"],
      en: ["ACC Certified Coach", "17 patents", "Neuroscience", "Math. Engineering & AI", "CTO & startup"],
    },
  },

  // ── Method ───────────────────────────────────────────────────────────────
  method: {
    label: { cs: "02 — Jak pracuji", en: "02 — How I work" },
    h2a: { cs: "Metoda", en: "The" },
    h2b: { cs: "vynálezce.", en: "inventor's method." },
    sub: {
      cs: "Není to zázračná formulka. Je to vědecký experiment — kde ty jsi vynálezce a já tvůj průvodce procesem.",
      en: "It's not a magic formula. It's a scientific experiment — where you are the inventor and I am your guide through the process.",
    },
    steps: {
      cs: [
        { num: "01", title: "Checklist podmínek", desc: "Nejde o to, jak přesně má vypadat svět — ale co musí splňovat. Definujeme podmínky a motivaci." },
        { num: "02", title: "Realistický plán", desc: "Přizpůsobivý, ale konkrétní. Žádné generické rady — plán šitý na tvou situaci." },
        { num: "03", title: "Bezpečné experimentování", desc: "Jako vynálezce testuješ hypotézy. Sbíráš data, vyhodnocuješ, upravuješ kurz." },
        { num: "04", title: "Průlom", desc: "Vykrystalizují se jedna dvě cesty. Vybereš si a opřeš se do toho. Výsledek." },
      ],
      en: [
        { num: "01", title: "Conditions checklist", desc: "It's not about what the world should look like — but what it must fulfil. We define your conditions and motivation." },
        { num: "02", title: "Realistic plan", desc: "Adaptive but concrete. No generic advice — a plan tailored to your situation." },
        { num: "03", title: "Safe experimentation", desc: "Like an inventor, you test hypotheses. Collect data, evaluate, adjust course." },
        { num: "04", title: "Breakthrough", desc: "One or two paths crystallise. You choose and commit. Results follow." },
      ],
    },
    packages: {
      cs: [
        { label: "Série 3 sezení", tag: "QUICK SPRINT", desc: "Rychlý taktický zásah. Konkrétní problém, konkrétní posun. Ideální pro jasně definovanou výzvu." },
        { label: "Série 12 sezení", tag: "FULL PROGRAM", desc: "Hloubková transformace. 3–6 měsíců systematické práce na sobě. Vynalezni verzi 2.0." },
      ],
      en: [
        { label: "3-session series", tag: "QUICK SPRINT", desc: "A fast tactical intervention. One concrete problem, one concrete shift. Ideal for a clearly defined challenge." },
        { label: "12-session series", tag: "FULL PROGRAM", desc: "Deep transformation. 3–6 months of systematic self-work. Invent your version 2.0." },
      ],
    },
  },

  // ── Why me ───────────────────────────────────────────────────────────────
  whyme: {
    label: { cs: "03 — Proč já", en: "03 — Why me" },
    h2: {
      cs: ["Jiný kouč ti ", "nerozumí", " tak jako já."],
      en: ["Another coach won't ", "understand you", " the way I do."],
    },
    reasons: {
      cs: [
        { icon: "code", title: "Mluvím tvým jazykem", desc: "Nemusíš mi vysvětlovat ML architektury, dynamiku vývojového týmu ani tlak na delivery. Byl jsem tam." },
        { icon: "zap", title: "Neurověda v praxi", desc: "Výcvik vychází z poznatků o lidském mozku. Vím, jak funguje limbický systém při rozhodování pod tlakem." },
        { icon: "trending", title: "Akce, ne terapie", desc: "Jsem zaměřený na posun. Pomáhám ti být konzistentní sám se sebou — ne tě hecovat do něčeho, co nechceš." },
        { icon: "rocket", title: "17 patentů", desc: "Vím, jak vypadá průlom. Akademické zázemí v matematickém inženýrství a AI — kreativní myšlení je moje přirozené prostředí." },
      ],
      en: [
        { icon: "code", title: "I speak your language", desc: "You don't need to explain ML architectures, team dynamics, or delivery pressure. I've been there." },
        { icon: "zap", title: "Neuroscience in practice", desc: "My training is grounded in how the brain works. I know how the limbic system behaves under decision-making pressure." },
        { icon: "trending", title: "Action, not therapy", desc: "I'm focused on movement. I help you be consistent with yourself — not push you into something you don't want." },
        { icon: "rocket", title: "17 patents", desc: "I know what a breakthrough looks like. Academic background in mathematical engineering and AI — creative thinking is my natural habitat." },
      ],
    },
  },

  // ── Client problems ───────────────────────────────────────────────────────
  problems: {
    label: { cs: "04 — Klienti", en: "04 — Clients" },
    h2: {
      cs: ["Co řeší ", "tvoji kolegové", " v každodenním životě."],
      en: ["What your ", "colleagues deal with", " every day."],
    },
    sub: {
      cs: "Koučink není jen pro kariéru. Je pro celý život — práci, vztahy, zdraví, smysl.",
      en: "Coaching isn't just for your career. It's for your whole life — work, relationships, health, meaning.",
    },
    items: {
      cs: [
        { icon: "briefcase", label: "Lépe placená práce", desc: "Splňující obsahové i work-life balance požadavky" },
        { icon: "sleep", label: "Cvičení & spánek", desc: "Usínat s klidným svědomím — ne jen si říct, že budeš" },
        { icon: "trending", label: "Zvyšování prodeje", desc: "Strategie, kreativita a disciplína v jednom" },
        { icon: "users", label: "Vztahy & work-life", desc: "Jak nebýt sám, když nemáš čas — pro expaty i CEO" },
        { icon: "globe", label: "Práce v jiné zemi", desc: "Hledání uplatnění v zahraničí, navigace nového prostředí" },
        { icon: "code", label: "Skill gap", desc: "Jak efektivně zacelit mezery v praxi, zvlášť pro juniory" },
        { icon: "negotiate", label: "Vyjednávání nabídek", desc: "Tlačení na stávajícího i budoucího zaměstnavatele" },
        { icon: "heart", label: "Životní partner", desc: "Jak ho najít, když je práce na prvním místě" },
        { icon: "hobby", label: "Koníčky & zájmy", desc: "Návrat k tomu, co tě bavilo — než tě pohltila kariéra" },
        { icon: "zap", label: "Efektivita & produktivita", desc: "Jak vyboxovat 2 hodiny týdně a začít řídit svůj čas" },
        { icon: "graduation", label: "Dokončení studia", desc: "Dotáhnout to, co jsi začal — s jasným plánem" },
        { icon: "refresh", label: "Profesní změna", desc: "Přechod do nové role, oboru nebo vlastního podnikání" },
        { icon: "rocket", label: "Vznik startupu", desc: "Příprava na zakladatelskou roli — od nápadu k exekuci" },
        { icon: "calm", label: "Vnitřní klid", desc: "Práce s přetížením a nalezení prostoru pro přemýšlení" },
        { icon: "home", label: "Životní prostor", desc: "Úprava prostředí, které podporuje tvůj výkon" },
        { icon: "bridge", label: "Akademie & byznys", desc: "Propojení výzkumné sféry s reálnou podnikatelskou hodnotou" },
      ],
      en: [
        { icon: "briefcase", label: "Better-paid work", desc: "Meeting both content and work-life balance requirements" },
        { icon: "sleep", label: "Exercise & sleep", desc: "Going to bed with a clear conscience — not just promising yourself you will" },
        { icon: "trending", label: "Growing sales", desc: "Strategy, creativity and discipline combined" },
        { icon: "users", label: "Relationships & work-life", desc: "How not to be alone when you have no time — for expats and CEOs alike" },
        { icon: "globe", label: "Working abroad", desc: "Finding your footing in a new country, navigating a new environment" },
        { icon: "code", label: "Skill gap", desc: "How to close knowledge gaps in practice, especially for juniors" },
        { icon: "negotiate", label: "Offer negotiation", desc: "Pushing back on current and future employers" },
        { icon: "heart", label: "Life partner", desc: "How to find one when work comes first" },
        { icon: "hobby", label: "Hobbies & interests", desc: "Returning to what you loved — before your career consumed you" },
        { icon: "zap", label: "Efficiency & productivity", desc: "How to carve out 2 hours a week and start owning your time" },
        { icon: "graduation", label: "Finishing a degree", desc: "Completing what you started — with a clear plan and motivation" },
        { icon: "refresh", label: "Career change", desc: "Moving into a new role, field, or your own business" },
        { icon: "rocket", label: "Launching a startup", desc: "Preparing for the founder role — from idea to execution" },
        { icon: "calm", label: "Inner calm", desc: "Working through overload and finding space to think" },
        { icon: "home", label: "Living environment", desc: "Adjusting the space that supports your performance" },
        { icon: "bridge", label: "Academia & business", desc: "Connecting research with real business value" },
      ],
    },
  },

  // ── Sujit demo ────────────────────────────────────────────────────────────
  demo: {
    label: { cs: "05 — Ukázka koučinku", en: "05 — Coaching demo" },
    h2a: { cs: "Sušita:", en: "Sujit:" },
    h2b: { cs: "AI inženýr v Singapuru.", en: "AI engineer in Singapore." },
    sub: {
      cs: "30 let, indický původ, pracuje 60 hodin týdně. Ukázka reálného koučovacího rozhovoru.",
      en: "30 years old, Indian background, working 60 hours a week. A real coaching conversation.",
    },
    transcript: { cs: "PŘEPIS — SEZENÍ 01 — SINGAPUR", en: "TRANSCRIPT — SESSION 01 — SINGAPORE" },
    showMore: { cs: "Zobrazit více →", en: "Show more →" },
    chat: {
      cs: [
        { role: "client", name: "Sušita", text: "Jak mi ta tvoje neurověda pomůže při těch nočních kódovacích maratonech, když jsem úplně hotový? A kolik to stojí času, když pracuju 60 hodin týdně?" },
        { role: "coach", name: "Karel", text: "Děkuju za tyhle asi čtyři otázky v jednom. 60 hodin, šéf nerozumí inovacím, noční maratony — já to slyším. Než ti řeknu víc, řekni mi: jak dlouho tohle téma je pro tebe téma?" },
        { role: "client", name: "Sušita", text: "Je to od tý doby, co jsem se přestěhoval do Singapuru. Takže tři roky." },
        { role: "coach", name: "Karel", text: "Tři roky. To není únava z minulého týdne — to je hluboký vzorec. Kdybys si měl představit to vyčerpání jako scénu z filmu, jak by vypadala?" },
        { role: "client", name: "Sušita", text: "Jako přehřátý procesor v serverovně uprostřed noci. Všechny větráky jedou na maximum, ale chlad už nezabírá a systém hrozí zhroucením." },
        { role: "coach", name: "Karel", text: "A kdybys si měl představit opak — co by přineslo úlevu?" },
        { role: "client", name: "Sušita", text: "Chladný vítr ze severního pólu, který vane přímo do tý serverovny." },
        { role: "coach", name: "Karel", text: "Přesně. Vygeneruj si ten obrázek a dej si ho na plochu. Teď — říkáš 60 hodin týdně. Co jsou tři kandidáti na to, aby z nich bylo 58? Něco, co by fungovalo klidně zítra?" },
        { role: "client", name: "Sušita", text: "Absolutní stopka na pracovní zprávy a maily po deváté večer." },
        { role: "coach", name: "Karel", text: "Výborně. To je quick win. Máme vizualizaci pro klid v hlavě, máme první konkrétní akci. Teď se můžeme bavit o tom, co v životě opravdu chceš — a vynaleznout Sušitu verze 2.0." },
      ],
      en: [
        { role: "client", name: "Sujit", text: "How is your neuroscience going to help me during those late-night coding marathons when I'm completely done? And how much time does this even take when I'm already working 60 hours a week?" },
        { role: "coach", name: "Karel", text: "Thanks for those four questions packed into one. 60 hours, a boss who doesn't get innovation, late-night marathons — I hear you. Before I say more, tell me: how long has this been an issue for you?" },
        { role: "client", name: "Sujit", text: "Since I moved to Singapore. So about three years." },
        { role: "coach", name: "Karel", text: "Three years. That's not last week's fatigue — that's a deep pattern. If you had to picture that exhaustion as a scene from a film, what would it look like?" },
        { role: "client", name: "Sujit", text: "Like an overheated processor in a server room in the middle of the night. All fans running at full speed, but the cooling isn't working anymore and the system is about to crash." },
        { role: "coach", name: "Karel", text: "And if you had to picture the opposite — what would bring relief?" },
        { role: "client", name: "Sujit", text: "A cold wind from the North Pole blowing straight into that server room." },
        { role: "coach", name: "Karel", text: "Exactly. Generate that image and set it as your wallpaper. Now — you said 60 hours a week. What are three candidates to bring it down to 58? Something that could work as early as tomorrow?" },
        { role: "client", name: "Sujit", text: "An absolute cutoff on work messages and emails after 9 pm." },
        { role: "coach", name: "Karel", text: "Perfect. That's a quick win. We have a visualisation for mental calm, we have a first concrete action. Now we can talk about what you actually want in life — and invent Sujit version 2.0." },
      ],
    },
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  contact: {
    label: { cs: "06 — Kontakt", en: "06 — Contact" },
    h2a: { cs: "Pojďme", en: "Let's" },
    h2b: { cs: "na to.", en: "go." },
    sub: {
      cs: "Pracuješ v AI nebo datech a chceš řídit svůj život, ne jen reagovat? Napiš mi — první sezení je nezávazné.",
      en: "You work in AI or data and want to run your life, not just react to it? Write to me — the first session is non-committal.",
    },
    email: { cs: "✉ Napsat e-mail", en: "✉ Send an email" },
    linkedin: { cs: "LinkedIn →", en: "LinkedIn →" },
    priceLabel: { cs: "ORIENTAČNÍ CENA — FULL PROGRAM", en: "INDICATIVE PRICE — FULL PROGRAM" },
    priceSub: { cs: "12 sezení · 3–6 měsíců · flexibilní tempo", en: "12 sessions · 3–6 months · flexible pace" },
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    tagline: { cs: "Karel Macek — Kouč pro AI & tech experty", en: "Karel Macek — Coach for AI & tech experts" },
  },
} as const;

export function tx(key: { cs: string; en: string }, lang: Lang): string {
  return key[lang];
}
