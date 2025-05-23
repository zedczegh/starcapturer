
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Get the request body
    const { function: functionName, params } = await req.json();
    
    console.log(`Calling function ${functionName} with params:`, params);
    
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Call the specified RPC function with parameters
    const { data, error } = await supabaseClient.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling function ${functionName}:`, error);
      
      // Create a more user-friendly error message
      let errorMessage = error.message;
      if (error.message.includes("pets_policy")) {
        errorMessage = "The pets policy parameter is missing. Please ensure you're using the latest version of the form.";
      } else if (error.message.includes("Could not find the function")) {
        errorMessage = "Function not found. Please check if the database functions are properly set up.";
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Function ${functionName} executed successfully:`, data);
    
    // Return successful response
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
