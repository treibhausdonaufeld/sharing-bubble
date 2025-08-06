-- Create item_owners junction table for many-to-many relationships
CREATE TABLE public.item_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'co-owner')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID,
  UNIQUE(item_id, user_id)
);

-- Enable RLS
ALTER TABLE public.item_owners ENABLE ROW LEVEL SECURITY;

-- Create policies for item_owners
CREATE POLICY "Users can view item owners for their items" 
ON public.item_owners 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.item_owners io2 
    WHERE io2.item_id = item_owners.item_id 
    AND io2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add owners to their items" 
ON public.item_owners 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.item_owners io 
    WHERE io.item_id = item_owners.item_id 
    AND io.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove owners from their items" 
ON public.item_owners 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.item_owners io 
    WHERE io.item_id = item_owners.item_id 
    AND io.user_id = auth.uid()
  )
);

-- Migrate existing data: populate item_owners with current item.user_id as owners
INSERT INTO public.item_owners (item_id, user_id, role, added_by)
SELECT id, user_id, 'owner', user_id
FROM public.items;

-- Update items RLS policies to use item_owners table
DROP POLICY "Users can manage own items" ON public.items;
DROP POLICY "Users can view available items" ON public.items;

CREATE POLICY "Users can manage items they own" 
ON public.items 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.item_owners 
    WHERE item_id = items.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view available items and their own drafts" 
ON public.items 
FOR SELECT 
USING (
  status <> 'draft'::item_status OR 
  EXISTS (
    SELECT 1 FROM public.item_owners 
    WHERE item_id = items.id 
    AND user_id = auth.uid()
  )
);

-- Update item_images RLS policies
DROP POLICY "Users can manage own item images" ON public.item_images;

CREATE POLICY "Users can manage images for items they own" 
ON public.item_images 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.item_owners io
    JOIN public.items i ON i.id = io.item_id
    WHERE i.id = item_images.item_id 
    AND io.user_id = auth.uid()
  )
);

-- Update item_requests RLS policies to handle multiple owners
DROP POLICY "Users can update requests they're involved in" ON public.item_requests;

CREATE POLICY "Users can update requests they're involved in" 
ON public.item_requests 
FOR UPDATE 
USING (
  requester_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.item_owners 
    WHERE item_id = item_requests.item_id 
    AND user_id = auth.uid()
  )
);

DROP POLICY "Users can view requests involving them" ON public.item_requests;

CREATE POLICY "Users can view requests involving them" 
ON public.item_requests 
FOR SELECT 
USING (
  requester_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.item_owners 
    WHERE item_id = item_requests.item_id 
    AND user_id = auth.uid()
  )
);