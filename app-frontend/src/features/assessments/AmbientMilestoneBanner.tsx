import { useEffect, useState } from "react";

const VISIBLE_MS = 2400;
const FADE_MS = 300;

interface Props {
  message: string;
  onDone: () => void;
}

// Light, non-blocking "you're past halfway" / "just a few more" nudges —
// unlike MilestoneInterstitial, these never require a tap: they appear,
// hold, fade, and unmount themselves via onDone. Exists purely so the
// visitor is never wondering how much is left, without repeating the
// heavier 30% interruption more than once.
export function AmbientMilestoneBanner({ message, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    const doneTimer = setTimeout(onDone, VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p
      role="status"
      className="mb-4 text-center text-xs text-muted-foreground transition-opacity"
      style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
    >
      {message}
    </p>
  );
}
