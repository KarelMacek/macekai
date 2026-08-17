import { Link } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { t, tx } from "@/lib/content";
import { requestConsentBannerReopen } from "@/lib/cookieConsent";

export default function Footer() {
  const { lang } = useLang();
  return (
    <footer
      className="py-8 border-t border-white/5"
      style={{ background: "oklch(0.10 0.015 60)" }}
    >
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center opacity-40"
            style={{ background: "oklch(0.14 0.02 60)" }}
          >
            <img
              src="/images/logo-icon.png"
              alt=""
              className="w-4 h-4 object-contain"
            />
          </div>
          <span
            className="text-sm text-[oklch(0.36_0.02_65)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {tx(t.footer.tagline, lang)}
          </span>
        </div>
        <div
          className="flex items-center gap-4 text-xs text-[oklch(0.36_0.02_65)]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <Link
            href="/privacy"
            className="hover:text-gold transition-colors duration-150"
          >
            {tx(t.footer.privacyLink, lang)}
          </Link>
          <button
            type="button"
            onClick={requestConsentBannerReopen}
            className="hover:text-gold transition-colors duration-150"
          >
            {tx(t.footer.managePreferences, lang)}
          </button>
        </div>
        <p
          className="text-xs text-[oklch(0.28_0.02_65)]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          © {new Date().getFullYear()} Karel Macek
        </p>
      </div>
    </footer>
  );
}
