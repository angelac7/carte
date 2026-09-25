import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isCarteAdmin, listPlaceClaims, listClaimEvents } from "@/lib/db/claims";
import { reviewClaimAction } from "./actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PublicHeader } from "@/components/PublicHeader";

export const metadata: Metadata = { title: "Review claims | Carte" };

const errors: Record<string, string> = {
  invalid: "Enter at least 20 characters describing your ownership verification.",
  stale: "This claim changed. Review the refreshed queue before deciding.",
  transfer:
    "This listing belongs to another restaurant. Verify the dispute and explicitly approve a transfer.",
  forbidden: "You cannot review your own restaurant. Ask another administrator.",
  failed: "The review could not be saved. Please try again.",
};
export default async function ClaimReview({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; page?: string }>;
}) {
  const { supabase } = await requireUser("/admin/claims");
  if (!(await isCarteAdmin(supabase))) notFound();
  const params = await searchParams;
  const page = Math.max(0, Math.min(10000, Math.floor(Number(params.page) || 0)));
  const [claims, events] = await Promise.all([
    listPlaceClaims(supabase, undefined, true, page * 50),
    listClaimEvents(supabase),
  ]);
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto max-w-4xl px-5 pt-12 pb-32 md:pb-12">
        <ButtonLink href="/admin" variant="ghost">
          Admin
        </ButtonLink>
        <h1 className="mt-5 font-serif text-4xl">Restaurant claim review</h1>
        <p className="mt-3 text-muted">
          Verify ownership using independently sourced restaurant contact details. A matching name
          or submitted evidence alone is not proof. Decisions and verification notes are recorded;
          review notes are visible to the owner.
        </p>
        {params.saved && (
          <Notice tone="success" className="mt-4">
            Review saved. The owner can see the decision on their Map listing page.
          </Notice>
        )}
        {params.error && (
          <Notice tone="warning" role="alert" className="mt-4">
            {errors[params.error] ?? errors.failed}
          </Notice>
        )}
        <div className="mt-8 space-y-6">
          {claims.map((claim) => (
            <section key={claim.id} className="rounded-panel bg-paper p-6 shadow-raised">
              <h2 className="font-serif text-2xl">
                {claim.restaurants.name} · {claim.status}
              </h2>
              <p className="mt-2">{claim.restaurants.address}</p>
              <p className="mt-2 break-words whitespace-pre-wrap">{claim.evidence}</p>
              <div className="my-3 flex flex-wrap gap-3">
                <ButtonLink href={`/place/${claim.place_id}`} variant="secondary">
                  Review map listing
                </ButtonLink>
                <ButtonLink href={`/r/${claim.restaurants.slug}`} variant="secondary">
                  View Carte menu
                </ButtonLink>
              </div>
              {claim.review_note && <p className="whitespace-pre-wrap">{claim.review_note}</p>}
              {claim.status === "pending" && (
                <form action={reviewClaimAction} className="mt-4 space-y-3">
                  <input type="hidden" name="claim" value={claim.id} />
                  <input type="hidden" name="revision" value={claim.revision} />
                  <label className="block">
                    Verification or rejection note
                    <textarea
                      name="note"
                      required
                      minLength={20}
                      maxLength={2000}
                      rows={3}
                      className={fieldClass("mt-2")}
                    />
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" name="transfer" className="mt-1" />I have verified this
                    dispute and authorize removing any previous restaurant’s link to this listing.
                  </label>
                  <div className="flex gap-3">
                    <Button name="decision" value="approved" type="submit">
                      Approve verified claim
                    </Button>
                    <Button name="decision" value="rejected" type="submit" variant="danger">
                      Reject claim
                    </Button>
                  </div>
                </form>
              )}
            </section>
          ))}
        </div>
        {!claims.length && <p className="mt-8">No claims to review.</p>}
        <div className="mt-6 flex gap-3">
          {page > 0 && (
            <ButtonLink href={`/admin/claims?page=${page - 1}`}>Previous page</ButtonLink>
          )}
          {claims.length === 50 && (
            <ButtonLink href={`/admin/claims?page=${page + 1}`}>Next page</ButtonLink>
          )}
        </div>
        <h2 className="mt-12 font-serif text-2xl">Recent audit history</h2>
        <ul className="mt-4 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="border-b border-ink/15 pb-3 text-sm">
              <time>{event.created_at}</time> · {event.action}
              <p className="break-words whitespace-pre-wrap">{event.note}</p>
              <p className="text-muted">Claim {event.claim_id}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
