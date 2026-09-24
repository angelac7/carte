import { PasswordForm } from "@/components/PasswordForm";
import { PublicHeader } from "@/components/PublicHeader";
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <>
      <PublicHeader />
      <PasswordForm mode="request" expired={(await searchParams).error === "expired"} />
    </>
  );
}
