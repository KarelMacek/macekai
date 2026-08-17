/**
 * DiagnosticsInfoModal — info popup for the "Pohled na situaci" funnel step.
 * Static content, no quiz/scoring logic (unlike QuickReflectionModal) — just
 * a short explanation and a CTA out to the real SimpleShop checkout.
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLang, type Lang } from "@/contexts/LangContext";
import { t, tx } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";

// Keyed by the page's own language — no separate in-modal choice, since
// asking again right at the buy decision (on top of already-tiered pricing)
// is an extra bit of friction, not a feature. Wrong guess is recoverable:
// the consent page after payment offers its own language switch.
// Two distinct SimpleShop products/forms, one per language — SimpleShop has
// no per-product language variant of its own (its checkout-page switch only
// handles CZK vs. EUR currency, not language).
const SIMPLESHOP_BUY_URLS: Record<Lang, string> = {
  cs: "https://form.simpleshop.cz/zQNb5/buy/",
  en: "https://form.simpleshop.cz/eo50B/buy/",
};

interface DiagnosticsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiagnosticsInfoModal({
  isOpen,
  onClose,
}: DiagnosticsInfoModalProps) {
  const { lang } = useLang();
  const otherLang: Lang = lang === "cs" ? "en" : "cs";
  const copy = t.pricing.diagnosticsModal;

  function handleBuyNow() {
    trackEvent(lang, "diagnostics_buy_click", { location: "pricing_modal" });
  }

  function handleBuyOtherLang() {
    trackEvent(lang, "diagnostics_buy_click", {
      location: "pricing_modal",
      otherLang: true,
    });
  }

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          onClick={e => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
        >
          <div
            className="relative my-auto w-full max-w-[560px] border p-6 shadow-2xl sm:p-10"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: "2px",
            }}
          >
            <DialogPrimitive.Close
              aria-label={tx(copy.close, lang)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground transition-colors duration-150 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:top-6 sm:right-6"
              style={{ borderRadius: "2px" }}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>

            <p
              className="mb-3 text-xs text-gold uppercase"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.15em",
              }}
            >
              {tx(copy.eyebrow, lang)}
            </p>
            <DialogPrimitive.Title
              className="mb-4 pr-8 text-2xl font-bold text-foreground sm:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {tx(copy.headline, lang)}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {tx(copy.body, lang)}
            </DialogPrimitive.Description>

            <ul
              className="mb-8 space-y-2 text-xs leading-relaxed text-muted-foreground/80"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {copy.notes[lang].map(note => (
                <li key={note} className="flex items-start gap-2">
                  <span
                    className="text-gold shrink-0 leading-none mt-0.5"
                    aria-hidden
                  >
                    ›
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={SIMPLESHOP_BUY_URLS[lang]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--gold)",
                  color: "oklch(0.12 0.015 60)",
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: "2px",
                }}
              >
                {tx(copy.buyNow, lang)} →
              </a>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center px-6 py-3 text-sm text-muted-foreground transition-colors duration-150 hover:text-gold"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {tx(copy.close, lang)}
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground/70">
              <a
                href={SIMPLESHOP_BUY_URLS[otherLang]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleBuyOtherLang}
                className="underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-gold"
              >
                {tx(copy.buyOtherLang, lang)}
              </a>
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
