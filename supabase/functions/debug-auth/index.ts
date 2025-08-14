import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    )

    // Test auth context
    const authDebug = await supabaseClient.rpc('debug_auth_context')
    
    // Try to create a test item to see what happens
    const testInsert = await supabaseClient
      .from('items')
      .insert({
        title: 'DEBUG TEST ITEM',
        user_id: 'test-user-id',
        category: 'other',
        condition: 'used',
        listing_type: 'sell',
        status: 'draft'
      })
      .select()

    return new Response(
      JSON.stringify({
        authDebug,
        testInsert: testInsert.error ? { error: testInsert.error } : { success: true, data: testInsert.data }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Debug auth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})