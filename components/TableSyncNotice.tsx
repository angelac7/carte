import { Notice } from "@/components/ui/notice";
import { TABLE_SYNC_STRINGS } from "@/lib/i18n/diner-strings";
import type { LanguageCode } from "@/lib/languages";
import type { TableSyncStatus } from "@/lib/table-sync";
export function TableSyncNotice({
  status,
  language,
}: {
  status: TableSyncStatus;
  language: LanguageCode;
}) {
  const warning = status === "failed" || status === "offline";
  return (
    <Notice
      className="my-3"
      tone={warning ? "warning" : "caution"}
      role={warning ? "alert" : "status"}
    >
      {TABLE_SYNC_STRINGS[language][status]}
    </Notice>
  );
}
