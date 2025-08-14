-- Drop the existing ALL policy and create separate policies for different operations
DROP POLICY IF EXISTS "Users can manage items they own" ON public.items;

-- Allow users to insert items with their own user_id
CREATE POLICY "Users can create their own items" 
ON public.items 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Allow users to update/delete items they own
CREATE POLICY "Users can update items they own" 
ON public.items 
FOR UPDATE 
USING (is_item_owner(id, auth.uid()));

CREATE POLICY "Users can delete items they own" 
ON public.items 
FOR DELETE 
USING (is_item_owner(id, auth.uid()));