/**
 * Karel Macek — Kouč pro AI & tech experty / Coach for AI & tech experts
 * Design: Inventor's Studio — dark warm charcoal + gold accent + Playfair Display
 * Style: patent-diagram framing, blueprint lines, technical annotations
 * Bilingual: CS / EN via LangContext
 */
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { t, tx, type Lang } from "@/lib/content";

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

// ── Technical SVG icons ───────────────────────────────────────────────────────
const icons: Record<string, React.ReactElement> = {
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/>
    </svg>
  ),
  sleep: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  trending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  negotiate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  hobby: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  graduation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  calm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  bridge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M3 17h18"/><path d="M3 17V9a9 9 0 0 1 18 0v8"/><path d="M9 17V9"/><path d="M15 17V9"/>
    </svg>
  ),
};

// ── Blueprint corner ──────────────────────────────────────────────────────────
function BlueprintCorner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`w-4 h-4 text-gold opacity-40 ${className}`} fill="none" stroke="currentColor" strokeWidth="1">
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

function PatentCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative p-5 ${className}`}
      style={{ background: "oklch(0.16 0.015 60)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: "2px", ...style }}
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
    <div className="flex items-center gap-0 border border-white/10 overflow-hidden" style={{ borderRadius: "2px" }}>
      {(["cs", "en"] as Lang[]).map((l) => (
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[oklch(0.12_0.015_60/0.96)] backdrop-blur-xl border-b border-white/5" : "bg-transparent"}`}>
      <div className="container flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
            <rect width="32" height="32" rx="2" fill="oklch(0.78 0.12 85 / 0.12)" stroke="oklch(0.78 0.12 85 / 0.4)" strokeWidth="1"/>
            <path d="M8 8 L8 24 M8 16 L18 8 M8 16 L20 24" stroke="oklch(0.78 0.12 85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 10 L26 10 M24 8 L24 12" stroke="oklch(0.78 0.12 85 / 0.6)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }} className="text-lg tracking-tight text-[oklch(0.93_0.02_80)]">
            Karel Macek
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-[oklch(0.52_0.02_72)] hover:text-gold transition-colors duration-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {l.label}
            </a>
          ))}
          <LangToggle />
          <a href="#kontakt" className="text-sm px-4 py-2 border border-[oklch(0.78_0.12_85/0.4)] text-gold hover:bg-[oklch(0.78_0.12_85/0.1)] transition-all duration-200" style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}>
            {tx(t.nav.cta, lang)}
          </a>
        </nav>
        <div className="md:hidden flex items-center gap-3">
          <LangToggle />
          <button className="flex flex-col gap-1.5 p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            <span className={`block w-5 h-0.5 bg-[oklch(0.93_0.02_80)] transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[oklch(0.93_0.02_80)] transition-all duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[oklch(0.93_0.02_80)] transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-[oklch(0.14_0.015_60)] border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-[oklch(0.62_0.02_72)] hover:text-gold py-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {l.label}
            </a>
          ))}
          <a href="#kontakt" onClick={() => setOpen(false)} className="text-gold border border-[oklch(0.78_0.12_85/0.4)] px-4 py-2 text-center text-sm" style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}>
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
    <section className="relative min-h-screen flex items-center overflow-hidden grain-overlay"
      style={{ background: "linear-gradient(135deg, oklch(0.10 0.015 60) 0%, oklch(0.14 0.018 65) 100%)" }}
    >
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('/images/hero-bg.jpg')`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.10_0.015_60/0.92)] via-[oklch(0.10_0.015_60/0.65)] to-transparent" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(oklch(0.78 0.12 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85) 1px, transparent 1px)", backgroundSize: "80px 80px" }}
      />
      <div className="container relative z-10 pt-24 pb-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="section-label">{tx(t.hero.label, lang)}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "oklch(0.42 0.02 68)" }}>PAT. №17</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.08 }} className="text-5xl md:text-7xl font-bold text-[oklch(0.93_0.02_80)] mb-6">
            {tx(t.hero.h1a, lang)}
            <br />
            <span className="text-gold italic">{tx(t.hero.h1b, lang)}</span>
          </h1>
          <p className="text-lg md:text-xl text-[oklch(0.60_0.02_72)] mb-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
            {tx(t.hero.p1, lang)}
          </p>
          <p className="text-lg text-[oklch(0.60_0.02_72)] mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
            {tx(t.hero.p2, lang)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#kontakt" className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "oklch(0.78 0.12 85)", color: "oklch(0.12 0.015 60)", fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}>
              {tx(t.hero.ctaPrimary, lang)}
            </a>
            <a href="#ukazka" className="inline-flex items-center justify-center px-8 py-4 text-sm border border-white/15 text-[oklch(0.62_0.02_72)] hover:border-[oklch(0.78_0.12_85/0.4)] hover:text-gold transition-all duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}>
              {tx(t.hero.ctaSecondary, lang)}
            </a>
          </div>
          <div className="mt-16 flex gap-0 flex-wrap border border-white/8" style={{ borderRadius: "2px", display: "inline-flex" }}>
            {[
              { num: "17", label: tx(t.hero.stat1, lang) },
              { num: "3–12", label: tx(t.hero.stat2, lang) },
              { num: "AI & data", label: tx(t.hero.stat3, lang) },
            ].map((s, i) => (
              <div key={s.label} className={`px-6 py-4 ${i < 2 ? "border-r border-white/8" : ""}`}>
                <p className="text-2xl font-bold text-gold" style={{ fontFamily: "'Playfair Display', serif" }}>{s.num}</p>
                <p className="text-xs text-[oklch(0.42_0.02_68)] mt-0.5 uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</p>
              </div>
            ))}
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
            <h2 className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {tx(t.about.h2a, lang)}<br /><span className="italic text-gold">{tx(t.about.h2b, lang)}</span>
            </h2>
            <p className="text-[oklch(0.60_0.02_72)] leading-relaxed mb-5" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{tx(t.about.p1, lang)}</p>
            <p className="text-[oklch(0.60_0.02_72)] leading-relaxed mb-8" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{tx(t.about.p2, lang)}</p>
            <div className="flex flex-wrap gap-2">
              {(t.about.tags[lang] as readonly string[]).map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 border border-[oklch(0.78_0.12_85/0.2)] text-[oklch(0.62_0.02_72)]"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: "2px" }}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-none opacity-15" style={{ background: "radial-gradient(circle at 50% 50%, oklch(0.78 0.12 85), transparent 70%)" }} />
            <div className="relative" style={{ border: "1px solid oklch(0.78 0.12 85 / 0.2)", borderRadius: "2px", padding: "8px" }}>
              <BlueprintCorner className="absolute -top-1 -left-1 w-5 h-5 opacity-60" />
              <BlueprintCorner className="absolute -top-1 -right-1 w-5 h-5 opacity-60 rotate-90" />
              <BlueprintCorner className="absolute -bottom-1 -left-1 w-5 h-5 opacity-60 -rotate-90" />
              <BlueprintCorner className="absolute -bottom-1 -right-1 w-5 h-5 opacity-60 rotate-180" />
              <img src="/images/coaching-session.jpg" alt="Coaching session" className="w-full object-cover aspect-[4/3]" style={{ borderRadius: "1px" }} />
              <p className="text-center mt-2 text-[oklch(0.38_0.02_68)]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.15em" }}>
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
    <section id="metoda" className="py-24 relative overflow-hidden" style={{ background: "oklch(0.12 0.015 60)" }}>
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url('/images/abstract-texture.jpg')`, backgroundSize: "cover" }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(oklch(0.78 0.12 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />
      <div className="container relative z-10">
        <div ref={ref} className="fade-up text-center mb-16">
          <SectionLabel>{tx(t.method.label, lang)}</SectionLabel>
          <GoldLine className="mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {tx(t.method.h2a, lang)} <span className="italic text-gold">{tx(t.method.h2b, lang)}</span>
          </h2>
          <p className="mt-4 text-[oklch(0.52_0.02_70)] max-w-xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{tx(t.method.sub, lang)}</p>
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
          {packages.map((pkg) => (
            <PatentCard key={pkg.label}>
              <p className="text-[oklch(0.42_0.02_68)] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em" }}>{pkg.tag}</p>
              <p className="text-gold font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem" }}>{pkg.label}</p>
              <p className="text-[oklch(0.52_0.02_70)] text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{pkg.desc}</p>
            </PatentCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, delay }: { step: { num: string; title: string; desc: string }; delay: number }) {
  const ref = useFadeUp(delay);
  return (
    <div ref={ref} className="fade-up">
      <PatentCard>
        <p className="text-3xl font-bold text-gold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{step.num}</p>
        <h3 className="text-base font-semibold text-[oklch(0.88_0.02_80)] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{step.title}</h3>
        <p className="text-xs text-[oklch(0.50_0.02_68)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{step.desc}</p>
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
          <h2 className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] max-w-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            {a}<span className="italic text-gold">{b}</span>{c}
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

function ReasonCard({ reason, delay }: { reason: { icon: string; title: string; desc: string }; delay: number }) {
  const ref = useFadeUp(delay);
  return (
    <div ref={ref} className="fade-up">
      <PatentCard className="flex gap-5 hover:border-[oklch(0.78_0.12_85/0.3)] transition-colors duration-200 group">
        <div className="shrink-0 mt-0.5 text-gold opacity-70 group-hover:opacity-100 transition-opacity duration-200">
          {icons[reason.icon]}
        </div>
        <div>
          <h3 className="text-base font-semibold text-[oklch(0.88_0.02_80)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{reason.title}</h3>
          <p className="text-sm text-[oklch(0.52_0.02_70)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{reason.desc}</p>
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
    <section id="klienti" className="py-24" style={{ background: "oklch(0.12 0.015 60)" }}>
      <div className="container">
        <div ref={ref} className="fade-up mb-16">
          <SectionLabel>{tx(t.problems.label, lang)}</SectionLabel>
          <GoldLine className="mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] max-w-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            {a}<span className="italic text-gold">{b}</span>{c}
          </h2>
          <p className="mt-4 text-[oklch(0.50_0.02_68)] max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{tx(t.problems.sub, lang)}</p>
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

function ProblemCard({ problem, delay }: { problem: { icon: string; label: string; desc: string }; delay: number }) {
  const ref = useFadeUp(delay);
  return (
    <div ref={ref} className="fade-up group">
      <div className="relative p-4 transition-all duration-200 hover:-translate-y-1"
        style={{ background: "oklch(0.155 0.015 60)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: "2px" }}
      >
        <BlueprintCorner className="absolute top-1.5 left-1.5 w-3 h-3 opacity-25 group-hover:opacity-55 transition-opacity duration-200" />
        <div className="text-[oklch(0.52_0.02_68)] group-hover:text-gold transition-colors duration-200 mb-3 mt-1">
          {icons[problem.icon]}
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.82_0.02_78)] mb-1 group-hover:text-gold transition-colors duration-200"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{problem.label}</h3>
        <p className="text-xs text-[oklch(0.46_0.02_68)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{problem.desc}</p>
      </div>
    </div>
  );
}

// ── Demo ──────────────────────────────────────────────────────────────────────
function SusitaDemo() {
  const { lang } = useLang();
  const ref = useFadeUp();
  const [visible, setVisible] = useState(4);
  const chat = t.demo.chat[lang];

  // Reset visible count when language changes
  useEffect(() => { setVisible(4); }, [lang]);

  return (
    <section id="ukazka" className="py-24 bg-[oklch(0.14_0.015_60)]">
      <div className="container">
        <div ref={ref} className="fade-up mb-12">
          <SectionLabel>{tx(t.demo.label, lang)}</SectionLabel>
          <GoldLine className="mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] max-w-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            {tx(t.demo.h2a, lang)} <span className="italic text-gold">{tx(t.demo.h2b, lang)}</span>
          </h2>
          <p className="mt-4 text-[oklch(0.50_0.02_68)] max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{tx(t.demo.sub, lang)}</p>
        </div>
        <div className="max-w-2xl mx-auto relative"
          style={{ border: "1px solid oklch(0.78 0.12 85 / 0.15)", borderRadius: "2px", padding: "2rem" }}
        >
          <BlueprintCorner className="absolute -top-1 -left-1 w-5 h-5 opacity-50" />
          <BlueprintCorner className="absolute -top-1 -right-1 w-5 h-5 opacity-50 rotate-90" />
          <p className="text-center mb-6 text-[oklch(0.36_0.02_68)]"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em" }}>
            {tx(t.demo.transcript, lang)}
          </p>
          <div className="space-y-4">
            {chat.slice(0, visible).map((msg, i) => (
              <ChatBubble key={`${lang}-${i}`} msg={msg} delay={i * 60} />
            ))}
          </div>
          {visible < chat.length && (
            <div className="text-center mt-8">
              <button onClick={() => setVisible((v) => Math.min(v + 3, chat.length))}
                className="text-sm px-6 py-2.5 border border-[oklch(0.78_0.12_85/0.25)] text-gold hover:bg-[oklch(0.78_0.12_85/0.08)] transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}>
                {tx(t.demo.showMore, lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ msg, delay }: { msg: { role: string; name: string; text: string }; delay: number }) {
  const ref = useFadeUp(delay);
  const isCoach = msg.role === "coach";
  return (
    <div ref={ref} className={`fade-up flex gap-3 ${isCoach ? "" : "flex-row-reverse"}`}>
      <div className="w-7 h-7 shrink-0 flex items-center justify-center text-xs font-bold mt-1"
        style={{
          background: isCoach ? "oklch(0.78 0.12 85)" : "oklch(0.22 0.015 60)",
          color: isCoach ? "oklch(0.12 0.015 60)" : "oklch(0.62 0.02 72)",
          fontFamily: "'DM Sans', sans-serif", borderRadius: "2px",
          border: isCoach ? "none" : "1px solid oklch(1 0 0 / 10%)",
        }}>
        {msg.name[0]}
      </div>
      <div className="flex-1 max-w-[85%]">
        <p className="text-xs mb-1.5"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: isCoach ? "oklch(0.62 0.08 83)" : "oklch(0.42 0.02 68)", textAlign: isCoach ? "left" : "right" }}>
          {msg.name}
        </p>
        <div className={`p-3.5 text-sm leading-relaxed ${isCoach ? "chat-bubble-coach" : "chat-bubble-client"}`}
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: "oklch(0.78 0.02 75)", borderRadius: "2px" }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact() {
  const { lang } = useLang();
  const ref = useFadeUp();
  return (
    <section id="kontakt" className="py-24 relative overflow-hidden grain-overlay" style={{ background: "oklch(0.12 0.015 60)" }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('/images/abstract-texture.jpg')`, backgroundSize: "cover" }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(oklch(0.78 0.12 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.12 85) 1px, transparent 1px)", backgroundSize: "80px 80px" }}
      />
      <div className="container relative z-10">
        <div ref={ref} className="fade-up max-w-2xl mx-auto text-center">
          <SectionLabel>{tx(t.contact.label, lang)}</SectionLabel>
          <GoldLine className="mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold text-[oklch(0.93_0.02_80)] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            {tx(t.contact.h2a, lang)} <span className="italic text-gold">{tx(t.contact.h2b, lang)}</span>
          </h2>
          <p className="text-[oklch(0.52_0.02_70)] mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
            {tx(t.contact.sub, lang)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:karel@karelmacek.cz"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "oklch(0.78 0.12 85)", color: "oklch(0.12 0.015 60)", fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}>
              {tx(t.contact.email, lang)}
            </a>
            <a href="https://linkedin.com/in/karelmacek" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm border border-white/15 text-[oklch(0.62_0.02_72)] hover:border-[oklch(0.78_0.12_85/0.4)] hover:text-gold transition-all duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: "2px" }}>
              {tx(t.contact.linkedin, lang)}
            </a>
          </div>
          <div className="mt-12 max-w-sm mx-auto">
            <PatentCard>
              <p className="text-[oklch(0.38_0.02_68)] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em" }}>
                {tx(t.contact.priceLabel, lang)}
              </p>
              <p className="text-gold text-3xl font-bold my-2" style={{ fontFamily: "'Playfair Display', serif" }}>6 000 SGD</p>
              <p className="text-[oklch(0.46_0.02_68)] text-sm" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
                {tx(t.contact.priceSub, lang)}
              </p>
            </PatentCard>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const { lang } = useLang();
  return (
    <footer className="py-8 border-t border-white/5" style={{ background: "oklch(0.10 0.015 60)" }}>
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" className="w-6 h-6 opacity-40" fill="none">
            <rect width="32" height="32" rx="2" fill="oklch(0.78 0.12 85 / 0.1)" stroke="oklch(0.78 0.12 85 / 0.3)" strokeWidth="1"/>
            <path d="M8 8 L8 24 M8 16 L18 8 M8 16 L20 24" stroke="oklch(0.78 0.12 85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm text-[oklch(0.36_0.02_65)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {tx(t.footer.tagline, lang)}
          </span>
        </div>
        <p className="text-xs text-[oklch(0.28_0.02_65)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          © {new Date().getFullYear()} Karel Macek
        </p>
      </div>
    </footer>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.12 0.015 60)" }}>
      <Nav />
      <Hero />
      <About />
      <Method />
      <WhyMe />
      <ClientProblems />
      <SusitaDemo />
      <Contact />
      <Footer />
    </div>
  );
}
