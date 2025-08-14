-- Create debug function to check auth context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS TABLE (
  current_user_id uuid,
  jwt_subject text,
  current_role text,
  jwt_claims jsonb,
  is_authenticated boolean
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'sub' as jwt_subject,
    auth.role() as current_role,
    current_setting('request.jwt.claims', true)::jsonb as jwt_claims,
    auth.uid() IS NOT NULL as is_authenticated;
$$;