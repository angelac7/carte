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

  pt: {
    title: "Frases úteis",
    hint: "Toque em uma para mostrá-la em tamanho grande à equipe.",
    listen: "Ouvir",
    phrases: {
      cleanTools: "Por favor, use utensílios e uma superfície limpos para a minha comida.",
      sameOil: "Isto é frito no mesmo óleo que outros alimentos?",
      sauces: "O que vai nos molhos e temperos?",
      ingredients: "Posso ver a lista completa de ingredientes deste prato?",
      water: "Pode me trazer água, por favor?",
      check: "Pode trazer a conta, por favor?",
    },
  },
  de: {
    title: "Hilfreiche Sätze",
    hint: "Tippen Sie auf einen Satz, um ihn dem Personal groß zu zeigen.",
    listen: "Anhören",
    phrases: {
      cleanTools:
        "Bitte verwenden Sie für mein Essen saubere Utensilien und eine saubere Arbeitsfläche.",
      sameOil: "Wird das im selben Öl frittiert wie andere Speisen?",
      sauces: "Was ist in den Soßen und Dressings?",
      ingredients: "Könnte ich die vollständige Zutatenliste für dieses Gericht sehen?",
      water: "Könnte ich bitte etwas Wasser bekommen?",
      check: "Die Rechnung, bitte.",
    },
  },
  ar: {
    title: "عبارات مفيدة",
    hint: "اضغط على عبارة لعرضها بخط كبير للموظفين.",
    listen: "استمع",
    phrases: {
      cleanTools: "من فضلك استخدم أدوات وسطحًا نظيفين لتحضير طعامي.",
      sameOil: "هل يُقلى هذا في نفس الزيت مع أطعمة أخرى؟",
      sauces: "ما مكونات الصلصات والتتبيلات؟",
      ingredients: "هل يمكنني رؤية قائمة المكونات الكاملة لهذا الطبق؟",
      water: "هل يمكنني الحصول على بعض الماء من فضلك؟",
      check: "الحساب من فضلك.",
    },
  },
  hi: {
    title: "काम के वाक्य",
    hint: "किसी वाक्य पर टैप करें ताकि स्टाफ़ को बड़े अक्षरों में दिखा सकें।",
    listen: "सुनें",
    phrases: {
      cleanTools: "कृपया मेरे खाने के लिए साफ़ बर्तन और साफ़ सतह का इस्तेमाल करें।",
      sameOil: "क्या यह दूसरे खाने वाले उसी तेल में तला जाता है?",
      sauces: "सॉस और ड्रेसिंग में क्या-क्या है?",
      ingredients: "क्या मैं इस व्यंजन की पूरी सामग्री सूची देख सकता हूँ?",
      water: "क्या मुझे थोड़ा पानी मिल सकता है?",
      check: "कृपया बिल ले आइए।",
    },
  },
  th: {
    title: "ประโยคที่มีประโยชน์",
    hint: "แตะประโยคเพื่อแสดงตัวใหญ่ให้พนักงานดู",
    listen: "ฟังเสียง",
    phrases: {
      cleanTools: "กรุณาใช้อุปกรณ์และพื้นที่ที่สะอาดในการทำอาหารให้ฉัน",
      sameOil: "เมนูนี้ทอดในน้ำมันเดียวกับอาหารอื่นหรือไม่",
      sauces: "ในซอสและน้ำสลัดมีอะไรบ้าง",
      ingredients: "ขอดูรายการส่วนผสมทั้งหมดของเมนูนี้ได้ไหม",
      water: "ขอน้ำเปล่าหน่อยได้ไหม",
      check: "เช็กบิลด้วย",
    },
  },
  tl: {
    title: "Mga kapaki-pakinabang na parirala",
    hint: "I-tap ang isa para ipakita ito nang malaki sa staff.",
    listen: "Pakinggan",
    phrases: {
      cleanTools: "Pakigamit po ng malinis na kagamitan at malinis na lugar para sa pagkain ko.",
      sameOil: "Pinirito po ba ito sa parehong mantika ng ibang pagkain?",
      sauces: "Ano po ang laman ng mga sarsa at dressing?",
      ingredients: "Puwede ko po bang makita ang buong listahan ng sangkap ng putaheng ito?",
      water: "Puwede po bang makahingi ng tubig?",
      check: "Pahingi po ng bill.",
    },
  },
};
