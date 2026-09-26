import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/PasswordForm";
import { OwnerTextPage } from "@/components/OwnerTextPage";
import { ownerTitle } from "@/lib/owner-language";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = () => ownerTitle((t) => t.auth.chooseTitle);

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?error=expired");
  return (
    <OwnerTextPage>
      <PasswordForm mode="reset" />
    </OwnerTextPage>
  );
}
