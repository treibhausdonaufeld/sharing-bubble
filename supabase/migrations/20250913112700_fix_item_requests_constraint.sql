-- Migrate item_requests foreign keys from auth.users(id) to profiles(user_id)
-- The requested spec showed public.profile(user_id); assuming that was a typo
-- because the existing table is public.profiles.

BEGIN;

-- Drop existing foreign key constraints (names auto-generated earlier)
ALTER TABLE public.item_requests
  DROP CONSTRAINT IF EXISTS item_requests_requester_id_fkey,
  DROP CONSTRAINT IF EXISTS item_requests_owner_id_fkey;

-- Re-add constraints pointing to profiles(user_id)
ALTER TABLE public.item_requests
  ADD CONSTRAINT item_requests_requester_id_fkey
    FOREIGN KEY (requester_id)
    REFERENCES public.profiles(user_id)
    ON DELETE CASCADE,
  ADD CONSTRAINT item_requests_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.profiles(user_id)
    ON DELETE CASCADE;

-- (Optional) Documentation of resulting definition (unchanged columns except FK targets)
-- CREATE TABLE public.item_requests (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
--   requester_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
--   owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
--   request_type public.listing_type NOT NULL,
--   offered_price DECIMAL(10,2),
--   rental_start_date TIMESTAMPTZ,
--   rental_end_date TIMESTAMPTZ,
--   message TEXT,
--   status public.request_status DEFAULT 'pending',
--   counter_offer_price DECIMAL(10,2),
--   counter_start_date TIMESTAMPTZ,
--   counter_end_date TIMESTAMPTZ,
--   counter_message TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

COMMIT;