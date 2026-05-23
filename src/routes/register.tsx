import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { ensureUserProfile } from "@/lib/ensureUserProfile";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

type Role = "citizen" | "collector";

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("citizen");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [county, setCounty] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name,
          role,
          county: county || undefined,
          company_name: role === "collector" ? companyName || name : undefined,
        },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session && data.user) {
      try {
        await ensureUserProfile(data.user);
      } catch (profileErr) {
        setError(profileErr instanceof Error ? profileErr.message : "Could not set up your profile.");
        return;
      }
      navigate({ to: role === "collector" ? "/collector/dashboard" : "/dashboard" });
      return;
    }
    setInfo(t("auth.confirmEmail"));
    setTimeout(() => navigate({ to: "/login" }), 1500);
  };

  const inputCls =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.create")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.createDesc")}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
          {(["citizen", "collector"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                role === r
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {r === "citizen" ? "Citizen" : "Collector"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">{t("auth.fullName")}</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          {role === "collector" && (
            <div>
              <label className="block text-sm font-medium text-foreground">Company name</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground">County</label>
            <input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="e.g. București"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">{t("auth.email")}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">{t("auth.password")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? t("auth.creating") : t("auth.createAccount")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("auth.signin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
