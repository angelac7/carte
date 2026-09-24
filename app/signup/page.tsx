import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { PublicHeader } from "@/components/PublicHeader";
import { redirectIfSignedIn } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign up | Carte" };

export default async function SignupPage() {
  await redirectIfSignedIn();
  return (
    <>
      <PublicHeader />
      <AuthForm mode="signup" />
    </>
  );
}
