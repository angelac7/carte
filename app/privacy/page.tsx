import type { Metadata } from "next";
import Link from "@/components/OfflineLink";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy policy | Carte" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        Carte helps diners read restaurant menus with confirmed allergens and diet labels, in their
        own language. This policy explains what information Carte handles and why. We collect as
        little as we can.
      </p>

      <h2>Diners</h2>
      <p>You never need an account to use Carte as a diner.</p>
      <ul>
        <li>
          <strong>Your settings stay on your device.</strong> Your language, allergy and diet
          filters, and text size are saved in cookies on your phone or computer, so every Carte menu
          remembers them.
        </li>
        <li>
          <strong>My Carte stays on your device.</strong> Saved dishes, your food diary, and
          challenges are stored in your browser. We never receive them, except when you ask for a
          taste profile: then the ratings and saved dishes you choose are sent to create it, and
          nothing is kept afterward.
        </li>
        <li>
          <strong>Questions and photos.</strong> When you ask the menu assistant a question, ask
          what to order, look up a dish by photo, or scan a paper menu, what you send goes to our
          server and our AI provider to produce the answer. We don&apos;t store it.
        </li>
        <li>
          <strong>Location.</strong> Nearby only uses your location when you tap to share it, and
          rounds it to about a city block first. Our server looks up restaurants with OpenStreetMap
          on your behalf, so OpenStreetMap sees our server, not you.
        </li>
        <li>
          <strong>Dish views.</strong> When you open a dish&apos;s details, we add one to that
          dish&apos;s count for the day. The count says nothing about who you are.
        </li>
        <li>
          <strong>What diners look for.</strong> When you use allergy or diet filters on a menu, or
          search for something it doesn&apos;t have, we add one to that restaurant&apos;s daily
          totals, once per visit. The restaurant sees only the totals, and a search appears only
          after more than one visit looks for it.
        </li>
        <li>
          <strong>Reports.</strong> If you report a problem with a dish, we keep the dish, the kind
          of problem, and any words you type, so the restaurant can fix it. We ask you not to
          include your name or contact details.
        </li>
      </ul>

      <h2>Restaurant owners</h2>
      <ul>
        <li>
          <strong>Your account.</strong> Your email and password let you sign in. Passwords are
          stored securely by our authentication provider; we never see them.
        </li>
        <li>
          <strong>Your restaurant.</strong> Your restaurant&apos;s name, profile, menu, allergen and
          diet information, and dish photos are stored so diners can see them. Menu photos you
          upload are sent to our AI provider to read the dishes.
        </li>
        <li>
          <strong>Deleting your account.</strong> You can delete your account at any time from the
          Account page. That permanently removes your login, restaurant, menu, photos, and diner
          reports.
        </li>
      </ul>

      <h2>Protecting the service</h2>
      <p>
        To stop abuse, we count how often each visitor uses features like the assistant. We only
        keep a scrambled code made from your network address, never the address itself, and each
        count expires on its own after a short time.
      </p>

      <h2>Cookies</h2>
      <p>
        Carte uses cookies only to keep owners signed in and to remember diners&apos; settings. We
        don&apos;t use advertising or tracking cookies, and we don&apos;t sell or share personal
        information for advertising.
      </p>

      <h2>Who helps us run Carte</h2>
      <ul>
        <li>
          <strong>Supabase</strong> stores accounts, restaurants, menus, and photos.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
        <li>
          <strong>Anthropic</strong> provides the AI that reads menus, translates dishes, explains
          them, and answers questions. Under Anthropic&apos;s commercial terms, what Carte sends
          isn&apos;t used to train their models.
        </li>
        <li>
          <strong>OpenStreetMap</strong> provides map data for Nearby.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        Restaurant accounts are for adults. Carte isn&apos;t directed to children under 13, and we
        don&apos;t knowingly collect their personal information.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, we&apos;ll update it here and change the date at the top. See also
        our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          terms of use
        </Link>
        .
      </p>
    </LegalPage>
  );
}
