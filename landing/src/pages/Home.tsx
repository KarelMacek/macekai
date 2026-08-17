/**
 * Karel Macek — Kouč pro AI & tech experty / Coach for AI & tech experts
 * Design: Inventor's Studio — dark warm charcoal + gold accent + Playfair Display
 * Style: patent-diagram framing, blueprint lines, technical annotations
 * Bilingual: CS / EN via LangContext
 */
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { t, tx, type Lang } from "@/lib/content";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/analytics";
import { useFunnelDeclined } from "@/contexts/FunnelDeclinedContext";
import {
  QuickReflectionModal,
  isValidReflectionState,
  type Answers,
  type ResultKey,
} from "@/components/QuickReflectionModal";
import { DiagnosticsInfoModal } from "@/components/DiagnosticsInfoModal";
import { CollaborationInfoModal } from "@/components/CollaborationInfoModal";
import Footer from "@/components/Footer";

// ── Fade-up hook ──────────────────────────────────────────────────────────────
function useFadeUp(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

// ── Scroll depth tracking ────────────────────────────────────────────────────
const SCROLL_MILESTONES = [25, 50, 75, 90, 100];
function useScrollDepthTracking(lang: Lang) {
  const fired = useRef<Set<number>>(new Set());
  useEffect(() => {
    fired.current = new Set();
    function onScroll() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
      for (const milestone of SCROLL_MILESTONES) {
        if (pct >= milestone && !fired.current.has(milestone)) {
          fired.current.add(milestone);
          trackEvent(lang, "scroll_depth", { depth: milestone });
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [lang]);
}

// ── Technical SVG icons ───────────────────────────────────────────────────────
const icons: Record<string, React.ReactElement> = {
  briefcase: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="12.01" />
    </svg>
  ),
  sleep: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  trending: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  users: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  globe: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  code: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  negotiate: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  heart: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  hobby: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  zap: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  graduation: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  refresh: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  rocket: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  calm: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  home: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  bridge: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M3 17h18" />
      <path d="M3 17V9a9 9 0 0 1 18 0v8" />
      <path d="M9 17V9" />
      <path d="M15 17V9" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  clipboardCheck: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <polyline points="9.5 13 11.5 15 15 10.5" />
    </svg>
  ),
  search: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  compass: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  handshake: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M2 12h4l3-3 4 4 3-3h6" />
      <path d="M9 13v3a2 2 0 0 0 2 2h1" />
      <path d="M15 13v2a2 2 0 0 1-2 2h-1" />
    </svg>
  ),
  shieldCheck: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
};

// ── Blueprint corner ──────────────────────────────────────────────────────────
function BlueprintCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-4 h-4 text-gold opacity-40 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M0 8 L0 0 L8 0" />
    </svg>
  );
}

function GoldLine({ className = "" }: { className?: string }) {
  return <span className={`gold-line ${className}`} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label mb-4">{children}</p>;
}

function PatentCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative p-5 ${className}`}
      style={{
        background: "oklch(0.16 0.015 60)",
        border: "1px solid oklch(1 0 0 / 8%)",
        borderRadius: "2px",
        ...style,
      }}
    >
      <BlueprintCorner className="absolute top-2 left-2" />
      <BlueprintCorner className="absolute top-2 right-2 rotate-90" />
      {children}
    </div>
  );
}

// ── Language toggle ───────────────────────────────────────────────────────────
function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      className="flex items-center gap-0 border border-white/10 overflow-hidden"
      style={{ borderRadius: "2px" }}
    >
      {(["cs", "en"] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-3 py-1.5 text-xs transition-all duration-200"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: lang === l ? 500 : 400,
            background: lang === l ? "oklch(0.78 0.12 85)" : "transparent",
            color: lang === l ? "oklch(0.12 0.015 60)" : "oklch(0.50 0.02 70)",
            letterSpacing: "0.08em",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  const { lang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
  const links = [
    { label: tx(t.nav.about, lang), href: "#o-mne" },
    { label: tx(t.nav.method, lang), href: "#metoda" },
    { label: tx(t.nav.why, lang), href: "#proc-ja" },
    { label: tx(t.nav.clients, lang), href: "#klienti" },
    { label: tx(t.nav.demo, lang), href: "#ukazka" },
  ];
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[oklch(0.12_0.015_60/0.96)] backdrop-blur-xl border-b border-white/5" : "bg-transparent"}`}
    >
      <div className="container flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center border border-[oklch(0.78_0.12_85/0.3)]"
            style={{ background: "oklch(0.14 0.02 60)" }}
          >
            <img
              src="/images/logo-icon.png"
              alt=""
              className="w-5 h-5 object-contain"
            />
          </div>
          <span
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
            className="text-lg tracking-tight text-[oklch(0.93_0.02_80)]"
          >
            Karel Macek
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[oklch(0.52_0.02_72)] hover:text-gold transition-colors duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {l.label}
            </a>
          ))}
          <LangToggle />
          <a
            href="#jak-zacit"
            className="text-sm px-4 py-2 border border-[oklch(0.78_0.12_85/0.4)] text-gold hover:bg-[oklch(0.78_0.12_85/0.1)] transition-all duration-200"
            style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}
          >
            {tx(t.nav.cta, lang)}
          </a>
        </nav>
        <div className="md:hidden flex items-center gap-3">
          <LangToggle />
          <button
            className="flex flex-col gap-1.5 p-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <span
              className={`block w-5 h-0.5 bg-[oklch(0.93_0.02_80)] transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-[oklch(0.93_0.02_80)] transition-all duration-200 ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-[oklch(0.93_0.02_80)] transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-[oklch(0.14_0.015_60)] border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[oklch(0.62_0.02_72)] hover:text-gold py-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#jak-zacit"
            onClick={() => setOpen(false)}
            className="text-gold border border-[oklch(0.78_0.12_85/0.4)] px-4 py-2 text-center text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}
          >
            {tx(t.nav.cta, lang)}
          </a>
        </div>
      )}
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const { lang } = useLang();
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden grain-overlay"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.10 0.015 60) 0%, oklch(0.14 0.018 65) 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('/images/hero-bg.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.10_0.015_60/0.92)] via-[oklch(0.10_0.015_60/0.65)] to-transparent" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.12 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="container relative z-10 pt-24 pb-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="section-label">{tx(t.hero.label, lang)}</span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.08,
            }}
            className="text-5xl md:text-7xl font-bold text-[oklch(0.93_0.02_80)] mb-6"
          >
            {tx(t.hero.h1a, lang)}
            <br />
            <span className="text-gold italic">{tx(t.hero.h1b, lang)}</span>
          </h1>
          <p
            className="text-lg md:text-xl text-[oklch(0.60_0.02_72)] mb-4 leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            {tx(t.hero.p1, lang)}
          </p>
          <p
            className="text-lg text-[oklch(0.60_0.02_72)] mb-10 leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            {tx(t.hero.p2, lang)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#jak-zacit"
              onClick={() =>
                trackEvent(lang, "cta_click", {
                  location: "hero",
                  label: "primary",
                })
              }
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "oklch(0.78 0.12 85)",
                color: "oklch(0.12 0.015 60)",
                fontFamily: "'DM Sans', sans-serif",
                borderRadius: "2px",
              }}
            >
              {tx(t.hero.ctaPrimary, lang)}
            </a>
            <a
              href="#ukazka"
              onClick={() =>
                trackEvent(lang, "cta_click", {
                  location: "hero",
                  label: "secondary",
                })
              }
              className="inline-flex items-center justify-center px-8 py-4 text-sm border border-white/15 text-[oklch(0.62_0.02_72)] hover:border-[oklch(0.78_0.12_85/0.4)] hover:text-gold transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                borderRadius: "2px",
              }}
            >
              {tx(t.hero.ctaSecondary, lang)}
            </a>
          </div>
          <div
            className="mt-16 flex gap-0 flex-wrap border border-white/8"
            style={{ borderRadius: "2px", display: "inline-flex" }}
          >
            {[
              {
                num: "17",
                label: tx(t.hero.stat1, lang),
                hint: undefined as string | undefined,
              },
              {
                num: "13",
                label: tx(t.hero.stat2, lang),
                hint: undefined as string | undefined,
              },
              {
                num: "17",
                label: tx(t.hero.stat3, lang),
                hint: tx(t.hero.stat3Hint, lang),
              },
            ].map((s, i) => {
              const cell = (
                <div
                  className={`px-6 py-4 ${i < 2 ? "border-r border-white/8" : ""} ${s.hint ? "cursor-help" : ""}`}
                >
                  <p
                    className="text-2xl font-bold text-gold"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.num}
                  </p>
                  <p
                    className="text-xs text-[oklch(0.42_0.02_68)] mt-0.5 uppercase tracking-widest"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {s.label}
                  </p>
                </div>
              );
              if (!s.hint) return <div key={s.label}>{cell}</div>;
              return (
                <Tooltip
                  key={s.label}
                  onOpenChange={open => {
                    if (open)
                      trackEvent(lang, "stat_hint_hover", { stat: s.label });
                  }}
                >
                  <TooltipTrigger asChild>{cell}</TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm leading-relaxed">
                    {s.hint}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────
function About() {
  const { lang } = useLang();
  const ref = useFadeUp();
  return (
    <section id="o-mne" className="py-24 bg-[oklch(0.14_0.015_60)]">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div ref={ref} className="fade-up">
            <SectionLabel>{tx(t.about.label, lang)}</SectionLabel>
            <GoldLine className="mb-8" />
            <h2
              className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {tx(t.about.h2a, lang)}
              <br />
              <span className="italic text-gold">{tx(t.about.h2b, lang)}</span>
            </h2>
            <p
              className="text-[oklch(0.60_0.02_72)] leading-relaxed mb-5"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {tx(t.about.p1, lang)}
            </p>
            <p
              className="text-[oklch(0.60_0.02_72)] leading-relaxed mb-8"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {tx(t.about.p2, lang)}
            </p>
            <div className="flex flex-wrap gap-2">
              {(t.about.tags[lang] as readonly string[]).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 border border-[oklch(0.78_0.12_85/0.2)] text-[oklch(0.62_0.02_72)]"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    borderRadius: "2px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-none opacity-15"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, oklch(0.78 0.12 85), transparent 70%)",
              }}
            />
            <div
              className="relative"
              style={{
                border: "1px solid oklch(0.78 0.12 85 / 0.2)",
                borderRadius: "2px",
                padding: "8px",
              }}
            >
              <BlueprintCorner className="absolute -top-1 -left-1 w-5 h-5 opacity-60" />
              <BlueprintCorner className="absolute -top-1 -right-1 w-5 h-5 opacity-60 rotate-90" />
              <BlueprintCorner className="absolute -bottom-1 -left-1 w-5 h-5 opacity-60 -rotate-90" />
              <BlueprintCorner className="absolute -bottom-1 -right-1 w-5 h-5 opacity-60 rotate-180" />
              <img
                src="/images/karel-macek.jpg"
                alt="Karel Macek"
                className="w-full object-cover aspect-[3/4]"
                style={{ borderRadius: "1px" }}
              />
              <p
                className="text-center mt-2 text-[oklch(0.38_0.02_68)]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                }}
              >
                {tx(t.about.figCaption, lang)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Method ────────────────────────────────────────────────────────────────────
function Method() {
  const { lang } = useLang();
  const ref = useFadeUp();
  const steps = t.method.steps[lang];
  const packages = t.method.packages[lang];
  return (
    <section
      id="metoda"
      className="py-24 relative overflow-hidden"
      style={{ background: "oklch(0.12 0.015 60)" }}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url('/images/abstract-texture.jpg')`,
          backgroundSize: "cover",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.12 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container relative z-10">
        <div ref={ref} className="fade-up text-center mb-16">
          <SectionLabel>{tx(t.method.label, lang)}</SectionLabel>
          <GoldLine className="mx-auto mb-8" />
          <h2
            className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {tx(t.method.h2a, lang)}{" "}
            <span className="italic text-gold">{tx(t.method.h2b, lang)}</span>
          </h2>
          <p
            className="mt-4 text-[oklch(0.52_0.02_70)] max-w-xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            {tx(t.method.sub, lang)}
          </p>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.78_0.12_85/0.3)] to-transparent" />
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <StepCard key={s.num} step={s} delay={i * 80} />
            ))}
          </div>
        </div>
        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {packages.map(pkg => (
            <PatentCard key={pkg.label}>
              <p
                className="text-[oklch(0.42_0.02_68)] mb-1"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.2em",
                }}
              >
                {pkg.tag}
              </p>
              <p
                className="text-gold font-semibold mb-2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.1rem",
                }}
              >
                {pkg.label}
              </p>
              <p
                className="text-[oklch(0.52_0.02_70)] text-sm leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                {pkg.desc}
              </p>
            </PatentCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  delay,
}: {
  step: { num: string; title: string; desc: string };
  delay: number;
}) {
  const ref = useFadeUp(delay);
  return (
    <div ref={ref} className="fade-up">
      <PatentCard>
        <p
          className="text-3xl font-bold text-gold mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {step.num}
        </p>
        <h3
          className="text-base font-semibold text-[oklch(0.88_0.02_80)] mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {step.title}
        </h3>
        <p
          className="text-xs text-[oklch(0.50_0.02_68)] leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
        >
          {step.desc}
        </p>
      </PatentCard>
    </div>
  );
}

