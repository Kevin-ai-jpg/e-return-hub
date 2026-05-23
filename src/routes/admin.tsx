import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — e-Return" }] }),
});

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [AdminDashboard, setAdminDashboard] =
    useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (role !== "admin") return;
    let mounted = true;
    import("../integrations/AdminDashboard")
      .then((m) => mounted && setAdminDashboard(() => m.AdminDashboard))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      mounted = false;
    };
  }, [role]);

  if (authLoading || roleLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading admin…
        </div>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-3 text-xl font-bold text-amber-900">Admins only</h1>
          <p className="mt-2 text-sm text-amber-800">
            Your account ({role ?? "citizen"}) does not have access to the admin dashboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-bold">Admin dashboard failed to load.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : !AdminDashboard ? (
          <div className="rounded-2xl border border-green-100 bg-white p-6 text-green-900">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading admin dashboard…
          </div>
        ) : (
          <AdminDashboard />
        )}
      </div>
    </main>
  );
}
