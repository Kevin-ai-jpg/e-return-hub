
# Collector Flow — Plan

Scope: everything a collector needs after the admin creates their account. The admin panel itself is out of scope (handled by another teammate). We assume the admin will use Supabase dashboard or that teammate's tool to invite collectors and link them to a `collectors` row.

---

## 1. Authentication & access control

**Onboarding (admin-driven, no public collector signup):**
- Admin uses Supabase's "Invite user" (sends magic-link / set-password email) and creates the matching `collectors` row with `user_id` = invited auth user.
- Collector clicks the email link → lands on a new `/collector/welcome` route that forces them to set a password (if not set) before first login.

**Login hardening on the existing `/login` page:**
- Rate-limit attempts client-side (debounce + lockout after 5 fails / 5 min, stored in `sessionStorage`).
- Strong-password validation on the welcome page (min 12 chars, upper/lower/digit/symbol) via Zod.
- Add "Sign out everywhere" action in collector header (uses `supabase.auth.signOut({ scope: 'global' })`).
- Show last-sign-in timestamp from `auth.users` in collector dashboard header.

**Role gating (keeping `users.role` as you chose):**
- New pathless layout route `src/routes/_collector.tsx` that:
  1. `beforeLoad` — checks `context.auth.isAuthenticated`, else redirects to `/login`.
  2. Child-route `beforeLoad` — awaits `supabase.auth.getUser()`, then fetches `users.role` + matching `collectors` row. If role ≠ `"collector"` or no collectors row → redirect to `/` with toast "Access denied".
- All deep collector pages live under `src/routes/_collector/*` so the gate is enforced once.

**Note for you:** keeping `users.role` as a single column is workable for an MVP, but I'd flag that a compromised user row can self-promote. If you change your mind later, swapping in a `user_roles` table + `has_role()` SECURITY DEFINER function is a ~30-min migration.

---

## 2. Deep collector workspace

New routes under `src/routes/_collector/`:

```
_collector.tsx                      → gate + sidebar shell with <Outlet/>
_collector/dashboard.tsx            → analytics overview (default landing)
_collector/pickups.tsx              → existing collector.tsx logic, moved here
_collector/offers.tsx               → CRUD voucher offers (collector_offers)
_collector/campaigns.tsx            → CRUD campaigns (campaigns)
_collector/points.tsx               → CRUD collection points (collection_points)
_collector/company.tsx              → edit collectors row (name, logo, service area, description)
```

The existing top-level `/collector` route redirects to `/collector/dashboard`.

### Shell
- Left sidebar with: Dashboard · Pickups · Offers · Campaigns · Points · Company · Sign out.
- Green-themed, matches existing brand. Sticky header shows company name + last sign-in.
- Fully translated (EN/RO) via existing `useTranslation` — new keys added to `translations.ts`.

### Offers / Campaigns / Points CRUD
- Standard list + dialog form pattern using existing shadcn `Dialog`, `Table`, `Input`.
- Zod validation on every form (string lengths, numeric ranges for `voucher_value_lei`, `earliest_pickup_days`).
- RLS already enforces owner-only writes on these tables — no schema changes needed.

### Pickups (moved from current /collector)
- Same "Confirm with kg_collected" flow already built. Just relocated under the gated layout.

---

## 3. Analytics dashboard (collector-scoped)

`/collector/dashboard` queries Supabase scoped to the signed-in collector and shows:

- **KPI cards**: total kg collected (sum from `collections` joined to `pickup_requests` where `collector_id = me`), vouchers issued count + total `value_lei`, pending pickups, completed this month.
- **Revenue estimate**: sum of `value_lei` from vouchers tied to this collector's pickups (approximation via `offer_id` → `collector_id`).
- **Charts** using `recharts` (already in deps): kg collected per week (last 12 weeks), pickups by deee_type (pie), vouchers issued per month (bar).
- **Recent activity feed**: last 10 pickup status changes.

All queries run client-side via the user's auth — RLS does the filtering. No service-role key needed.

---

## 4. Files to create / edit

**New:**
- `src/routes/_collector.tsx` (gate + sidebar)
- `src/routes/_collector/dashboard.tsx`
- `src/routes/_collector/pickups.tsx`
- `src/routes/_collector/offers.tsx`
- `src/routes/_collector/campaigns.tsx`
- `src/routes/_collector/points.tsx`
- `src/routes/_collector/company.tsx`
- `src/routes/collector.welcome.tsx` (post-invite password setup)
- `src/components/collector/Sidebar.tsx`
- `src/components/collector/StatCard.tsx`
- `src/lib/collectorAnalytics.ts` (query helpers)

**Edited:**
- `src/routes/collector.tsx` → becomes a redirect to `/collector/dashboard`
- `src/routes/__root.tsx` → add link to collector area when user role = collector
- `src/i18n/translations.ts` → new EN/RO strings
- `src/routes/login.tsx` → add rate-limit + lockout

**No DB migrations.** Existing RLS policies already cover every read/write the collector workspace needs.

---

## 5. Out of scope (confirmed)

- Admin panel for managing collectors / users / app-wide analytics — your teammate's job.
- Switching to a `user_roles` table — keeping `users.role` as you requested.
- Email template customization for the invite — using Supabase's default invite email unless you ask later.

---

## Technical notes

- Layout route uses TanStack's `_collector.tsx` pathless convention so the URL stays `/collector/dashboard` (not `/_collector/dashboard`).
- All Supabase calls stay browser-side (RLS scopes them). No `createServerFn` needed for this feature.
- Charts: `recharts` already in `package.json`, no new deps.
- Welcome page detects the `type=invite` or `type=recovery` URL hash from Supabase and calls `supabase.auth.updateUser({ password })`.
