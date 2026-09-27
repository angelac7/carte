"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import {
  createDishGroup,
  deleteDishGroup,
  setDishGroupDishes,
  updateDishGroup,
} from "@/lib/db/dish-groups";
import { reportError } from "@/lib/report-error";

const PAGE = "/dashboard/menus";
const Name = z.string().trim().min(1).max(60);
const Id = z.uuid();

/** Runs a change, then comes back to the page saying whether it worked. */
async function done(change: () => Promise<void>, failure = "failed"): Promise<never> {
  let result = "saved";
  try {
    await change();
    revalidatePath(PAGE);
    revalidatePath("/dashboard/review");
  } catch (error) {
    reportError("Changing a seasonal menu failed", error);
    result = failure;
  }
  redirect(`${PAGE}?result=${result}`);
}

export async function createGroupAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant(PAGE);
  const name = Name.safeParse(formData.get("name"));
  if (!name.success) redirect(`${PAGE}?result=name`);
  await done(() => createDishGroup(supabase, restaurant.id, name.data));
}

export async function renameGroupAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant(PAGE);
  const group = Id.safeParse(formData.get("group"));
  const name = Name.safeParse(formData.get("name"));
  if (!group.success || !name.success) redirect(`${PAGE}?result=name`);
  await done(() => updateDishGroup(supabase, restaurant.id, group.data, { name: name.data }));
}

/** Switches a seasonal menu on or off; its dishes appear or disappear for diners at once. */
export async function switchGroupAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant(PAGE);
  const group = Id.safeParse(formData.get("group"));
  if (!group.success) redirect(`${PAGE}?result=failed`);
  const active = formData.get("active") === "true";
  await done(() => updateDishGroup(supabase, restaurant.id, group.data, { active }));
}

export async function setGroupDishesAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant(PAGE);
  const group = Id.safeParse(formData.get("group"));
  const dishes = z.array(Id).max(1000).safeParse(formData.getAll("dish"));
  if (!group.success || !dishes.success) redirect(`${PAGE}?result=failed`);
  await done(() => setDishGroupDishes(supabase, restaurant.id, group.data, dishes.data));
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant(PAGE);
  const group = Id.safeParse(formData.get("group"));
  if (!group.success) redirect(`${PAGE}?result=failed`);
  await done(() => deleteDishGroup(supabase, restaurant.id, group.data));
}
