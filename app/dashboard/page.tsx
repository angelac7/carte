import type { Metadata } from "next";
import UploadMenu from "@/components/owner/UploadMenu";
import { requireRestaurant } from "@/lib/auth";

export const metadata: Metadata = { title: "Upload menu | Carte" };

export default async function DashboardPage() {
  await requireRestaurant();
  return <UploadMenu />;
}
