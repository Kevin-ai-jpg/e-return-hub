import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useMyCollector } from "@/lib/collectorContext";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/collector/offers")({
  component: OffersPage,
});

const OfferSchema = z.object({
  deee_type: z.string().trim().min(1).max(50),
  voucher_value_lei: z.coerce.number().int().min(1).max(100000),
  earliest_pickup_days: z.coerce.number().int().min(0).max(365),
  accepts_home_pickup: z.boolean(),
});

function OffersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: collector } = useMyCollector();
  const [form, setForm] = useState({
    deee_type: "",
    voucher_value_lei: "",
    earliest_pickup_days: "1",
    accepts_home_pickup: true,
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ["my-offers", collector?.id],
    enabled: !!collector?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collector_offers")
        .select("*")
        .eq("collector_id", collector!.id)
        .order("voucher_value_lei", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = OfferSchema.parse(form);
      const { error } = await supabase.from("collector_offers").insert({
        ...parsed,
        collector_id: collector!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("collector.offers.added"));
      setForm({ deee_type: "", voucher_value_lei: "", earliest_pickup_days: "1", accepts_home_pickup: true });
      qc.invalidateQueries({ queryKey: ["my-offers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collector_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("collector.offers.removed"));
      qc.invalidateQueries({ queryKey: ["my-offers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("collector.offers.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("collector.offers.subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("collector.offers.newTitle")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            placeholder={t("collector.offers.fDeee")}
            value={form.deee_type}
            onChange={(e) => setForm({ ...form, deee_type: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="number"
            placeholder={t("collector.offers.fValue")}
            value={form.voucher_value_lei}
            onChange={(e) => setForm({ ...form, voucher_value_lei: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="number"
            placeholder={t("collector.offers.fDays")}
            value={form.earliest_pickup_days}
            onChange={(e) => setForm({ ...form, earliest_pickup_days: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.accepts_home_pickup}
              onChange={(e) => setForm({ ...form, accepts_home_pickup: e.target.checked })}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            {t("collector.offers.fHome")}
          </label>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("collector.offers.add")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : (offers?.length ?? 0) === 0 ? (
          <div className="p-12 text-center">
            <Tag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t("collector.offers.empty")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("collector.offers.cDeee")}</th>
                <th className="px-4 py-3">{t("collector.offers.cValue")}</th>
                <th className="px-4 py-3">{t("collector.offers.cDays")}</th>
                <th className="px-4 py-3">{t("collector.offers.cHome")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {offers!.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 capitalize text-foreground">{o.deee_type}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{o.voucher_value_lei} lei</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.earliest_pickup_days}d</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.accepts_home_pickup ? "✓" : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove.mutate(o.id)}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
