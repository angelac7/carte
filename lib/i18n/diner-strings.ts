import type { Allergen, DietaryTag } from "@/lib/allergens";
import type { LanguageCode } from "@/lib/languages";

// Allergen names are safety-critical and are never AI-generated.
// TODO: have a native speaker review each language before launch.

export type DinerStrings = {
  menuTitle: string;
  safetyNotice: string;
  notReady: string;
  language: string;
  hideContaining: string;
  showOnly: string;
  showing: (shown: number, total: number, hidden: number) => string;
  clearFilters: string;
  noMatch: string;
  contains: string;
  noMajorAllergens: (checked: number) => string;
  /** Dishes hidden because they weren't checked for an allergen the diner avoids. */
  uncheckedHidden: (count: number, allergens: string) => string;
  kitchenNote: string;
  translating: string;
  translationFailed: string;
  offlineMenu: string;
  menuUpdated: string;
  refreshFailed: string;
  orderFiltered: string;
  retryTranslation: string;
  translatedNote: string;
  searchPlaceholder: string;
  filtersButton: string;
  showDishes: (count: number) => string;
  dishCount: (count: number) => string;
  noSearchMatch: (query: string) => string;
  clearSearch: string;
  helperPitch: string;
  /** An active allergen filter as a short pill, like "No milk". */
  avoidPill: (allergen: string) => string;
  removeFilter: (label: string) => string;
  /** The heading for dishes the owner hasn't put in a section. */
  otherDishes: string;
  sectionsLabel: string;
  soldOut: string;
  special: string;
  specials: string;
  servedBetween: (from: string, until: string) => string;
  notServedNow: string;
  call: string;
  website: string;
  reserve: string;
  sizes: string;
  addons: string;
  chooseOptions: string;
  addToOrder: string;
  inOrder: (count: number) => string;
  addonBlocked: string;
  allergens: Record<Allergen, string>;
  tags: Record<DietaryTag, string>;
};

