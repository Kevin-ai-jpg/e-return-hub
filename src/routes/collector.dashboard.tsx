import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useMyCollector } from "@/lib/collectorContext";
import { Package, Scale, Ticket, TrendingUp, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/collector/dashboard")({
  component: CollectorDashboard,
});

function CollectorDashboard() {
  const { t } = useTranslation();
  const { data: collector } = useMyCollector();
  const collectorId = collector?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["collector-stats", collectorId],
    enabled: !!collectorId,
    queryFn: async () => {
      const [pickupsRes, collectionsRes] = await Promise.all([
        supabase
          .from("pickup_requests")
          .select("id,status,deee_type,scheduled_date,created_at,offer_id")
          .eq("collector_id", collectorId!),
        supabase
          .from("collections")
          .select("kg_collected,confirmed_at,pickup_request_id,pickup_requests!inner(collector_id)")
          .eq("pickup_requests.collector_id", collectorId!),
      ]);
      if (pickupsRes.error) throw pickupsRes.error;
      if (collectionsRes.error) throw collectionsRes.error;

      const pickups = pickupsRes.data ?? [];
      const collections = (collectionsRes.data ?? []) as Array<{
        kg_collected: number | null;
        confirmed_at: string | null;
      }>;

      // Voucher value via offer_id → collector_offers
      const offerIds = [...new Set(pickups.map((p) => p.offer_id).filter(Boolean))] as string[];
      let voucherTotal = 0;
      let voucherCount = 0;
      if (offerIds.length) {
        const { data: offers } = await supabase
          .from("collector_offers")
          .select("id,voucher_value_lei")
          .in("id", offerIds);
        const offerMap = new Map((offers ?? []).map((o) => [o.id, o.voucher_value_lei]));
        for (const p of pickups) {
          if (p.status === "completed" && p.offer_id) {
            voucherTotal += offerMap.get(p.offer_id) ?? 0;
            voucherCount++;
          }
        }
      }

      const totalKg = collections.reduce((s, c) => s + (c.kg_collected ?? 0), 0);
      const pending = pickups.filter((p) => p.status === "pending").length;

      // 12-week kg series
      const weeks: { week: string; kg: number }[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        weeks.push({ week: `${d.getMonth() + 1}/${d.getDate()}`, kg: 0 });
      }
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 11 * 7);
      for (const c of collections) {
        if (!c.confirmed_at) continue;
        const d = new Date(c.confirmed_at);
        const diffWeeks = Math.floor((d.getTime() - weekStart.getTime()) / (7 * 86400000));
        if (diffWeeks >= 0 && diffWeeks < 12) weeks[diffWeeks].kg += c.kg_collected ?? 0;
      }

      return { totalKg, pending, voucherTotal, voucherCount, weeks, pickups };
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("collector.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("collector.dash.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("collector.dash.subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Scale}
          label={t("collector.kpi.kg")}
          value={`${stats.totalKg.toFixed(1)} kg`}
        />
        <StatCard icon={Package} label={t("collector.kpi.pending")} value={stats.pending} />
        <StatCard
          icon={Ticket}
          label={t("collector.kpi.vouchers")}
          value={stats.voucherCount}
        />
        <StatCard
          icon={TrendingUp}
          label={t("collector.kpi.value")}
          value={`${stats.voucherTotal} lei`}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("collector.dash.chart")}</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeks}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="week" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("collector.dash.recent")}</h2>
        <ul className="mt-4 divide-y divide-border">
          {stats.pickups
            .slice()
            .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
            .slice(0, 10)
            .map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="capitalize text-foreground">
                  {p.deee_type ?? "DEEE"} · {p.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                </span>
              </li>
            ))}
          {stats.pickups.length === 0 && (
            <li className="py-4 text-sm text-muted-foreground">{t("collector.dash.empty")}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
