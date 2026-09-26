"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { removeDishPhoto, uploadDishPhoto } from "@/lib/api-client";
import { useOwnerText } from "@/components/owner/OwnerLanguage";
import { shrinkImage } from "@/lib/image";
import type { MenuItem } from "@/types/menu";

type DishPhotoEditorProps = {
  dish: MenuItem;
  onChange: (photoUrl: string | null, revision: number) => void;
  onBusy: (busy: boolean) => void;
};

/** Add, replace, or remove a dish's photo. Photo edits require fresh confirmation. */
export function DishPhotoEditor({ dish, onChange, onBusy }: DishPhotoEditorProps) {
  const { t } = useOwnerText();
  const [status, setStatus] = useState<"idle" | "uploading" | "failed">("idle");

  const pending = useRef(false);
  const [problem, setProblem] = useState("");

  async function upload(file: File) {
    if (pending.current) return;
    pending.current = true;
    onBusy(true);
    setStatus("uploading");
    try {
      const result = await uploadDishPhoto(dish.id, await shrinkImage(file, 1600), dish.revision);
      onChange(result.photoUrl, result.revision);
      setStatus("idle");
      toast(t.photo.added);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : t.photo.failed);
      setStatus("failed");
    } finally {
      pending.current = false;
      onBusy(false);
    }
  }

  async function remove() {
    if (pending.current) return;
    pending.current = true;
    onBusy(true);
    setStatus("uploading");
    try {
      const result = await removeDishPhoto(dish.id, dish.revision);
      onChange(null, result.revision);
      setStatus("idle");
      toast(t.photo.removed);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : t.photo.failed);
      setStatus("failed");
    } finally {
      pending.current = false;
      onBusy(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-4">
      {dish.photo_url ? (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.25rem] shadow-raised-sm">
          <Image src={dish.photo_url} alt="" fill sizes="80px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.25rem] text-xs text-muted shadow-pressed">
          {t.photo.none}
        </div>
      )}
      <div className="flex flex-col items-start gap-1">
        <label className="cursor-pointer text-sm font-medium underline underline-offset-4 hover:text-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={status === "uploading"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          {status === "uploading"
            ? t.photo.uploading
            : dish.photo_url
              ? t.photo.replace
              : t.photo.add}
        </label>
        {dish.photo_url && (
          <button type="button" onClick={remove} className="text-sm text-muted hover:text-tomato">
            {t.photo.remove}
          </button>
        )}
        {status === "failed" && (
          <p role="alert" className="text-sm text-tomato">
            {problem}
          </p>
        )}
      </div>
    </div>
  );
}
