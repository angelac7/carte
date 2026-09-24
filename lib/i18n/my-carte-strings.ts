import type { LanguageCode } from "@/lib/languages";
import type { ChallengeId } from "@/lib/my-carte";

// TODO: have a native speaker review each language before launch.

export type MyCarteStrings = {
  myCarte: string;
  shareFailed: string;
  storageFailed: string;
  intro: string;
  offlineNote: string;
  tabSaved: string;
  tabDiary: string;
  tabTaste: string;
  tabChallenges: string;
  tabCard: string;
  savedDishes: string;
  savedRestaurants: string;
  emptySaved: string;
  emptyDiary: string;
  viewMenu: string;
  remove: string;
  save: string;
  saved: string;
  saveMenu: string;
  menuSaved: string;
  tried: string;
  triedRating: (rating: number) => string;
  rateTitle: string;
  stars: (count: number) => string;
  note: string;
  notePlaceholder: string;
  saveEntry: string;
  removeEntry: string;
  tasteIntro: string;
  tasteButton: string;
  tasteNeedMore: string;
  tasteLoading: string;
  tasteFailed: string;
  loves: string;
  tryNext: string;
  share: string;
  copied: string;
  completed: string;
  challengeNames: Record<ChallengeId, string>;
  challengeGoals: Record<ChallengeId, string>;
  clearAll: string;
  clearConfirm: string;
  similarTitle: string;
  cardIntro: string;
  openCard: string;
};

