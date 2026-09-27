"use client";
import { useState } from "react";
import { useOwnerText } from "@/components/owner/OwnerLanguage";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { plural } from "@/lib/i18n/owner/format";

/** Restores a backup file as a draft, then points to the draft to check and publish. */
export function BackupRestore() {
  const { t, language } = useOwnerText();
  const b = t.backup;
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState<number | null>(null);

  async function restore() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 5_000_000) throw new Error(b.tooBig);
      let backup: unknown;
      try {
        backup = JSON.parse(await file.text());
      } catch {
        throw new Error(b.badFile);
      }
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup, profile }),
      });
      const data = (await res.json().catch(() => ({}))) as { restored?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? b.failed);
      setRestored(data.restored ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : b.failed);
    } finally {
      setBusy(false);
    }
  }

  if (restored !== null)
    return (
      <Notice tone="success" role="status" className="mt-4">
        {plural(b.restored, restored, language)}{" "}
        <ButtonLink href="/dashboard/draft" variant="secondary" size="sm" className="ms-1">
          {b.goDraft}
        </ButtonLink>
      </Notice>
    );

  return (
    <div className="mt-4 space-y-4">
      <label className="block">
        <span className="block text-sm font-medium">{b.fileLabel}</span>
        <input
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm file:me-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:font-medium file:text-white"
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={profile}
          disabled={busy}
          onChange={(event) => setProfile(event.target.checked)}
          className="mt-1"
        />
        {b.profileToo}
      </label>
      {error && (
        <Notice tone="warning" role="alert">
          {error}
        </Notice>
      )}
      <Button onClick={restore} disabled={!file || busy}>
        {busy ? b.restoring : b.restore}
      </Button>
    </div>
  );
}