// ── Why me ────────────────────────────────────────────────────────────────────
function WhyMe() {
  const { lang } = useLang();
  const ref = useFadeUp();
  const reasons = t.whyme.reasons[lang];
  const [a, b, c] = t.whyme.h2[lang];
  return (
    <section id="proc-ja" className="py-24 bg-[oklch(0.14_0.015_60)]">
      <div className="container">
        <div ref={ref} className="fade-up mb-16">
          <SectionLabel>{tx(t.whyme.label, lang)}</SectionLabel>
          <GoldLine className="mb-8" />
          <h2
            className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] max-w-xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {a}
            <span className="italic text-gold">{b}</span>
            {c}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {reasons.map((r, i) => (
            <ReasonCard key={r.title} reason={r} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReasonCard({
  reason,
  delay,
}: {
  reason: { icon: string; title: string; desc: string };
  delay: number;
}) {
  const ref = useFadeUp(delay);
  return (
    <div ref={ref} className="fade-up">
      <PatentCard className="flex gap-5 hover:border-[oklch(0.78_0.12_85/0.3)] transition-colors duration-200 group">
        <div className="shrink-0 mt-0.5 text-gold opacity-70 group-hover:opacity-100 transition-opacity duration-200">
          {icons[reason.icon]}
        </div>
        <div>
          <h3
            className="text-base font-semibold text-[oklch(0.88_0.02_80)] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {reason.title}
          </h3>
          <p
            className="text-sm text-[oklch(0.52_0.02_70)] leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            {reason.desc}
          </p>
        </div>
      </PatentCard>
    </div>
  );
}

// ── Client problems ───────────────────────────────────────────────────────────
function ClientProblems() {
  const { lang } = useLang();
  const ref = useFadeUp();
  const items = t.problems.items[lang];
  const [a, b, c] = t.problems.h2[lang];
  return (
    <section
      id="klienti"
      className="py-24"
      style={{ background: "oklch(0.12 0.015 60)" }}
    >
      <div className="container">
        <div ref={ref} className="fade-up mb-16">
          <SectionLabel>{tx(t.problems.label, lang)}</SectionLabel>
          <GoldLine className="mb-8" />
          <h2
            className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] max-w-2xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {a}
            <span className="italic text-gold">{b}</span>
            {c}
          </h2>
          <p
            className="mt-4 text-[oklch(0.50_0.02_68)] max-w-xl"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            {tx(t.problems.sub, lang)}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((p, i) => (
            <ProblemCard key={p.label} problem={p} delay={i * 35} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemCard({
  problem,
  delay,
}: {
  problem: { icon: string; label: string; desc: string };
  delay: number;
}) {
  const ref = useFadeUp(delay);
  return (
    <div ref={ref} className="fade-up group">
      <div
        className="relative p-4 transition-all duration-200 hover:-translate-y-1"
        style={{
          background: "oklch(0.155 0.015 60)",
          border: "1px solid oklch(1 0 0 / 7%)",
          borderRadius: "2px",
        }}
      >
        <BlueprintCorner className="absolute top-1.5 left-1.5 w-3 h-3 opacity-25 group-hover:opacity-55 transition-opacity duration-200" />
        <div className="text-[oklch(0.52_0.02_68)] group-hover:text-gold transition-colors duration-200 mb-3 mt-1">
          {icons[problem.icon]}
        </div>
        <h3
          className="text-sm font-semibold text-[oklch(0.82_0.02_78)] mb-1 group-hover:text-gold transition-colors duration-200"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
        >
          {problem.label}
        </h3>
        <p
          className="text-xs text-[oklch(0.46_0.02_68)] leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
        >
          {problem.desc}
        </p>
      </div>
    </div>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials() {
  const { lang } = useLang();
  const ref = useFadeUp();
  const T = t.testimonials;
  const main = T.main[lang];
  const cases = T.cases[lang];
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [lang]);
  const linkedinUrl =
    "https://www.linkedin.com/in/karelmacek/details/recommendations/";

  return (
    <section
      id="reference"
      className="py-24"
      style={{ background: "oklch(0.14 0.015 60)" }}
    >
      <div className="container">
        <div ref={ref} className="fade-up mb-16">
          <SectionLabel>{tx(T.eyebrow, lang)}</SectionLabel>
          <GoldLine className="mb-8" />
          <h2
            className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {tx(T.h2, lang)}
          </h2>
        </div>
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <PatentCard className="lg:col-span-3 p-8">
            <p
              className="text-[oklch(0.52_0.02_68)] mb-4"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
              }}
            >
              {tx(T.caseLabel, lang)} 01
            </p>
            <p
              className="text-lg leading-relaxed text-[oklch(0.86_0.02_78)] text-pretty max-w-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="text-gold italic">&ldquo;</span>
              {main.quote}
              <span className="text-gold italic">&rdquo;</span>
            </p>
            {expanded && (
              <p className="mt-4 text-sm text-[oklch(0.52_0.02_70)] leading-relaxed whitespace-pre-line">
                {main.before}
                {"\n\n"}
                {main.after}
              </p>
            )}
            <p
              className="mt-6 text-xs text-[oklch(0.50_0.02_70)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span
                className="text-[oklch(0.42_0.02_68)]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.15em",
                }}
              >
                {tx(T.resultsLabel, lang)}
              </span>
              {"  "}
              {main.results.join(" · ")}
            </p>
            <div className="mt-10 flex items-end justify-between flex-wrap gap-4">
              <div>
                <p
                  className="font-semibold text-gold"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {main.name}
                </p>
                <p className="text-xs text-[oklch(0.56_0.02_68)]">
                  {main.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !expanded;
                  setExpanded(next);
                  if (next)
                    trackEvent(lang, "testimonial_expand", { name: main.name });
                }}
                className="text-xs text-gold hover:opacity-80 transition-opacity duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {expanded ? tx(T.collapseLabel, lang) : tx(T.expandLabel, lang)}
              </button>
            </div>
            <div
              className="mt-4 pt-4 text-xs"
              style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}
            >
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent(lang, "testimonial_linkedin_click", {
                    name: main.name,
                  })
                }
                className="text-[oklch(0.70_0.02_72)] hover:text-gold transition-colors duration-200"
              >
                {tx(T.linkedinCta, lang)}
              </a>
            </div>
          </PatentCard>

          <div className="lg:col-span-2 flex flex-col gap-6">
            {cases.map((c, i) => (
              <PatentCard key={c.name}>
                <p
                  className="text-[oklch(0.52_0.02_68)] mb-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    letterSpacing: "0.2em",
                  }}
                >
                  {tx(T.caseLabel, lang)} 0{i + 2}
                </p>
                <p
                  className="text-sm leading-relaxed text-[oklch(0.78_0.02_78)] text-pretty"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <span className="text-gold italic">&ldquo;</span>
                  {c.quote}
                  <span className="text-gold italic">&rdquo;</span>
                </p>
                <div className="mt-4">
                  <p
                    className="text-sm font-semibold text-gold"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {c.name}
                  </p>
                  <p className="text-xs text-[oklch(0.56_0.02_68)]">{c.role}</p>
                </div>
                <div
                  className="mt-3 pt-3 text-xs"
                  style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}
                >
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent(lang, "testimonial_linkedin_click", {
                        name: c.name,
                      })
                    }
                    className="text-[oklch(0.70_0.02_72)] hover:text-gold transition-colors duration-200"
                  >
                    {tx(T.linkedinCta, lang)}
                  </a>
                </div>
              </PatentCard>
            ))}
          </div>
        </div>
        {lang === "cs" && (
          <p
            className="mt-8 text-xs text-[oklch(0.50_0.02_68)] max-w-2xl"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {tx(T.translationNote, lang)}
          </p>
        )}
      </div>
    </section>
  );
}

