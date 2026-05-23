import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Star, Home, MapPin, Calendar, Truck, Check } from "lucide-react";

type OffersSearch = {
  deeeType: string;
  county: string;
  address?: string;
};

export const Route = createFileRoute("/pickup/offers")({
  validateSearch: (search: Record<string, unknown>): OffersSearch => ({
    deeeType: (search.deeeType as string) || "",
    county: (search.county as string) || "",
    address: (search.address as string) || undefined,
  }),
  component: OffersPanel,
  head: () => ({ meta: [{ title: "Choose your offer — e-Return" }] }),
});

type Offer = {
  id: string;
  companyName: string;
  logoInitials: string;
  logoColor: string;
  voucherLei: number;
  rating: number;
  pickupMethod: "home" | "dropoff" | "both";
  earliestDays: number;
  distanceKm: number;
};

// Mock offers — replace with Supabase query later:
// SELECT co.*, c.company_name, c.logo_url, c.rating
// FROM collector_offers co JOIN collectors c ON co.collector_id = c.id
// WHERE co.deee_type = $type AND $county = ANY(c.service_area_counties)
const MOCK_OFFERS: Offer[] = [
  { id: "1", companyName: "EcoTec România", logoInitials: "ET", logoColor: "bg-primary",
    voucherLei: 120, rating: 4.8, pickupMethod: "both", earliestDays: 1, distanceKm: 2.3 },
  { id: "2", companyName: "GreenCycle SRL", logoInitials: "GC", logoColor: "bg-accent",
    voucherLei: 95, rating: 4.5, pickupMethod: "home", earliestDays: 2, distanceKm: 4.1 },
  { id: "3", companyName: "ReVolt Recycling", logoInitials: "RV", logoColor: "bg-primary/80",
    voucherLei: 80, rating: 4.2, pickupMethod: "dropoff", earliestDays: 3, distanceKm: 1.5 },
];

type SortKey = "voucher" | "rating" | "distance" | "earliest";

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-4 w-4 ${n <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}

function PickupBadge({ method }: { method: Offer["pickupMethod"] }) {
  const map = {
    home: { icon: Home, label: "Home pickup" },
    dropoff: { icon: MapPin, label: "Drop-off only" },
    both: { icon: Truck, label: "Home or drop-off" },
  } as const;
  const { icon: Icon, label } = map[method];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function OfferCard({ offer, isBest, onSelect, selected }: {
  offer: Offer; isBest: boolean; selected: boolean; onSelect: () => void;
}) {
  return (
    <article
      className={`relative rounded-2xl border-2 bg-card p-6 transition ${
        selected ? "border-primary shadow-lg shadow-primary/10"
        : "border-border hover:border-accent hover:shadow-md"
      }`}
    >
      {isBest && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
          Best offer
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Logo + company */}
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-primary-foreground ${offer.logoColor}`}>
            {offer.logoInitials}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{offer.companyName}</h3>
            <StarRating value={offer.rating} />
          </div>
        </div>

        {/* Voucher value — prominent */}
        <div className="text-right">
          <div className="text-4xl font-bold leading-none tracking-tight text-primary">
            {offer.voucherLei}
            <span className="ml-1 text-base font-semibold text-muted-foreground">lei</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Voucher value</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <PickupBadge method={offer.pickupMethod} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
          <Calendar className="h-3.5 w-3.5" /> Earliest: in {offer.earliestDays}d
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
          <MapPin className="h-3.5 w-3.5" /> {offer.distanceKm} km
        </span>
      </div>

      <button
        onClick={onSelect}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-foreground text-background hover:bg-primary"
        }`}
      >
        {selected ? <><Check className="h-4 w-4" /> Selected</> : "Select offer"}
      </button>
    </article>
  );
}

function OffersPanel() {
  const { deeeType, county } = Route.useSearch();
  const [sortBy, setSortBy] = useState<SortKey>("voucher");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const arr = [...MOCK_OFFERS];
    switch (sortBy) {
      case "voucher": return arr.sort((a, b) => b.voucherLei - a.voucherLei);
      case "rating": return arr.sort((a, b) => b.rating - a.rating);
      case "distance": return arr.sort((a, b) => a.distanceKm - b.distanceKm);
      case "earliest": return arr.sort((a, b) => a.earliestDays - b.earliestDays);
    }
  }, [sortBy]);

  const bestId = useMemo(
    () => MOCK_OFFERS.reduce((a, b) => (b.voucherLei > a.voucherLei ? b : a)).id,
    [],
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/pickup/new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Stepper */}
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          <Check className="h-4 w-4" />
        </span>
        <span className="text-muted-foreground">What & where</span>
        <div className="h-px flex-1 bg-primary/40" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
        <span className="font-medium text-foreground">Choose offer</span>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {sorted.length} offers for your <span className="text-primary capitalize">{deeeType || "item"}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collectors near {county || "your area"} are competing for your e-waste.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Sort by</label>
          <select
            value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="voucher">Highest voucher</option>
            <option value="rating">Best rating</option>
            <option value="distance">Nearest</option>
            <option value="earliest">Earliest pickup</option>
          </select>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {sorted.map((offer) => (
          <OfferCard
            key={offer.id} offer={offer}
            isBest={offer.id === bestId}
            selected={selectedId === offer.id}
            onSelect={() => setSelectedId(offer.id)}
          />
        ))}
      </div>

      {selectedId && (
        <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-xl border border-primary/30 bg-card p-4 shadow-lg">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{MOCK_OFFERS.find((o) => o.id === selectedId)?.companyName}</span> selected
          </p>
          <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Confirm & schedule pickup
          </button>
        </div>
      )}
    </main>
  );
}
