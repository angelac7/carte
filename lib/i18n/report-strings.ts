import type { LanguageCode } from "@/lib/languages";
import type { ReportKind } from "@/types/report";

// TODO: have a native speaker review each language before launch.

export type ReportStrings = {
  open: string;
  title: string;
  kinds: Record<ReportKind, string>;
  message: string;
  privacy: string;
  send: string;
  sending: string;
  cancel: string;
  thanks: string;
  failed: string;
};

export const REPORT_STRINGS: Record<LanguageCode, ReportStrings> = {
  en: {
    open: "Something wrong with this dish? Tell the restaurant",
    title: "What looks wrong?",
    kinds: {
      allergens: "The allergens",
      diet: "A diet label",
      description: "The description",
      price: "The price",
      other: "Something else",
    },
    message: "Details (optional)",
    privacy: "Don't include your name or contact details.",
    send: "Send report",
    sending: "Sending…",
    cancel: "Cancel",
    thanks:
      "Thanks. The restaurant will see your report. For allergies, always check with your server before ordering.",
    failed: "Your report couldn't be sent. Please tell your server instead.",
  },
  es: {
    open: "¿Algo está mal en este plato? Avise al restaurante",
    title: "¿Qué parece incorrecto?",
    kinds: {
      allergens: "Los alérgenos",
      diet: "Una etiqueta de dieta",
      description: "La descripción",
      price: "El precio",
      other: "Otra cosa",
    },
    message: "Detalles (opcional)",
    privacy: "No incluya su nombre ni sus datos de contacto.",
    send: "Enviar reporte",
    sending: "Enviando…",
    cancel: "Cancelar",
    thanks:
      "Gracias. El restaurante verá su reporte. Si tiene alergias, consulte siempre con su mesero antes de pedir.",
    failed: "No se pudo enviar el reporte. Por favor, dígaselo a su mesero.",
  },
  zh: {
    open: "这道菜的信息有误？告诉餐厅",
    title: "哪里不对？",
    kinds: {
      allergens: "过敏原",
      diet: "饮食标签",
      description: "描述",
      price: "价格",
      other: "其他",
    },
    message: "详细说明（可选）",
    privacy: "请勿填写您的姓名或联系方式。",
    send: "发送反馈",
    sending: "正在发送…",
    cancel: "取消",
    thanks: "谢谢。餐厅会看到您的反馈。如有过敏，点餐前请务必向服务员确认。",
    failed: "反馈发送失败。请直接告诉服务员。",
  },
  ko: {
    open: "이 요리 정보가 틀렸나요? 식당에 알려 주세요",
    title: "무엇이 잘못되었나요?",
    kinds: {
      allergens: "알레르기 정보",
      diet: "식단 표시",
      description: "설명",
      price: "가격",
      other: "기타",
    },
    message: "자세한 내용 (선택)",
    privacy: "이름이나 연락처는 적지 마세요.",
    send: "신고 보내기",
    sending: "보내는 중…",
    cancel: "취소",
    thanks:
      "감사합니다. 식당에서 신고 내용을 확인합니다. 알레르기가 있다면 주문 전에 꼭 직원에게 확인하세요.",
    failed: "신고를 보내지 못했습니다. 직원에게 직접 알려 주세요.",
  },
  ja: {
    open: "この料理の情報に誤りがありますか？お店に知らせる",
    title: "どこが違いますか？",
    kinds: {
      allergens: "アレルゲン",
      diet: "食事制限の表示",
      description: "説明",
      price: "価格",
      other: "その他",
    },
    message: "詳細（任意）",
    privacy: "お名前や連絡先は書かないでください。",
    send: "報告を送る",
    sending: "送信中…",
    cancel: "キャンセル",
    thanks:
      "ありがとうございます。お店が報告を確認します。アレルギーがある場合は、注文前に必ずスタッフに確認してください。",
    failed: "報告を送信できませんでした。スタッフに直接お伝えください。",
  },
  fr: {
    open: "Une erreur sur ce plat ? Prévenez le restaurant",
    title: "Qu'est-ce qui semble incorrect ?",
    kinds: {
      allergens: "Les allergènes",
      diet: "Une étiquette de régime",
      description: "La description",
      price: "Le prix",
      other: "Autre chose",
    },
    message: "Détails (facultatif)",
    privacy: "N'indiquez ni votre nom ni vos coordonnées.",
    send: "Envoyer le signalement",
    sending: "Envoi…",
    cancel: "Annuler",
    thanks:
      "Merci. Le restaurant verra votre signalement. En cas d'allergie, vérifiez toujours auprès du serveur avant de commander.",
    failed: "Le signalement n'a pas pu être envoyé. Veuillez prévenir le serveur.",
  },
  vi: {
    open: "Thông tin món này bị sai? Báo cho nhà hàng",
    title: "Điều gì có vẻ sai?",
    kinds: {
      allergens: "Chất gây dị ứng",
      diet: "Nhãn chế độ ăn",
      description: "Mô tả",
      price: "Giá",
      other: "Điều khác",
    },
    message: "Chi tiết (không bắt buộc)",
    privacy: "Đừng ghi tên hoặc thông tin liên lạc của bạn.",
    send: "Gửi báo cáo",
    sending: "Đang gửi…",
    cancel: "Hủy",
    thanks:
      "Cảm ơn bạn. Nhà hàng sẽ xem báo cáo của bạn. Nếu bị dị ứng, hãy luôn hỏi nhân viên phục vụ trước khi gọi món.",
    failed: "Không gửi được báo cáo. Vui lòng báo trực tiếp cho nhân viên phục vụ.",
  },
};
