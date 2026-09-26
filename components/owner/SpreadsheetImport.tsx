"use client";
import { useState } from "react";
import { useOwnerText } from "@/components/owner/OwnerLanguage";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { formatList } from "@/lib/format-list";
import { fmt, plural } from "@/lib/i18n/owner/format";

type Summary = {
  added: string[];
  changed: { name: string; fields: string[] }[];
  unchanged: number;
  problems: { line: number; message: string }[];
  applied?: boolean;
  conflicts?: string[];
  error?: string;
};

async function sendSpreadsheet(csv: string, apply: boolean, fallback: string): Promise<Summary> {
  const res = await fetch("/api/menu-spreadsheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv, apply }),
  });
  const data = (await res.json().catch(() => ({}))) as Summary;
  if (!res.ok) throw new Error(data.error ?? fallback);
  return data;
}

/** Upload an edited spreadsheet, see what would change, then import it. */
export function SpreadsheetImport() {
  const { t, language } = useOwnerText();
  const s = t.spreadsheet;
  const [csv, setCsv] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fieldName = (field: string) => s.fields[field as keyof typeof s.fields] ?? field;

  async function preview(file: File | undefined) {
    setSummary(null);
    setError("");
    if (!file) return;
    if (file.size > 1_000_000) {
      setError(s.tooBig);
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      setCsv(text);
      setSummary(await sendSpreadsheet(text, false, s.readFailed));
    } catch (err) {
      setError(err instanceof Error ? err.message : s.readFailed);
    } finally {
      setBusy(false);
    }
  }

  async function importIt() {
    if (!csv) return;
    setBusy(true);
    setError("");
    try {
      setSummary(await sendSpreadsheet(csv, true, s.importFailed));
    } catch (err) {
      setError(err instanceof Error ? err.message : s.importFailed);
    } finally {
      setBusy(false);
    }
  }

  const changes = summary ? summary.added.length + summary.changed.length : 0;

  return (
    <div>
      <label className="block">
        <span className="sr-only">{s.fileLabel}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(event) => preview(event.target.files?.[0])}
          className="block w-full text-sm file:me-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:font-medium file:text-white"
        />
      </label>

      {error && (
        <Notice tone="warning" role="alert" className="mt-4">
          {error}
        </Notice>
      )}

      {summary && summary.problems.length > 0 && (
        <Notice tone="warning" role="alert" className="mt-4">
          <span className="block font-medium">{s.problemsTitle}</span>
          {summary.problems.slice(0, 20).map((problem, index) => (
            <span key={index} className="mt-1 block">
              {fmt(s.problemRow, { line: problem.line, message: problem.message })}
            </span>
          ))}
          {summary.problems.length > 20 && (
            <span className="mt-1 block">
              {fmt(s.moreProblems, { count: summary.problems.length - 20 })}
            </span>
          )}
        </Notice>
      )}

      {summary && summary.problems.length === 0 && !summary.applied && (
        <div className="mt-5 space-y-3 text-sm" role="status">
          {summary.added.length > 0 && (
            <p>
              <span className="font-medium">{plural(s.added, summary.added.length, language)}</span>{" "}
              {summary.added.slice(0, 12).join(", ")}
              {summary.added.length > 12 && "…"}
            </p>
          )}
          {summary.changed.length > 0 && (
            <div>
              <p className="font-medium">{plural(s.changed, summary.changed.length, language)}</p>
              <ul className="mt-1 space-y-0.5">
                {summary.changed.slice(0, 30).map((dish, index) => (
                  <li key={index}>
                    {dish.name}{" "}
                    <span className="text-muted">
                      ({formatList(dish.fields.map(fieldName), language)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-muted">{plural(s.unchanged, summary.unchanged, language)}</p>
          {changes > 0 ? (
            <Button onClick={importIt} disabled={busy}>
              {busy ? s.importing : plural(s.importButton, changes, language)}
            </Button>
          ) : (
            <p>{s.nothing}</p>
          )}
        </div>
      )}

      {summary?.applied && (
        <Notice tone="success" role="status" className="mt-4">
          {s.imported}
          {(summary.conflicts?.length ?? 0) > 0 &&
            ` ${plural(s.conflicts, summary.conflicts!.length, language, {
              names: formatList(summary.conflicts!, language),
            })}`}
          <ButtonLink href="/dashboard/review" size="sm" variant="secondary" className="ms-3">
            {s.review}
          </ButtonLink>
        </Notice>
      )}
    </div>
  );
}
