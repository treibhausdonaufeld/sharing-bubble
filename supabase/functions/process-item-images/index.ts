import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { jobId, userLanguage = 'en' } = await req.json();
    
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    console.log(`Processing images for job: ${jobId}`);

    // Get the processing job
    const { data: job, error: jobError } = await supabase
      .from('item_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Update job status to processing
    await supabase
      .from('item_processing_jobs')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    const originalImages = job.original_images as string[];
    const thumbnailImages: string[] = [];

    // Process each image to create thumbnails
    for (const imageUrl of originalImages) {
      console.log(`Processing image: ${imageUrl}`);
      
      try {
        // In a real implementation, you would:
        // 1. Download the original image
        // 2. Create multiple thumbnail sizes (150x150, 300x300, 600x600)
        // 3. Upload thumbnails to the thumbnail bucket
        // 4. Store thumbnail URLs
        
        // For now, we'll simulate the process
        const thumbnailUrl = imageUrl.replace('/item-images/', '/item-thumbnails/');
        thumbnailImages.push(thumbnailUrl);
        
        // Update item_images table with thumbnail info
        await supabase
          .from('item_images')
          .update({ 
            thumbnail_url: thumbnailUrl,
            is_processed: true,
            processing_metadata: {
              processed_at: new Date().toISOString(),
              thumbnail_sizes: ['150x150', '300x300', '600x600']
            }
          })
          .eq('image_url', imageUrl);
          
      } catch (imageError) {
        console.error(`Error processing image ${imageUrl}:`, imageError);
        // Continue with other images
      }
    }

    // For AI processing, we'll trigger the content generation
    // In a real implementation, this would analyze the first image
    if (originalImages.length > 0) {
      console.log('Triggering AI content generation...');
      
      // Call the AI content generation function
      const { error: aiError } = await supabase.functions.invoke('generate-item-content', {
        body: { 
          jobId,
          primaryImageUrl: originalImages[0],
          userLanguage
        }
      });

      if (aiError) {
        console.error('AI content generation error:', aiError);
      }
    }

    // Update job with thumbnail results
    await supabase
      .from('item_processing_jobs')
      .update({ 
        thumbnail_images: thumbnailImages,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`Image processing completed for job: ${jobId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId,
        thumbnailCount: thumbnailImages.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-item-images function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Image processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});