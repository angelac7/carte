import type { Metadata } from "next";
import UploadMenu from "@/components/owner/UploadMenu";
import { requireRestaurant } from "@/lib/auth";
import { ownerStrings } from "@/lib/owner-language";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await ownerStrings();
  return { title: `${t.nav.upload} | Carte` };
}

export default async function UploadPage() {
  await requireRestaurant("/dashboard/upload");
  return <UploadMenu />;
}
