function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name}. Add it to .env.local.`);
  return value;
}

export const supabaseUrl = () =>
  required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");

export const supabasePublishableKey = () =>
  required(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
