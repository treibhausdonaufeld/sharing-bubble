-- Drop the existing INSERT policy for item_owners and create a new one
DROP POLICY IF EXISTS "Item owners can add other owners" ON public.item_owners;

-- Allow users to add themselves as owners OR add others if they're already an owner
CREATE POLICY "Users can add themselves or item owners can add others" 
ON public.item_owners 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR is_item_owner(item_id, auth.uid())
);