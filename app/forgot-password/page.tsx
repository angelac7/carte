import { PasswordForm } from "@/components/PasswordForm";
import { OwnerTextPage } from "@/components/OwnerTextPage";
import { ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.auth.resetTitle);

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <OwnerTextPage>
      <PasswordForm mode="request" expired={(await searchParams).error === "expired"} />
    </OwnerTextPage>
  );
}
