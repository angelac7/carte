import type { LanguageCode } from "@/lib/languages";

// TODO: have a native speaker review each language before launch.

export type DishStrings = {
  details: string;
  whatItIs: string;
  nameMeaning: string;
  served: string;
  /** On each dish card, a hint that tapping opens the full explanation. */
  explainLink: string;
  taste: string;
  background: string;
  glossary: string;
  spice: string;
  spiceLevels: [string, string, string, string];
  richness: string;
  richnessLevels: [string, string, string, string];
  portion: string;
  portionLabels: { small: string; single: string; share: string };
  pairings: string;
  askKitchen: string;
  listen: string;
  close: string;
  loading: string;
  failed: string;
  disclaimer: string;
};

export const DISH_STRINGS: Record<LanguageCode, DishStrings> = {
  en: {
    details: "Details",
    whatItIs: "What it is",
    nameMeaning: "About the name",
    served: "How it's served",
    explainLink: "Explain this dish",
    taste: "Taste",
    background: "Background",
    glossary: "Words to know",
    spice: "Spice",
    spiceLevels: ["Not spicy", "Mild", "Medium", "Hot"],
    richness: "Richness",
    richnessLevels: ["Light", "Moderate", "Rich", "Very rich"],
    portion: "Portion",
    portionLabels: { small: "Small plate", single: "Single serving", share: "Good for sharing" },
    pairings: "Goes well with",
    askKitchen: "Questions for your server",
    listen: "Hear the name",
    close: "Close",
    loading: "Getting dish details…",
    failed: "Dish details aren't available right now.",
    disclaimer:
      "Descriptions are general and written by AI. Allergens and kitchen notes come from the restaurant.",
  },
  es: {
    details: "Detalles",
    whatItIs: "Qué es",
    nameMeaning: "Sobre el nombre",
    served: "Cómo se sirve",
    explainLink: "Explicar este plato",
    taste: "Sabor",
    background: "Origen",
    glossary: "Palabras a conocer",
    spice: "Picante",
    spiceLevels: ["Sin picante", "Suave", "Medio", "Picante"],
    richness: "Contundencia",
    richnessLevels: ["Ligero", "Moderado", "Contundente", "Muy contundente"],
    portion: "Porción",
    portionLabels: {
      small: "Plato pequeño",
      single: "Porción individual",
      share: "Para compartir",
    },
    pairings: "Combina bien con",
    askKitchen: "Preguntas para su mesero",
    listen: "Escuchar el nombre",
    close: "Cerrar",
    loading: "Obteniendo detalles del plato…",
    failed: "Los detalles del plato no están disponibles en este momento.",
    disclaimer:
      "Las descripciones son generales y las escribe una IA. Los alérgenos y las notas de cocina provienen del restaurante.",
  },
  zh: {
    details: "详情",
    whatItIs: "这是什么",
    nameMeaning: "菜名含义",
    served: "上菜方式",
    explainLink: "了解这道菜",
    taste: "口味",
    background: "背景",
    glossary: "菜单用语解释",
    spice: "辣度",
    spiceLevels: ["不辣", "微辣", "中辣", "特辣"],
    richness: "浓郁度",
    richnessLevels: ["清淡", "适中", "浓郁", "非常浓郁"],
    portion: "分量",
    portionLabels: { small: "小份", single: "单人份", share: "适合分享" },
    pairings: "搭配推荐",
    askKitchen: "可以问服务员的问题",
    listen: "听发音",
    close: "关闭",
    loading: "正在获取菜品详情…",
    failed: "暂时无法获取菜品详情。",
    disclaimer: "描述为 AI 生成的一般介绍。过敏原和厨房备注由餐厅提供。",
  },
  ko: {
    details: "자세히",
    whatItIs: "어떤 요리인가요",
    nameMeaning: "이름의 뜻",
    served: "제공 방식",
    explainLink: "이 요리 알아보기",
    taste: "맛",
    background: "유래",
    glossary: "알아두면 좋은 단어",
    spice: "매운 정도",
    spiceLevels: ["안 매움", "약간 매움", "보통", "매움"],
    richness: "진한 정도",
    richnessLevels: ["담백함", "보통", "진함", "매우 진함"],
    portion: "양",
    portionLabels: { small: "작은 접시", single: "1인분", share: "나눠 먹기 좋음" },
    pairings: "함께 먹기 좋은 것",
    askKitchen: "직원에게 물어볼 것",
    listen: "이름 듣기",
    close: "닫기",
    loading: "요리 정보를 불러오는 중…",
    failed: "지금은 요리 정보를 불러올 수 없습니다.",
    disclaimer:
      "설명은 AI가 작성한 일반적인 내용입니다. 알레르기 정보와 주방 메모는 레스토랑에서 제공합니다.",
  },
  ja: {
    details: "詳細",
    whatItIs: "どんな料理？",
    nameMeaning: "名前の意味",
    served: "提供スタイル",
    explainLink: "この料理について",
    taste: "味",
    background: "由来",
    glossary: "知っておきたい言葉",
    spice: "辛さ",
    spiceLevels: ["辛くない", "ピリ辛", "中辛", "辛口"],
    richness: "こってり度",
    richnessLevels: ["あっさり", "ふつう", "こってり", "とてもこってり"],
    portion: "量",
    portionLabels: { small: "小皿", single: "一人前", share: "シェア向き" },
    pairings: "相性の良いもの",
    askKitchen: "スタッフに聞けること",
    listen: "名前を聞く",
    close: "閉じる",
    loading: "料理の詳細を取得中…",
    failed: "現在、料理の詳細を表示できません。",
    disclaimer:
      "説明はAIによる一般的な内容です。アレルゲンと厨房メモはレストランが提供しています。",
  },
  fr: {
    details: "Détails",
    whatItIs: "Ce que c'est",
    nameMeaning: "À propos du nom",
    served: "Comment il est servi",
    explainLink: "Découvrir ce plat",
    taste: "Goût",
    background: "Origine",
    glossary: "Mots à connaître",
    spice: "Piquant",
    spiceLevels: ["Pas épicé", "Doux", "Moyen", "Fort"],
    richness: "Richesse",
    richnessLevels: ["Léger", "Modéré", "Riche", "Très riche"],
    portion: "Portion",
    portionLabels: {
      small: "Petite assiette",
      single: "Portion individuelle",
      share: "À partager",
    },
    pairings: "Se marie bien avec",
    askKitchen: "Questions à poser au serveur",
    listen: "Écouter le nom",
    close: "Fermer",
    loading: "Chargement des détails du plat…",
    failed: "Les détails du plat ne sont pas disponibles pour le moment.",
    disclaimer:
      "Les descriptions sont générales et rédigées par une IA. Les allergènes et les notes de cuisine sont fournis par le restaurant.",
  },
  vi: {
    details: "Chi tiết",
    whatItIs: "Món này là gì",
    nameMeaning: "Ý nghĩa tên món",
    served: "Cách phục vụ",
    explainLink: "Tìm hiểu món này",
    taste: "Hương vị",
    background: "Nguồn gốc",
    glossary: "Từ ngữ cần biết",
    spice: "Độ cay",
    spiceLevels: ["Không cay", "Cay nhẹ", "Cay vừa", "Rất cay"],
    richness: "Độ đậm đà",
    richnessLevels: ["Thanh nhẹ", "Vừa phải", "Đậm đà", "Rất đậm"],
    portion: "Khẩu phần",
    portionLabels: { small: "Đĩa nhỏ", single: "Một người ăn", share: "Nên ăn chung" },
    pairings: "Hợp với",
    askKitchen: "Câu hỏi cho nhân viên phục vụ",
    listen: "Nghe tên món",
    close: "Đóng",
    loading: "Đang tải thông tin món…",
    failed: "Hiện không thể tải thông tin món.",
    disclaimer:
      "Mô tả mang tính tổng quát và do AI viết. Chất gây dị ứng và ghi chú của bếp do nhà hàng cung cấp.",
  },
};
