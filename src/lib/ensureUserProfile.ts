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

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { error } = await supabase.from("users").insert({
    id: user.id,
    name: (meta.name as string | undefined) ?? user.email?.split("@")[0] ?? "User",
    role: (meta.role as string | undefined) ?? "citizen",
    email: user.email ?? null,
    county: (meta.county as string | undefined) ?? null,
  } as never);

  if (error?.code === "23505") return;
  if (error) throw error;

  // If signing up as a collector, also create the collectors row.
  if ((meta.role as string | undefined) === "collector") {
    const companyName =
      (meta.company_name as string | undefined) ??
      (meta.name as string | undefined) ??
      "Company";
    const county = meta.county as string | undefined;
    const { data: existingCollector } = await supabase
      .from("collectors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existingCollector) {
      await supabase.from("collectors").insert({
        user_id: user.id,
        company_name: companyName,
        service_area_counties: county ? [county] : null,
        pickup_methods: "both",
      });
    }
  }
}
