import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { ensureUserProfile } from "@/lib/ensureUserProfile";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const LOCKOUT_KEY = "login_lockout";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

type LockoutState = { attempts: number; until: number };

function readLockout(): LockoutState {
  try {
    const raw = sessionStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { attempts: 0, until: 0 };
    return JSON.parse(raw) as LockoutState;
  } catch {
    return { attempts: 0, until: 0 };
  }
}

function writeLockout(s: LockoutState) {
  sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify(s));
}

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const s = readLockout();
    if (s.until > Date.now()) setLockedUntil(s.until);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    const state = readLockout();
    if (state.until > Date.now()) {
      const mins = Math.ceil((state.until - Date.now()) / 60000);
      setError(t("auth.lockedOut", { mins: String(mins) }));
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const attempts = state.attempts + 1;
      const next: LockoutState =
        attempts >= MAX_ATTEMPTS
          ? { attempts: 0, until: Date.now() + LOCKOUT_MS }
          : { attempts, until: 0 };
      writeLockout(next);
      if (next.until) setLockedUntil(next.until);
      setLoading(false);
      submittingRef.current = false;
      setError(
        attempts >= MAX_ATTEMPTS
          ? t("auth.tooMany")
          : `${error.message} (${MAX_ATTEMPTS - attempts} ${t("auth.attemptsLeft")})`,
      );
      return;
    }
    writeLockout({ attempts: 0, until: 0 });
    if (data.user) {
      try {
        await ensureUserProfile(data.user);
      } catch (profileErr) {
        setLoading(false);
        submittingRef.current = false;
        setError(profileErr instanceof Error ? profileErr.message : "Could not set up your profile.");
        return;
      }
    }
    setLoading(false);
    submittingRef.current = false;
    navigate({ to: "/dashboard" });
  };

  const isLocked = lockedUntil > Date.now();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.welcomeBack")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.signinDesc")}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">{t("auth.email")}</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">{t("auth.password")}</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? t("auth.signingIn") : t("auth.signin")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {t("auth.createOne")}
          </Link>
        </p>
      </div>
    </main>
  );
}
