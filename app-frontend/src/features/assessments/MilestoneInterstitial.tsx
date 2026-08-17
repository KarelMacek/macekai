import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface Props {
  message: string;
  onContinue: () => void;
}

// The one deliberate, blocking pause in the snapshot test (~30% mark) —
// auto-advance stops here on purpose. Requiring a conscious tap to continue
// is what actually breaks a rapid-click autopilot rhythm; an ambient banner
// alone wouldn't.
export function MilestoneInterstitial({ message, onContinue }: Props) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-16 text-center">
      <p className="text-lg font-medium">{message}</p>
      <Button onClick={onContinue}>{t("continueButton")}</Button>
    </div>
  );
}
