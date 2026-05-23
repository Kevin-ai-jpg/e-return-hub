import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminDashboard } from "../integrations/AdminDashboard";

export const Route = createFileRoute("/p4-dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminDashboardPage,
  head: () => ({ meta: [{ title: "Admin Dashboard — e-Return" }] }),
});

function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: role, isLoading } = useUserRole();

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50">
        <Loader2 className="h-6 w-6 animate-spin text-green-800" />
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-green-800" />
        <h1 className="mt-4 text-2xl font-bold text-green-950">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          This page is restricted to platform administrators.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900"
        >
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard />
      </div>
    </main>
  );
}
