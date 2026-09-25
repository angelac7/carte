import type { LanguageCode } from "@/lib/languages";

// TODO: have a native speaker review each language before launch.

export type ChatStrings = {
  open: string;
  title: string;
  intro: string;
  placeholder: string;
  send: string;
  close: string;
  thinking: string;
  error: string;
  limit: string;
  suggestions: string[];
};

export const CHAT_STRINGS: Record<LanguageCode, ChatStrings> = {
  en: {
    open: "Ask about this menu",
    title: "Menu assistant",
    intro:
      "Ask about dishes, ingredients, or allergens. Answers come only from this restaurant's menu, so always confirm allergies with your server.",
    placeholder: "Type a question",
    send: "Send",
    close: "Close",
    thinking: "Thinking…",
    error: "The assistant isn't available right now. Please ask your server.",
    limit: "You've reached the question limit for now. Please ask your server for more help.",
    suggestions: [
      "What can I eat if I'm gluten-free?",
      "Which dishes have no shellfish?",
      "What's good for a vegetarian?",
    ],
  },
  es: {
    open: "Preguntar sobre el menú",
    title: "Asistente del menú",
    intro:
      "Pregunte sobre platos, ingredientes o alérgenos. Las respuestas provienen solo del menú de este restaurante, así que confirme siempre sus alergias con su mesero.",
    placeholder: "Escriba una pregunta",
    send: "Enviar",
    close: "Cerrar",
    thinking: "Pensando…",
    error: "El asistente no está disponible en este momento. Pregunte a su mesero.",
    limit: "Alcanzó el límite de preguntas por ahora. Pida más ayuda a su mesero.",
    suggestions: [
      "¿Qué puedo comer si no como gluten?",
      "¿Qué platos no tienen mariscos?",
      "¿Qué me recomienda si soy vegetariano?",
    ],
  },
  zh: {
    open: "询问菜单问题",
    title: "菜单助手",
    intro: "可询问菜品、食材或过敏原。回答仅依据本餐厅的菜单，请务必向服务员确认过敏情况。",
    placeholder: "输入问题",
    send: "发送",
    close: "关闭",
    thinking: "正在思考…",
    error: "助手暂时无法使用，请询问服务员。",
    limit: "您暂时已达到提问上限，如需更多帮助请询问服务员。",
    suggestions: ["不吃麸质的话可以点什么？", "哪些菜品不含贝类海鲜？", "素食者适合点什么？"],
  },
  ko: {
    open: "메뉴에 대해 질문하기",
    title: "메뉴 도우미",
    intro:
      "요리, 재료, 알레르기에 대해 물어보세요. 답변은 이 레스토랑의 메뉴만을 바탕으로 하므로, 알레르기는 반드시 직원에게 확인해 주세요.",
    placeholder: "질문을 입력하세요",
    send: "보내기",
    close: "닫기",
    thinking: "생각 중…",
    error: "지금은 도우미를 사용할 수 없습니다. 직원에게 문의해 주세요.",
    limit: "질문 한도에 도달했습니다. 더 필요한 도움은 직원에게 요청해 주세요.",
    suggestions: [
      "글루텐을 못 먹으면 뭘 먹을 수 있나요?",
      "갑각류·조개류가 없는 요리는 뭔가요?",
      "채식주의자에게 좋은 메뉴는 뭔가요?",
    ],
  },
  ja: {
    open: "メニューについて質問",
    title: "メニューアシスタント",
    intro:
      "料理、食材、アレルゲンについて質問できます。回答はこのレストランのメニューのみに基づいているため、アレルギーは必ずスタッフにご確認ください。",
    placeholder: "質問を入力",
    send: "送信",
    close: "閉じる",
    thinking: "考え中…",
    error: "現在アシスタントを利用できません。スタッフにお尋ねください。",
    limit: "質問の上限に達しました。さらにお手伝いが必要な場合はスタッフにお尋ねください。",
    suggestions: [
      "グルテンを避けたい場合、何が食べられますか？",
      "甲殻類・貝類を使っていない料理はどれですか？",
      "ベジタリアン向けのおすすめは？",
    ],
  },
  fr: {
    open: "Poser une question sur le menu",
    title: "Assistant du menu",
    intro:
      "Posez vos questions sur les plats, les ingrédients ou les allergènes. Les réponses proviennent uniquement du menu de ce restaurant : confirmez toujours vos allergies auprès du serveur.",
    placeholder: "Écrivez une question",
    send: "Envoyer",
    close: "Fermer",
    thinking: "Réflexion…",
    error: "L'assistant n'est pas disponible pour le moment. Demandez au serveur.",
    limit:
      "Vous avez atteint la limite de questions pour le moment. Demandez de l'aide au serveur.",
    suggestions: [
      "Que puis-je manger sans gluten ?",
      "Quels plats ne contiennent pas de fruits de mer ?",
      "Que me conseillez-vous si je suis végétarien ?",
    ],
  },
  vi: {
    open: "Hỏi về thực đơn",
    title: "Trợ lý thực đơn",
    intro:
      "Hãy hỏi về món ăn, nguyên liệu hoặc chất gây dị ứng. Câu trả lời chỉ dựa trên thực đơn của nhà hàng này, vì vậy hãy luôn xác nhận dị ứng với nhân viên phục vụ.",
    placeholder: "Nhập câu hỏi",
    send: "Gửi",
    close: "Đóng",
    thinking: "Đang suy nghĩ…",
    error: "Trợ lý hiện không khả dụng. Hãy hỏi nhân viên phục vụ.",
    limit: "Bạn đã đạt giới hạn câu hỏi. Hãy nhờ nhân viên phục vụ giúp thêm.",
    suggestions: [
      "Tôi không ăn được gluten thì có thể ăn món gì?",
      "Món nào không có động vật có vỏ?",
      "Người ăn chay nên gọi món gì?",
    ],
  },

  pt: {
    open: "Perguntar sobre este cardápio",
    title: "Assistente do cardápio",
    intro:
      "Pergunte sobre pratos, ingredientes ou alérgenos. As respostas vêm apenas do cardápio deste restaurante, então sempre confirme alergias com o garçom.",
    placeholder: "Digite uma pergunta",
    send: "Enviar",
    close: "Fechar",
    thinking: "Pensando…",
    error: "O assistente não está disponível agora. Pergunte ao garçom.",
    limit: "Você atingiu o limite de perguntas por enquanto. Peça mais ajuda ao garçom.",
    suggestions: [
      "O que posso comer se não como glúten?",
      "Quais pratos não têm frutos do mar?",
      "O que é bom para um vegetariano?",
    ],
  },
  de: {
    open: "Fragen zu dieser Speisekarte",
    title: "Speisekarten-Assistent",
    intro:
      "Fragen Sie nach Gerichten, Zutaten oder Allergenen. Die Antworten stammen nur aus der Speisekarte dieses Restaurants, klären Sie Allergien also immer mit dem Servicepersonal.",
    placeholder: "Frage eingeben",
    send: "Senden",
    close: "Schließen",
    thinking: "Einen Moment…",
    error: "Der Assistent ist gerade nicht verfügbar. Bitte fragen Sie das Servicepersonal.",
    limit:
      "Sie haben das Fragenlimit vorerst erreicht. Bitte wenden Sie sich an das Servicepersonal.",
    suggestions: [
      "Was kann ich glutenfrei essen?",
      "Welche Gerichte enthalten keine Schalentiere?",
      "Was passt für Vegetarier?",
    ],
  },
  ar: {
    open: "اسأل عن هذه القائمة",
    title: "مساعد القائمة",
    intro:
      "اسأل عن الأطباق أو المكونات أو مسببات الحساسية. تأتي الإجابات من قائمة هذا المطعم فقط، لذا تأكد دائمًا من الحساسية مع النادل.",
    placeholder: "اكتب سؤالًا",
    send: "إرسال",
    close: "إغلاق",
    thinking: "جارٍ التفكير…",
    error: "المساعد غير متاح الآن. يرجى سؤال النادل.",
    limit: "لقد وصلت إلى حد الأسئلة حاليًا. يرجى طلب المساعدة من النادل.",
    suggestions: [
      "ماذا يمكنني أن آكل إذا كنت أتجنب الغلوتين؟",
      "ما الأطباق التي لا تحتوي على المحار والقشريات؟",
      "ما المناسب للنباتيين؟",
    ],
  },
  hi: {
    open: "इस मेन्यू के बारे में पूछें",
    title: "मेन्यू सहायक",
    intro:
      "व्यंजनों, सामग्री या एलर्जेन के बारे में पूछें। जवाब केवल इस रेस्तराँ के मेन्यू से आते हैं, इसलिए एलर्जी की पुष्टि हमेशा अपने वेटर से करें।",
    placeholder: "सवाल लिखें",
    send: "भेजें",
    close: "बंद करें",
    thinking: "सोच रहे हैं…",
    error: "सहायक अभी उपलब्ध नहीं है। कृपया अपने वेटर से पूछें।",
    limit: "अभी के लिए आपकी सवालों की सीमा पूरी हो गई है। कृपया अपने वेटर से मदद लें।",
    suggestions: [
      "अगर मैं ग्लूटेन नहीं खाता तो क्या खा सकता हूँ?",
      "किन व्यंजनों में शेलफ़िश नहीं है?",
      "शाकाहारी लोगों के लिए क्या अच्छा है?",
    ],
  },
  th: {
    open: "ถามเกี่ยวกับเมนูนี้",
    title: "ผู้ช่วยเมนู",
    intro:
      "ถามเกี่ยวกับอาหาร ส่วนผสม หรือสารก่อภูมิแพ้ได้ คำตอบมาจากเมนูของร้านนี้เท่านั้น จึงควรยืนยันเรื่องอาการแพ้กับพนักงานเสมอ",
    placeholder: "พิมพ์คำถาม",
    send: "ส่ง",
    close: "ปิด",
    thinking: "กำลังคิด…",
    error: "ผู้ช่วยยังไม่พร้อมใช้งานในตอนนี้ โปรดสอบถามพนักงาน",
    limit: "คุณถามครบจำนวนแล้วในตอนนี้ โปรดขอความช่วยเหลือจากพนักงาน",
    suggestions: [
      "ถ้าไม่ทานกลูเตน ทานอะไรได้บ้าง",
      "เมนูไหนไม่มีสัตว์น้ำมีเปลือก",
      "มีอะไรเหมาะสำหรับคนทานมังสวิรัติบ้าง",
    ],
  },
  tl: {
    open: "Magtanong tungkol sa menu na ito",
    title: "Katulong sa menu",
    intro:
      "Magtanong tungkol sa mga putahe, sangkap, o allergen. Mula lang sa menu ng restawrang ito ang mga sagot, kaya laging kumpirmahin ang allergy sa inyong server.",
    placeholder: "Mag-type ng tanong",
    send: "Ipadala",
    close: "Isara",
    thinking: "Nag-iisip…",
    error: "Hindi available ang katulong ngayon. Pakitanong ang inyong server.",
    limit: "Naabot mo na ang limitasyon ng tanong sa ngayon. Humingi ng tulong sa inyong server.",
    suggestions: [
      "Ano ang puwede kong kainin kung iniiwasan ko ang gluten?",
      "Aling mga putahe ang walang shellfish?",
      "Ano ang mainam para sa vegetarian?",
    ],
  },
};
