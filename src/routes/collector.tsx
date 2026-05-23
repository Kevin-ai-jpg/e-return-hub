import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  Tag,
  Megaphone,
  MapPin,
  Building2,
  LogOut,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/collector")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: "/collector/dashboard" } as never });
    }
  },
  component: CollectorLayout,
  head: () => ({ meta: [{ title: "Collector Workspace — e-Return" }] }),
});

function CollectorLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Verify the signed-in user is a collector and has a collectors row.
  const { data: gate, isLoading } = useQuery({
    queryKey: ["collector-gate", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: profile }, { data: collector }] = await Promise.all([
        supabase.from("users").select("role,name").eq("id", user!.id).maybeSingle(),
        supabase.from("collectors").select("id,company_name").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { profile, collector };
    },
  });

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("collector.gateChecking")}
      </div>
    );
  }

  const isCollector = gate?.profile?.role === "collector" && !!gate?.collector;
  if (!isCollector) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">{t("collector.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("collector.accessDeniedDesc")}</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("collector.backHome")}
        </Link>
      </main>
    );
  }

  const items = [
    { to: "/collector/dashboard", label: t("collector.nav.dashboard"), icon: LayoutDashboard },
    { to: "/collector/pickups", label: t("collector.nav.pickups"), icon: Package },
    { to: "/collector/offers", label: t("collector.nav.offers"), icon: Tag },
    { to: "/collector/campaigns", label: t("collector.nav.campaigns"), icon: Megaphone },
    { to: "/collector/points", label: t("collector.nav.points"), icon: MapPin },
    { to: "/collector/company", label: t("collector.nav.company"), icon: Building2 },
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="md:sticky md:top-20 md:h-fit">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {gate.collector?.company_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <nav className="mt-3 space-y-1">
            {items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => supabase.auth.signOut({ scope: "global" }).then(() => signOut())}
            className="mt-3 flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("collector.signOutAll")}
          </button>
        </div>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
