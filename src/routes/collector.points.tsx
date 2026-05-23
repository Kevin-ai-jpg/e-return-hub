import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useMyCollector } from "@/lib/collectorContext";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, Loader2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/collector/points")({
  component: PointsPage,
});

const Schema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(255),
  contact: z.string().trim().max(80).optional().or(z.literal("")),
  schedule: z.string().trim().max(120).optional().or(z.literal("")),
});

function PointsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: collector } = useMyCollector();
  const [form, setForm] = useState({ name: "", address: "", contact: "", schedule: "" });

  const { data: points, isLoading } = useQuery({
    queryKey: ["my-points", collector?.id],
    enabled: !!collector?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_points")
        .select("*")
        .eq("collector_id", collector!.id);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = Schema.parse(form);
      const { error } = await supabase.from("collection_points").insert({
        name: parsed.name,
        address: parsed.address,
        contact: parsed.contact || null,
        schedule: parsed.schedule || null,
        collector_id: collector!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("collector.points.added"));
      setForm({ name: "", address: "", contact: "", schedule: "" });
      qc.invalidateQueries({ queryKey: ["my-points"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collection_points").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-points"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("collector.points.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("collector.points.subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder={t("collector.points.fName")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            placeholder={t("collector.points.fAddr")}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            placeholder={t("collector.points.fContact")}
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            placeholder={t("collector.points.fSchedule")}
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t("collector.points.add")}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {isLoading ? (
          <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (points?.length ?? 0) === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t("collector.points.empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {points!.map((p) => (
              <li key={p.id} className="flex items-start justify-between p-4">
                <div>
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.address}</p>
                  {p.schedule && <p className="text-xs text-muted-foreground">{p.schedule}</p>}
                  {p.contact && <p className="text-xs text-muted-foreground">{p.contact}</p>}
                </div>
                <button
                  onClick={() => remove.mutate(p.id)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
