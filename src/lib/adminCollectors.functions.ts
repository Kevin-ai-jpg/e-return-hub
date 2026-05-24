import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  counties: z.array(z.string().trim().min(2).max(64)).min(1).max(50),
  description: z.string().trim().max(1000).optional().default(""),
});

export const adminCreateCollector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Admin-only
    const { data: me, error: meErr } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    if (me?.role !== "admin") throw new Error("Forbidden: admin role required");

    const { data: collector, error: collErr } = await context.supabase
      .from("collectors")
      .insert({
        company_name: data.companyName,
        service_area_counties: data.counties,
        county: data.counties[0] ?? null,
        description: data.description || null,
      })
      .select()
      .single();
    if (collErr) {
      throw new Error(`Failed to create collector: ${collErr.message}`);
    }

    return {
      collectorId: collector.id,
    };
  });
