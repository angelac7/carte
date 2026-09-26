"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { useOwnerText } from "@/components/owner/OwnerLanguage";

/** The code an owner pastes into their own website to show their Carte menu there. */
export function EmbedCode({ code }: { code: string }) {
  const { t } = useOwnerText();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="block">
        <span className="sr-only">{t.qr.codeLabel}</span>
        <textarea
          readOnly
          rows={4}
          value={code}
          onFocus={(event) => event.target.select()}
          dir="ltr"
          className={fieldClass("font-mono text-xs")}
        />
      </label>
      <Button
        size="sm"
        variant="secondary"
        className="mt-3"
        onClick={() =>
          navigator.clipboard.writeText(code).then(
            () => setCopied(true),
            () => setCopied(false),
          )
        }
      >
        {copied ? t.qr.copied : t.qr.copyCode}
      </Button>
    </div>
  );
}
