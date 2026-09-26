"use client";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

type Summary = {
  added: string[];
  changed: { name: string; fields: string[] }[];
  unchanged: number;
  problems: { line: number; message: string }[];
  applied?: boolean;
  conflicts?: string[];
  error?: string;
};

const FIELD_NAMES: Record<string, string> = {
  removable: "can leave out",
  may_contain: "may contain",
  also_contains: "also contains",
  dietary_tags: "diet labels",
};

async function sendSpreadsheet(csv: string, apply: boolean): Promise<Summary> {
  const res = await fetch("/api/menu-spreadsheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv, apply }),
  });
  const data = (await res.json().catch(() => ({}))) as Summary;
  if (!res.ok) throw new Error(data.error ?? "The spreadsheet couldn't be read.");
  return data;
}

/** Upload an edited spreadsheet, see what would change, then import it. */
export function SpreadsheetImport() {
  const [csv, setCsv] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function preview(file: File | undefined) {
    setSummary(null);
    setError("");
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("That file is over 1 MB. Keep the menu to one sheet, up to 1,000 dishes.");
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      setCsv(text);
      setSummary(await sendSpreadsheet(text, false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The spreadsheet couldn't be read.");
    } finally {
      setBusy(false);
    }
  }

  async function importIt() {
    if (!csv) return;
    setBusy(true);
    setError("");
    try {
      setSummary(await sendSpreadsheet(csv, true));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The spreadsheet couldn't be imported.");
    } finally {
      setBusy(false);
    }
  }

  const changes = summary ? summary.added.length + summary.changed.length : 0;

  return (
    <div>
      <label className="block">
        <span className="sr-only">Spreadsheet file</span>
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
          <span className="block font-medium">
            Nothing was imported. Fix these in the spreadsheet and upload it again:
          </span>
          {summary.problems.slice(0, 20).map((problem, index) => (
            <span key={index} className="mt-1 block">
              Row {problem.line}: {problem.message}
            </span>
          ))}
          {summary.problems.length > 20 && (
            <span className="mt-1 block">…and {summary.problems.length - 20} more.</span>
          )}
        </Notice>
      )}

      {summary && summary.problems.length === 0 && !summary.applied && (
        <div className="mt-5 space-y-3 text-sm" role="status">
          {summary.added.length > 0 && (
            <p>
              <span className="font-medium">
                {summary.added.length} new {summary.added.length === 1 ? "dish" : "dishes"}:
              </span>{" "}
              {summary.added.slice(0, 12).join(", ")}
              {summary.added.length > 12 && "…"}
            </p>
          )}
          {summary.changed.length > 0 && (
            <div>
              <p className="font-medium">
                {summary.changed.length}{" "}
                {summary.changed.length === 1 ? "dish changes" : "dishes change"}:
              </p>
              <ul className="mt-1 space-y-0.5">
                {summary.changed.slice(0, 30).map((dish, index) => (
                  <li key={index}>
                    {dish.name}{" "}
                    <span className="text-muted">
                      ({dish.fields.map((field) => FIELD_NAMES[field] ?? field).join(", ")})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-muted">
            {summary.unchanged} {summary.unchanged === 1 ? "dish is" : "dishes are"} unchanged.
          </p>
          {changes > 0 ? (
            <Button onClick={importIt} disabled={busy}>
              {busy ? "Importing…" : `Import ${changes} ${changes === 1 ? "change" : "changes"}`}
            </Button>
          ) : (
            <p>Nothing to import.</p>
          )}
        </div>
      )}

      {summary?.applied && (
        <Notice tone="success" role="status" className="mt-4">
          Imported. The changed and new dishes need confirming before diners see them.
          {(summary.conflicts?.length ?? 0) > 0 &&
            ` ${summary.conflicts!.join(", ")} changed while you were editing, so ${summary.conflicts!.length === 1 ? "it wasn't" : "they weren't"} updated.`}
          <ButtonLink href="/dashboard/review" size="sm" variant="secondary" className="ms-3">
            Review dishes
          </ButtonLink>
        </Notice>
      )}
    </div>
  );
}
