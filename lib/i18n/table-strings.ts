import type { Severity } from "@/lib/diner-prefs";
import type { LanguageCode } from "@/lib/languages";

// The allergy statement and request are safety-critical and never AI-generated.
// TODO: have a native speaker review each language before launch.

export type TableStrings = {
  add: string;
  increase: string;
  decrease: string;
  remove: string;
  yourOrder: string;
  empty: string;
  showServer: string;
  splitBill: string;
  clearOrder: string;
  people: string;
  addPerson: string;
  personPlaceholder: string;
  shared: string;
  whoHad: string;
  tax: string;
  tip: string;
  subtotal: string;
  total: string;
  perPerson: string;
  unpriced: string;
  estimate: string;
  back: string;
  close: string;
  allergyCard: string;
  cardTitle: string;
  cardIntro: string;
  chooseAllergies: string;
  noAllergies: string;
  statement: string;
  statementIntolerance: string;
  request: string;
  severeNote: string;
  severityLabel: string;
  severities: Record<Severity, string>;
  forStaff: string;
  orderTogether: string;
  togetherHint: string;
  copyLink: string;
  linkCopied: string;
  shareLink: string;
  togetherOn: string;
  leaveTogether: string;
  togetherEnded: string;
  togetherFailed: string;
};

export const TABLE_STRINGS: Record<LanguageCode, TableStrings> = {
  en: {
    add: "Add",
    increase: "Add one",
    decrease: "Remove one",
    remove: "Remove",
    yourOrder: "Your order",
    empty: "Your order is empty. Tap Add on any dish to start.",
    showServer: "Show to server",
    splitBill: "Split the bill",
    clearOrder: "Clear order",
    people: "Who's eating?",
    addPerson: "Add person",
    personPlaceholder: "Name",
    shared: "Shared",
    whoHad: "Who had this?",
    tax: "Tax",
    tip: "Tip",
    subtotal: "Subtotal",
    total: "Total",
    perPerson: "Each person pays",
    unpriced: "Dishes without a price aren't included in the totals.",
    estimate: "This is an estimate. The restaurant's bill is final.",
    back: "Back",
    close: "Close",
    allergyCard: "My allergy card",
    cardTitle: "Allergy card",
    cardIntro: "Show this card to your server.",
    chooseAllergies: "Choose your allergies",
    noAllergies: "No allergies selected yet.",
    statement: "I have a food allergy to:",
    request:
      "Please make sure my food does not contain these, including in sauces, oils, and garnishes. Please tell me if a dish can't be made without them. Thank you.",
    forStaff: "For restaurant staff",
    orderTogether: "Order together",
    togetherHint:
      "Share this link so everyone at your table can add to one order from their own phone.",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    shareLink: "Share",
    togetherOn: "Shared order: everyone with the link can add dishes.",
    leaveTogether: "Leave shared order",
    togetherEnded: "This shared order has ended, so your order is back on this phone only.",
    togetherFailed: "The shared order couldn't be started. Try again.",
    statementIntolerance: "I have a food intolerance to:",
    severeNote:
      "This allergy is severe: even a trace can make me very ill. Please use clean utensils and surfaces, and check every ingredient.",
    severityLabel: "How serious is it?",
    severities: { allergy: "Allergy", severe: "Severe allergy", intolerance: "Intolerance" },
  },
  es: {
    add: "Agregar",
    increase: "Agregar uno",
    decrease: "Quitar uno",
    remove: "Quitar",
    yourOrder: "Su pedido",
    empty: "Su pedido está vacío. Toque Agregar en cualquier plato para empezar.",
    showServer: "Mostrar al mesero",
    splitBill: "Dividir la cuenta",
    clearOrder: "Vaciar pedido",
    people: "¿Quiénes comen?",
    addPerson: "Agregar persona",
    personPlaceholder: "Nombre",
    shared: "Compartido",
    whoHad: "¿Quién lo pidió?",
    tax: "Impuesto",
    tip: "Propina",
    subtotal: "Subtotal",
    total: "Total",
    perPerson: "Cada persona paga",
    unpriced: "Los platos sin precio no se incluyen en los totales.",
    estimate: "Es una estimación. La cuenta del restaurante es la definitiva.",
    back: "Atrás",
    close: "Cerrar",
    allergyCard: "Mi tarjeta de alergias",
    cardTitle: "Tarjeta de alergias",
    cardIntro: "Muestre esta tarjeta a su mesero.",
    chooseAllergies: "Elija sus alergias",
    noAllergies: "Aún no ha elegido ninguna alergia.",
    statement: "Tengo alergia alimentaria a:",
    request:
      "Por favor, asegúrese de que mi comida no contenga estos ingredientes, incluso en salsas, aceites y guarniciones. Avíseme si algún plato no se puede preparar sin ellos. Gracias.",
    forStaff: "Para el personal del restaurante",
    orderTogether: "Pedir juntos",
    togetherHint:
      "Comparta este enlace para que todos en su mesa agreguen platos a un solo pedido desde su teléfono.",
    copyLink: "Copiar enlace",
    linkCopied: "Enlace copiado",
    shareLink: "Compartir",
    togetherOn: "Pedido compartido: todos los que tengan el enlace pueden agregar platos.",
    leaveTogether: "Salir del pedido compartido",
    togetherEnded: "Este pedido compartido terminó; su pedido ahora está solo en este teléfono.",
    togetherFailed: "No se pudo iniciar el pedido compartido. Inténtelo de nuevo.",
    statementIntolerance: "Tengo intolerancia alimentaria a:",
    severeNote:
      "Esta alergia es grave: incluso una traza puede hacerme enfermar gravemente. Por favor, use utensilios y superficies limpios y revise cada ingrediente.",
    severityLabel: "¿Qué tan grave es?",
    severities: { allergy: "Alergia", severe: "Alergia grave", intolerance: "Intolerancia" },
  },
  zh: {
    add: "加入",
    increase: "加一份",
    decrease: "减一份",
    remove: "移除",
    yourOrder: "我的点单",
    empty: "点单为空。点击任意菜品的「加入」开始点单。",
    showServer: "给服务员看",
    splitBill: "分账",
    clearOrder: "清空点单",
    people: "谁在用餐？",
    addPerson: "添加人员",
    personPlaceholder: "姓名",
    shared: "共享",
    whoHad: "这道菜是谁点的？",
    tax: "税",
    tip: "小费",
    subtotal: "小计",
    total: "合计",
    perPerson: "每人应付",
    unpriced: "没有价格的菜品未计入合计。",
    estimate: "此为估算，以餐厅账单为准。",
    back: "返回",
    close: "关闭",
    allergyCard: "我的过敏卡",
    cardTitle: "过敏卡",
    cardIntro: "请将此卡出示给服务员。",
    chooseAllergies: "选择您的过敏原",
    noAllergies: "尚未选择过敏原。",
    statement: "我对以下食物过敏：",
    request:
      "请确保我的餐点不含这些成分，包括酱汁、油和配菜。如果某道菜无法去除这些成分，请告诉我。谢谢。",
    forStaff: "给餐厅员工",
    orderTogether: "一起点餐",
    togetherHint: "分享此链接，同桌的每个人都能用自己的手机往同一份订单里加菜。",
    copyLink: "复制链接",
    linkCopied: "已复制链接",
    shareLink: "分享",
    togetherOn: "共享订单：有链接的人都可以加菜。",
    leaveTogether: "退出共享订单",
    togetherEnded: "此共享订单已结束，您的订单现在只保存在这部手机上。",
    togetherFailed: "无法开始共享订单，请重试。",
    statementIntolerance: "我对以下食物不耐受：",
    severeNote:
      "我的过敏很严重：即使微量也可能让我病得很重。请使用干净的餐具和台面，并检查每一种配料。",
    severityLabel: "严重程度如何？",
    severities: { allergy: "过敏", severe: "严重过敏", intolerance: "不耐受" },
  },
  ko: {
    add: "담기",
    increase: "하나 추가",
    decrease: "하나 빼기",
    remove: "삭제",
    yourOrder: "내 주문",
    empty: "주문이 비어 있습니다. 요리의 '담기'를 눌러 시작하세요.",
    showServer: "직원에게 보여주기",
    splitBill: "계산 나누기",
    clearOrder: "주문 비우기",
    people: "누가 먹나요?",
    addPerson: "사람 추가",
    personPlaceholder: "이름",
    shared: "같이 먹음",
    whoHad: "누가 주문했나요?",
    tax: "세금",
    tip: "팁",
    subtotal: "소계",
    total: "합계",
    perPerson: "1인당 금액",
    unpriced: "가격이 없는 요리는 합계에 포함되지 않습니다.",
    estimate: "예상 금액입니다. 레스토랑 계산서가 최종 금액입니다.",
    back: "뒤로",
    close: "닫기",
    allergyCard: "내 알레르기 카드",
    cardTitle: "알레르기 카드",
    cardIntro: "이 카드를 직원에게 보여주세요.",
    chooseAllergies: "알레르기를 선택하세요",
    noAllergies: "아직 선택한 알레르기가 없습니다.",
    statement: "저는 다음 식품에 알레르기가 있습니다:",
    request:
      "소스, 기름, 고명을 포함해 제 음식에 이 재료들이 들어가지 않도록 확인해 주세요. 이 재료 없이 만들 수 없는 요리가 있으면 알려 주세요. 감사합니다.",
    forStaff: "레스토랑 직원용",
    orderTogether: "함께 주문하기",
    togetherHint:
      "이 링크를 공유하면 같은 테이블의 모두가 각자 휴대폰으로 하나의 주문에 요리를 추가할 수 있어요.",
    copyLink: "링크 복사",
    linkCopied: "링크를 복사했어요",
    shareLink: "공유",
    togetherOn: "공유 주문: 링크가 있는 사람은 누구나 요리를 추가할 수 있어요.",
    leaveTogether: "공유 주문 나가기",
    togetherEnded: "공유 주문이 종료되어 이제 이 휴대폰에만 주문이 남아 있어요.",
    togetherFailed: "공유 주문을 시작하지 못했어요. 다시 시도해 주세요.",
    statementIntolerance: "저는 다음 식품에 불내증이 있습니다:",
    severeNote:
      "제 알레르기는 심합니다. 아주 적은 양도 심각한 증상을 일으킬 수 있습니다. 깨끗한 조리 도구와 조리대를 사용하고 모든 재료를 확인해 주세요.",
    severityLabel: "얼마나 심한가요?",
    severities: { allergy: "알레르기", severe: "심한 알레르기", intolerance: "불내증" },
  },
  ja: {
    add: "追加",
    increase: "1つ増やす",
    decrease: "1つ減らす",
    remove: "削除",
    yourOrder: "注文リスト",
    empty: "注文リストは空です。料理の「追加」を押して始めましょう。",
    showServer: "スタッフに見せる",
    splitBill: "割り勘",
    clearOrder: "注文をクリア",
    people: "食べる人",
    addPerson: "人を追加",
    personPlaceholder: "名前",
    shared: "シェア",
    whoHad: "誰が注文しましたか？",
    tax: "税",
    tip: "チップ",
    subtotal: "小計",
    total: "合計",
    perPerson: "1人あたり",
    unpriced: "価格のない料理は合計に含まれません。",
    estimate: "これは概算です。レストランの会計が最終金額です。",
    back: "戻る",
    close: "閉じる",
    allergyCard: "アレルギーカード",
    cardTitle: "アレルギーカード",
    cardIntro: "このカードをスタッフにお見せください。",
    chooseAllergies: "アレルギーを選択",
    noAllergies: "アレルギーがまだ選択されていません。",
    statement: "私は次の食品にアレルギーがあります：",
    request:
      "ソース、油、付け合わせを含め、料理にこれらが入らないようにしてください。除去できない料理があれば教えてください。よろしくお願いします。",
    forStaff: "レストランスタッフ向け",
    orderTogether: "みんなで注文",
    togetherHint:
      "このリンクを共有すると、同じテーブルの全員が自分のスマホから一つの注文に料理を追加できます。",
    copyLink: "リンクをコピー",
    linkCopied: "リンクをコピーしました",
    shareLink: "共有",
    togetherOn: "共有注文：リンクを知っている人は誰でも料理を追加できます。",
    leaveTogether: "共有注文をやめる",
    togetherEnded: "共有注文は終了しました。注文はこのスマホだけに残っています。",
    togetherFailed: "共有注文を開始できませんでした。もう一度お試しください。",
    statementIntolerance: "私は次の食品に不耐症があります：",
    severeNote:
      "私のアレルギーは重度です。ごく微量でも重い症状が出ることがあります。清潔な調理器具と調理台を使い、すべての材料を確認してください。",
    severityLabel: "どのくらい重いですか？",
    severities: { allergy: "アレルギー", severe: "重度のアレルギー", intolerance: "不耐症" },
  },
  fr: {
    add: "Ajouter",
    increase: "Ajouter un",
    decrease: "Retirer un",
    remove: "Retirer",
    yourOrder: "Ma commande",
    empty: "Votre commande est vide. Touchez Ajouter sur un plat pour commencer.",
    showServer: "Montrer au serveur",
    splitBill: "Partager l'addition",
    clearOrder: "Vider la commande",
    people: "Qui mange ?",
    addPerson: "Ajouter une personne",
    personPlaceholder: "Nom",
    shared: "Partagé",
    whoHad: "Qui a pris ce plat ?",
    tax: "Taxes",
    tip: "Pourboire",
    subtotal: "Sous-total",
    total: "Total",
    perPerson: "Chaque personne paie",
    unpriced: "Les plats sans prix ne sont pas inclus dans les totaux.",
    estimate: "Ceci est une estimation. L'addition du restaurant fait foi.",
    back: "Retour",
    close: "Fermer",
    allergyCard: "Ma carte d'allergies",
    cardTitle: "Carte d'allergies",
    cardIntro: "Montrez cette carte à votre serveur.",
    chooseAllergies: "Choisissez vos allergies",
    noAllergies: "Aucune allergie sélectionnée pour l'instant.",
    statement: "J'ai une allergie alimentaire à :",
    request:
      "Veuillez vous assurer que mon plat n'en contient pas, y compris dans les sauces, les huiles et les garnitures. Dites-moi si un plat ne peut pas être préparé sans. Merci.",
    forStaff: "Pour le personnel du restaurant",
    orderTogether: "Commander ensemble",
    togetherHint:
      "Partagez ce lien pour que toute la table ajoute des plats à une seule commande depuis son téléphone.",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié",
    shareLink: "Partager",
    togetherOn: "Commande partagée : toute personne ayant le lien peut ajouter des plats.",
    leaveTogether: "Quitter la commande partagée",
    togetherEnded:
      "Cette commande partagée est terminée ; votre commande reste seulement sur ce téléphone.",
    togetherFailed: "La commande partagée n’a pas pu démarrer. Réessayez.",
    statementIntolerance: "J’ai une intolérance alimentaire à :",
    severeNote:
      "Cette allergie est grave : même une trace peut me rendre très malade. Merci d’utiliser des ustensiles et des surfaces propres et de vérifier chaque ingrédient.",
    severityLabel: "Quelle gravité ?",
    severities: { allergy: "Allergie", severe: "Allergie grave", intolerance: "Intolérance" },
  },
  vi: {
    add: "Thêm",
    increase: "Thêm một",
    decrease: "Bớt một",
    remove: "Xóa",
    yourOrder: "Món đã chọn",
    empty: "Bạn chưa chọn món nào. Nhấn Thêm ở món bất kỳ để bắt đầu.",
    showServer: "Cho nhân viên xem",
    splitBill: "Chia hóa đơn",
    clearOrder: "Xóa hết món",
    people: "Ai cùng ăn?",
    addPerson: "Thêm người",
    personPlaceholder: "Tên",
    shared: "Ăn chung",
    whoHad: "Ai gọi món này?",
    tax: "Thuế",
    tip: "Tiền boa",
    subtotal: "Tạm tính",
    total: "Tổng cộng",
    perPerson: "Mỗi người trả",
    unpriced: "Các món không có giá không được tính vào tổng.",
    estimate: "Đây là số tiền ước tính. Hóa đơn của nhà hàng là chính thức.",
    back: "Quay lại",
    close: "Đóng",
    allergyCard: "Thẻ dị ứng của tôi",
    cardTitle: "Thẻ dị ứng",
    cardIntro: "Hãy đưa thẻ này cho nhân viên phục vụ.",
    chooseAllergies: "Chọn chất bạn bị dị ứng",
    noAllergies: "Chưa chọn chất gây dị ứng nào.",
    statement: "Tôi bị dị ứng thực phẩm với:",
    request:
      "Vui lòng đảm bảo món ăn của tôi không chứa các thành phần này, kể cả trong nước sốt, dầu và đồ trang trí. Xin báo cho tôi nếu món nào không thể làm mà không có chúng. Cảm ơn.",
    forStaff: "Dành cho nhân viên nhà hàng",
    orderTogether: "Gọi món cùng nhau",
    togetherHint:
      "Chia sẻ liên kết này để mọi người cùng bàn có thể thêm món vào một đơn từ điện thoại của mình.",
    copyLink: "Sao chép liên kết",
    linkCopied: "Đã sao chép liên kết",
    shareLink: "Chia sẻ",
    togetherOn: "Đơn chung: ai có liên kết đều có thể thêm món.",
    leaveTogether: "Rời đơn chung",
    togetherEnded: "Đơn chung đã kết thúc, đơn của bạn giờ chỉ còn trên điện thoại này.",
    togetherFailed: "Không thể bắt đầu đơn chung. Vui lòng thử lại.",
    statementIntolerance: "Tôi không dung nạp các thực phẩm sau:",
    severeNote:
      "Tôi bị dị ứng nặng: chỉ một lượng rất nhỏ cũng có thể khiến tôi bị bệnh nặng. Vui lòng dùng dụng cụ và bề mặt sạch, và kiểm tra từng nguyên liệu.",
    severityLabel: "Mức độ nghiêm trọng?",
    severities: { allergy: "Dị ứng", severe: "Dị ứng nặng", intolerance: "Không dung nạp" },
  },
};
