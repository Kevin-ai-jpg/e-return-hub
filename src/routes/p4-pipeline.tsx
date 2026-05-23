import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

type PipelineVisualizationComponent = ComponentType;

export const Route = createFileRoute("/p4-pipeline")({
  component: P4PipelinePage,
});

function P4PipelinePage() {
  const [PipelineVisualization, setPipelineVisualization] =
    useState<PipelineVisualizationComponent | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPipeline() {
      try {
        const pipelineModule = await import(
          "../integrations/PipelineVisualization"
        );

        if (!isMounted) return;

        setPipelineVisualization(() => pipelineModule.PipelineVisualization);
      } catch (err) {
        console.error("Failed to load P4 pipeline:", err);

        if (!isMounted) return;

        setError(err instanceof Error ? err.message : String(err));
      }
    }

    loadPipeline();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
            <p className="font-bold">P4 pipeline failed to load.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : !PipelineVisualization ? (
          <div className="rounded-2xl border border-green-100 bg-white p-6 text-green-900 shadow-sm">
            Loading P4 pipeline visualization...
          </div>
        ) : (
          <PipelineVisualization />
        )}
      </div>
    </main>
  );
}