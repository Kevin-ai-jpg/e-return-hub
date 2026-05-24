import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Recycle, ArrowLeft } from "lucide-react";
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
  cui: z
    .string()
    .trim()
    .transform((v) => v.replace(/^RO/i, "").trim())
    .pipe(z.string().regex(/^\d{2,10}$/, "CUI must be digits only (no RO prefix)")),
});

const empty = { companyName: "", contactPerson: "", email: "", phone: "", counties: "", cui: "" };

function ApplyCollectorPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        }),
      });
      toast.success(t("apply.success"));
      setForm(empty);
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
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#1B5E20] hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("apply.back")}
        </Link>

        <div className="mt-6 rounded-2xl border border-[#4CAF50]/30 bg-card shadow-xl">
          <div className="border-b border-[#4CAF50]/20 bg-[#1B5E20] px-8 py-6 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-90">{t("apply.eyebrow")}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("apply.title")}</h1>
            <p className="mt-2 text-sm text-white/85">{t("apply.subtitle")}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 px-8 py-8">
            <Field label={t("apply.company")} value={form.companyName} onChange={update("companyName")} error={errors.companyName} maxLength={120} />
            <Field label={t("apply.contact")} value={form.contactPerson} onChange={update("contactPerson")} error={errors.contactPerson} maxLength={120} />
            <Field label={t("apply.email")} type="email" value={form.email} onChange={update("email")} error={errors.email} maxLength={255} />
            <Field label={t("apply.phone")} type="tel" value={form.phone} onChange={update("phone")} error={errors.phone} maxLength={32} />
            <div className="space-y-1.5">
              <Label htmlFor="counties">{t("apply.counties")}</Label>
              <Textarea id="counties" value={form.counties} onChange={update("counties")} placeholder="Cluj, Bucuresti, Timis" rows={3} maxLength={255} />
              <p className="text-xs text-muted-foreground">{t("apply.countiesHint")}</p>
              {errors.counties && <p className="text-xs font-medium text-destructive">{errors.counties}</p>}
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90" size="lg">
              {submitting ? t("apply.sending") : t("apply.submit")}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, error, ...inputProps }: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...inputProps} />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
