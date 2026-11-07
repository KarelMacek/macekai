/**
 * SimpleShopCheckout — the SimpleShop sales form embedded in-page.
 *
 * SimpleShop's official embed snippet (https://form.simpleshop.cz/iframe/js/?id=…)
 * inserts its iframe with document.write, which can't run inside a React SPA
 * after load. This component renders the same iframe and speaks the same
 * postMessage protocol the official script does (read from that script,
 * 2026-11-07):
 *   iframe → parent  SimpleShop-setHeight   {iframeID, height}
 *   iframe → parent  SimpleShop-scrollToTop {iframeID}
 *   iframe → parent  SimpleShop-purchase    {payload: {ecommerce: {...}}}
 *   iframe → parent  SimpleShop-redirect    {url}  (after payment)
 * Unlike the official script, messages are only accepted from SimpleShop's
 * origin and redirects only to https URLs.
 *
 * Embedding (rather than linking out) is what makes SimpleShop's conversion
 * signal observable at all — it only fires on the page hosting the form — and
 * keeps the visitor on this page, so there's no "cancelled checkout" return
 * trip to lose language on.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, type Lang } from "@/contexts/LangContext";
import { tx } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";
import {
  SIMPLESHOP_BUY_URLS,
  SIMPLESHOP_FORM_IDS,
  SIMPLESHOP_ORIGIN,
  SITUATION_REVIEW_PRODUCT_ID,
  situationReviewCopy as c,
} from "@/lib/situationReview";

// How long the form may stay silent (no height report) before we call it a
// failed load and offer retry + the hosted checkout.
const LOAD_TIMEOUT_MS = 15000;
// Same grace the official script gives conversion code before a redirect.
const REDIRECT_PAUSE_MS = 1000;

type SimpleShopMessage =
  | { action: "SimpleShop-setHeight"; iframeID: string; height: number }
  | { action: "SimpleShop-scrollToTop"; iframeID: string }
  | {
      action: "SimpleShop-purchase";
      payload?: {
        ecommerce?: {
          transaction_id?: string;
          value?: number;
          currency?: string;
        };
      };
    }
  | { action: "SimpleShop-redirect"; url: string };

function makeUid(formId: string) {
  return `${formId}${Date.now()}${Math.floor(Math.random() * 1e6)}`;
}

export function SimpleShopCheckout({
  campaign,
}: {
  campaign: Record<string, string>;
}) {
  const { lang } = useLang();
  const [attempt, setAttempt] = useState(0);
  return (
    // Remount (fresh iframe + uid) on language change or retry.
    <CheckoutFrame
      key={`${lang}-${attempt}`}
      lang={lang}
      campaign={campaign}
      onRetry={() => setAttempt(a => a + 1)}
    />
  );
}

function CheckoutFrame({
  lang,
  campaign,
  onRetry,
}: {
  lang: Lang;
  campaign: Record<string, string>;
  onRetry: () => void;
}) {
  const formId = SIMPLESHOP_FORM_IDS[lang];
  const uid = useMemo(() => makeUid(formId), [formId]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const redirectAfter = useRef(0);
  const orderTracked = useRef(false);
  const readyTracked = useRef(false);

  const src = useMemo(() => {
    const back = encodeURI(window.location.origin + window.location.pathname);
    return `${SIMPLESHOP_ORIGIN}/iframe/${formId}/buy/${uid}/?url=${back}`;
  }, [formId, uid]);

  // Failed-load detection: the form reports its height every 500 ms once it
  // runs, so silence past the timeout means it didn't load (blocked, offline,
  // SimpleShop down). Nothing is recorded as a purchase in that case.
  useEffect(() => {
    if (height !== null) return;
    const timer = window.setTimeout(() => {
      setFailed(true);
      trackEvent(lang, "situation_review_checkout_error", {
        product: SITUATION_REVIEW_PRODUCT_ID,
        reason: "load_timeout",
      });
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [height, lang]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== SIMPLESHOP_ORIGIN) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as SimpleShopMessage | undefined;
      if (!data || typeof data !== "object" || !("action" in data)) return;

      switch (data.action) {
        case "SimpleShop-setHeight":
          if (data.iframeID !== uid || typeof data.height !== "number") return;
          if (!readyTracked.current) {
            readyTracked.current = true;
            trackEvent(lang, "situation_review_checkout_ready", {
              product: SITUATION_REVIEW_PRODUCT_ID,
            });
          }
          setHeight(data.height);
          setFailed(false);
          break;
        case "SimpleShop-scrollToTop":
          if (data.iframeID !== uid) return;
          iframeRef.current?.scrollIntoView({ behavior: "smooth" });
          break;
        case "SimpleShop-purchase": {
          // SimpleShop fires this when the ORDER is created, not when payment
          // clears — so it's tracked as an order, never as a confirmed
          // payment. Confirmed payment is the app-backend webhook's job.
          redirectAfter.current = Date.now() + REDIRECT_PAUSE_MS;
          if (orderTracked.current) return;
          orderTracked.current = true;
          const ec = data.payload?.ecommerce ?? {};
          trackEvent(lang, "situation_review_order_created", {
            product: SITUATION_REVIEW_PRODUCT_ID,
            transaction_id: ec.transaction_id,
            value: ec.value,
            currency: ec.currency,
            ...campaign,
          });
          break;
        }
        case "SimpleShop-redirect": {
          let target: URL;
          try {
            target = new URL(data.url);
          } catch {
            return;
          }
          if (target.protocol !== "https:") return;
          const wait = Math.max(redirectAfter.current - Date.now(), 1);
          window.setTimeout(() => window.location.assign(target.href), wait);
          break;
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [uid, lang, campaign]);

  return (
    <div>
      {height === null && !failed && (
        <p
          className="mb-3 text-sm text-muted-foreground"
          role="status"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {tx(c.checkout.loading, lang)}
        </p>
      )}
      {failed && (
        <div role="alert" className="mb-4 space-y-3">
          <p
            className="text-sm text-red-300"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {tx(c.checkout.failed, lang)}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] px-5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: "var(--gold)",
                color: "oklch(0.12 0.015 60)",
                borderRadius: "2px",
                outlineColor: "var(--gold)",
              }}
            >
              {tx(c.checkout.retry, lang)}
            </button>
            <a
              href={SIMPLESHOP_BUY_URLS[lang]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent(lang, "situation_review_cta_click", {
                  product: SITUATION_REVIEW_PRODUCT_ID,
                  placement: "checkout_fallback",
                  ...campaign,
                })
              }
              className="inline-flex min-h-[44px] items-center text-sm text-gold underline underline-offset-4"
            >
              {tx(c.checkout.fallback, lang)} ↗
            </a>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        id={`SimpleShop.${uid}`}
        name={`SimpleShop.${uid}`}
        title={tx(c.checkout.frameTitle, lang)}
        src={src}
        scrolling="no"
        width="100%"
        className="block w-full overflow-hidden border-0"
        style={{
          height: height ?? 400,
          // Hidden (not unmounted) while failed so a late load can recover.
          display: failed && height === null ? "none" : "block",
          background: "#fff",
          borderRadius: "2px",
        }}
      />
      <p
        className="mt-3 text-xs text-muted-foreground"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {tx(c.checkout.secureNote, lang)}
      </p>
    </div>
  );
}