export const DINER_STRINGS: Record<LanguageCode, DinerStrings> = {
  en: {
    searchPlaceholder: "Search dishes or ingredients",
    filtersButton: "Allergies & diet",
    showDishes: (n) => (n === 1 ? "Show 1 dish" : `Show ${n} dishes`),
    dishCount: (n) => (n === 1 ? "1 dish" : `${n} dishes`),
    noSearchMatch: (q) => `No dishes match “${q}”.`,
    clearSearch: "Clear search",
    helperPitch: "Tell Carte about your table and get suggestions that respect your filters.",
    avoidPill: (a) => `No ${a}`,
    removeFilter: (label) => `Remove ${label}`,
    otherDishes: "More dishes",
    sectionsLabel: "Jump to a section",
    soldOut: "Sold out today",
    special: "Special",
    specials: "Specials",
    servedBetween: (from, until) => `Served ${from}–${until}`,
    notServedNow: "Not served right now",
    call: "Call",
    website: "Website",
    reserve: "Reserve a table",
    sizes: "Sizes",
    addons: "Add-ons",
    chooseOptions: "Choose options",
    addToOrder: "Add to order",
    inOrder: (n) => (n === 1 ? "1 in your order" : `${n} in your order`),
    addonBlocked: "Contains an allergen you avoid",
    menuUpdated:
      "The restaurant updated this menu. Your order and assistant results were cleared; review the current dishes before ordering.",
    refreshFailed:
      "Could not check for menu updates. Confirm current dishes and allergens with staff.",
    offlineMenu:
      "Offline menu copy: dishes and allergen information may have changed. Confirm the current menu and allergens with staff.",
    orderFiltered: "Items excluded by your current filters are omitted from your order.",
    retryTranslation: "Retry translation",
    menuTitle: "Menu",
    safetyNotice:
      "Allergen information comes from the restaurant. Kitchens share equipment and recipes change, so always tell your server about allergies before ordering.",
    notReady:
      "This menu isn't ready yet. Ask your server for today's menu and allergen information.",
    language: "Language",
    hideContaining: "Hide dishes that contain",
    showOnly: "Show only dishes marked",
    showing: (shown, total, hidden) =>
      `Showing ${shown} of ${total} ${total === 1 ? "dish" : "dishes"}.${hidden > 0 ? ` ${hidden} hidden by your filters.` : ""}`,
    clearFilters: "Clear filters",
    noMatch:
      "No dishes match your filters. Try removing one, or ask your server what the kitchen can adjust.",
    contains: "Contains",
    noMajorAllergens: (n) => `None of the ${n} major allergens listed`,
    uncheckedHidden: (count, list) =>
      count === 1
        ? `1 dish hasn't been checked for ${list} yet, so it's hidden. Ask your server about it.`
        : `${count} dishes haven't been checked for ${list} yet, so they're hidden. Ask your server about them.`,
    kitchenNote: "Kitchen note:",
    translating: "Translating menu…",
    translationFailed:
      "Translation isn't available right now, so the menu is shown in its original language.",
    translatedNote:
      "Dish descriptions were translated automatically. Ask your server if anything is unclear.",
    allergens: {
      milk: "milk",
      eggs: "eggs",
      fish: "fish",
      shellfish: "shellfish",
      "tree nuts": "tree nuts",
      peanuts: "peanuts",
      wheat: "wheat",
      soy: "soy",
      sesame: "sesame",
      celery: "celery",
      mustard: "mustard",
      lupin: "lupin",
      mollusks: "mollusks",
      sulfites: "sulfites",
    },
    tags: {
      vegan: "vegan",
      vegetarian: "vegetarian",
      "gluten-free": "gluten-free",
      halal: "halal",
      kosher: "kosher",
      "pregnancy-friendly": "pregnancy-friendly",
      "kid-friendly": "kid-friendly",
    },
  },
  es: {
    searchPlaceholder: "Buscar platos o ingredientes",
    filtersButton: "Alergias y dieta",
    showDishes: (n) => (n === 1 ? "Ver 1 plato" : `Ver ${n} platos`),
    dishCount: (n) => (n === 1 ? "1 plato" : `${n} platos`),
    noSearchMatch: (q) => `Ningún plato coincide con «${q}».`,
    clearSearch: "Borrar búsqueda",
    helperPitch: "Cuéntale a Carte sobre tu mesa y recibe sugerencias que respetan tus filtros.",
    avoidPill: (a) => `Sin ${a}`,
    removeFilter: (label) => `Quitar ${label}`,
    otherDishes: "Más platos",
    sectionsLabel: "Ir a una sección",
    soldOut: "Agotado hoy",
    special: "Especial",
    specials: "Especiales",
    servedBetween: (from, until) => `Se sirve de ${from} a ${until}`,
    notServedNow: "No se sirve ahora",
    call: "Llamar",
    website: "Sitio web",
    reserve: "Reservar mesa",
    sizes: "Tamaños",
    addons: "Extras",
    chooseOptions: "Elegir opciones",
    addToOrder: "Añadir al pedido",
    inOrder: (n) => `${n} en su pedido`,
    addonBlocked: "Contiene un alérgeno que evita",
    menuUpdated:
      "El restaurante actualizó el menú. Se borraron tu pedido y los resultados del asistente; revisa los platos antes de pedir.",
    refreshFailed:
      "No se pudo comprobar si hay cambios. Confirma los platos y alérgenos con el personal.",
    offlineMenu:
      "Copia del menú sin conexión: los platos y alérgenos pueden haber cambiado. Confirma el menú actual y los alérgenos con el personal.",
    orderFiltered: "Los platos excluidos por tus filtros actuales no se incluyen en tu pedido.",
    retryTranslation: "Reintentar traducción",
    menuTitle: "Menú",
    safetyNotice:
      "La información sobre alérgenos proviene del restaurante. Las cocinas comparten equipos y las recetas cambian, así que informe siempre a su mesero sobre sus alergias antes de pedir.",
    notReady:
      "Este menú aún no está listo. Pregunte a su mesero por el menú de hoy y la información sobre alérgenos.",
    language: "Idioma",
    hideContaining: "Ocultar platos que contienen",
    showOnly: "Mostrar solo platos marcados como",
    showing: (shown, total, hidden) =>
      `Mostrando ${shown} de ${total} ${total === 1 ? "plato" : "platos"}.${hidden > 0 ? ` ${hidden} ${hidden === 1 ? "oculto" : "ocultos"} por sus filtros.` : ""}`,
    clearFilters: "Borrar filtros",
    noMatch:
      "Ningún plato coincide con sus filtros. Quite alguno o pregunte a su mesero qué puede adaptar la cocina.",
    contains: "Contiene",
    noMajorAllergens: (n) => `No se indica ninguno de los ${n} alérgenos principales`,
    uncheckedHidden: (count, list) =>
      count === 1
        ? `1 plato aún no se ha revisado para ${list}, así que está oculto. Pregunte a su mesero.`
        : `${count} platos aún no se han revisado para ${list}, así que están ocultos. Pregunte a su mesero.`,
    kitchenNote: "Nota de cocina:",
    translating: "Traduciendo el menú…",
    translationFailed:
      "La traducción no está disponible en este momento, así que el menú se muestra en su idioma original.",
    translatedNote:
      "Las descripciones se tradujeron automáticamente. Pregunte a su mesero si algo no está claro.",
    allergens: {
      milk: "leche",
      eggs: "huevo",
      fish: "pescado",
      shellfish: "mariscos",
      "tree nuts": "nueces de árbol",
      peanuts: "cacahuate (maní)",
      wheat: "trigo",
      soy: "soya",
      sesame: "sésamo",
      celery: "apio",
      mustard: "mostaza",
      lupin: "altramuz",
      mollusks: "moluscos",
      sulfites: "sulfitos",
    },
    tags: {
      vegan: "vegano",
      vegetarian: "vegetariano",
      "gluten-free": "sin gluten",
      halal: "halal",
      kosher: "kosher",
      "pregnancy-friendly": "apto para embarazadas",
      "kid-friendly": "para niños",
    },
  },
  zh: {
    searchPlaceholder: "搜索菜品或食材",
    filtersButton: "过敏与饮食",
    showDishes: (n) => `显示 ${n} 道菜`,
    dishCount: (n) => `${n} 道菜`,
    noSearchMatch: (q) => `没有与“${q}”匹配的菜品。`,
    clearSearch: "清除搜索",
    helperPitch: "告诉 Carte 你们这桌的情况，获取符合筛选条件的推荐。",
    avoidPill: (a) => `不含${a}`,
    removeFilter: (label) => `移除${label}`,
    otherDishes: "更多菜品",
    sectionsLabel: "跳转到分类",
    soldOut: "今日售罄",
    special: "特色菜",
    specials: "特色菜",
    servedBetween: (from, until) => `供应时间 ${from}–${until}`,
    notServedNow: "当前不供应",
    call: "致电",
    website: "网站",
    reserve: "预订座位",
    sizes: "规格",
    addons: "加料",
    chooseOptions: "选择选项",
    addToOrder: "加入订单",
    inOrder: (n) => `订单中有 ${n} 份`,
    addonBlocked: "含有您避免的过敏原",
    menuUpdated: "餐厅更新了菜单。你的点单和助手结果已清除；点餐前请查看最新菜品。",
    refreshFailed: "无法检查菜单更新。请向工作人员确认当前菜品和过敏原。",
    offlineMenu: "离线菜单副本：菜品及过敏原信息可能已更改。请向工作人员确认当前菜单及过敏原。",
    orderFiltered: "当前筛选条件排除的菜品不会计入您的订单。",
    retryTranslation: "重试翻译",
    menuTitle: "菜单",
    safetyNotice:
      "过敏原信息由餐厅提供。厨房共用设备，菜谱也可能变化，点餐前请务必告知服务员您的过敏情况。",
    notReady: "此菜单尚未准备好。请向服务员询问今日菜单和过敏原信息。",
    language: "语言",
    hideContaining: "隐藏含有以下成分的菜品",
    showOnly: "仅显示标注为以下的菜品",
    showing: (shown, total, hidden) =>
      `显示 ${total} 道菜中的 ${shown} 道。${hidden > 0 ? `${hidden} 道已被筛选隐藏。` : ""}`,
    clearFilters: "清除筛选",
    noMatch: "没有符合筛选条件的菜品。请尝试移除筛选条件，或询问服务员厨房可以如何调整。",
    contains: "含有",
    noMajorAllergens: (n) => `未标注 ${n} 种主要过敏原中的任何一种`,
    uncheckedHidden: (count, list) =>
      `${count} 道菜尚未检查是否含有${list}，因此已隐藏。请询问服务员。`,
    kitchenNote: "厨房备注：",
    translating: "正在翻译菜单…",
    translationFailed: "暂时无法翻译，菜单以原语言显示。",
    translatedNote: "菜品描述为自动翻译。如有不清楚之处，请询问服务员。",
    allergens: {
      milk: "牛奶",
      eggs: "鸡蛋",
      fish: "鱼",
      shellfish: "贝类海鲜",
      "tree nuts": "坚果",
      peanuts: "花生",
      wheat: "小麦",
      soy: "大豆",
      sesame: "芝麻",
      celery: "芹菜",
      mustard: "芥末",
      lupin: "羽扇豆",
      mollusks: "软体动物",
      sulfites: "亚硫酸盐",
    },
    tags: {
      vegan: "纯素",
      vegetarian: "素食",
      "gluten-free": "无麸质",
      halal: "清真",
      kosher: "犹太洁食",
      "pregnancy-friendly": "适合孕妇",
      "kid-friendly": "适合儿童",
    },
  },
  ko: {
    searchPlaceholder: "요리 또는 재료 검색",
    filtersButton: "알레르기 및 식단",
    showDishes: (n) => `요리 ${n}개 보기`,
    dishCount: (n) => `요리 ${n}개`,
    noSearchMatch: (q) => `“${q}”와(과) 일치하는 요리가 없습니다.`,
    clearSearch: "검색 지우기",
    helperPitch: "일행 정보를 알려 주시면 필터에 맞는 요리를 추천해 드려요.",
    avoidPill: (a) => `${a} 제외`,
    removeFilter: (label) => `${label} 해제`,
    otherDishes: "다른 요리",
    sectionsLabel: "섹션으로 이동",
    soldOut: "오늘 품절",
    special: "스페셜",
    specials: "스페셜 메뉴",
    servedBetween: (from, until) => `${from}–${until} 제공`,
    notServedNow: "지금은 제공되지 않음",
    call: "전화하기",
    website: "웹사이트",
    reserve: "예약하기",
    sizes: "사이즈",
    addons: "추가 옵션",
    chooseOptions: "옵션 선택",
    addToOrder: "주문에 추가",
    inOrder: (n) => `주문에 ${n}개`,
    addonBlocked: "피하는 알레르기 성분이 들어 있음",
    menuUpdated:
      "식당에서 메뉴를 업데이트했습니다. 주문과 도우미 결과가 초기화되었습니다. 주문 전에 현재 메뉴를 확인하세요.",
    refreshFailed:
      "메뉴 업데이트를 확인할 수 없습니다. 직원에게 현재 요리와 알레르기 유발 성분을 확인하세요.",
    offlineMenu:
      "오프라인 메뉴 사본입니다. 요리와 알레르기 정보가 변경되었을 수 있습니다. 현재 메뉴와 알레르기 정보를 직원에게 확인하세요.",
    orderFiltered: "현재 필터에서 제외된 요리는 주문에 포함되지 않습니다.",
    retryTranslation: "번역 다시 시도",
    menuTitle: "메뉴",
    safetyNotice:
      "알레르기 정보는 레스토랑에서 제공합니다. 주방은 조리 기구를 함께 사용하고 레시피가 바뀔 수 있으므로, 주문 전에 반드시 직원에게 알레르기를 알려 주세요.",
    notReady:
      "메뉴가 아직 준비되지 않았습니다. 오늘의 메뉴와 알레르기 정보는 직원에게 문의해 주세요.",
    language: "언어",
    hideContaining: "다음 성분이 들어간 요리 숨기기",
    showOnly: "다음으로 표시된 요리만 보기",
    showing: (shown, total, hidden) =>
      `전체 ${total}개 중 ${shown}개 요리 표시 중.${hidden > 0 ? ` ${hidden}개는 필터로 숨겨졌습니다.` : ""}`,
    clearFilters: "필터 지우기",
    noMatch:
      "필터에 맞는 요리가 없습니다. 필터를 하나 해제하거나, 주방에서 조정 가능한지 직원에게 문의해 주세요.",
    contains: "포함",
    noMajorAllergens: (n) => `${n}대 주요 알레르기 유발 성분 표시 없음`,
    uncheckedHidden: (count, list) =>
      `요리 ${count}개는 아직 ${list} 확인이 되지 않아 숨겨졌습니다. 직원에게 문의하세요.`,
    kitchenNote: "주방 메모:",
    translating: "메뉴 번역 중…",
    translationFailed: "지금은 번역을 사용할 수 없어 원래 언어로 메뉴를 표시합니다.",
    translatedNote: "요리 설명은 자동 번역되었습니다. 궁금한 점은 직원에게 문의해 주세요.",
    allergens: {
      milk: "우유",
      eggs: "달걀",
      fish: "생선",
      shellfish: "갑각류·조개류",
      "tree nuts": "견과류",
      peanuts: "땅콩",
      wheat: "밀",
      soy: "대두",
      sesame: "참깨",
      celery: "셀러리",
      mustard: "겨자",
      lupin: "루핀",
      mollusks: "연체동물",
      sulfites: "아황산염",
    },
    tags: {
      vegan: "비건",
      vegetarian: "채식",
      "gluten-free": "글루텐 프리",
      halal: "할랄",
      kosher: "코셔",
      "pregnancy-friendly": "임산부 적합",
      "kid-friendly": "어린이 추천",
    },
  },
  ja: {
    searchPlaceholder: "料理や食材を検索",
    filtersButton: "アレルギーと食事制限",
    showDishes: (n) => `${n}品を表示`,
    dishCount: (n) => `${n}品`,
    noSearchMatch: (q) => `「${q}」に一致する料理はありません。`,
    clearSearch: "検索をクリア",
    helperPitch: "テーブルの人数や好みを教えていただくと、フィルターに合う料理をおすすめします。",
    avoidPill: (a) => `${a}なし`,
    removeFilter: (label) => `${label}を解除`,
    otherDishes: "その他の料理",
    sectionsLabel: "セクションへ移動",
    soldOut: "本日完売",
    special: "おすすめ",
    specials: "本日のおすすめ",
    servedBetween: (from, until) => `${from}〜${until} 提供`,
    notServedNow: "現在は提供していません",
    call: "電話する",
    website: "ウェブサイト",
    reserve: "予約する",
    sizes: "サイズ",
    addons: "トッピング",
    chooseOptions: "オプションを選ぶ",
    addToOrder: "注文に追加",
    inOrder: (n) => `注文に${n}点`,
    addonBlocked: "避けているアレルゲンを含みます",
    menuUpdated:
      "メニューが更新されました。注文とアシスタントの結果はクリアされました。注文前に現在の料理を確認してください。",
    refreshFailed:
      "メニューの更新を確認できません。現在の料理とアレルゲンをスタッフに確認してください。",
    offlineMenu:
      "オフラインのメニューです。料理やアレルゲン情報が変更されている可能性があります。最新の情報をスタッフに確認してください。",
    orderFiltered: "現在の絞り込み条件で除外された料理は注文に含まれません。",
    retryTranslation: "翻訳を再試行",
    menuTitle: "メニュー",
    safetyNotice:
      "アレルゲン情報はレストランが提供しています。厨房では調理器具を共用しており、レシピが変わることもあるため、ご注文前に必ずスタッフにアレルギーをお伝えください。",
    notReady:
      "このメニューはまだ準備中です。本日のメニューとアレルゲン情報はスタッフにお尋ねください。",
    language: "言語",
    hideContaining: "次を含む料理を非表示",
    showOnly: "次の表示がある料理のみ表示",
    showing: (shown, total, hidden) =>
      `${total}品中${shown}品を表示中。${hidden > 0 ? `${hidden}品はフィルターで非表示です。` : ""}`,
    clearFilters: "フィルターをクリア",
    noMatch:
      "条件に合う料理がありません。フィルターを外すか、対応できるかスタッフにお尋ねください。",
    contains: "含む",
    noMajorAllergens: (n) => `主要アレルゲン${n}品目の表示なし`,
    uncheckedHidden: (count, list) =>
      `${count}品は${list}の確認がまだのため非表示です。スタッフにお尋ねください。`,
    kitchenNote: "厨房メモ：",
    translating: "メニューを翻訳中…",
    translationFailed: "現在翻訳を利用できないため、元の言語でメニューを表示しています。",
    translatedNote: "料理の説明は自動翻訳です。不明な点はスタッフにお尋ねください。",
    allergens: {
      milk: "乳",
      eggs: "卵",
      fish: "魚",
      shellfish: "甲殻類・貝類",
      "tree nuts": "ナッツ類",
      peanuts: "ピーナッツ",
      wheat: "小麦",
      soy: "大豆",
      sesame: "ごま",
      celery: "セロリ",
      mustard: "マスタード",
      lupin: "ルピナス",
      mollusks: "軟体動物",
      sulfites: "亜硫酸塩",
    },
    tags: {
      vegan: "ヴィーガン",
      vegetarian: "ベジタリアン",
      "gluten-free": "グルテンフリー",
      halal: "ハラール",
      kosher: "コーシャ",
      "pregnancy-friendly": "妊娠中の方向け",
      "kid-friendly": "お子さま向け",
    },
  },
  fr: {
    searchPlaceholder: "Rechercher un plat ou un ingrédient",
    filtersButton: "Allergies et régime",
    showDishes: (n) => (n === 1 ? "Voir 1 plat" : `Voir ${n} plats`),
    dishCount: (n) => (n === 1 ? "1 plat" : `${n} plats`),
    noSearchMatch: (q) => `Aucun plat ne correspond à « ${q} ».`,
    clearSearch: "Effacer la recherche",
    helperPitch:
      "Parlez de votre table à Carte et recevez des suggestions qui respectent vos filtres.",
    avoidPill: (a) => `Sans ${a}`,
    removeFilter: (label) => `Retirer ${label}`,
    otherDishes: "Autres plats",
    sectionsLabel: "Aller à une section",
    soldOut: "Épuisé aujourd’hui",
    special: "Spécialité",
    specials: "Spécialités",
    servedBetween: (from, until) => `Servi de ${from} à ${until}`,
    notServedNow: "Pas servi en ce moment",
    call: "Appeler",
    website: "Site web",
    reserve: "Réserver une table",
    sizes: "Tailles",
    addons: "Suppléments",
    chooseOptions: "Choisir les options",
    addToOrder: "Ajouter à la commande",
    inOrder: (n) => `${n} dans votre commande`,
    addonBlocked: "Contient un allergène que vous évitez",
    menuUpdated:
      "Le restaurant a mis à jour le menu. Votre commande et les résultats de l’assistant ont été effacés. Vérifiez les plats avant de commander.",
    refreshFailed:
      "Impossible de vérifier les mises à jour. Confirmez les plats et allergènes auprès du personnel.",
    offlineMenu:
      "Copie hors ligne du menu : les plats et les allergènes peuvent avoir changé. Confirmez les informations actuelles avec le personnel.",
    orderFiltered:
      "Les plats exclus par vos filtres actuels ne sont pas inclus dans votre commande.",
    retryTranslation: "Réessayer la traduction",
    menuTitle: "Menu",
    safetyNotice:
      "Les informations sur les allergènes sont fournies par le restaurant. Les cuisines partagent du matériel et les recettes changent : signalez toujours vos allergies au serveur avant de commander.",
    notReady:
      "Ce menu n'est pas encore prêt. Demandez au serveur le menu du jour et les informations sur les allergènes.",
    language: "Langue",
    hideContaining: "Masquer les plats contenant",
    showOnly: "Afficher uniquement les plats",
    showing: (shown, total, hidden) =>
      `Plats affichés : ${shown} sur ${total}.${hidden > 0 ? ` Masqués par vos filtres : ${hidden}.` : ""}`,
    clearFilters: "Effacer les filtres",
    noMatch:
      "Aucun plat ne correspond à vos filtres. Retirez-en un ou demandez au serveur ce que la cuisine peut adapter.",
    contains: "Contient",
    noMajorAllergens: (n) => `Aucun des ${n} allergènes majeurs n’est indiqué`,
    uncheckedHidden: (count, list) =>
      count === 1
        ? `1 plat n’a pas encore été vérifié pour : ${list}. Il est masqué. Demandez au serveur.`
        : `${count} plats n’ont pas encore été vérifiés pour : ${list}. Ils sont masqués. Demandez au serveur.`,
    kitchenNote: "Note de la cuisine :",
    translating: "Traduction du menu…",
    translationFailed:
      "La traduction n'est pas disponible pour le moment ; le menu est affiché dans sa langue d'origine.",
    translatedNote:
      "Les descriptions ont été traduites automatiquement. Demandez au serveur si quelque chose n'est pas clair.",
    allergens: {
      milk: "lait",
      eggs: "œufs",
      fish: "poisson",
      shellfish: "fruits de mer",
      "tree nuts": "fruits à coque",
      peanuts: "arachides",
      wheat: "blé",
      soy: "soja",
      sesame: "sésame",
      celery: "céleri",
      mustard: "moutarde",
      lupin: "lupin",
      mollusks: "mollusques",
      sulfites: "sulfites",
    },
    tags: {
      vegan: "végan",
      vegetarian: "végétarien",
      "gluten-free": "sans gluten",
      halal: "halal",
      kosher: "casher",
      "pregnancy-friendly": "adapté à la grossesse",
      "kid-friendly": "pour enfants",
    },
  },
  vi: {
    searchPlaceholder: "Tìm món hoặc nguyên liệu",
    filtersButton: "Dị ứng và chế độ ăn",
    showDishes: (n) => `Xem ${n} món`,
    dishCount: (n) => `${n} món`,
    noSearchMatch: (q) => `Không có món nào khớp với “${q}”.`,
    clearSearch: "Xóa tìm kiếm",
    helperPitch: "Hãy cho Carte biết về bàn của bạn để nhận gợi ý phù hợp với bộ lọc.",
    avoidPill: (a) => `Không ${a}`,
    removeFilter: (label) => `Bỏ ${label}`,
    otherDishes: "Món khác",
    sectionsLabel: "Chuyển đến mục",
    soldOut: "Hôm nay hết món",
    special: "Món đặc biệt",
    specials: "Món đặc biệt",
    servedBetween: (from, until) => `Phục vụ ${from}–${until}`,
    notServedNow: "Hiện không phục vụ",
    call: "Gọi điện",
    website: "Trang web",
    reserve: "Đặt bàn",
    sizes: "Cỡ",
    addons: "Món thêm",
    chooseOptions: "Chọn tùy chọn",
    addToOrder: "Thêm vào đơn",
    inOrder: (n) => `${n} trong đơn của bạn`,
    addonBlocked: "Có chất gây dị ứng bạn tránh",
    menuUpdated:
      "Nhà hàng đã cập nhật thực đơn. Đơn món và kết quả trợ lý đã được xóa; hãy xem lại trước khi gọi món.",
    refreshFailed:
      "Không thể kiểm tra cập nhật. Hãy xác nhận món và chất gây dị ứng với nhân viên.",
    offlineMenu:
      "Bản sao thực đơn ngoại tuyến: món ăn và thông tin dị ứng có thể đã thay đổi. Hãy xác nhận thực đơn và chất gây dị ứng hiện tại với nhân viên.",
    orderFiltered: "Các món bị bộ lọc hiện tại loại trừ sẽ không được tính vào đơn gọi món.",
    retryTranslation: "Thử dịch lại",
    menuTitle: "Thực đơn",
    safetyNotice:
      "Thông tin về chất gây dị ứng do nhà hàng cung cấp. Bếp dùng chung dụng cụ và công thức có thể thay đổi, vì vậy hãy luôn báo cho nhân viên phục vụ về dị ứng của bạn trước khi gọi món.",
    notReady:
      "Thực đơn này chưa sẵn sàng. Hãy hỏi nhân viên phục vụ về thực đơn hôm nay và thông tin dị ứng.",
    language: "Ngôn ngữ",
    hideContaining: "Ẩn món có chứa",
    showOnly: "Chỉ hiện món được đánh dấu",
    showing: (shown, total, hidden) =>
      `Đang hiện ${shown} trên ${total} món.${hidden > 0 ? ` ${hidden} món bị ẩn theo bộ lọc.` : ""}`,
    clearFilters: "Xóa bộ lọc",
    noMatch:
      "Không có món nào phù hợp với bộ lọc. Hãy bỏ bớt một bộ lọc, hoặc hỏi nhân viên phục vụ xem bếp có thể điều chỉnh gì.",
    contains: "Chứa",
    noMajorAllergens: (n) => `Không ghi nhận chất nào trong ${n} chất gây dị ứng chính`,
    uncheckedHidden: (count, list) =>
      `${count} món chưa được kiểm tra về ${list} nên đã bị ẩn. Hãy hỏi nhân viên phục vụ.`,
    kitchenNote: "Ghi chú của bếp:",
    translating: "Đang dịch thực đơn…",
    translationFailed: "Hiện không thể dịch, nên thực đơn được hiển thị bằng ngôn ngữ gốc.",
    translatedNote: "Mô tả món ăn được dịch tự động. Hãy hỏi nhân viên phục vụ nếu có gì chưa rõ.",
    allergens: {
      milk: "sữa",
      eggs: "trứng",
      fish: "cá",
      shellfish: "động vật có vỏ",
      "tree nuts": "hạt cây",
      peanuts: "đậu phộng",
      wheat: "lúa mì",
      soy: "đậu nành",
      sesame: "mè",
      celery: "cần tây",
      mustard: "mù tạt",
      lupin: "đậu lupin",
      mollusks: "động vật thân mềm",
      sulfites: "sulfit",
    },
    tags: {
      vegan: "thuần chay",
      vegetarian: "chay",
      "gluten-free": "không chứa gluten",
      halal: "halal",
      kosher: "kosher",
      "pregnancy-friendly": "phù hợp cho bà bầu",
      "kid-friendly": "phù hợp cho trẻ em",
    },
  },
};
