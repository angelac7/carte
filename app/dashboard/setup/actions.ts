"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createRestaurant } from "@/lib/db";
import { isValidSlug, slugify } from "@/lib/slug";

export type SetupState = { error?: string };

export async function createRestaurantAction(
  _prev: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const slug =
    String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase() || slugify(name);

  if (!name || name.length > 120) return { error: "Enter your restaurant's name." };
  if (!isValidSlug(slug)) {
    return { error: "Menu links use 3 to 40 lowercase letters, numbers, and single dashes." };
  }

  const result = await createRestaurant(supabase, user.id, name, slug);
  if (!result.ok) {
    return {
      error:
        result.reason === "taken"
          ? "That menu link is already taken. Try another one."
          : "Your restaurant couldn't be saved. Try again.",
    };
  }
  redirect("/dashboard");
}
