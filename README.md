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

A floating AI chat widget (`src/components/ChatWidget.tsx`) is mounted globally in `src/routes/__root.tsx` and POSTs to a chat API (Flask locally, or n8n webhook in production).

## Frontend ↔ Backend contract

### Environment variables

| Var | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase client | already wired |
| `VITE_CHAT_API_URL` | Chat widget | publishable; Flask or n8n chat endpoint |
| `VITE_N8N_CHAT_WEBHOOK_URL` | Chat widget (fallback) | optional; used only if `VITE_CHAT_API_URL` is unset |

### Chat API: `VITE_CHAT_API_URL` (Flask or n8n WF2)

**Frontend POSTs** JSON (Flask contract):

```json
{
  "sessionId": "uuid",
  "userId": "uuid | null",
  "chat_history": [{ "role": "user" | "assistant", "content": "..." }],
  "fresh_text": "current user message",
  "fresh_image_base64": "raw base64 (optional)",
  "media_type": "image/jpeg"
}
```

With a product photo and no typed text, the widget sends `fresh_text: "Ce obiect este în imagine?"` (RO) / `"What object is in the image?"` (EN).

**Flask returns** `{ "response": "...", "new_history_node": { ... } }`.

**Frontend accepts** `response`, `reply`, `output`, `message`, `text`, or a bare string. Markdown is rendered.

#### Local Flask (dev)

**1. Create a virtual environment and install dependencies** (from project root `D:\e-return-hub`):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r chat_endpoint/requirements.txt
```

On macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r chat_endpoint/requirements.txt
```

**2. Environment variables** — add to the root `.env` (loaded by `python-dotenv`):

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for the agent |
| `SUPABASE_URL` | Same as frontend (`https://….supabase.co`) |
| `SUPABASE_KEY` | Supabase key with read access to `collector_offers` / `collectors` (anon or service role) |

**3. Start the server** (must run from project root so `chat_endpoint` imports work):

```powershell
python -m chat_endpoint.server
```

Health check: `http://127.0.0.1:5000/api/health`

**4. Frontend** — in `.env`, set `VITE_CHAT_API_URL=/api/chat` (Vite proxies `/api/*` → `http://127.0.0.1:5000/api/*`). Restart `bun run dev` after changing `.env`.

If PowerShell blocks activation: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

If you call Flask directly (e.g. `VITE_CHAT_API_URL=http://127.0.0.1:5000/chat`), enable CORS on Flask for `http://localhost:8080` (or your dev origin).

Minimal Flask example:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:8080"])  # only needed without Vite proxy

@app.post("/chat")
def chat():
    body = request.get_json(force=True)
    # body: sessionId, userId, message, history
    reply = f"You said: {body.get('message', '')}"
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
```

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
