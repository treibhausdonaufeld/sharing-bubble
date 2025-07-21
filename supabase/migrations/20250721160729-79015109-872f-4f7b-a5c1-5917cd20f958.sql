
-- Create request_type enum for buy/rent requests
CREATE TYPE public.request_type AS ENUM ('buy', 'rent');

-- Update item_requests table to use proper request_type instead of listing_type
ALTER TABLE public.item_requests 
DROP COLUMN request_type,
ADD COLUMN request_type public.request_type NOT NULL DEFAULT 'buy';

-- Enable real-time for item_requests table
ALTER TABLE public.item_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_requests;

-- Enable real-time for messages table (if not already enabled)
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add indexes for better performance on request queries
CREATE INDEX IF NOT EXISTS idx_item_requests_item_id ON public.item_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_item_requests_owner_id ON public.item_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_item_requests_requester_id ON public.item_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_item_requests_status ON public.item_requests(status);

-- Add indexes for message queries by item_id
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON public.messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON public.messages(request_id);
