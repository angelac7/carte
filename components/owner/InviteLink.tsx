"use client";
import { useActionState, useState } from "react";
import { createInviteAction, type InviteState } from "@/app/dashboard/team/actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

/** Creates an invite link and offers to copy it, since Carte doesn't send it by email. */
export function InviteLink({ siteUrl }: { siteUrl: string }) {
  const [state, create, pending] = useActionState<InviteState>(createInviteAction, {});
  const [copied, setCopied] = useState(false);
  const link = state.code ? `${siteUrl}/join/${state.code}` : "";

  return (
    <div>
      <Button onClick={() => create()} disabled={pending}>
        {pending ? "One moment…" : "Create invite link"}
      </Button>
      {state.error && (
        <Notice tone="warning" role="alert" className="mt-4">
          {state.error}
        </Notice>
      )}
      {link && (
        <div className="mt-4 rounded-control p-4 shadow-pressed-sm">
          <p className="text-sm">
            Send this link to the person you want to add. It works once, for 7 days.
          </p>
          <p className="mt-2 font-mono text-sm break-all">{link}</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() =>
              navigator.clipboard.writeText(link).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }
          >
            {copied ? "Link copied" : "Copy link"}
          </Button>
        </div>
      )}
    </div>
  );
}
