import { requestedNextPath } from "@/lib/safe-redirect";
import { AuthForm } from "@/components/AuthForm";
import { OwnerTextPage } from "@/components/OwnerTextPage";
import { redirectIfSignedIn } from "@/lib/auth";
import { ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.auth.loginTitle);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = requestedNextPath((await searchParams).next);
  await redirectIfSignedIn(next);
  return (
    <OwnerTextPage>
      <AuthForm mode="login" next={next} />
    </OwnerTextPage>
  );
}
