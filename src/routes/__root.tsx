import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ChatWidget } from "@/components/ChatWidget";
import { LanguageProvider, useTranslation } from "@/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

function VoucherRealtimeListener() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`vouchers-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vouchers",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const v = payload.new as { code?: string; value_lei?: number };
          toast.success(`🎉 Voucher nou: ${v.value_lei ?? 0} lei`, {
            description: v.code ? `Cod: ${v.code}` : undefined,
            duration: 8000,
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "e-Return — Recycle. Earn. Protect." },
      { name: "description", content: "Recycle your e-waste, earn vouchers, and protect the planet. Compare offers from certified collectors in Romania." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Nav() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: role } = useUserRole();
  const displayName =
    (user?.user_metadata?.name as string | undefined) ?? user?.email?.split("@")[0];
  const isAdmin = role === "admin";
  const isCollector = role === "collector";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">e</div>
          <span className="text-lg font-semibold tracking-tight text-foreground">e-Return</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          {user && isAdmin && (
            <Link to="/p4-dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
              Admin Dashboard
            </Link>
          )}
          {user && isCollector && (
            <>
              <Link to="/collector/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                {t("nav.dashboard")}
              </Link>
              <Link to="/collector/pickups" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                {t("nav.pendingPickups")}
              </Link>
              <Link to="/collector/offers" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                {t("nav.offers")}
              </Link>
            </>
          )}
          {user && !isAdmin && !isCollector && (
            <>
              <Link to="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                {t("nav.dashboard")}
              </Link>
              <Link to="/pickup/new" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                {t("nav.newPickup")}
              </Link>
              <Link to="/vouchers" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                {t("nav.vouchers")}
              </Link>
              <Link to="/settings" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                Settings
              </Link>
            </>
          )}
          {user ? (
            <>
              {displayName && (
                <span className="hidden px-2 text-sm text-muted-foreground sm:inline">{displayName}</span>
              )}
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                {t("nav.login")}
              </Link>
              <Link to="/register" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {t("nav.signup")}
              </Link>
            </>
          )}
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminRoute = pathname.startsWith("/p4-");

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Nav />
          <Outlet />
        </div>
        <VoucherRealtimeListener />
        {!isAdminRoute && <ChatWidget />}
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
