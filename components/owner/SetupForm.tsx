"use client";
import { useActionState, useState } from "react";
import { createRestaurantAction, type SetupState } from "@/app/dashboard/setup/actions";
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
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Restaurant name</span>
        <input
          name="name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 focus:border-ink focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Menu link</span>
        <span className="mt-1 flex items-center rounded-md border border-line bg-card focus-within:border-ink">
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
        <p role="alert" className="rounded-md bg-tomato/10 px-3 py-2 text-sm text-tomato">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create restaurant"}
      </button>
    </form>
  );
}
