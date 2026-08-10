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
    label: {
      cs: "ACC (ICF) certifikovaný kouč · AI & Data",
      en: "ACC (ICF) Certified Coach · AI & Data",
    },
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
    ctaSecondary: {
      cs: "Zobrazit ukázku koučování",
      en: "View a coaching demo",
    },
    stat1: { cs: "patentů", en: "patents" },
    stat2: { cs: "let koučování", en: "years coaching" },
    stat3: { cs: "let v AI", en: "years in AI" },
    stat3Hint: {
      cs: "Ano, ten obor je od ChatGPT velmi jiný. Ale je pravda, že jsem první knowledge graph dělal už v roce 2004, první originální neuronovou síť v roce 2006, první placenou práci s neuronovou sítí v roce 2008 a první NLP projekt v roce 2010. Rozhodně jsem nesnědl všechnu moudrost světa a je hromada chytřejších AI inženýrů než jsem já. Mou cestou je teď pomáhat ne strojům, ale lidem.",
      en: "Yes, this field looks very different since ChatGPT. But it's true that I built my first knowledge graph back in 2004, my first original neural network in 2006, my first paid work with a neural network in 2008, and my first NLP project in 2010. I definitely haven't eaten all the world's wisdom, and there are plenty of AI engineers smarter than me. My path now is to help not machines, but people.",
    },
  },

  // ── About ────────────────────────────────────────────────────────────────
  about: {
    label: { cs: "01 — Kdo jsem", en: "01 — Who I am" },
    h2a: { cs: "Kouč, který mluví", en: "A coach who speaks" },
    h2b: { cs: "tvým jazykem.", en: "your language." },
    p1: {
      cs: "Jsem kouč pro lidi z AI a dat — AI inženýry, datové inženýry a technologické lídry. Pomáhám ti vést dobrý život — takový, který tě uživí a bude tě bavit.",
      en: "I coach people in AI and data — AI engineers, data engineers, and tech leaders. I help you lead a good life: one that pays the bills, and one you actually enjoy.",
    },
    p2: {
      cs: "Jsem úspěšný vynálezce, jsem ajťák - dělal jsem to rukama, vedl jsem týmy. Ve startupech, v korporátech. Optimalizoval jsem letiště v Dubaji, bádal jsem v Oxfordu. Koučování jsem začal dělat před 13 lety, když jsem vedl na jaderce diplomky a říkal jsem si, že musí existovat cesta, jak chytrým lidem neházet klacky pod nohy. Znám tvůj svět zevnitř a mluvím jazykem tvého kmene.",
      en: "I'm a successful inventor, and I'm a tech guy — I've done the hands-on work, and I've led teams. In startups, in corporations. I optimized an airport in Dubai, did research at Oxford. I started coaching 13 years ago, while supervising theses at the nuclear engineering faculty, telling myself there had to be a way to stop putting obstacles in front of smart people. I know your world from the inside, and I speak your tribe's language.",
    },
    figCaption: { cs: "FIG. 1 — KAREL MACEK", en: "FIG. 1 — KAREL MACEK" },
    tags: {
      cs: ["Certifikovaný kouč ACC (ICF)", "Neurověda", "PHD", "CTO & startup"],
      en: ["ACC (ICF) Certified Coach", "Neuroscience", "PhD", "CTO & startup"],
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
        {
          num: "01",
          title: "Checklist podmínek",
          desc: "Nejde o to, jak přesně má vypadat svět — ale co musí splňovat. Definujeme podmínky a motivaci.",
        },
        {
          num: "02",
          title: "Realistický plán",
          desc: "Přizpůsobivý, ale konkrétní. Žádné generické rady — plán šitý na tvou situaci.",
        },
        {
          num: "03",
          title: "Bezpečné experimentování",
          desc: "Jako vynálezce testuješ hypotézy. Sbíráš data, vyhodnocuješ, upravuješ kurz.",
        },
        {
          num: "04",
          title: "Průlom",
          desc: "Vykrystalizují se jedna dvě cesty. Vybereš si a opřeš se do toho. Výsledek.",
        },
      ],
      en: [
        {
          num: "01",
          title: "Conditions checklist",
          desc: "It's not about what the world should look like — but what it must fulfil. We define your conditions and motivation.",
        },
        {
          num: "02",
          title: "Realistic plan",
          desc: "Adaptive but concrete. No generic advice — a plan tailored to your situation.",
        },
        {
          num: "03",
          title: "Safe experimentation",
          desc: "Like an inventor, you test hypotheses. Collect data, evaluate, adjust course.",
        },
        {
          num: "04",
          title: "Breakthrough",
          desc: "One or two paths crystallise. You choose and commit. Results follow.",
        },
      ],
    },
    packages: {
      cs: [
        {
          label: "2–5 týdnů · 3 sezení",
          tag: "RYCHLÝ ZÁSAH",
          price: "10 800 Kč",
          desc: "Rychlý taktický zásah. Konkrétní problém, konkrétní posun. Ideální pro jasně definovanou výzvu.",
        },
        {
          label: "3–6 měsíců · 12 sezení",
          tag: "PLNÝ PROGRAM",
          price: "43 200 Kč",
          desc: "Hloubková transformace, systematická práce na sobě. Vynalezni verzi 2.0.",
        },
      ],
      en: [
        {
          label: "2–5 weeks · 3 sessions",
          tag: "QUICK SPRINT",
          price: "450 EUR",
          desc: "A fast tactical intervention. One concrete problem, one concrete shift. Ideal for a clearly defined challenge.",
        },
        {
          label: "3–6 months · 12 sessions",
          tag: "FULL PROGRAM",
          price: "1 800 EUR",
          desc: "Deep transformation, systematic work on yourself. Invent your version 2.0.",
        },
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
        {
          icon: "code",
          title: "Mluvím tvým jazykem",
          desc: "Nemusíš mi vysvětlovat ML architektury, dynamiku vývojového týmu ani tlak na delivery. Byl jsem tam.",
        },
        {
          icon: "zap",
          title: "Neurověda v praxi",
          desc: "Výcvik vychází z poznatků o lidském mozku. Vím, jak funguje limbický systém při rozhodování pod tlakem.",
        },
        {
          icon: "trending",
          title: "Akce, ne terapie",
          desc: "Jsem zaměřený na posun. Pomáhám ti být konzistentní sám se sebou — ne tě hecovat do něčeho, co nechceš.",
        },
        {
          icon: "rocket",
          title: "Kreativní systém",
          desc: "Povedu tvé přemýšlení k nápadu a tvé kroky k realitě, s disciplínou, jakou jsem se naučil jako výzkumník.",
        },
      ],
      en: [
        {
          icon: "code",
          title: "I speak your language",
          desc: "You don't need to explain ML architectures, team dynamics, or delivery pressure. I've been there.",
        },
        {
          icon: "zap",
          title: "Neuroscience in practice",
          desc: "My training is grounded in how the brain works. I know how the limbic system behaves under decision-making pressure.",
        },
        {
          icon: "trending",
          title: "Action, not therapy",
          desc: "I'm focused on movement. I help you be consistent with yourself — not push you into something you don't want.",
        },
        {
          icon: "rocket",
          title: "Creative system",
          desc: "I'll guide your thinking toward the idea, and your steps toward reality, with the discipline I learned as a researcher.",
        },
      ],
    },
  },

  // ── Client problems ───────────────────────────────────────────────────────
  problems: {
    label: { cs: "04 — Klienti", en: "04 — Clients" },
    h2: {
      cs: ["Co ", "tvoji kolegové", " řeší se mnou."],
      en: ["What ", "your colleagues", " work through with me."],
    },
    sub: {
      cs: "Koučování není jen pro kariéru. Je pro celý život — práci, vztahy, zdraví, smysl.",
      en: "Coaching isn't just for your career. It's for your whole life — work, relationships, health, meaning.",
    },
    items: {
      cs: [
        {
          icon: "briefcase",
          label: "Lépe placená práce",
          desc: "Splňující obsahové i work-life balance požadavky",
        },
        {
          icon: "sleep",
          label: "Cvičení & spánek",
          desc: "Usínat s klidným svědomím — ne jen si říct, že budeš",
        },
        {
          icon: "trending",
          label: "Zvyšování prodeje",
          desc: "Strategie, kreativita a disciplína v jednom",
        },
        {
          icon: "users",
          label: "Vztahy & work-life",
          desc: "Jak nebýt sám, když nemáš čas — nejen pro expaty",
        },
        {
          icon: "globe",
          label: "Práce v jiné zemi",
          desc: "Hledání uplatnění v zahraničí, navigace nového prostředí",
        },
        {
          icon: "code",
          label: "Skill gap",
          desc: "Jak efektivně zacelit mezery v praxi, zvlášť pro juniory",
        },
        {
          icon: "negotiate",
          label: "Vyjednávání nabídek",
          desc: "Tlačení na stávajícího i budoucího zaměstnavatele",
        },
        {
          icon: "heart",
          label: "Životní partner",
          desc: "Jak ho najít, když je práce na prvním místě",
        },
        {
          icon: "hobby",
          label: "Koníčky & zájmy",
          desc: "Návrat k tomu, co tě bavilo — než tě pohltila kariéra",
        },
        {
          icon: "zap",
          label: "Efektivita & produktivita",
          desc: "Jak vyboxovat čas a začít řídit svůj den",
        },
        {
          icon: "graduation",
          label: "Dokončení studia",
          desc: "Dotáhnout to, co jsi začal — s jasným plánem",
        },
        {
          icon: "refresh",
          label: "Profesní změna",
          desc: "Přechod do nové role, oboru nebo vlastního podnikání",
        },
        {
          icon: "rocket",
          label: "Vznik startupu",
          desc: "Příprava na zakladatelskou roli — od nápadu k exekuci",
        },
        {
          icon: "calm",
          label: "Vnitřní klid",
          desc: "Práce s přetížením a nalezení prostoru pro přemýšlení",
        },
        {
          icon: "home",
          label: "Životní prostor",
          desc: "Úprava prostředí, které podporuje tvůj výkon",
        },
        {
          icon: "bridge",
          label: "Akademie & byznys",
          desc: "Propojení výzkumu s reálným podnikáním",
        },
      ],
      en: [
        {
          icon: "briefcase",
          label: "Better-paid work",
          desc: "Meeting both content and work-life balance requirements",
        },
        {
          icon: "sleep",
          label: "Exercise & sleep",
          desc: "Going to bed with a clear conscience — not just promising yourself you will",
        },
        {
          icon: "trending",
          label: "Growing sales",
          desc: "Strategy, creativity and discipline combined",
        },
        {
          icon: "users",
          label: "Relationships & work-life",
          desc: "How not to be alone when you have no time — not just for expats",
        },
        {
          icon: "globe",
          label: "Working abroad",
          desc: "Finding your footing in a new country, navigating a new environment",
        },
        {
          icon: "code",
          label: "Skill gap",
          desc: "How to close knowledge gaps in practice, especially for juniors",
        },
        {
          icon: "negotiate",
          label: "Offer negotiation",
          desc: "Pushing back on current and future employers",
        },
        {
          icon: "heart",
          label: "Life partner",
          desc: "How to find one when work comes first",
        },
        {
          icon: "hobby",
          label: "Hobbies & interests",
          desc: "Returning to what you loved — before your career consumed you",
        },
        {
          icon: "zap",
          label: "Efficiency & productivity",
          desc: "How to carve out time and start owning your day",
        },
        {
          icon: "graduation",
          label: "Finishing a degree",
          desc: "Completing what you started — with a clear plan and motivation",
        },
        {
          icon: "refresh",
          label: "Career change",
          desc: "Moving into a new role, field, or your own business",
        },
        {
          icon: "rocket",
          label: "Launching a startup",
          desc: "Preparing for the founder role — from idea to execution",
        },
        {
          icon: "calm",
          label: "Inner calm",
          desc: "Working through overload and finding space to think",
        },
        {
          icon: "home",
          label: "Living environment",
          desc: "Adjusting the space that supports your performance",
        },
        {
          icon: "bridge",
          label: "Academia & business",
          desc: "Connecting research with real business",
        },
      ],
    },
  },

  // ── Testimonials ─────────────────────────────────────────────────────────
  testimonials: {
    eyebrow: { cs: "ZÁZNAMY Z PRAXE / 01–03", en: "CASE RECORDS / 01–03" },
    h2: { cs: "Co se skutečně změnilo", en: "What actually changed" },
    linkedinCta: { cs: "Originál na LinkedIn →", en: "Original on LinkedIn →" },
    translationNote: {
      cs: "Reference byly přeloženy z angličtiny. Odkazy vedou k původním doporučením na LinkedIn.",
      en: "",
    },
    expandLabel: { cs: "Celý příběh →", en: "Full story →" },
    collapseLabel: { cs: "Skrýt", en: "Hide" },
    caseLabel: { cs: "PŘÍPAD", en: "CASE" },
    resultsLabel: { cs: "VÝSLEDKY", en: "RESULTS" },
    main: {
      cs: {
        quote:
          "Výsledky mi dodnes připadají téměř neuvěřitelné. Strávil jsem rok v zahraničí, dokončil velmi dobře hodnocenou diplomovou práci a nakonec se přestěhoval do Londýna. Nemyslím si, že by se to stalo stejně brzy bez něj.",
        before:
          "Měl jsem to štěstí pracovat s Karlem jako se svým osobním koučem mezi lety 2013 a 2015. V té době jsem dokončoval diplomovou práci, skloubil práci se studiem a snažil se přijít na to, co bude dál. Cítil jsem se zaseklý. Věděl jsem, že chci cestovat a nakonec pracovat v zahraničí, ale pořád jsem to odkládal nebo propásl příležitosti, uvízlý mezi nejistotou a pocitem, že bych si měl nejdřív všechno ujasnit. Osobní rozvoj pro mě byl taky velké téma, ale najednou mě zajímalo tolik věcí, že jsem pořád skákal od jednoho k druhému, aniž bych se posouval v tom, na čem opravdu záleželo.\n\nKarel mi pomohl uvidět souvislosti mezi věcmi, které jsem do té doby řešil jako oddělené problémy, a všimnout si vzorců, které bych sám přehlédl. Moje studium, mé nejasné kariérní ambice, cestování, které jsem pořád odkládal, roztříštěné zájmy. Pomohl mi uvidět, jak to všechno spolu souvisí, a pak to rozložit na cíle dost konkrétní, abych se opravdu pohnul dál.",
        after:
          "Jsem Karlovi hluboce vděčný. Za jasnost, trpělivost a za to, že mi věřil, že najdu vlastní odpovědi, a zároveň dohlídl, abych je opravdu našel.",
        results: ["Rok v zahraničí", "diplomová práce", "přesun do Londýna"],
        name: "David Ešner",
        role: "AI Vertical Team Lead, Keboola",
      },
      en: {
        quote:
          "The results still feel almost improbable to me. I spent a year abroad, finished a highly praised thesis, and eventually moved to London. I don't think any of it would have happened the same way — or as soon — without him.",
        before:
          "I was lucky enough to work with Karel as my personal coach between 2013 and 2015. At the time I was finishing my Master's thesis, juggling work and studies, and trying to figure out what came next. I felt stuck. I knew I wanted to travel and eventually work abroad, but I kept postponing it or missing opportunities, caught between uncertainty and the feeling that I should have everything figured out first. Personal development was a big topic for me too, but I was interested in so many things at once that I kept jumping from one thing to the next, without moving forward with what actually mattered.\n\nKarel helped me see the threads connecting things I had been treating as separate problems, and to notice patterns I would have missed on my own. My studies, my vague career ambitions, the travel I kept putting off, the scattered interests. He helped me see how they fit together, and then break them down into goals concrete enough to actually move on.",
        after:
          "I'm deeply grateful to Karel. For the clarity, the patience, and for trusting me to find my own answers while making sure I actually found them.",
        results: ["A year abroad", "a praised thesis", "a move to London"],
        name: "David Ešner",
        role: "AI Vertical Team Lead, Keboola",
      },
    },
    cases: {
      cs: [
        {
          quote:
            "Ty rozhovory smysluplně přispěly ke směru, kterým jsem se od té doby vydala, a k větší jistotě v mých dnešních rozhodnutích.",
          name: "Anna Potanina",
          role: "Developer, Barclays Investment Bank",
        },
        {
          quote:
            "Ujasnilo mi to, co chci dělat, a přineslo to spoustu překvapivých aha momentů. Topil jsem se v úvahách o mnoha možnostech — kterou zvolit a kterou ne? Karel mi pomohl pochopit, co opustit a čemu se věnovat.",
          name: "Jiří Horáček",
          role: "Concept Artist, GRIP Studios",
        },
      ],
      en: [
        {
          quote:
            "Those conversations contributed meaningfully to the direction I have taken since, and to a greater sense of confidence in my decisions today.",
          name: "Anna Potanina",
          role: "Developer, Barclays Investment Bank",
        },
        {
          quote:
            "It clarified what I want to do, with many surprising aha moments. I was drowning in thoughts of many possibilities — which one to take and which not? Karel helped me realise what to leave and what to pursue.",
          name: "Jiří Horáček",
          role: "Concept Artist, GRIP Studios",
        },
      ],
    },
  },

  // ── Ravi demo ────────────────────────────────────────────────────────────
  demo: {
    label: { cs: "05 — Ukázka koučování", en: "05 — Coaching demo" },
    h2a: { cs: "Ravi:", en: "Ravi:" },
    h2b: { cs: "AI inženýr v Singapuru.", en: "AI engineer in Singapore." },
    sub: {
      cs: "34 let, indický původ, pracuje 60 hodin týdně. Ukázka možného koučovacího rozhovoru.",
      en: "34 years old, Indian background, working 60 hours a week. An example of a possible coaching conversation.",
    },
    transcript: {
      cs: "UKÁZKA — SEZENÍ 01 — SINGAPUR",
      en: "DEMO — SESSION 01 — SINGAPORE",
    },
    showMore: { cs: "Zobrazit více →", en: "Show more →" },
    chat: {
      cs: [
        {
          role: "client",
          name: "Ravi",
          text: "Jak mi ta tvoje neurověda pomůže při těch nočních kódovacích maratonech, když jsem úplně hotový? Nebo se šéfem, co vůbec nerozumí inovacím? A kolik to stojí času, když pracuju 60 hodin týdně?",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Děkuju za tyhle asi čtyři otázky v jednom. 60 hodin, šéf nerozumí inovacím, noční maratony — já to slyším. Než ti řeknu víc, řekni mi: jak dlouho tohle všechno vlastně už řešíš?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Je to od té doby, co jsem se přestěhoval do Singapuru. Takže tři roky.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Tři roky. To není únava z minulého týdne — to je hlubší téma. Ravi, jestli se můžu ještě zeptat, kdyby sis to vyčerpání představil jako scénu z filmu, jak by vypadala?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Jako přehřátý procesor v serverovně uprostřed noci. Všechny větráky jedou na maximum, ale už to nezabírá a systém se co chvíli zhroutí.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Přehřátí a co chvíli se to zhroutí... To je panečku představa. A když se ta filmová scéna posune najednou k lepšímu — co se tam stane?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Hm... no, nějak se tam pořádně ochladí... třeba se tam dostane polární vítr... do serverovny.",
        },
        { role: "coach", name: "Karel", text: "Polární vítr v serverovně..." },
        { role: "client", name: "Ravi", text: "Jo, prostě pořádná zima." },
        { role: "coach", name: "Karel", text: "Co dělá procesor?" },
        { role: "client", name: "Ravi", text: "Procesor je v klidu." },
        { role: "coach", name: "Karel", text: "Jak se ti ta představa líbí?" },
        { role: "client", name: "Ravi", text: "Jo, dobrý?" },
        {
          role: "coach",
          name: "Karel",
          text: "Co kdybys ji měl pořád před očima?",
        },
        { role: "client", name: "Ravi", text: "To by bylo fajn." },
        {
          role: "coach",
          name: "Karel",
          text: "A jak ji mít pořád před očima?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "No vygeneruju si obrázek a dám si to na plochu.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Ravi, to zní jako plán. Rád se vrátím k původní otázce, ale... můžu ještě k těm tvým 60 hodinám?",
        },
        { role: "client", name: "Ravi", text: "Okay." },
        {
          role: "coach",
          name: "Karel",
          text: "Ravi, kdyby to bylo o 2 míň... 58... jak by ses reálně cítil?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "No bylo by to fajn, ale pořád to neřeší nic.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Zatím to nic neřeší.... Ravi, kdybys je prostě musel vyboxovat, třeba kvůli nějaké léčbě, prostě jen 2 hodiny, jak bys to zařídil?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Asi bych si vyblokoval jeden večer, kdy prostě fakt nepracuju.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "A který den v týdnu by to mohlo klapnout?",
        },
        { role: "client", name: "Ravi", text: "Co já vím, třeba neděle." },
        {
          role: "coach",
          name: "Karel",
          text: "Ravi, takže si můžeš vygenerovat obrázek se sněhem v serverovně a zařídit, abys měl nedělní večer pro sebe.",
        },
        { role: "client", name: "Ravi", text: "Jo, vlastně jo." },
        { role: "coach", name: "Karel", text: "Co tomu říkáš?" },
        { role: "client", name: "Ravi", text: "Jo, proč ne..." },
        { role: "coach", name: "Karel", text: "Jak moc to chceš udělat?" },
        { role: "client", name: "Ravi", text: "Jo, vlastně to chci udělat." },
        { role: "coach", name: "Karel", text: "Takže to uděláš?" },
        { role: "client", name: "Ravi", text: "Jo, udělám." },
        {
          role: "coach",
          name: "Karel",
          text: 'Ravi, díky, že jsme to mohli probrat. Když se vrátím k tvé první otázce a řeknu "co Ravi vlastně v životě chce" nebo "jak vypadá Ravi 2.0" — jak moc bys s tím chtěl pohnout právě teď?',
        },
      ],
      en: [
        {
          role: "client",
          name: "Ravi",
          text: "How is your neuroscience going to help me during those late-night coding marathons when I'm completely done? Or with a boss who doesn't get my innovations at all? And how much time does this even take when I'm already working 60 hours a week?",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Thanks for those four questions packed into one. 60 hours, a boss who doesn't get your innovations, late-night marathons — I hear you. Before I say more, tell me: how long have you actually been dealing with all this?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Since I moved to Singapore. So, three years.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Three years. That's not last week's fatigue — that's a deeper issue. Ravi, if I can ask — if you had to picture that exhaustion as a scene from a film, what would it look like?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Like an overheated processor in a server room in the middle of the night. All the fans are running at full speed, but it's not helping anymore, and the system keeps crashing.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Overheating, and it keeps crashing... That's quite an image. And if that film scene suddenly shifts for the better — what happens there?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Hm... well, it somehow really cools down... maybe a polar wind gets in... into the server room.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "A polar wind in the server room...",
        },
        { role: "client", name: "Ravi", text: "Yeah, proper freezing cold." },
        { role: "coach", name: "Karel", text: "What's the processor doing?" },
        { role: "client", name: "Ravi", text: "The processor is calm." },
        { role: "coach", name: "Karel", text: "How do you like that image?" },
        { role: "client", name: "Ravi", text: "Yeah, it's good?" },
        {
          role: "coach",
          name: "Karel",
          text: "What if you had it in front of you all the time?",
        },
        { role: "client", name: "Ravi", text: "That would be nice." },
        {
          role: "coach",
          name: "Karel",
          text: "And how do you keep it in front of you all the time?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Well, I'll generate an image and set it as my wallpaper.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "Ravi, that sounds like a plan. I'd like to come back to your original question, but... can I ask about those 60 hours of yours?",
        },
        { role: "client", name: "Ravi", text: "Okay." },
        {
          role: "coach",
          name: "Karel",
          text: "Ravi, if it were 2 hours less... 58... how would you actually feel?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "It'd be nice, but it still doesn't solve anything.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "It doesn't solve anything yet.... Ravi, if you simply had to carve out those 2 hours — say, for some kind of treatment — how would you make it happen?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "I'd probably block off one evening where I just really don't work.",
        },
        {
          role: "coach",
          name: "Karel",
          text: "And which day of the week could that work?",
        },
        { role: "client", name: "Ravi", text: "I don't know, maybe Sunday." },
        {
          role: "coach",
          name: "Karel",
          text: "Ravi, so you can generate that image of snow in the server room, and make sure you have Sunday evening to yourself.",
        },
        { role: "client", name: "Ravi", text: "Yeah, actually, yeah." },
        { role: "coach", name: "Karel", text: "What do you think about that?" },
        { role: "client", name: "Ravi", text: "Yeah, why not..." },
        {
          role: "coach",
          name: "Karel",
          text: "How much do you want to do it?",
        },
        {
          role: "client",
          name: "Ravi",
          text: "Yeah, I actually want to do it.",
        },
        { role: "coach", name: "Karel", text: "So you'll do it?" },
        { role: "client", name: "Ravi", text: "Yeah, I will." },
        {
          role: "coach",
          name: "Karel",
          text: 'Ravi, thanks for letting us talk through this. If I go back to your first question and ask "what does Ravi actually want in life" or "what does Ravi 2.0 look like" — how much would you like to move on that right now?',
        },
      ],
    },
  },

  // ── Pricing / funnel ─────────────────────────────────────────────────────
  pricing: {
    label: { cs: "06 — Jak začít", en: "06 — How to start" },
    h2a: { cs: "Pojďme", en: "Let's" },
    h2b: { cs: "na to.", en: "go." },
    sub: {
      cs: "Jednoduchá cesta od rychlé sebereflexe k cílené spolupráci.",
      en: "A simple path from a quick self-check to focused collaboration.",
    },
    steps: {
      cs: [
        {
          num: "01",
          icon: "check",
          title: "Chci vůbec v životě něco měnit?",
          desc: "Pokud ne, můžeš opustit tuto stránku.",
        },
        {
          num: "02",
          icon: "clipboardCheck",
          title: "Rychlý check zdarma",
          desc: "7 otázek · 2 minuty",
          price: "0 Kč",
          cta: "Spustit",
        },
        {
          num: "03",
          icon: "search",
          title: "Vstupní diagnostika",
          desc: "Hlubší dotazník + moje stručné vyjádření do týdne",
          price: "590 Kč",
          cta: "Koupit",
        },
        {
          num: "04",
          icon: "compass",
          title: "Mapovací konzultace 360°",
          desc: "Společně ujasníme situaci a směr během 90minutové konzultace.",
          price: "3 600 Kč",
          cta: "Rezervovat",
        },
        {
          num: "05",
          icon: "handshake",
          title: "Další spolupráce",
          desc: "Jen pokud to bude dávat smysl",
        },
      ],
      en: [
        {
          num: "01",
          icon: "check",
          title: "Do I even want to change anything in my life?",
          desc: "If not, you can leave this page.",
        },
        {
          num: "02",
          icon: "clipboardCheck",
          title: "Free quick check",
          desc: "7 questions · 2 minutes",
          price: "0 CZK",
          cta: "Start the check",
        },
        {
          num: "03",
          icon: "search",
          title: "Intake diagnostics",
          desc: "A deeper questionnaire + my brief take within a week",
          price: "590 CZK",
          cta: "Buy",
        },
        {
          num: "04",
          icon: "compass",
          title: "360° mapping consultation",
          desc: "Together we'll clarify the situation and direction during a 90-minute consultation.",
          price: "3 600 CZK",
          cta: "Book",
        },
        {
          num: "05",
          icon: "handshake",
          title: "Further collaboration",
          desc: "Only if it makes sense",
        },
      ],
    },
    discountNote: {
      cs: "Když si něco zaplatíš, sníží se o to cena dalších kroků.",
      en: "If you pay for a step, its price is deducted from the next one.",
    },
    checkDoneLabel: { cs: "Hotovo", en: "Done" },
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  contact: {
    label: { cs: "07 — Kontakt", en: "07 — Contact" },
    h2a: { cs: "Buďme", en: "Let's" },
    h2b: { cs: "v kontaktu.", en: "stay in touch." },
    call: { cs: "Krátce si zavolejme", en: "Let's have a quick call" },
    email: { cs: "nebo napiš", en: "or write" },
    emailHint: {
      cs: "Kopírovat e-mailovou adresu karel@macek.ai do schránky",
      en: "Copy email address karel@macek.ai to clipboard",
    },
    emailCopied: {
      cs: "E-mailová adresa karel@macek.ai zkopírována do schránky",
      en: "Email address karel@macek.ai copied to clipboard",
    },
    linkedin: {
      cs: "nebo se spojme na LinkedIn",
      en: "or connect on LinkedIn",
    },
    priceLabel: { cs: "CENA INVESTICE", en: "INVESTMENT" },
    priceNote: {
      cs: "Na prvním sezení série zmapujeme tvou situaci a nastavíme, kam ji chceš posunout.\nPokud to nebude 100 %, můžeš skončit po prvním sezení.",
      en: "In the first session, we map out your situation and set the direction you want to take it.\nIf it's not a 100% fit, you can stop after that first session.",
    },
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    tagline: {
      cs: "Karel Macek — Kouč pro AI & tech experty",
      en: "Karel Macek — Coach for AI & tech experts",
    },
  },
} as const;

export function tx(key: { cs: string; en: string }, lang: Lang): string {
  return key[lang];
}
