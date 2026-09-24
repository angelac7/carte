import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/PasswordForm";
import { PublicHeader } from "@/components/PublicHeader";
import { createClient } from "@/lib/supabase/server";
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?error=expired");
  return (
    <>
      <PublicHeader />
      <PasswordForm mode="reset" />
    </>
  );
}
