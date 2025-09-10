-- Create a trigger function to automatically add item creator to item_owners table
CREATE OR REPLACE FUNCTION public.handle_new_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert the item creator as the primary owner in item_owners table
  INSERT INTO public.item_owners (item_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id);
  
  RETURN NEW;
END;
$function$;

-- Create trigger to run after item insertion
CREATE TRIGGER on_item_created
  AFTER INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_item();