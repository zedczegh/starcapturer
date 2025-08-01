import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { amount, currency = 'usd', payment_method_id } = await req.json();
    
    // Validate required inputs
    if (!amount || !payment_method_id) {
      throw new Error("Missing required fields: amount and payment_method_id");
    }
    
    // Validate amount (min $1, max $10,000)
    if (typeof amount !== 'number' || amount < 1 || amount > 10000) {
      throw new Error("Amount must be between $1 and $10,000");
    }
    
    // Validate currency
    const allowedCurrencies = ['usd', 'eur', 'gbp'];
    if (!allowedCurrencies.includes(currency.toLowerCase())) {
      throw new Error("Unsupported currency");
    }
    
    // Validate payment method ID format (Stripe format: pm_xxx)
    if (typeof payment_method_id !== 'string' || !payment_method_id.startsWith('pm_')) {
      throw new Error("Invalid payment method ID format");
    }
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Processing wallet top-up for user:", user.id, "Amount:", amount);

    // Rate limiting: Check recent transactions (max 5 transactions per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentTransactions, error: recentError } = await supabaseClient
      .from('wallet_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'topup')
      .gte('created_at', oneHourAgo);

    if (recentError) {
      console.error("Error checking rate limit:", recentError);
    } else if (recentTransactions && recentTransactions.length >= 5) {
      throw new Error("Rate limit exceeded. Maximum 5 top-ups per hour allowed.");
    }

    // Get customer ID from Stripe
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      throw new Error("Customer not found");
    }

    const customerId = customers.data[0].id;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method: payment_method_id,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${req.headers.get("origin")}/profile`,
      metadata: {
        type: 'wallet_topup',
        user_id: user.id
      }
    });

    console.log("Payment intent created:", paymentIntent.id);

    if (paymentIntent.status === 'succeeded') {
      // Update wallet balance
      const { error: walletError } = await supabaseClient.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: amount,
        p_transaction_type: 'topup',
        p_currency: currency.toUpperCase(),
        p_description: 'Wallet top-up via Stripe',
        p_stripe_payment_intent_id: paymentIntent.id
      });

      if (walletError) {
        console.error("Error updating wallet:", walletError);
        throw walletError;
      }

      console.log("Wallet updated successfully");
    }

    return new Response(
      JSON.stringify({
        payment_intent: paymentIntent,
        requires_action: paymentIntent.status === 'requires_action',
        client_secret: paymentIntent.client_secret
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing wallet top-up:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});