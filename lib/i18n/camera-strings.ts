import type { LanguageCode } from "@/lib/languages";

// The scan warning is safety-critical. TODO: have a native speaker review each language before launch.

export type CameraStrings = {
  photoButton: string;
  photoIntro: string;
  takePhoto: string;
  photoSearching: string;
  photoNone: string;
  photoFailed: string;
  photoLimit: string;
  likely: string;
  possible: string;
  hiddenByFilters: string;
  photoDisclaimer: string;
  scanTitle: string;
  scanIntro: string;
  reading: string;
  readingHint: string;
  scanFailed: string;
  scanPartial: string;
  warning: string;
  checking: string;
  noAllergiesSet: string;
  mayContain: string;
  noneDetected: string;
  showCard: string;
  scanAnother: string;
  dishesFound: (count: number) => string;
};

export const CAMERA_STRINGS: Record<LanguageCode, CameraStrings> = {
  en: {
    scanPartial:
      "Only the first 60 dishes were read. Photograph the remaining section separately. Always confirm allergens with staff.",
    photoButton: "Find a dish by photo",
    photoIntro: "Take a photo of a dish, like one at another table, to find it on this menu.",
    takePhoto: "Take or choose a photo",
    photoSearching: "Looking for a match…",
    photoNone: "No match found. Try a clearer photo or ask your server.",
    photoFailed: "Photo search isn't available right now.",
    photoLimit: "You've used photo features several times recently. Try again in a little while.",
    likely: "Likely match",
    possible: "Possible match",
    hiddenByFilters: "Hidden by your filters",
    photoDisclaimer: "Matches are AI guesses from the photo.",
    scanTitle: "Scan a paper menu",
    scanIntro:
      "At a restaurant that isn't on Carte? Take a photo of its menu to translate it and flag possible allergens.",
    reading: "Reading the menu…",
    readingHint: "Dishes appear below as they’re read.",
    scanFailed: "The menu couldn't be read. Try a sharper, well-lit photo of the whole menu.",
    warning:
      "This restaurant isn't on Carte, so nothing here is confirmed by the kitchen. Allergens are AI guesses from the menu text, and dishes often contain things the menu doesn't list. Always ask staff.",
    checking: "Checking for your allergies:",
    noAllergiesSet:
      "You haven't chosen any allergies yet. Open your allergy card to choose them and see warnings.",
    mayContain: "May contain",
    noneDetected: "No allergens spotted in the menu text. Still ask staff.",
    showCard: "Show my allergy card",
    scanAnother: "Scan another menu",
    dishesFound: (count) => (count === 1 ? "1 dish found" : `${count} dishes found`),
  },
  es: {
    scanPartial:
      "Solo se leyeron los primeros 60 platos. Fotografíe el resto por separado. Confirme siempre los alérgenos con el personal.",
    photoButton: "Buscar un plato por foto",
    photoIntro:
      "Tome una foto de un plato, por ejemplo en otra mesa, para encontrarlo en este menú.",
    takePhoto: "Tomar o elegir una foto",
    photoSearching: "Buscando coincidencias…",
    photoNone:
      "No se encontró ninguna coincidencia. Pruebe con una foto más clara o pregunte a su mesero.",
    photoFailed: "La búsqueda por foto no está disponible en este momento.",
    photoLimit:
      "Ha usado las funciones de foto varias veces recientemente. Inténtelo de nuevo en un rato.",
    likely: "Coincidencia probable",
    possible: "Posible coincidencia",
    hiddenByFilters: "Oculto por sus filtros",
    photoDisclaimer: "Las coincidencias son suposiciones de una IA a partir de la foto.",
    scanTitle: "Escanear un menú en papel",
    scanIntro:
      "¿Está en un restaurante que no usa Carte? Tome una foto del menú para traducirlo y señalar posibles alérgenos.",
    reading: "Leyendo el menú…",
    readingHint: "Los platos aparecen abajo a medida que se leen.",
    scanFailed:
      "No se pudo leer el menú. Pruebe con una foto más nítida y bien iluminada de todo el menú.",
    warning:
      "Este restaurante no usa Carte, así que la cocina no ha confirmado nada de esto. Los alérgenos son suposiciones de una IA a partir del texto del menú, y los platos suelen contener ingredientes que el menú no menciona. Pregunte siempre al personal.",
    checking: "Buscando sus alergias:",
    noAllergiesSet:
      "Aún no ha elegido ninguna alergia. Abra su tarjeta de alergias para elegirlas y ver advertencias.",
    mayContain: "Puede contener",
    noneDetected:
      "No se detectaron alérgenos en el texto del menú. Pregunte de todos modos al personal.",
    showCard: "Mostrar mi tarjeta de alergias",
    scanAnother: "Escanear otro menú",
    dishesFound: (count) => (count === 1 ? "1 plato encontrado" : `${count} platos encontrados`),
  },
  zh: {
    scanPartial: "只读取了前60道菜。请单独拍摄剩余部分。务必向工作人员确认过敏原。",
    photoButton: "拍照找菜",
    photoIntro: "拍下一道菜（比如邻桌的菜），在这份菜单上找到它。",
    takePhoto: "拍照或选择照片",
    photoSearching: "正在查找匹配的菜品…",
    photoNone: "没有找到匹配的菜品。请尝试拍得更清楚，或询问服务员。",
    photoFailed: "拍照找菜暂时无法使用。",
    photoLimit: "您最近多次使用拍照功能，请稍后再试。",
    likely: "很可能是",
    possible: "可能是",
    hiddenByFilters: "已被您的筛选条件隐藏",
    photoDisclaimer: "匹配结果由 AI 根据照片推测。",
    scanTitle: "扫描纸质菜单",
    scanIntro: "餐厅没有使用 Carte？拍下菜单即可翻译并标出可能的过敏原。",
    reading: "正在识别菜单…",
    readingHint: "菜品识别后会陆续显示在下方。",
    scanFailed: "无法识别菜单。请拍一张清晰、光线充足的完整菜单照片。",
    warning:
      "这家餐厅没有使用 Carte，因此以下内容均未经厨房确认。过敏原是 AI 根据菜单文字推测的，菜品常含有菜单未列出的成分。请务必询问员工。",
    checking: "正在检查您的过敏原：",
    noAllergiesSet: "您还没有选择过敏原。打开过敏卡进行选择即可看到提醒。",
    mayContain: "可能含有",
    noneDetected: "菜单文字中未发现过敏原，仍请询问员工。",
    showCard: "出示我的过敏卡",
    scanAnother: "扫描另一份菜单",
    dishesFound: (count) => `找到 ${count} 道菜`,
  },
  ko: {
    scanPartial:
      "처음 60개 메뉴만 읽었습니다. 나머지 부분을 따로 촬영하세요. 알레르기 유발 성분은 반드시 직원에게 확인하세요.",
    photoButton: "사진으로 요리 찾기",
    photoIntro: "옆 테이블의 요리처럼 요리 사진을 찍어 이 메뉴에서 찾아보세요.",
    takePhoto: "사진 찍기 또는 선택",
    photoSearching: "일치하는 요리를 찾는 중…",
    photoNone:
      "일치하는 요리를 찾지 못했습니다. 더 선명한 사진으로 다시 시도하거나 직원에게 문의해 주세요.",
    photoFailed: "지금은 사진 검색을 사용할 수 없습니다.",
    photoLimit: "최근 사진 기능을 여러 번 사용했습니다. 잠시 후 다시 시도해 주세요.",
    likely: "일치 가능성 높음",
    possible: "일치 가능성 있음",
    hiddenByFilters: "필터로 숨겨짐",
    photoDisclaimer: "일치 결과는 사진을 바탕으로 한 AI의 추측입니다.",
    scanTitle: "종이 메뉴 스캔",
    scanIntro:
      "Carte를 사용하지 않는 레스토랑인가요? 메뉴 사진을 찍으면 번역하고 알레르기 가능성을 표시해 드립니다.",
    reading: "메뉴를 읽는 중…",
    readingHint: "읽은 요리부터 아래에 바로 표시됩니다.",
    scanFailed:
      "메뉴를 읽을 수 없습니다. 메뉴 전체가 선명하고 밝게 나온 사진으로 다시 시도해 주세요.",
    warning:
      "이 레스토랑은 Carte를 사용하지 않으므로 주방에서 확인한 정보가 아닙니다. 알레르기 정보는 메뉴 글을 바탕으로 한 AI의 추측이며, 요리에는 메뉴에 없는 재료가 들어 있는 경우가 많습니다. 반드시 직원에게 확인하세요.",
    checking: "내 알레르기 확인 중:",
    noAllergiesSet:
      "아직 알레르기를 선택하지 않았습니다. 알레르기 카드를 열어 선택하면 경고를 볼 수 있습니다.",
    mayContain: "포함 가능",
    noneDetected: "메뉴 글에서 알레르기 유발 성분을 찾지 못했습니다. 그래도 직원에게 확인하세요.",
    showCard: "내 알레르기 카드 보여주기",
    scanAnother: "다른 메뉴 스캔",
    dishesFound: (count) => `요리 ${count}개를 찾았습니다`,
  },
  ja: {
    scanPartial:
      "最初の60品のみ読み取りました。残りの部分を別に撮影してください。アレルゲンは必ずスタッフに確認してください。",
    photoButton: "写真で料理を探す",
    photoIntro: "隣のテーブルの料理などを撮影して、このメニューから探せます。",
    takePhoto: "写真を撮る・選ぶ",
    photoSearching: "該当する料理を探しています…",
    photoNone: "該当する料理が見つかりません。より鮮明な写真で試すか、スタッフにお尋ねください。",
    photoFailed: "現在、写真検索を利用できません。",
    photoLimit: "最近、写真機能を何度も使用しました。しばらくしてからお試しください。",
    likely: "該当する可能性が高い",
    possible: "該当する可能性あり",
    hiddenByFilters: "フィルターで非表示",
    photoDisclaimer: "結果は写真をもとにしたAIの推測です。",
    scanTitle: "紙のメニューをスキャン",
    scanIntro:
      "Carteを使っていないお店ですか？メニューを撮影すると、翻訳してアレルゲンの可能性を表示します。",
    reading: "メニューを読み取り中…",
    readingHint: "読み取った料理から順に下に表示されます。",
    scanFailed:
      "メニューを読み取れませんでした。メニュー全体が明るく鮮明に写った写真で試してください。",
    warning:
      "このお店はCarteを利用していないため、厨房が確認した情報ではありません。アレルゲンはメニューの文字をもとにしたAIの推測で、料理にはメニューに書かれていない食材が含まれることもよくあります。必ずスタッフにご確認ください。",
    checking: "あなたのアレルギーを確認中：",
    noAllergiesSet:
      "まだアレルギーが選択されていません。アレルギーカードを開いて選択すると警告が表示されます。",
    mayContain: "含む可能性",
    noneDetected:
      "メニューの文字からアレルゲンは見つかりませんでした。念のためスタッフにご確認ください。",
    showCard: "アレルギーカードを見せる",
    scanAnother: "別のメニューをスキャン",
    dishesFound: (count) => `${count}品見つかりました`,
  },
  fr: {
    scanPartial:
      "Seuls les 60 premiers plats ont été lus. Photographiez le reste séparément. Confirmez toujours les allergènes avec le personnel.",
    photoButton: "Trouver un plat en photo",
    photoIntro:
      "Prenez un plat en photo, par exemple à une autre table, pour le trouver sur ce menu.",
    takePhoto: "Prendre ou choisir une photo",
    photoSearching: "Recherche d'une correspondance…",
    photoNone:
      "Aucune correspondance trouvée. Essayez une photo plus nette ou demandez au serveur.",
    photoFailed: "La recherche par photo n'est pas disponible pour le moment.",
    photoLimit:
      "Vous avez utilisé les fonctions photo plusieurs fois récemment. Réessayez un peu plus tard.",
    likely: "Correspondance probable",
    possible: "Correspondance possible",
    hiddenByFilters: "Masqué par vos filtres",
    photoDisclaimer: "Les correspondances sont des suppositions d'une IA à partir de la photo.",
    scanTitle: "Scanner un menu papier",
    scanIntro:
      "Dans un restaurant qui n'utilise pas Carte ? Prenez le menu en photo pour le traduire et repérer les allergènes possibles.",
    reading: "Lecture du menu…",
    readingHint: "Les plats s’affichent ci-dessous au fur et à mesure de la lecture.",
    scanFailed:
      "Le menu n'a pas pu être lu. Essayez une photo nette et bien éclairée de tout le menu.",
    warning:
      "Ce restaurant n'utilise pas Carte : rien ici n'est confirmé par la cuisine. Les allergènes sont des suppositions d'une IA à partir du texte du menu, et les plats contiennent souvent des ingrédients non mentionnés. Demandez toujours au personnel.",
    checking: "Vérification de vos allergies :",
    noAllergiesSet:
      "Vous n'avez encore choisi aucune allergie. Ouvrez votre carte d'allergies pour les choisir et voir les alertes.",
    mayContain: "Peut contenir",
    noneDetected: "Aucun allergène repéré dans le texte du menu. Demandez quand même au personnel.",
    showCard: "Montrer ma carte d'allergies",
    scanAnother: "Scanner un autre menu",
    // French uses the singular for zero and one.
    dishesFound: (count) => (count <= 1 ? `${count} plat trouvé` : `${count} plats trouvés`),
  },
  vi: {
    scanPartial:
      "Chỉ đọc được 60 món đầu tiên. Hãy chụp riêng phần còn lại. Luôn xác nhận chất gây dị ứng với nhân viên.",
    photoButton: "Tìm món bằng ảnh",
    photoIntro: "Chụp ảnh một món, ví dụ ở bàn bên cạnh, để tìm món đó trong thực đơn này.",
    takePhoto: "Chụp hoặc chọn ảnh",
    photoSearching: "Đang tìm món phù hợp…",
    photoNone: "Không tìm thấy món phù hợp. Hãy thử ảnh rõ hơn hoặc hỏi nhân viên phục vụ.",
    photoFailed: "Hiện không thể tìm bằng ảnh.",
    photoLimit: "Bạn đã dùng tính năng ảnh nhiều lần gần đây. Hãy thử lại sau ít phút.",
    likely: "Rất có thể là món này",
    possible: "Có thể là món này",
    hiddenByFilters: "Bị ẩn theo bộ lọc của bạn",
    photoDisclaimer: "Kết quả là phỏng đoán của AI dựa trên ảnh.",
    scanTitle: "Quét thực đơn giấy",
    scanIntro:
      "Nhà hàng không dùng Carte? Chụp ảnh thực đơn để dịch và đánh dấu các chất có thể gây dị ứng.",
    reading: "Đang đọc thực đơn…",
    readingHint: "Các món sẽ hiện bên dưới ngay khi được đọc.",
    scanFailed: "Không đọc được thực đơn. Hãy thử ảnh rõ nét, đủ sáng và chụp toàn bộ thực đơn.",
    warning:
      "Nhà hàng này không dùng Carte nên bếp chưa xác nhận bất kỳ thông tin nào ở đây. Chất gây dị ứng là phỏng đoán của AI từ chữ trên thực đơn, và món ăn thường có thành phần không ghi trên thực đơn. Hãy luôn hỏi nhân viên.",
    checking: "Đang kiểm tra dị ứng của bạn:",
    noAllergiesSet: "Bạn chưa chọn chất gây dị ứng nào. Mở thẻ dị ứng để chọn và xem cảnh báo.",
    mayContain: "Có thể chứa",
    noneDetected: "Không thấy chất gây dị ứng trong chữ trên thực đơn. Vẫn nên hỏi nhân viên.",
    showCard: "Mở thẻ dị ứng",
    scanAnother: "Quét thực đơn khác",
    dishesFound: (count) => `Tìm thấy ${count} món`,
  },

  pt: {
    scanPartial:
      "Só os primeiros 60 pratos foram lidos. Fotografe o restante separadamente. Sempre confirme os alérgenos com a equipe.",
    photoButton: "Encontrar um prato pela foto",
    photoIntro: "Tire uma foto de um prato, como o de outra mesa, para encontrá-lo neste cardápio.",
    takePhoto: "Tirar ou escolher uma foto",
    photoSearching: "Procurando uma correspondência…",
    photoNone: "Nenhuma correspondência. Tente uma foto mais nítida ou pergunte ao garçom.",
    photoFailed: "A busca por foto não está disponível agora.",
    photoLimit:
      "Você usou os recursos de foto várias vezes recentemente. Tente de novo daqui a pouco.",
    likely: "Provável",
    possible: "Possível",
    hiddenByFilters: "Oculto pelos seus filtros",
    photoDisclaimer: "As correspondências são palpites da IA a partir da foto.",
    scanTitle: "Escanear um cardápio de papel",
    scanIntro:
      "Em um restaurante que não está no Carte? Fotografe o cardápio para traduzi-lo e sinalizar possíveis alérgenos.",
    reading: "Lendo o cardápio…",
    readingHint: "Os pratos aparecem abaixo conforme são lidos.",
    scanFailed:
      "Não foi possível ler o cardápio. Tente uma foto mais nítida e bem iluminada do cardápio inteiro.",
    warning:
      "Este restaurante não está no Carte, então nada aqui foi confirmado pela cozinha. Os alérgenos são palpites da IA a partir do texto, e os pratos muitas vezes têm ingredientes que o cardápio não lista. Sempre pergunte à equipe.",
    checking: "Verificando suas alergias:",
    noAllergiesSet:
      "Você ainda não escolheu nenhuma alergia. Abra seu cartão de alergia para escolhê-las e ver os alertas.",
    mayContain: "Pode conter",
    noneDetected:
      "Nenhum alérgeno encontrado no texto do cardápio. Mesmo assim, pergunte à equipe.",
    showCard: "Mostrar meu cartão de alergia",
    scanAnother: "Escanear outro cardápio",
    dishesFound: (count) => (count === 1 ? "1 prato encontrado" : `${count} pratos encontrados`),
  },
  de: {
    scanPartial:
      "Nur die ersten 60 Gerichte wurden gelesen. Fotografieren Sie den Rest separat. Klären Sie Allergene immer mit dem Personal.",
    photoButton: "Gericht per Foto finden",
    photoIntro:
      "Fotografieren Sie ein Gericht, etwa an einem anderen Tisch, um es auf dieser Karte zu finden.",
    takePhoto: "Foto aufnehmen oder auswählen",
    photoSearching: "Suche nach einem Treffer…",
    photoNone:
      "Kein Treffer. Versuchen Sie ein schärferes Foto oder fragen Sie das Servicepersonal.",
    photoFailed: "Die Fotosuche ist gerade nicht verfügbar.",
    photoLimit:
      "Sie haben die Fotofunktionen zuletzt mehrmals genutzt. Versuchen Sie es bald wieder.",
    likely: "Wahrscheinlich",
    possible: "Möglich",
    hiddenByFilters: "Durch Ihre Filter ausgeblendet",
    photoDisclaimer: "Die Treffer sind Vermutungen einer KI anhand des Fotos.",
    scanTitle: "Papierkarte scannen",
    scanIntro:
      "In einem Restaurant ohne Carte? Fotografieren Sie die Speisekarte, um sie zu übersetzen und mögliche Allergene zu markieren.",
    reading: "Speisekarte wird gelesen…",
    readingHint: "Die Gerichte erscheinen unten, sobald sie gelesen sind.",
    scanFailed:
      "Die Speisekarte konnte nicht gelesen werden. Versuchen Sie ein schärferes, gut beleuchtetes Foto der ganzen Karte.",
    warning:
      "Dieses Restaurant ist nicht bei Carte, daher ist hier nichts von der Küche bestätigt. Allergene sind Vermutungen einer KI anhand des Textes, und Gerichte enthalten oft Dinge, die nicht auf der Karte stehen. Fragen Sie immer das Personal.",
    checking: "Wir prüfen auf Ihre Allergien:",
    noAllergiesSet:
      "Sie haben noch keine Allergien gewählt. Öffnen Sie Ihre Allergiekarte, um sie auszuwählen und Warnungen zu sehen.",
    mayContain: "Kann enthalten",
    noneDetected:
      "Im Text der Karte wurden keine Allergene gefunden. Fragen Sie trotzdem das Personal.",
    showCard: "Meine Allergiekarte zeigen",
    scanAnother: "Weitere Speisekarte scannen",
    dishesFound: (count) => (count === 1 ? "1 Gericht gefunden" : `${count} Gerichte gefunden`),
  },
  ar: {
    scanPartial:
      "تمت قراءة أول 60 طبقًا فقط. صوّر القسم المتبقي بشكل منفصل. تأكد دائمًا من مسببات الحساسية مع الموظفين.",
    photoButton: "ابحث عن طبق بالصورة",
    photoIntro: "التقط صورة لطبق، مثل طبق على طاولة أخرى، للعثور عليه في هذه القائمة.",
    takePhoto: "التقط صورة أو اخترها",
    photoSearching: "جارٍ البحث عن تطابق…",
    photoNone: "لم يتم العثور على تطابق. جرّب صورة أوضح أو اسأل النادل.",
    photoFailed: "البحث بالصورة غير متاح الآن.",
    photoLimit: "لقد استخدمت ميزات الصور عدة مرات مؤخرًا. حاول مرة أخرى بعد قليل.",
    likely: "تطابق محتمل جدًا",
    possible: "تطابق ممكن",
    hiddenByFilters: "مخفي بسبب عوامل التصفية",
    photoDisclaimer: "التطابقات تخمينات من الذكاء الاصطناعي بناءً على الصورة.",
    scanTitle: "امسح قائمة ورقية",
    scanIntro:
      "في مطعم غير موجود على Carte؟ التقط صورة لقائمته لترجمتها وتحديد مسببات الحساسية المحتملة.",
    reading: "جارٍ قراءة القائمة…",
    readingHint: "تظهر الأطباق أدناه فور قراءتها.",
    scanFailed: "تعذّرت قراءة القائمة. جرّب صورة أوضح وجيدة الإضاءة للقائمة كاملة.",
    warning:
      "هذا المطعم غير موجود على Carte، لذا لم يؤكد المطبخ أي شيء هنا. مسببات الحساسية تخمينات من الذكاء الاصطناعي بناءً على نص القائمة، وغالبًا ما تحتوي الأطباق على مكونات لا تذكرها القائمة. اسأل الموظفين دائمًا.",
    checking: "نتحقق من الحساسية لديك:",
    noAllergiesSet: "لم تختر أي حساسية بعد. افتح بطاقة الحساسية لاختيارها ورؤية التحذيرات.",
    mayContain: "قد يحتوي على",
    noneDetected: "لم يُعثر على مسببات حساسية في نص القائمة. اسأل الموظفين مع ذلك.",
    showCard: "اعرض بطاقة الحساسية",
    scanAnother: "امسح قائمة أخرى",
    dishesFound: (count) =>
      count === 1 ? "تم العثور على طبق واحد" : `تم العثور على ${count} أطباق`,
  },
  hi: {
    scanPartial:
      "सिर्फ़ पहले 60 व्यंजन पढ़े गए। बाकी हिस्से की अलग से फ़ोटो लें। एलर्जेन की पुष्टि हमेशा स्टाफ़ से करें।",
    photoButton: "फ़ोटो से व्यंजन खोजें",
    photoIntro:
      "किसी व्यंजन की फ़ोटो लें, जैसे दूसरी टेबल पर रखे व्यंजन की, ताकि उसे इस मेन्यू में खोजा जा सके।",
    takePhoto: "फ़ोटो लें या चुनें",
    photoSearching: "मिलान खोज रहे हैं…",
    photoNone: "कोई मिलान नहीं मिला। साफ़ फ़ोटो आज़माएँ या अपने वेटर से पूछें।",
    photoFailed: "फ़ोटो से खोज अभी उपलब्ध नहीं है।",
    photoLimit: "आपने हाल में कई बार फ़ोटो सुविधाएँ इस्तेमाल की हैं। थोड़ी देर बाद फिर कोशिश करें।",
    likely: "संभावित मिलान",
    possible: "हो सकता है",
    hiddenByFilters: "आपके फ़िल्टर से छिपा है",
    photoDisclaimer: "मिलान फ़ोटो के आधार पर AI का अनुमान हैं।",
    scanTitle: "कागज़ का मेन्यू स्कैन करें",
    scanIntro:
      "ऐसे रेस्तराँ में हैं जो Carte पर नहीं है? मेन्यू की फ़ोटो लें ताकि उसका अनुवाद हो और संभावित एलर्जेन दिखें।",
    reading: "मेन्यू पढ़ा जा रहा है…",
    readingHint: "जैसे-जैसे व्यंजन पढ़े जाएँगे, वे नीचे दिखेंगे।",
    scanFailed:
      "मेन्यू पढ़ा नहीं जा सका। पूरे मेन्यू की ज़्यादा साफ़ और अच्छी रोशनी वाली फ़ोटो आज़माएँ।",
    warning:
      "यह रेस्तराँ Carte पर नहीं है, इसलिए यहाँ कुछ भी रसोई द्वारा पुष्ट नहीं है। एलर्जेन मेन्यू के टेक्स्ट से AI का अनुमान हैं, और व्यंजनों में अक्सर ऐसी चीज़ें होती हैं जो मेन्यू में नहीं लिखी होतीं। हमेशा स्टाफ़ से पूछें।",
    checking: "आपकी एलर्जी की जाँच:",
    noAllergiesSet:
      "आपने अभी कोई एलर्जी नहीं चुनी है। उन्हें चुनने और चेतावनियाँ देखने के लिए अपना एलर्जी कार्ड खोलें।",
    mayContain: "इसमें हो सकता है",
    noneDetected: "मेन्यू के टेक्स्ट में कोई एलर्जेन नहीं दिखा। फिर भी स्टाफ़ से पूछें।",
    showCard: "मेरा एलर्जी कार्ड दिखाएँ",
    scanAnother: "दूसरा मेन्यू स्कैन करें",
    dishesFound: (count) => (count === 1 ? "1 व्यंजन मिला" : `${count} व्यंजन मिले`),
  },
  th: {
    scanPartial:
      "อ่านได้เฉพาะ 60 เมนูแรก โปรดถ่ายรูปส่วนที่เหลือแยกต่างหาก และยืนยันสารก่อภูมิแพ้กับพนักงานเสมอ",
    photoButton: "หาเมนูจากรูปถ่าย",
    photoIntro: "ถ่ายรูปอาหาร เช่น จานที่โต๊ะอื่น เพื่อหาเมนูนั้นในเมนูนี้",
    takePhoto: "ถ่ายหรือเลือกรูป",
    photoSearching: "กำลังหาเมนูที่ตรงกัน…",
    photoNone: "ไม่พบเมนูที่ตรงกัน ลองถ่ายรูปให้ชัดขึ้นหรือสอบถามพนักงาน",
    photoFailed: "ยังค้นหาจากรูปไม่ได้ในตอนนี้",
    photoLimit: "คุณใช้ฟีเจอร์รูปภาพหลายครั้งแล้วเมื่อสักครู่ โปรดลองใหม่อีกครั้งในภายหลัง",
    likely: "น่าจะตรงกัน",
    possible: "อาจตรงกัน",
    hiddenByFilters: "ถูกซ่อนตามตัวกรองของคุณ",
    photoDisclaimer: "ผลที่ตรงกันเป็นการคาดเดาของ AI จากรูปภาพ",
    scanTitle: "สแกนเมนูกระดาษ",
    scanIntro:
      "อยู่ที่ร้านที่ไม่ได้อยู่บน Carte ใช่ไหม ถ่ายรูปเมนูเพื่อแปลและดูสารก่อภูมิแพ้ที่อาจมี",
    reading: "กำลังอ่านเมนู…",
    readingHint: "เมนูจะแสดงด้านล่างทันทีที่อ่านเสร็จ",
    scanFailed: "อ่านเมนูไม่ได้ ลองถ่ายรูปเมนูทั้งหมดให้ชัดและมีแสงสว่างเพียงพอ",
    warning:
      "ร้านนี้ไม่ได้อยู่บน Carte จึงไม่มีข้อมูลใดที่ครัวยืนยันแล้ว สารก่อภูมิแพ้เป็นการคาดเดาของ AI จากข้อความในเมนู และอาหารมักมีส่วนผสมที่เมนูไม่ได้ระบุ โปรดสอบถามพนักงานทุกครั้ง",
    checking: "กำลังตรวจสอบอาการแพ้ของคุณ:",
    noAllergiesSet: "คุณยังไม่ได้เลือกอาการแพ้ เปิดบัตรแจ้งอาการแพ้เพื่อเลือกและดูคำเตือน",
    mayContain: "อาจมี",
    noneDetected: "ไม่พบสารก่อภูมิแพ้ในข้อความเมนู แต่ควรสอบถามพนักงานอยู่ดี",
    showCard: "แสดงบัตรแจ้งอาการแพ้",
    scanAnother: "สแกนเมนูอื่น",
    dishesFound: (count) => `พบ ${count} เมนู`,
  },
  tl: {
    scanPartial:
      "Ang unang 60 putahe lang ang nabasa. Kunan nang hiwalay ang natitirang bahagi. Laging kumpirmahin ang allergen sa staff.",
    photoButton: "Hanapin ang putahe gamit ang litrato",
    photoIntro:
      "Kunan ng litrato ang isang putahe, tulad ng nasa ibang mesa, para mahanap ito sa menu na ito.",
    takePhoto: "Kumuha o pumili ng litrato",
    photoSearching: "Naghahanap ng katugma…",
    photoNone:
      "Walang nahanap na katugma. Subukan ang mas malinaw na litrato o magtanong sa server.",
    photoFailed: "Hindi available ang paghahanap gamit ang litrato ngayon.",
    photoLimit:
      "Ilang beses mo nang ginamit ang mga feature ng litrato kamakailan. Subukan ulit mamaya.",
    likely: "Malamang na katugma",
    possible: "Posibleng katugma",
    hiddenByFilters: "Nakatago dahil sa mga filter mo",
    photoDisclaimer: "Hula ng AI mula sa litrato ang mga katugma.",
    scanTitle: "I-scan ang papel na menu",
    scanIntro:
      "Nasa restawrang wala sa Carte? Kunan ng litrato ang menu para maisalin ito at makita ang posibleng allergen.",
    reading: "Binabasa ang menu…",
    readingHint: "Lalabas sa ibaba ang mga putahe habang binabasa.",
    scanFailed:
      "Hindi mabasa ang menu. Subukan ang mas malinaw at maliwanag na litrato ng buong menu.",
    warning:
      "Wala sa Carte ang restawrang ito, kaya walang kinumpirma ang kusina rito. Hula ng AI mula sa teksto ng menu ang mga allergen, at madalas may mga sangkap ang putahe na hindi nakalista. Laging magtanong sa staff.",
    checking: "Sinusuri ang mga allergy mo:",
    noAllergiesSet:
      "Wala ka pang napiling allergy. Buksan ang allergy card mo para pumili at makita ang mga babala.",
    mayContain: "Maaaring may",
    noneDetected: "Walang nakitang allergen sa teksto ng menu. Magtanong pa rin sa staff.",
    showCard: "Ipakita ang allergy card ko",
    scanAnother: "Mag-scan ng ibang menu",
    dishesFound: (count) => (count === 1 ? "1 putahe ang nahanap" : `${count} putahe ang nahanap`),
  },
};
