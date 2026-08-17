/**
 * CollaborationInfoModal — info popup for the "Další spolupráce" funnel step.
 * Unlike DiagnosticsInfoModal there's no single checkout link to send people
 * to — longer-term coaching starts as a conversation, so this repeats the
 * same three contact channels as the Contact section (Calendly 30-min call,
 * email, LinkedIn), just framed for someone weighing a longer program.
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { t, tx } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";

interface CollaborationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborationInfoModal({
  isOpen,
  onClose,
}: CollaborationInfoModalProps) {
  const { lang } = useLang();
  const copy = t.pricing.collaborationModal;

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
              className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {tx(copy.body, lang)}
            </DialogPrimitive.Description>

            <p
              className="mb-4 text-xs text-muted-foreground/80"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {tx(copy.contactIntro, lang)}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="https://calendly.com/karel-macek/30min"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent(lang, "calendly_click", {
                    location: "pricing_collaboration_modal",
                  })
                }
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--gold)",
                  color: "oklch(0.12 0.015 60)",
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: "2px",
                }}
              >
                {tx(t.contact.call, lang)} →
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("karel@macek.ai");
                  toast.success(tx(t.contact.emailCopied, lang));
                  trackEvent(lang, "email_copy", {
                    location: "pricing_collaboration_modal",
                  });
                }}
                title={tx(t.contact.emailHint, lang)}
                className="inline-flex items-center justify-center px-6 py-3 text-sm text-muted-foreground transition-colors duration-150 hover:text-gold"
                style={{
                  border: "1px solid var(--border)",
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: "2px",
                }}
              >
                {tx(t.contact.email, lang)}
              </button>
              <a
                href="https://linkedin.com/in/karelmacek"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent(lang, "linkedin_click", {
                    location: "pricing_collaboration_modal",
                  })
                }
                className="inline-flex items-center justify-center px-6 py-3 text-sm text-muted-foreground transition-colors duration-150 hover:text-gold"
                style={{
                  border: "1px solid var(--border)",
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: "2px",
                }}
              >
                {tx(t.contact.linkedin, lang)}
              </a>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}