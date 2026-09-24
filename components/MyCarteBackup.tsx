"use client";
import { useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { BACKUP_STRINGS } from "@/lib/i18n/my-carte-strings";
import type { LanguageCode } from "@/lib/languages";
import {
  exportMyCarte,
  importMyCarte,
  mergeMyCarte,
  MAX_BACKUP_BYTES,
  type MyCarte,
} from "@/lib/my-carte";
import { useMyCarte } from "@/lib/my-carte-store";
import { useMyCarteWriter } from "@/lib/use-my-carte-writer";

export function MyCarteBackup({
  language,
  onRestored,
}: {
  language: LanguageCode;
  onRestored: () => void;
}) {
  const t = BACKUP_STRINGS[language];
  const state = useMyCarte();
  const write = useMyCarteWriter(language);
  const input = useRef<HTMLInputElement>(null);
  const [incoming, setIncoming] = useState<MyCarte | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function read(file: File) {
    setFailed(false);
    setDone(false);
    setBusy(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error();
      setIncoming(importMyCarte(await file.text()));
      setMode("merge");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  function download() {
    setFailed(false);
    setDone(false);
    try {
      const url = URL.createObjectURL(
        new Blob([exportMyCarte(state)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `carte-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setFailed(true);
    }
  }
  function restore() {
    if (!incoming) return;
    try {
      if (!write((current) => (mode === "merge" ? mergeMyCarte(current, incoming) : incoming)))
        return;
      setIncoming(null);
      setDone(true);
      setFailed(false);
      onRestored();
    } catch {
      setFailed(true);
    }
  }
  return (
    <section className="mt-12 rounded-panel bg-paper p-6 shadow-raised">
      <h2 className="font-serif text-2xl">{t.title}</h2>
      <p className="mt-2 text-sm text-muted">{t.intro}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={download}>{t.download}</Button>
        <Button disabled={busy} onClick={() => input.current?.click()} variant="secondary">
          {t.upload}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label={t.upload}
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void read(file);
        }}
      />
      {failed && !incoming && (
        <Notice tone="warning" role="alert" className="mt-3">
          {t.invalid}
        </Notice>
      )}
      {done && (
        <Notice tone="success" role="status" className="mt-3">
          {t.done}
        </Notice>
      )}
      {incoming && (
        <Sheet title={t.title} closeLabel={t.cancel} onClose={() => setIncoming(null)}>
          <p className="mt-4">
            {t.counts(incoming.dishes.length, incoming.restaurants.length, incoming.diary.length)}
          </p>
          <p className="mt-3 text-sm">{t.warning}</p>
          <fieldset className="my-4 space-y-3">
            {(["merge", "replace"] as const).map((value) => (
              <label key={value} className="flex gap-3">
                <input
                  type="radio"
                  name="restore-mode"
                  checked={mode === value}
                  onChange={() => setMode(value)}
                />
                {t[value]}
              </label>
            ))}
          </fieldset>
          {failed && (
            <Notice tone="warning" role="alert" className="mb-3">
              {t.invalid}
            </Notice>
          )}
          <Button onClick={restore}>{t.restore}</Button>
        </Sheet>
      )}
    </section>
  );
}
