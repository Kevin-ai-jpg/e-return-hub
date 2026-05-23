import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, MapPin, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/collector")({
  component: CollectorView,
  head: () => ({ meta: [{ title: "Collector Dashboard — e-Return" }] }),
});

type PickupRow = {
  id: string;
  user_id: string | null;
  collector_id: string | null;
  offer_id: string | null;
  deee_type: string | null;
  status: string | null;
  scheduled_date: string | null;
  address: string | null;
  created_at: string | null;
};

function CollectorView() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: pickups, isLoading, error } = useQuery({
    queryKey: ["collector-pickups"],
    queryFn: async (): Promise<PickupRow[]> => {
      const { data, error } = await supabase
        .from("pickup_requests")
        .select("*")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("collector.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("collector.subtitle")}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          <span className="text-muted-foreground">{t("collector.pending")} </span>
          <span className="font-semibold text-primary">{pickups?.length ?? 0}</span>
        </div>
      </header>

      <section className="mt-8">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("collector.loading")}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {t("collector.failed")}
          </div>
        )}
        {!isLoading && !error && (pickups?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">{t("collector.none")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("collector.noneHint")}</p>
          </div>
        )}

        <ul className="space-y-4">
          {pickups?.map((p) => (
            <PickupCard key={p.id} pickup={p} onDone={() => qc.invalidateQueries({ queryKey: ["collector-pickups"] })} />
          ))}
        </ul>
      </section>
    </main>
  );
}

function PickupCard({ pickup, onDone }: { pickup: PickupRow; onDone: () => void }) {
  const { t } = useTranslation();
  const [kg, setKg] = useState<string>("");

  const confirm = useMutation({
    mutationFn: async () => {
      const kgNum = parseFloat(kg);
      if (!kgNum || kgNum <= 0) throw new Error(t("collector.invalidKg"));

      const { error: cErr } = await supabase
        .from("collections")
        .insert({ pickup_request_id: pickup.id, kg_collected: kgNum });
      if (cErr) throw cErr;

      const { error: uErr } = await supabase
        .from("pickup_requests")
        .update({ status: "completed" })
        .eq("id", pickup.id);
      if (uErr) throw uErr;
    },
    onSuccess: () => {
      toast.success(t("collector.confirmed"), { description: t("collector.recorded", { kg }) });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message || t("collector.couldNot")),
  });

  return (
    <li className="rounded-xl border border-border bg-card p-5 transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <p className="text-base font-semibold capitalize text-foreground">
                {t("collector.pickupOf", { type: pickup.deee_type ?? "DEEE" })}
              </p>
              <p className="text-xs text-muted-foreground">{t("collector.request")} #{pickup.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            {pickup.address && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {pickup.address}
              </p>
            )}
            {pickup.scheduled_date && (
              <p className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {new Date(pickup.scheduled_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder="kg"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              kg
            </span>
          </div>
          <button
            onClick={() => confirm.mutate()}
            disabled={confirm.isPending || !kg}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            {confirm.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {t("collector.confirm")}
          </button>
        </div>
      </div>
    </li>
  );
}
