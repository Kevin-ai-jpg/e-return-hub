import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Ticket, Leaf, ArrowRight, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — e-Return" }] }),
});

type DashboardSummary = {
  pendingPickups: number;
  activeVouchers: { count: number; totalLei: number };
  ecoImpact: { kg: number; co2Kg: number };
  recentActivity: Array<{
    id: string;
    label: string;
    date: string;
    status: "pending" | "accepted" | "completed" | "active";
  }>;
};

const CO2_PER_KG = 3;

async function loadSummary(): Promise<DashboardSummary> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    return {
      pendingPickups: 0,
      activeVouchers: { count: 0, totalLei: 0 },
      ecoImpact: { kg: 0, co2Kg: 0 },
      recentActivity: [],
    };
  }

  const [pickupsRes, vouchersRes, collectionsRes] = await Promise.all([
    supabase
      .from("pickup_requests")
      .select("id, deee_type, status, scheduled_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vouchers")
      .select("id, value_lei, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("collections")
      .select("id, kg_collected, confirmed_at, pickup_request_id, pickup_requests!inner(user_id)")
      .eq("pickup_requests.user_id", userId),
  ]);

  const pickups = pickupsRes.data ?? [];
  const vouchers = vouchersRes.data ?? [];
  const collections = collectionsRes.data ?? [];

  const activeVouchers = vouchers.filter((v) => (v.status ?? "active") === "active");
  const totalLei = activeVouchers.reduce((sum, v) => sum + (v.value_lei ?? 0), 0);
  const totalKg = collections.reduce(
    (sum, c) => sum + (Number(c.kg_collected) || 0),
    0,
  );

  const recent: DashboardSummary["recentActivity"] = [];
  for (const p of pickups.slice(0, 3)) {
    const s = (p.status ?? "pending") as "pending" | "accepted" | "completed";
    recent.push({
      id: `p-${p.id}`,
      label: `${p.deee_type ?? "DEEE"}`,
      date: new Date(p.created_at ?? Date.now()).toLocaleDateString(),
      status: s,
    });
  }
  for (const v of activeVouchers.slice(0, 2)) {
    recent.push({
      id: `v-${v.id}`,
      label: `Voucher — ${v.value_lei ?? 0} lei`,
      date: new Date(v.created_at ?? Date.now()).toLocaleDateString(),
      status: "active",
    });
  }

  return {
    pendingPickups: pickups.filter((p) => p.status === "pending").length,
    activeVouchers: { count: activeVouchers.length, totalLei },
    ecoImpact: {
      kg: Math.round(totalKg * 10) / 10,
      co2Kg: Math.round(totalKg * CO2_PER_KG),
    },
    recentActivity: recent.slice(0, 5),
  };
}

function StatCard({
  icon: Icon, label, value, hint, accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: React.ReactNode; hint?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-6 transition hover:shadow-md ${accent ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? "bg-primary-foreground/15" : "bg-secondary text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight">{value}</div>
      {hint && <p className={`mt-1 text-xs ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: loadSummary,
  });

  const summary: DashboardSummary = data ?? {
    pendingPickups: 0,
    activeVouchers: { count: 0, totalLei: 0 },
    ecoImpact: { kg: 0, co2Kg: 0 },
    recentActivity: [],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("dash.welcome")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("dash.subtitle")}</p>
        </div>
        <Link
          to="/pickup/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> {t("dash.newPickup")}
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Package}
          label={t("dash.pending")}
          value={isLoading ? "—" : summary.pendingPickups}
          hint={t("dash.pendingHint")}
        />
        <StatCard
          icon={Ticket}
          label={t("dash.active")}
          value={isLoading ? "—" : `${summary.activeVouchers.totalLei} lei`}
          hint={t("dash.activeHint", { count: summary.activeVouchers.count })}
          accent
        />
        <StatCard
          icon={Leaf}
          label={t("dash.eco")}
          value={isLoading ? "—" : `${summary.ecoImpact.kg} kg`}
          hint={t("dash.ecoHint", { co2: summary.ecoImpact.co2Kg })}
        />
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{t("dash.recent")}</h2>
          <Link to="/vouchers" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            {t("dash.viewVouchers")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center px-6 py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("dash.loading")}
          </div>
        ) : summary.recentActivity.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">{t("dash.noActivity")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("dash.noActivityHint")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {summary.recentActivity.map((item) => {
              const badge =
                item.status === "pending"
                  ? { cls: "bg-amber-100 text-amber-800", label: "🟡 Așteptare colector" }
                  : item.status === "accepted"
                    ? { cls: "bg-blue-100 text-blue-800", label: "🔵 Programat" }
                    : item.status === "completed"
                      ? { cls: "bg-emerald-100 text-emerald-800", label: "🟢 Ridicat — voucher generat" }
                      : { cls: "bg-primary text-primary-foreground", label: "Voucher activ" };
              return (
                <li key={item.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
