import { requestedNextPath } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { PublicHeader } from "@/components/PublicHeader";
import { redirectIfSignedIn } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign up | Carte" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = requestedNextPath((await searchParams).next);
  await redirectIfSignedIn(next);
  return (
    <>
      <PublicHeader />
      <AuthForm mode="signup" next={next} />
    </>
  );
}
