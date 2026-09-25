"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnedRestaurant } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { cancelInvite, createInvite, isInviteCode, removeMember } from "@/lib/db/team";

export type InviteState = { code?: string; error?: string };

/** Makes a one-time invite link that lets someone help edit this restaurant's menu. */
export async function createInviteAction(): Promise<InviteState> {
  const { supabase, user, restaurant } = await requireOwnedRestaurant("/dashboard/team");
  if (!(await checkRateLimit(`invite:${user.id}`, 20, 24 * 60 * 60 * 1000))) {
    return { error: "You've made a lot of invites today. Try again tomorrow." };
  }
  try {
    const code = await createInvite(supabase, restaurant.id);
    revalidatePath("/dashboard/team");
    return { code };
  } catch {
    return { error: "The invite couldn't be created. Try again." };
  }
}

export async function cancelInviteAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireOwnedRestaurant("/dashboard/team");
  const code = String(formData.get("code") ?? "");
  if (isInviteCode(code)) await cancelInvite(supabase, restaurant.id, code);
  revalidatePath("/dashboard/team");
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireOwnedRestaurant("/dashboard/team");
  const userId = z.uuid().safeParse(formData.get("user"));
  if (userId.success) await removeMember(supabase, restaurant.id, userId.data);
  revalidatePath("/dashboard/team");
}
