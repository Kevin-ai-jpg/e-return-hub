-- Restrict Realtime channel subscriptions to topics scoped to the authenticated user.
-- Convention: clients must subscribe to topics prefixed with their own user id,
-- e.g. "user:<auth.uid()>" or "user:<auth.uid()>:pickup_requests".
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to own user-scoped topics"
  ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to own user-scoped topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('user:' || auth.uid()::text || '%')
);

DROP POLICY IF EXISTS "Authenticated users can broadcast to own user-scoped topics"
  ON realtime.messages;

CREATE POLICY "Authenticated users can broadcast to own user-scoped topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE ('user:' || auth.uid()::text || '%')
);