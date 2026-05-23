import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/setup-password")({
  component: SetupPasswordPage,
  head: () => ({ meta: [{ title: "Set your password — e-Return" }] }),
});

const PasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a symbol");

function SetupPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Supabase invite/recovery flows put tokens in the URL hash and the SDK
  // exchanges them automatically. Confirm we have an authenticated session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("setup.mismatch"));
      return;
    }
    const parsed = PasswordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    toast.success(t("setup.success"));
    navigate({ to: "/collector/dashboard" });
  };

  if (hasSession === false) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-bold text-foreground">{t("setup.expiredTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("setup.expiredDesc")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="mt-3 text-2xl font-bold text-foreground">{t("setup.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("setup.subtitle")}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">{t("setup.new")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">{t("setup.confirm")}</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("setup.rules")}</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("setup.save")}
          </button>
        </form>
      </div>
    </main>
  );
}
