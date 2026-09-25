import type { SupabaseClient } from "@supabase/supabase-js";
import type { DishReport, ReportKind } from "@/types/report";

/** Saves a diner's report. The database only accepts reports about confirmed dishes. */
export async function addDishReport(
  supabase: SupabaseClient,
  report: {
    restaurantId: string;
    dishId: string;
    dishName: string;
    kind: ReportKind;
    message: string;
  },
): Promise<void> {
  const { error } = await supabase.from("dish_reports").insert({
    restaurant_id: report.restaurantId,
    menu_item_id: report.dishId,
    dish_name: report.dishName.slice(0, 300),
    kind: report.kind,
    message: report.message,
  });
  if (error) throw error;
}

/** Reports the owner hasn't marked fixed yet, newest first. */
export async function listOpenReports(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<DishReport[]> {
  const { data, error } = await supabase
    .from("dish_reports")
    .select("id, menu_item_id, dish_name, kind, message, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as DishReport[];
}

export async function resolveReport(
  supabase: SupabaseClient,
  restaurantId: string,
  reportId: string,
): Promise<void> {
  const { error } = await supabase
    .from("dish_reports")
    .update({ resolved: true })
    .eq("id", reportId)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}
