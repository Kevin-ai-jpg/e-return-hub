import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, Star, Home, MapPin, Calendar as CalendarIcon, Truck, Check, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";
import { ensureUserProfile } from "@/lib/ensureUserProfile";

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

type OfferRow = {
  id: string;
  collector_id: string | null;
  deee_type: string | null;
  voucher_value_lei: number;
  earliest_pickup_days: number | null;
  accepts_home_pickup: boolean | null;
  collectors: {
    company_name: string;
    logo_url: string | null;
    rating: number | null;
  } | null;
};

async function fetchOffers(deeeType: string, county: string): Promise<OfferRow[]> {
  const { data, error } = await supabase
    .from("collector_offers")
    .select(`
      id,
      collector_id,
      deee_type,
      voucher_value_lei,
      earliest_pickup_days,
      accepts_home_pickup,
      collectors!inner (
        company_name,
        logo_url,
        rating,
        service_area_counties
      )
    `)
    .eq("deee_type", deeeType)
    .contains("collectors.service_area_counties", [county])
    .order("voucher_value_lei", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OfferRow[];
}

type SortKey = "voucher" | "rating" | "earliest";

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

function PickupBadge({ acceptsHome }: { acceptsHome: boolean }) {
  const { t } = useTranslation();
  const Icon = acceptsHome ? Home : MapPin;
  const label = acceptsHome ? t("offers.homePickup") : t("offers.dropoff");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function CompanyAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl} alt={`${name} logo`}
        className="h-12 w-12 rounded-xl border border-border object-cover"
      />
    );
  }
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
      {initials}
    </div>
  );
}