// ── Demo ──────────────────────────────────────────────────────────────────────
function SusitaDemo() {
  const { lang } = useLang();
  const ref = useFadeUp();
  const [visible, setVisible] = useState(4);
  const chat = t.demo.chat[lang];

  // Reset visible count when language changes
  useEffect(() => {
    setVisible(4);
  }, [lang]);

  return (
    <section id="ukazka" className="py-24 bg-[oklch(0.14_0.015_60)]">
      <div className="container">
        <div ref={ref} className="fade-up mb-12">
          <SectionLabel>{tx(t.demo.label, lang)}</SectionLabel>
          <GoldLine className="mb-8" />
          <h2
            className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] max-w-2xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {tx(t.demo.h2a, lang)}{" "}
            <span className="italic text-gold">{tx(t.demo.h2b, lang)}</span>
          </h2>
          <p
            className="mt-4 text-[oklch(0.50_0.02_68)] max-w-xl text-pretty"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            {tx(t.demo.sub, lang)}
          </p>
        </div>
        <div
          className="max-w-2xl mx-auto relative"
          style={{
            border: "1px solid oklch(0.78 0.12 85 / 0.15)",
            borderRadius: "2px",
            padding: "2rem",
          }}
        >
          <BlueprintCorner className="absolute -top-1 -left-1 w-5 h-5 opacity-50" />
          <BlueprintCorner className="absolute -top-1 -right-1 w-5 h-5 opacity-50 rotate-90" />
          <p
            className="text-center mb-6 text-[oklch(0.36_0.02_68)]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
            }}
          >
            {tx(t.demo.transcript, lang)}
          </p>
          <div className="space-y-4">
            {chat.slice(0, visible).map((msg, i) => (
              <ChatBubble key={`${lang}-${i}`} msg={msg} delay={i * 60} />
            ))}
          </div>
          {visible < chat.length && (
            <div className="text-center mt-8">
              <button
                onClick={() =>
                  setVisible(v => {
                    const next = Math.min(v + 3, chat.length);
                    trackEvent(lang, "demo_expand", {
                      visible_count: next,
                      complete: next >= chat.length,
                    });
                    return next;
                  })
                }
                className="text-sm px-6 py-2.5 border border-[oklch(0.78_0.12_85/0.25)] text-gold hover:bg-[oklch(0.78_0.12_85/0.08)] transition-all duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: "2px",
                }}
              >
                {tx(t.demo.showMore, lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChatBubble({
  msg,
  delay,
}: {
  msg: { role: string; name: string; text: string };
  delay: number;
}) {
  const ref = useFadeUp(delay);
  const isCoach = msg.role === "coach";
  return (
    <div
      ref={ref}
      className={`fade-up flex gap-3 ${isCoach ? "" : "flex-row-reverse"}`}
    >
      <div
        className="w-7 h-7 shrink-0 flex items-center justify-center text-xs font-bold mt-1"
        style={{
          background: isCoach ? "oklch(0.78 0.12 85)" : "oklch(0.22 0.015 60)",
          color: isCoach ? "oklch(0.12 0.015 60)" : "oklch(0.62 0.02 72)",
          fontFamily: "'DM Sans', sans-serif",
          borderRadius: "2px",
          border: isCoach ? "none" : "1px solid oklch(1 0 0 / 10%)",
        }}
      >
        {msg.name[0]}
      </div>
      <div className="flex-1 max-w-[85%]">
        <p
          className="text-xs mb-1.5"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: isCoach ? "oklch(0.62 0.08 83)" : "oklch(0.42 0.02 68)",
            textAlign: isCoach ? "left" : "right",
          }}
        >
          {msg.name}
        </p>
        <div
          className={`p-3.5 text-sm leading-relaxed ${isCoach ? "chat-bubble-coach" : "chat-bubble-client"}`}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            color: "oklch(0.78 0.02 75)",
            borderRadius: "2px",
          }}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

