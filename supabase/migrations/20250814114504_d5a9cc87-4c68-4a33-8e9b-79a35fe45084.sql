-- Create table for tracking item processing jobs
CREATE TABLE public.item_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  original_images JSONB DEFAULT '[]'::jsonb,
  thumbnail_images JSONB DEFAULT '[]'::jsonb,
  ai_generated_title TEXT,
  ai_generated_description TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add thumbnail and processing metadata to item_images
ALTER TABLE public.item_images 
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN is_processed BOOLEAN DEFAULT false,
ADD COLUMN processing_metadata JSONB;

-- Enable RLS for item_processing_jobs
ALTER TABLE public.item_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for item_processing_jobs
CREATE POLICY "Users can view processing jobs for items they own" 
ON public.item_processing_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_processing_jobs.item_id 
    AND is_item_owner(items.id, auth.uid())
  )
);

CREATE POLICY "Users can create processing jobs for items they own" 
ON public.item_processing_jobs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_processing_jobs.item_id 
    AND is_item_owner(items.id, auth.uid())
  )
);

CREATE POLICY "Users can update processing jobs for items they own" 
ON public.item_processing_jobs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_processing_jobs.item_id 
    AND is_item_owner(items.id, auth.uid())
  )
);

-- Create storage buckets for thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-thumbnails', 'item-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for item-thumbnails bucket
CREATE POLICY "Users can view thumbnail images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'item-thumbnails');

CREATE POLICY "System can upload thumbnail images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'item-thumbnails');

CREATE POLICY "System can update thumbnail images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'item-thumbnails');

-- Create trigger to update updated_at column
CREATE TRIGGER update_item_processing_jobs_updated_at
  BEFORE UPDATE ON public.item_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();