function OfferCard({
  offer, isBest, onSelect,
}: {
  offer: OfferRow; isBest: boolean; onSelect: () => void;
}) {
  const { t } = useTranslation();
  const company = offer.collectors;
  const rating = company?.rating ?? 0;

  return (
    <article className={`relative rounded-2xl border-2 bg-card p-6 transition hover:shadow-md ${
      isBest ? "border-primary/40" : "border-border hover:border-accent"
    }`}>
      {isBest && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
          {t("offers.best")}
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CompanyAvatar name={company?.company_name ?? "Collector"} logoUrl={company?.logo_url ?? null} />
          <div>
            <h3 className="text-base font-semibold text-foreground">{company?.company_name ?? "Collector"}</h3>
            <StarRating value={rating} />
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-bold leading-none tracking-tight text-primary">
            {offer.voucher_value_lei}
            <span className="ml-1 text-base font-semibold text-muted-foreground">lei</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{t("offers.voucherValue")}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <PickupBadge acceptsHome={offer.accepts_home_pickup ?? false} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
          <CalendarIcon className="h-3.5 w-3.5" /> {t("offers.earliestIn", { days: offer.earliest_pickup_days ?? 1 })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
          <Truck className="h-3.5 w-3.5" /> {t("offers.certified")}
        </span>
      </div>

      <button
        onClick={onSelect}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-primary"
      >
        {t("offers.select")}
      </button>
    </article>
  );
}

function OffersPanel() {
  const { t } = useTranslation();
  const { deeeType, county, address } = Route.useSearch();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortKey>("voucher");
  const [selectedOffer, setSelectedOffer] = useState<OfferRow | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["offers", deeeType, county],
    queryFn: () => fetchOffers(deeeType, county),
    enabled: Boolean(deeeType && county),
  });

  const offers = data ?? [];

  const sorted = useMemo(() => {
    const arr = [...offers];
    switch (sortBy) {
      case "voucher": return arr.sort((a, b) => b.voucher_value_lei - a.voucher_value_lei);
      case "rating": return arr.sort((a, b) => (b.collectors?.rating ?? 0) - (a.collectors?.rating ?? 0));
      case "earliest": return arr.sort((a, b) => (a.earliest_pickup_days ?? 99) - (b.earliest_pickup_days ?? 99));
    }
  }, [offers, sortBy]);

  const bestId = useMemo(() => {
    if (offers.length === 0) return null;
    return offers.reduce((a, b) => (b.voucher_value_lei > a.voucher_value_lei ? b : a)).id;
  }, [offers]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOffer || !scheduledDate) throw new Error("Missing offer or date");
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("You must be logged in to schedule a pickup.");

      await ensureUserProfile(userData.user);

      const { error: insertErr } = await supabase.from("pickup_requests").insert({
        user_id: userData.user.id,
        collector_id: selectedOffer.collector_id,
        offer_id: selectedOffer.id,
        deee_type: selectedOffer.deee_type,
        status: "pending",
        scheduled_date: format(scheduledDate, "yyyy-MM-dd"),
        address: address ?? null,
      });
      if (insertErr) throw new Error(insertErr.message);
    },
    onSuccess: () => {
      toast.success(t("offers.scheduled"), {
        description: `${selectedOffer?.collectors?.company_name} • ${
          scheduledDate ? format(scheduledDate, "PPP") : ""
        }`,
      });
      setSelectedOffer(null);
      setScheduledDate(undefined);
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => {
      toast.error(t("offers.couldNot"), { description: e.message });
    },
  });

  const minDate = useMemo(() => {
    const d = new Date();
    const offset = selectedOffer?.earliest_pickup_days ?? 1;
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedOffer]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/pickup/new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("offers.back")}
      </Link>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </span>
        <span className="text-muted-foreground">{t("pickup.step1")}</span>
        <div className="h-px flex-1 bg-primary/40" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
        <span className="font-medium text-foreground">{t("pickup.step2")}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("offers.titleFor")} <span className="text-primary capitalize">{deeeType || t("offers.itemFallback")}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("offers.serving")} <span className="font-medium text-foreground">{county || t("offers.areaFallback")}</span> {t("offers.competing")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">{t("offers.sortBy")}</label>
          <select
            value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="voucher">{t("offers.sort.voucher")}</option>
            <option value="rating">{t("offers.sort.rating")}</option>
            <option value="earliest">{t("offers.sort.earliest")}</option>
          </select>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> {t("offers.loading")}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="text-sm font-medium text-destructive">{t("offers.errorTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{(error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{t("offers.tryAgain")}</Button>
          </div>
        )}

        {!isLoading && !error && sorted.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-sm font-medium text-foreground">{t("offers.noneTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("offers.noneHint", { county, deeeType })}
            </p>
            <Link to="/pickup/new" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              {t("offers.changeSelection")}
            </Link>
          </div>
        )}

        {sorted.map((offer) => (
          <OfferCard
            key={offer.id} offer={offer}
            isBest={offer.id === bestId}
            onSelect={() => {
              setSelectedOffer(offer);
              const d = new Date();
              d.setDate(d.getDate() + (offer.earliest_pickup_days ?? 1));
              setScheduledDate(d);
            }}
          />
        ))}
      </div>

      <Dialog
        open={!!selectedOffer}
        onOpenChange={(open) => { if (!open) { setSelectedOffer(null); setScheduledDate(undefined); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("offers.schedule")}</DialogTitle>
            <DialogDescription>
              {selectedOffer?.collectors?.company_name} • {selectedOffer?.voucher_value_lei} lei
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t("offers.pickDate")}</p>
            <p className="text-xs text-muted-foreground">
              {t("offers.earliestAvailable", { days: selectedOffer?.earliest_pickup_days ?? 1 })}
            </p>
            <div className="flex justify-center rounded-md border border-border">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                disabled={(d) => d < minDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setSelectedOffer(null); setScheduledDate(undefined); }}
              disabled={bookMutation.isPending}
            >
              {t("offers.cancel")}
            </Button>
            <Button
              onClick={() => bookMutation.mutate()}
              disabled={!scheduledDate || bookMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {bookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("offers.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
