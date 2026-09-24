import { NextResponse } from "next/server";
import { readItems, writeItems, MenuItem } from "@/lib/db";

type Extracted = {
  name?: string; description?: string; price?: string;
  likely_allergens?: string[]; dietary_tags?: string[];
};

// Get all saved dishes
export async function GET() {
  return NextResponse.json(readItems());
}

// Save new dishes from a menu scan (always unconfirmed)
export async function POST(req: Request) {
  const { items } = (await req.json()) as { items: Extracted[] };
  const added: MenuItem[] = items.map((it) => ({
    id: crypto.randomUUID(),
    name: it.name ?? "",
    description: it.description ?? "",
    price: it.price ?? "",
    allergens: it.likely_allergens ?? [],
    dietary_tags: it.dietary_tags ?? [],
    notes: "",
    confirmed: false,
  }));
  writeItems([...readItems(), ...added]);
  return NextResponse.json(added);
}

// Update one dish
export async function PUT(req: Request) {
  const updated = (await req.json()) as MenuItem;
  writeItems(readItems().map((i) => (i.id === updated.id ? updated : i)));
  return NextResponse.json(updated);
}

// Delete one dish
export async function DELETE(req: Request) {
  const { id } = (await req.json()) as { id: string };
  writeItems(readItems().filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}