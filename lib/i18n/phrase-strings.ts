import type { LanguageCode } from "@/lib/languages";

// Diners show these to staff, so they're fixed translations and never AI-generated.
// TODO: have a native speaker review each language before launch.

export const PHRASE_IDS = [
  "cleanTools",
  "sameOil",
  "sauces",
  "ingredients",
  "water",
  "check",
] as const;
export type PhraseId = (typeof PHRASE_IDS)[number];

export type PhraseStrings = {
  title: string;
  hint: string;
  listen: string;
  phrases: Record<PhraseId, string>;
};

export const PHRASE_STRINGS: Record<LanguageCode, PhraseStrings> = {
  en: {
    title: "Helpful phrases",
    hint: "Tap one to show it large to staff.",
    listen: "Hear it",
    phrases: {
      cleanTools: "Please use clean utensils and a clean surface for my food.",
      sameOil: "Is this fried in the same oil as other foods?",
      sauces: "What is in the sauces and dressings?",
      ingredients: "Could I see the full ingredient list for this dish?",
      water: "Could I have some water, please?",
      check: "Could I have the check, please?",
    },
  },
  es: {
    title: "Frases útiles",
    hint: "Toque una para mostrarla en grande al personal.",
    listen: "Escuchar",
    phrases: {
      cleanTools: "Por favor, use utensilios y una superficie limpios para mi comida.",
      sameOil: "¿Esto se fríe en el mismo aceite que otros alimentos?",
      sauces: "¿Qué llevan las salsas y los aderezos?",
      ingredients: "¿Podría ver la lista completa de ingredientes de este plato?",
      water: "¿Me trae agua, por favor?",
      check: "¿Me trae la cuenta, por favor?",
    },
  },
  zh: {
    title: "常用语",
    hint: "点一下即可放大给员工看。",
    listen: "朗读",
    phrases: {
      cleanTools: "请用干净的餐具和台面来准备我的食物。",
      sameOil: "这道菜是和其他食物用同一锅油炸的吗？",
      sauces: "酱汁和调料里有什么？",
      ingredients: "可以看看这道菜的完整配料表吗？",
      water: "请给我一些水，好吗？",
      check: "请帮我结账，好吗？",
    },
  },
  ko: {
    title: "유용한 표현",
    hint: "누르면 직원에게 크게 보여 줄 수 있어요.",
    listen: "듣기",
    phrases: {
      cleanTools: "제 음식은 깨끗한 조리 도구와 조리대를 사용해 주세요.",
      sameOil: "이 음식은 다른 음식과 같은 기름에 튀기나요?",
      sauces: "소스와 드레싱에는 무엇이 들어가나요?",
      ingredients: "이 요리의 전체 재료 목록을 볼 수 있을까요?",
      water: "물 좀 주시겠어요?",
      check: "계산서 좀 주시겠어요?",
    },
  },
  ja: {
    title: "便利なフレーズ",
    hint: "タップするとスタッフに大きく見せられます。",
    listen: "読み上げる",
    phrases: {
      cleanTools: "私の料理には清潔な調理器具と調理台を使ってください。",
      sameOil: "これはほかの料理と同じ油で揚げていますか？",
      sauces: "ソースやドレッシングには何が入っていますか？",
      ingredients: "この料理の材料をすべて見せていただけますか？",
      water: "お水をいただけますか？",
      check: "お会計をお願いできますか？",
    },
  },
  fr: {
    title: "Phrases utiles",
    hint: "Touchez une phrase pour l’afficher en grand au personnel.",
    listen: "Écouter",
    phrases: {
      cleanTools: "Merci d’utiliser des ustensiles et une surface propres pour mon plat.",
      sameOil: "Est-ce frit dans la même huile que d’autres aliments ?",
      sauces: "Qu’y a-t-il dans les sauces et les assaisonnements ?",
      ingredients: "Pourrais-je voir la liste complète des ingrédients de ce plat ?",
      water: "Pourrais-je avoir de l’eau, s’il vous plaît ?",
      check: "L’addition, s’il vous plaît.",
    },
  },
  vi: {
    title: "Câu nói hữu ích",
    hint: "Chạm vào một câu để phóng to cho nhân viên xem.",
    listen: "Nghe",
    phrases: {
      cleanTools: "Vui lòng dùng dụng cụ và bề mặt sạch để làm món của tôi.",
      sameOil: "Món này có chiên chung dầu với món khác không?",
      sauces: "Nước sốt và nước trộn có những gì?",
      ingredients: "Cho tôi xem danh sách đầy đủ nguyên liệu của món này được không?",
      water: "Cho tôi xin ít nước được không?",
      check: "Cho tôi xin hóa đơn được không?",
    },
  },
};
