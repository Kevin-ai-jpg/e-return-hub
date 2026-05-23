import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, MapPin, Calendar, CheckCircle2, Loader2, Check } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useMyCollector } from "@/lib/collectorContext";

export const Route = createFileRoute("/collector/pickups")({
  component: CollectorPickups,
});

type PickupRow = {
  id: string;
  deee_type: string | null;
  status: string | null;
  scheduled_date: string | null;
  address: string | null;
};

function CollectorPickups() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: collector } = useMyCollector();

  const { data: pickups, isLoading } = useQuery({
    queryKey: ["collector-pickups", collector?.id],
    enabled: !!collector?.id,
    queryFn: async (): Promise<PickupRow[]> => {
      const { data, error } = await supabase
        .from("pickup_requests")
        .select("id,deee_type,status,scheduled_date,address")
        .eq("collector_id", collector!.id)
        .in("status", ["pending", "accepted"])
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pending = pickups?.filter((p) => p.status === "pending") ?? [];
  const accepted = pickups?.filter((p) => p.status === "accepted") ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["collector-pickups"] });

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("collector.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("collector.subtitle")}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-muted-foreground">Pending </span>
            <span className="font-semibold text-amber-600">{pending.length}</span>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-muted-foreground">Accepted </span>
            <span className="font-semibold text-blue-600">{accepted.length}</span>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("collector.loading")}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          New requests
        </h2>
        {pending.length === 0 && !isLoading ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No new requests.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <PendingCard key={p.id} pickup={p} onDone={invalidate} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Accepted — awaiting collection
        </h2>
        {accepted.length === 0 && !isLoading ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No accepted pickups yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {accepted.map((p) => (
              <AcceptedCard key={p.id} pickup={p} onDone={invalidate} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PickupHeader({ pickup }: { pickup: PickupRow }) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Package className="h-4 w-4" />
        </span>
        <div>
          <p className="text-base font-semibold capitalize text-foreground">
            {t("collector.pickupOf", { type: pickup.deee_type ?? "DEEE" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("collector.request")} #{pickup.id.slice(0, 8)}
          </p>
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
  );
}

function PendingCard({ pickup, onDone }: { pickup: PickupRow; onDone: () => void }) {
  const accept = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pickup_requests")
        .update({ status: "accepted" })
        .eq("id", pickup.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pickup accepted", { description: "The citizen will be notified by email." });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message || "Could not accept pickup"),
  });

  return (
    <li className="rounded-xl border border-amber-200 bg-card p-5 transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PickupHeader pickup={pickup} />
        <button
          onClick={() => accept.mutate()}
          disabled={accept.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Accept
        </button>
      </div>
    </li>
  );
}

function AcceptedCard({ pickup, onDone }: { pickup: PickupRow; onDone: () => void }) {
  const { t } = useTranslation();
  const [kg, setKg] = useState("");

  const confirm = useMutation({
    mutationFn: async () => {
      const kgNum = parseFloat(kg);
      if (!kgNum || kgNum <= 0 || kgNum > 10000) throw new Error(t("collector.invalidKg"));
      const { error: cErr } = await supabase.from("collections").insert({
        pickup_request_id: pickup.id,
        kg_collected: kgNum,
        confirmed_at: new Date().toISOString(),
      });
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
    <li className="rounded-xl border border-blue-200 bg-card p-5 transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PickupHeader pickup={pickup} />
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
              className="w-28 rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
            Confirm collection
          </button>
        </div>
      </div>
    </li>
  );
}
