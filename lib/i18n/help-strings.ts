import type { LanguageCode } from "@/lib/languages";

// TODO: have a native speaker review each language before launch.

export type HelpStrings = {
  helperButton: string;
  hunger: string;
  hungerLight: string;
  hungerHungry: string;
  hungerVery: string;
  spice: string;
  spiceOptions: [string, string, string, string];
  people: string;
  budget: string;
  budgetOptional: string;
  usesFilters: string;
  getPicks: string;
  thinking: string;
  failed: string;
  noPicks: string;
  picksTitle: string;
  disclaimer: string;
  display: string;
  largeText: string;
  highContrast: string;
  voice: string;
  listening: string;
  listen: string;
};

export const HELP_STRINGS: Record<LanguageCode, HelpStrings> = {
  en: {
    helperButton: "What should I order?",
    hunger: "How hungry are you?",
    hungerLight: "A little",
    hungerHungry: "Hungry",
    hungerVery: "Very hungry",
    spice: "Spice",
    spiceOptions: ["No spice", "Mild", "Medium", "Hot"],
    people: "People",
    budget: "Budget per person",
    budgetOptional: "Optional",
    usesFilters: "Suggestions only include dishes that match your filters.",
    getPicks: "Get suggestions",
    thinking: "Choosing dishes…",
    failed: "Suggestions aren't available right now.",
    noPicks: "No dishes match your filters. Try removing one.",
    picksTitle: "Our suggestions",
    disclaimer:
      "Suggestions are made by AI from the menu. Always confirm allergies with your server.",
    display: "Display",
    largeText: "Larger text",
    highContrast: "High contrast",
    voice: "Speak your question",
    listening: "Listening…",
    listen: "Listen",
  },
  es: {
    helperButton: "¿Qué pido?",
    hunger: "¿Cuánta hambre tiene?",
    hungerLight: "Un poco",
    hungerHungry: "Con hambre",
    hungerVery: "Mucha hambre",
    spice: "Picante",
    spiceOptions: ["Sin picante", "Suave", "Medio", "Picante"],
    people: "Personas",
    budget: "Presupuesto por persona",
    budgetOptional: "Opcional",
    usesFilters: "Las sugerencias solo incluyen platos que coinciden con sus filtros.",
    getPicks: "Ver sugerencias",
    thinking: "Eligiendo platos…",
    failed: "Las sugerencias no están disponibles en este momento.",
    noPicks: "Ningún plato coincide con sus filtros. Intente quitar alguno.",
    picksTitle: "Nuestras sugerencias",
    disclaimer:
      "Las sugerencias las hace una IA a partir del menú. Confirme siempre sus alergias con su mesero.",
    display: "Pantalla",
    largeText: "Texto más grande",
    highContrast: "Alto contraste",
    voice: "Diga su pregunta",
    listening: "Escuchando…",
    listen: "Escuchar",
  },
  zh: {
    helperButton: "该点什么？",
    hunger: "您有多饿？",
    hungerLight: "有点饿",
    hungerHungry: "饿了",
    hungerVery: "非常饿",
    spice: "辣度",
    spiceOptions: ["不辣", "微辣", "中辣", "特辣"],
    people: "人数",
    budget: "人均预算",
    budgetOptional: "可选",
    usesFilters: "推荐仅包含符合您筛选条件的菜品。",
    getPicks: "获取推荐",
    thinking: "正在挑选菜品…",
    failed: "暂时无法提供推荐。",
    noPicks: "没有符合筛选条件的菜品。请尝试移除筛选条件。",
    picksTitle: "为您推荐",
    disclaimer: "推荐由 AI 根据菜单生成。请务必向服务员确认过敏情况。",
    display: "显示",
    largeText: "放大文字",
    highContrast: "高对比度",
    voice: "语音提问",
    listening: "正在聆听…",
    listen: "朗读",
  },
  ko: {
    helperButton: "뭘 주문할까요?",
    hunger: "얼마나 배고프세요?",
    hungerLight: "조금",
    hungerHungry: "배고파요",
    hungerVery: "아주 배고파요",
    spice: "매운 정도",
    spiceOptions: ["안 맵게", "약간", "보통", "맵게"],
    people: "인원",
    budget: "1인당 예산",
    budgetOptional: "선택 사항",
    usesFilters: "추천은 필터에 맞는 요리만 포함합니다.",
    getPicks: "추천 받기",
    thinking: "요리를 고르는 중…",
    failed: "지금은 추천을 사용할 수 없습니다.",
    noPicks: "필터에 맞는 요리가 없습니다. 필터를 하나 해제해 보세요.",
    picksTitle: "추천 메뉴",
    disclaimer: "추천은 메뉴를 바탕으로 AI가 만듭니다. 알레르기는 반드시 직원에게 확인해 주세요.",
    display: "화면 설정",
    largeText: "큰 글씨",
    highContrast: "고대비",
    voice: "음성으로 질문하기",
    listening: "듣는 중…",
    listen: "듣기",
  },
  ja: {
    helperButton: "何を注文する？",
    hunger: "お腹の空き具合は？",
    hungerLight: "少し",
    hungerHungry: "空いている",
    hungerVery: "とても空いている",
    spice: "辛さ",
    spiceOptions: ["辛くない", "ピリ辛", "中辛", "辛口"],
    people: "人数",
    budget: "1人あたりの予算",
    budgetOptional: "任意",
    usesFilters: "おすすめはフィルターに合う料理のみです。",
    getPicks: "おすすめを見る",
    thinking: "料理を選んでいます…",
    failed: "現在おすすめを表示できません。",
    noPicks: "条件に合う料理がありません。フィルターを外してみてください。",
    picksTitle: "おすすめ",
    disclaimer:
      "おすすめはメニューをもとにAIが作成しています。アレルギーは必ずスタッフにご確認ください。",
    display: "表示",
    largeText: "文字を大きく",
    highContrast: "ハイコントラスト",
    voice: "声で質問",
    listening: "聞き取り中…",
    listen: "読み上げ",
  },
  fr: {
    helperButton: "Que commander ?",
    hunger: "Quelle faim avez-vous ?",
    hungerLight: "Un peu",
    hungerHungry: "Faim",
    hungerVery: "Très faim",
    spice: "Piquant",
    spiceOptions: ["Pas épicé", "Doux", "Moyen", "Fort"],
    people: "Personnes",
    budget: "Budget par personne",
    budgetOptional: "Facultatif",
    usesFilters: "Les suggestions n'incluent que les plats correspondant à vos filtres.",
    getPicks: "Voir les suggestions",
    thinking: "Choix des plats…",
    failed: "Les suggestions ne sont pas disponibles pour le moment.",
    noPicks: "Aucun plat ne correspond à vos filtres. Essayez d'en retirer un.",
    picksTitle: "Nos suggestions",
    disclaimer:
      "Les suggestions sont faites par une IA à partir du menu. Confirmez toujours vos allergies auprès du serveur.",
    display: "Affichage",
    largeText: "Texte plus grand",
    highContrast: "Contraste élevé",
    voice: "Poser la question à voix haute",
    listening: "Écoute…",
    listen: "Écouter",
  },
  vi: {
    helperButton: "Nên gọi món gì?",
    hunger: "Bạn đói đến mức nào?",
    hungerLight: "Hơi đói",
    hungerHungry: "Đói",
    hungerVery: "Rất đói",
    spice: "Độ cay",
    spiceOptions: ["Không cay", "Cay nhẹ", "Cay vừa", "Rất cay"],
    people: "Số người",
    budget: "Ngân sách mỗi người",
    budgetOptional: "Không bắt buộc",
    usesFilters: "Gợi ý chỉ gồm các món phù hợp với bộ lọc của bạn.",
    getPicks: "Xem gợi ý",
    thinking: "Đang chọn món…",
    failed: "Hiện không thể đưa ra gợi ý.",
    noPicks: "Không có món nào phù hợp với bộ lọc. Hãy thử bỏ bớt một bộ lọc.",
    picksTitle: "Gợi ý cho bạn",
    disclaimer: "Gợi ý do AI tạo ra từ thực đơn. Hãy luôn xác nhận dị ứng với nhân viên phục vụ.",
    display: "Hiển thị",
    largeText: "Chữ lớn hơn",
    highContrast: "Độ tương phản cao",
    voice: "Hỏi bằng giọng nói",
    listening: "Đang nghe…",
    listen: "Nghe",
  },
};