export const MY_CARTE_STRINGS: Record<LanguageCode, MyCarteStrings> = {
  en: {
    shareFailed: "Could not share or copy. Try again or copy the text manually.",
    storageFailed:
      "Could not save on this device. Free up storage or allow site storage, then try again.",
    myCarte: "My Carte",
    intro:
      "Your saved dishes, food diary, and taste profile, stored on this phone. No account needed.",
    offlineNote: "Menus you've opened and your allergy card also work offline on this phone.",
    tabSaved: "Saved",
    tabDiary: "Food diary",
    tabTaste: "Taste profile",
    tabChallenges: "Challenges",
    tabCard: "Allergy card",
    savedDishes: "Dishes",
    savedRestaurants: "Restaurants",
    emptySaved: "Nothing saved yet. Tap Save on any dish or menu.",
    emptyDiary: "Tap Tried it on any dish to start your food diary.",
    viewMenu: "View menu",
    remove: "Remove",
    save: "Save",
    saved: "Saved",
    saveMenu: "Save this menu",
    menuSaved: "Menu saved",
    tried: "Tried it",
    triedRating: (rating) => `Tried: ${rating}/5`,
    rateTitle: "How was it?",
    stars: (count) => `${count} out of 5`,
    note: "Note",
    notePlaceholder: "What did you think?",
    saveEntry: "Save to diary",
    removeEntry: "Remove from diary",
    tasteIntro: "A friendly summary of what you like, based on the dishes you've rated and saved.",
    tasteButton: "Create my taste profile",
    tasteNeedMore: "Rate at least 3 dishes to create your taste profile.",
    tasteLoading: "Thinking about your tastes…",
    tasteFailed: "Your taste profile isn't available right now.",
    loves: "You love",
    tryNext: "Try next",
    share: "Share",
    copied: "Copied",
    completed: "Completed",
    challengeNames: {
      "first-bite": "First bite",
      critic: "Critic",
      regular: "Regular",
      explorer: "Explorer",
      globetrotter: "Globetrotter",
      "menu-master": "Menu master",
    },
    challengeGoals: {
      "first-bite": "Log your first dish",
      critic: "Rate 10 dishes",
      regular: "Try 5 dishes at one restaurant",
      explorer: "Try dishes at 3 restaurants",
      globetrotter: "Try 5 cuisines this month",
      "menu-master": "Try every dish on a menu",
    },
    clearAll: "Clear everything on this phone",
    clearConfirm: "Delete all saved dishes, restaurants, and diary entries from this phone?",
    similarTitle: "Similar to what you like",
    cardIntro: "Your allergy card, ready to show staff, even without internet.",
    openCard: "Open allergy card",
  },
  es: {
    shareFailed: "No se pudo compartir ni copiar. Inténtalo de nuevo o copia el texto manualmente.",
    storageFailed:
      "No se pudo guardar en este dispositivo. Libere espacio o permita el almacenamiento del sitio e inténtelo de nuevo.",
    myCarte: "Mi Carte",
    intro:
      "Sus platos guardados, su diario de comidas y su perfil de sabores, guardados en este teléfono. No necesita cuenta.",
    offlineNote:
      "Los menús que ha abierto y su tarjeta de alergias también funcionan sin conexión en este teléfono.",
    tabSaved: "Guardados",
    tabDiary: "Diario",
    tabTaste: "Perfil de sabores",
    tabChallenges: "Retos",
    tabCard: "Tarjeta de alergias",
    savedDishes: "Platos",
    savedRestaurants: "Restaurantes",
    emptySaved: "Aún no ha guardado nada. Toque Guardar en cualquier plato o menú.",
    emptyDiary: "Toque Lo probé en cualquier plato para empezar su diario.",
    viewMenu: "Ver menú",
    remove: "Quitar",
    save: "Guardar",
    saved: "Guardado",
    saveMenu: "Guardar este menú",
    menuSaved: "Menú guardado",
    tried: "Lo probé",
    triedRating: (rating) => `Probado: ${rating}/5`,
    rateTitle: "¿Qué tal estuvo?",
    stars: (count) => `${count} de 5`,
    note: "Nota",
    notePlaceholder: "¿Qué le pareció?",
    saveEntry: "Guardar en el diario",
    removeEntry: "Quitar del diario",
    tasteIntro:
      "Un resumen amigable de lo que le gusta, según los platos que ha calificado y guardado.",
    tasteButton: "Crear mi perfil de sabores",
    tasteNeedMore: "Califique al menos 3 platos para crear su perfil de sabores.",
    tasteLoading: "Pensando en sus gustos…",
    tasteFailed: "Su perfil de sabores no está disponible en este momento.",
    loves: "Le encanta",
    tryNext: "Pruebe después",
    share: "Compartir",
    copied: "Copiado",
    completed: "Completado",
    challengeNames: {
      "first-bite": "Primer bocado",
      critic: "Crítico",
      regular: "Cliente fiel",
      explorer: "Explorador",
      globetrotter: "Trotamundos",
      "menu-master": "Maestro del menú",
    },
    challengeGoals: {
      "first-bite": "Registre su primer plato",
      critic: "Califique 10 platos",
      regular: "Pruebe 5 platos en un mismo restaurante",
      explorer: "Pruebe platos en 3 restaurantes",
      globetrotter: "Pruebe 5 cocinas este mes",
      "menu-master": "Pruebe todos los platos de un menú",
    },
    clearAll: "Borrar todo en este teléfono",
    clearConfirm:
      "¿Eliminar todos los platos, restaurantes y entradas del diario de este teléfono?",
    similarTitle: "Parecido a lo que le gusta",
    cardIntro: "Su tarjeta de alergias, lista para mostrar al personal, incluso sin internet.",
    openCard: "Abrir tarjeta de alergias",
  },
  zh: {
    shareFailed: "无法分享或复制。请重试或手动复制文字。",
    storageFailed: "无法在此设备上保存。请释放存储空间或允许网站存储，然后重试。",
    myCarte: "我的 Carte",
    intro: "您收藏的菜品、美食日记和口味档案，都保存在这部手机上，无需注册。",
    offlineNote: "您打开过的菜单和过敏卡在这部手机上也可离线使用。",
    tabSaved: "收藏",
    tabDiary: "美食日记",
    tabTaste: "口味档案",
    tabChallenges: "挑战",
    tabCard: "过敏卡",
    savedDishes: "菜品",
    savedRestaurants: "餐厅",
    emptySaved: "还没有收藏。点击任意菜品或菜单上的「收藏」。",
    emptyDiary: "点击任意菜品上的「吃过了」开始记录美食日记。",
    viewMenu: "查看菜单",
    remove: "移除",
    save: "收藏",
    saved: "已收藏",
    saveMenu: "收藏此菜单",
    menuSaved: "已收藏菜单",
    tried: "吃过了",
    triedRating: (rating) => `已尝试：${rating}/5`,
    rateTitle: "味道如何？",
    stars: (count) => `${count} 分（满分 5 分）`,
    note: "备注",
    notePlaceholder: "您觉得怎么样？",
    saveEntry: "保存到日记",
    removeEntry: "从日记中移除",
    tasteIntro: "根据您评分和收藏的菜品，生成一份轻松的口味总结。",
    tasteButton: "生成我的口味档案",
    tasteNeedMore: "至少为 3 道菜评分后即可生成口味档案。",
    tasteLoading: "正在分析您的口味…",
    tasteFailed: "暂时无法生成口味档案。",
    loves: "您喜欢",
    tryNext: "下次试试",
    share: "分享",
    copied: "已复制",
    completed: "已完成",
    challengeNames: {
      "first-bite": "第一口",
      critic: "美食评论家",
      regular: "常客",
      explorer: "探索者",
      globetrotter: "环球食客",
      "menu-master": "菜单大师",
    },
    challengeGoals: {
      "first-bite": "记录第一道菜",
      critic: "为 10 道菜评分",
      regular: "在同一家餐厅尝试 5 道菜",
      explorer: "在 3 家餐厅尝试菜品",
      globetrotter: "本月尝试 5 种菜系",
      "menu-master": "尝遍一份菜单上的所有菜品",
    },
    clearAll: "清除这部手机上的所有内容",
    clearConfirm: "确定要删除这部手机上所有收藏的菜品、餐厅和日记吗？",
    similarTitle: "与您喜欢的相似",
    cardIntro: "您的过敏卡，随时可出示给员工，无网络也能使用。",
    openCard: "打开过敏卡",
  },
  ko: {
    shareFailed: "공유하거나 복사하지 못했습니다. 다시 시도하거나 텍스트를 직접 복사하세요.",
    storageFailed:
      "이 기기에 저장하지 못했습니다. 저장 공간을 확보하거나 사이트 저장을 허용한 후 다시 시도하세요.",
    myCarte: "마이 Carte",
    intro: "저장한 요리, 음식 일기, 입맛 프로필이 이 휴대폰에 저장됩니다. 계정이 필요 없습니다.",
    offlineNote: "열어 본 메뉴와 알레르기 카드는 이 휴대폰에서 오프라인으로도 사용할 수 있습니다.",
    tabSaved: "저장함",
    tabDiary: "음식 일기",
    tabTaste: "입맛 프로필",
    tabChallenges: "도전 과제",
    tabCard: "알레르기 카드",
    savedDishes: "요리",
    savedRestaurants: "레스토랑",
    emptySaved: "아직 저장한 것이 없습니다. 요리나 메뉴에서 '저장'을 눌러 보세요.",
    emptyDiary: "요리에서 '먹어 봤어요'를 눌러 음식 일기를 시작하세요.",
    viewMenu: "메뉴 보기",
    remove: "삭제",
    save: "저장",
    saved: "저장됨",
    saveMenu: "이 메뉴 저장",
    menuSaved: "메뉴 저장됨",
    tried: "먹어 봤어요",
    triedRating: (rating) => `먹어 봄: ${rating}/5`,
    rateTitle: "어땠나요?",
    stars: (count) => `5점 중 ${count}점`,
    note: "메모",
    notePlaceholder: "어떠셨나요?",
    saveEntry: "일기에 저장",
    removeEntry: "일기에서 삭제",
    tasteIntro: "평가하고 저장한 요리를 바탕으로 입맛을 친근하게 요약해 드립니다.",
    tasteButton: "내 입맛 프로필 만들기",
    tasteNeedMore: "입맛 프로필을 만들려면 요리를 3개 이상 평가해 주세요.",
    tasteLoading: "입맛을 분석하는 중…",
    tasteFailed: "지금은 입맛 프로필을 만들 수 없습니다.",
    loves: "좋아하는 것",
    tryNext: "다음에 먹어 볼 것",
    share: "공유",
    copied: "복사됨",
    completed: "완료",
    challengeNames: {
      "first-bite": "첫 한 입",
      critic: "미식 평론가",
      regular: "단골",
      explorer: "탐험가",
      globetrotter: "세계 미식가",
      "menu-master": "메뉴 마스터",
    },
    challengeGoals: {
      "first-bite": "첫 요리 기록하기",
      critic: "요리 10개 평가하기",
      regular: "한 레스토랑에서 요리 5개 먹어 보기",
      explorer: "레스토랑 3곳에서 요리 먹어 보기",
      globetrotter: "이번 달 5가지 요리 종류 먹어 보기",
      "menu-master": "한 메뉴의 모든 요리 먹어 보기",
    },
    clearAll: "이 휴대폰의 모든 기록 지우기",
    clearConfirm: "이 휴대폰에 저장된 요리, 레스토랑, 일기를 모두 삭제할까요?",
    similarTitle: "좋아하실 만한 비슷한 요리",
    cardIntro: "인터넷이 없어도 언제든 직원에게 보여줄 수 있는 알레르기 카드입니다.",
    openCard: "알레르기 카드 열기",
  },
  ja: {
    shareFailed:
      "共有またはコピーできませんでした。再試行するか、テキストを手動でコピーしてください。",
    storageFailed:
      "この端末に保存できませんでした。空き容量を増やすかサイトの保存を許可して、再試行してください。",
    myCarte: "マイ Carte",
    intro:
      "保存した料理、食事日記、味の好みプロフィールはこのスマートフォンに保存されます。アカウントは不要です。",
    offlineNote: "開いたメニューとアレルギーカードは、このスマートフォンでオフラインでも使えます。",
    tabSaved: "保存済み",
    tabDiary: "食事日記",
    tabTaste: "味の好み",
    tabChallenges: "チャレンジ",
    tabCard: "アレルギーカード",
    savedDishes: "料理",
    savedRestaurants: "レストラン",
    emptySaved: "まだ何も保存していません。料理やメニューの「保存」を押してください。",
    emptyDiary: "料理の「食べた」を押して食事日記を始めましょう。",
    viewMenu: "メニューを見る",
    remove: "削除",
    save: "保存",
    saved: "保存済み",
    saveMenu: "このメニューを保存",
    menuSaved: "メニューを保存しました",
    tried: "食べた",
    triedRating: (rating) => `食べた：${rating}/5`,
    rateTitle: "いかがでしたか？",
    stars: (count) => `5段階中${count}`,
    note: "メモ",
    notePlaceholder: "感想を書きましょう",
    saveEntry: "日記に保存",
    removeEntry: "日記から削除",
    tasteIntro: "評価・保存した料理をもとに、あなたの好みを楽しくまとめます。",
    tasteButton: "味の好みプロフィールを作る",
    tasteNeedMore: "3品以上評価すると、味の好みプロフィールを作れます。",
    tasteLoading: "好みを分析中…",
    tasteFailed: "現在、味の好みプロフィールを作成できません。",
    loves: "好きなもの",
    tryNext: "次に試すなら",
    share: "共有",
    copied: "コピーしました",
    completed: "達成",
    challengeNames: {
      "first-bite": "ひと口目",
      critic: "グルメ評論家",
      regular: "常連",
      explorer: "探検家",
      globetrotter: "世界の食通",
      "menu-master": "メニューマスター",
    },
    challengeGoals: {
      "first-bite": "最初の料理を記録する",
      critic: "10品を評価する",
      regular: "1軒で5品食べる",
      explorer: "3軒のレストランで食べる",
      globetrotter: "今月5つの料理ジャンルを食べる",
      "menu-master": "1つのメニューの全品を食べる",
    },
    clearAll: "このスマートフォンの記録をすべて削除",
    clearConfirm: "このスマートフォンに保存した料理、レストラン、日記をすべて削除しますか？",
    similarTitle: "お好みに近い料理",
    cardIntro: "インターネットがなくても、いつでもスタッフに見せられるアレルギーカードです。",
    openCard: "アレルギーカードを開く",
  },
  fr: {
    shareFailed: "Impossible de partager ou de copier. Réessayez ou copiez le texte manuellement.",
    storageFailed:
      "Impossible d’enregistrer sur cet appareil. Libérez de l’espace ou autorisez le stockage du site, puis réessayez.",
    myCarte: "Mon Carte",
    intro:
      "Vos plats enregistrés, votre journal culinaire et votre profil de goûts, stockés sur ce téléphone. Aucun compte nécessaire.",
    offlineNote:
      "Les menus que vous avez ouverts et votre carte d'allergies fonctionnent aussi hors ligne sur ce téléphone.",
    tabSaved: "Enregistrés",
    tabDiary: "Journal",
    tabTaste: "Profil de goûts",
    tabChallenges: "Défis",
    tabCard: "Carte d'allergies",
    savedDishes: "Plats",
    savedRestaurants: "Restaurants",
    emptySaved: "Rien d'enregistré pour l'instant. Touchez Enregistrer sur un plat ou un menu.",
    emptyDiary: "Touchez Goûté sur un plat pour commencer votre journal.",
    viewMenu: "Voir le menu",
    remove: "Retirer",
    save: "Enregistrer",
    saved: "Enregistré",
    saveMenu: "Enregistrer ce menu",
    menuSaved: "Menu enregistré",
    tried: "Goûté",
    triedRating: (rating) => `Goûté : ${rating}/5`,
    rateTitle: "C'était comment ?",
    stars: (count) => `${count} sur 5`,
    note: "Note",
    notePlaceholder: "Qu'en avez-vous pensé ?",
    saveEntry: "Enregistrer dans le journal",
    removeEntry: "Retirer du journal",
    tasteIntro:
      "Un résumé sympathique de ce que vous aimez, d'après les plats que vous avez notés et enregistrés.",
    tasteButton: "Créer mon profil de goûts",
    tasteNeedMore: "Notez au moins 3 plats pour créer votre profil de goûts.",
    tasteLoading: "Analyse de vos goûts…",
    tasteFailed: "Votre profil de goûts n'est pas disponible pour le moment.",
    loves: "Vous adorez",
    tryNext: "À essayer",
    share: "Partager",
    copied: "Copié",
    completed: "Terminé",
    challengeNames: {
      "first-bite": "Première bouchée",
      critic: "Critique",
      regular: "Habitué",
      explorer: "Explorateur",
      globetrotter: "Globe-trotteur",
      "menu-master": "Maître du menu",
    },
    challengeGoals: {
      "first-bite": "Notez votre premier plat",
      critic: "Notez 10 plats",
      regular: "Goûtez 5 plats dans un même restaurant",
      explorer: "Goûtez des plats dans 3 restaurants",
      globetrotter: "Goûtez 5 cuisines ce mois-ci",
      "menu-master": "Goûtez tous les plats d'un menu",
    },
    clearAll: "Tout effacer sur ce téléphone",
    clearConfirm: "Supprimer tous les plats, restaurants et entrées du journal de ce téléphone ?",
    similarTitle: "Proche de ce que vous aimez",
    cardIntro: "Votre carte d'allergies, prête à montrer au personnel, même sans internet.",
    openCard: "Ouvrir la carte d'allergies",
  },
  vi: {
    shareFailed: "Không thể chia sẻ hoặc sao chép. Hãy thử lại hoặc sao chép văn bản thủ công.",
    storageFailed:
      "Không thể lưu trên thiết bị này. Hãy giải phóng dung lượng hoặc cho phép trang web lưu dữ liệu rồi thử lại.",
    myCarte: "Carte của tôi",
    intro:
      "Món đã lưu, nhật ký ăn uống và hồ sơ khẩu vị được lưu trên điện thoại này. Không cần tài khoản.",
    offlineNote:
      "Các thực đơn bạn đã mở và thẻ dị ứng cũng dùng được khi không có mạng trên điện thoại này.",
    tabSaved: "Đã lưu",
    tabDiary: "Nhật ký",
    tabTaste: "Khẩu vị",
    tabChallenges: "Thử thách",
    tabCard: "Thẻ dị ứng",
    savedDishes: "Món ăn",
    savedRestaurants: "Nhà hàng",
    emptySaved: "Chưa lưu gì. Nhấn Lưu ở món hoặc thực đơn bất kỳ.",
    emptyDiary: "Nhấn Đã thử ở món bất kỳ để bắt đầu nhật ký.",
    viewMenu: "Xem thực đơn",
    remove: "Xóa",
    save: "Lưu",
    saved: "Đã lưu",
    saveMenu: "Lưu thực đơn này",
    menuSaved: "Đã lưu thực đơn",
    tried: "Đã thử",
    triedRating: (rating) => `Đã thử: ${rating}/5`,
    rateTitle: "Món này thế nào?",
    stars: (count) => `${count} trên 5`,
    note: "Ghi chú",
    notePlaceholder: "Bạn thấy thế nào?",
    saveEntry: "Lưu vào nhật ký",
    removeEntry: "Xóa khỏi nhật ký",
    tasteIntro:
      "Bản tóm tắt thân thiện về khẩu vị của bạn, dựa trên các món bạn đã chấm điểm và lưu.",
    tasteButton: "Tạo hồ sơ khẩu vị",
    tasteNeedMore: "Hãy chấm điểm ít nhất 3 món để tạo hồ sơ khẩu vị.",
    tasteLoading: "Đang phân tích khẩu vị…",
    tasteFailed: "Hiện không thể tạo hồ sơ khẩu vị.",
    loves: "Bạn thích",
    tryNext: "Nên thử tiếp",
    share: "Chia sẻ",
    copied: "Đã sao chép",
    completed: "Hoàn thành",
    challengeNames: {
      "first-bite": "Miếng đầu tiên",
      critic: "Nhà phê bình",
      regular: "Khách quen",
      explorer: "Nhà thám hiểm",
      globetrotter: "Người sành ăn khắp nơi",
      "menu-master": "Bậc thầy thực đơn",
    },
    challengeGoals: {
      "first-bite": "Ghi lại món đầu tiên",
      critic: "Chấm điểm 10 món",
      regular: "Thử 5 món ở cùng một nhà hàng",
      explorer: "Thử món ở 3 nhà hàng",
      globetrotter: "Thử 5 nền ẩm thực trong tháng này",
      "menu-master": "Thử mọi món trong một thực đơn",
    },
    clearAll: "Xóa mọi thứ trên điện thoại này",
    clearConfirm: "Xóa tất cả món, nhà hàng và nhật ký đã lưu trên điện thoại này?",
    similarTitle: "Giống món bạn thích",
    cardIntro: "Thẻ dị ứng của bạn, sẵn sàng đưa cho nhân viên, kể cả khi không có mạng.",
    openCard: "Mở thẻ dị ứng",
  },
};

