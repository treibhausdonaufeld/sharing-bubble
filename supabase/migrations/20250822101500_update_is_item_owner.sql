-- Update is_item_owner to consider both item_owners table and items.user_id as ownership
-- This keeps the same signature and security settings, but expands the check.

CREATE OR REPLACE FUNCTION public.is_item_owner(_item_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1
      FROM public.item_owners io
      WHERE io.item_id = _item_id
        AND io.user_id = _user_id
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = _item_id
        AND i.user_id = _user_id
    )
  );
END;
$$;
