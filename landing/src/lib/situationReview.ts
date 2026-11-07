/**
 * Situation review — shared purchase config + copy for the dedicated
 * /situation-review offer page.
 *
 * Purchase URLs live here (not inside a component) so the pricing modal and the
 * offer page can never drift apart. Prices are NOT here — they come from
 * PRICES / SITUATION_REVIEW_DISCOUNT in content.ts (situationReviewPriceFor).
 */
import type { Lang } from "@/lib/content";

export const SITUATION_REVIEW_PRODUCT_ID = "situation_review";
export const SITUATION_REVIEW_PATH = "/situation-review";
export const ABOUT_SECTION_ID = "o-mne";

// Two distinct SimpleShop products/forms, one per language — SimpleShop has no
// per-product language variant of its own (its checkout-page switch only
// handles CZK vs. EUR currency, not language).
export const SIMPLESHOP_FORM_IDS: Record<Lang, string> = {
  cs: "zQNb5",
  en: "eo50B",
};
export const SIMPLESHOP_ORIGIN = "https://form.simpleshop.cz";

// Hosted (non-embedded) checkout — used by the homepage pricing modal and as
// the offer page's fallback when the embedded form fails to load.
export const SIMPLESHOP_BUY_URLS: Record<Lang, string> = {
  cs: `${SIMPLESHOP_ORIGIN}/${SIMPLESHOP_FORM_IDS.cs}/buy/`,
  en: `${SIMPLESHOP_ORIGIN}/${SIMPLESHOP_FORM_IDS.en}/buy/`,
};

// Path-based English variant: it has its own prerendered HTML (vite.config.ts)
// so link previews/crawlers get English metadata. Static hosting can't vary
// HTML by query string, so ?lang=en alone can't do that.
export const SITUATION_REVIEW_EN_PATH = "/situation-review/en";
export const SITUATION_REVIEW_CANONICALS: Record<Lang, string> = {
  cs: "https://macek.ai/situation-review",
  en: "https://macek.ai/situation-review/en",
};

export function parseLangParam(search: string): Lang | null {
  const v = new URLSearchParams(search).get("lang");
  return v === "cs" || v === "en" ? v : null;
}

// Campaign parameters we are willing to read for analytics. Nothing else from
// the query string (and never anything user-entered) is passed on.
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

export function readCampaignParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const key of CAMPAIGN_KEYS) {
    const raw = params.get(key);
    if (raw && /^[\w.\-+ ]{1,64}$/.test(raw)) out[key] = raw;
  }
  return out;
}

