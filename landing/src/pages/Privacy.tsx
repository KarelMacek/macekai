import type { ReactNode } from "react";
import { Link } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { t, tx } from "@/lib/content";
import Footer from "@/components/Footer";

function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2
        className="mb-2 text-sm font-semibold text-gold"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {heading}
      </h2>
      <div
        className="space-y-2 text-sm leading-relaxed text-muted-foreground"
        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Privacy() {
  const { lang } = useLang();

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.12 0.015 60)" }}
    >
      <header className="container flex items-center py-8">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/images/logo-icon.png"
            alt=""
            className="w-6 h-6 object-contain"
          />
          <span
            className="text-sm text-[oklch(0.88_0.02_80)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Karel Macek
          </span>
        </Link>
      </header>

      <main className="container max-w-2xl pb-24">
        <h1
          className="mb-4 text-2xl font-bold text-foreground sm:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {tx(t.privacy.title, lang)}
        </h1>

        <p
          className="mb-8 border p-4 text-xs leading-relaxed"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            borderColor: "var(--border)",
            color: "oklch(0.60 0.02 72)",
            borderRadius: "2px",
          }}
        >
          {tx(t.privacy.draftNotice, lang)}
        </p>

        <p
          className="mb-8 text-xs text-muted-foreground"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {tx(t.privacy.lastUpdated, lang)}
        </p>

        <p
          className="mb-10 text-sm leading-relaxed text-muted-foreground"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
        >
          {tx(t.privacy.intro, lang)}
        </p>

        <Section heading={tx(t.privacy.controllerHeading, lang)}>
          <p>{tx(t.privacy.controllerBody, lang)}</p>
        </Section>
        <Section heading={tx(t.privacy.dataCollectedHeading, lang)}>
          <p>{tx(t.privacy.dataCollectedGa, lang)}</p>
          <p>{tx(t.privacy.dataCollectedUmami, lang)}</p>
        </Section>
        <Section heading={tx(t.privacy.legalBasisHeading, lang)}>
          <p>{tx(t.privacy.legalBasisBody, lang)}</p>
        </Section>
        <Section heading={tx(t.privacy.rightsHeading, lang)}>
          <p>{tx(t.privacy.rightsBody, lang)}</p>
        </Section>
        <Section heading={tx(t.privacy.withdrawHeading, lang)}>
          <p>{tx(t.privacy.withdrawBody, lang)}</p>
        </Section>
        <Section heading={tx(t.privacy.thirdPartyHeading, lang)}>
          <p>{tx(t.privacy.thirdPartyBody, lang)}</p>
        </Section>
        <Section heading={tx(t.privacy.contactHeading, lang)}>
          <p>{tx(t.privacy.contactBody, lang)}</p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
