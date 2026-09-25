"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { TableStrings } from "@/lib/i18n/table-strings";

type OrderTogetherProps = {
  t: TableStrings;
  code: string | null;
  ended: boolean;
  onStart: () => Promise<string>;
  onLeave: () => void;
};

/** Start a shared order for the table, or share and leave the one already open. */
export function OrderTogether({ t, code, ended, onStart, onLeave }: OrderTogetherProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const link = () => window.location.href;

  async function start() {
    setBusy(true);
    setFailed(false);
    try {
      await onStart();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!code) {
    return (
      <section className="mt-6 border-t border-line pt-5">
        {ended && (
          <Notice role="status" className="mb-4">
            {t.togetherEnded}
          </Notice>
        )}
        <p className="text-sm text-muted">{t.togetherHint}</p>
        <Button variant="secondary" onClick={start} disabled={busy} className="mt-3">
          {t.orderTogether}
        </Button>
        {failed && (
          <Notice tone="warning" role="alert" className="mt-3">
            {t.togetherFailed}
          </Notice>
        )}
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-control p-4 shadow-pressed-sm">
      <p className="text-sm font-medium">{t.togetherOn}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={copy}>
          {copied ? t.linkCopied : t.copyLink}
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigator.share({ url: link() }).catch(() => {})}
          >
            {t.shareLink}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onLeave}>
          {t.leaveTogether}
        </Button>
      </div>
    </section>
  );
}
