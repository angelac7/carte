import type { LanguageCode } from "@/lib/languages";
export const IMPORT_STRINGS: Record<LanguageCode, { stale: string; limited: string }> = {
  en: {
    stale:
      "This preview expired or the menu changed. Select the file again to review a fresh preview. Nothing was imported.",
    limited: "Too many import requests. Try again later.",
  },
  es: {
    stale:
      "La vista previa caducó o el menú cambió. Selecciona el archivo otra vez para revisar los cambios. No se importó nada.",
    limited: "Demasiadas solicitudes. Inténtalo más tarde.",
  },
  zh: {
    stale: "预览已过期或菜单已更改。请重新选择文件查看最新预览。未导入任何内容。",
    limited: "导入请求过多，请稍后重试。",
  },
  ko: {
    stale:
      "미리보기가 만료되었거나 메뉴가 변경되었습니다. 파일을 다시 선택해 확인하세요. 가져온 항목은 없습니다.",
    limited: "요청이 너무 많습니다. 나중에 다시 시도하세요.",
  },
  ja: {
    stale:
      "プレビューの期限切れ、またはメニューが変更されました。ファイルを選び直して確認してください。何も取り込まれていません。",
    limited: "リクエストが多すぎます。後でお試しください。",
  },
  fr: {
    stale:
      "L’aperçu a expiré ou le menu a changé. Sélectionnez à nouveau le fichier pour vérifier. Rien n’a été importé.",
    limited: "Trop de demandes. Réessayez plus tard.",
  },
  vi: {
    stale:
      "Bản xem trước đã hết hạn hoặc thực đơn thay đổi. Chọn lại tệp để kiểm tra. Chưa nhập dữ liệu nào.",
    limited: "Quá nhiều yêu cầu. Hãy thử lại sau.",
  },
  pt: {
    stale:
      "A prévia expirou ou o menu mudou. Selecione o arquivo novamente para conferir. Nada foi importado.",
    limited: "Muitas solicitações. Tente mais tarde.",
  },
  de: {
    stale:
      "Die Vorschau ist abgelaufen oder das Menü wurde geändert. Datei erneut auswählen und prüfen. Es wurde nichts importiert.",
    limited: "Zu viele Anfragen. Später erneut versuchen.",
  },
  ar: {
    stale: "انتهت المعاينة أو تغيرت القائمة. حدد الملف مجددًا للمراجعة. لم يتم استيراد شيء.",
    limited: "طلبات كثيرة. حاول لاحقًا.",
  },
  hi: {
    stale:
      "पूर्वावलोकन समाप्त हो गया या मेन्यू बदल गया। फ़ाइल फिर चुनकर समीक्षा करें। कुछ भी आयात नहीं हुआ।",
    limited: "बहुत अधिक अनुरोध। बाद में कोशिश करें।",
  },
  th: {
    stale:
      "ตัวอย่างหมดอายุหรือเมนูเปลี่ยนแปลง โปรดเลือกไฟล์อีกครั้งเพื่อตรวจสอบ ยังไม่ได้นำเข้าข้อมูล",
    limited: "คำขอมากเกินไป โปรดลองภายหลัง",
  },
  tl: {
    stale:
      "Nag-expire ang preview o nagbago ang menu. Piliin ulit ang file para suriin. Walang na-import.",
    limited: "Napakaraming kahilingan. Subukan mamaya.",
  },
};