export const situationReviewCopy = {
  meta: {
    title: {
      cs: "Pohled na tvou situaci — osobní písemná reflexe | Karel Macek",
      en: "Situation review — a personal written reflection | Karel Macek",
    },
    description: {
      cs: "Vyplníš dotazník (cca 20 minut), já se mu osobně věnuji nejméně 20 minut a do týdne od odeslání dostaneš písemnou reflexi tvé situace. Karel Macek, PhD, ACC (ICF).",
      en: "Complete a questionnaire (around 20 minutes), I personally spend at least 20 minutes on it, and you receive a written reflection within a week of submitting. Karel Macek, PhD, ACC (ICF).",
    },
  },
  header: {
    homeLabel: { cs: "Karel Macek — domů", en: "Karel Macek — home" },
    langLabel: { cs: "Jazyk", en: "Language" },
  },
  hero: {
    eyebrow: { cs: "Pohled na tvou situaci", en: "Situation review" },
    h1: {
      cs: "Vybudoval sis kariéru v technologiích. Co chceš tvořit dál?",
      en: "You've built a career in tech. What do you want to build next?",
    },
    body: {
      cs: "Máš zkušenosti a schopnosti. Chceš se posunout, ale možná ještě nemáš jasno kam. Podívám se na tvou situaci zvenčí a propojím to, co se v tvých odpovědích opakuje, co si odporuje a co stojí za další pozornost.",
      en: "You have experience and ability. You want to move forward, but you may not yet be sure where. I'll look at your situation from the outside, connecting recurring patterns, tensions and questions worth exploring.",
    },
    cta: {
      cs: "Chci pohled na svou situaci",
      en: "Get my situation review",
    },
    priceNote: {
      cs: "Jednorázově. Bez závazku pokračovat v koučování.",
      en: "One-off payment. No obligation to continue with coaching.",
    },
    commitmentsLabel: { cs: "Co je v ceně", en: "What's involved" },
    commitments: {
      cs: [
        "Přibližně 20 minut tvého času",
        "Nejméně 20 minut mé osobní práce",
        "Písemná reflexe do týdne od odeslání dotazníku",
      ],
      en: [
        "Around 20 minutes of your time",
        "At least 20 minutes of my personal work",
        "Written reflection within a week of submitting your questionnaire",
      ],
    },
  },
  situations: {
    h2: { cs: "Možná právě přemýšlíš…", en: "You may be wondering…" },
    items: {
      cs: [
        "Kam nasměrovat své zkušenosti a energii.",
        "Zda se dál rozvíjet jako expert, vést lidi, nebo rozjet něco vlastního.",
        "Co změnit, aby tě práce i život více těšily.",
      ],
      en: [
        "Where to direct your experience and energy next.",
        "Whether to grow as an expert, lead people or build something of your own.",
        "What to change so that you enjoy your work and life more.",
      ],
    },
  },
  receive: {
    h2: { cs: "Co ode mě dostaneš", en: "What you'll receive" },
    intro: {
      cs: "Osobní písemnou reflexi, která propojí tvé odpovědi do širšího obrazu.",
      en: "A personal written reflection that connects your answers into a broader picture.",
    },
    items: {
      cs: [
        "Vzorce a souvislosti, které v tvých odpovědích vidím.",
        "Silné stránky a napětí, která stojí za pozornost.",
        "Otázky, které ti mohou otevřít nový úhel pohledu.",
        "Návrh prvního praktického kroku.",
      ],
      en: [
        "Patterns and connections I notice in your answers.",
        "Strengths and tensions worth paying attention to.",
        "Questions that may open up a new perspective.",
        "A suggested first practical step.",
      ],
    },
    clarification: {
      cs: "Nabízím pohled zvenčí a podněty k ověření. Ty posoudíš, co na tvou situaci sedí.",
      en: "I offer an outside perspective and ideas to examine. You decide what fits your situation.",
    },
  },
  steps: {
    h2: { cs: "Jak to funguje", en: "How it works" },
    // Order matches the real flow (app-backend/docs/post-purchase-email.md):
    // pay on SimpleShop → email with login link → Google sign-in → questionnaire.
    items: {
      cs: [
        {
          title: "Zaplatíš a vyplníš dotazník.",
          body: "Po zaplacení ti přijde e-mail s odkazem do aplikace, kde se přihlásíš přes Google. Dotazník zabere přibližně 20 minut: kombinuje krátké odpovědi a otevřené otázky o práci, životě a o tom, jak funguješ. Pokud chceš, přidáš CV nebo LinkedIn.",
        },
        {
          title: "Osobně se mu věnuji.",
          body: "Nejméně 20 minut věnuji pročtení tvých odpovědí, hledání souvislostí a formulování svého pohledu.",
        },
        {
          title: "Dostaneš písemnou reflexi.",
          body: "Do týdne od odeslání vyplněného dotazníku. Jakmile bude připravená, přijde ti e-mail a najdeš ji po přihlášení v aplikaci.",
        },
      ],
      en: [
        {
          title: "Pay and complete the questionnaire.",
          body: "After payment you'll get an email with a link to the app, where you sign in with Google. The questionnaire takes around 20 minutes: it combines short responses and open questions about your work, life and how you operate. You can optionally add your CV or LinkedIn profile.",
        },
        {
          title: "I personally review it.",
          body: "I spend at least 20 minutes reading your answers, looking for connections and developing my perspective.",
        },
        {
          title: "Receive your written reflection.",
          body: "Within a week of submitting your completed questionnaire. You'll receive an email when it's ready and can read it after signing in to the app.",
        },
      ],
    },
  },
  sample: {
    h2: { cs: "Ukázka z reflexe", en: "A taste of the reflection" },
    label: {
      cs: "Ilustrační ukázka na fiktivním příkladu. Nejde o skutečného klienta.",
      en: "Illustrative example based on a fictional situation. This is not a real client.",
    },
    note: {
      cs: "Úryvek ilustruje přístup. Není to příslíbený úplný výstup ani reference.",
      en: "An excerpt illustrating the approach — not a promised complete deliverable or a testimonial.",
    },
    show: { cs: "Zobrazit celou ukázku", en: "Show the full excerpt" },
    hide: { cs: "Skrýt ukázku", en: "Hide the excerpt" },
    title: {
      cs: "Schopnost otevírá dveře. Směr pomáhá vybrat.",
      en: "Ability opens doors. Direction helps you choose.",
    },
    // First paragraph is always visible; the rest sits behind the toggle.
    paragraphs: {
      cs: [
        "Píšeš, že tě baví řešit složité technické problémy, ale zároveň přijímáš stále více koordinační práce. Možná se tak tvá spolehlivost stává důvodem, proč dostáváš méně prostoru na to, co tě nejvíc zajímá.",
        "Stojí za ověření, zda teď hledáš vyšší pozici, nebo větší vliv na obsah své práce.",
        "Otázka: Kdyby další krok nemusel vypadat jako povýšení, co bys chtěl dělat častěji?",
        "První krok: Během příštího týdne si zaznamenej tři chvíle, kdy tě práce vtáhla, a tři, kdy ses cítil mimo svůj směr. Podívej se, co mají společného.",
      ],
      en: [
        "You write that you enjoy solving complex technical problems, yet you keep taking on more coordination work. Your reliability may be leaving you with less room for the work that interests you most.",
        "One question worth exploring is whether you want a higher position or more influence over the content of your work.",
        "Question: If your next step did not have to look like a promotion, what would you want to do more often?",
        "First step: Over the next week, note three moments when your work absorbed you and three when it felt out of line with your direction. Look for what they have in common.",
      ],
    },
  },
  whyKarel: {
    h2: { cs: "Proč Karel", en: "Why Karel" },
    name: {
      cs: "Karel Macek, PhD, ACC (ICF)",
      en: "Karel Macek, PhD, ACC (ICF)",
    },
    body: {
      cs: "Znám svět AI, dat a technologií zevnitř. Pracoval jsem jako technický expert i vedoucí týmů. Dnes pomáhám lidem z tohoto prostředí hledat vlastní směr a proměňovat přemýšlení v konkrétní kroky.",
      en: "I know AI, data and technology from the inside. I've worked as a technical expert and led teams. Today, I help people in this world find their direction and turn reflection into concrete steps.",
    },
    moreLink: { cs: "Více o Karlovi", en: "More about Karel" },
    testimonialLabel: {
      cs: "Zpětná vazba ke koučování (ne k tomuto produktu)",
      en: "Feedback on coaching (not on this product)",
    },
  },
  faq: {
    h2: { cs: "Časté otázky", en: "Questions" },
    privacyLink: {
      cs: "Zásady ochrany osobních údajů",
      en: "Privacy information",
    },
    items: {
      cs: [
        {
          q: "Kolik času budu potřebovat?",
          a: "Přibližně 20 minut. Není to limit — promyšlenější odpovědi mi dají bohatší kontext.",
        },
        {
          q: "Je součástí živý hovor?",
          a: "Ne. Tento nákup je písemná reflexe, živý hovor není zahrnutý.",
        },
        {
          q: "Kdo moje odpovědi posuzuje?",
          a: "Osobně Karel, nejméně 20 minut.",
        },
        {
          q: "Odkdy se počítá týden?",
          a: "Od odeslání vyplněného dotazníku.",
        },
        {
          q: "Jak se k výsledku dostanu?",
          a: "Přijde ti e-mail, že je reflexe hotová. Pak se přihlásíš do aplikace účtem, se kterým byl nákup spojen.",
        },
        {
          q: "Potřebuji Google účet?",
          a: "Ano, aplikace používá přihlášení přes Google.",
        },
        {
          q: "Musím si potom koupit koučování?",
          a: "Ne.",
        },
        {
          q: "Jak se nakládá s mými odpověďmi?",
          a: "Podrobnosti najdeš v zásadách ochrany osobních údajů. Souhlasy, které v aplikaci udělíš nebo odmítneš, se řídí tvým výběrem.",
        },
      ],
      en: [
        {
          q: "How much time do I need?",
          a: "Around 20 minutes. That's an estimate, not a limit — more thoughtful answers give me richer context.",
        },
        {
          q: "Is there a live call?",
          a: "No. This purchase is a written review; no live call is included.",
        },
        {
          q: "Who reviews my answers?",
          a: "Karel personally, for at least 20 minutes.",
        },
        {
          q: "When does the week start?",
          a: "After you submit the completed questionnaire.",
        },
        {
          q: "How do I access the result?",
          a: "You'll get an email when the reflection is ready, then sign in to the app with the account associated with your purchase.",
        },
        {
          q: "Do I need a Google account?",
          a: "Yes, the app uses Google sign-in.",
        },
        {
          q: "Do I have to buy coaching afterwards?",
          a: "No.",
        },
        {
          q: "How are my answers handled?",
          a: "See the privacy information for details. The consents you give or decline in the app follow your own choices.",
        },
      ],
    },
  },
  final: {
    h2: {
      cs: "Chceš pohled na svou situaci?",
      en: "Want an outside view of your situation?",
    },
  },
  checkout: {
    h3: { cs: "Objednávka", en: "Checkout" },
    loading: { cs: "Načítám objednávkový formulář…", en: "Loading the checkout form…" },
    frameTitle: {
      cs: "Objednávkový formulář SimpleShop",
      en: "SimpleShop checkout form",
    },
    failed: {
      cs: "Objednávkový formulář se nepodařilo načíst. Zkus to znovu, nebo objednávku dokonči na stránce SimpleShopu.",
      en: "The checkout form couldn't be loaded. Try again, or complete your order on SimpleShop's page.",
    },
    retry: { cs: "Zkusit znovu", en: "Try again" },
    fallback: {
      cs: "Otevřít objednávku na SimpleShopu",
      en: "Open checkout on SimpleShop",
    },
    secureNote: {
      cs: "Platbu zpracovává SimpleShop. Po zaplacení ti přijde e-mail s odkazem do aplikace.",
      en: "Payment is processed by SimpleShop. After payment you'll get an email with a link to the app.",
    },
  },
} as const;
