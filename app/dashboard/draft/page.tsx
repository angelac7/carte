import { discardDraftAction, publishDraftAction } from "@/app/dashboard/draft/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { listDishes } from "@/lib/db";
import { plural } from "@/lib/i18n/owner/format";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.draft.title);

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

/** Publishes the draft menu once every dish in it is confirmed, or throws it away. */
export default async function DraftPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string; discarded?: string; failed?: string }>;
}) {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/draft");
  const { t, language } = await ownerStrings();
  const d = t.draft;
  const [dishes, params] = await Promise.all([listDishes(supabase, restaurant.id), searchParams]);
  const drafts = dishes.filter((dish) => dish.draft);
  const confirmed = drafts.filter((dish) => dish.draft_confirmed).length;
  const live = dishes.length - drafts.length;
  const ready = drafts.length > 0 && confirmed === drafts.length;
  const published = Number(params.published);

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={d.title} intro={d.intro} />

      {published > 0 && (
        <Notice tone="success" role="status" className="mt-6">
          {plural(d.published, published, language)}
        </Notice>
      )}
      {params.discarded && (
        <Notice tone="success" role="status" className="mt-6">
          {d.discarded}
        </Notice>
      )}
      {params.failed && (
        <Notice tone="warning" role="alert" className="mt-6">
          {d.failed}
        </Notice>
      )}

      {drafts.length === 0 ? (
        <section className={panelClass}>
          <p className="text-muted">{d.none}</p>
          <ButtonLink href="/dashboard/upload" variant="secondary" className="mt-4">
            {d.upload}
          </ButtonLink>
        </section>
      ) : (
        <>
          <section className={panelClass}>
            <p className="font-serif text-3xl tracking-tight">
              {plural(d.counts, drafts.length, language, { confirmed })}
            </p>
            {!ready && (
              <p className="mt-2 text-sm text-muted">
                {d.confirmFirst}{" "}
                <ButtonLink href="/dashboard/review" variant="ghost" size="sm">
                  {d.review}
                </ButtonLink>
              </p>
            )}
            <form action={publishDraftAction} className="mt-6 space-y-4">
              <fieldset disabled={!ready} className="space-y-4 disabled:opacity-60">
                {live > 0 && (
                  <>
                    <label className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="mode"
                        value="replace"
                        defaultChecked
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium">{d.replace}</span>
                        <span className="block text-sm text-muted">
                          {plural(d.replaceHint, live, language)}
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input type="radio" name="mode" value="add" className="mt-1" />
                      <span>
                        <span className="font-medium">{d.add}</span>
                        <span className="block text-sm text-muted">{d.addHint}</span>
                      </span>
                    </label>
                  </>
                )}
                <Button type="submit" shine>
                  {d.publish}
                </Button>
              </fieldset>
            </form>
          </section>

          <section className={panelClass}>
            <h2 className="font-serif text-2xl tracking-tight">{d.discardTitle}</h2>
            <p className="mt-1 text-sm text-muted">{d.discardHint}</p>
            <form action={discardDraftAction} className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="sure" required />
                {d.discardConfirm}
              </label>
              <Button type="submit" variant="danger" size="sm">
                {d.discard}
              </Button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
