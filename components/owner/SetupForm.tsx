"use client";
import { useActionState, useState } from "react";
import { createRestaurantAction, type SetupState } from "@/app/dashboard/setup/actions";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { slugify } from "@/lib/slug";

export function SetupForm({ next = "/dashboard" }: { next?: string }) {
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
      className="mt-10 space-y-6 rounded-panel bg-paper p-6 shadow-raised sm:p-8"
    >
      <input type="hidden" name="next" value={next} />
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
        <span className="mt-1 flex items-center rounded-control bg-paper shadow-pressed transition-shadow duration-200 focus-within:shadow-well focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-accent">
          <span className="pl-4 font-mono text-sm text-muted">/r/</span>
          <input
            name="slug"
            required
            minLength={3}
            maxLength={40}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
            className="w-full bg-transparent px-1 py-3 font-mono text-base focus:outline-none sm:text-sm"
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
