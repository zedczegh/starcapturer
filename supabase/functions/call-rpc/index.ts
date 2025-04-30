
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  function: string;
  params: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authorization } },
      }
    );

    // Get request body
    const body: RequestBody = await req.json();

    const { function: functionName, params } = body;
    let result;

    console.log(`Calling RPC function: ${functionName}`);
    console.log(`With params:`, params);

    // Call the appropriate function
    switch (functionName) {
      case 'insert_astro_spot_timeslot':
        result = await supabase.rpc('insert_astro_spot_timeslot', params);
        break;
      case 'update_astro_spot_timeslot':
        result = await supabase.rpc('update_astro_spot_timeslot', params);
        break;
      case 'insert_astro_spot_reservation':
        result = await supabase.rpc('insert_astro_spot_reservation', params);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Function not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    if (result.error) {
      console.error(`Error calling ${functionName}:`, result.error);
      return new Response(JSON.stringify({ error: result.error.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ data: result.data }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
