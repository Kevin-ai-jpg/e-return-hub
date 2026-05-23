# AI Chat Widget + Frontend Readiness

## 1. Floating Chat Widget

New component `src/components/ChatWidget.tsx`, mounted once in `src/routes/__root.tsx` so it appears on every page (except inside auth routes if undesired — default: everywhere).

**UI**
- Fixed bottom-right floating button (green theme, `bg-primary`, `Leaf`/`MessageCircle` icon, subtle shadow + pulse on first load).
- Click → opens a chat panel (≈ 380×560px on desktop, full-screen sheet on mobile via `useIsMobile`).
- Panel header: "Asistent e-Return", close button, "Powered by AI" subtitle.
- Message list: user bubbles (right, `bg-primary text-primary-foreground`) and assistant bubbles (left, `bg-secondary`). Markdown rendering via `react-markdown` (already AI-chatbot best practice).
- Composer: textarea + Send button, Enter to send, Shift+Enter for newline, disabled while pending.
- Typing indicator (3 animated dots) while awaiting response.
- Empty state with a welcome message + 3 suggestion chips ("Ce fac cu frigiderul vechi?", "Câți lei primesc pentru un laptop?", "Unde îl predau în Cluj?") that prefill the input.

**State & networking**
- Local `useState` for `open`, `messages: {role, content, id}[]`, `input`, `isPending`.
- Session id generated once per browser (`crypto.randomUUID()`, kept in `sessionStorage` under `eReturn.chatSession`) — sent with each request so n8n can correlate turns.
- On send: append user message, POST to n8n webhook with payload:
  ```json
  { "sessionId": "...", "userId": "<auth uid or null>", "message": "...", "history": [...] }
  ```
- Read webhook URL from `import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL` (publishable, safe to ship). Add a placeholder to `.env` and document it.
- Response shape supported: `{ reply: string }` or `{ output: string }` (n8n default) — fall back to `JSON.stringify` if neither.
- Errors: toast via `sonner` ("Asistentul nu răspunde, încearcă din nou") and re-enable input. No retry loop.
- No streaming for v1 (n8n webhook is request/response). Code structured so we can later swap to SSE without UI changes.

**Auth context**
- Pull `supabase.auth.getUser()` lazily to attach `userId` when available; widget still works for anonymous visitors.

## 2. Frontend Readiness Pass (for handoff to P2/P3/P4)

Small, surgical changes so the rest of the team can plug in without UI rework:

- **Env config** — extend `.env` with `VITE_N8N_CHAT_WEBHOOK_URL=` and document required backend env vars in a new `README.md` section "Frontend ↔ Backend contract" listing: webhook URL, Supabase tables used per screen, and expected row shapes.
- **Dashboard** (`src/routes/dashboard.tsx`) — replace the mocked `summary` object with real Supabase queries via `useQuery`: count of `pickup_requests` where status='pending', sum of `vouchers.value_lei` where status='active', sum of `collections.kg_collected` for the user. Show skeletons while loading and an empty state when zero. (Currently fully mocked.)
- **Collector view** (`src/routes/collector.tsx`) — wire the mocked list to `supabase.from('pickup_requests').select('*, collectors(company_name), users:user_id(name, address)').eq('status','pending')`, and make Confirm actually `insert` into `collections` + `update` pickup_requests.status='completed'. (Currently mocked per summary.)
- **Vouchers** (`src/routes/vouchers.tsx`) — wire to `supabase.from('vouchers').select('*').eq('user_id', user.id).order('created_at', { ascending: false })`. (Currently mocked.)
- **Offers panel** — already live; add a graceful error toast if the query fails and confirm the empty-state copy points users to try a different county.
- **Type safety** — verify `src/integrations/supabase/types.ts` includes the columns referenced (`pickup_requests.offer_id`, `vouchers.value_lei`, `collections.kg_collected`). If any are missing, flag them in the plan-completion message so P2 can add them — do not modify the schema here.

## Technical notes

- Files added: `src/components/ChatWidget.tsx`, `src/components/chat/MessageBubble.tsx`, `src/components/chat/ChatComposer.tsx`.
- Files edited: `src/routes/__root.tsx` (mount widget), `src/routes/dashboard.tsx`, `src/routes/collector.tsx`, `src/routes/vouchers.tsx`, `.env`, `README.md`.
- Deps: `react-markdown` (new). No other additions.
- Styling: strictly semantic tokens (`primary`, `secondary`, `card`, `muted`, `accent`) — no hex literals.
- No backend code created (n8n workflow + Supabase schema owned by P2/P3).

## Out of scope
- Photo upload to chat (Claude Vision) — flagged as bonus in the plan; can add later in ~30 min.
- Streaming responses (n8n webhook is sync).
- Auth-gating the widget.

Confirm and I'll implement.