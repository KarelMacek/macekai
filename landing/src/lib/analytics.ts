import type { Lang } from "@/lib/content";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Every event name is prefixed with the active language ("cs_"/"en_") so CZ and
// EN behaviour never mix in reports, and with names distinct from the old
// static site's tracking (calendly_click, email_click, ...).
export function trackEvent(
  lang: Lang,
  name: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return;
  window.gtag("event", `${lang}_${name}`, params || {});
}