// ── Pricing / funnel ─────────────────────────────────────────────────────────
type PricingStep = {
  num: string;
  icon: string;
  title: string;
  desc: string;
  price?: string;
  cta?: string;
  yesNo?: {
    yes: string;
    no: string;
    noResponse: string;
  };
};

const CAROUSEL_CARD_WIDTH = "clamp(280px, 40%, 460px)";
// Half the leftover track width once one card is centered — used as the
// spacer width so the first/last cards have room to center too.
const CAROUSEL_SPACER_WIDTH = `calc((100% - ${CAROUSEL_CARD_WIDTH}) / 2)`;

function Pricing({
  onQuickCheckClick,
  quickCheckDone,
  quickReflectionOpen,
  step1Answer,
  onStep1AnswerChange,
  onDiagnosticsInfoClick,
  onCollaborationInfoClick,
}: {
  onQuickCheckClick: () => void;
  quickCheckDone: boolean;
  quickReflectionOpen: boolean;
  step1Answer: "yes" | "no" | null;
  onStep1AnswerChange: (answer: "yes" | "no") => void;
  onDiagnosticsInfoClick: () => void;
  onCollaborationInfoClick: () => void;
}) {
  const { lang } = useLang();
  const ref = useFadeUp();
  const steps = t.pricing.steps[lang] as readonly PricingStep[];
  const packages = t.method.packages[lang];

  // Carousel: the "current" step is always centered and fully visible, with
  // its neighbours peeking ~30% in on either side — including step 01 at
  // rest, so a newcomer's first prompt lands front and center rather than
  // pinned to the left edge. Spacer elements at each end of the track (see
  // CAROUSEL_CARD_WIDTH below) give the first/last cards room to actually
  // center instead of clamping against the scroll boundary.
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const progressIndex = quickCheckDone ? 2 : step1Answer === "yes" ? 1 : 0;
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    setActiveIndex(progressIndex);
  }, [progressIndex]);

  useEffect(() => {
    cardRefs.current[activeIndex]?.scrollIntoView({
      // Center step 01 instantly on first render — no animated slide-in
      // the visitor didn't ask for. Later moves (progress, arrows, dots)
      // animate normally.
      behavior: hasScrolledRef.current ? "smooth" : "auto",
      inline: "center",
      block: "nearest",
    });
    hasScrolledRef.current = true;
  }, [activeIndex]);

  // Mobile has no horizontal carousel to re-center — it's a plain stacked
  // column — but it still needs to auto-advance the viewport to the next
  // step (e.g. after answering "Možná" on step 01), otherwise the visitor
  // is stuck looking at the step they just answered with no indication
  // anything happened. Separate ref array/effect from the desktop carousel
  // above since both card sets are mounted simultaneously (shown/hidden via
  // CSS breakpoints, not conditional rendering) — sharing one array would
  // let one overwrite the other.
  //
  // Skip the very first run: unlike the desktop effect (which uses
  // block: "nearest", a no-op if already visible), block: "center" here
  // always moves the page — firing it on mount would yank a fresh visitor
  // straight down to this section before they've done anything.
  //
  // Also skip while the quick-check modal is open: completing it sets
  // quickCheckDone (and so activeIndex) while the visitor is still reading
  // their result inside the still-open dialog. Radix locks page scroll
  // while it's open, so a scrollIntoView fired at that moment is a no-op —
  // the visitor closes the modal and lands back exactly where they started,
  // with no jump to step 03. Deferring to the reflectionOpen→closed
  // transition (same activeIndex, dependency array below) fires the scroll
  // once it can actually move the page.
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isFirstMobileScrollRef = useRef(true);

  useEffect(() => {
    if (isFirstMobileScrollRef.current) {
      isFirstMobileScrollRef.current = false;
      return;
    }
    if (quickReflectionOpen) return;
    mobileCardRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex, quickReflectionOpen]);

  function goToStep(delta: number) {
    setActiveIndex(i => Math.min(steps.length - 1, Math.max(0, i + delta)));
  }

  const declined = step1Answer === "no";
  const restOfPricingStyle: React.CSSProperties = {
    transition: "opacity 300ms ease, filter 300ms ease",
    opacity: declined ? 0.3 : undefined,
    filter: declined ? "grayscale(1)" : undefined,
    pointerEvents: declined ? "none" : undefined,
  };

  return (
    <section
      id="jak-zacit"
      className="py-24 relative overflow-hidden"
      style={{ background: "oklch(0.12 0.015 60)" }}
    >
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.12 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container relative z-10">
        <div
          ref={ref}
          className="fade-up text-center mb-16"
          style={restOfPricingStyle}
        >
          <SectionLabel>{tx(t.pricing.label, lang)}</SectionLabel>
          <GoldLine className="mx-auto mb-8" />
          <h2
            className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {tx(t.pricing.h2a, lang)}{" "}
            <span className="italic text-gold">{tx(t.pricing.h2b, lang)}</span>
          </h2>
          <p
            className="mt-4 text-[oklch(0.52_0.02_70)] max-w-xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            {tx(t.pricing.sub, lang)}
          </p>
        </div>

        {/* Tablet+: a peeking carousel. Cards are ~40% of the track width, so
            at rest (index 0) exactly two and a half are visible; centering
            any later card via scrollIntoView naturally leaves ~30% of its
            neighbours showing on each side. */}
        <div className="hidden md:block">
          <div
            ref={trackRef}
            className="no-scrollbar flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
            style={{
              // Fades card content (not just a painted rectangle) into
              // the edges, so a peeking card's icon/title trail off
              // smoothly instead of being sliced flush against the arrows.
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 64px, black calc(100% - 64px), transparent)",
              maskImage:
                "linear-gradient(to right, transparent, black 64px, black calc(100% - 64px), transparent)",
            }}
          >
            <div
              aria-hidden
              className="shrink-0"
              style={{ width: CAROUSEL_SPACER_WIDTH }}
            />
            {steps.map((s, i) => (
              <div
                key={s.num}
                ref={el => {
                  cardRefs.current[i] = el;
                }}
                className="flex items-stretch shrink-0 snap-center"
                style={{ width: CAROUSEL_CARD_WIDTH }}
              >
                <FunnelStepCard
                  step={s}
                  lang={lang}
                  delay={i * 80}
                  packages={s.num === "05" ? packages : undefined}
                  onQuickCheckClick={onQuickCheckClick}
                  quickCheckDone={quickCheckDone}
                  highlightCta={
                    s.num === "02"
                      ? step1Answer === "yes"
                      : s.num === "03"
                        ? quickCheckDone
                        : undefined
                  }
                  muted={s.num === "01" ? undefined : step1Answer === "no"}
                  onAnswerChange={
                    s.num === "01" ? onStep1AnswerChange : undefined
                  }
                  onDiagnosticsInfoClick={
                    s.num === "03" ? onDiagnosticsInfoClick : undefined
                  }
                  onCollaborationInfoClick={
                    s.num === "05" ? onCollaborationInfoClick : undefined
                  }
                />
              </div>
            ))}
            <div
              aria-hidden
              className="shrink-0"
              style={{ width: CAROUSEL_SPACER_WIDTH }}
            />
          </div>

          {/* Nav controls live below the track, not on top of it — arrows
              styled as plain chevrons (no circular border) so they read as
              controls, not as more of the same gold icon-circles the cards
              already use for their category icons. */}
          <div
            className="mt-5 flex items-center justify-center gap-5"
            style={restOfPricingStyle}
          >
            <button
              type="button"
              onClick={() => goToStep(-1)}
              disabled={activeIndex === 0}
              aria-label={tx(t.pricing.prevStep, lang)}
              className={`text-2xl leading-none text-muted-foreground transition-all duration-200 hover:text-gold disabled:opacity-0 ${activeIndex === 0 ? "pointer-events-none" : ""}`}
            >
              ‹
            </button>
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`${tx(t.pricing.goToStep, lang)} ${i + 1}`}
                  aria-current={activeIndex === i}
                  className="p-1.5"
                >
                  <span
                    className="block h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: activeIndex === i ? "1.5rem" : "0.375rem",
                      background:
                        activeIndex === i
                          ? "oklch(0.78 0.12 85)"
                          : "oklch(1 0 0 / 15%)",
                    }}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => goToStep(1)}
              disabled={activeIndex === steps.length - 1}
              aria-label={tx(t.pricing.nextStep, lang)}
              className={`text-2xl leading-none text-muted-foreground transition-all duration-200 hover:text-gold disabled:opacity-0 ${activeIndex === steps.length - 1 ? "pointer-events-none" : ""}`}
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-6">
          {steps.map((s, i) => (
            <div
              key={s.num}
              ref={el => {
                mobileCardRefs.current[i] = el;
              }}
            >
              <FunnelStepCard
                step={s}
                lang={lang}
                delay={i * 80}
                packages={s.num === "05" ? packages : undefined}
                onQuickCheckClick={onQuickCheckClick}
                quickCheckDone={quickCheckDone}
                highlightCta={
                  s.num === "02"
                    ? step1Answer === "yes"
                    : s.num === "03"
                      ? quickCheckDone
                      : undefined
                }
                muted={s.num === "01" ? undefined : step1Answer === "no"}
                onAnswerChange={
                  s.num === "01" ? onStep1AnswerChange : undefined
                }
                onDiagnosticsInfoClick={
                  s.num === "03" ? onDiagnosticsInfoClick : undefined
                }
                onCollaborationInfoClick={
                  s.num === "05" ? onCollaborationInfoClick : undefined
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-3xl mx-auto" style={restOfPricingStyle}>
          <PatentCard className="text-center">
            <p
              className="text-sm text-[oklch(0.60_0.02_72)] leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {tx(t.pricing.discountNote, lang)}
            </p>
          </PatentCard>
        </div>
      </div>
    </section>
  );
}

function FunnelStepCard({
  step,
  lang,
  delay,
  packages,
  onQuickCheckClick,
  quickCheckDone,
  highlightCta,
  muted,
  onAnswerChange,
  onDiagnosticsInfoClick,
  onCollaborationInfoClick,
}: {
  step: PricingStep;
  lang: Lang;
  delay: number;
  packages?: readonly {
    label: string;
    tag: string;
    price: string;
    desc: string;
  }[];
  onQuickCheckClick?: () => void;
  quickCheckDone?: boolean;
  highlightCta?: boolean;
  muted?: boolean;
  onAnswerChange?: (answer: "yes" | "no") => void;
  onDiagnosticsInfoClick?: () => void;
  onCollaborationInfoClick?: () => void;
}) {
  const ref = useFadeUp(delay);
  const [yesNoAnswer, setYesNoAnswer] = useState<"yes" | "no" | null>(null);
  // Step "03" no longer lives here — it opens DiagnosticsInfoModal instead
  // of linking straight out, so its CTA is handled as its own button below.
  const ctaMeta: Record<string, { event: string; url?: { cs: string; en: string } }> = {
    "04": {
      event: "consult_click",
      url: {
        cs: "https://calendly.com/karel-macek/mapa-zmeny",
        en: "https://calendly.com/karel-macek/change-map",
      },
    },
  };

  return (
    <div
      ref={ref}
      className="fade-up flex-1 min-w-0"
      style={{
        transition: "opacity 300ms ease, filter 300ms ease",
        opacity: muted ? 0.4 : undefined,
        filter: muted ? "grayscale(1)" : undefined,
        pointerEvents: muted ? "none" : undefined,
      }}
    >
      <PatentCard className="h-full flex flex-col items-center text-center hover:border-[oklch(0.78_0.12_85/0.3)] transition-colors duration-200 group">
        {(() => {
          const declinedHere = yesNoAnswer === "no";
          const dimStyle: React.CSSProperties = {
            transition: "opacity 300ms ease, filter 300ms ease",
            opacity: declinedHere ? 0.3 : undefined,
            filter: declinedHere ? "grayscale(1)" : undefined,
          };
          return (
            <>
              <span
                className="absolute top-4 left-5 text-[oklch(0.78_0.12_85/0.55)]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                  ...dimStyle,
                }}
              >
                {step.num}
              </span>
              <div
                className="w-11 h-11 rounded-full border border-[oklch(0.78_0.12_85/0.4)] text-gold flex items-center justify-center mb-4 group-hover:bg-[oklch(0.78_0.12_85/0.08)] transition-colors duration-200"
                style={dimStyle}
              >
                {icons[step.icon]}
              </div>
              {/* Kept fully lit even when declined — the question itself is
                  the context the "you can leave" message is answering, so it
                  stays legible while everything decorative around it fades. */}
              <h3
                className="text-lg font-semibold text-[oklch(0.88_0.02_80)] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm text-[oklch(0.52_0.02_70)] leading-relaxed mb-4"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
                  whiteSpace: "pre-line",
                  ...dimStyle,
                }}
              >
                {step.desc}
              </p>
            </>
          );
        })()}

        {step.yesNo && (
          <div className="mt-auto w-full">
            {yesNoAnswer === "no" && (
              <p
                className="cta-emphasis mb-3 text-base font-semibold text-[oklch(0.88_0.02_80)] leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {step.yesNo.noResponse}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setYesNoAnswer("yes");
                  onAnswerChange?.("yes");
                }}
                className="px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={
                  yesNoAnswer === "yes"
                    ? {
                        background: "oklch(0.78 0.12 85)",
                        color: "oklch(0.12 0.015 60)",
                        fontFamily: "'DM Sans', sans-serif",
                        borderRadius: "2px",
                      }
                    : {
                        background: "transparent",
                        color: "oklch(0.60 0.02 72)",
                        border: "1px solid oklch(1 0 0 / 15%)",
                        fontFamily: "'DM Sans', sans-serif",
                        borderRadius: "2px",
                        transition:
                          "opacity 300ms ease, filter 300ms ease, transform 200ms",
                        opacity: yesNoAnswer === "no" ? 0.3 : undefined,
                        filter: yesNoAnswer === "no" ? "grayscale(1)" : undefined,
                      }
                }
              >
                {step.yesNo.yes}
              </button>
              <button
                type="button"
                onClick={() => {
                  setYesNoAnswer("no");
                  onAnswerChange?.("no");
                }}
                className="px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={
                  yesNoAnswer === "no"
                    ? {
                        background: "oklch(0.78 0.12 85)",
                        color: "oklch(0.12 0.015 60)",
                        fontFamily: "'DM Sans', sans-serif",
                        borderRadius: "2px",
                      }
                    : {
                        background: "transparent",
                        color: "oklch(0.60 0.02 72)",
                        border: "1px solid oklch(1 0 0 / 15%)",
                        fontFamily: "'DM Sans', sans-serif",
                        borderRadius: "2px",
                      }
                }
              >
                {step.yesNo.no}
              </button>
            </div>
          </div>
        )}

        {step.price && (
          <p
            className="text-3xl font-bold text-gold mt-auto mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {step.price}
          </p>
        )}
        {step.cta && step.num === "02" && (
          <button
            type="button"
            onClick={() => {
              trackEvent(
                lang,
                quickCheckDone ? "check_result_reopen_click" : "check_click",
                { location: "pricing" }
              );
              onQuickCheckClick?.();
            }}
            className={`inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${step.price ? "mt-2" : "mt-auto"} ${highlightCta && !quickCheckDone ? "invite-glow" : ""}`}
            style={
              quickCheckDone
                ? {
                    background: "transparent",
                    color: "oklch(0.78 0.12 85)",
                    border: "1px solid oklch(0.78 0.12 85 / 0.4)",
                    fontFamily: "'DM Sans', sans-serif",
                    borderRadius: "2px",
                  }
                : {
                    background: "oklch(0.78 0.12 85)",
                    color: "oklch(0.12 0.015 60)",
                    fontFamily: "'DM Sans', sans-serif",
                    borderRadius: "2px",
                  }
            }
          >
            {quickCheckDone && icons["check"]}
            {quickCheckDone ? tx(t.pricing.checkDoneLabel, lang) : step.cta}
          </button>
        )}
        {step.cta && step.num === "03" && (
          <button
            type="button"
            onClick={() => {
              trackEvent(lang, "diagnostics_info_click", {
                location: "pricing",
              });
              onDiagnosticsInfoClick?.();
            }}
            className={`inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${step.price ? "mt-2" : "mt-auto"} ${highlightCta ? "invite-glow" : ""}`}
            style={{
              background: "oklch(0.78 0.12 85)",
              color: "oklch(0.12 0.015 60)",
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "2px",
            }}
          >
            {step.cta}
          </button>
        )}
        {step.cta && step.num !== "02" && step.num !== "03" && step.num !== "05" && (
          <a
            href={ctaMeta[step.num]?.url?.[lang] ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent(
                lang,
                ctaMeta[step.num]?.event ?? "pricing_cta_click",
                { location: "pricing" }
              )
            }
            className={`inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${step.price ? "mt-2" : "mt-auto"} ${highlightCta ? "invite-glow" : ""}`}
            style={{
              background: "oklch(0.78 0.12 85)",
              color: "oklch(0.12 0.015 60)",
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "2px",
            }}
          >
            {step.cta}
          </a>
        )}

        {packages && (
          <ul className="mt-auto w-full grid grid-cols-2 gap-3 text-left">
            {packages.map(pkg => (
              <li key={pkg.label}>
                <p
                  className="text-[oklch(0.88_0.02_80)] text-[10px] uppercase tracking-wider mb-0.5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {pkg.tag}
                </p>
                <p
                  className="text-[oklch(0.62_0.02_72)] text-xs leading-relaxed"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {pkg.label}
                </p>
                <p
                  className="text-gold text-sm"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                  }}
                >
                  {pkg.price}
                </p>
              </li>
            ))}
          </ul>
        )}
        {step.cta && step.num === "05" && (
          <button
            type="button"
            onClick={() => {
              trackEvent(lang, "collaboration_info_click", {
                location: "pricing",
              });
              onCollaborationInfoClick?.();
            }}
            className={`inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${packages ? "mt-4" : "mt-auto"}`}
            style={{
              background: "transparent",
              color: "oklch(0.78 0.12 85)",
              border: "1px solid oklch(0.78 0.12 85 / 0.4)",
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "2px",
            }}
          >
            {step.cta}
          </button>
        )}
      </PatentCard>
    </div>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact() {
  const { lang } = useLang();
  const ref = useFadeUp();
  return (
    <section
      id="kontakt"
      className="py-24 relative overflow-hidden grain-overlay"
      style={{ background: "oklch(0.12 0.015 60)" }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('/images/abstract-texture.jpg')`,
          backgroundSize: "cover",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.12 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="container relative z-10">
        <div ref={ref} className="fade-up max-w-2xl mx-auto text-center">
          <SectionLabel>{tx(t.contact.label, lang)}</SectionLabel>
          <GoldLine className="mx-auto mb-8" />
          <h2
            className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] mb-10"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {tx(t.contact.h2a, lang)}{" "}
            <span className="italic text-gold">{tx(t.contact.h2b, lang)}</span>
          </h2>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
              <a
                href="https://calendly.com/karel-macek/30min"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent(lang, "calendly_click", { location: "contact" })
                }
                className="text-[oklch(0.52_0.02_70)] hover:text-gold transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                {tx(t.contact.call, lang)}
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("karel@macek.ai");
                  toast.success(tx(t.contact.emailCopied, lang));
                  trackEvent(lang, "email_copy", { location: "contact" });
                }}
                title={tx(t.contact.emailHint, lang)}
                className="text-[oklch(0.52_0.02_70)] hover:text-gold transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                {tx(t.contact.email, lang)}
              </button>
              <a
                href="https://linkedin.com/in/karelmacek"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent(lang, "linkedin_click", { location: "contact" })
                }
                className="text-[oklch(0.52_0.02_70)] hover:text-gold transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                {tx(t.contact.linkedin, lang)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const QUICK_REFLECTION_DONE_KEY = "quickReflectionDone";

function loadSavedReflection(): { answers: Answers; result: ResultKey } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUICK_REFLECTION_DONE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isValidReflectionState(parsed)) return parsed;
    // Stale/incompatible data from an older version of the quiz — drop it
    // so the funnel button reverts to "Spustit" instead of a permanently
    // broken "Hotovo" that crashes on reopen.
    window.localStorage.removeItem(QUICK_REFLECTION_DONE_KEY);
    return null;
  } catch {
    window.localStorage.removeItem(QUICK_REFLECTION_DONE_KEY);
    return null;
  }
}

export default function Home() {
  const { lang } = useLang();
  useScrollDepthTracking(lang);
  const [showReflection, setShowReflection] = useState(false);
  const [savedReflection, setSavedReflection] = useState(loadSavedReflection);
  const [showDiagnosticsInfo, setShowDiagnosticsInfo] = useState(false);
  const [showCollaborationInfo, setShowCollaborationInfo] = useState(false);
  const [step1Answer, setStep1Answer] = useState<"yes" | "no" | null>(null);
  const declined = step1Answer === "no";
  const { setDeclined } = useFunnelDeclined();
  useEffect(() => {
    setDeclined(declined);
  }, [declined, setDeclined]);

  // No dedicated "next step" page exists yet, so growth/change results scroll
  // the visitor to the pricing funnel (steps 03/04) rather than a hardcoded URL.
  // TODO(pricing-links): point at a dedicated /diagnostika-style destination once one exists.
  const scrollToPricing = () => {
    document
      .getElementById("jak-zacit")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Once the visitor says "no" to step 01, the rest of the site (nav, every
  // other section) dims out with it — not just the funnel steps below it —
  // so the "you can leave" suggestion reads as the page's one clear message
  // instead of competing with a fully-lit site around it.
  const restOfSiteClass = `transition-[opacity,filter] duration-500 ${declined ? "pointer-events-none opacity-30 grayscale" : ""}`;

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.12 0.015 60)" }}
    >
      <div className={restOfSiteClass}>
        <Nav />
        <Hero />
        <About />
        <Method />
        <WhyMe />
        <ClientProblems />
        <Testimonials />
        <SusitaDemo />
      </div>
      <Pricing
        onQuickCheckClick={() => setShowReflection(true)}
        quickCheckDone={!!savedReflection}
        quickReflectionOpen={showReflection}
        step1Answer={step1Answer}
        onStep1AnswerChange={setStep1Answer}
        onDiagnosticsInfoClick={() => setShowDiagnosticsInfo(true)}
        onCollaborationInfoClick={() => setShowCollaborationInfo(true)}
      />
      <div className={restOfSiteClass}>
        <Contact />
        <Footer />
      </div>
      <QuickReflectionModal
        isOpen={showReflection}
        initialState={savedReflection ?? undefined}
        onClose={() => setShowReflection(false)}
        onComplete={(answers, result) => {
          const payload = { answers, result };
          setSavedReflection(payload);
          window.localStorage.setItem(
            QUICK_REFLECTION_DONE_KEY,
            JSON.stringify(payload)
          );
        }}
        onGrowthCTA={scrollToPricing}
        onChangeCTA={scrollToPricing}
        onInvalidState={() => {
          setSavedReflection(null);
          window.localStorage.removeItem(QUICK_REFLECTION_DONE_KEY);
        }}
      />
      <DiagnosticsInfoModal
        isOpen={showDiagnosticsInfo}
        onClose={() => setShowDiagnosticsInfo(false)}
      />
      <CollaborationInfoModal
        isOpen={showCollaborationInfo}
        onClose={() => setShowCollaborationInfo(false)}
      />
    </div>
  );
}
