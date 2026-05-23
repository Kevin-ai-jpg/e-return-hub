# e-Return — Frontend (P1)

Citizen-facing web app for Romania's e-waste (DEEE) marketplace. Built with TanStack Start + React + Tailwind, backed by Supabase, with n8n workflows and a Claude-powered AI agent.

## Routes

| Route | Purpose | Data source |
|---|---|---|
| `/` | Landing page | static |
| `/login`, `/register` | Auth | `supabase.auth` |
| `/dashboard` | Citizen summary (pending pickups, vouchers, eco-impact) | `pickup_requests`, `vouchers`, `collections` |
| `/pickup/new` | Step A: pick DEEE type + county | local state |
| `/pickup/offers` | Step B: live marketplace of collector offers | `collector_offers` ⋈ `collectors` |
| `/vouchers` | Citizen voucher wallet | `vouchers` |
| `/collector` | Collector view of pending pickups + confirm form | `pickup_requests`, `collections` |

A floating AI chat widget (`src/components/ChatWidget.tsx`) is mounted globally in `src/routes/__root.tsx` and posts to the n8n webhook.

## Frontend ↔ Backend contract

### Environment variables

| Var | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase client | already wired |
| `VITE_N8N_CHAT_WEBHOOK_URL` | Chat widget | publishable; n8n Production webhook URL |

### n8n: `VITE_N8N_CHAT_WEBHOOK_URL` (WF2 — AI Chat)

**Frontend POSTs** JSON:

```json
{
  "sessionId": "uuid",                // stable per browser tab
  "userId": "uuid | null",            // supabase auth user id if logged in
  "message": "user text",
  "history": [
    { "role": "user" | "assistant", "content": "..." }
  ]
}
```

**Frontend accepts** any of these response shapes (first non-null wins):
`reply`, `output`, `message`, `text`, or a bare string. Markdown is rendered.

### Supabase tables consumed by the frontend

Make sure these columns exist (already present in `src/integrations/supabase/types.ts`):

- **`pickup_requests`** — `id, user_id, collector_id, offer_id, deee_type, status, scheduled_date, address, created_at`. Status values used by UI: `pending`, `completed`.
- **`collector_offers`** — `id, collector_id, deee_type, voucher_value_lei, earliest_pickup_days, accepts_home_pickup`.
- **`collectors`** — `id, company_name, logo_url, rating, service_area_counties[]`. The offers query relies on PostgREST embedding `collectors!inner(...)` and `.contains("collectors.service_area_counties", [county])`.
- **`vouchers`** — `id, user_id, code, value_lei, status, expires_at, created_at`. UI assumes `status` ∈ {`active`, `redeemed`, `expired`}.
- **`collections`** — `id, pickup_request_id, kg_collected, confirmed_at`. The collector view inserts a row here and flips the matching `pickup_requests.status` to `completed`. WF1 should trigger on this insert to generate the voucher (using the offer's `voucher_value_lei`).

### RLS expectations

- Citizens read/write their own `pickup_requests` and `vouchers`.
- Anyone authenticated can read `collectors` and `collector_offers`.
- Collector users can read `pickup_requests` assigned to them and insert into `collections`.

### Seed data needed for demo

At least 4 rows in `collectors` with `service_area_counties` matching the dropdown values used in `src/routes/pickup.new.tsx` (e.g. `Cluj`, `București`, `Timiș`, `Iași`), each with a few `collector_offers` covering `fridge`, `phone`, `laptop`, `tv`.
