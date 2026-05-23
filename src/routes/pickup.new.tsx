import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Smartphone, Laptop, Tv, Refrigerator, ArrowRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/pickup/new")({
  component: NewPickup,
  head: () => ({ meta: [{ title: "New pickup — e-Return" }] }),
});

const DEEE_TYPES = [
  { value: "fridge", label: "Fridge", icon: Refrigerator },
  { value: "phone", label: "Phone", icon: Smartphone },
  { value: "laptop", label: "Laptop", icon: Laptop },
  { value: "tv", label: "TV", icon: Tv },
] as const;

const COUNTIES = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
  "Brașov", "Brăila", "București", "Buzău", "Cluj", "Constanța", "Dolj",
  "Galați", "Iași", "Ilfov", "Mureș", "Prahova", "Sibiu", "Timiș",
];

function NewPickup() {
  const navigate = useNavigate();
  const [deeeType, setDeeeType] = useState<string>("");
  const [county, setCounty] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const canContinue = deeeType && county;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    navigate({
      to: "/pickup/offers",
      search: { deeeType, county, address: address || undefined },
    });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Stepper */}
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
        <span className="font-medium text-foreground">What & where</span>
        <div className="h-px flex-1 bg-border" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">2</span>
        <span className="text-muted-foreground">Choose offer</span>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">What are you recycling?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us the item type and your location to see competing offers from certified collectors.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          {/* DEEE type */}
          <div>
            <label className="block text-sm font-semibold text-foreground">DEEE type</label>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DEEE_TYPES.map(({ value, label, icon: Icon }) => {
                const selected = deeeType === value;
                return (
                  <button
                    key={value} type="button" onClick={() => setDeeeType(value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition ${
                      selected
                        ? "border-primary bg-secondary text-primary"
                        : "border-border bg-background text-foreground hover:border-accent"
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-muted-foreground">Or type custom</label>
              <input
                value={deeeType} onChange={(e) => setDeeeType(e.target.value)}
                placeholder="e.g. microwave"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-foreground">County</label>
              <select
                value={county} onChange={(e) => setCounty(e.target.value)} required
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select county…</option>
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground">Address (optional)</label>
              <input
                value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, number"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit" disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            See offers <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
