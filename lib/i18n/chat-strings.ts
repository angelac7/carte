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
};
