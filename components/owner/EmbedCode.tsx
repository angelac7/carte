"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";

/** The code an owner pastes into their own website to show their Carte menu there. */
export function EmbedCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="block">
        <span className="sr-only">Code for your website</span>
        <textarea
          readOnly
          rows={4}
          value={code}
          onFocus={(event) => event.target.select()}
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
        {copied ? "Code copied" : "Copy code"}
      </Button>
    </div>
  );
}
