import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { toast } from "sonner";
import { Plus, Megaphone, Loader2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/collector/campaigns")({
  component: CampaignsPage,
});

const Schema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  region: z.string().trim().max(80).optional().or(z.literal("")),
});

function CampaignsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", region: "" });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = Schema.parse(form);
      const { error } = await supabase.from("campaigns").insert({
        title: parsed.title,
        description: parsed.description || null,
        region: parsed.region || null,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("collector.campaigns.added"));
      setForm({ title: "", description: "", region: "" });
      qc.invalidateQueries({ queryKey: ["campaigns-active"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("collector.campaigns.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("collector.campaigns.subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("collector.campaigns.newTitle")}</h2>
        <div className="mt-4 space-y-3">
          <input
            placeholder={t("collector.campaigns.fTitle")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <textarea
            placeholder={t("collector.campaigns.fDesc")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            placeholder={t("collector.campaigns.fRegion")}
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("collector.campaigns.add")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("collector.campaigns.active")}</h2>
        {isLoading ? (
          <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (campaigns?.length ?? 0) === 0 ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Megaphone className="mx-auto mb-2 h-8 w-8" />
            {t("collector.campaigns.empty")}
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {campaigns!.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-4">
                <p className="font-semibold text-foreground">{c.title}</p>
                {c.region && <p className="text-xs text-primary">{c.region}</p>}
                {c.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
