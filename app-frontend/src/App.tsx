import { Route, Switch } from "wouter";

import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LangProvider, useLang } from "@/contexts/LangContext";
import { useTranslation } from "@/lib/i18n";
import { DashboardPage } from "@/pages/DashboardPage";
import { FeedbackRequestPage } from "@/pages/FeedbackRequestPage";
import { FeedbackViewPage } from "@/pages/FeedbackViewPage";
import { SignedOutPage } from "@/pages/SignedOutPage";
import { TestPage } from "@/pages/TestPage";

function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex gap-1 text-xs">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={lang === "en" ? "font-semibold" : "text-muted-foreground"}
      >
        EN
      </button>
      <span className="text-muted-foreground">/</span>
      <button
        type="button"
        onClick={() => setLang("cs")}
        className={lang === "cs" ? "font-semibold" : "text-muted-foreground"}
      >
        CS
      </button>
    </div>
  );
}

function SignedInApp() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <span className="font-semibold">{t("appTitle")}</span>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <LangSwitcher />
          <span>{user?.email}</span>
          <a href="/logout/" className="hover:text-foreground">
            {t("signOut")}
          </a>
        </div>
      </header>
      <Switch>
        <Route path="/tests/:slug" component={TestPage} />
        <Route path="/feedback-request" component={FeedbackRequestPage} />
        <Route path="/feedback" component={FeedbackViewPage} />
        <Route path="/" component={DashboardPage} />
      </Switch>
    </div>
  );
}

function SignedOutLanding() {
  const { devLoginAvailable } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">{t("appTitle")}</h1>
      <a className="text-primary underline underline-offset-4" href="/.auth/login/google?post_login_redirect_uri=/">
        {t("signIn")}
      </a>
      {devLoginAvailable && (
        <a className="text-sm text-muted-foreground underline underline-offset-4" href="/dev-login/">
          {t("devLogin")}
        </a>
      )}
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const isSignedOut = window.location.pathname === "/signed-out";
  if (isSignedOut) return <SignedOutPage />;
  if (loading) return <p className="p-8 text-sm text-muted-foreground">{t("loading")}</p>;
  return user ? <SignedInApp /> : <SignedOutLanding />;
}

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </LangProvider>
  );
}

export default App;
