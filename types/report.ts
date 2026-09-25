import { z } from "zod";

export const REPORT_KINDS = ["allergens", "diet", "description", "price", "other"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

/** What a diner sends when a dish's details look wrong. */
export const ReportRequestSchema = z.object({
  restaurant: z.string().min(1).max(40),
  dish: z.uuid(),
  kind: z.enum(REPORT_KINDS),
  message: z.string().trim().max(500).default(""),
});
export type ReportRequest = z.infer<typeof ReportRequestSchema>;

export type DishReport = {
  id: string;
  menu_item_id: string | null;
  dish_name: string;
  kind: ReportKind;
  message: string;
  created_at: string;
};
