import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Input } from "@/components/ui/input";
import { getAdminDiagnosticsList } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { STATUS_LABEL_KEY } from "@/pages/DashboardPage";
import type { AdminDiagnosticsSummary, DiagnosticsStatus } from "@/types/api";

const STATUSES: DiagnosticsStatus[] = [
  "tests_in_progress",
  "awaiting_feedback_request",
  "awaiting_admin_review",
  "completed",
];

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AdminDiagnosticsSummary[] | null>(null);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getAdminDiagnosticsList({ status: status || undefined, q: query || undefined }).then(setRows);
  }, [status, query]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">{t("adminDashboardTitle")}</h1>

      <div className="flex gap-3">
        <Input
          placeholder={t("adminSearchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">{t("adminStatusFilterAll")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_LABEL_KEY[s])}
            </option>
          ))}
        </select>
      </div>

      {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">{t("adminNoResults")}</p>}

      {rows && rows.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 font-normal">{t("adminEmailColumn")}</th>
              <th className="py-2 font-normal">{t("adminJourneyColumn")}</th>
              <th className="py-2 font-normal">{t("adminStatusColumn")}</th>
              <th className="py-2 font-normal">{t("adminOpenedColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-2">
                  <Link href={`/admin/diagnostics/${row.id}`} className="text-primary underline underline-offset-4">
                    {row.email}
                  </Link>
                </td>
                <td className="py-2 text-muted-foreground">{row.journey_slug}</td>
                <td className="py-2 text-muted-foreground">{t(STATUS_LABEL_KEY[row.status])}</td>
                <td className="py-2 text-muted-foreground">{new Date(row.opened_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
