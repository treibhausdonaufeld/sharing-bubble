-- Fix items SELECT policy to allow creators to see their own drafts immediately after insert
-- This prevents RLS issues when returning the inserted row (return=representation)
-- and before an ownership row exists in public.item_owners
BEGIN;

-- Replace prior SELECT policy that only allowed drafts via ownership
DROP POLICY IF EXISTS "Users can view available items and their own drafts" ON public.items;

CREATE POLICY "Users can view available items and their own drafts"
ON public.items
FOR SELECT
USING (
  status <> 'draft'::item_status
  OR user_id = auth.uid()
  OR public.is_item_owner(id, auth.uid())
);

COMMIT;
