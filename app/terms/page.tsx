import type { Metadata } from "next";
import Link from "@/components/OfflineLink";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of use | Carte" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>
        These terms apply to everyone who uses Carte. By using Carte, you agree to them. If you
        don&apos;t agree, please don&apos;t use Carte.
      </p>

      <h2>Allergies and safety</h2>
      <ul>
        <li>
          Allergen and diet information on a restaurant&apos;s menu comes from that restaurant,
          which confirms each dish. Carte doesn&apos;t check it.
        </li>
        <li>
          Kitchens share equipment and recipes change. Always tell your server about allergies
          before ordering, and never rely on Carte alone.
        </li>
        <li>
          Scanned paper menus and map listings aren&apos;t confirmed by anyone. Treat their allergen
          suggestions as guesses and ask staff.
        </li>
        <li>
          Explanations, translations, suggestions, and answers are written by AI. They can be wrong,
          and they never replace the restaurant&apos;s own information.
        </li>
        <li>Carte isn&apos;t medical advice. In an emergency, call your local emergency number.</li>
      </ul>

      <h2>Restaurant owners</h2>
      <ul>
        <li>
          You&apos;re responsible for the information you publish, including every allergen and diet
          label you confirm. Check each dish carefully and keep it up to date.
        </li>
        <li>
          Only upload menus and photos you have the right to use, and nothing unlawful, misleading,
          or offensive.
        </li>
        <li>
          Keep your password private. You&apos;re responsible for what happens under your account.
        </li>
        <li>
          We may hide or remove a listing or account that breaks these terms or puts diners at risk.
        </li>
      </ul>

      <h2>Using Carte fairly</h2>
      <p>
        Don&apos;t misuse Carte: no attempts to break in, overload the service, collect other
        people&apos;s data, or get around its limits.
      </p>

      <h2>Map data</h2>
      <p>
        Nearby uses data from OpenStreetMap contributors, available under the Open Database License.
      </p>

      <h2>No guarantees</h2>
      <p>
        Carte is provided as it is, without warranties of any kind. To the fullest extent the law
        allows, Carte isn&apos;t liable for losses that come from using it, including decisions made
        from menu, allergen, or AI-written information.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. We&apos;ll change the date at the top when we do, and continuing
        to use Carte means you accept the new terms. See also our{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          privacy policy
        </Link>
        .
      </p>
    </LegalPage>
  );
}
