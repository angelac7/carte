"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { setSuspended } from "@/lib/db/admin";
import { isCarteAdmin } from "@/lib/db/claims";

/** Suspends or restores a restaurant's menu. The database checks again that this is an admin. */
export async function moderateAction(formData: FormData): Promise<void> {
  const { supabase } = await requireUser("/admin");
  if (!(await isCarteAdmin(supabase))) notFound();
  const id = z.uuid().safeParse(formData.get("restaurant"));
  if (!id.success) return;
  await setSuspended(supabase, id.data, formData.get("suspend") === "true");
  revalidatePath("/admin");
}
