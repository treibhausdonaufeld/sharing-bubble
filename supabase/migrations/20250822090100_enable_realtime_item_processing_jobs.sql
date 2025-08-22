-- Enable realtime for item_processing_jobs
-- Adds the table to the supabase_realtime publication and ensures updates emit full row data

ALTER TABLE public.item_processing_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_processing_jobs;
