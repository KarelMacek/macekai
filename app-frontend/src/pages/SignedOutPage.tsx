import { useEffect } from "react";

import { useTranslation } from "@/lib/i18n";

export function SignedOutPage() {
  const { t } = useTranslation();

  useEffect(() => {
    // Clear the Easy Auth session cookie in the background without navigating to Google.
    // redirect:"manual" prevents the browser following the redirect to Google's own
    // logout/consent pages while still letting the browser apply the Set-Cookie that
    // expires the session.
    fetch("/.auth/logout", { redirect: "manual", credentials: "include" }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">{t("signedOut")}</h2>
      <a className="text-primary underline underline-offset-4" href="/.auth/login/google?post_login_redirect_uri=/">
        {t("signIn")}
      </a>
    </div>
  );
}
