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
    
    const { jobId, primaryImageUrl } = await req.json();
    
    if (!jobId || !primaryImageUrl) {
      throw new Error('Job ID and primary image URL are required');
    }

    console.log(`Generating AI content for job: ${jobId} with image: ${primaryImageUrl}`);

    // Get the processing job
    const { data: job, error: jobError } = await supabase
      .from('item_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Simulate AI content generation
    // In a real implementation, this would:
    // 1. Download the image from the URL
    // 2. Send it to an LLM vision API (OpenAI GPT-4 Vision, Claude 3, etc.)
    // 3. Get back a structured response with title and description
    
    console.log('Simulating AI analysis of image...');
    
    // Wait a bit to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock AI content based on common item patterns
    const aiGeneratedTitle = generateMockTitle();
    const aiGeneratedDescription = generateMockDescription();
    
    console.log(`Generated title: ${aiGeneratedTitle}`);
    console.log(`Generated description: ${aiGeneratedDescription}`);

    // Update the job with AI-generated content
    await supabase
      .from('item_processing_jobs')
      .update({ 
        ai_generated_title: aiGeneratedTitle,
        ai_generated_description: aiGeneratedDescription,
        status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`AI content generation completed for job: ${jobId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId,
        aiGeneratedTitle,
        aiGeneratedDescription
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-item-content function:', error);
    
    // Update job status to failed
    if (req.body) {
      try {
        const { jobId } = await req.json();
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        
        await supabase
          .from('item_processing_jobs')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'AI content generation failed',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('Error updating job status:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'AI content generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});

// Mock AI content generation functions
// In production, these would be replaced with actual LLM API calls
function generateMockTitle(): string {
  const adjectives = ['Beautiful', 'Excellent', 'Quality', 'Stunning', 'Premium', 'Vintage', 'Modern', 'Stylish'];
  const items = ['Item', 'Product', 'Piece', 'Find', 'Treasure', 'Gem'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const item = items[Math.floor(Math.random() * items.length)];
  
  return `${adjective} ${item}`;
}

function generateMockDescription(): string {
  const descriptions = [
    'A wonderful item in excellent condition. Perfect for anyone looking for quality and style.',
    'This beautiful piece shows great craftsmanship and attention to detail. Ideal for both practical use and decoration.',
    'High-quality item that has been well-maintained. Features excellent design and functionality.',
    'Stunning piece that would make a great addition to any collection. Shows minimal wear and excellent care.',
    'Premium quality item with beautiful finish. Perfect condition and ready for a new home.'
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}