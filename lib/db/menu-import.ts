import type { SupabaseClient } from "@supabase/supabase-js";
import type { MenuItem } from "@/types/menu";
import type { ImportPlan } from "@/lib/menu-csv";
export async function saveImportPreview(
  supabase: SupabaseClient,
  restaurantId: string,
  dishes: MenuItem[],
  plan: ImportPlan,
  summary: unknown,
): Promise<string> {
  const add = plan.add.map((row) => ({
    ...row,
    removable: (row.removable ?? []).filter((a) => (row.allergens ?? []).includes(a)),
    may_contain: (row.may_contain ?? []).filter((a) => !(row.allergens ?? []).includes(a)),
  }));
  const { data, error } = await supabase
    .from("menu_imports")
    .insert({
      restaurant_id: restaurantId,
      snapshot: dishes.map(({ id, revision }) => ({ id, revision })),
      payload: { add, change: plan.change.map(({ updated }) => updated), summary },
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
export async function applyImportPreview(
  supabase: SupabaseClient,
  restaurantId: string,
  previewId: string,
) {
  const { data, error } = await supabase.rpc("apply_menu_import", {
    preview: previewId,
    restaurant: restaurantId,
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}
