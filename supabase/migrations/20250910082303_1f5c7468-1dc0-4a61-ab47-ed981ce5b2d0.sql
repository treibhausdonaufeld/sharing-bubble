-- Update the is_item_owner function to check both items.user_id and item_owners table
CREATE OR REPLACE FUNCTION public.is_item_owner(_item_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    -- Check if user is the original owner from items table
    SELECT 1 FROM public.items 
    WHERE id = _item_id 
    AND user_id = _user_id
  ) OR EXISTS (
    -- Check if user is listed in item_owners table
    SELECT 1 FROM public.item_owners 
    WHERE item_id = _item_id 
    AND user_id = _user_id
  );
END;
$function$