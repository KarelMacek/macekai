import { useTranslation } from "@/lib/i18n";

interface Props {
  current: number;
  total: number;
}

// Re-entering a draft never silently drops the user back into question N
// with no acknowledgment that time has passed — this is that
// acknowledgment, shown once right above the resumed question.
export function ResumeBanner({ current, total }: Props) {
  const { t } = useTranslation();

  return (
    <p className="mb-4 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">
      {t("resumeBanner", { current, total })}
    </p>
  );
}
