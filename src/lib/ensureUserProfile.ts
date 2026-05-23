import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Ensures a row exists in public.users for the authenticated auth user. */
export async function ensureUserProfile(user: User): Promise<void> {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const meta = user.user_metadata ?? {};
  const { error } = await supabase.from("users").insert({
    id: user.id,
    name: (meta.name as string | undefined) ?? user.email?.split("@")[0] ?? "User",
    role: (meta.role as string | undefined) ?? "citizen",
  });

  // Another tab may have created the row between select and insert.
  if (error?.code === "23505") return;
  if (error) throw error;
}
