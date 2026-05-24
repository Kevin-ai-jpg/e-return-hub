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
    const supabaseUrl = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) {
      throw new Error("Missing Supabase server configuration");
    }

    // Admin-only
    const { data: me, error: meErr } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    if (me?.role !== "admin") throw new Error("Forbidden: admin role required");

    const password = generatePassword();
    const signupClient = createClient<Database>(supabaseUrl, publishableKey, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Create auth user without relying on the service role key.
    const { data: created, error: createErr } =
      await signupClient.auth.signUp({
        email: data.email,
        password,
        options: {
          data: {
            name: data.contactName,
            company_name: data.companyName,
            role: "collector",
          },
        },
      });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Failed to create auth user");
    }
    const userId = created.user.id;

    // Insert profile row
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
    if (userErr) {
      throw new Error(`Failed to create user profile: ${userErr.message}`);
    }

    // Insert collector row
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
    if (collErr) {
      throw new Error(`Failed to create collector: ${collErr.message}`);
    }

    return {
      collectorId: collector.id,
      userId,
      email: data.email,
      password,
    };
  });
