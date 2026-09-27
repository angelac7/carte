import { z } from "zod";
import { LANGUAGE_CODES } from "@/lib/languages";
import { ProfileSchema } from "@/lib/restaurant-profile";
import { MenuItemSchema } from "@/types/menu";

/** A backup's profile: everything but the restaurant's name and whether it's on Discover. */
export const BackupProfileSchema = ProfileSchema.omit({ revision: true, name: true, listed: true });

const TranslatedSchema = z.object({
  name: z.string().max(2000),
  description: z.string().max(2000),
  notes: z.string().max(2000),
  section: z.string().max(80),
  options: z.array(z.string().max(60)).max(20),
});

/** A dish as saved in a backup: its text, allergens, options, and serving times, but no photo. */
export const BackupDishSchema = MenuItemSchema.pick({
  name: true,
  description: true,
  price: true,
  allergens: true,
  dietary_tags: true,
  notes: true,
  source_language: true,
  section: true,
  special: true,
  calories: true,
  spice: true,
  removable: true,
  may_contain: true,
  also_contains: true,
  sizes: true,
  addons: true,
  available_from: true,
  available_until: true,
}).extend({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500),
  price: z.string().max(20),
  /** The seasonal menu it belongs to, by its place in the backup's list. */
  seasonal_menu: z.number().int().min(0).max(49).nullable().optional(),
  /** Translations the team corrected, by language. The AI's own translations aren't kept. */
  translations: z.partialRecord(z.enum(LANGUAGE_CODES), TranslatedSchema).optional(),
});

export const BackupSchema = z.object({
  carte_backup: z.literal(1),
  exported_at: z.string().max(40),
  profile: BackupProfileSchema,
  seasonal_menus: z
    .array(z.object({ name: z.string().trim().min(1).max(60), active: z.boolean() }))
    .max(50),
  dishes: z.array(BackupDishSchema).max(1000),
});

export type Backup = z.infer<typeof BackupSchema>;
export type BackupDish = z.infer<typeof BackupDishSchema>;
