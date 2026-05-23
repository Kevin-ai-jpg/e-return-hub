-- =========================================================
-- USERS
-- =========================================================
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- =========================================================
-- COLLECTORS — public read for Offers Panel; owner mutates
-- =========================================================
CREATE POLICY "collectors_select_public" ON public.collectors
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "collectors_insert_own" ON public.collectors
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "collectors_update_own" ON public.collectors
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "collectors_delete_own" ON public.collectors
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =========================================================
-- COLLECTOR_OFFERS — public browse; owning collector mutates
-- =========================================================
CREATE POLICY "offers_select_public" ON public.collector_offers
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "offers_insert_owner" ON public.collector_offers
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()));
CREATE POLICY "offers_update_owner" ON public.collector_offers
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()));
CREATE POLICY "offers_delete_owner" ON public.collector_offers
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()));

-- =========================================================
-- COLLECTION_POINTS — public map; owning collector mutates
-- =========================================================
CREATE POLICY "points_select_public" ON public.collection_points
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "points_insert_owner" ON public.collection_points
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()));
CREATE POLICY "points_update_owner" ON public.collection_points
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()));
CREATE POLICY "points_delete_owner" ON public.collection_points
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid()));

-- =========================================================
-- CAMPAIGNS — public read of active rows; no client writes
-- =========================================================
CREATE POLICY "campaigns_select_active" ON public.campaigns
  FOR SELECT TO anon, authenticated USING (active IS TRUE);

-- =========================================================
-- PICKUP_REQUESTS — citizen owns; assigned collector co-views
-- =========================================================
CREATE POLICY "pickup_select_own_or_collector" ON public.pickup_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid())
  );
CREATE POLICY "pickup_insert_self" ON public.pickup_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "pickup_update_own_or_collector" ON public.pickup_requests
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = collector_id AND c.user_id = auth.uid())
  );
CREATE POLICY "pickup_delete_own_pending" ON public.pickup_requests
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- =========================================================
-- COLLECTIONS — citizen + servicing collector can view
-- =========================================================
CREATE POLICY "collections_select_related" ON public.collections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pickup_requests pr
      WHERE pr.id = pickup_request_id
        AND (
          pr.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.collectors c WHERE c.id = pr.collector_id AND c.user_id = auth.uid())
        )
    )
  );
CREATE POLICY "collections_insert_collector" ON public.collections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pickup_requests pr
      JOIN public.collectors c ON c.id = pr.collector_id
      WHERE pr.id = pickup_request_id AND c.user_id = auth.uid()
    )
  );

-- =========================================================
-- VOUCHERS — user reads own; issuance is backend-only
-- =========================================================
CREATE POLICY "vouchers_select_own" ON public.vouchers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================
-- Lock down the internal event-trigger helper. It's invoked by
-- Postgres as an event trigger and never needs to be called by
-- API roles, so revoke EXECUTE from everyone.
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;