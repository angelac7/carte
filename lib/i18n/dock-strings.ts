import type { LanguageCode } from "@/lib/languages";

export type DockStrings = {
  label: string;
  order: string;
  ask: string;
  photo: string;
  allergies: string;
};

export const DOCK_STRINGS: Record<LanguageCode, DockStrings> = {
  en: { label: "Menu tools", order: "Order", ask: "Ask", photo: "Photo", allergies: "Allergies" },
  es: {
    label: "Herramientas del menú",
    order: "Pedido",
    ask: "Preguntar",
    photo: "Foto",
    allergies: "Alergias",
  },
  zh: { label: "菜单工具", order: "点单", ask: "提问", photo: "拍照", allergies: "过敏" },
  ko: { label: "메뉴 도구", order: "주문", ask: "질문", photo: "사진", allergies: "알레르기" },
  ja: {
    label: "メニューツール",
    order: "注文",
    ask: "質問",
    photo: "写真",
    allergies: "アレルギー",
  },
  fr: {
    label: "Outils du menu",
    order: "Commande",
    ask: "Question",
    photo: "Photo",
    allergies: "Allergies",
  },
  vi: {
    label: "Công cụ thực đơn",
    order: "Gọi món",
    ask: "Hỏi",
    photo: "Ảnh",
    allergies: "Dị ứng",
  },
};
