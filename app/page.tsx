"use client";
import { useState } from "react";
import Link from "next/link";

type Item = {
  name: string;
  description: string;
  price: string;
  likely_allergens: string[];
  dietary_tags: string[];
};

type Status = "idle" | "reading" | "ready" | "saving" | "saved" | "error";

// Resize large images so they upload and process faster
async function shrink(file: File, maxSize = 1600): Promise<File> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
  );
  return new File([blob], "menu.jpg", { type: "image/jpeg" });
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  async function readMenu(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("error");
      setError("Use a JPG, PNG, or WebP image of your menu.");
      return;
    }
    setFileName(file.name);
    setStatus("reading");
    setError("");
    setItems([]);
    try {
      const form = new FormData();
      form.append("menu", await shrink(file));
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error();
      setItems(data.items);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError(
        "Carte couldn't read that image. Try a sharper, well-lit photo where the text is easy to see."
      );
    }
  }

  async function saveAll() {
    setStatus("saving");
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setStatus("saved");
  }

  const reading = status === "reading";

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
        Turn your menu into an allergen guide.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
        Upload a photo of your menu. Carte lists every dish and suggests allergens, then you
        confirm each one before diners see it.
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) readMenu(f);
        }}
        className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${
          dragging ? "border-ink bg-card" : "border-line bg-card/60 hover:border-muted"
        } ${reading ? "pointer-events-none" : ""}`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={reading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readMenu(f);
            e.target.value = "";
          }}
        />
        <span className="font-serif text-2xl">
          {reading ? "Reading your menu…" : "Drop a menu photo here"}
        </span>
        <span className="mt-2 text-sm text-muted">
          {reading
            ? `Reading ${fileName}. This usually takes about 20 seconds.`
            : "Or click to choose a file. JPG, PNG, or WebP."}
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="mt-4 rounded-md bg-tomato/10 px-4 py-3 text-sm text-tomato">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl">{items.length} dishes found</h2>
              <p className="mt-1 text-sm text-muted">
                Allergens are suggestions. You’ll confirm each dish on the next step.
              </p>
            </div>
            {status === "saved" ? (
              <Link
                href="/review"
                className="rounded-md bg-basil px-4 py-2 text-sm font-medium text-white hover:bg-basil/90"
              >
                Review dishes
              </Link>
            ) : (
              <button
                onClick={saveAll}
                disabled={status === "saving"}
                className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
              >
                {status === "saving" ? "Saving…" : "Save to menu"}
              </button>
            )}
          </div>

          {status === "saved" && (
            <p className="mt-4 rounded-md bg-basil-soft px-4 py-3 text-sm text-basil">
              Saved to your menu. Review each dish to confirm its allergens.
            </p>
          )}

          <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-card px-5 sm:px-6">
            {items.map((item, i) => (
              <li key={i} className="py-5">
                <div className="flex items-baseline">
                  <span className="font-serif text-xl">{item.name}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="tabular-nums">{item.price}</span>
                </div>
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
                {(item.likely_allergens.length > 0 || item.dietary_tags.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.likely_allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-saffron-soft px-2.5 py-0.5 text-xs text-saffron-ink"
                      >
                        {a}
                      </span>
                    ))}
                    {item.dietary_tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-basil-soft px-2.5 py-0.5 text-xs text-basil"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}