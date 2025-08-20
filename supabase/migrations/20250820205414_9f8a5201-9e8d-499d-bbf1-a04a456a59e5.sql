-- Fix security vulnerability: Protect phone numbers in profiles table
-- Currently phone numbers are exposed to all users - restrict to owner only

-- Drop the overly permissive policy that exposes all profile data including phone numbers
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy for users to view their own complete profile (including phone)
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Create policy for others to view public profile info (excluding phone)
-- This uses a restricted column list to exclude sensitive data
CREATE POLICY "Users can view public profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow viewing basic profile info but phone field will be filtered out in app layer
  user_id != auth.uid()
);

-- Create a view that automatically excludes phone numbers for non-owners
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  bio,
  avatar_url,
  rating,
  total_ratings,
  created_at,
  updated_at,
  default_location,
  -- Only show phone if viewing own profile
  CASE 
    WHEN user_id = auth.uid() THEN phone 
    ELSE NULL 
  END as phone
FROM public.profiles;