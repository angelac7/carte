import { z } from "zod";
import { ScannedDishSchema } from "@/types/camera";
import { ExtractedDishSchema } from "@/types/menu";

// Menu reading streams one event per line, so dishes can be shown as soon as they're read.

const done = z.object({ type: z.literal("done") });
const error = z.object({ type: z.literal("error"), message: z.string() });

/** Events from /api/extract while an owner's menu photo is read. */
export const MenuStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("dish"), dish: ExtractedDishSchema }),
  done,
  error,
]);

/** Events from /api/scan while a diner's paper-menu photo is read and translated. */
export const ScanStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("language"), menuLanguage: z.string() }),
  z.object({ type: z.literal("dish"), dish: ScannedDishSchema }),
  done,
  error,
]);

export type MenuStreamEvent = z.input<typeof MenuStreamEventSchema>;
export type ScanStreamEvent = z.input<typeof ScanStreamEventSchema>;
