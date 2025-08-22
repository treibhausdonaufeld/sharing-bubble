-- Fix security vulnerability: Remove overly permissive RLS policy that exposes all user addresses
-- Currently the policy "Users can view locations for items" has "Using Expression: true" 
-- which allows ANY user to see ALL addresses - this is a serious privacy violation

-- Drop the problematic policy that exposes all user locations
DROP POLICY IF EXISTS "Users can view locations for items" ON public.user_locations;

-- Create a more secure policy that only allows viewing locations in specific contexts
-- Users can only view locations that are:
-- 1. Their own locations (already covered by existing policy)
-- 2. Locations associated with published items (not drafts) - for legitimate item viewing
-- 3. Only when they have a legitimate reason to see the location (viewing an available item)

CREATE POLICY "Users can view locations for available items" 
ON public.user_locations 
FOR SELECT 
USING (
  -- Allow access to locations that are associated with published items
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.location_id = user_locations.id 
    AND items.status != 'draft'
  )
);

-- Add an additional policy for users involved in active transactions/requests
-- This allows viewing location details when there's an active item request
-- CREATE POLICY "Users can view locations for active requests" 
-- ON public.user_locations 
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.item_requests ir
--     JOIN public.items i ON ir.item_id = i.id
--     WHERE i.location_id = user_locations.id 
--     AND (ir.requester_id = auth.uid() OR ir.owner_id = auth.uid())
--     AND ir.status IN ('pending', 'accepted', 'counter_offered')
--   )
-- );