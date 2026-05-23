import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useMyCollector } from "@/lib/collectorContext";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/collector/company")({
  component: CompanyPage,
});

const Schema = z.object({
  company_name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  service_area_counties: z.string().trim().max(255).optional().or(z.literal("")),
  pickup_methods: z.enum(["pickup", "dropoff", "both"]),
});

function CompanyPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: collector } = useMyCollector();
  const [form, setForm] = useState({
    company_name: "",
    description: "",
    service_area_counties: "",
    pickup_methods: "both",
  });

  useEffect(() => {
    if (collector) {
      setForm({
        company_name: collector.company_name ?? "",
        description: collector.description ?? "",
        service_area_counties: (collector.service_area_counties ?? []).join(", "),
        pickup_methods: collector.pickup_methods ?? "both",
      });
    }
  }, [collector]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = Schema.parse(form);
      const counties = parsed.service_area_counties
        ? parsed.service_area_counties.split(",").map((c) => c.trim()).filter(Boolean)
        : null;
      const { error } = await supabase
        .from("collectors")
        .update({
          company_name: parsed.company_name,
          description: parsed.description || null,
          service_area_counties: counties,
          pickup_methods: parsed.pickup_methods,
        })
        .eq("id", collector!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("collector.company.saved"));
      qc.invalidateQueries({ queryKey: ["my-collector"] });
      qc.invalidateQueries({ queryKey: ["collector-gate"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("collector.company.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("collector.company.subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Field label={t("collector.company.fName")}>
          <input
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </Field>
        <Field label={t("collector.company.fDesc")}>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </Field>
        <Field label={t("collector.company.fCounties")} hint={t("collector.company.fCountiesHint")}>
          <input
            value={form.service_area_counties}
            onChange={(e) => setForm({ ...form, service_area_counties: e.target.value })}
            placeholder="Cluj, Bucuresti, Timis"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </Field>
        <Field label={t("collector.company.fMethods")}>
          <select
            value={form.pickup_methods}
            onChange={(e) => setForm({ ...form, pickup_methods: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="both">{t("collector.company.both")}</option>
            <option value="pickup">{t("collector.company.pickupOnly")}</option>
            <option value="dropoff">{t("collector.company.dropoffOnly")}</option>
          </select>
        </Field>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("collector.company.save")}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}
