declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Must stay in sync with the CONSENT_KEY string in index.html's inline
// consent-default script (that script can't import this module).
export const COOKIE_CONSENT_KEY = "macekai_cookie_consent";

export type ConsentValue = "granted" | "denied";

// Dispatched by the footer's "manage cookie preferences" link to force the
// banner to reappear even though a decision is already stored.
export const REOPEN_CONSENT_BANNER_EVENT = "macekai:reopen-cookie-consent";

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(value: ConsentValue) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* private browsing / storage disabled — nothing we can do */
  }
}

export function updateGaConsent(value: ConsentValue) {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return;
  window.gtag("consent", "update", { analytics_storage: value });
}

export function requestConsentBannerReopen() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REOPEN_CONSENT_BANNER_EVENT));
}
