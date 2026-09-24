"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isCarteAdmin, reviewPlaceClaim } from "@/lib/db/claims";
export async function reviewClaimAction(form: FormData) {
  const { supabase } = await requireUser("/admin/claims");
  if (!(await isCarteAdmin(supabase))) redirect("/dashboard");
  const input = z
    .object({
      claim: z.uuid(),
      revision: z.coerce.number().int().positive(),
      decision: z.enum(["approved", "rejected"]),
      note: z.string().trim().min(20).max(2000),
      transfer: z.boolean(),
    })
    .safeParse({
      claim: form.get("claim"),
      revision: form.get("revision"),
      decision: form.get("decision"),
      note: form.get("note"),
      transfer: form.get("transfer") === "on",
    });
  if (!input.success) redirect("/admin/claims?error=invalid");
  try {
    await reviewPlaceClaim(supabase, input.data);
  } catch (error) {
    const code = (error as { code?: string }).code;
    redirect(
      `/admin/claims?error=${code === "40001" ? "stale" : code === "23505" ? "transfer" : code === "42501" ? "forbidden" : "failed"}`,
    );
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath("/places");
  revalidatePath("/admin/claims");
  redirect("/admin/claims?saved=1");
}
