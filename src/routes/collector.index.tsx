import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/collector/")({
  beforeLoad: () => {
    throw redirect({ to: "/collector/dashboard" });
  },
});
