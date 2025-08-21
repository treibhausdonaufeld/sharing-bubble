import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Thumbnail config and helpers
const THUMBNAIL_SIZES = [150, 300, 600] as const;

async function ensurePublicBucket(supabase: SupabaseClient, bucket: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = Array.isArray(buckets) && (buckets as { name: string }[]).some((b) => b.name === bucket);
    if (!exists) {
      await supabase.storage.createBucket(bucket, { public: true });
    }
  } catch (_) {
    // ignore if bucket exists or cannot be listed/created
  }
}

serve(async (req: Request): Promise<Response> => {
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

    // Ensure thumbnails bucket exists
    await ensurePublicBucket(supabase, 'item-thumbnails');

    const originalImages = job.original_images as string[];
    const thumbnailImages: string[] = [];

    // Helper to parse storage path
    const parseStoragePath = (imageUrl: string): { bucket: string; path: string } => {
      try {
        const u = new URL(imageUrl);
        const marker = '/storage/v1/object/public/';
        const idx = u.pathname.indexOf(marker);
        if (idx !== -1) {
          const after = u.pathname.substring(idx + marker.length);
          const [bucket, ...rest] = after.split('/');
          const path = decodeURIComponent(rest.join('/'));
          return { bucket, path };
        }
      } catch {
        // not a full URL, fall through
      }
      const trimmed = imageUrl.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
      const [bucket, ...rest] = trimmed.split('/');
      return { bucket, path: rest.join('/') };
    };

    // Map content-type to extension
    const extFromContentType = (ct: string | null): string => {
      const c = (ct || '').toLowerCase();
      if (c.includes('png')) return 'png';
      if (c.includes('webp')) return 'webp';
      if (c.includes('gif')) return 'gif';
      return 'jpg';
    };

    // Process each image to create thumbnails
    for (const imageUrl of originalImages) {
      console.log(`Processing image: ${imageUrl}`);
      
      try {
        // Parse bucket/path from the URL
        const { bucket, path } = parseStoragePath(imageUrl);
        const pathNoExt = path.replace(/\.[^/.]+$/, '');

        const thumbUrls: Record<string, string> = {};

        for (const size of THUMBNAIL_SIZES) {
          // Use Storage image transformation to generate width-constrained thumbnails, preserving aspect ratio
          let transformedUrl: string | null = null;

          const { data: signed, error: signErr } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 60, {
              transform: { width: size, quality: 80 }
            });

          if (!signErr && signed?.signedUrl) {
            transformedUrl = signed.signedUrl;
          } else {
            // Fallback to public url with transform if signed failed
            const { data: pub } = supabase.storage
              .from(bucket)
              .getPublicUrl(path, {
                transform: { width: size, quality: 80 }
              });
            transformedUrl = pub?.publicUrl ?? null;
          }

          if (!transformedUrl) {
            console.warn(`Could not get transform URL for ${imageUrl} width ${size}`);
            continue;
          }

          const resp = await fetch(transformedUrl);
          if (!resp.ok) {
            console.warn(`Transform fetch failed for ${imageUrl} width ${size}: ${resp.status}`);
            continue;
          }
          const buf = await resp.arrayBuffer();
          const contentType = resp.headers.get('content-type') ?? 'image/jpeg';
          const uploadExt = extFromContentType(contentType);
          const uploadPath = `${pathNoExt}_thumb_${size}.${uploadExt}`;

          const { error: uploadError } = await supabase.storage
            .from('item-thumbnails')
            .upload(
              uploadPath,
              new Blob([buf], { type: contentType }),
              { contentType, upsert: true }
            );

          if (uploadError) {
            console.error(`Upload error for width ${size}:`, uploadError);
            continue;
          }

          const { data: pubThumb } = await supabase.storage
            .from('item-thumbnails')
            .getPublicUrl(uploadPath);

          if (pubThumb?.publicUrl) {
            thumbUrls[String(size)] = pubThumb.publicUrl;
          }
        }

        const primaryThumbnailUrl = thumbUrls['300'] ?? thumbUrls['600'] ?? thumbUrls['150'] ?? null;
        if (primaryThumbnailUrl) {
          thumbnailImages.push(primaryThumbnailUrl);
        }
        
        // Update item_images table with thumbnail info
        await supabase
          .from('item_images')
          .update({ 
            thumbnail_url: primaryThumbnailUrl,
            is_processed: true,
            processing_metadata: {
              processed_at: new Date().toISOString(),
              thumbnail_sizes: THUMBNAIL_SIZES.map((s) => `${s}w`),
              thumbnail_urls: thumbUrls
            }
          })
          .eq('image_url', imageUrl);
          
      } catch (imageError) {
        console.error(`Error processing image ${imageUrl}:`, imageError);
        // Continue with other images
      }
    }

    // For AI processing, we'll trigger the content generation
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