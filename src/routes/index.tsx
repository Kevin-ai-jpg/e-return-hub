import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Recycle, Coins, Shield, MapPin, QrCode } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
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
