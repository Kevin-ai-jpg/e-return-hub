import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Recycle, ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/apply-collector")({
  head: () => ({
    meta: [
      { title: "Become a collector partner — e-Return" },
      {
        name: "description",
        content:
          "Apply to become a certified DEEE collector partner on e-Return. Reach new customers and grow your recycling business across Romania.",
      },
      { property: "og:title", content: "Become a collector partner — e-Return" },
      {
        property: "og:description",
        content: "Partner with e-Return to collect e-waste across Romania.",
      },
    ],
  }),
  component: ApplyCollectorPage,
});

const WEBHOOK_URL =
  (import.meta.env.VITE_COLLECTOR_APPLICATION_WEBHOOK as string | undefined) ??
  "https://lucassecara.app.n8n.cloud/webhook/partner-request";

const schema = z.object({
  companyName: z.string().trim().min(2).max(120),
  contactPerson: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(32)
    .regex(/^[\d\s+()-]+$/, "Invalid phone"),
  counties: z.string().trim().min(2).max(255),
});

const empty = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  counties: "",
};

type Verified = {
  cui: number;
  name: string;
  address: string;
  regCom: string;
  active: boolean;
};

function ApplyCollectorPage() {
  const { t } = useTranslation();
  const [cui, setCui] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<Verified | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onVerifyCui() {
    setVerifyError(null);
    setVerified(null);
    const cleaned = cui.trim().replace(/^ro/i, "").replace(/\s+/g, "");
    if (!/^\d{2,15}$/.test(cleaned)) {
      setVerifyError("Enter a valid Romanian CUI (digits only, optional RO prefix).");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/public/verify-cui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cui: cleaned }),
      });
      const data = await res.json();
      if (!data.ok || !data.found) {
        setVerifyError(data.error ?? "Company not found at ANAF.");
        return;
      }
      if (!data.active) {
        setVerifyError("This company is marked as inactive at ANAF and cannot apply.");
        return;
      }
      const v: Verified = {
        cui: data.company.cui,
        name: data.company.name,
        address: data.company.address,
        regCom: data.company.regCom,
        active: true,
      };
      setVerified(v);
      setForm((f) => ({ ...f, companyName: v.name }));
      toast.success("Company verified at ANAF");
    } catch (err) {
      console.error(err);
      setVerifyError("Could not reach ANAF. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verified) {
      setVerifyError("Please verify your CUI first.");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: parsed.data.companyName,
          contact_person: parsed.data.contactPerson,
          email: parsed.data.email,
          phone: parsed.data.phone,
          counties: parsed.data.counties,
          cui: verified.cui,
          anaf_name: verified.name,
          anaf_address: verified.address,
          anaf_reg_com: verified.regCom,
          anaf_active: verified.active,
        }),
      });
      toast.success(t("apply.success"));
      setForm(empty);
      setVerified(null);
      setCui("");
    } catch (err) {
      console.error(err);
      toast.error(t("apply.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#E8F5E9] via-background to-[#E8F5E9]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#1B5E20] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("apply.back")}
        </Link>

        <div className="mt-6 rounded-2xl border border-[#4CAF50]/30 bg-card shadow-xl">
          <div className="border-b border-[#4CAF50]/20 bg-[#1B5E20] px-8 py-6 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-90">
                {t("apply.eyebrow")}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("apply.title")}</h1>
            <p className="mt-2 text-sm text-white/85">{t("apply.subtitle")}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 px-8 py-8">
            {/* Step 1 — CUI verification */}
            <div className="rounded-lg border border-[#4CAF50]/30 bg-[#E8F5E9]/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#1B5E20]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-semibold">Step 1 — Verify your company at ANAF</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cui">CUI (Cod Unic de Înregistrare)</Label>
                <div className="flex gap-2">
                  <Input
                    id="cui"
                    value={cui}
                    onChange={(e) => {
                      setCui(e.target.value);
                      if (verified) setVerified(null);
                    }}
                    placeholder="e.g. RO12345678"
                    maxLength={15}
                    disabled={verifying || !!verified}
                  />
                  <Button
                    type="button"
                    onClick={onVerifyCui}
                    disabled={verifying || !!verified || cui.trim().length < 2}
                    className="bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90 shrink-0"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : verified ? "Verified" : "Verify"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We check ANAF's public registry to confirm your company exists and is active.
                </p>
                {verifyError && (
                  <p className="text-xs font-medium text-destructive">{verifyError}</p>
                )}
              </div>

              {verified && (
                <div className="rounded-md border border-[#4CAF50]/40 bg-white p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-[#1B5E20] shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#1B5E20]">{verified.name}</p>
                      <p className="text-xs text-muted-foreground">CUI {verified.cui}</p>
                      {verified.address && (
                        <p className="text-xs text-muted-foreground">{verified.address}</p>
                      )}
                      {verified.regCom && (
                        <p className="text-xs text-muted-foreground">Reg. Com.: {verified.regCom}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <fieldset disabled={!verified} className="space-y-5 disabled:opacity-50">
              <Field
                label={t("apply.company")}
                value={form.companyName}
                onChange={update("companyName")}
                error={errors.companyName}
                maxLength={120}
                readOnly={!!verified}
              />
              <Field
                label={t("apply.contact")}
                value={form.contactPerson}
                onChange={update("contactPerson")}
                error={errors.contactPerson}
                maxLength={120}
              />
              <Field
                label={t("apply.email")}
                type="email"
                value={form.email}
                onChange={update("email")}
                error={errors.email}
                maxLength={255}
              />
              <Field
                label={t("apply.phone")}
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                error={errors.phone}
                maxLength={32}
              />
              <div className="space-y-1.5">
                <Label htmlFor="counties">{t("apply.counties")}</Label>
                <Textarea
                  id="counties"
                  value={form.counties}
                  onChange={update("counties")}
                  placeholder="Cluj, Bucuresti, Timis"
                  rows={3}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">{t("apply.countiesHint")}</p>
                {errors.counties && (
                  <p className="text-xs font-medium text-destructive">{errors.counties}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || !verified}
                className="w-full bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90"
                size="lg"
              >
                {submitting ? t("apply.sending") : t("apply.submit")}
              </Button>
            </fieldset>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...inputProps} />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
