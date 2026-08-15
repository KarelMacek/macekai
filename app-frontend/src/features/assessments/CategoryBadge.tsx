interface Props {
  label: string | null;
}

// Purely informational per-question label (e.g. "Relationships") sourced
// from the question's own category — NOT a fabricated "chapter" structure.
// The 60 snapshot questions are deliberately round-robin-interleaved across
// categories at the data layer so no stretch is all one topic; this badge
// only names what a single question touches, without implying any
// reordering or grouping that doesn't actually exist.
export function CategoryBadge({ label }: Props) {
  if (!label) return null;

  return (
    <span
      className="section-label mb-2 inline-block"
      style={{ letterSpacing: "0.1em" }}
    >
      {label}
    </span>
  );
}
