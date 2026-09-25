import type { Metadata } from "next";
import { AccountSettings } from "@/components/owner/AccountSettings";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account | Carte" };

export default async function AccountPage() {
  const { user } = await requireUser("/dashboard/account");
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader
        title="Account"
        intro="Change your login email or password, or delete your account."
      />
      <AccountSettings email={user.email ?? ""} />
    </main>
  );
}
