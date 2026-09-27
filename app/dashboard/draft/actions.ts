"use server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/auth";
import { listDishes } from "@/lib/db";
import { discardDraft, publishDraft } from "@/lib/db/drafts";
import { prepareExplanations } from "@/lib/prepare-explanations";
import { reportError } from "@/lib/report-error";
import { deleteStoredPhoto } from "@/lib/storage/dish-photos";

const PAGE = "/dashboard/draft";

function refresh() {
  for (const path of [PAGE, "/dashboard", "/dashboard/review"]) revalidatePath(path);
}

/** Removes the photos of dishes that are gone. A photo left behind is only wasted space. */
function removePhotos(urls: (string | null | undefined)[], restaurantId: string) {
  return Promise.all(urls.map((url) => deleteStoredPhoto(url, restaurantId).catch(() => {})));
}

export async function publishDraftAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant(PAGE);
  const replace = formData.get("mode") === "replace";
  const before = await listDishes(supabase, restaurant.id);
  let result: string;
  try {
    const published = await publishDraft(supabase, restaurant.id, replace);
    if (replace)
      await removePhotos(
        before.filter((dish) => !dish.draft).map((dish) => dish.photo_url),
        restaurant.id,
      );
    // Explain the new dishes now, so the first diners don't wait.
    after(async () =>
      prepareExplanations(
        (await listDishes(supabase, restaurant.id)).filter((dish) => dish.confirmed),
        restaurant,
      ),
    );
    result = `published=${published}`;
  } catch (error) {
    if ((error as { code?: string }).code !== "40001")
      reportError("Publishing a draft failed", error);
    result = "failed=1";
  }
  refresh();
  redirect(`${PAGE}?${result}`);
}

export async function discardDraftAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant(PAGE);
  if (formData.get("sure") !== "on") redirect(PAGE);
  const drafts = (await listDishes(supabase, restaurant.id)).filter((dish) => dish.draft);
  let result = "discarded=1";
  try {
    await discardDraft(supabase, restaurant.id);
    await removePhotos(
      drafts.map((dish) => dish.photo_url),
      restaurant.id,
    );
  } catch (error) {
    reportError("Throwing away a draft failed", error);
    result = "failed=1";
  }
  refresh();
  redirect(`${PAGE}?${result}`);
}
