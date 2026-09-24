import { safeNextPath } from "@/lib/safe-redirect";
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
  const next = safeNextPath((await searchParams).next ?? null);
  await redirectIfSignedIn(next);
  return (
    <>
      <PublicHeader />
      <AuthForm mode="login" next={next} />
    </>
  );
}
