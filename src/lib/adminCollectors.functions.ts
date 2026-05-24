import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    // Verify admin
    const { data: me, error: meErr } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    if (me?.role !== "admin") throw new Error("Forbidden: admin role required");

    const password = generatePassword();

    // Create auth user (confirmed)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      app_metadata: { role: "collector" },
      user_metadata: { name: data.contactName, company_name: data.companyName },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Failed to create auth user");
    }
    const userId = created.user.id;

    // Insert into public.users
    const { error: userErr } = await supabaseAdmin.from("users").upsert(
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
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user profile: ${userErr.message}`);
    }

    // Insert into collectors
    const { data: collector, error: collErr } = await supabaseAdmin
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
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create collector: ${collErr.message}`);
    }

    return {
      collectorId: collector.id,
      userId,
      email: data.email,
      password,
    };
  });
