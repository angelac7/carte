"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentRestaurant, RESTAURANT_COOKIE, requireRestaurant, requireUser } from "@/lib/auth";
import { resolveReport } from "@/lib/db/reports";
import { removeMember } from "@/lib/db/team";

/** Marks a diner's report as dealt with, so it leaves the dashboard. */
export async function resolveReportAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await resolveReport(supabase, restaurant.id, id.data);
  revalidatePath("/dashboard");
}

/** Switches which location the dashboard shows, among those this person can work on. */
export async function switchRestaurantAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = z.uuid().safeParse(formData.get("restaurant"));
  const { all } = await currentRestaurant(supabase, user.id);
  if (id.success && all.some((restaurant) => restaurant.id === id.data)) {
    (await cookies()).set(RESTAURANT_COOKIE, id.data, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  redirect("/dashboard");
}

/** An editor stops helping with the restaurant they're working on. Owners can't leave their own. */
export async function leaveRestaurantAction(): Promise<void> {
  const { supabase, user, restaurant } = await requireRestaurant("/dashboard/account");
  if (restaurant.role === "editor") {
    await removeMember(supabase, restaurant.id, user.id);
    (await cookies()).delete(RESTAURANT_COOKIE);
  }
  redirect("/dashboard");
}
