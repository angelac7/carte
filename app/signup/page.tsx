import { requestedNextPath } from "@/lib/safe-redirect";
import { AuthForm } from "@/components/AuthForm";
import { OwnerTextPage } from "@/components/OwnerTextPage";
import { redirectIfSignedIn } from "@/lib/auth";
import { ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.auth.signupPageTitle);

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = requestedNextPath((await searchParams).next);
  await redirectIfSignedIn(next);
  return (
    <OwnerTextPage>
      <AuthForm mode="signup" next={next} />
    </OwnerTextPage>
  );
}
