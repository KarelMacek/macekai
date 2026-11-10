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
      cs: "Pohled na tvou situaci — tvůj další krok očima zvenčí | Karel Macek",
      en: "Situation review — an outside view of your next move | Karel Macek",
    },
    description: {
      cs: "Pohled zvenčí na tvou kariéru a další krok: hutný písemný rozbor a osobní video do týdne. Jednorázově, bez prodejních hovorů. Karel Macek, PhD, bývalý CTO, ACC (ICF).",
      en: "An outside view of your career and your next move: a dense written analysis and a personal video within a week. One-off, no sales calls. Karel Macek, PhD, ex-CTO, ACC (ICF).",
    },
  },
  header: {
    homeLabel: { cs: "Karel Macek — domů", en: "Karel Macek — home" },
    langLabel: { cs: "Jazyk", en: "Language" },
  },
  hero: {
    eyebrow: { cs: "Pohled na tvou situaci", en: "Situation review" },
    // Two sentences, rendered as two separate lines. Czech copy on this page
    // is gender-neutral toward the reader (no "vybudoval/a"-style forms).
    h1a: {
      cs: "Kariéru v technologiích už máš.",
      en: "You've built a career in tech.",
    },
    h1b: {
      cs: "Co budeš tvořit dál?",
      en: "What are you building next?",
    },
    body: {
      cs: "Máš zkušenosti, schopnosti i respekt. A možná i plató, které se ti zatím nedaří pojmenovat. Podívám se na tvou situaci zvenčí a zmapuju, co se opakuje, co si odporuje a kde je tvůj další krok.",
      en: "You have the experience, the ability and the authority. And maybe a plateau you can't quite name yet. I'll look at your situation from the outside and map what keeps recurring, where it contradicts itself, and where your next move is.",
    },
    cta: {
      cs: "Chci pohled na svou situaci",
      en: "Get my situation review",
    },
    priceNote: {
      cs: "Jednorázový pohled. Žádné prodejní hovory. Žádný závazek pokračovat v koučování.",
      en: "A one-off review. No sales calls. No obligation to continue with coaching.",
    },
    commitmentsLabel: { cs: "Co je v ceně", en: "What's involved" },
    commitments: {
      // Value, not logistics: exact time/page figures live in the FAQ.
      cs: [
        "Tvoje část: strukturovaně si vypsat hlavu",
        "Moje část: osobně přečtu, co se skrývá za tvými odpověďmi",
        "Výsledek: písemný rozbor a nahrané video do týdne",
      ],
      en: [
        "Your part: one structured brain dump",
        "My part: a personal read of the patterns behind your answers",
        "The result: a written analysis and a recorded video, within a week",
      ],
    },
  },
  situations: {
    h2: { cs: "Možná právě přemýšlíš…", en: "You may be wondering…" },
    items: {
      cs: [
        "Kam nasměrovat své zkušenosti a energii.",
        "Zda jít víc do hloubky ve svém oboru, vést lidi, nebo rozjet něco vlastního.",
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
      cs: "Hutný písemný rozbor a nahrané video (5+ minut), ve kterém tě jím provedu. Zaměřené na to, co zevnitř není vidět.",
      en: "A dense written analysis and a recorded video (5+ minutes) in which I walk you through it. Focused on what you can't see because you're too close to it.",
    },
    items: {
      cs: [
        "Vzorce: co se opakuje a zevnitř není vidět.",
        "Napětí: kde tvoje současná role jde proti tomu, jak skutečně funguješ.",
        "Otázky, které stojí za to si položit.",
        "Další krok: jeden konkrétní krok nebo omezení, které stojí za to prolomit.",
      ],
      en: [
        "The patterns: what keeps repeating that you're too close to see.",
        "The tensions: where your current role pulls against how you actually operate.",
        "The questions worth asking next.",
        "The next move: one concrete step to take, or constraint to break.",
      ],
    },
    clarification: {
      cs: "Nabízím pohled zvenčí a podněty k ověření. Ty posoudíš, co na tvou situaci sedí.",
      en: "I offer an outside perspective and ideas to examine. You decide what fits your situation.",
    },
  },
  steps: {
    h2: { cs: "Co bude následovat", en: "What happens next" },
    // Order matches the real flow (app-backend/docs/post-purchase-email.md):
    // pay on SimpleShop → email with login link → Google sign-in → questionnaire.
    items: {
      cs: [
        {
          title: "Vypíšeš si hlavu (tvoje část).",
          body: "Po zaplacení ti přijde e-mail s odkazem do aplikace (přihlášení přes Google). Strukturovaný dotazník ti pomůže dát do slov napětí a nevyslovené otázky, které v hlavě nosíš. Už samotné sepsání často přinese úlevu. Pokud chceš, přidáš CV nebo LinkedIn.",
        },
        {
          title: "Hledám strukturu (moje část).",
          body: "Tvoje odpovědi nejen čtu, hledám architekturu za nimi: co se opakuje, co proti čemu táhne a co zevnitř není vidět.",
        },
        {
          title: "Dostaneš rozbor a video (výsledek).",
          body: "Do týdne od odeslání dotazníku: nahrané video (5+ minut), ve kterém tě provedu svým pohledem, a hutný písemný rozbor. Jakmile budou připravené, přijde ti e-mail a najdeš je v aplikaci.",
        },
      ],
      en: [
        {
          title: "The brain dump (your part).",
          body: "After payment you'll get an email with a link to the app (Google sign-in). A structured questionnaire helps you put the tensions and unasked questions you've been carrying into words. Writing them down often brings relief on its own. You can optionally add your CV or LinkedIn profile.",
        },
        {
          title: "The synthesis (my part).",
          body: "I don't just read your answers; I look for the architecture behind them: what keeps repeating, what pulls against what, and what you can't see from the inside.",
        },
        {
          title: "The briefing (the result).",
          body: "Within a week of submitting: a recorded video (5+ minutes) where I walk you through my view, and a dense written analysis. You'll get an email when they're ready and can find them in the app.",
        },
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
      // Honest without undermining the offer: it IS feedback on Karel's
      // coaching, just not specifically on Situation review.
      cs: "Zpětná vazba na můj přístup ke koučování",
      en: "Feedback on my coaching approach",
    },
  },
  faq: {
    h2: { cs: "Časté otázky", en: "Questions" },
    items: {
      cs: [
        {
          q: "Kolik času budu potřebovat?",
          a: "Přibližně 20 minut. Není to limit — promyšlenější odpovědi mi dají bohatší kontext.",
        },
        {
          q: "Je součástí živý hovor?",
          a: "Ne, žádné hovory, ani prodejní. Dostaneš písemný rozbor a nahrané video (5+ minut).",
        },
        {
          q: "Jak dlouhý je písemný rozbor?",
          a: "Obvykle 1–3 strany. Hutně, bez vaty.",
        },
        {
          q: "Kdo moje odpovědi posuzuje?",
          a: "Osobně Karel.",
        },
        {
          q: "Odkdy se počítá týden?",
          a: "Od odeslání vyplněného dotazníku.",
        },
        {
          q: "Jak se k výsledku dostanu?",
          a: "Přijde ti e-mail, že je rozbor hotový. Pak se přihlásíš do aplikace účtem, se kterým byl nákup spojen, a najdeš tam rozbor i video.",
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
          a: "Důvěrně, podle etického kodexu International Coaching Federation (ICF). Než začneš, aplikace se tě zeptá na dva nepovinné souhlasy: jestli smí tvé odpovědi zpracovat i AI (když řekneš ne, AI se jich nedotkne; když ano, jen modely, které se na tvých datech nedoučují: Microsoft Copilot, Azure OpenAI nebo lokálně běžící modely) a jestli smí být tvůj anonymizovaný záznam použit pro statistiku a výzkum strojového učení. Všechna svá data si můžeš v aplikaci kdykoli stáhnout a na požádání je trvale smažu (karel@macek.ai).",
        },
      ],
      en: [
        {
          q: "How much time do I need?",
          a: "Around 20 minutes. That's an estimate, not a limit — more thoughtful answers give me richer context.",
        },
        {
          q: "Is there a live call?",
          a: "No calls at all, including no sales calls. You receive a written analysis and a recorded video (5+ minutes).",
        },
        {
          q: "How long is the written analysis?",
          a: "Usually 1–3 pages. Dense, not padded.",
        },
        {
          q: "Who reviews my answers?",
          a: "Karel personally.",
        },
        {
          q: "When does the week start?",
          a: "After you submit the completed questionnaire.",
        },
        {
          q: "How do I access the result?",
          a: "You'll get an email when it's ready, then sign in to the app with the account associated with your purchase to find both the analysis and the video.",
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
          a: "Confidentially, under the International Coaching Federation (ICF) code of ethics. Before you start, the app asks you two optional questions: whether AI may also process your answers (if you say no, AI won't touch them; if yes, only models that don't train on your data: Microsoft Copilot, Azure OpenAI or locally-run models), and whether your anonymized record may be used for statistics and machine-learning research. You can download all your data from the app at any time, and I'll permanently delete it on request (karel@macek.ai).",
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
