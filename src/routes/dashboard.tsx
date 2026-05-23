import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Ticket, Leaf, ArrowRight, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — e-Return" }] }),
});

// Mock summary data — wire to Supabase later
const summary = {
  pendingPickups: 2,
  activeVouchers: { count: 3, totalLei: 175 },
  ecoImpact: { kg: 12.4, co2Kg: 38 },
  recentActivity: [
    { id: 1, label: "Pickup scheduled — Old fridge", date: "May 24", status: "pending" },
    { id: 2, label: "Voucher earned — 80 lei", date: "May 18", status: "active" },
    { id: 3, label: "Laptop collected (3.2 kg)", date: "May 10", status: "done" },
  ],
};

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
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your recycling activity.</p>
        </div>
        <Link
          to="/pickup/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New pickup
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Package}
          label="Pending pickups"
          value={summary.pendingPickups}
          hint="Awaiting collector confirmation"
        />
        <StatCard
          icon={Ticket}
          label="Active vouchers"
          value={`${summary.activeVouchers.totalLei} lei`}
          hint={`${summary.activeVouchers.count} vouchers available`}
          accent
        />
        <StatCard
          icon={Leaf}
          label="Eco-impact"
          value={`${summary.ecoImpact.kg} kg`}
          hint={`~${summary.ecoImpact.co2Kg} kg CO₂ saved`}
        />
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
          <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {summary.recentActivity.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                item.status === "pending" ? "bg-accent/15 text-primary"
                : item.status === "active" ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
              }`}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
