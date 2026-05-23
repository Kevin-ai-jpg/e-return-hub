import { createFileRoute, Link } from "@tanstack/react-router";
import { Recycle, Coins, Shield, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-primary">
            <Recycle className="h-3.5 w-3.5" /> Romania's e-waste marketplace
          </span>
          <h1 className="mt-6 text-5xl sm:text-7xl font-bold tracking-tight text-foreground">
            Recycle. <span className="text-primary">Earn.</span> Protect.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Turn your old electronics into vouchers. Compare offers from certified collectors,
            schedule pickup, and get rewarded for doing the right thing.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              Get started — it's free
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition hover:bg-secondary"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { icon: Recycle, title: "Choose your e-waste", desc: "Phones, laptops, appliances — tell us what you want to recycle." },
            { icon: Coins, title: "Compare offers", desc: "Certified collectors compete with voucher offers in lei." },
            { icon: MapPin, title: "Pickup or drop-off", desc: "Schedule home pickup or find the nearest collection point." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6 transition hover:border-accent hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <p className="text-sm sm:text-base">Compliant with Romanian DEEE regulations · Certified collectors only</p>
          </div>
          <Link to="/register" className="rounded-md bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary">
            Start recycling
          </Link>
        </div>
      </section>
    </main>
  );
}
