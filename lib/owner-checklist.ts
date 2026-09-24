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
export function buildChecklist(input: ChecklistInput): ChecklistItem[] {
  return [
    {
      id: "upload",
      label: "Upload your menu",
      href: "/dashboard/upload",
      done: input.dishCount > 0,
    },
    {
      id: "confirm",
      label: "Confirm every dish",
      href: "/dashboard/review",
      done: input.dishCount > 0 && input.needReview === 0,
    },
    {
      id: "photos",
      label: "Add dish photos",
      href: "/dashboard/review",
      done: input.withPhotos > 0,
    },
    {
      id: "profile",
      label: "Fill in your profile",
      href: "/dashboard/profile",
      done: input.hasProfile,
    },
    {
      id: "listed",
      label: "Show your restaurant on Discover",
      href: "/dashboard/profile",
      done: input.listed,
    },
    {
      id: "map",
      label: "Link your map listing",
      href: "/dashboard/claim",
      done: input.claim.verified,
      note: input.claim.placeId && !input.claim.verified ? "Waiting for verification" : undefined,
    },
  ];
}
