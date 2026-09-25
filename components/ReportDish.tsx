"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { sendDishReport } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { REPORT_STRINGS } from "@/lib/i18n/report-strings";
import type { LanguageCode } from "@/lib/languages";
import { REPORT_KINDS, type ReportKind } from "@/types/report";

type ReportDishProps = { restaurantSlug: string; dishId: string; language: LanguageCode };

/** Lets a diner tell the restaurant a dish's details look wrong. Sends nothing about the diner. */
export function ReportDish({ restaurantSlug, dishId, language }: ReportDishProps) {
  const t = REPORT_STRINGS[language];
  const [step, setStep] = useState<"closed" | "open" | "sending" | "sent" | "failed">("closed");
  const [kind, setKind] = useState<ReportKind>("allergens");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStep("sending");
    try {
      await sendDishReport({ restaurant: restaurantSlug, dish: dishId, kind, message });
      setStep("sent");
    } catch {
      setStep("failed");
    }
  }

  if (step === "closed") {
    return (
      <button
        type="button"
        onClick={() => setStep("open")}
        className="py-3 text-start text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        {t.open}
      </button>
    );
  }
  if (step === "sent") {
    return (
      // Caution, not success: the thanks carries an allergy reminder.
      <Notice tone="caution" role="status">
        {t.thanks}
      </Notice>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-control p-4 shadow-pressed-sm sm:p-5">
      <fieldset>
        <legend className="font-medium">{t.title}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPORT_KINDS.map((value) => (
            <label
              key={value}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium transition-[box-shadow,background-color,color] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                kind === value
                  ? "bg-ink text-white shadow-pressed-color"
                  : "bg-paper text-muted shadow-raised-sm hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="report-kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              {t.kinds[value]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-5 block">
        <span className="text-sm font-medium">{t.message}</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={500}
          rows={3}
          className={fieldClass("mt-2")}
        />
        <span className="mt-1 block text-xs text-muted">{t.privacy}</span>
      </label>
      {step === "failed" && (
        <Notice tone="warning" role="alert" className="mt-4">
          {t.failed}
        </Notice>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" disabled={step === "sending"}>
          {step === "sending" ? t.sending : t.send}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setStep("closed")}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
