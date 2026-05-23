import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Copy, Check, Leaf, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/vouchers")({
  component: VouchersView,
  head: () => ({ meta: [{ title: "My Vouchers — e-Return" }] }),
});

type Voucher = {
  id: string;
  code: string | null;
  value_lei: number | null;
  status: string | null;
  expires_at: string | null;
  created_at: string | null;
};

function VouchersView() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-vouchers"],
    queryFn: async (): Promise<Voucher[]> => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("vouchers.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("vouchers.subtitle")}</p>
      </header>

      <section className="mt-8">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("vouchers.loading")}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {t("vouchers.failed")}
          </div>
        )}
        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">{t("vouchers.none")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("vouchers.noneHint")}</p>
            <Link
              to="/pickup/new"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("vouchers.start")}
            </Link>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {data?.map((v) => <VoucherCard key={v.id} voucher={v} />)}
        </div>
      </section>
    </main>
  );
}

function VoucherCard({ voucher }: { voucher: Voucher }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const code = (voucher.code ?? "--------").slice(0, 8).toUpperCase().padEnd(8, "•");
  const expires = voucher.expires_at ? new Date(voucher.expires_at) : null;
  const status = (voucher.status ?? "active").toLowerCase();
  const isActive = status === "active";

  const copy = async () => {
    if (!voucher.code) return;
    await navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    toast.success(t("vouchers.copied"));
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-lg ${
        isActive ? "border-primary/30" : "border-border opacity-75"
      }`}
    >
      <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 pb-8 pt-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
            <Leaf className="h-3.5 w-3.5" /> {t("vouchers.badge")}
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
              isActive
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-background/20 text-primary-foreground/70"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-5xl font-bold leading-none tracking-tight">
            {voucher.value_lei ?? 0}
          </span>
          <span className="text-lg font-semibold text-primary-foreground/90">LEI</span>
        </div>
      </div>

      <div className="relative h-4 bg-card">
        <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
        <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t border-dashed border-border" />
      </div>

      <div className="bg-card px-6 pb-6 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("vouchers.code")}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <code className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
            {code}
          </code>
          <button
            onClick={copy}
            disabled={!voucher.code}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-primary transition hover:bg-secondary disabled:opacity-50"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-muted-foreground">{t("vouchers.expires")}</span>
          <span className="font-medium text-foreground">
            {expires ? expires.toLocaleDateString() : "—"}
          </span>
        </div>
      </div>
    </article>
  );
}
