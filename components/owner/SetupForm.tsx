"use client";
import { useActionState, useState } from "react";
import { createRestaurantAction, type SetupState } from "@/app/dashboard/setup/actions";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { slugify } from "@/lib/slug";

export function SetupForm() {
  const [state, formAction, pending] = useActionState<SetupState, FormData>(
    createRestaurantAction,
    {},
  );
  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const slug = customSlug ?? slugify(name);

  return (
    <form
      action={formAction}
      className="mt-8 space-y-5 rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6"
    >
      <label className="block">
        <span className={labelClass}>Restaurant name</span>
        <input
          name="name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass("mt-1 text-base")}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Menu link</span>
        <span className="mt-1 flex items-center rounded-md border border-line bg-card transition-colors focus-within:border-ink">
          <span className="pl-3 text-sm text-muted">/r/</span>
          <input
            name="slug"
            required
            minLength={3}
            maxLength={40}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
            className="w-full bg-transparent px-1 py-2 focus:outline-none"
          />
        </span>
        <span className="mt-1 block text-xs text-muted">
          Diners open your menu at this link. Use lowercase letters, numbers, and dashes.
        </span>
      </label>

      {state.error && (
        <Notice tone="warning" role="alert">
          {state.error}
        </Notice>
      )}

      <Button type="submit" disabled={pending} shine>
        {pending ? "Creating…" : "Create restaurant"}
      </Button>
    </form>
  );
}
