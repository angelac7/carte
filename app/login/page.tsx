import { requestedNextPath } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { PublicHeader } from "@/components/PublicHeader";
import { redirectIfSignedIn } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in | Carte" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = requestedNextPath((await searchParams).next);
  await redirectIfSignedIn(next);
  return (
    <>
      <PublicHeader />
      <AuthForm mode="login" next={next} />
    </>
  );
}
