import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const paymentRequestSchema = z.object({
  amount: z.number().min(0.01).max(10000),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  description: z.string().max(500).optional(),
  booking_id: z.string().uuid().optional(),
});

// Sanitize string to prevent XSS
function sanitizeString(input: string | undefined): string | undefined {
  if (!input) return undefined;
  return input.replace(/[<>\"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and parse input with zod
    const validatedData = paymentRequestSchema.parse(body);
    const { amount, currency, description, booking_id } = validatedData;
    
    // Sanitize description
    const sanitizedDescription = sanitizeString(description);

    // Initialize Supabase with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) {
      throw new Error("Authorization header required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Processing wallet payment for user:", user.id, "Amount:", amount);

    // Check if user has sufficient balance
    const { data: walletData, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', currency.toUpperCase())
      .single();

    if (walletError) {
      console.error("Error fetching wallet:", walletError);
      throw new Error("Wallet not found");
    }

    if (!walletData || parseFloat(walletData.balance) < amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Process payment using wallet balance
    const { error: paymentError } = await supabaseClient.rpc('update_wallet_balance', {
      p_user_id: user.id,
      p_amount: -amount, // Negative for payment
      p_transaction_type: booking_id ? 'booking_payment' : 'payment',
      p_currency: currency,
      p_description: sanitizedDescription || 'Wallet payment',
      p_related_booking_id: booking_id || null
    });

    if (paymentError) {
      console.error("Error processing payment:", paymentError);
      throw paymentError;
    }

    console.log("Wallet payment processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment processed successfully",
        amount: amount,
        currency: currency.toUpperCase()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing wallet payment:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Validation error", 
          details: error.errors 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});