export const BACKUP_STRINGS: Record<
  LanguageCode,
  {
    title: string;
    intro: string;
    download: string;
    upload: string;
    merge: string;
    replace: string;
    warning: string;
    restore: string;
    cancel: string;
    invalid: string;
    done: string;
    counts: (d: number, r: number, e: number) => string;
  }
> = {
  en: {
    title: "Backup and restore",
    intro:
      "Download your saved dishes, restaurants, diary and challenge progress. Open the file here on another device to restore it. The file stays with you; keep a private copy.",
    download: "Download backup",
    upload: "Open backup",
    merge: "Merge with this device",
    replace: "Replace this device’s collection",
    warning:
      "Merging keeps existing entries when both copies contain the same dish. Replacing removes this device’s current collection. Allergy preferences are unchanged.",
    restore: "Restore backup",
    cancel: "Cancel",
    invalid:
      "Could not use this backup. Choose a valid Carte file under 2 MB. Merged collections must have at most 200 entries of each kind.",
    done: "Backup restored.",
    counts: (d, r, e) => `${d} saved dishes · ${r} restaurants · ${e} diary entries`,
  },
  es: {
    title: "Copia de seguridad",
    intro:
      "Descarga tus platos, restaurantes, diario y retos. Abre el archivo aquí en otro dispositivo para restaurarlos. Guarda una copia privada.",
    download: "Descargar copia",
    upload: "Abrir copia",
    merge: "Combinar con este dispositivo",
    replace: "Reemplazar la colección",
    warning:
      "Al combinar se conservan las entradas existentes. Reemplazar elimina la colección actual. Las preferencias de alergias no cambian.",
    restore: "Restaurar copia",
    cancel: "Cancelar",
    invalid:
      "Elige una copia de Carte válida de menos de 2 MB. Máximo 200 entradas de cada tipo al combinar.",
    done: "Copia restaurada.",
    counts: (d, r, e) => `${d} platos · ${r} restaurantes · ${e} entradas`,
  },
  zh: {
    title: "备份与恢复",
    intro:
      "下载收藏的菜品、餐厅、日记和挑战进度。在另一台设备上打开此文件即可恢复。请妥善保管私人副本。",
    download: "下载备份",
    upload: "打开备份",
    merge: "与此设备合并",
    replace: "替换此设备的收藏",
    warning: "合并时保留现有的重复条目。替换会删除当前收藏。过敏偏好保持不变。",
    restore: "恢复备份",
    cancel: "取消",
    invalid: "请选择小于2 MB的有效Carte备份。合并后每类最多200条。",
    done: "备份已恢复。",
    counts: (d, r, e) => `${d} 道菜 · ${r} 家餐厅 · ${e} 条日记`,
  },
  ko: {
    title: "백업 및 복원",
    intro:
      "저장한 요리, 식당, 일기와 도전 진행 상황을 다운로드하세요. 다른 기기에서 이 파일을 열어 복원할 수 있습니다. 개인 사본을 안전하게 보관하세요.",
    download: "백업 다운로드",
    upload: "백업 열기",
    merge: "이 기기와 병합",
    replace: "이 기기의 모음 교체",
    warning:
      "병합 시 기존 중복 항목을 유지합니다. 교체하면 현재 모음이 삭제됩니다. 알레르기 설정은 바뀌지 않습니다.",
    restore: "백업 복원",
    cancel: "취소",
    invalid: "2 MB 미만의 유효한 Carte 백업을 선택하세요. 병합 후 각 종류는 최대 200개입니다.",
    done: "백업을 복원했습니다.",
    counts: (d, r, e) => `요리 ${d}개 · 식당 ${r}곳 · 일기 ${e}개`,
  },
  ja: {
    title: "バックアップと復元",
    intro:
      "保存した料理、レストラン、日記、チャレンジの進捗をダウンロードできます。別の端末でファイルを開いて復元してください。コピーは大切に保管してください。",
    download: "バックアップを保存",
    upload: "バックアップを開く",
    merge: "この端末と統合",
    replace: "この端末のコレクションを置換",
    warning:
      "統合時は既存の重複項目を優先します。置換すると現在のコレクションは削除されます。アレルギー設定は変わりません。",
    restore: "復元する",
    cancel: "キャンセル",
    invalid: "2 MB未満の有効なCarteファイルを選択してください。統合後は各種類200件までです。",
    done: "復元しました。",
    counts: (d, r, e) => `料理${d}件 · レストラン${r}件 · 日記${e}件`,
  },
  fr: {
    title: "Sauvegarde et restauration",
    intro:
      "Téléchargez vos plats, restaurants, journal et défis. Ouvrez le fichier ici sur un autre appareil pour les restaurer. Gardez une copie privée.",
    download: "Télécharger la sauvegarde",
    upload: "Ouvrir une sauvegarde",
    merge: "Fusionner avec cet appareil",
    replace: "Remplacer la collection",
    warning:
      "La fusion conserve les entrées existantes en double. Le remplacement supprime la collection actuelle. Les préférences d’allergies restent inchangées.",
    restore: "Restaurer",
    cancel: "Annuler",
    invalid:
      "Choisissez un fichier Carte valide de moins de 2 Mo. Maximum 200 entrées de chaque type après fusion.",
    done: "Sauvegarde restaurée.",
    counts: (d, r, e) => `${d} plats · ${r} restaurants · ${e} entrées`,
  },
  vi: {
    title: "Sao lưu và khôi phục",
    intro:
      "Tải xuống món ăn, nhà hàng, nhật ký và tiến độ thử thách. Mở tệp này trên thiết bị khác để khôi phục. Hãy giữ một bản sao riêng tư.",
    download: "Tải bản sao lưu",
    upload: "Mở bản sao lưu",
    merge: "Hợp nhất với thiết bị này",
    replace: "Thay thế bộ sưu tập",
    warning:
      "Hợp nhất giữ lại mục hiện có khi trùng lặp. Thay thế sẽ xóa bộ sưu tập hiện tại. Tùy chọn dị ứng không thay đổi.",
    restore: "Khôi phục",
    cancel: "Hủy",
    invalid: "Chọn tệp Carte hợp lệ dưới 2 MB. Sau khi hợp nhất, mỗi loại tối đa 200 mục.",
    done: "Đã khôi phục.",
    counts: (d, r, e) => `${d} món · ${r} nhà hàng · ${e} mục nhật ký`,
  },
};
