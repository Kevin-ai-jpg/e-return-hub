import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/p4-dashboard")({
  component: P4DashboardPage,
});

function P4DashboardPage() {
  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          P4 Dashboard Preview
        </p>

        <h1 className="mt-2 text-3xl font-bold text-green-950">
          Admin Dashboard route works
        </h1>

        <p className="mt-2 text-gray-600">
          This is the test route. Next we will add the real Recharts dashboard.
        </p>
      </div>
    </main>
  );
}