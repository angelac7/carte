import type { LanguageCode } from "@/lib/languages";

// TODO: have a native speaker review each language before launch.

export type PlacesStrings = {
  title: string;
  intro: string;
  queryLabel: string;
  queryPlaceholder: string;
  near: string;
  nearPlaceholder: string;
  useLocation: string;
  locating: string;
  locationFailed: string;
  search: string;
  notFoundLocation: string;
  noResults: string;
  lookupFailed: string;
  onCarte: string;
  details: string;
  directions: string;
  website: string;
  call: string;
  hours: string;
  dietOptions: string;
  sourceNote: string;
  noMenu: string;
  scanMenu: string;
  viewMenu: string;
  ownerPrompt: string;
  ownerLink: string;
  credit: string;
  placesLink: string;
};

export const PLACES_STRINGS: Record<LanguageCode, PlacesStrings> = {
  en: {
    title: "Restaurants nearby",
    intro: "Find any restaurant near you, including ones that haven't joined Carte yet.",
    queryLabel: "Restaurant or food (optional)",
    queryPlaceholder: "ramen, pizza, or a restaurant name",
    near: "Near",
    nearPlaceholder: "City or neighborhood, like Ithaca",
    useLocation: "Use my location",
    locating: "Finding you…",
    locationFailed: "Couldn't get your location. Type a city instead.",
    search: "Search",
    notFoundLocation: "We couldn't find that place. Try a city name.",
    noResults: "No restaurants found. Try a different word or another area.",
    lookupFailed: "Restaurant search isn't available right now. Try again in a moment.",
    onCarte: "Menu on Carte",
    details: "Details",
    directions: "Directions",
    website: "Website",
    call: "Call",
    hours: "Hours",
    dietOptions: "Listed options",
    sourceNote:
      "Restaurant details come from OpenStreetMap, a community-made map, and may be out of date.",
    noMenu: "This restaurant hasn't joined Carte yet, so there's no confirmed menu.",
    scanMenu: "Scan this restaurant's menu",
    viewMenu: "View confirmed menu",
    ownerPrompt: "Own this restaurant?",
    ownerLink: "Put your menu on Carte",
    credit: "Map data © OpenStreetMap contributors",
    placesLink: "Search every restaurant nearby, including ones not on Carte",
  },
  es: {
    title: "Restaurantes cercanos",
    intro: "Encuentre cualquier restaurante cerca, incluso los que aún no usan Carte.",
    queryLabel: "Restaurante o comida (opcional)",
    queryPlaceholder: "ramen, pizza o el nombre de un restaurante",
    near: "Cerca de",
    nearPlaceholder: "Ciudad o barrio, por ejemplo Ithaca",
    useLocation: "Usar mi ubicación",
    locating: "Buscando su ubicación…",
    locationFailed: "No se pudo obtener su ubicación. Escriba una ciudad.",
    search: "Buscar",
    notFoundLocation: "No encontramos ese lugar. Pruebe con el nombre de una ciudad.",
    noResults: "No se encontraron restaurantes. Pruebe otra palabra u otra zona.",
    lookupFailed:
      "La búsqueda de restaurantes no está disponible en este momento. Inténtelo de nuevo en un momento.",
    onCarte: "Menú en Carte",
    details: "Detalles",
    directions: "Cómo llegar",
    website: "Sitio web",
    call: "Llamar",
    hours: "Horario",
    dietOptions: "Opciones indicadas",
    sourceNote:
      "Los datos del restaurante provienen de OpenStreetMap, un mapa colaborativo, y pueden estar desactualizados.",
    noMenu: "Este restaurante aún no usa Carte, así que no hay un menú confirmado.",
    scanMenu: "Escanear el menú de este restaurante",
    viewMenu: "Ver menú confirmado",
    ownerPrompt: "¿Es dueño de este restaurante?",
    ownerLink: "Publique su menú en Carte",
    credit: "Datos del mapa © colaboradores de OpenStreetMap",
    placesLink: "Buscar todos los restaurantes cercanos, incluso los que no usan Carte",
  },
  zh: {
    title: "附近的餐厅",
    intro: "查找您附近的任何餐厅，包括尚未加入 Carte 的餐厅。",
    queryLabel: "餐厅或食物（可选）",
    queryPlaceholder: "拉面、披萨或餐厅名称",
    near: "位置",
    nearPlaceholder: "城市或街区，例如 Ithaca",
    useLocation: "使用我的位置",
    locating: "正在定位…",
    locationFailed: "无法获取您的位置，请输入城市名称。",
    search: "搜索",
    notFoundLocation: "找不到该地点，请尝试输入城市名称。",
    noResults: "没有找到餐厅。请换个关键词或其他区域。",
    lookupFailed: "餐厅搜索暂时无法使用，请稍后再试。",
    onCarte: "Carte 上有菜单",
    details: "详情",
    directions: "路线",
    website: "网站",
    call: "致电",
    hours: "营业时间",
    dietOptions: "已标注的选项",
    sourceNote: "餐厅信息来自社区共建的地图 OpenStreetMap，可能不是最新的。",
    noMenu: "这家餐厅尚未加入 Carte，因此没有经确认的菜单。",
    scanMenu: "扫描这家餐厅的菜单",
    viewMenu: "查看已确认的菜单",
    ownerPrompt: "您是这家餐厅的老板吗？",
    ownerLink: "把您的菜单放上 Carte",
    credit: "地图数据 © OpenStreetMap 贡献者",
    placesLink: "搜索附近所有餐厅，包括未加入 Carte 的餐厅",
  },
  ko: {
    title: "주변 레스토랑",
    intro: "아직 Carte에 가입하지 않은 곳을 포함해 주변의 모든 레스토랑을 찾아보세요.",
    queryLabel: "레스토랑 또는 음식 (선택)",
    queryPlaceholder: "라멘, 피자 또는 레스토랑 이름",
    near: "위치",
    nearPlaceholder: "도시 또는 동네 (예: Ithaca)",
    useLocation: "내 위치 사용",
    locating: "위치를 찾는 중…",
    locationFailed: "위치를 가져올 수 없습니다. 도시 이름을 입력해 주세요.",
    search: "검색",
    notFoundLocation: "해당 장소를 찾을 수 없습니다. 도시 이름으로 다시 시도해 주세요.",
    noResults: "레스토랑을 찾지 못했습니다. 다른 검색어나 지역으로 시도해 보세요.",
    lookupFailed: "지금은 레스토랑 검색을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    onCarte: "Carte 메뉴 있음",
    details: "자세히",
    directions: "길찾기",
    website: "웹사이트",
    call: "전화",
    hours: "영업시간",
    dietOptions: "표시된 옵션",
    sourceNote:
      "레스토랑 정보는 커뮤니티가 만든 지도인 OpenStreetMap에서 가져오며 최신 정보가 아닐 수 있습니다.",
    noMenu: "이 레스토랑은 아직 Carte에 가입하지 않아 확인된 메뉴가 없습니다.",
    scanMenu: "이 레스토랑 메뉴 스캔하기",
    viewMenu: "확인된 메뉴 보기",
    ownerPrompt: "이 레스토랑의 사장님이신가요?",
    ownerLink: "Carte에 메뉴 올리기",
    credit: "지도 데이터 © OpenStreetMap 기여자",
    placesLink: "Carte에 없는 곳을 포함해 주변 모든 레스토랑 검색",
  },
  ja: {
    title: "近くのレストラン",
    intro: "まだCarteに参加していないお店も含め、近くのレストランを探せます。",
    queryLabel: "レストランまたは料理（任意）",
    queryPlaceholder: "ラーメン、ピザ、店名など",
    near: "場所",
    nearPlaceholder: "都市や地域（例：Ithaca）",
    useLocation: "現在地を使う",
    locating: "現在地を取得中…",
    locationFailed: "現在地を取得できませんでした。都市名を入力してください。",
    search: "検索",
    notFoundLocation: "その場所が見つかりません。都市名で試してください。",
    noResults: "レストランが見つかりません。別のキーワードや地域で試してください。",
    lookupFailed: "現在レストラン検索を利用できません。しばらくしてからお試しください。",
    onCarte: "Carteにメニューあり",
    details: "詳細",
    directions: "行き方",
    website: "ウェブサイト",
    call: "電話",
    hours: "営業時間",
    dietOptions: "記載されている対応",
    sourceNote: "店舗情報はコミュニティが作る地図OpenStreetMapのもので、最新でない場合があります。",
    noMenu: "このお店はまだCarteに参加していないため、確認済みのメニューはありません。",
    scanMenu: "このお店のメニューをスキャン",
    viewMenu: "確認済みメニューを見る",
    ownerPrompt: "このお店のオーナーですか？",
    ownerLink: "Carteにメニューを掲載する",
    credit: "地図データ © OpenStreetMap contributors",
    placesLink: "Carteに参加していないお店も含め、近くのレストランをすべて検索",
  },
  fr: {
    title: "Restaurants à proximité",
    intro:
      "Trouvez n'importe quel restaurant près de chez vous, y compris ceux qui n'utilisent pas encore Carte.",
    queryLabel: "Restaurant ou plat (facultatif)",
    queryPlaceholder: "ramen, pizza ou nom d'un restaurant",
    near: "Près de",
    nearPlaceholder: "Ville ou quartier, par exemple Ithaca",
    useLocation: "Utiliser ma position",
    locating: "Localisation…",
    locationFailed: "Impossible d'obtenir votre position. Saisissez plutôt une ville.",
    search: "Rechercher",
    notFoundLocation: "Ce lieu est introuvable. Essayez un nom de ville.",
    noResults: "Aucun restaurant trouvé. Essayez un autre mot ou une autre zone.",
    lookupFailed:
      "La recherche de restaurants n'est pas disponible pour le moment. Réessayez dans un instant.",
    onCarte: "Menu sur Carte",
    details: "Détails",
    directions: "Itinéraire",
    website: "Site web",
    call: "Appeler",
    hours: "Horaires",
    dietOptions: "Options indiquées",
    sourceNote:
      "Les informations proviennent d'OpenStreetMap, une carte collaborative, et peuvent être obsolètes.",
    noMenu: "Ce restaurant n'utilise pas encore Carte : il n'y a donc pas de menu confirmé.",
    scanMenu: "Scanner le menu de ce restaurant",
    viewMenu: "Voir le menu confirmé",
    ownerPrompt: "Vous êtes propriétaire de ce restaurant ?",
    ownerLink: "Publiez votre menu sur Carte",
    credit: "Données cartographiques © contributeurs d'OpenStreetMap",
    placesLink:
      "Rechercher tous les restaurants à proximité, y compris ceux qui n'utilisent pas Carte",
  },
  vi: {
    title: "Nhà hàng gần đây",
    intro: "Tìm bất kỳ nhà hàng nào gần bạn, kể cả những nơi chưa dùng Carte.",
    queryLabel: "Nhà hàng hoặc món ăn (không bắt buộc)",
    queryPlaceholder: "ramen, pizza hoặc tên nhà hàng",
    near: "Gần",
    nearPlaceholder: "Thành phố hoặc khu vực, ví dụ Ithaca",
    useLocation: "Dùng vị trí của tôi",
    locating: "Đang tìm vị trí…",
    locationFailed: "Không lấy được vị trí của bạn. Hãy nhập tên thành phố.",
    search: "Tìm",
    notFoundLocation: "Không tìm thấy địa điểm đó. Hãy thử tên thành phố.",
    noResults: "Không tìm thấy nhà hàng. Hãy thử từ khác hoặc khu vực khác.",
    lookupFailed: "Hiện không thể tìm nhà hàng. Hãy thử lại sau giây lát.",
    onCarte: "Có thực đơn trên Carte",
    details: "Chi tiết",
    directions: "Chỉ đường",
    website: "Trang web",
    call: "Gọi",
    hours: "Giờ mở cửa",
    dietOptions: "Lựa chọn được ghi nhận",
    sourceNote:
      "Thông tin nhà hàng lấy từ OpenStreetMap, bản đồ do cộng đồng xây dựng, và có thể đã cũ.",
    noMenu: "Nhà hàng này chưa dùng Carte nên chưa có thực đơn đã xác nhận.",
    scanMenu: "Quét thực đơn của nhà hàng này",
    viewMenu: "Xem thực đơn đã xác nhận",
    ownerPrompt: "Bạn là chủ nhà hàng này?",
    ownerLink: "Đưa thực đơn của bạn lên Carte",
    credit: "Dữ liệu bản đồ © những người đóng góp OpenStreetMap",
    placesLink: "Tìm mọi nhà hàng gần đây, kể cả những nơi chưa dùng Carte",
  },
};
