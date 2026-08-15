import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { t, tx } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";
import {
  getStoredConsent,
  setStoredConsent,
  updateGaConsent,
  REOPEN_CONSENT_BANNER_EVENT,
} from "@/lib/cookieConsent";

export default function CookieConsentBanner() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) setVisible(true);

    function handleReopen() {
      setVisible(true);
    }
    window.addEventListener(REOPEN_CONSENT_BANNER_EVENT, handleReopen);
    return () =>
      window.removeEventListener(REOPEN_CONSENT_BANNER_EVENT, handleReopen);
  }, []);

  function handleAccept() {
    setStoredConsent("granted");
    updateGaConsent("granted");
    trackEvent(lang, "cookie_consent_accept");
    setVisible(false);
  }

  function handleReject() {
    setStoredConsent("denied");
    updateGaConsent("denied");
    trackEvent(lang, "cookie_consent_reject");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={tx(t.cookieConsent.ariaLabel, lang)}
      className="fixed inset-x-0 bottom-0 z-[90] border-t"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="container flex flex-col items-center gap-4 py-4 sm:flex-row sm:justify-between">
        <p
          className="text-xs leading-relaxed text-muted-foreground sm:text-sm"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
        >
          {tx(t.cookieConsent.message, lang)}{" "}
          <Link
            href="/privacy"
            className="underline text-gold hover:opacity-80 transition-opacity duration-150"
          >
            {tx(t.cookieConsent.policyLinkLabel, lang)}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleReject}
            className="px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "transparent",
              color: "oklch(0.60 0.02 72)",
              border: "1px solid oklch(1 0 0 / 15%)",
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "2px",
            }}
          >
            {tx(t.cookieConsent.reject, lang)}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "oklch(0.78 0.12 85)",
              color: "oklch(0.12 0.015 60)",
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "2px",
            }}
          >
            {tx(t.cookieConsent.accept, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
