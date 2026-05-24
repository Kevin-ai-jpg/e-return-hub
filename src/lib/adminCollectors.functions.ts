import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const inputSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(32).optional().default(""),
  counties: z.array(z.string().trim().min(2).max(64)).min(1).max(50),
  description: z.string().trim().max(1000).optional().default(""),
});

function generatePassword(length = 14) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += charset[bytes[i] % charset.length];
  return out;
}

export const adminCreateCollector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Verify admin role
    const { data: me, error: meErr } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    if (me?.role !== "admin") throw new Error("Forbidden: admin role required");

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Missing Supabase env vars");
    }

    const password = generatePassword();

    // Use anon client to sign up the new auth user (no service role needed)
    const anon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });

    const { data: signUp, error: signUpErr } = await anon.auth.signUp({
      email: data.email,
      password,
      options: { data: { name: data.contactName, company_name: data.companyName } },
    });
    if (signUpErr || !signUp.user) {
      throw new Error(signUpErr?.message ?? "Failed to create auth user");
    }
    const userId = signUp.user.id;

    // Insert profile row (admin RLS policy allows this)
    const { error: userErr } = await context.supabase.from("users").upsert(
      {
        id: userId,
        email: data.email,
        name: data.contactName,
        phone: data.phone || null,
        role: "collector",
      },
      { onConflict: "id" },
    );
    if (userErr) throw new Error(`Failed to create user profile: ${userErr.message}`);

    // Insert collector row (admin RLS policy allows this)
    const { data: collector, error: collErr } = await context.supabase
      .from("collectors")
      .insert({
        user_id: userId,
        company_name: data.companyName,
        service_area_counties: data.counties,
        description: data.description || null,
      })
      .select()
      .single();
    if (collErr) throw new Error(`Failed to create collector: ${collErr.message}`);

    return {
      collectorId: collector.id,
      userId,
      email: data.email,
      password,
    };
  });
