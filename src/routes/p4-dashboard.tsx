import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

type AdminDashboardComponent = ComponentType;

export const Route = createFileRoute("/p4-dashboard")({
  component: P4DashboardPage,
});

function P4DashboardPage() {
  const [AdminDashboard, setAdminDashboard] =
    useState<AdminDashboardComponent | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const dashboardModule = await import("../integrations/AdminDashboard");

        if (!isMounted) return;

        setAdminDashboard(() => dashboardModule.AdminDashboard);
      } catch (err) {
        console.error("Failed to load P4 dashboard:", err);

        if (!isMounted) return;

        setError(err instanceof Error ? err.message : String(err));
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
            <p className="font-bold">P4 dashboard failed to load.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : !AdminDashboard ? (
          <div className="rounded-2xl border border-green-100 bg-white p-6 text-green-900 shadow-sm">
            Loading P4 admin dashboard...
          </div>
        ) : (
          <AdminDashboard />
        )}
      </div>
    </main>
  );
}