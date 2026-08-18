import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { eraseIdentity, getAdminJourneys, getAdminUsers, grantAccess } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { AdminJourneySummary, AdminUserSummary } from "@/types/api";

function DeleteControl({ email, userId, onDeleted }: { email: string; userId?: number; onDeleted: () => void }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await eraseIdentity({ userId, email: userId ? undefined : email, typedEmail });
      onDeleted();
    } catch {
      setError(t("adminDeleteMismatch"));
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <Button type="button" variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        {t("adminDeleteButton")}
      </Button>
    );
  }

  const matches = typedEmail.trim().toLowerCase() === email.toLowerCase();

  return (
    <div className="flex flex-col gap-2 rounded-md border border-destructive/40 p-3">
      <p className="text-xs text-muted-foreground">{t("adminDeleteConfirmPrompt", { email })}</p>
      <div className="flex flex-wrap gap-2">
        <Input
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          placeholder={t("adminTypeEmailPlaceholder")}
          autoComplete="off"
          className="max-w-xs"
        />
        <Button type="button" variant="destructive" size="sm" disabled={busy || !matches} onClick={handleConfirm}>
          {t("adminDeleteConfirmButton")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          {t("adminCancelButton")}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function UsersTable() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUserSummary[] | null>(null);

  function reload() {
    getAdminUsers(query || undefined).then(setRows);
  }

  useEffect(reload, [query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("adminUsersTableTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Input
          placeholder={t("adminSearchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />

        {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">{t("adminNoResults")}</p>}

        {rows && rows.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2 font-normal">{t("adminEmailColumn")}</th>
                <th className="py-2 font-normal">{t("adminUserDiagnosticsColumn")}</th>
                <th className="py-2 font-normal">{t("adminUserSubmissionsColumn")}</th>
                <th className="py-2 font-normal">{t("adminUserFilesColumn")}</th>
                <th className="py-2 font-normal">{t("adminUserConsentColumn")}</th>
                <th className="py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b align-top last:border-0">
                  <td className="py-2">
                    {row.email}
                    {row.is_staff && (
                      <span className="ml-2 text-xs font-semibold text-destructive">
                        {t("adminUserStaffBadge")}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground">{row.diagnostics_count}</td>
                  <td className="py-2 text-muted-foreground">{row.submissions_count}</td>
                  <td className="py-2 text-muted-foreground">{row.file_count}</td>
                  <td className="py-2 text-muted-foreground">
                    {row.has_consent ? t("consentYes") : t("consentNo")}
                  </td>
                  <td className="py-2">
                    <DeleteControl email={row.email} userId={row.id} onDeleted={reload} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function EraseByEmail() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (!email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("adminEraseByEmailTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={t("adminEraseByEmailPlaceholder")}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("adminEraseByEmailTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {done ? (
          <p className="text-sm text-muted-foreground">{t("adminDeleteSuccess")}</p>
        ) : (
          <DeleteControl email={email} onDeleted={() => setDone(true)} />
        )}
        <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setEmail("")}>
          {t("adminCancelButton")}
        </Button>
      </CardContent>
    </Card>
  );
}

function GrantAccessForm() {
  const { t } = useTranslation();
  const [journeys, setJourneys] = useState<AdminJourneySummary[]>([]);
  const [email, setEmail] = useState("");
  const [journeySlug, setJourneySlug] = useState("");
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminJourneys().then((rows) => {
      setJourneys(rows);
      if (rows.length > 0) setJourneySlug(rows[0].slug);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      await grantAccess({ email, journeySlug, language });
      setResult(t("adminGrantAccessSuccess"));
      setEmail("");
    } catch {
      setError(t("adminGrantAccessError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("adminGrantAccessTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{t("adminGrantAccessEmailLabel")}</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{t("adminGrantAccessJourneyLabel")}</label>
            <select
              value={journeySlug}
              onChange={(e) => setJourneySlug(e.target.value)}
              className="rounded-md border bg-transparent px-3 py-2 text-sm"
            >
              {journeys.map((j) => (
                <option key={j.slug} value={j.slug}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{t("adminGrantAccessLanguageLabel")}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border bg-transparent px-3 py-2 text-sm"
            >
              <option value="en">EN</option>
              <option value="cs">CS</option>
            </select>
          </div>
          <Button type="submit" disabled={busy || !journeySlug}>
            {t("adminGrantAccessButton")}
          </Button>
        </form>
        {result && <p className="mt-2 text-sm text-muted-foreground">{result}</p>}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

export function AdminUsersPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{t("adminUsersTitle")}</h1>
        <Link href="/" className="text-sm text-primary underline underline-offset-4">
          {t("adminNavDiagnostics")}
        </Link>
      </div>

      <GrantAccessForm />
      <UsersTable />
      <EraseByEmail />
    </div>
  );
}
