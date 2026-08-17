import { useEffect, useState } from "react";
import { Route, Switch } from "wouter";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useTranslation } from "@/lib/i18n";
import { ConsentGate } from "@/features/onboarding/ConsentGate";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminDiagnosticsDetailPage } from "@/pages/admin/AdminDiagnosticsDetailPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DiagnosticsHistoryPage } from "@/pages/DiagnosticsHistoryPage";
import { FeedbackRequestPage } from "@/pages/FeedbackRequestPage";
import { FeedbackViewPage } from "@/pages/FeedbackViewPage";
import { SignedOutPage } from "@/pages/SignedOutPage";
import { TestPage } from "@/pages/TestPage";

type ViewMode = "user" | "admin";
const VIEW_MODE_KEY = "macekai-view-mode";

function useViewMode(isStaff: boolean) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    (localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null) ?? "user"
  );

  useEffect(() => {
    if (!isStaff && viewMode === "admin") setViewMode("user");
  }, [isStaff, viewMode]);

  function setMode(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }

  return { viewMode: isStaff ? viewMode : "user", setMode } as const;
}

function ViewModeToggle({ viewMode, setMode }: { viewMode: ViewMode; setMode: (mode: ViewMode) => void }) {
  const { t } = useTranslation();
  return (
    <div className="section-label flex gap-1">
      <button
        type="button"
        onClick={() => setMode("user")}
        className={viewMode === "user" ? "text-gold" : "text-muted-foreground"}
      >
        {t("viewModeUser")}
      </button>
      <span className="text-muted-foreground">/</span>
      <button
        type="button"
        onClick={() => setMode("admin")}
        className={viewMode === "admin" ? "text-gold" : "text-muted-foreground"}
      >
        {t("viewModeAdmin")}
      </button>
    </div>
  );
}

function SignedInApp() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { viewMode, setMode } = useViewMode(!!user?.is_staff);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <h1 className="text-lg font-semibold text-gold">{t("appTitle")}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {user?.is_staff && <ViewModeToggle viewMode={viewMode} setMode={setMode} />}
          <LangSwitcher />
          <span>{user?.email}</span>
          <a href="/logout/" className="transition-colors duration-150 hover:text-gold">
            {t("signOut")}
          </a>
        </div>
      </header>
      {viewMode === "admin" ? (
        <Switch>
          <Route path="/admin/diagnostics/:id" component={AdminDiagnosticsDetailPage} />
          <Route path="/" component={AdminDashboardPage} />
          <Route component={AdminDashboardPage} />
        </Switch>
      ) : (
        <Switch>
          <Route path="/tests/:slug" component={TestPage} />
          <Route path="/feedback-request" component={FeedbackRequestPage} />
          <Route path="/feedback" component={FeedbackViewPage} />
          <Route path="/diagnostics/:id" component={DiagnosticsHistoryPage} />
          <Route path="/" component={DashboardPage} />
        </Switch>
      )}
    </div>
  );
}

function NoDiagnosticsGate() {
  const { diagnosticsPurchaseUrl } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">{t("noDiagnosticsTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("noDiagnosticsBody")}</p>
      {diagnosticsPurchaseUrl ? (
        <a
          className="text-primary underline underline-offset-4"
          href={diagnosticsPurchaseUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t("buyHere")}
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">{t("contactToPurchase")}</p>
      )}
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
  if (!user) return <SignedOutLanding />;
  if (!user.has_diagnostics) return <NoDiagnosticsGate />;
  if (!user.consent_recorded) return <ConsentGate />;
  return <SignedInApp />;
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
