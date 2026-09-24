import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { PublicHeader } from "@/components/PublicHeader";
import { redirectIfSignedIn } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in | Carte" };

export default async function LoginPage() {
  await redirectIfSignedIn();
  return (
    <>
      <PublicHeader />
      <AuthForm mode="login" />
    </>
  );
}
