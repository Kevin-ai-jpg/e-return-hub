import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  cui: z
    .string()
    .trim()
    .min(2)
    .max(15)
    .transform((s) => s.replace(/^ro/i, "").replace(/\s+/g, "")),
});

const ANAF_URL = "https://webservicesp.anaf.ro/api/v9/ws/tva";

export const Route = createFileRoute("/api/public/verify-cui")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "Invalid CUI" },
            { status: 400 },
          );
        }

        const cuiNum = Number(parsed.data.cui);
        if (!Number.isInteger(cuiNum) || cuiNum <= 0) {
          return Response.json(
            { ok: false, error: "CUI must be numeric" },
            { status: 400 },
          );
        }

        const today = new Date().toISOString().slice(0, 10);

        try {
          const res = await fetch(ANAF_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ cui: cuiNum, data: today }]),
          });

          if (!res.ok) {
            return Response.json(
              { ok: false, error: `ANAF unavailable (${res.status})` },
              { status: 502 },
            );
          }

          const data = (await res.json()) as {
            cod?: number;
            message?: string;
            found?: Array<{
              date_generale?: {
                cui?: number;
                denumire?: string;
                adresa?: string;
                nrRegCom?: string;
                telefon?: string;
                statusInactivi?: boolean;
              };
              stare_inactiv?: {
                statusInactivi?: boolean;
                dataInactivare?: string;
              };
            }>;
            notFound?: number[];
          };

          const entry = data.found?.[0];
          if (!entry?.date_generale) {
            return Response.json({
              ok: false,
              found: false,
              error: "CUI not found at ANAF",
            });
          }

          const inactive =
            entry.stare_inactiv?.statusInactivi === true ||
            entry.date_generale.statusInactivi === true;

          return Response.json({
            ok: true,
            found: true,
            active: !inactive,
            company: {
              cui: entry.date_generale.cui,
              name: entry.date_generale.denumire ?? "",
              address: entry.date_generale.adresa ?? "",
              regCom: entry.date_generale.nrRegCom ?? "",
              phone: entry.date_generale.telefon ?? "",
            },
          });
        } catch (err) {
          console.error("ANAF verify-cui error:", err);
          return Response.json(
            { ok: false, error: "Failed to reach ANAF" },
            { status: 502 },
          );
        }
      },
    },
  },
});
