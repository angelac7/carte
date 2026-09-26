import { en } from "@/lib/i18n/owner/en";
import type { OwnerStrings } from "@/lib/i18n/owner-strings";

export type ChecklistItem = {
  id: string;
  label: string;
  href: string;
  done: boolean;
  note?: string;
};

type ChecklistInput = {
  dishCount: number;
  needReview: number;
  withPhotos: number;
  hasProfile: boolean;
  listed: boolean;
  claim: { placeId: string | null; verified: boolean };
};

/** The steps that take a restaurant from signed up to fully set up on Carte. */
export function buildChecklist(
  input: ChecklistInput,
  labels: OwnerStrings["checklist"] = en.checklist,
): ChecklistItem[] {
  return [
    {
      id: "upload",
      label: labels.upload,
      href: "/dashboard/upload",
      done: input.dishCount > 0,
    },
    {
      id: "confirm",
      label: labels.confirm,
      href: "/dashboard/review",
      done: input.dishCount > 0 && input.needReview === 0,
    },
    {
      id: "photos",
      label: labels.photos,
      href: "/dashboard/review",
      done: input.withPhotos > 0,
    },
    {
      id: "profile",
      label: labels.profile,
      href: "/dashboard/profile",
      done: input.hasProfile,
    },
    {
      id: "listed",
      label: labels.listed,
      href: "/dashboard/profile",
      done: input.listed,
    },
    {
      id: "map",
      label: labels.map,
      href: "/dashboard/claim",
      done: input.claim.verified,
      note: input.claim.placeId && !input.claim.verified ? labels.waiting : undefined,
    },
  ];
}
