-- Function to fetch current item_category enum values dynamically
CREATE OR REPLACE FUNCTION public.get_item_category_values()
RETURNS SETOF text
LANGUAGE sql
STABLE
AS $$
  SELECT e.enumlabel
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typname = 'item_category'
  ORDER BY e.enumsortorder;
$$;

-- Optional: grant execute to public (usually default). Edge function uses service role.
GRANT EXECUTE ON FUNCTION public.get_item_category_values() TO PUBLIC;
