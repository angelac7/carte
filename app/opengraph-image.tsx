import { SHARE_IMAGE_SIZE, shareImage } from "@/lib/share-image";

export const alt = "Carte: every menu, understood";
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return shareImage({
    title: "Every menu, understood.",
    subtitle: "Menus with confirmed allergens, translations, and answers for every diner.",
  });
}
