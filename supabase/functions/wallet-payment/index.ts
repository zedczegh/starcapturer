import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'USD', description, booking_id } = await req.json();
    
    // Validate required inputs
    if (!amount) {
      throw new Error("Missing required field: amount");
    }
    
    // Validate amount (min $0.01, max $10,000)
    if (typeof amount !== 'number' || amount < 0.01 || amount > 10000) {
      throw new Error("Amount must be between $0.01 and $10,000");
    }
    
    // Validate currency
    const allowedCurrencies = ['USD', 'EUR', 'GBP'];
    if (!allowedCurrencies.includes(currency.toUpperCase())) {
      throw new Error("Unsupported currency");
    }
    
    // Validate booking_id if provided
    if (booking_id && typeof booking_id !== 'string') {
      throw new Error("Invalid booking_id format");
    }

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
      p_currency: currency.toUpperCase(),
      p_description: description || 'Wallet payment',
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});