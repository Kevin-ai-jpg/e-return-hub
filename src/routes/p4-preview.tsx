import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

type CollectionMapComponent = ComponentType<{
  height?: string;
  selectedDeeeType?: string;
}>;

type PickupQRCodeComponent = ComponentType<{
  pickupRequestId?: string;
  collectorName?: string;
  deeeType?: string;
  voucherValueLei?: number;
  status?: string;
}>;

export const Route = createFileRoute("/p4-preview")({
  component: P4PreviewPage,
});

function P4PreviewPage() {
  const [CollectionMap, setCollectionMap] =
    useState<CollectionMapComponent | null>(null);

  const [PickupQRCode, setPickupQRCode] =
    useState<PickupQRCodeComponent | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadClientComponents() {
      try {
        const mapModule = await import("../integrations/CollectionMap");
        const qrModule = await import("../integrations/PickupQRCode");

        if (!isMounted) return;

        setCollectionMap(() => mapModule.CollectionMap);
        setPickupQRCode(() => qrModule.PickupQRCode);
      } catch (err) {
        console.error("Failed to load P4 preview components:", err);

        if (!isMounted) return;

        setError(err instanceof Error ? err.message : String(err));
      }
    }

    loadClientComponents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            P4 Integration Preview
          </p>

          <h1 className="text-3xl font-bold text-green-950">
            e-Return Map + QR Components
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Standalone P4 components using mock data. Later these can be
            connected to Supabase and integrated into the citizen dashboard,
            collector flow, and admin dashboard.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
            <p className="font-bold">P4 preview failed to load.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : !CollectionMap || !PickupQRCode ? (
          <div className="rounded-2xl border border-green-100 bg-white p-6 text-green-900 shadow-sm">
            Loading P4 preview components...
          </div>
        ) : (
          <>
            <CollectionMap />

            <div className="max-w-md">
              <PickupQRCode />
            </div>
          </>
        )}
      </div>
    </main>
  );
}