import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { Smartphone, Laptop, Tv, Refrigerator, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/pickup/new")({
  component: NewPickup,
  head: () => ({ meta: [{ title: "New pickup — e-Return" }] }),
});

const DEEE_TYPES = [
  { value: "fridge", labelKey: "deee.fridge", icon: Refrigerator },
  { value: "phone", labelKey: "deee.phone", icon: Smartphone },
  { value: "laptop", labelKey: "deee.laptop", icon: Laptop },
  { value: "tv", labelKey: "deee.tv", icon: Tv },
] as const;

const COUNTIES = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
  "Brașov", "Brăila", "București", "Buzău", "Cluj", "Constanța", "Dolj",
  "Galați", "Iași", "Ilfov", "Mureș", "Prahova", "Sibiu", "Timiș",
];

function NewPickup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deeeType, setDeeeType] = useState<string>("");
  const [county, setCounty] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [CollectionMap, setCollectionMap] = useState<ComponentType<{
    selectedDeeeType?: string;
    height?: string;
  }> | null>(null);

  useEffect(() => {
    let mounted = true;

    import("@/integrations/CollectionMap")
      .then((module) => {
        if (mounted) {
          setCollectionMap(() => module.CollectionMap);
        }
      })
      .catch((error) => {
        console.error("Failed to load collection map:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
        <ArrowLeft className="h-4 w-4" /> {t("pickup.back")}
      </Link>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
        <span className="font-medium text-foreground">{t("pickup.step1")}</span>
        <div className="h-px flex-1 bg-border" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">2</span>
        <span className="text-muted-foreground">{t("pickup.step2")}</span>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">{t("pickup.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("pickup.subtitle")}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          <div>
            <label className="block text-sm font-semibold text-foreground">{t("pickup.deeeType")}</label>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DEEE_TYPES.map(({ value, labelKey, icon: Icon }) => {
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
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-muted-foreground">{t("pickup.orCustom")}</label>
              <input
                value={deeeType} onChange={(e) => setDeeeType(e.target.value)}
                placeholder={t("pickup.customPlaceholder")}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-foreground">{t("pickup.county")}</label>
              <select
                value={county} onChange={(e) => setCounty(e.target.value)} required
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t("pickup.selectCounty")}</option>
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground">{t("pickup.address")}</label>
              <input
                value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder={t("pickup.addressPlaceholder")}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit" disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("pickup.seeOffers")} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="mt-8">
        {CollectionMap ? (
          <CollectionMap selectedDeeeType={deeeType || "all"} height="380px" />
        ) : (
          <div className="flex h-[380px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading map…
          </div>
        )}
      </div>
    </main>
  );
}
