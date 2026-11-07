/**
 * /situation-review — dedicated bilingual offer page for "Pohled na tvou
 * situaci / Situation review". One product, one primary action (buy it).
 * Visual language matches the homepage (Inventor's Studio). Copy lives in
 * lib/situationReview.ts; the price comes from lib/content.ts.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { useLang, type Lang } from "@/contexts/LangContext";
import { situationReviewPriceFor, t, tx } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";
import {
  ABOUT_SECTION_ID,
  SITUATION_REVIEW_CANONICALS,
  SITUATION_REVIEW_EN_PATH,
  SITUATION_REVIEW_PATH,
  SITUATION_REVIEW_PRODUCT_ID,
  parseLangParam,
  readCampaignParams,
  situationReviewCopy as c,
} from "@/lib/situationReview";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import { SimpleShopCheckout } from "@/components/SimpleShopCheckout";

const CHECKOUT_ID = "objednavka";

const bodyFont: CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 300,
};
const serif: CSSProperties = { fontFamily: "'Playfair Display', serif" };
const mono: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.15em",
};

// ── Document metadata (client-side; static share-preview copy is emitted at
// build time by the prerender plugin in vite.config.ts) ───────────────────────
function setMeta(selector: string, attr: string, value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

function useOfferMetadata(lang: Lang) {
  const original = useRef<{
    title: string;
    lang: string;
    values: [string, string, string][];
  } | null>(null);

  useEffect(() => {
    const targets: [string, string][] = [
      ['meta[name="description"]', "content"],
      ['link[rel="canonical"]', "href"],
      ['meta[property="og:title"]', "content"],
      ['meta[property="og:description"]', "content"],
      ['meta[property="og:url"]', "content"],
      ['meta[name="twitter:title"]', "content"],
      ['meta[name="twitter:description"]', "content"],
    ];
    original.current = {
      title: document.title,
      lang: document.documentElement.lang,
      values: targets.map(([sel, attr]) => [
        sel,
        attr,
        document.head.querySelector(sel)?.getAttribute(attr) ?? "",
      ]),
    };
    return () => {
      const o = original.current;
      if (!o) return;
      document.title = o.title;
      document.documentElement.lang = o.lang;
      o.values.forEach(([sel, attr, val]) => setMeta(sel, attr, val));
    };
  }, []);

  useEffect(() => {
    const title = tx(c.meta.title, lang);
    const description = tx(c.meta.description, lang);
    document.title = title;
    document.documentElement.lang = lang;
    setMeta('meta[name="description"]', "content", description);
    // Canonical is per language (path-based) and never carries ?lang or
    // campaign parameters.
    const canonical = SITUATION_REVIEW_CANONICALS[lang];
    setMeta('link[rel="canonical"]', "href", canonical);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
  }, [lang]);
}

// ── Primary CTA: jumps to the embedded checkout on this page ────────────────
function BuyButton({
  placement,
  campaign,
}: {
  placement: "hero";
  campaign: Record<string, string>;
}) {
  const { lang } = useLang();
  return (
    <a
      href={`#${CHECKOUT_ID}`}
      onClick={() =>
        // A click is interest, never a purchase.
        trackEvent(lang, "situation_review_cta_click", {
          product: SITUATION_REVIEW_PRODUCT_ID,
          placement,
          ...campaign,
        })
      }
      className="inline-flex min-h-[48px] items-center justify-center px-8 py-3.5 text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transform-none motion-reduce:transition-none"
      style={{
        background: "var(--gold)",
        color: "oklch(0.12 0.015 60)",
        fontFamily: "'DM Sans', sans-serif",
        borderRadius: "2px",
        outlineColor: "var(--gold)",
      }}
    >
      {tx(c.hero.cta, lang)} →
    </a>
  );
}

function PriceBlock() {
  const { lang } = useLang();
  return (
    <div>
      <p
        className="text-3xl font-bold text-gold"
        style={serif}
        data-testid="offer-price"
      >
        {situationReviewPriceFor(lang)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground" style={bodyFont}>
        {tx(c.hero.priceNote, lang)}
      </p>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="mb-6 text-2xl font-bold text-[oklch(0.93_0.02_80)] sm:text-3xl"
      style={serif}
    >
      {children}
    </h2>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3" style={bodyFont}>
      {items.map(item => (
        <li
          key={item}
          className="flex items-start gap-3 leading-relaxed text-[oklch(0.70_0.02_72)]"
        >
          <span className="mt-0.5 shrink-0 leading-none text-gold" aria-hidden>
            ›
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SituationReview() {
  const { lang, setLang } = useLang();
  const [sampleOpen, setSampleOpen] = useState(false);
  const campaign = useRef(
    readCampaignParams(typeof window === "undefined" ? "" : window.location.search)
  ).current;

  const [location, navigate] = useLocation();
  const pathLang: Lang | null =
    location.replace(/\/$/, "") === SITUATION_REVIEW_EN_PATH ? "en" : null;

  // Explicit language wins over browser detection — on this page only:
  // the /en path first, then a valid ?lang=. Runs before the first tracked
  // event so the view carries the right language.
  const [langReady, setLangReady] = useState(false);
  useEffect(() => {
    const explicit = pathLang ?? parseLangParam(window.location.search);
    if (explicit && explicit !== lang) setLang(explicit);
    setLangReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useOfferMetadata(lang);

  const viewTracked = useRef(false);
  useEffect(() => {
    if (!langReady || viewTracked.current) return;
    viewTracked.current = true;
    const from = new URLSearchParams(window.location.search).get("from");
    trackEvent(lang, "situation_review_view", {
      product: SITUATION_REVIEW_PRODUCT_ID,
      ...(from === "home" ? { source: "home" } : {}),
      ...campaign,
    });
  }, [langReady, lang, campaign]);

  function switchLang(next: Lang) {
    if (next === lang) return;
    setLang(next);
    // Keep the URL shareable and deterministic: the language lives in the
    // path (/situation-review vs /situation-review/en), so ?lang is dropped
    // and every other (campaign) parameter is retained.
    const params = new URLSearchParams(window.location.search);
    params.delete("lang");
    const qs = params.toString();
    const path = next === "en" ? SITUATION_REVIEW_EN_PATH : SITUATION_REVIEW_PATH;
    navigate(`${path}${qs ? `?${qs}` : ""}`, { replace: true });
  }

  // The route matches /situation-review/:variant?; only "en" is a real variant.
  const normalized = location.replace(/\/$/, "");
  if (normalized !== SITUATION_REVIEW_PATH && normalized !== SITUATION_REVIEW_EN_PATH) {
    return <NotFound />;
  }

  const sample = c.sample.paragraphs[lang];
  const testimonial = t.testimonials.cases[lang][0];

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.12 0.015 60)" }}
    >
      {/* Minimal header: logo home + language switch. No competing CTAs. */}
      <header className="container flex items-center justify-between py-6">
        <Link
          href="/"
          aria-label={tx(c.header.homeLabel, lang)}
          className="flex min-h-[44px] items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ outlineColor: "var(--gold)" }}
        >
          <img
            src="/images/logo-icon.png"
            alt=""
            className="h-6 w-6 object-contain"
          />
          <span
            className="text-sm text-[oklch(0.88_0.02_80)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Karel Macek
          </span>
        </Link>
        <div
          role="group"
          aria-label={tx(c.header.langLabel, lang)}
          className="flex items-center gap-1 text-sm"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {(["cs", "en"] as const).map(code => (
            <button
              key={code}
              type="button"
              onClick={() => switchLang(code)}
              aria-pressed={lang === code}
              className={`min-h-[44px] min-w-[44px] px-3 uppercase transition-colors duration-150 focus-visible:outline focus-visible:outline-2 ${
                lang === code
                  ? "font-semibold text-gold"
                  : "text-muted-foreground hover:text-gold"
              }`}
              style={{ outlineColor: "var(--gold)" }}
            >
              {code}
            </button>
          ))}
        </div>
      </header>

      <main>
        {/* 2. Hero */}
        <section className="container pb-16 pt-8 sm:pt-14">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs uppercase text-gold" style={mono}>
              {tx(c.hero.eyebrow, lang)}
            </p>
            <h1
              className="mb-6 text-4xl font-bold leading-tight text-[oklch(0.93_0.02_80)] sm:text-5xl"
              style={serif}
            >
              {tx(c.hero.h1, lang)}
            </h1>
            <p
              className="mb-8 text-lg leading-relaxed text-[oklch(0.70_0.02_72)]"
              style={bodyFont}
            >
              {tx(c.hero.body, lang)}
            </p>

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
              <BuyButton placement="hero" campaign={campaign} />
              <PriceBlock />
            </div>

            <h2 className="sr-only">{tx(c.hero.commitmentsLabel, lang)}</h2>
            <ul className="grid gap-3 sm:grid-cols-3" style={bodyFont}>
              {c.hero.commitments[lang].map(line => (
                <li
                  key={line}
                  className="border p-4 text-sm leading-snug text-[oklch(0.78_0.02_75)]"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "2px",
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Recognisable situations */}
        <section
          aria-labelledby="sr-situations"
          className="bg-[oklch(0.14_0.015_60)] py-16"
        >
          <div className="container max-w-3xl">
            <SectionHeading id="sr-situations">
              {tx(c.situations.h2, lang)}
            </SectionHeading>
            <Bullets items={c.situations.items[lang]} />
          </div>
        </section>

        {/* 4. What you receive */}
        <section aria-labelledby="sr-receive" className="py-16">
          <div className="container max-w-3xl">
            <SectionHeading id="sr-receive">
              {tx(c.receive.h2, lang)}
            </SectionHeading>
            <p
              className="mb-5 leading-relaxed text-[oklch(0.78_0.02_75)]"
              style={bodyFont}
            >
              {tx(c.receive.intro, lang)}
            </p>
            <Bullets items={c.receive.items[lang]} />
            <p
              className="mt-6 text-sm italic leading-relaxed text-muted-foreground"
              style={bodyFont}
            >
              {tx(c.receive.clarification, lang)}
            </p>
          </div>
        </section>

        {/* 5. How it works */}
        <section
          aria-labelledby="sr-steps"
          className="bg-[oklch(0.14_0.015_60)] py-16"
        >
          <div className="container max-w-3xl">
            <SectionHeading id="sr-steps">{tx(c.steps.h2, lang)}</SectionHeading>
            <ol className="space-y-6">
              {c.steps.items[lang].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center border text-sm text-gold"
                    style={{
                      borderColor: "var(--gold)",
                      borderRadius: "2px",
                      ...mono,
                      letterSpacing: 0,
                    }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3
                      className="mb-1 text-lg font-semibold text-[oklch(0.93_0.02_80)]"
                      style={serif}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="leading-relaxed text-[oklch(0.70_0.02_72)]"
                      style={bodyFont}
                    >
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. Illustrative sample */}
        <section aria-labelledby="sr-sample" className="py-16">
          <div className="container max-w-3xl">
            <SectionHeading id="sr-sample">
              {tx(c.sample.h2, lang)}
            </SectionHeading>
            <p
              className="mb-2 inline-block border px-3 py-1.5 text-xs font-semibold uppercase text-gold"
              style={{ borderColor: "var(--gold)", borderRadius: "2px", ...mono }}
            >
              {tx(c.sample.label, lang)}
            </p>
            <figure
              className="mt-4 border p-6 sm:p-8"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                borderRadius: "2px",
              }}
            >
              <figcaption
                className="mb-4 text-xl font-bold text-[oklch(0.93_0.02_80)]"
                style={serif}
              >
                {tx(c.sample.title, lang)}
              </figcaption>
              <div
                className="space-y-4 leading-relaxed text-[oklch(0.74_0.02_72)]"
                style={bodyFont}
              >
                <p>{sample[0]}</p>
                <div id="sr-sample-more" hidden={!sampleOpen} className="space-y-4">
                  {sample.slice(1).map(p => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
              <button
                type="button"
                aria-expanded={sampleOpen}
                aria-controls="sr-sample-more"
                onClick={() => {
                  if (!sampleOpen) {
                    trackEvent(lang, "situation_review_sample_expand", {
                      product: SITUATION_REVIEW_PRODUCT_ID,
                    });
                  }
                  setSampleOpen(o => !o);
                }}
                className="mt-5 min-h-[44px] text-sm text-gold underline decoration-dotted underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: "var(--gold)", fontFamily: "'DM Sans', sans-serif" }}
              >
                {sampleOpen ? tx(c.sample.hide, lang) : tx(c.sample.show, lang)}
              </button>
            </figure>
            <p
              className="mt-3 text-xs leading-relaxed text-muted-foreground"
              style={bodyFont}
            >
              {tx(c.sample.note, lang)}
            </p>
          </div>
        </section>

        {/* 7. Why Karel */}
        <section
          aria-labelledby="sr-karel"
          className="bg-[oklch(0.14_0.015_60)] py-16"
        >
          <div className="container max-w-3xl">
            <SectionHeading id="sr-karel">
              {tx(c.whyKarel.h2, lang)}
            </SectionHeading>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <img
                src="/images/karel-macek.jpg"
                alt="Karel Macek"
                width={160}
                height={160}
                loading="lazy"
                className="h-40 w-40 shrink-0 object-cover"
                style={{ borderRadius: "2px" }}
              />
              <div>
                <p
                  className="mb-3 font-semibold text-[oklch(0.93_0.02_80)]"
                  style={serif}
                >
                  {tx(c.whyKarel.name, lang)}
                </p>
                <p
                  className="mb-4 leading-relaxed text-[oklch(0.70_0.02_72)]"
                  style={bodyFont}
                >
                  {tx(c.whyKarel.body, lang)}
                </p>
                <ul className="mb-4 flex flex-wrap gap-2" aria-hidden="false">
                  {t.about.tags[lang].map(tag => (
                    <li
                      key={tag}
                      className="border px-2.5 py-1 text-xs text-muted-foreground"
                      style={{ borderColor: "var(--border)", borderRadius: "2px" }}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/#${ABOUT_SECTION_ID}`}
                  className="text-sm text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors duration-150 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: "var(--gold)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {tx(c.whyKarel.moreLink, lang)}
                </Link>
              </div>
            </div>

            <figure
              className="mt-10 border-l-2 pl-5"
              style={{ borderColor: "var(--gold)" }}
            >
              <p
                className="mb-2 text-xs uppercase text-muted-foreground"
                style={mono}
              >
                {tx(c.whyKarel.testimonialLabel, lang)}
              </p>
              <blockquote
                className="italic leading-relaxed text-[oklch(0.78_0.02_75)]"
                style={bodyFont}
              >
                “{testimonial.quote}”
              </blockquote>
              <figcaption
                className="mt-2 text-sm text-muted-foreground"
                style={bodyFont}
              >
                {testimonial.name}, {testimonial.role}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 8. FAQ + final purchase block */}
        <section aria-labelledby="sr-faq" className="py-16">
          <div className="container max-w-3xl">
            <SectionHeading id="sr-faq">{tx(c.faq.h2, lang)}</SectionHeading>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {c.faq.items[lang].map(item => (
                <details key={item.q} className="group py-4">
                  <summary
                    className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[oklch(0.88_0.02_80)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
                    style={{ outlineColor: "var(--gold)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.q}
                    <span
                      className="shrink-0 text-gold transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p
                    className="pb-1 pt-2 leading-relaxed text-[oklch(0.70_0.02_72)]"
                    style={bodyFont}
                  >
                    {item.a}
                    {item.q.startsWith(lang === "cs" ? "Jak se nakládá" : "How are my") && (
                      <>
                        {" "}
                        <Link
                          href="/privacy"
                          className="text-gold underline underline-offset-2"
                        >
                          {tx(c.faq.privacyLink, lang)}
                        </Link>
                        .
                      </>
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="sr-final"
          className="bg-[oklch(0.14_0.015_60)] py-16"
        >
          <div className="container max-w-3xl">
            <SectionHeading id="sr-final">{tx(c.final.h2, lang)}</SectionHeading>
            <ul
              className="mb-8 space-y-1 text-sm text-[oklch(0.70_0.02_72)]"
              style={bodyFont}
            >
              {c.hero.commitments[lang].map(line => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
            <div className="mb-8">
              <PriceBlock />
            </div>
            <h3
              id={CHECKOUT_ID}
              tabIndex={-1}
              className="mb-4 scroll-mt-6 text-lg font-semibold text-[oklch(0.93_0.02_80)] outline-none"
              style={serif}
            >
              {tx(c.checkout.h3, lang)}
            </h3>
            <SimpleShopCheckout campaign={campaign} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
