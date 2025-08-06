-- Create security definer function to check if user is an item owner
CREATE OR REPLACE FUNCTION public.is_item_owner(_item_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.item_owners 
    WHERE item_id = _item_id 
    AND user_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop and recreate the problematic item_owners policies
DROP POLICY "Users can view item owners for their items" ON public.item_owners;
DROP POLICY "Users can add owners to their items" ON public.item_owners;
DROP POLICY "Users can remove owners from their items" ON public.item_owners;

-- Create simplified policies that avoid recursion
CREATE POLICY "Users can view item owners for items they own" 
ON public.item_owners 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Items owners can view all owners for their items"
ON public.item_owners
FOR SELECT
USING (public.is_item_owner(item_id, auth.uid()));

CREATE POLICY "Item owners can add other owners" 
ON public.item_owners 
FOR INSERT 
WITH CHECK (public.is_item_owner(item_id, auth.uid()));

CREATE POLICY "Item owners can remove other owners" 
ON public.item_owners 
FOR DELETE 
USING (public.is_item_owner(item_id, auth.uid()));

-- Also fix the items policies to use the security definer function
DROP POLICY "Users can manage items they own" ON public.items;
DROP POLICY "Users can view available items and their own drafts" ON public.items;

CREATE POLICY "Users can manage items they own" 
ON public.items 
FOR ALL
USING (public.is_item_owner(id, auth.uid()));

CREATE POLICY "Users can view available items and their own drafts" 
ON public.items 
FOR SELECT 
USING (
  status <> 'draft'::item_status OR 
  public.is_item_owner(id, auth.uid())
);

-- Fix item_images policy as well
DROP POLICY "Users can manage images for items they own" ON public.item_images;

CREATE POLICY "Users can manage images for items they own" 
ON public.item_images 
FOR ALL
USING (public.is_item_owner(item_id, auth.uid()));

-- Fix item_requests policies
DROP POLICY "Users can update requests they're involved in" ON public.item_requests;
DROP POLICY "Users can view requests involving them" ON public.item_requests;

CREATE POLICY "Users can update requests they're involved in" 
ON public.item_requests 
FOR UPDATE 
USING (
  requester_id = auth.uid() OR 
  public.is_item_owner(item_id, auth.uid())
);

CREATE POLICY "Users can view requests involving them" 
ON public.item_requests 
FOR SELECT 
USING (
  requester_id = auth.uid() OR 
  public.is_item_owner(item_id, auth.uid())
);