import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Recycle, Coins, Shield, MapPin, QrCode } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  const [siteUrl, setSiteUrl] = useState("https://e-return.app");
  useEffect(() => {
    if (typeof window !== "undefined") setSiteUrl(window.location.origin);
  }, []);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(siteUrl)}`;
  const features = [
    { icon: Recycle, title: t("landing.feature1.title"), desc: t("landing.feature1.desc") },
    { icon: Coins, title: t("landing.feature2.title"), desc: t("landing.feature2.desc") },
    { icon: MapPin, title: t("landing.feature3.title"), desc: t("landing.feature3.desc") },
  ];
  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-primary">
            <Recycle className="h-3.5 w-3.5" /> {t("landing.badge")}
          </span>
          <h1 className="mt-6 text-5xl sm:text-7xl font-bold tracking-tight text-foreground">
            {t("landing.title.recycle")} <span className="text-primary">{t("landing.title.earn")}</span> {t("landing.title.protect")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("landing.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              {t("landing.cta.primary")}
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition hover:bg-secondary"
            >
              {t("landing.cta.secondary")}
            </Link>
          </div>
          <div className="mt-6">
            <Link
              to="/apply-collector"
              className="inline-flex items-center gap-2 rounded-md border-2 border-[#1B5E20] bg-[#E8F5E9] px-6 py-3 text-base font-semibold text-[#1B5E20] shadow-sm transition hover:bg-[#1B5E20] hover:text-white"
            >
              <Recycle className="h-4 w-4" />
              {t("landing.cta.partner")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
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

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-base font-semibold text-foreground">{t("landing.map.title")}</h3>
                <p className="text-xs text-muted-foreground">{t("landing.map.desc")}</p>
              </div>
            </div>
            <iframe
              title="Romania collection points map"
              className="block h-[360px] w-full border-0"
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=20.2%2C43.6%2C29.7%2C48.3&layer=mapnik"
            />
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <QrCode className="h-5 w-5" />
              <h3 className="text-base font-semibold text-foreground">{t("landing.qr.title")}</h3>
            </div>
            <img
              src={qrSrc}
              alt="QR code linking to e-Return"
              width={220}
              height={220}
              className="rounded-lg border border-border bg-background p-2"
            />
            <p className="mt-4 text-sm text-muted-foreground">{t("landing.qr.desc")}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <p className="text-sm sm:text-base">{t("landing.compliance")}</p>
          </div>
          <Link to="/register" className="rounded-md bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary">
            {t("landing.cta.strip")}
          </Link>
        </div>
      </section>
    </main>
  );
}
